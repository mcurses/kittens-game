import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BuildingsPanel } from "./BuildingsPanel.js";

// Mock useGameAction
const mockMutate = vi.fn();
vi.mock("./useGameAction.js", () => ({
  useGameAction: () => ({ mutate: mockMutate, isPending: false, error: null }),
}));

// Mock BUILDING_DEFS from @kittens/engine so tests don't depend on full engine
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
}));

function makeState(
  buildings: Record<string, { val: number; on: number }>,
) {
  return {
    version: 1,
    tick: 0,
    buildings,
  } as unknown as import("@kittens/api-spec").GameStateResponse;
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("BuildingsPanel", () => {
  it("shows loading placeholder when state is null", () => {
    render(<BuildingsPanel state={null} />);
    expect(screen.getByTestId("buildings-panel-loading")).toBeTruthy();
  });

  it("shows loading placeholder when state is undefined", () => {
    render(<BuildingsPanel state={undefined} />);
    expect(screen.getByTestId("buildings-panel-loading")).toBeTruthy();
  });

  it("shows no buildings message when buildings object is empty", () => {
    render(<BuildingsPanel state={makeState({})} />);
    expect(screen.getByText("No buildings available.")).toBeTruthy();
  });

  it("filters out buildings with val === 0 (locked)", () => {
    const state = makeState({ field: { val: 0, on: 0 }, hut: { val: 1, on: 1 } });
    render(<BuildingsPanel state={state} />);
    expect(screen.queryByTestId("building-field")).toBeNull();
    expect(screen.getByTestId("building-hut")).toBeTruthy();
  });

  it("shows no buildings when all have val === 0", () => {
    const state = makeState({ field: { val: 0, on: 0 } });
    render(<BuildingsPanel state={state} />);
    expect(screen.getByText("No buildings available.")).toBeTruthy();
  });

  it("renders building name and count for unlocked buildings", () => {
    const state = makeState({ field: { val: 3, on: 3 } });
    render(<BuildingsPanel state={state} />);
    expect(screen.getByTestId("building-field")).toBeTruthy();
    expect(screen.getByText(/field/)).toBeTruthy();
    expect(screen.getByText(/3/)).toBeTruthy();
  });

  it("renders building prices from BUILDING_DEFS", () => {
    const state = makeState({ field: { val: 1, on: 1 } });
    render(<BuildingsPanel state={state} />);
    expect(screen.getByText(/catnip/)).toBeTruthy();
    expect(screen.getByText(/10/)).toBeTruthy();
  });

  it("renders multiple prices for a building", () => {
    const state = makeState({ pasture: { val: 2, on: 2 } });
    render(<BuildingsPanel state={state} />);
    expect(screen.getByText(/catnip/)).toBeTruthy();
    expect(screen.getByText(/wood/)).toBeTruthy();
  });

  it("renders a Buy button for each unlocked building", () => {
    const state = makeState({ field: { val: 1, on: 1 }, hut: { val: 2, on: 2 } });
    render(<BuildingsPanel state={state} />);
    const buyButtons = screen.getAllByRole("button", { name: /buy/i });
    expect(buyButtons.length).toBe(2);
  });

  it("dispatches BUY_BUILDING action when Buy is clicked", () => {
    const state = makeState({ field: { val: 1, on: 1 } });
    render(<BuildingsPanel state={state} />);
    const buyButton = screen.getByRole("button", { name: /buy/i });
    fireEvent.click(buyButton);
    expect(mockMutate).toHaveBeenCalledWith({ type: "BUY_BUILDING", name: "field" });
  });

  it("renders multiple unlocked buildings", () => {
    const state = makeState({
      field: { val: 5, on: 5 },
      hut: { val: 2, on: 2 },
      pasture: { val: 0, on: 0 }, // locked — should NOT appear
    });
    render(<BuildingsPanel state={state} />);
    expect(screen.getByTestId("building-field")).toBeTruthy();
    expect(screen.getByTestId("building-hut")).toBeTruthy();
    expect(screen.queryByTestId("building-pasture")).toBeNull();
  });
});
