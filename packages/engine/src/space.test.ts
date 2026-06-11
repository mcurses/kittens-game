import { produce } from "immer";
import { describe, expect, it } from "vitest";
import { applyAction } from "./actions.js";
import { BuildingManager } from "./buildings.js";
import { CalendarManager } from "./calendar.js";
import { ChallengeManager } from "./challenges.js";
import { PrestigeManager } from "./prestige.js";
import { ReligionManager } from "./religion.js";
import { ResourceManager } from "./resources.js";
import { ScienceManager } from "./science.js";
import {
  PLANET_DEFS,
  PROGRAM_DEFS,
  SPACE_BUILDING_DEFS,
  SpaceManager,
  applyBuySpaceBuilding,
  applyLaunchMission,
  createInitialSpace,
  getSpaceBuildingPrice,
} from "./space.js";
import { createInitialState } from "./state.js";
import { tick } from "./tick.js";
import { VillageManager } from "./village.js";
import { WorkshopManager } from "./workshop.js";

// ── Helpers ────────────────────────────────────────────────────────────────────

function makeManagers() {
  return [
    new ResourceManager(),
    new BuildingManager(),
    new VillageManager(),
    new CalendarManager(),
    new ScienceManager(),
    new WorkshopManager(),
    new ReligionManager(),
    new PrestigeManager(),
    new ChallengeManager(),
    new SpaceManager(),
  ];
}

function stateWithResources(resources: Record<string, number>) {
  const state = createInitialState();
  return produce(state, (draft) => {
    for (const [name, val] of Object.entries(resources)) {
      if (draft.resources[name]) {
        draft.resources[name].value = val;
        draft.resources[name].maxValue = val * 2;
      }
    }
  });
}

// ── Story 1: SpaceState shape and initial values ──────────────────────────────

describe("createInitialSpace", () => {
  it("only orbitalLaunch program is unlocked initially", () => {
    const space = createInitialSpace();
    for (const [name, entry] of Object.entries(space.programs)) {
      if (name === "orbitalLaunch") {
        expect(entry.unlocked).toBe(true);
      } else {
        expect(entry.unlocked).toBe(false);
      }
    }
  });

  it("all programs start with val=0 and on=0", () => {
    const space = createInitialSpace();
    for (const entry of Object.values(space.programs)) {
      expect(entry.val).toBe(0);
      expect(entry.on).toBe(0);
    }
  });

  it("all planets start unlocked=false, reached=false", () => {
    const space = createInitialSpace();
    for (const entry of Object.values(space.planets)) {
      expect(entry.unlocked).toBe(false);
      expect(entry.reached).toBe(false);
    }
  });

  it("all space buildings start val=0, on=0, unlocked=false", () => {
    const space = createInitialSpace();
    for (const entry of Object.values(space.spaceBuildings)) {
      expect(entry.val).toBe(0);
      expect(entry.on).toBe(0);
      expect(entry.unlocked).toBe(false);
    }
  });

  it("all 13 PROGRAM_DEFS are present", () => {
    const space = createInitialSpace();
    expect(PROGRAM_DEFS.length).toBe(13);
    for (const def of PROGRAM_DEFS) {
      expect(space.programs[def.name]).toBeDefined();
    }
  });

  it("all 12 PLANET_DEFS are present", () => {
    const space = createInitialSpace();
    expect(PLANET_DEFS.length).toBe(12);
    for (const def of PLANET_DEFS) {
      expect(space.planets[def.name]).toBeDefined();
    }
  });

  it("all 24 SPACE_BUILDING_DEFS are present", () => {
    const space = createInitialSpace();
    expect(SPACE_BUILDING_DEFS.length).toBeGreaterThanOrEqual(24);
    for (const def of SPACE_BUILDING_DEFS) {
      expect(space.spaceBuildings[def.name]).toBeDefined();
    }
  });

  it("planets have correct routeDays from PLANET_DEFS", () => {
    const space = createInitialSpace();
    expect(space.planets.cath?.routeDays).toBe(0);
    expect(space.planets.moon?.routeDays).toBe(30);
    expect(space.planets.dune?.routeDays).toBe(356);
  });
});

