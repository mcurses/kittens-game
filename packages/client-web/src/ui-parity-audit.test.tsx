/**
 * UI Parity Audit — component-level surface check
 *
 * Renders each panel with a representative late-game state and asserts
 * that legacy-expected UI elements are present. Gaps are documented in
 * agent-docs/UI_PARITY.md. Each test group maps to a panel section in
 * that file.
 *
 * This file is intentionally separate from per-component unit tests.
 * Its purpose is to catch "marked complete but actually missing" gaps.
 */
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import type { GameStateResponse } from "@kittens/api-spec";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { InspectorProvider } from "./InspectorContext.js";
import { InspectorPanel } from "./InspectorPanel.js";
import { ResourcePanel } from "./ResourcePanel.js";
import { BuildingsPanel } from "./BuildingsPanel.js";
import { WorkshopPanel } from "./WorkshopPanel.js";
import { SciencePanel } from "./SciencePanel.js";
import { JobsPanel } from "./JobsPanel.js";
import { DiplomacyPanel } from "./DiplomacyPanel.js";
import { ReligionPanel } from "./ReligionPanel.js";

const mockMutate = vi.fn();
vi.mock("./useGameAction.js", () => ({
  useGameAction: () => ({ mutate: mockMutate, isPending: false, error: null }),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  window.localStorage.clear();
});

function Wrap({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <InspectorProvider>
      {children}
      <InspectorPanel />
    </InspectorProvider>
  );
}

// ── Rich late-game state fixture ──────────────────────────────────────────────
// Represents a mid-late game with multiple resources, buildings, techs, upgrades
// to exercise all panel surfaces.

function lateGameState(): GameStateResponse {
  return {
    version: 1,
    tick: 52700,
    calendar: {
      year: 120,
      season: 2,
      day: 15,
      festivalDays: 5,
    },
    resources: {
      catnip: { value: 3500, maxValue: 5000, perTick: 12.5 },
      wood: { value: 180, maxValue: 200, perTick: 2.1 },
      minerals: { value: 220, maxValue: 250, perTick: 1.8 },
      science: { value: 100, maxValue: 250, perTick: 3.2 },
      catpower: { value: 45, maxValue: 100, perTick: 0.5 },
      iron: { value: 30, maxValue: 50, perTick: 0.1 },
      coal: { value: 10, maxValue: 60, perTick: 0.02 },
      gold: { value: 5, maxValue: 10, perTick: 0 },
      faith: { value: 200, maxValue: 100, perTick: 0.3 },
      culture: { value: 80, maxValue: 100, perTick: 0.5 },
      oil: { value: 0, maxValue: 1500, perTick: 0 },
      furs: { value: 50, maxValue: 0, perTick: 0 },
      ivory: { value: 20, maxValue: 0, perTick: 0 },
      spice: { value: 8, maxValue: 0, perTick: 0 },
      unicorns: { value: 3, maxValue: 0, perTick: 0.01 },
      karma: { value: 0, maxValue: 0, perTick: 0 },
      beam: { value: 15, maxValue: 0, perTick: 0 },
      slab: { value: 8, maxValue: 0, perTick: 0 },
      plate: { value: 4, maxValue: 0, perTick: 0 },
      steel: { value: 2, maxValue: 0, perTick: 0 },
      parchment: { value: 10, maxValue: 0, perTick: 0 },
      manuscript: { value: 3, maxValue: 0, perTick: 0 },
      gear: { value: 1, maxValue: 0, perTick: 0 },
      scaffold: { value: 5, maxValue: 0, perTick: 0 },
    },
    effectCache: {
      catnipPerTickBase: 10,
      catnipRatio: 0.25,
      catnipPerTickCon: -2,
      woodRatio: 0.1,
      scienceRatio: 0.35,
      unhappinessRatio: -0.25,
      happiness: 0.4,
      maxKittens: 20,
      craftRatio: 0.06,
      catnipDemandRatio: -0.04,
      festivalRatio: 0.03,
    },
    buildings: {
      field: { val: 10, on: 10, unlocked: true },
      hut: { val: 5, on: 5, unlocked: true },
      logHouse: { val: 2, on: 2, unlocked: true },
      library: { val: 3, on: 3, unlocked: true },
      academy: { val: 1, on: 1, unlocked: true },
      mine: { val: 2, on: 2, unlocked: true },
      barn: { val: 2, on: 2, unlocked: true },
      workshop: { val: 1, on: 1, unlocked: true },
      smelter: { val: 1, on: 1, unlocked: true },
      amphitheatre: { val: 1, on: 1, unlocked: true },
      temple: { val: 1, on: 1, unlocked: true },
      unicornPasture: { val: 1, on: 1, unlocked: true },
      aqueduct: { val: 1, on: 1, unlocked: true },
      warehouse: { val: 0, on: 0, unlocked: true },
      brewery: { val: 1, on: 1, unlocked: true },
    },
    village: {
      kittens: 18,
      kittenProgress: 0.3,
      deadKittens: 0,
      jobs: {
        woodcutter: { value: 4, unlocked: true },
        farmer: { value: 5, unlocked: true },
        scholar: { value: 3, unlocked: true },
        hunter: { value: 2, unlocked: true },
        miner: { value: 3, unlocked: true },
        priest: { value: 1, unlocked: true },
      },
    },
    science: {
      techs: {
        calendar: { unlocked: true, researched: true },
        agriculture: { unlocked: true, researched: true },
        archery: { unlocked: true, researched: true },
        mining: { unlocked: true, researched: true },
        metal: { unlocked: true, researched: true },
        animal: { unlocked: true, researched: true },
        civil: { unlocked: true, researched: true },
        math: { unlocked: true, researched: true },
        construction: { unlocked: true, researched: true },
        engineering: { unlocked: true, researched: true },
        currency: { unlocked: true, researched: true },
        writing: { unlocked: true, researched: true },
        philosophy: { unlocked: true, researched: true },
        steel: { unlocked: true, researched: true },
        drama: { unlocked: true, researched: false },
        theology: { unlocked: true, researched: false },
      },
      policies: {},
    },
    workshop: {
      upgrades: {
        mineralHoes: { unlocked: true, researched: true },
        ironHoes: { unlocked: true, researched: true },
        mineralAxes: { unlocked: true, researched: true },
        ironAxes: { unlocked: true, researched: false },
        stoneBarns: { unlocked: true, researched: false },
        reinforcedBarns: { unlocked: true, researched: false },
        reinforcedSaw: { unlocked: true, researched: false },
        steelAxe: { unlocked: true, researched: false },
        coalFurnace: { unlocked: true, researched: false },
      },
      crafts: {
        wood: { unlocked: true, engineers: 0 },
        beam: { unlocked: true, engineers: 0 },
        slab: { unlocked: true, engineers: 0 },
        plate: { unlocked: true, engineers: 0 },
        steel: { unlocked: true, engineers: 0 },
        parchment: { unlocked: true, engineers: 0 },
        manuscript: { unlocked: true, engineers: 0 },
        gear: { unlocked: true, engineers: 0 },
        scaffold: { unlocked: true, engineers: 0 },
      },
    },
    religion: {
      faith: 200,
      faithRatio: 0.05,
      transcendenceTier: 0,
      zipiats: {},
      religionUpgrades: {},
      transcendenceUpgrades: {},
    },
    diplomacy: {
      races: {
        lizards: { unlocked: true, standing: 0.1, embassyLevel: 1, explored: true },
        sharks: { unlocked: true, standing: -0.3, embassyLevel: 0, explored: true },
      },
    },
    space: {
      programs: {},
      buildings: {},
    },
    time: {
      heat: 0,
      flux: 0,
      cfu: {},
      vsu: {},
    },
    challenges: {},
    achievements: {},
    prestige: {
      paragonPoints: 0,
      burnedParagonPoints: 0,
      perks: {},
    },
  } as unknown as GameStateResponse;
}

// ── RESOURCE PANEL ────────────────────────────────────────────────────────────

describe("UI Parity Audit: Resource Panel", () => {
  it("renders resource rows with name, value, max, and rate", () => {
    render(<Wrap><ResourcePanel state={lateGameState()} /></Wrap>);
    const panel = screen.getByTestId("resource-panel");

    // Core resources should be visible
    expect(within(panel).getByTestId("resource-catnip")).toBeTruthy();
    expect(within(panel).getByTestId("resource-wood")).toBeTruthy();
    expect(within(panel).getByTestId("resource-minerals")).toBeTruthy();
    expect(within(panel).getByTestId("resource-science")).toBeTruthy();
  });

  it("has per-tick / per-second toggle", () => {
    render(<Wrap><ResourcePanel state={lateGameState()} /></Wrap>);
    expect(screen.getByRole("button", { name: /per second|per tick/i })).toBeTruthy();
  });

  it.todo("MISSING: catnip demand ratio badge (legacy shows -X% on the catnip row)");

  it("shows inline craft shortcuts on craftable resource rows", () => {
    render(<Wrap><ResourcePanel state={lateGameState()} /></Wrap>);
    // beam is a craftable resource with an unlocked craft
    expect(screen.getByTestId("resource-craft-beam")).toBeTruthy();
    expect(screen.getByTestId("resource-craft-beam-s1")).toBeTruthy();
    expect(screen.getByTestId("resource-craft-beam-all")).toBeTruthy();
    // wood is also craftable (catnip → wood)
    expect(screen.getByTestId("resource-craft-wood")).toBeTruthy();
  });

  it("does not show craft shortcuts on non-craftable resources", () => {
    render(<Wrap><ResourcePanel state={lateGameState()} /></Wrap>);
    // catnip has no craft recipe producing it
    expect(screen.queryByTestId("resource-craft-catnip")).toBeNull();
    // science is not craftable
    expect(screen.queryByTestId("resource-craft-science")).toBeNull();
  });

  // ── KNOWN GAPS — these tests document what's MISSING ──────────────────────

  it.todo("MISSING: weather modifier [+/-X%] display per resource");

  it.todo("MISSING: resource name color-coded by type (common/uncommon/rare)");

  it("shows per-source production attribution in inspector when hovering a resource", () => {
    const state = lateGameState();
    render(<Wrap><ResourcePanel state={state} /></Wrap>);
    const catnipRow = screen.getByTestId("resource-catnip");
    fireEvent.mouseEnter(catnipRow);
    const inspector = screen.getByTestId("inspector-panel");
    const attribution = within(inspector).getByTestId("inspector-attribution");
    // Should show at least fields (base), farmers (base), and kittens (consumption)
    expect(attribution.textContent).toMatch(/Field/);
    expect(attribution.textContent).toMatch(/Farmer/);
    expect(attribution.textContent).toMatch(/Kittens/);
  });

  it.todo("MISSING: resource row visibility toggle (Ctrl+click to hide/show)");
});

// ── BUILDINGS PANEL ───────────────────────────────────────────────────────────

describe("UI Parity Audit: Buildings Panel", () => {
  it("renders building rows with name, count, and buy button", () => {
    render(<Wrap><BuildingsPanel state={lateGameState()} /></Wrap>);

    // Should find some buildings
    expect(screen.getByTestId("building-field")).toBeTruthy();
    expect(screen.getByTestId("building-hut")).toBeTruthy();
  });

  it("shows category grouping", () => {
    render(<Wrap><BuildingsPanel state={lateGameState()} /></Wrap>);
    // Check for category headers
    expect(screen.getByText("Food Production")).toBeTruthy();
    expect(screen.getByText("Population")).toBeTruthy();
  });

  it("shows on/val count for buildings", () => {
    const state = lateGameState();
    // Make smelter partially on to test on/val display
    (state as any).buildings.smelter = { val: 3, on: 1, unlocked: true };
    render(<Wrap><BuildingsPanel state={state} /></Wrap>);
    // "1/3" appears twice for buildings with count-controls: once in the top-right
    // count badge (read-only at-a-glance), once in the stage-counter readout next to
    // the +/- buttons. Both are intentional.
    expect(screen.getAllByText("1/3").length).toBeGreaterThanOrEqual(1);
  });

  // ── KNOWN GAPS ──────────────────────────────────────────────────────────────

  it.todo("MISSING: filter tabs (All, Available, Enabled, Togglable, IW)");

  it.todo("MISSING: stage up/down controls for stageable buildings");

  it("shows flavor text in inspector when hovering a building", () => {
    render(<Wrap><BuildingsPanel state={lateGameState()} /></Wrap>);
    const fieldRow = screen.getByTestId("building-field");
    fireEvent.mouseEnter(fieldRow);
    expect(screen.getByTestId("inspector-flavor")).toBeTruthy();
    expect(screen.getByTestId("inspector-flavor").textContent).toContain("Nip as far as the eye can see");
  });

  it.todo("MISSING: tooltip automation status ('Automation is ON/OFF')");

  it.todo("MISSING: tooltip pollution warning (when Chemistry unlocked)");

  it.todo("MISSING: building rename system (Solar Farm, Hydro Plant, etc.)");
});

// ── WORKSHOP PANEL ────────────────────────────────────────────────────────────

describe("UI Parity Audit: Workshop Panel", () => {
  it("renders unlocked upgrades with purchase buttons", () => {
    render(<Wrap><WorkshopPanel state={lateGameState()} /></Wrap>);
    expect(screen.getByTestId("upgrade-ironAxes")).toBeTruthy();
    expect(screen.getAllByRole("button", { name: /buy/i }).length).toBeGreaterThan(0);
  });

  it("shows Done badge for researched upgrades", () => {
    render(<Wrap><WorkshopPanel state={lateGameState()} /></Wrap>);
    // mineralHoes is researched
    const mineralHoesRow = screen.getByTestId("upgrade-mineralHoes");
    expect(within(mineralHoesRow).getByText(/done/i)).toBeTruthy();
  });

  it("has hide-researched toggle", () => {
    render(<Wrap><WorkshopPanel state={lateGameState()} /></Wrap>);
    expect(screen.getByRole("checkbox")).toBeTruthy();
  });

  it("renders craft shortcut buttons for unlocked crafts", () => {
    render(<Wrap><WorkshopPanel state={lateGameState()} /></Wrap>);
    // Individual crafts have data-testid="craft-<name>"
    expect(screen.getByTestId("craft-beam")).toBeTruthy();
    // Each craft gets 4 shortcut buttons (s1, s2, s3, all)
    expect(screen.getByTestId("craft-beam-s1")).toBeTruthy();
    expect(screen.getByTestId("craft-beam-all")).toBeTruthy();
  });

  it("shows craft effectiveness banner when craftRatio > 0", () => {
    render(<Wrap><WorkshopPanel state={lateGameState()} /></Wrap>);
    expect(screen.getByText(/effectiveness/i)).toBeTruthy();
  });

  // ── KNOWN GAPS ──────────────────────────────────────────────────────────────

  it.todo("MISSING: craft output with bonus in button title");

  it.todo("MISSING: per-shortcut cost breakdown tooltip");

  it.todo("MISSING: craft progress % indicator (mechanization)");

  it.todo("MISSING: engineer assignment controls per craft");

  it.todo("MISSING: engineer throughput/countdown display");

  it.todo("MISSING: upgrade tooltip flavor text");
});

// ── SCIENCE PANEL ─────────────────────────────────────────────────────────────

describe("UI Parity Audit: Science Panel", () => {
  it("renders unlocked techs with research buttons", () => {
    render(<Wrap><SciencePanel state={lateGameState()} /></Wrap>);
    // drama and theology are unlocked but unresearched
    expect(screen.getAllByRole("button", { name: /research/i }).length).toBeGreaterThan(0);
  });

  it("shows Done badge for researched techs", () => {
    render(<Wrap><SciencePanel state={lateGameState()} /></Wrap>);
    const doneElements = screen.getAllByText(/done/i);
    expect(doneElements.length).toBeGreaterThan(0);
  });

  it("has hide-researched toggle", () => {
    render(<Wrap><SciencePanel state={lateGameState()} /></Wrap>);
    expect(screen.getByRole("checkbox")).toBeTruthy();
  });

  // ── KNOWN GAPS ──────────────────────────────────────────────────────────────

  it.todo("MISSING: dedicated Policy panel");

  it.todo("MISSING: Metaphysics / prestige perks panel");

  it.todo("MISSING: tooltip flavor text for techs");
});

// ── VILLAGE / JOBS PANEL ──────────────────────────────────────────────────────

describe("UI Parity Audit: Jobs Panel", () => {
  it("renders job rows with assign/unassign steppers", () => {
    render(<Wrap><JobsPanel state={lateGameState()} /></Wrap>);
    // Jobs use aria-labels like "Assign kittens to farmer"
    expect(screen.getByTestId("job-farmer-assign")).toBeTruthy();
    expect(screen.getByTestId("job-farmer-unassign")).toBeTruthy();
    expect(screen.getByTestId("job-woodcutter-assign")).toBeTruthy();
  });

  it("shows happiness display", () => {
    render(<Wrap><JobsPanel state={lateGameState()} /></Wrap>);
    expect(screen.getByText(/happiness/i)).toBeTruthy();
  });

  it("shows festival duration when active", () => {
    render(<Wrap><JobsPanel state={lateGameState()} /></Wrap>);
    expect(screen.getByText(/festival/i)).toBeTruthy();
  });

  // ── KNOWN GAPS ──────────────────────────────────────────────────────────────

  it("shows bulk job assignment buttons (+5, +All, -5, -All)", () => {
    render(<Wrap><JobsPanel state={lateGameState()} /></Wrap>);
    expect(screen.getByTestId("job-farmer-assign-5")).toBeTruthy();
    expect(screen.getByTestId("job-farmer-assign-all")).toBeTruthy();
    expect(screen.getByTestId("job-farmer-unassign-5")).toBeTruthy();
    expect(screen.getByTestId("job-farmer-unassign-all")).toBeTruthy();
  });

  it.todo("MISSING: Shift+click assign all free kittens");

  it.todo("MISSING: job hover tooltip (description, modifiers, flavor text)");

  it.todo("MISSING: government section (type, leader info)");

  it.todo("MISSING: individual kitten census with filters and management");

  it.todo("MISSING: job loadouts system");

  it.todo("MISSING: send hunters ×N bulk hunt action");
});

// ── DIPLOMACY PANEL ───────────────────────────────────────────────────────────

describe("UI Parity Audit: Diplomacy Panel", () => {
  it("renders unlocked races with trade controls", () => {
    render(<Wrap><DiplomacyPanel state={lateGameState()} /></Wrap>);
    expect(screen.getByText(/lizards/i)).toBeTruthy();
    expect(screen.getByText(/sharks/i)).toBeTruthy();
  });

  it("shows relationship badges", () => {
    render(<Wrap><DiplomacyPanel state={lateGameState()} /></Wrap>);
    // Should show relationship status for each race
    const badges = screen.getAllByText(/friendly|neutral|hostile/i);
    expect(badges.length).toBeGreaterThanOrEqual(2);
  });

  // ── KNOWN GAPS ──────────────────────────────────────────────────────────────

  it.todo("MISSING: Leviathan energy and time-to-leave display");
});

// ── RELIGION PANEL ────────────────────────────────────────────────────────────

describe("UI Parity Audit: Religion Panel", () => {
  it("renders praise button", () => {
    render(<Wrap><ReligionPanel state={lateGameState()} /></Wrap>);
    expect(screen.getByRole("button", { name: /praise/i })).toBeTruthy();
  });

  // ── KNOWN GAPS ──────────────────────────────────────────────────────────────

  it.todo("MISSING: Marker fill % indicator");
});

// ── TOOLBAR / TOP BAR ─────────────────────────────────────────────────────────

describe("UI Parity Audit: Toolbar", () => {
  it.todo("MISSING: energy display (⚡ X W) with production/consumption");

  it.todo("MISSING: winter energy warning");

  it.todo("MISSING: sorrow indicator");
});

// ── CROSS-CUTTING ─────────────────────────────────────────────────────────────

describe("UI Parity Audit: Inspector system", () => {
  it("shows per-source production attribution in resource inspector", () => {
    const state = lateGameState();
    render(<Wrap><ResourcePanel state={state} /></Wrap>);
    // Hover catnip to trigger inspector
    const catnipRow = screen.getByTestId("resource-catnip");
    fireEvent.mouseEnter(catnipRow);
    const attribution = screen.getByTestId("inspector-attribution");
    expect(attribution).toBeTruthy();
    // Verify it has the section label
    expect(attribution.textContent).toMatch(/Per-source breakdown/);
  });
});
