import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WorkshopPanel } from "./WorkshopPanel.js";

const mockMutate = vi.fn();
vi.mock("./useGameAction.js", () => ({
  useGameAction: () => ({ mutate: mockMutate, isPending: false, error: null }),
}));

function makeState(
  upgrades: Record<string, { unlocked: boolean; researched: boolean }>,
  crafts: Record<string, { unlocked: boolean }> = {},
  resources: Record<string, { value: number }> = {},
) {
  return {
    version: 1,
    tick: 0,
    workshop: { upgrades, crafts },
    resources: Object.fromEntries(Object.entries(resources).map(([k, v]) => [k, { value: v.value, maxValue: 0, perTick: 0 }])),
  } as unknown as import("@kittens/api-spec").GameStateResponse;
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("WorkshopPanel", () => {
  it("shows loading placeholder when state is null", () => {
    render(<WorkshopPanel state={null} />);
    expect(screen.getByTestId("workshop-panel-loading")).toBeTruthy();
  });

  it("shows loading placeholder when state is undefined", () => {
    render(<WorkshopPanel state={undefined} />);
    expect(screen.getByTestId("workshop-panel-loading")).toBeTruthy();
  });

  it("shows no upgrades message when upgrades is empty", () => {
    render(<WorkshopPanel state={makeState({})} />);
    expect(screen.getByText("No upgrades available.")).toBeTruthy();
  });

  it("hides upgrades that are not unlocked", () => {
    const state = makeState({
      workshop: { unlocked: false, researched: false },
      mineralHoes: { unlocked: true, researched: false },
    });
    render(<WorkshopPanel state={state} />);
    expect(screen.queryByTestId("upgrade-workshop")).toBeNull();
    expect(screen.getByTestId("upgrade-mineralHoes")).toBeTruthy();
  });

  it("shows unlocked unresearched upgrade with Purchase button", () => {
    // mineralHoes costs 275 minerals + 100 science; provide enough
    const state = makeState(
      { mineralHoes: { unlocked: true, researched: false } },
      {},
      { minerals: { value: 500 }, science: { value: 200 } },
    );
    render(<WorkshopPanel state={state} />);
    expect(screen.getByTestId("upgrade-mineralHoes")).toBeTruthy();
    expect(screen.getByRole("button", { name: /purchase/i })).toBeTruthy();
  });

  it("shows purchased upgrade as Done", () => {
    const state = makeState({ mineralHoes: { unlocked: true, researched: true } });
    render(<WorkshopPanel state={state} />);
    expect(screen.queryByRole("button", { name: /purchase/i })).toBeNull();
    expect(screen.getByText(/done/i)).toBeTruthy();
  });

  it("dispatches PURCHASE_UPGRADE when Purchase is clicked", () => {
    const state = makeState(
      { mineralHoes: { unlocked: true, researched: false } },
      {},
      { minerals: { value: 500 }, science: { value: 200 } },
    );
    render(<WorkshopPanel state={state} />);
    fireEvent.click(screen.getByRole("button", { name: /purchase/i }));
    expect(mockMutate).toHaveBeenCalledWith({ type: "PURCHASE_UPGRADE", name: "mineralHoes" });
  });

  // Story 25-4: cost display and disable when can't afford
  it("shows upgrade price in Purchase button", () => {
    const state = makeState(
      { mineralHoes: { unlocked: true, researched: false } },
      {},
      { minerals: { value: 500 }, science: { value: 200 } },
    );
    render(<WorkshopPanel state={state} />);
    // button should include cost info (275 minerals)
    expect(screen.getByText(/275/)).toBeTruthy();
  });

  it("disables Purchase button when player cannot afford upgrade", () => {
    const state = makeState(
      { mineralHoes: { unlocked: true, researched: false } },
      {},
      { minerals: { value: 0 }, science: { value: 0 } },
    );
    render(<WorkshopPanel state={state} />);
    const btn = screen.getByRole("button", { name: /purchase/i });
    expect(btn.hasAttribute("disabled")).toBe(true);
  });

  it("enables Purchase button when player can afford upgrade", () => {
    const state = makeState(
      { mineralHoes: { unlocked: true, researched: false } },
      {},
      { minerals: { value: 500 }, science: { value: 200 } },
    );
    render(<WorkshopPanel state={state} />);
    const btn = screen.getByRole("button", { name: /purchase/i });
    expect(btn.hasAttribute("disabled")).toBe(false);
  });

  it("renders unlocked crafts with Craft button", () => {
    const state = makeState({}, { beam: { unlocked: true }, slab: { unlocked: false } });
    render(<WorkshopPanel state={state} />);
    expect(screen.getByTestId("craft-beam")).toBeTruthy();
    expect(screen.queryByTestId("craft-slab")).toBeNull();
  });

  it("dispatches CRAFT action when Craft is clicked", () => {
    const state = makeState({}, { beam: { unlocked: true } });
    render(<WorkshopPanel state={state} />);
    fireEvent.click(screen.getByRole("button", { name: /craft/i }));
    expect(mockMutate).toHaveBeenCalledWith({ type: "CRAFT", name: "beam", amount: 1 });
  });
});