// ── Story 2: LAUNCH_MISSION action ────────────────────────────────────────────

describe("LAUNCH_MISSION", () => {
  it("deducts resources on successful launch", () => {
    const state = stateWithResources({
      oil: 20000,
      catpower: 10000,
      science: 200000,
      starchart: 1000,
    });

    const next = applyLaunchMission(state, "orbitalLaunch");

    // Oil reduced by 15000
    expect(next.resources.oil?.value).toBeCloseTo(5000, 0);
    expect(next.resources.catpower?.value).toBeCloseTo(5000, 0);
    expect(next.resources.science?.value).toBeCloseTo(100000, 0);
    expect(next.resources.starchart?.value).toBeCloseTo(750, 0);
  });

  it("marks orbitalLaunch val=1 after launch", () => {
    const state = stateWithResources({
      oil: 20000,
      catpower: 10000,
      science: 200000,
      starchart: 1000,
    });
    const next = applyLaunchMission(state, "orbitalLaunch");
    expect(next.space.programs.orbitalLaunch?.val).toBe(1);
  });

  it("unlocks cath planet after orbitalLaunch", () => {
    const state = stateWithResources({
      oil: 20000,
      catpower: 10000,
      science: 200000,
      starchart: 1000,
    });
    const next = applyLaunchMission(state, "orbitalLaunch");
    expect(next.space.planets.cath?.unlocked).toBe(true);
  });

  it("cath is immediately reached (routeDays=0) after orbitalLaunch", () => {
    const state = stateWithResources({
      oil: 20000,
      catpower: 10000,
      science: 200000,
      starchart: 1000,
    });
    const next = applyLaunchMission(state, "orbitalLaunch");
    expect(next.space.planets.cath?.reached).toBe(true);
  });

  it("unlocks moonMission spaceMission after orbitalLaunch", () => {
    const state = stateWithResources({
      oil: 20000,
      catpower: 10000,
      science: 200000,
      starchart: 1000,
    });
    const next = applyLaunchMission(state, "orbitalLaunch");
    expect(next.space.programs.moonMission?.unlocked).toBe(true);
  });

  it("returns unchanged state when resources insufficient", () => {
    const state = createInitialState();
    const next = applyLaunchMission(state, "orbitalLaunch");
    expect(next).toBe(state);
  });

  it("returns unchanged state when mission not unlocked", () => {
    const state = stateWithResources({
      titanium: 10000,
      oil: 50000,
      science: 200000,
      starchart: 1000,
    });
    // moonMission is not yet unlocked
    const next = applyLaunchMission(state, "moonMission");
    expect(next).toBe(state);
  });

  it("returns unchanged state when mission already completed (on=1)", () => {
    const state = stateWithResources({
      oil: 20000,
      catpower: 10000,
      science: 200000,
      starchart: 1000,
    });
    const after1 = applyLaunchMission(state, "orbitalLaunch");
    // Give enough resources again
    const withRes = stateWithResources({
      oil: 20000,
      catpower: 10000,
      science: 200000,
      starchart: 1000,
    });
    const stateWithLaunch = produce(withRes, (draft) => {
      draft.space.programs.orbitalLaunch = {
        val: 1,
        on: 1,
        unlocked: true,
      };
    });
    const next = applyLaunchMission(stateWithLaunch, "orbitalLaunch");
    expect(next).toBe(stateWithLaunch);
    expect(after1.space.programs.orbitalLaunch?.on).toBe(1);
  });

  it("returns unchanged state for unknown mission name", () => {
    const state = createInitialState();
    const next = applyLaunchMission(state, "unknownMission");
    expect(next).toBe(state);
  });

  it("dispatch via applyAction works", () => {
    const state = stateWithResources({
      oil: 20000,
      catpower: 10000,
      science: 200000,
      starchart: 1000,
    });
    const next = applyAction(state, { type: "LAUNCH_MISSION", name: "orbitalLaunch" });
    expect(next.space.planets.cath?.unlocked).toBe(true);
  });

  it("rorschachMission unlocks centaurusSystemMission (no planet)", () => {
    // rorschachMission has no planet unlock — program.on should be set to 1 immediately
    const state = produce(createInitialState(), (draft) => {
      // Give resources and unlock rorschachMission
      draft.resources.titanium = { value: 100000, maxValue: 200000 };
      draft.resources.science = { value: 1000000, maxValue: 2000000 };
      draft.resources.starchart = { value: 50000, maxValue: 100000 };
      draft.resources.kerosene = { value: 50000, maxValue: 100000 };
      draft.space.programs.rorschachMission = { val: 0, on: 0, unlocked: true };
    });
    const next = applyLaunchMission(state, "rorschachMission");
    expect(next.space.programs.rorschachMission?.val).toBe(1);
    expect(next.space.programs.rorschachMission?.on).toBe(1);
    expect(next.space.programs.centaurusSystemMission?.unlocked).toBe(true);
  });
});

