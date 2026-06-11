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
  resources: Record<string, { value: number; maxValue?: number }> = {},
) {
  return {
    version: 1,
    tick: 0,
    workshop: { upgrades, crafts },
    resources: Object.fromEntries(
      Object.entries(resources).map(([k, v]) => [k, { value: v.value, maxValue: v.maxValue ?? 0, perTick: 0 }]),
    ),
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
  window.localStorage.clear();
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
    expect(screen.getByRole("button", { name: /buy/i })).toBeTruthy();
  });

  it("shows purchased upgrade as Done", () => {
    const state = makeState({ mineralHoes: { unlocked: true, researched: true } });
    render(<WithInspector><WorkshopPanel state={state} /></WithInspector>);
    expect(screen.queryByRole("button", { name: /buy/i })).toBeNull();
    expect(screen.getByText(/done/i)).toBeTruthy();
  });

  it("dispatches PURCHASE_UPGRADE when Purchase is clicked", () => {
    const state = makeState(
      { mineralHoes: { unlocked: true, researched: false } },
      {},
      { minerals: { value: 500 }, science: { value: 200 } },
    );
    render(<WithInspector><WorkshopPanel state={state} /></WithInspector>);
    fireEvent.click(screen.getByRole("button", { name: /buy/i }));
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
    const btn = screen.getByRole("button", { name: /buy/i });
    expect(btn.hasAttribute("disabled")).toBe(true);
  });

  it("enables Purchase button when player can afford upgrade", () => {
    const state = makeState(
      { mineralHoes: { unlocked: true, researched: false } },
      {},
      { minerals: { value: 500 }, science: { value: 200 } },
    );
    render(<WithInspector><WorkshopPanel state={state} /></WithInspector>);
    const btn = screen.getByRole("button", { name: /buy/i });
    expect(btn.hasAttribute("disabled")).toBe(false);
  });

  it("keeps Purchase button and marks it storage-limited when upgrade cost exceeds current storage", () => {
    const state = makeState(
      { mineralHoes: { unlocked: true, researched: false } },
      {},
      { minerals: { value: 0, maxValue: 200 }, science: { value: 0, maxValue: 80 } },
    );
    render(<WithInspector><WorkshopPanel state={state} /></WithInspector>);
    const btn = screen.getByTestId("upgrade-mineralHoes-purchase");
    expect(btn.textContent).toBe("Buy");
    expect(btn.className).toMatch(/btn--limited/);
    expect(btn.hasAttribute("disabled")).toBe(true);
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

  it("restores hide-researched from localStorage on reload", () => {
    window.localStorage.setItem("workshop:hideResearched", "true");
    const state = makeState({
      mineralHoes: { unlocked: true, researched: true },
      ironHoes: { unlocked: true, researched: false },
    });
    render(<WithInspector><WorkshopPanel state={state} /></WithInspector>);
    expect(screen.getByTestId("workshop-hide-researched")).toBeTruthy();
    expect((screen.getByTestId("workshop-hide-researched") as HTMLInputElement).checked).toBe(true);
    expect(screen.queryByTestId("upgrade-mineralHoes")).toBeNull();
    expect(screen.getByTestId("upgrade-ironHoes")).toBeTruthy();
  });
});

// ── Story 47-01: Craft output preview ─────────────────────────────────────────

describe("Story 47-01: Craft output preview", () => {
  it("shows expected output in craft button title (no bonus)", () => {
    const state = makeState({}, { beam: { unlocked: true } }, { wood: { value: 350 } });
    render(<WithInspector><WorkshopPanel state={state} /></WithInspector>);
    const s1Btn = screen.getByTestId("craft-beam-s1");
    // beam has no ignoreBonuses, craftRatio=0 → output = amount × 1 = 1
    expect(s1Btn.getAttribute("title")).toBe("+1");
  });

  it("shows output with craft bonus in title", () => {
    // craftRatio=0.5 → output = 1 × 1.5 = 1.5
    const state = {
      ...makeState({}, { beam: { unlocked: true } }, { wood: { value: 350 } }),
      effectCache: { craftRatio: 0.5 },
    } as unknown as import("@kittens/api-spec").GameStateResponse;
    render(<WithInspector><WorkshopPanel state={state} /></WithInspector>);
    const s1Btn = screen.getByTestId("craft-beam-s1");
    expect(s1Btn.getAttribute("title")).toBe("+1.5");
  });

  it("All button shows total output in title", () => {
    // 350 wood → 2 beams, craftRatio=0 → output = 2
    const state = makeState({}, { beam: { unlocked: true } }, { wood: { value: 350 } });
    render(<WithInspector><WorkshopPanel state={state} /></WithInspector>);
    const allBtn = screen.getByTestId("craft-beam-all");
    expect(allBtn.getAttribute("title")).toBe("+2");
  });

  it("ignoreBonuses craft shows raw output without craft ratio", () => {
    // wood craft has ignoreBonuses=true, so even with craftRatio, output = amount
    const state = {
      ...makeState({}, { wood: { unlocked: true } }, { catnip: { value: 1000 } }),
      effectCache: { craftRatio: 0.5 },
    } as unknown as import("@kittens/api-spec").GameStateResponse;
    render(<WithInspector><WorkshopPanel state={state} /></WithInspector>);
    const s1Btn = screen.getByTestId("craft-wood-s1");
    expect(s1Btn.getAttribute("title")).toBe("+1");
  });
});

