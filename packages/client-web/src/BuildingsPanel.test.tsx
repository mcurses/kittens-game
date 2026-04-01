import { cleanup, fireEvent, render, screen } from "@testing-library/react";
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
  ],
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
      brewery: { toggleVisible: true, automationVisible: false },
      smelter: { toggleVisible: true, automationVisible: false },
      calciner: { toggleVisible: true, automationVisible: false },
      accelerator: { toggleVisible: true, automationVisible: false },
      mint: { toggleVisible: true, automationVisible: false },
      steamworks: { toggleVisible: true, automationVisible: true },
      factory: {
        toggleVisible: false,
        automationVisible: state.workshop?.upgrades?.carbonSequestration?.researched === true,
      },
      mine: { toggleVisible: state.science?.techs?.ecology?.researched === true, automationVisible: false },
      field: { toggleVisible: false, automationVisible: false },
      hut: { toggleVisible: false, automationVisible: false },
      pasture: { toggleVisible: false, automationVisible: false },
    },
  }),
}));

function makeState(
  buildings: Record<string, { val: number; on: number; unlocked?: boolean; automationEnabled?: boolean; jammed?: boolean }>,
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

  it("dispatches DISABLE_BUILDING when off button is clicked", () => {
    const state = makeState(
      { brewery: { val: 2, on: 2, unlocked: true } },
      { wood: { value: 2000, maxValue: 0 } },
    );
    render(<WithInspector><BuildingsPanel state={state} /></WithInspector>);
    fireEvent.click(screen.getByRole("button", { name: /off/i }));
    expect(mockMutate).toHaveBeenCalledWith({ type: "DISABLE_BUILDING", name: "brewery" });
  });

  it("dispatches ENABLE_BUILDING when on button is clicked", () => {
    const state = makeState(
      { brewery: { val: 3, on: 1, unlocked: true } },
      { wood: { value: 2000, maxValue: 0 } },
    );
    render(<WithInspector><BuildingsPanel state={state} /></WithInspector>);
    fireEvent.click(screen.getByRole("button", { name: /on/i }));
    expect(mockMutate).toHaveBeenCalledWith({ type: "ENABLE_BUILDING", name: "brewery" });
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

  it("shows Maxed state when building cost exceeds current storage", () => {
    const state = makeState(
      { field: { val: 0, on: 0, unlocked: true } },
      { catnip: { value: 0, maxValue: 5 } },
    );
    render(<WithInspector><BuildingsPanel state={state} /></WithInspector>);
    expect(screen.getByTestId("building-field-maxed").textContent).toMatch(/maxed/i);
    expect(screen.queryByRole("button", { name: /buy/i })).toBeNull();
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

  it("shows on/off controls only for legacy-toggleable buildings", () => {
    const state = makeState({
      brewery: { val: 5, on: 3, unlocked: true },
      hut: { val: 5, on: 3, unlocked: true },
    });
    render(<WithInspector><BuildingsPanel state={state} /></WithInspector>);
    expect(screen.getByRole("button", { name: /on/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /off/i })).toBeTruthy();
    expect(screen.getAllByRole("button", { name: /buy/i }).length).toBe(2);
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
    expect(screen.queryByRole("button", { name: /on/i })).toBeNull();

    rerender(<WithInspector><BuildingsPanel state={shown} /></WithInspector>);
    expect(screen.getByRole("button", { name: /on/i })).toBeTruthy();
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