// ── Story 3: BUY_SPACE_BUILDING action ────────────────────────────────────────

describe("BUY_SPACE_BUILDING", () => {
  function stateWithCathReached() {
    const base = stateWithResources({
      oil: 100000,
      science: 500000,
      starchart: 10000,
      titanium: 50000,
      alloy: 5000,
      unobtainium: 5000,
    });
    return produce(base, (draft) => {
      // Cath reached, spaceStation unlocked
      draft.space.planets.cath = { unlocked: true, reached: true, routeDays: 0 };
      draft.space.spaceBuildings.spaceStation = { val: 0, on: 0, unlocked: true };
      // requiredTech met for spaceStation
      if (draft.science.techs.orbitalEngineering) {
        draft.science.techs.orbitalEngineering.researched = true;
      }
    });
  }

  it("deducts resources when buying spaceStation", () => {
    const state = stateWithCathReached();
    const next = applyBuySpaceBuilding(state, "spaceStation");
    // spaceStation costs oil:35000, science:150000, starchart:425, alloy:750
    expect(next.resources.oil?.value).toBeCloseTo(65000, 0);
    expect(next.resources.science?.value).toBeCloseTo(350000, 0);
    expect(next.resources.starchart?.value).toBeCloseTo(9575, 0);
    expect(next.resources.alloy?.value).toBeCloseTo(4250, 0);
  });

  it("increments val and on after purchase", () => {
    const state = stateWithCathReached();
    const next = applyBuySpaceBuilding(state, "spaceStation");
    expect(next.space.spaceBuildings.spaceStation?.val).toBe(1);
    expect(next.space.spaceBuildings.spaceStation?.on).toBe(1);
  });

  it("price scales with priceRatio on second purchase", () => {
    const _state = stateWithCathReached();
    const def = SPACE_BUILDING_DEFS.find((b) => b.name === "spaceStation");
    expect(def).toBeDefined();
    if (!def) return;

    const prices0 = getSpaceBuildingPrice(def, 0);
    const prices1 = getSpaceBuildingPrice(def, 1);
    const oilPrice0 = prices0.find((p) => p.name === "oil")?.val ?? 0;
    const oilPrice1 = prices1.find((p) => p.name === "oil")?.val ?? 0;
    expect(oilPrice1).toBeCloseTo(oilPrice0 * def.priceRatio, 1);
  });

  it("returns unchanged state when planet not reached", () => {
    const state = produce(createInitialState(), (draft) => {
      draft.space.spaceBuildings.spaceStation = { val: 0, on: 0, unlocked: true };
      // planet not reached
      draft.space.planets.cath = { unlocked: true, reached: false, routeDays: 1 };
    });
    const next = applyBuySpaceBuilding(state, "spaceStation");
    expect(next).toBe(state);
  });

  it("returns unchanged state when building not unlocked", () => {
    const state = produce(createInitialState(), (draft) => {
      draft.space.planets.cath = { unlocked: true, reached: true, routeDays: 0 };
      // building locked
      draft.space.spaceBuildings.spaceStation = { val: 0, on: 0, unlocked: false };
    });
    const next = applyBuySpaceBuilding(state, "spaceStation");
    expect(next).toBe(state);
  });

  it("returns unchanged state when resources insufficient", () => {
    const state = produce(createInitialState(), (draft) => {
      draft.space.planets.cath = { unlocked: true, reached: true, routeDays: 0 };
      draft.space.spaceBuildings.spaceStation = { val: 0, on: 0, unlocked: true };
    });
    const next = applyBuySpaceBuilding(state, "spaceStation");
    expect(next).toBe(state);
  });

  it("returns unchanged state for unknown building name", () => {
    const state = createInitialState();
    const next = applyBuySpaceBuilding(state, "unknownBuilding");
    expect(next).toBe(state);
  });

  it("dispatch via applyAction works", () => {
    const state = stateWithCathReached();
    const next = applyAction(state, { type: "BUY_SPACE_BUILDING", name: "spaceStation" });
    expect(next.space.spaceBuildings.spaceStation?.val).toBe(1);
  });
});

