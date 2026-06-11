import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { InspectorProvider } from "./InspectorContext.js";
import { InspectorPanel } from "./InspectorPanel.js";
import { SlotProvider } from "./SlotContext.js";
import { BuildingsPanel } from "./BuildingsPanel.js";

// Mock useGameAction
const mockMutate = vi.fn();
const mockUseGameAction = vi.fn(() => ({ mutate: mockMutate, isPending: false, error: null }));
vi.mock("./useGameAction.js", () => ({
  useGameAction: (slot?: string) => mockUseGameAction(slot),
}));

// Mock BUILDING_DEFS and getBuildingPrice from @kittens/engine
vi.mock("@kittens/engine", () => ({
  RESOURCE_NAMES: [
    "catnip", "wood", "minerals", "iron", "coal", "gold", "titanium", "oil",
    "uranium", "unobtainium", "antimatter", "relic", "blueprint", "compedium",
    "parchment", "manuscript", "science", "culture", "faith", "beam", "slab",
    "plate", "steel", "gear", "scaffold", "megalith", "concrete", "alloy",
    "eludium", "thorium", "kerosene", "starchart", "tanker", "ivory", "spice",
    "furs", "catpower", "unicorns", "necrocorn", "tears", "karma", "paragon",
    "burnedParagon", "timeCrystal", "void", "sorrow", "temporalFlux",
  ],
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
    {
      name: "brewery",
      prices: [{ name: "wood", val: 1000 }],
      priceRatio: 1.5,
      effects: {},
    },
    {
      name: "warehouse",
      prices: [
        { name: "beam", val: 2 },
        { name: "slab", val: 2 },
      ],
      priceRatio: 1.15,
      effects: {},
    },
    {
      name: "smelter",
      prices: [{ name: "minerals", val: 200 }],
      priceRatio: 1.15,
      effects: {},
    },
    {
      name: "steamworks",
      prices: [{ name: "steel", val: 100 }],
      priceRatio: 1.2,
      effects: {},
    },
    {
      name: "mine",
      prices: [{ name: "wood", val: 100 }],
      priceRatio: 1.15,
      effects: {},
    },
    {
      name: "factory",
      prices: [{ name: "titanium", val: 2000 }],
      priceRatio: 1.15,
      effects: {},
    },
    {
      name: "harbor",
      prices: [{ name: "wood", val: 500 }], priceRatio: 1.15, effects: {},
    },
    {
      name: "mint",
      prices: [{ name: "minerals", val: 600 }], priceRatio: 1.15, effects: {},
    },
    {
      name: "workshop",
      prices: [{ name: "wood", val: 100 }], priceRatio: 1.15, effects: {},
    },
    {
      name: "ziggurat",
      prices: [{ name: "megalith", val: 1 }], priceRatio: 1.15, effects: {},
    },
    {
      name: "aiCore",
      prices: [{ name: "science", val: 1000 }], priceRatio: 1.15, effects: {},
    },
    {
      name: "zebraOutpost",
      prices: [{ name: "ivory", val: 100 }], priceRatio: 1.15, effects: {},
    },
  ],
  STAGE_LABELS: {
    pasture: ["Pasture", "Solar Farm"],
    aqueduct: ["Aqueduct", "Hydro Plant"],
    library: ["Library", "Data Center"],
    warehouse: ["Warehouse", "Spaceport"],
    amphitheatre: ["Amphitheatre", "Broadcast Tower"],
  },
  getBuildingDisplayName: (name: string, stage: number) => {
    const labels: Record<string, string[]> = {
      pasture: ["Pasture", "Solar Farm"],
      aqueduct: ["Aqueduct", "Hydro Plant"],
      library: ["Library", "Data Center"],
      warehouse: ["Warehouse", "Spaceport"],
      amphitheatre: ["Amphitheatre", "Broadcast Tower"],
    };
    return labels[name]?.[stage];
  },
  // getBuildingPrice returns base prices unchanged for test simplicity
  getBuildingPrice: (def: { prices: readonly { name: string; val: number }[] }) => def.prices,
  deriveUiVisibility: (state: { science?: { techs?: Record<string, { researched?: boolean }> } }) => ({
    tabs: {},
    village: {},
    jobs: {},
    resources: {},
    actions: {},
    time: {},
    buildings: {
      brewery: { controlMode: "count", toggleVisible: true, automationVisible: false },
      warehouse: { controlMode: "none", toggleVisible: false, automationVisible: false },
      smelter: { controlMode: "count", toggleVisible: true, automationVisible: false },
      calciner: { controlMode: "count", toggleVisible: true, automationVisible: false },
      accelerator: { controlMode: "count", toggleVisible: true, automationVisible: false },
      mint: { controlMode: "count", toggleVisible: true, automationVisible: false },
      steamworks: { controlMode: "binary", toggleVisible: true, automationVisible: true },
      factory: {
        controlMode: "none",
        toggleVisible: false,
        automationVisible: state.workshop?.upgrades?.carbonSequestration?.researched === true,
      },
      mine: { controlMode: state.science?.techs?.ecology?.researched === true ? "count" : "none", toggleVisible: state.science?.techs?.ecology?.researched === true, automationVisible: false },
      field: { controlMode: "none", toggleVisible: false, automationVisible: false },
      hut: { controlMode: "none", toggleVisible: false, automationVisible: false },
      pasture: { controlMode: "none", toggleVisible: false, automationVisible: false },
      harbor: { controlMode: "none", toggleVisible: false, automationVisible: false },
      workshop: { controlMode: "none", toggleVisible: false, automationVisible: false },
      ziggurat: { controlMode: "none", toggleVisible: false, automationVisible: false },
      aiCore: { controlMode: "none", toggleVisible: false, automationVisible: false },
      zebraOutpost: { controlMode: "none", toggleVisible: false, automationVisible: false },
    },
  }),
}));