// ── Story 47-02: Craft cost tooltips in inspector ─────────────────────────────

describe("Story 47-02: Craft cost tooltips in inspector", () => {
  it("hovering a craft button shows cost breakdown in inspector", () => {
    // beam costs 175 wood per unit
    const state = makeState({}, { beam: { unlocked: true } }, { wood: { value: 350 } });
    render(<WithInspector><WorkshopPanel state={state} /></WithInspector>);
    const s1Btn = screen.getByTestId("craft-beam-s1");
    fireEvent.mouseEnter(s1Btn);
    // Inspector should show craft info with cost. The new craft row also
    // renders the cost in a subline, so scope the assertion to the inspector.
    const inspector = screen.getByTestId("inspector-panel");
    expect(inspector).toBeTruthy();
    expect(inspector.textContent).toMatch(/wood/i);
    expect(inspector.textContent).toMatch(/175/);
  });

  it("hovering craft All button shows total cost in inspector", () => {
    // beam costs 175 wood; 350 wood → all=2 → total cost = 350
    const state = makeState({}, { beam: { unlocked: true } }, { wood: { value: 350 } });
    render(<WithInspector><WorkshopPanel state={state} /></WithInspector>);
    const allBtn = screen.getByTestId("craft-beam-all");
    fireEvent.mouseEnter(allBtn);
    // Inspector shows "Craft ×2 → 2" in the kind line
    const inspector = screen.getByTestId("inspector-panel");
    expect(inspector.textContent).toMatch(/×2/);
    expect(inspector.textContent).toMatch(/wood/i);
  });

  it("inspector shows expected output amount after bonus", () => {
    const state = {
      ...makeState({}, { beam: { unlocked: true } }, { wood: { value: 350 } }),
      effectCache: { craftRatio: 0.5 },
    } as unknown as import("@kittens/api-spec").GameStateResponse;
    render(<WithInspector><WorkshopPanel state={state} /></WithInspector>);
    const s1Btn = screen.getByTestId("craft-beam-s1");
    fireEvent.mouseEnter(s1Btn);
    // Output: 1 × 1.5 = 1.5
    expect(screen.getByText(/1\.5/)).toBeTruthy();
  });
});

// ── Story 47-05: Engineer assignment UI ───────────────────────────────────────