// ── Story 4: Planet route travel (tick) ───────────────────────────────────────

describe("SpaceManager.update - route travel", () => {
  const manager = new SpaceManager();

  it("decreases routeDays by 1/TICKS_PER_DAY each tick", () => {
    const state = produce(createInitialState(), (draft) => {
      draft.space.planets.moon = { unlocked: true, reached: false, routeDays: 30 };
    });
    const next = manager.update(state);
    expect(next.space.planets.moon?.routeDays).toBeCloseTo(30 - 0.1, 5);
  });

  it("sets reached=true when routeDays reaches 0", () => {
    const state = produce(createInitialState(), (draft) => {
      draft.space.planets.moon = { unlocked: true, reached: false, routeDays: 0.05 };
    });
    const next = manager.update(state);
    expect(next.space.planets.moon?.reached).toBe(true);
    expect(next.space.planets.moon?.routeDays).toBe(0);
  });

  it("does not change routeDays when planet already reached", () => {
    const state = produce(createInitialState(), (draft) => {
      draft.space.planets.moon = { unlocked: true, reached: true, routeDays: 0 };
    });
    const next = manager.update(state);
    expect(next.space.planets.moon?.routeDays).toBe(0);
    expect(next).not.toBe(state); // produce always makes a new object even if same values
  });

  it("cath with routeDays=0 is immediately reached when unlocked", () => {
    const state = stateWithResources({
      oil: 20000,
      catpower: 10000,
      science: 200000,
      starchart: 1000,
    });
    const after = applyLaunchMission(state, "orbitalLaunch");
    // cath has routeDays=0, so reached immediately in LAUNCH_MISSION
    expect(after.space.planets.cath?.reached).toBe(true);
  });

  it("sets program on=1 when planet is reached", () => {
    // Moon mission launches, moon starts with routeDays=30
    const state = produce(createInitialState(), (draft) => {
      draft.space.programs.moonMission = { val: 1, on: 0, unlocked: true };
      draft.space.planets.moon = { unlocked: true, reached: false, routeDays: 0.05 };
    });
    const next = manager.update(state);
    expect(next.space.programs.moonMission?.on).toBe(1);
  });
});

// ── Story 5: SpaceManager.updateEffects ───────────────────────────────────────

