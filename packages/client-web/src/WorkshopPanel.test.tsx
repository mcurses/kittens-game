import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { InspectorProvider } from "./InspectorContext.js";
import { InspectorPanel } from "./InspectorPanel.js";
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

describe("WorkshopPanel", () => {
  it("shows loading placeholder when state is null", () => {
    render(<WithInspector><WorkshopPanel state={null} /></WithInspector>);
    expect(screen.getByTestId("workshop-panel-loading")).toBeTruthy();
  });

  it("shows loading placeholder when state is undefined", () => {
    render(<WithInspector><WorkshopPanel state={undefined} /></WithInspector>);
    expect(screen.getByTestId("workshop-panel-loading")).toBeTruthy();
  });

  it("shows no upgrades message when upgrades is empty", () => {
    render(<WithInspector><WorkshopPanel state={makeState({})} /></WithInspector>);
    expect(screen.getByText("No upgrades available.")).toBeTruthy();
  });

  it("hides upgrades that are not unlocked", () => {
    const state = makeState({
      workshop: { unlocked: false, researched: false },
      mineralHoes: { unlocked: true, researched: false },
    });
    render(<WithInspector><WorkshopPanel state={state} /></WithInspector>);
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
    render(<WithInspector><WorkshopPanel state={state} /></WithInspector>);
    expect(screen.getByTestId("upgrade-mineralHoes")).toBeTruthy();
    expect(screen.getByRole("button", { name: /purchase/i })).toBeTruthy();
  });

  it("shows purchased upgrade as Done", () => {
    const state = makeState({ mineralHoes: { unlocked: true, researched: true } });
    render(<WithInspector><WorkshopPanel state={state} /></WithInspector>);
    expect(screen.queryByRole("button", { name: /purchase/i })).toBeNull();
    expect(screen.getByText(/done/i)).toBeTruthy();
  });

  it("dispatches PURCHASE_UPGRADE when Purchase is clicked", () => {
    const state = makeState(
      { mineralHoes: { unlocked: true, researched: false } },
      {},
      { minerals: { value: 500 }, science: { value: 200 } },
    );
    render(<WithInspector><WorkshopPanel state={state} /></WithInspector>);
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
    render(<WithInspector><WorkshopPanel state={state} /></WithInspector>);
    // button should include cost info (275 minerals)
    expect(screen.getByText(/275/)).toBeTruthy();
  });

  it("disables Purchase button when player cannot afford upgrade", () => {
    const state = makeState(
      { mineralHoes: { unlocked: true, researched: false } },
      {},
      { minerals: { value: 0 }, science: { value: 0 } },
    );
    render(<WithInspector><WorkshopPanel state={state} /></WithInspector>);
    const btn = screen.getByRole("button", { name: /purchase/i });
    expect(btn.hasAttribute("disabled")).toBe(true);
  });

  it("enables Purchase button when player can afford upgrade", () => {
    const state = makeState(
      { mineralHoes: { unlocked: true, researched: false } },
      {},
      { minerals: { value: 500 }, science: { value: 200 } },
    );
    render(<WithInspector><WorkshopPanel state={state} /></WithInspector>);
    const btn = screen.getByRole("button", { name: /purchase/i });
    expect(btn.hasAttribute("disabled")).toBe(false);
  });

  it("renders unlocked crafts with Craft button", () => {
    const state = makeState({}, { beam: { unlocked: true }, slab: { unlocked: false } });
    render(<WithInspector><WorkshopPanel state={state} /></WithInspector>);
    expect(screen.getByTestId("craft-beam")).toBeTruthy();
    expect(screen.queryByTestId("craft-slab")).toBeNull();
  });

  it("dispatches CRAFT with amount:1 when Craft ×1 is clicked", () => {
    const state = makeState({}, { beam: { unlocked: true } });
    render(<WithInspector><WorkshopPanel state={state} /></WithInspector>);
    // Use exact text "×1" to avoid matching ×100
    fireEvent.click(screen.getByText("×1", { exact: true }));
    expect(mockMutate).toHaveBeenCalledWith({ type: "CRAFT", name: "beam", amount: 1 });
  });

  it("dispatches CRAFT with All-count when All is clicked", () => {
    // beam costs 175 wood each; 350 wood → craftAll=2
    const state = makeState({}, { beam: { unlocked: true } }, { wood: { value: 350 } });
    render(<WithInspector><WorkshopPanel state={state} /></WithInspector>);
    fireEvent.click(screen.getByTestId("craft-beam-all"));
    expect(mockMutate).toHaveBeenCalledWith({ type: "CRAFT", name: "beam", amount: 2 });
  });

  it("dispatches CRAFT with amount:25 when Craft ×25 is clicked", () => {
    const state = makeState({}, { beam: { unlocked: true } });
    render(<WithInspector><WorkshopPanel state={state} /></WithInspector>);
    fireEvent.click(screen.getByText("×25", { exact: true }));
    expect(mockMutate).toHaveBeenCalledWith({ type: "CRAFT", name: "beam", amount: 25 });
  });

  it("dispatches CRAFT with amount:100 when Craft ×100 is clicked", () => {
    const state = makeState({}, { beam: { unlocked: true } });
    render(<WithInspector><WorkshopPanel state={state} /></WithInspector>);
    fireEvent.click(screen.getByText("×100", { exact: true }));
    expect(mockMutate).toHaveBeenCalledWith({ type: "CRAFT", name: "beam", amount: 100 });
  });
});