function makeState(
  buildings: Record<string, { val: number; on: number; unlocked?: boolean; automationEnabled?: boolean; jammed?: boolean; stage?: number; stageUnlocked?: boolean[] }>,
  resources?: Record<string, { value: number; maxValue: number }>,
) {
  return {
    version: 1,
    tick: 0,
    buildings,
    resources: resources ?? {},
  } as unknown as import("@kittens/api-spec").GameStateResponse;
}

function WithInspector({
  children,
  slot = "default",
}: {
  children: React.ReactNode;
  slot?: string;
}): React.ReactElement {
  return (
    <SlotProvider slot={slot}>
      <InspectorProvider>
        {children}
        <InspectorPanel />
      </InspectorProvider>
    </SlotProvider>
  );
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  mockUseGameAction.mockClear();
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
    expect(screen.getByText(/field/i)).toBeTruthy();
    expect(screen.getByText(/3/)).toBeTruthy();
  });

  it("renders building prices from BUILDING_DEFS", () => {
    const state = makeState({ field: { val: 1, on: 1, unlocked: true } });
    render(<WithInspector><BuildingsPanel state={state} /></WithInspector>);
    expect(screen.getByTestId("resource-icon-catnip")).toBeTruthy();
    expect(screen.getByLabelText(/Cost:.*10.*catnip/)).toBeTruthy();
  });

  it("renders multiple prices for a building", () => {
    const state = makeState({ pasture: { val: 2, on: 2, unlocked: true } });
    render(<WithInspector><BuildingsPanel state={state} /></WithInspector>);
    expect(screen.getByTestId("resource-icon-catnip")).toBeTruthy();
    expect(screen.getByTestId("resource-icon-wood")).toBeTruthy();
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

  it("dispatches DISABLE_BUILDING with amount 1 when count-adjust decrement is clicked", () => {
    const state = makeState(
      { smelter: { val: 2, on: 2, unlocked: true } },
      { minerals: { value: 2000, maxValue: 0 } },
    );
    render(<WithInspector><BuildingsPanel state={state} /></WithInspector>);
    fireEvent.click(screen.getByTestId("building-smelter-disable-1"));
    expect(mockMutate).toHaveBeenCalledWith({ type: "DISABLE_BUILDING", name: "smelter", amount: 1 });
  });

  it("dispatches ENABLE_BUILDING with amount 25 when count-adjust increment is clicked", () => {
    const state = makeState(
      { smelter: { val: 30, on: 1, unlocked: true } },
      { minerals: { value: 2000, maxValue: 0 } },
    );
    render(<WithInspector><BuildingsPanel state={state} /></WithInspector>);
    fireEvent.click(screen.getByTestId("building-smelter-enable-25"));
    expect(mockMutate).toHaveBeenCalledWith({ type: "ENABLE_BUILDING", name: "smelter", amount: 25 });
  });

  it("dispatches DISABLE_BUILDING_AUTOMATION when auto off is clicked", () => {
    const state = makeState(
      { steamworks: { val: 1, on: 1, unlocked: true, automationEnabled: true } },
      { wood: { value: 2000, maxValue: 10000 } },
    );
    render(<WithInspector><BuildingsPanel state={state} /></WithInspector>);
    fireEvent.click(screen.getByRole("button", { name: /auto off/i }));
    expect(mockMutate).toHaveBeenCalledWith({ type: "DISABLE_BUILDING_AUTOMATION", name: "steamworks" });
  });

  it("dispatches ENABLE_BUILDING_AUTOMATION when auto on is clicked", () => {
    const state = makeState(
      { steamworks: { val: 1, on: 1, unlocked: true, automationEnabled: false } },
      { wood: { value: 2000, maxValue: 10000 } },
    );
    render(<WithInspector><BuildingsPanel state={state} /></WithInspector>);
    fireEvent.click(screen.getByRole("button", { name: /auto on/i }));
    expect(mockMutate).toHaveBeenCalledWith({ type: "ENABLE_BUILDING_AUTOMATION", name: "steamworks" });
  });

  it("shows factory automation controls only after carbon sequestration and dispatches engine-backed actions", () => {
    const hidden = makeState(
      { factory: { val: 1, on: 1, unlocked: true, automationEnabled: true } },
      { titanium: { value: 5000, maxValue: 0 } },
    );
    const shown = makeState(
      { factory: { val: 1, on: 1, unlocked: true, automationEnabled: true } },
      { titanium: { value: 5000, maxValue: 0 } },
    ) as Record<string, unknown>;
    shown.workshop = {
      upgrades: { carbonSequestration: { unlocked: true, researched: true } },
      crafts: {},
    };

    const { rerender } = render(<WithInspector><BuildingsPanel state={hidden} /></WithInspector>);
    expect(screen.queryByRole("button", { name: /auto off/i })).toBeNull();

    rerender(<WithInspector><BuildingsPanel state={shown as import("@kittens/api-spec").GameStateResponse} /></WithInspector>);
    fireEvent.click(screen.getByRole("button", { name: /auto off/i }));
    expect(mockMutate).toHaveBeenCalledWith({ type: "DISABLE_BUILDING_AUTOMATION", name: "factory" });
  });

  it("uses the current slot when wiring building actions", () => {
    const state = makeState({ field: { val: 0, on: 0, unlocked: true } });
    render(<WithInspector slot="new"><BuildingsPanel state={state} /></WithInspector>);
    expect(mockUseGameAction).toHaveBeenCalledWith("new");
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

  it("keeps Buy button and marks it storage-limited when building cost exceeds current storage", () => {
    const state = makeState(
      { field: { val: 0, on: 0, unlocked: true } },
      { catnip: { value: 0, maxValue: 5 } },
    );
    render(<WithInspector><BuildingsPanel state={state} /></WithInspector>);
    const btn = screen.getByTestId("building-field-buy");
    expect(btn.textContent).toBe("Buy");
    expect(btn.className).toMatch(/btn--limited/);
    expect(btn.hasAttribute("disabled")).toBe(true);
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

  it("groups visible buildings into bonfire-style categories", () => {
    const state = makeState({
      field: { val: 1, on: 1, unlocked: true },
      hut: { val: 1, on: 1, unlocked: true },
      warehouse: { val: 0, on: 0, unlocked: true },
      mine: { val: 1, on: 1, unlocked: true },
      smelter: { val: 1, on: 1, unlocked: true },
      brewery: { val: 1, on: 1, unlocked: true },
      workshop: { val: 1, on: 1, unlocked: true },
      ziggurat: { val: 1, on: 1, unlocked: true },
      aiCore: { val: 1, on: 1, unlocked: true },
      zebraOutpost: { val: 1, on: 1, unlocked: true },
    });

    render(<WithInspector><BuildingsPanel state={state} /></WithInspector>);

    const food = screen.getByTestId("building-category-food-production");
    expect(within(food).getByTestId("building-field")).toBeTruthy();

    const population = screen.getByTestId("building-category-population");
    expect(within(population).getByTestId("building-hut")).toBeTruthy();

    const storage = screen.getByTestId("building-category-storage");
    expect(within(storage).getByTestId("building-warehouse")).toBeTruthy();

    const resources = screen.getByTestId("building-category-resources");
    expect(within(resources).getByTestId("building-mine")).toBeTruthy();

    const industry = screen.getByTestId("building-category-industry");
    expect(within(industry).getByTestId("building-smelter")).toBeTruthy();
    expect(within(industry).getByTestId("building-aiCore")).toBeTruthy();

    const other = screen.getByTestId("building-category-other");
    expect(within(other).getByTestId("building-brewery")).toBeTruthy();
    expect(within(other).getByTestId("building-workshop")).toBeTruthy();

    const mega = screen.getByTestId("building-category-mega-structures");
    expect(within(mega).getByTestId("building-ziggurat")).toBeTruthy();

    const zebras = screen.getByTestId("building-category-zebras");
    expect(within(zebras).getByTestId("building-zebraOutpost")).toBeTruthy();
  });

  it("hides empty building categories", () => {
    const state = makeState({ field: { val: 1, on: 1, unlocked: true } });
    render(<WithInspector><BuildingsPanel state={state} /></WithInspector>);

    expect(screen.getByTestId("building-category-food-production")).toBeTruthy();
    expect(screen.queryByTestId("building-category-industry")).toBeNull();
    expect(screen.queryByTestId("building-category-zebras")).toBeNull();
  });
});

// ── Epic 32 Story 32-04: Buildings on/off display + human-readable names ──────

describe("Story 32-04: Buildings on/off display and labels", () => {
  it("shows 'on/val' when on < val", () => {
    const state = makeState({ hut: { val: 12, on: 9, unlocked: true } });
    render(<WithInspector><BuildingsPanel state={state} /></WithInspector>);
    expect(screen.getByText(/9\/12|9 \/ 12/)).toBeTruthy();
  });

  it("shows just val when on === val", () => {
    const state = makeState({ hut: { val: 5, on: 5, unlocked: true } });
    render(<WithInspector><BuildingsPanel state={state} /></WithInspector>);
    // Should show "5" without a slash
    const countEl = screen.getByTestId("building-hut").querySelector(".building-count");
    expect(countEl?.textContent).toBe("5");
  });

  it("shows human-readable label instead of camelCase name", () => {
    const state = makeState({ hut: { val: 1, on: 1, unlocked: true } });
    render(<WithInspector><BuildingsPanel state={state} /></WithInspector>);
    // "hut" → "Hut" (single word); in a realistic case: "lumberMill" → "Lumber Mill"
    expect(screen.getByText(/^Hut$/)).toBeTruthy();
  });

  it("shows count-adjust controls for count-toggle buildings instead of binary on/off", () => {
    const state = makeState({
      smelter: { val: 5, on: 3, unlocked: true },
      hut: { val: 5, on: 3, unlocked: true },
    });
    render(<WithInspector><BuildingsPanel state={state} /></WithInspector>);
    expect(screen.getByTestId("building-smelter-disable-1")).toBeTruthy();
    expect(screen.getByTestId("building-smelter-disable-25")).toBeTruthy();
    expect(screen.getByTestId("building-smelter-disable-all")).toBeTruthy();
    expect(screen.getByTestId("building-smelter-enable-1")).toBeTruthy();
    expect(screen.getByTestId("building-smelter-enable-25")).toBeTruthy();
    expect(screen.getByTestId("building-smelter-enable-all")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /^on$/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /^off$/i })).toBeNull();
    expect(screen.getAllByRole("button", { name: /buy/i }).length).toBe(2);
  });

  it("shows binary on/off controls only for binary-toggle buildings", () => {
    const state = makeState({
      steamworks: { val: 2, on: 1, unlocked: true, automationEnabled: false },
    });
    render(<WithInspector><BuildingsPanel state={state} /></WithInspector>);
    expect(screen.getByTestId("building-steamworks-enable-binary")).toBeTruthy();
    expect(screen.getByTestId("building-steamworks-disable-binary")).toBeTruthy();
    expect(screen.queryByTestId("building-steamworks-enable-25")).toBeNull();
    expect(screen.queryByTestId("building-steamworks-disable-25")).toBeNull();
  });

  it("hides on/off controls for non-toggleable buildings", () => {
    const state = makeState({ hut: { val: 5, on: 3, unlocked: true } });
    render(<WithInspector><BuildingsPanel state={state} /></WithInspector>);
    expect(screen.queryByRole("button", { name: /on/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /off/i })).toBeNull();
  });

  it("shows ecology-gated controls only after ecology is researched", () => {
    const hidden = makeState({ mine: { val: 2, on: 2, unlocked: true } });
    const shown = makeState({ mine: { val: 2, on: 2, unlocked: true } });
    (shown as Record<string, unknown>).science = {
      techs: { ecology: { unlocked: true, researched: true } },
      policies: {},
    };

    const { rerender } = render(<WithInspector><BuildingsPanel state={hidden} /></WithInspector>);
    expect(screen.queryByTestId("building-mine-enable-1")).toBeNull();

    rerender(<WithInspector><BuildingsPanel state={shown} /></WithInspector>);
    expect(screen.getByTestId("building-mine-enable-1")).toBeTruthy();
  });
});

describe("camelCase prettifier (via BuildingsPanel)", () => {
  it("splits camelCase into Title Case words", () => {
    // We test via rendering; use "field" which maps to "Field"
    const state = makeState({ field: { val: 1, on: 1, unlocked: true } });
    render(<WithInspector><BuildingsPanel state={state} /></WithInspector>);
    expect(screen.getByText(/^Field$/)).toBeTruthy();
  });
});

// ── Story 49-05: Building filter tabs ───────────────────────────────────────

describe("Story 49-05: Building filter tabs", () => {
  const baseBuildings = {
    field: { val: 3, on: 3, unlocked: true },
    hut: { val: 1, on: 1, unlocked: true },
    brewery: { val: 2, on: 1, unlocked: true },   // count controls, on > 0
    steamworks: { val: 1, on: 0, unlocked: true }, // binary controls, on = 0
  };
  const baseResources = {
    catnip: { value: 500, maxValue: 5000 },
    wood: { value: 200, maxValue: 5000 },
  };

  it("renders filter tabs: All, Available, Enabled, Togglable", () => {
    const state = makeState(baseBuildings, baseResources);
    render(<WithInspector><BuildingsPanel state={state} /></WithInspector>);
    expect(screen.getByTestId("building-filter-all")).toBeTruthy();
    expect(screen.getByTestId("building-filter-available")).toBeTruthy();
    expect(screen.getByTestId("building-filter-enabled")).toBeTruthy();
    expect(screen.getByTestId("building-filter-togglable")).toBeTruthy();
  });

  it("All tab shows all unlocked buildings (default)", () => {
    const state = makeState(baseBuildings, baseResources);
    render(<WithInspector><BuildingsPanel state={state} /></WithInspector>);
    expect(screen.getByTestId("building-field")).toBeTruthy();
    expect(screen.getByTestId("building-hut")).toBeTruthy();
    expect(screen.getByTestId("building-brewery")).toBeTruthy();
    expect(screen.getByTestId("building-steamworks")).toBeTruthy();
  });

  it("Available tab shows only affordable buildings", () => {
    // field costs 10 catnip (affordable), hut costs 5 wood (affordable)
    // brewery costs 1000 wood (not affordable with 200 wood)
    // steamworks costs 100 steel (not affordable — no steel in resources)
    const state = makeState(baseBuildings, baseResources);
    render(<WithInspector><BuildingsPanel state={state} /></WithInspector>);
    fireEvent.click(screen.getByTestId("building-filter-available"));
    expect(screen.getByTestId("building-field")).toBeTruthy();
    expect(screen.getByTestId("building-hut")).toBeTruthy();
    expect(screen.queryByTestId("building-brewery")).toBeNull();
    expect(screen.queryByTestId("building-steamworks")).toBeNull();
  });

  it("Enabled tab shows only buildings with on > 0", () => {
    const state = makeState(baseBuildings, baseResources);
    render(<WithInspector><BuildingsPanel state={state} /></WithInspector>);
    fireEvent.click(screen.getByTestId("building-filter-enabled"));
    expect(screen.getByTestId("building-field")).toBeTruthy();
    expect(screen.getByTestId("building-hut")).toBeTruthy();
    expect(screen.getByTestId("building-brewery")).toBeTruthy();
    // steamworks has on=0
    expect(screen.queryByTestId("building-steamworks")).toBeNull();
  });

  it("Togglable tab shows only buildings with on/off controls", () => {
    const state = makeState(baseBuildings, baseResources);
    render(<WithInspector><BuildingsPanel state={state} /></WithInspector>);
    fireEvent.click(screen.getByTestId("building-filter-togglable"));
    // brewery has count controls, steamworks has binary controls
    expect(screen.getByTestId("building-brewery")).toBeTruthy();
    expect(screen.getByTestId("building-steamworks")).toBeTruthy();
    // field and hut have no toggle controls
    expect(screen.queryByTestId("building-field")).toBeNull();
    expect(screen.queryByTestId("building-hut")).toBeNull();
  });

  it("active tab is visually highlighted", () => {
    const state = makeState(baseBuildings, baseResources);
    render(<WithInspector><BuildingsPanel state={state} /></WithInspector>);
    const allTab = screen.getByTestId("building-filter-all");
    expect(allTab.getAttribute("data-active")).toBe("true");
    fireEvent.click(screen.getByTestId("building-filter-enabled"));
    expect(screen.getByTestId("building-filter-enabled").getAttribute("data-active")).toBe("true");
    expect(screen.getByTestId("building-filter-all").getAttribute("data-active")).toBe("false");
  });
});

// ── Story 49-06: Stage upgrade/downgrade UI controls ────────────────────────

describe("Story 49-06: Stage UI controls", () => {
  it("shows upgrade button when next stage is unlocked", () => {
    const state = makeState({
      pasture: { val: 2, on: 2, unlocked: true, stage: 0, stageUnlocked: [true, true] },
    });
    render(<WithInspector><BuildingsPanel state={state} /></WithInspector>);
    expect(screen.getByTestId("building-pasture-upgrade")).toBeTruthy();
  });

  it("hides upgrade button when next stage is locked", () => {
    const state = makeState({
      pasture: { val: 2, on: 2, unlocked: true, stage: 0, stageUnlocked: [true, false] },
    });
    render(<WithInspector><BuildingsPanel state={state} /></WithInspector>);
    expect(screen.queryByTestId("building-pasture-upgrade")).toBeNull();
  });

  it("shows downgrade button when current stage > 0", () => {
    const state = makeState({
      pasture: { val: 0, on: 0, unlocked: true, stage: 1, stageUnlocked: [true, true] },
    });
    render(<WithInspector><BuildingsPanel state={state} /></WithInspector>);
    expect(screen.getByTestId("building-pasture-downgrade")).toBeTruthy();
  });

  it("hides downgrade button when at stage 0", () => {
    const state = makeState({
      pasture: { val: 2, on: 2, unlocked: true, stage: 0, stageUnlocked: [true, true] },
    });
    render(<WithInspector><BuildingsPanel state={state} /></WithInspector>);
    expect(screen.queryByTestId("building-pasture-downgrade")).toBeNull();
  });

  it("upgrade button dispatches UPGRADE_BUILDING_STAGE", () => {
    const state = makeState({
      pasture: { val: 2, on: 2, unlocked: true, stage: 0, stageUnlocked: [true, true] },
    });
    render(<WithInspector><BuildingsPanel state={state} /></WithInspector>);
    fireEvent.click(screen.getByTestId("building-pasture-upgrade"));
    expect(mockMutate).toHaveBeenCalledWith({ type: "UPGRADE_BUILDING_STAGE", name: "pasture" });
  });

  it("downgrade button dispatches DOWNGRADE_BUILDING_STAGE", () => {
    const state = makeState({
      pasture: { val: 0, on: 0, unlocked: true, stage: 1, stageUnlocked: [true, true] },
    });
    render(<WithInspector><BuildingsPanel state={state} /></WithInspector>);
    fireEvent.click(screen.getByTestId("building-pasture-downgrade"));
    expect(mockMutate).toHaveBeenCalledWith({ type: "DOWNGRADE_BUILDING_STAGE", name: "pasture" });
  });

  it("displays stage label instead of camelCase name", () => {
    const state = makeState({
      pasture: { val: 1, on: 1, unlocked: true, stage: 1, stageUnlocked: [true, true] },
    });
    render(<WithInspector><BuildingsPanel state={state} /></WithInspector>);
    expect(screen.getByText("Solar Farm")).toBeTruthy();
  });
});