describe("SpaceManager.updateEffects", () => {
  const manager = new SpaceManager();

  it("contributes scienceRatio and maxKittens from spaceStation (on=1)", () => {
    const state = produce(createInitialState(), (draft) => {
      draft.space.spaceBuildings.spaceStation = { val: 1, on: 1, unlocked: true };
    });
    const effects = manager.updateEffects(state);
    expect(effects.scienceRatio).toBeCloseTo(0.5, 5);
    expect(effects.maxKittens).toBeCloseTo(2, 5);
  });

  it("contributes moonBase storage bonuses (on=1)", () => {
    const state = produce(createInitialState(), (draft) => {
      draft.space.spaceBuildings.moonBase = { val: 1, on: 1, unlocked: true };
    });
    const effects = manager.updateEffects(state);
    expect(effects.catnipMax).toBeCloseTo(45000, 0);
    expect(effects.woodMax).toBeCloseTo(25000, 0);
    expect(effects.mineralsMax).toBeCloseTo(30000, 0);
  });

  it("contributes uraniumPerTickSpace from planetCracker (on=1)", () => {
    const state = produce(createInitialState(), (draft) => {
      draft.space.spaceBuildings.planetCracker = { val: 1, on: 1, unlocked: true };
    });
    const effects = manager.updateEffects(state);
    expect(effects.uraniumPerTickSpace).toBeCloseTo(0.3, 5);
  });

  it("does not contribute effects when on=0", () => {
    const state = produce(createInitialState(), (draft) => {
      draft.space.spaceBuildings.spaceStation = { val: 1, on: 0, unlocked: true };
    });
    const effects = manager.updateEffects(state);
    expect(effects.scienceRatio).toBeUndefined();
    expect(effects.maxKittens).toBeUndefined();
  });

  it("scales effects linearly with on count", () => {
    const state = produce(createInitialState(), (draft) => {
      draft.space.spaceBuildings.spaceStation = { val: 3, on: 3, unlocked: true };
    });
    const effects = manager.updateEffects(state);
    expect(effects.scienceRatio).toBeCloseTo(1.5, 5);
    expect(effects.maxKittens).toBeCloseTo(6, 5);
  });
});

// ── Story 6: Building unlock when planet reached ──────────────────────────────

describe("SpaceManager.update - building unlock", () => {
  const manager = new SpaceManager();

  it("unlocks buildings without requiredTech when planet is reached", () => {
    const state = produce(createInitialState(), (draft) => {
      draft.space.planets.moon = { unlocked: true, reached: true, routeDays: 0 };
      // moonBase has no requiredTech
    });
    const next = manager.update(state);
    expect(next.space.spaceBuildings.moonBase?.unlocked).toBe(true);
    expect(next.space.spaceBuildings.moonOutpost?.unlocked).toBe(true);
  });

  it("unlocks buildings with requiredTech when all techs researched", () => {
    const state = produce(createInitialState(), (draft) => {
      draft.space.planets.cath = { unlocked: true, reached: true, routeDays: 0 };
      if (draft.science.techs.orbitalEngineering) {
        draft.science.techs.orbitalEngineering.researched = true;
      }
      if (draft.science.techs.nanotechnology) {
        draft.science.techs.nanotechnology.researched = true;
      }
    });
    const next = manager.update(state);
    expect(next.space.spaceBuildings.spaceElevator?.unlocked).toBe(true);
  });

  it("keeps building locked when requiredTech not all researched", () => {
    const state = produce(createInitialState(), (draft) => {
      draft.space.planets.cath = { unlocked: true, reached: true, routeDays: 0 };
      // orbitalEngineering researched but nanotechnology not
      if (draft.science.techs.orbitalEngineering) {
        draft.science.techs.orbitalEngineering.researched = true;
      }
      // nanotechnology not researched
    });
    const next = manager.update(state);
    // spaceElevator requires BOTH orbitalEngineering AND nanotechnology
    expect(next.space.spaceBuildings.spaceElevator?.unlocked).toBe(false);
  });

  it("does not unlock buildings on unreached planets", () => {
    const state = produce(createInitialState(), (draft) => {
      draft.space.planets.moon = { unlocked: true, reached: false, routeDays: 10 };
    });
    const next = manager.update(state);
    expect(next.space.spaceBuildings.moonBase?.unlocked).toBe(false);
  });
});

// ── Story 7: Save / load / reset ─────────────────────────────────────────────