// ── Story 35-01: Workshop craft shortcut parity ──────────────────────────────

describe("Story 35-01: Workshop craft shortcut parity", () => {
  it("shows All button for each craft", () => {
    const state = makeState({}, { beam: { unlocked: true } });
    render(<WithInspector><WorkshopPanel state={state} /></WithInspector>);
    expect(screen.getByTestId("craft-beam-all")).toBeTruthy();
    expect(screen.getByTestId("craft-beam-all").textContent).toBe("All");
  });

  it("craft s1 adapts to available resources (beam: 1% of max batches, min 1)", () => {
    // 175000 wood → 1000 beams; s1=max(1,10)=10
    const state = makeState({}, { beam: { unlocked: true } }, { wood: { value: 175000 } });
    render(<WithInspector><WorkshopPanel state={state} /></WithInspector>);
    expect(screen.getByTestId("craft-beam-s1").textContent).toBe("×10");
  });

  it("craft s1 defaults to 1 when resources are 0", () => {
    const state = makeState({}, { beam: { unlocked: true } });
    render(<WithInspector><WorkshopPanel state={state} /></WithInspector>);
    expect(screen.getByTestId("craft-beam-s1").textContent).toBe("×1");
  });

  it("All button dispatches with craftAllCount", () => {
    // 350 wood → 2 beams
    const state = makeState({}, { beam: { unlocked: true } }, { wood: { value: 350 } });
    render(<WithInspector><WorkshopPanel state={state} /></WithInspector>);
    fireEvent.click(screen.getByTestId("craft-beam-all"));
    expect(mockMutate).toHaveBeenCalledWith({ type: "CRAFT", name: "beam", amount: 2 });
  });

  it("shows craft effectiveness when craftRatio is present in state", () => {
    const state = {
      ...makeState({}, { beam: { unlocked: true } }),
      effectCache: { craftRatio: 0.3 },
    } as unknown as import("@kittens/api-spec").GameStateResponse;
    render(<WithInspector><WorkshopPanel state={state} /></WithInspector>);
    expect(screen.getByTestId("craft-effectiveness")).toBeTruthy();
    expect(screen.getByTestId("craft-effectiveness").textContent).toMatch(/30%/);
  });

  it("does not show craft effectiveness when craftRatio is 0 or absent", () => {
    const state = makeState({}, { beam: { unlocked: true } });
    render(<WithInspector><WorkshopPanel state={state} /></WithInspector>);
    expect(screen.queryByTestId("craft-effectiveness")).toBeNull();
  });
});

// ── Story 35-03: Hide-complete toggles ───────────────────────────────────────

describe("Story 35-03: Workshop hide-researched toggle", () => {
  it("shows hide-researched checkbox", () => {
    const state = makeState({ mineralHoes: { unlocked: true, researched: false } });
    render(<WithInspector><WorkshopPanel state={state} /></WithInspector>);
    expect(screen.getByTestId("workshop-hide-researched")).toBeTruthy();
  });

  it("hide-researched toggle hides researched upgrades when checked", () => {
    const state = makeState({
      mineralHoes: { unlocked: true, researched: true },
      ironHoes: { unlocked: true, researched: false },
    });
    render(<WithInspector><WorkshopPanel state={state} /></WithInspector>);
    // Initially shows both
    expect(screen.getByTestId("upgrade-mineralHoes")).toBeTruthy();
    // Check the toggle
    fireEvent.click(screen.getByTestId("workshop-hide-researched"));
    // mineralHoes is now hidden (researched); ironHoes still visible
    expect(screen.queryByTestId("upgrade-mineralHoes")).toBeNull();
    expect(screen.getByTestId("upgrade-ironHoes")).toBeTruthy();
  });

  it("hide-researched toggle shows all when unchecked", () => {
    const state = makeState({
      mineralHoes: { unlocked: true, researched: true },
    });
    render(<WithInspector><WorkshopPanel state={state} /></WithInspector>);
    const toggle = screen.getByTestId("workshop-hide-researched");
    fireEvent.click(toggle); // hide
    fireEvent.click(toggle); // show again
    expect(screen.getByTestId("upgrade-mineralHoes")).toBeTruthy();
  });
});
