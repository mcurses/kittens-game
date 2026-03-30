import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { InspectorProvider } from "./InspectorContext.js";
import { InspectorPanel } from "./InspectorPanel.js";
import { BuildingsPanel } from "./BuildingsPanel.js";

// Mock useGameAction
const mockMutate = vi.fn();
vi.mock("./useGameAction.js", () => ({
  useGameAction: () => ({ mutate: mockMutate, isPending: false, error: null }),
}));

// Mock BUILDING_DEFS and getBuildingPrice from @kittens/engine
vi.mock("@kittens/engine", () => ({
  BUILDING_DEFS: [
    {
      name: "field",
      prices: [{ name: "catnip", val: 10 }],
      priceRatio: 1.12,
      effects: {},
    },
    {
      name: "hut",
      prices: [{ name: "wood", val: 5 }],
      priceRatio: 2.5,
      effects: {},
    },
    {
      name: "pasture",
      prices: [
        { name: "catnip", val: 100 },
        { name: "wood", val: 10 },
      ],
      priceRatio: 1.15,
      effects: {},
    },
  ],
  // getBuildingPrice returns base prices unchanged for test simplicity
  getBuildingPrice: (def: { prices: readonly { name: string; val: number }[] }) => def.prices,
}));

function makeState(
  buildings: Record<string, { val: number; on: number; unlocked?: boolean }>,
  resources?: Record<string, { value: number; maxValue: number }>,
) {
  return {
    version: 1,
    tick: 0,
    buildings,
    resources: resources ?? {},
  } as unknown as import("@kittens/api-spec").GameStateResponse;
}

function WithInspector({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <InspectorProvider>
      {children}
      <InspectorPanel />
    </InspectorProvider>
  );
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("BuildingsPanel", () => {
  it("shows loading placeholder when state is null", () => {
    render(<WithInspector><BuildingsPanel state={null} /></WithInspector>);
    expect(screen.getByTestId("buildings-panel-loading")).toBeTruthy();
  });

  it("shows loading placeholder when state is undefined", () => {
    render(<WithInspector><BuildingsPanel state={undefined} /></WithInspector>);
    expect(screen.getByTestId("buildings-panel-loading")).toBeTruthy();
  });

  it("shows no buildings message when buildings object is empty", () => {
    render(<WithInspector><BuildingsPanel state={makeState({})} /></WithInspector>);
    expect(screen.getByText("No buildings available.")).toBeTruthy();
  });

  it("shows unlocked buildings with val === 0 (not yet purchased)", () => {
    const state = makeState({ field: { val: 0, on: 0, unlocked: true }, hut: { val: 1, on: 1, unlocked: true } });
    render(<WithInspector><BuildingsPanel state={state} /></WithInspector>);
    expect(screen.getByTestId("building-field")).toBeTruthy();
    expect(screen.getByTestId("building-hut")).toBeTruthy();
  });

  it("hides locked buildings (unlocked=false)", () => {
    const state = makeState({ field: { val: 0, on: 0, unlocked: false } });
    render(<WithInspector><BuildingsPanel state={state} /></WithInspector>);
    expect(screen.getByText("No buildings available.")).toBeTruthy();
  });

  it("renders building name and count for unlocked building", () => {
    const state = makeState({ field: { val: 3, on: 3, unlocked: true } });
    render(<WithInspector><BuildingsPanel state={state} /></WithInspector>);
    expect(screen.getByTestId("building-field")).toBeTruthy();
    expect(screen.getByText(/field/)).toBeTruthy();
    expect(screen.getByText(/3/)).toBeTruthy();
  });

  it("renders building prices from BUILDING_DEFS", () => {
    const state = makeState({ field: { val: 1, on: 1, unlocked: true } });
    render(<WithInspector><BuildingsPanel state={state} /></WithInspector>);
    expect(screen.getByText(/catnip/)).toBeTruthy();
    expect(screen.getByText(/10/)).toBeTruthy();
  });

  it("renders multiple prices for a building", () => {
    const state = makeState({ pasture: { val: 2, on: 2, unlocked: true } });
    render(<WithInspector><BuildingsPanel state={state} /></WithInspector>);
    expect(screen.getByText(/catnip/)).toBeTruthy();
    expect(screen.getByText(/wood/)).toBeTruthy();
  });

  it("renders a Buy button for each unlocked building", () => {
    const state = makeState({ field: { val: 1, on: 1, unlocked: true }, hut: { val: 2, on: 2, unlocked: true } });
    render(<WithInspector><BuildingsPanel state={state} /></WithInspector>);
    const buyButtons = screen.getAllByRole("button", { name: /buy/i });
    expect(buyButtons.length).toBe(2);
  });

  it("dispatches BUY_BUILDING action when Buy is clicked", () => {
    const state = makeState(
      { field: { val: 0, on: 0, unlocked: true } },
      { catnip: { value: 100, maxValue: 0 } },
    );
    render(<WithInspector><BuildingsPanel state={state} /></WithInspector>);
    const buyButton = screen.getByRole("button", { name: /buy/i });
    fireEvent.click(buyButton);
    expect(mockMutate).toHaveBeenCalledWith({ type: "BUY_BUILDING", name: "field" });
  });

  it("disables Buy button when player cannot afford the building", () => {
    const state = makeState(
      { field: { val: 0, on: 0, unlocked: true } },
      { catnip: { value: 5, maxValue: 0 } }, // need 10, only have 5
    );
    render(<WithInspector><BuildingsPanel state={state} /></WithInspector>);
    const buyButton = screen.getByRole("button", { name: /buy/i });
    expect(buyButton.hasAttribute("disabled")).toBe(true);
  });

  it("enables Buy button when player can afford the building", () => {
    const state = makeState(
      { field: { val: 0, on: 0, unlocked: true } },
      { catnip: { value: 50, maxValue: 0 } }, // need 10, have 50
    );
    render(<WithInspector><BuildingsPanel state={state} /></WithInspector>);
    const buyButton = screen.getByRole("button", { name: /buy/i });
    expect(buyButton.hasAttribute("disabled")).toBe(false);
  });

  it("shows only unlocked buildings, hides locked ones", () => {
    const state = makeState({
      field: { val: 5, on: 5, unlocked: true },
      hut: { val: 2, on: 2, unlocked: true },
      pasture: { val: 0, on: 0, unlocked: false }, // locked — should NOT appear
    });
    render(<WithInspector><BuildingsPanel state={state} /></WithInspector>);
    expect(screen.getByTestId("building-field")).toBeTruthy();
    expect(screen.getByTestId("building-hut")).toBeTruthy();
    expect(screen.queryByTestId("building-pasture")).toBeNull();
  });

  it("shows building details in inspector on hover", async () => {
    const state = makeState({ field: { val: 2, on: 2, unlocked: true } });
    const userEvent = (await import("@testing-library/user-event")).default;
    render(<WithInspector><BuildingsPanel state={state} /></WithInspector>);
    await userEvent.hover(screen.getByTestId("building-field"));
    expect(screen.getByTestId("inspector-panel")).toBeTruthy();
    // Inspector should show entity name
    expect(screen.getAllByText(/field/).length).toBeGreaterThan(0);
  });
});