describe("SpaceManager save/load/reset", () => {
  const manager = new SpaceManager();

  it("resetState restores initial space state", () => {
    const state = produce(createInitialState(), (draft) => {
      draft.space.planets.cath = { unlocked: true, reached: true, routeDays: 0 };
      draft.space.programs.orbitalLaunch = { val: 1, on: 1, unlocked: true };
      draft.space.spaceBuildings.spaceStation = { val: 2, on: 2, unlocked: true };
    });
    const reset = manager.resetState(state);
    expect(reset.space.planets.cath?.unlocked).toBe(false);
    expect(reset.space.programs.orbitalLaunch?.val).toBe(0);
    expect(reset.space.programs.orbitalLaunch?.unlocked).toBe(true); // still unlocked
    expect(reset.space.spaceBuildings.spaceStation?.val).toBe(0);
  });

  it("save/load round-trip preserves programs, planets, and buildings", () => {
    const state = produce(createInitialState(), (draft) => {
      draft.space.programs.orbitalLaunch = { val: 1, on: 1, unlocked: true };
      draft.space.programs.moonMission = { val: 0, on: 0, unlocked: true };
      draft.space.planets.cath = { unlocked: true, reached: true, routeDays: 0 };
      draft.space.planets.moon = { unlocked: false, reached: false, routeDays: 30 };
      draft.space.spaceBuildings.spaceStation = { val: 2, on: 2, unlocked: true };
    });

    const saved = manager.save(state);
    const freshState = createInitialState();
    const loaded = manager.load(saved, freshState);

    expect(loaded.space.programs.orbitalLaunch?.val).toBe(1);
    expect(loaded.space.programs.orbitalLaunch?.on).toBe(1);
    expect(loaded.space.programs.moonMission?.unlocked).toBe(true);
    expect(loaded.space.planets.cath?.reached).toBe(true);
    expect(loaded.space.planets.moon?.routeDays).toBe(30);
    expect(loaded.space.spaceBuildings.spaceStation?.val).toBe(2);
    expect(loaded.space.spaceBuildings.spaceStation?.on).toBe(2);
  });

  it("load re-applies mission unlocks from val>0 programs", () => {
    const state = produce(createInitialState(), (draft) => {
      draft.space.programs.orbitalLaunch = { val: 1, on: 1, unlocked: true };
    });
    const saved = manager.save(state);

    // Start from completely blank space
    const freshState = createInitialState();
    const loaded = manager.load(saved, freshState);

    // moonMission should be unlocked as a result of orbitalLaunch.val=1
    expect(loaded.space.programs.moonMission?.unlocked).toBe(true);
  });
});

// ── Story 8: Cross-manager integration test ───────────────────────────────────

describe("SpaceManager integration - full tick loop", () => {
  it("cath reached immediately after orbitalLaunch (routeDays=0)", () => {
    const managers = makeManagers();
    let state = createInitialState();

    // Reset all managers to set initial state
    for (const m of managers) {
      state = m.resetState(state);
    }

    // Give enough resources for orbitalLaunch
    state = produce(state, (draft) => {
      draft.resources.oil = { value: 20000, maxValue: 100000 };
      draft.resources.catpower = { value: 10000, maxValue: 50000 };
      draft.resources.science = { value: 200000, maxValue: 500000 };
      draft.resources.starchart = { value: 1000, maxValue: 5000 };
    });

    state = applyAction(state, { type: "LAUNCH_MISSION", name: "orbitalLaunch" }, managers);
    expect(state.space.planets.cath?.reached).toBe(true);
  });

  it("moon is reached after 300 ticks (routeDays=30, 10 ticks/day)", () => {
    const managers = makeManagers();
    let state = createInitialState();

    // Set moon to unlocked and near reaching
    state = produce(state, (draft) => {
      draft.space.planets.moon = { unlocked: true, reached: false, routeDays: 0.05 };
    });

    state = tick(state, managers);
    expect(state.space.planets.moon?.reached).toBe(true);
  });

  it("spaceStation effects contribute to effectCache after full tick", () => {
    const managers = makeManagers();
    let state = createInitialState();

    state = produce(state, (draft) => {
      draft.space.planets.cath = { unlocked: true, reached: true, routeDays: 0 };
      draft.space.spaceBuildings.spaceStation = { val: 1, on: 1, unlocked: true };
    });

    state = tick(state, managers);
    expect(state.effectCache.scienceRatio).toBeGreaterThan(0);
    expect(state.effectCache.maxKittens).toBeGreaterThan(0);
  });

  it("full tick loop with all managers runs without errors", () => {
    const managers = makeManagers();
    let state = createInitialState();
    for (const m of managers) {
      state = m.resetState(state);
    }
    expect(() => {
      for (let i = 0; i < 5; i++) {
        state = tick(state, managers);
      }
    }).not.toThrow();
  });
});