describe("Story 47-05: Engineer assignment UI", () => {
  function makeEngineerState(
    craftEngineers: Record<string, number> = {},
    totalEngineers = 5,
    mechanization = true,
  ) {
    const crafts: Record<string, { unlocked: boolean; engineers?: number }> = {};
    for (const [name, eng] of Object.entries(craftEngineers)) {
      crafts[name] = { unlocked: true, engineers: eng };
    }
    // Add a craft with no engineers for testing
    if (!crafts.beam) crafts.beam = { unlocked: true, engineers: 0 };
    return {
      ...makeState({}, crafts as Record<string, { unlocked: boolean }>, {}),
      village: { jobs: { engineer: { value: totalEngineers } } },
      science: {
        techs: { mechanization: { unlocked: true, researched: mechanization } },
      },
    } as unknown as import("@kittens/api-spec").GameStateResponse;
  }

  it("shows engineer controls when mechanization is researched", () => {
    const state = makeEngineerState({ beam: 0 }, 5, true);
    render(<WithInspector><WorkshopPanel state={state} /></WithInspector>);
    expect(screen.getByTestId("craft-beam-engineer-add")).toBeTruthy();
    expect(screen.getByTestId("craft-beam-engineer-remove")).toBeTruthy();
  });

  it("hides engineer controls when mechanization not researched", () => {
    const state = makeEngineerState({ beam: 0 }, 5, false);
    render(<WithInspector><WorkshopPanel state={state} /></WithInspector>);
    expect(screen.queryByTestId("craft-beam-engineer-add")).toBeNull();
  });

  it("shows free engineer count", () => {
    const state = makeEngineerState({ beam: 2 }, 5, true);
    render(<WithInspector><WorkshopPanel state={state} /></WithInspector>);
    // 5 total - 2 assigned = 3 free
    expect(screen.getByTestId("free-engineers")).toBeTruthy();
    expect(screen.getByTestId("free-engineers").textContent).toMatch(/3/);
  });

  it("dispatches ASSIGN_CRAFT_ENGINEER on + click", () => {
    const state = makeEngineerState({ beam: 0 }, 5, true);
    render(<WithInspector><WorkshopPanel state={state} /></WithInspector>);
    fireEvent.click(screen.getByTestId("craft-beam-engineer-add"));
    expect(mockMutate).toHaveBeenCalledWith({ type: "ASSIGN_CRAFT_ENGINEER", name: "beam" });
  });

  it("dispatches UNASSIGN_CRAFT_ENGINEER on - click", () => {
    const state = makeEngineerState({ beam: 2 }, 5, true);
    render(<WithInspector><WorkshopPanel state={state} /></WithInspector>);
    fireEvent.click(screen.getByTestId("craft-beam-engineer-remove"));
    expect(mockMutate).toHaveBeenCalledWith({ type: "UNASSIGN_CRAFT_ENGINEER", name: "beam" });
  });

  it("disables + when no free engineers", () => {
    const state = makeEngineerState({ beam: 5 }, 5, true);
    render(<WithInspector><WorkshopPanel state={state} /></WithInspector>);
    const addBtn = screen.getByTestId("craft-beam-engineer-add");
    expect(addBtn.hasAttribute("disabled")).toBe(true);
  });

  it("disables - when 0 engineers assigned", () => {
    const state = makeEngineerState({ beam: 0 }, 5, true);
    render(<WithInspector><WorkshopPanel state={state} /></WithInspector>);
    const removeBtn = screen.getByTestId("craft-beam-engineer-remove");
    expect(removeBtn.hasAttribute("disabled")).toBe(true);
  });

  it("shows assigned engineer count on craft row", () => {
    const state = makeEngineerState({ beam: 3 }, 5, true);
    render(<WithInspector><WorkshopPanel state={state} /></WithInspector>);
    expect(screen.getByTestId("craft-beam-engineers").textContent).toMatch(/3/);
  });
});

// ── Story 47-04: Mechanization progress display ──────────────────────────────

describe("Story 47-04: Mechanization progress display", () => {
  function makeProgressState(progress: number, engineers: number) {
    return {
      ...makeState(
        {},
        { beam: { unlocked: true, engineers, progress } } as unknown as Record<string, { unlocked: boolean }>,
      ),
      village: { jobs: { engineer: { value: engineers } } },
      science: {
        techs: { mechanization: { unlocked: true, researched: true } },
      },
    } as unknown as import("@kittens/api-spec").GameStateResponse;
  }

  it("shows zero-padded progress when engineers assigned", () => {
    const state = makeProgressState(0.05, 1);
    render(<WithInspector><WorkshopPanel state={state} /></WithInspector>);
    expect(screen.getByTestId("craft-beam-progress").textContent).toBe("[05%]");
  });

  it("caps progress display at 99%", () => {
    const state = makeProgressState(0.999, 1);
    render(<WithInspector><WorkshopPanel state={state} /></WithInspector>);
    expect(screen.getByTestId("craft-beam-progress").textContent).toBe("[99%]");
  });

  it("hides progress when no engineers assigned", () => {
    const state = makeProgressState(0, 0);
    render(<WithInspector><WorkshopPanel state={state} /></WithInspector>);
    expect(screen.queryByTestId("craft-beam-progress")).toBeNull();
  });
});

// ── Story 47-06: Workshop flavor text ─────────────────────────────────────────

describe("Story 47-06: Workshop flavor text", () => {
  it("shows flavor text in inspector when hovering a craft row", () => {
    const state = makeState({}, { beam: { unlocked: true } }, { wood: { value: 100 } });
    render(<WithInspector><WorkshopPanel state={state} /></WithInspector>);
    const craftRow = screen.getByTestId("craft-beam");
    fireEvent.mouseEnter(craftRow);
    // Inspector should show the craft info with flavor text
    const inspector = screen.getByTestId("inspector-panel");
    expect(inspector.textContent).toMatch(/beam/i);
  });
});