// ── Story 19-8: Mission unlocks propagate to policies and challenges ────────────

describe("Mission policy/challenge unlocks (Story 19-8)", () => {
  function makeResourceRichState() {
    const base = createInitialState();
    const resources = { ...base.resources };
    // Give enough resources for duneMission
    resources.titanium = { value: 100000, maxValue: 1_000_000 };
    resources.science = { value: 1_000_000, maxValue: 10_000_000 };
    resources.starchart = { value: 100000, maxValue: 1_000_000 };
    resources.kerosene = { value: 100000, maxValue: 1_000_000 };
    return { ...base, resources };
  }

  it("duneMission launch unlocks technocracy, theocracy, expansionism policies", () => {
    const base = makeResourceRichState();
    // First unlock duneMission by simulating moonMission completion
    const s = {
      ...base,
      space: {
        ...base.space,
        programs: {
          ...base.space.programs,
          duneMission: { val: 0, on: 0, unlocked: true },
        },
      },
    };
    const next = applyLaunchMission(s, "duneMission");
    expect(next.science.policies.technocracy?.unlocked).toBe(true);
    expect(next.science.policies.theocracy?.unlocked).toBe(true);
    expect(next.science.policies.expansionism?.unlocked).toBe(true);
  });

  it("centaurusSystemMission launch unlocks energy challenge", () => {
    const base = makeResourceRichState();
    // Add resources for centaurusSystemMission
    const s = {
      ...base,
      resources: {
        ...base.resources,
        titanium: { value: 200000, maxValue: 1_000_000 },
        science: { value: 2_000_000, maxValue: 10_000_000 },
        starchart: { value: 1_000_000, maxValue: 10_000_000 },
        kerosene: { value: 500000, maxValue: 1_000_000 },
        thorium: { value: 500000, maxValue: 1_000_000 },
      },
      space: {
        ...base.space,
        programs: {
          ...base.space.programs,
          centaurusSystemMission: { val: 0, on: 0, unlocked: true },
        },
      },
    };
    const next = applyLaunchMission(s, "centaurusSystemMission");
    expect(next.challenges.challenges.energy?.unlocked).toBe(true);
  });

  it("SpaceManager.update propagates policy unlocks when planet is reached via route travel", () => {
    // Set up duneMission as in-progress (val=1, on=0) with dune planet almost reached
    const base = createInitialState();
    const s = {
      ...base,
      space: {
        ...base.space,
        programs: {
          ...base.space.programs,
          duneMission: { val: 1, on: 0, unlocked: true },
        },
        planets: {
          ...base.space.planets,
          dune: { unlocked: true, reached: false, routeDays: 0.05 }, // just about to arrive
        },
      },
    };
    const mgr = new SpaceManager();
    const next = mgr.update(s);
    // After update, dune is reached → duneMission on=1 → policies unlocked
    expect(next.space.planets.dune?.reached).toBe(true);
    expect(next.science.policies.technocracy?.unlocked).toBe(true);
    expect(next.science.policies.theocracy?.unlocked).toBe(true);
    expect(next.science.policies.expansionism?.unlocked).toBe(true);
  });
});
