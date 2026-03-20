import { describe, expect, it } from "vitest";
import { buildEffectCache } from "./effects.js";
import { type GameState, createInitialState } from "./state.js";
import {
  CFU_DEFS,
  VSU_DEFS,
  TimeManager,
  applyBuyCfu,
  applyBuyVsu,
  applyShatterTc,
  createInitialTime,
} from "./time.js";
import { TICKS_PER_DAY, DAYS_PER_SEASON, SEASONS_PER_YEAR } from "./calendar.js";

// ── Helper ─────────────────────────────────────────────────────────────────────

function stateWithResources(overrides: Record<string, number>): GameState {
  const base = createInitialState();
  const resources = { ...base.resources };
  for (const [name, val] of Object.entries(overrides)) {
    resources[name] = { value: val, maxValue: Math.max(val * 10, 1_000_000) };
  }
  return { ...base, resources };
}

// ── Story 1: TimeState shape and initial values ────────────────────────────────

describe("createInitialTime", () => {
  it("heat=0, flux=0", () => {
    const t = createInitialTime();
    expect(t.heat).toBe(0);
    expect(t.flux).toBe(0);
  });

  it("temporalBattery, blastFurnace, temporalAccelerator are unlocked", () => {
    const t = createInitialTime();
    expect(t.cfus.temporalBattery?.unlocked).toBe(true);
    expect(t.cfus.blastFurnace?.unlocked).toBe(true);
    expect(t.cfus.temporalAccelerator?.unlocked).toBe(true);
  });

  it("all 8 CFUs are present", () => {
    const t = createInitialTime();
    expect(Object.keys(t.cfus)).toHaveLength(CFU_DEFS.length);
    expect(CFU_DEFS).toHaveLength(8);
  });

  it("all 6 VSUs are present", () => {
    const t = createInitialTime();
    expect(Object.keys(t.vsus)).toHaveLength(VSU_DEFS.length);
    expect(VSU_DEFS).toHaveLength(6);
  });

  it("blastFurnace has heat=0", () => {
    const t = createInitialTime();
    expect(t.cfus.blastFurnace?.heat).toBe(0);
  });
});

// ── Story 2: BUY_CFU action ────────────────────────────────────────────────────

describe("applyBuyCfu", () => {
  it("deducts resources and increments val/on on success", () => {
    const s = stateWithResources({ timeCrystal: 100 });
    const next = applyBuyCfu(s, "temporalBattery");
    expect(next.time.cfus.temporalBattery?.val).toBe(1);
    expect(next.time.cfus.temporalBattery?.on).toBe(1);
    // price = 5 timeCrystal for first purchase
    expect(next.resources.timeCrystal?.value).toBe(95);
  });

  it("price scales by priceRatio^count", () => {
    // First buy: 5 * 1.25^0 = 5
    const s1 = stateWithResources({ timeCrystal: 1000 });
    const s2 = applyBuyCfu(s1, "temporalBattery");
    const cost1 = 1000 - (s2.resources.timeCrystal?.value ?? 0);
    expect(cost1).toBeCloseTo(5);

    // Second buy: 5 * 1.25^1 = 6.25
    const s3 = applyBuyCfu(s2, "temporalBattery");
    const cost2 = (s2.resources.timeCrystal?.value ?? 0) - (s3.resources.timeCrystal?.value ?? 0);
    expect(cost2).toBeCloseTo(6.25);
  });

  it("state unchanged if insufficient resources", () => {
    const s = stateWithResources({ timeCrystal: 1 });
    // temporalBattery costs 5
    const next = applyBuyCfu(s, "temporalBattery");
    expect(next).toBe(s);
  });

  it("state unchanged if CFU not unlocked", () => {
    const s = stateWithResources({ timeCrystal: 100000 });
    // timeBoiler is not unlocked initially
    const next = applyBuyCfu(s, "timeBoiler");
    expect(next).toBe(s);
  });
});

// ── Story 3: BUY_VSU action ────────────────────────────────────────────────────

describe("applyBuyVsu", () => {
  it("deducts resources and increments val/on on success", () => {
    // First unlock the voidRift VSU by setting unlocked=true in state
    const base = createInitialState();
    const s = {
      ...base,
      resources: {
        ...base.resources,
        void: { value: 200, maxValue: 10000 },
      },
      time: {
        ...base.time,
        vsus: {
          ...base.time.vsus,
          voidRift: { val: 0, on: 0, unlocked: true },
        },
      },
    };
    const next = applyBuyVsu(s, "voidRift");
    expect(next.time.vsus.voidRift?.val).toBe(1);
    expect(next.time.vsus.voidRift?.on).toBe(1);
    // price = 75 void for first purchase
    expect(next.resources.void?.value).toBe(125);
  });

  it("state unchanged if VSU not unlocked", () => {
    const s = stateWithResources({ void: 1000000 });
    // voidRift is not unlocked initially
    const next = applyBuyVsu(s, "voidRift");
    expect(next).toBe(s);
  });

  it("price scales by priceRatio^count", () => {
    const base = createInitialState();
    const s = {
      ...base,
      resources: {
        ...base.resources,
        void: { value: 1_000_000, maxValue: 10_000_000 },
      },
      time: {
        ...base.time,
        vsus: {
          ...base.time.vsus,
          voidRift: { val: 0, on: 0, unlocked: true },
        },
      },
    };
    const s2 = applyBuyVsu(s, "voidRift");
    const cost1 = 1_000_000 - (s2.resources.void?.value ?? 0);
    expect(cost1).toBeCloseTo(75); // 75 * 1.3^0

    const s3 = applyBuyVsu(s2, "voidRift");
    const cost2 = (s2.resources.void?.value ?? 0) - (s3.resources.void?.value ?? 0);
    expect(cost2).toBeCloseTo(97.5); // 75 * 1.3^1
  });
});

// ── Story 4: Heat mechanics (tick) ────────────────────────────────────────────

describe("TimeManager.update (heat)", () => {
  it("heat decreases by heatPerTick each tick", () => {
    const base = createInitialState();
    const s: GameState = {
      ...base,
      effectCache: { ...base.effectCache, heatPerTick: 0.5 },
      time: { ...base.time, heat: 10 },
    };
    const mgr = new TimeManager();
    const next = mgr.update(s);
    expect(next.time.heat).toBeCloseTo(9.5);
  });

  it("blastFurnace.heat increases by transferred amount", () => {
    const base = createInitialState();
    const s: GameState = {
      ...base,
      effectCache: { ...base.effectCache, heatPerTick: 0.5 },
      time: { ...base.time, heat: 10 },
    };
    const mgr = new TimeManager();
    const next = mgr.update(s);
    expect(next.time.cfus.blastFurnace?.heat).toBeCloseTo(0.5);
  });

  it("heat never goes below 0", () => {
    const base = createInitialState();
    const s: GameState = {
      ...base,
      effectCache: { ...base.effectCache, heatPerTick: 5 },
      time: { ...base.time, heat: 1 },
    };
    const mgr = new TimeManager();
    const next = mgr.update(s);
    expect(next.time.heat).toBe(0);
  });

  it("isAccelerated becomes false when heat reaches 0", () => {
    const base = createInitialState();
    const s: GameState = {
      ...base,
      effectCache: { ...base.effectCache, heatPerTick: 5 },
      time: { ...base.time, heat: 1, isAccelerated: true },
    };
    const mgr = new TimeManager();
    const next = mgr.update(s);
    expect(next.time.isAccelerated).toBe(false);
  });
});

// ── Story 5: SHATTER_TC action ────────────────────────────────────────────────

describe("applyShatterTc", () => {
  it("reduces blastFurnace heat by 100 on success", () => {
    const base = createInitialState();
    const s: GameState = {
      ...base,
      time: {
        ...base.time,
        cfus: {
          ...base.time.cfus,
          blastFurnace: { val: 1, on: 1, unlocked: true, heat: 150 },
        },
      },
    };
    const next = applyShatterTc(s);
    expect(next.time.cfus.blastFurnace?.heat).toBe(50);
  });

  it("increments calendar year by 1", () => {
    const base = createInitialState();
    const s: GameState = {
      ...base,
      time: {
        ...base.time,
        cfus: {
          ...base.time.cfus,
          blastFurnace: { val: 1, on: 1, unlocked: true, heat: 100 },
        },
      },
    };
    const next = applyShatterTc(s);
    expect(next.calendar.year).toBe(1);
  });

  it("increments flux by 1", () => {
    const base = createInitialState();
    const s: GameState = {
      ...base,
      time: {
        ...base.time,
        cfus: {
          ...base.time.cfus,
          blastFurnace: { val: 1, on: 1, unlocked: true, heat: 100 },
        },
      },
    };
    const next = applyShatterTc(s);
    expect(next.time.flux).toBe(1);
  });

  it("state unchanged if blastFurnace.on = 0", () => {
    const base = createInitialState();
    const s: GameState = {
      ...base,
      time: {
        ...base.time,
        cfus: {
          ...base.time.cfus,
          blastFurnace: { val: 1, on: 0, unlocked: true, heat: 200 },
        },
      },
    };
    expect(applyShatterTc(s)).toBe(s);
  });

  it("state unchanged if heat < 100", () => {
    const base = createInitialState();
    const s: GameState = {
      ...base,
      time: {
        ...base.time,
        cfus: {
          ...base.time.cfus,
          blastFurnace: { val: 1, on: 1, unlocked: true, heat: 99 },
        },
      },
    };
    expect(applyShatterTc(s)).toBe(s);
  });
});

// ── Story 6: TimeManager.updateEffects ────────────────────────────────────────

describe("TimeManager.updateEffects", () => {
  it("temporalBattery (val=1, on=1) contributes temporalFluxMax += 750", () => {
    const base = createInitialState();
    const s: GameState = {
      ...base,
      time: {
        ...base.time,
        cfus: {
          ...base.time.cfus,
          temporalBattery: { val: 1, on: 1, unlocked: true, heat: 0 },
        },
      },
    };
    const mgr = new TimeManager();
    const effects = mgr.updateEffects(s);
    // Base 3000 + temporalBattery 750 = 3750
    expect(effects.temporalFluxMax).toBe(3750);
  });

  it("blastFurnace (val=1, on=1) contributes heatPerTick += 0.02, heatMax += 100", () => {
    const base = createInitialState();
    const s: GameState = {
      ...base,
      time: {
        ...base.time,
        cfus: {
          ...base.time.cfus,
          blastFurnace: { val: 1, on: 1, unlocked: true, heat: 0 },
        },
      },
    };
    const mgr = new TimeManager();
    const effects = mgr.updateEffects(s);
    // Base heatPerTick 0.01 + blastFurnace 0.02 = 0.03
    expect(effects.heatPerTick).toBeCloseTo(0.03);
    // Base heatMax 100 + blastFurnace 100 = 200
    expect(effects.heatMax).toBe(200);
  });

  it("voidRift (val=1, on=1) contributes umbraBoostRatio += 0.1, globalResourceRatio += 0.02", () => {
    const base = createInitialState();
    const s: GameState = {
      ...base,
      time: {
        ...base.time,
        vsus: {
          ...base.time.vsus,
          voidRift: { val: 1, on: 1, unlocked: true },
        },
      },
    };
    const mgr = new TimeManager();
    const effects = mgr.updateEffects(s);
    expect(effects.umbraBoostRatio).toBeCloseTo(0.1);
    expect(effects.globalResourceRatio).toBeCloseTo(0.02);
  });

  it("CFU with on=0 does not contribute upgrade effects (base effects still present)", () => {
    const base = createInitialState();
    const s: GameState = {
      ...base,
      time: {
        ...base.time,
        cfus: {
          ...base.time.cfus,
          temporalBattery: { val: 3, on: 0, unlocked: true, heat: 0 },
        },
      },
    };
    const mgr = new TimeManager();
    const effects = mgr.updateEffects(s);
    // temporalBattery on=0 → no upgrade effect; base temporalFluxMax = 3000
    expect(effects.temporalFluxMax).toBe(3000);
  });

  it("base effects present with zero CFUs/VSUs", () => {
    const base = createInitialState();
    const mgr = new TimeManager();
    const effects = mgr.updateEffects(base);
    expect(effects.heatPerTick).toBe(0.01); // base only
    expect(effects.heatMax).toBe(100); // base only
    expect(effects.temporalFluxMax).toBe(3000); // base only
  });
});

// ── Story 7: CFU unlock propagation ───────────────────────────────────────────

describe("CFU unlock propagation", () => {
  it("blastFurnace purchased => timeBoiler becomes unlocked", () => {
    const s = stateWithResources({ timeCrystal: 100000, relic: 100 });
    const next = applyBuyCfu(s, "blastFurnace");
    expect(next.time.cfus.timeBoiler?.unlocked).toBe(true);
  });

  it("temporalAccelerator purchased => temporalImpedance becomes unlocked", () => {
    const s = stateWithResources({ timeCrystal: 100000, relic: 100000 });
    const next = applyBuyCfu(s, "temporalAccelerator");
    expect(next.time.cfus.temporalImpedance?.unlocked).toBe(true);
  });
});

// ── Story 8: Save / load / reset ─────────────────────────────────────────────

describe("TimeManager save/load/reset", () => {
  const mgr = new TimeManager();

  it("save and load round-trip preserves CFU vals and heat", () => {
    const base = createInitialState();
    const s: GameState = {
      ...base,
      time: {
        ...base.time,
        heat: 42,
        flux: 7,
        cfus: {
          ...base.time.cfus,
          blastFurnace: { val: 2, on: 2, unlocked: true, heat: 99 },
        },
      },
    };
    const saved = mgr.save(s);
    const loaded = mgr.load(saved, createInitialState());
    expect(loaded.time.heat).toBe(42);
    expect(loaded.time.flux).toBe(7);
    expect(loaded.time.cfus.blastFurnace?.val).toBe(2);
    expect(loaded.time.cfus.blastFurnace?.heat).toBe(99);
  });

  it("after soft reset, heat=0, flux=0, all vals reset", () => {
    const base = createInitialState();
    const s: GameState = {
      ...base,
      time: {
        ...base.time,
        heat: 99,
        flux: 5,
        cfus: {
          ...base.time.cfus,
          blastFurnace: { val: 3, on: 3, unlocked: true, heat: 200 },
        },
      },
    };
    const reset = mgr.resetState(s);
    expect(reset.time.heat).toBe(0);
    expect(reset.time.flux).toBe(0);
    expect(reset.time.cfus.blastFurnace?.val).toBe(0);
    expect(reset.time.cfus.blastFurnace?.heat).toBe(0);
  });

  it("load with blastFurnace val>0 re-unlocks timeBoiler", () => {
    const base = createInitialState();
    const s: GameState = {
      ...base,
      time: {
        ...base.time,
        cfus: {
          ...base.time.cfus,
          blastFurnace: { val: 1, on: 1, unlocked: true, heat: 0 },
        },
      },
    };
    const saved = mgr.save(s);
    const loaded = mgr.load(saved, createInitialState());
    expect(loaded.time.cfus.timeBoiler?.unlocked).toBe(true);
  });
});

// ── Story 9: Cross-manager integration test ───────────────────────────────────

describe("TimeManager integration", () => {
  it("heat=100 + blastFurnace.on=1 => SHATTER_TC advances calendar year", () => {
    const base = createInitialState();
    const s: GameState = {
      ...base,
      time: {
        ...base.time,
        cfus: {
          ...base.time.cfus,
          blastFurnace: { val: 1, on: 1, unlocked: true, heat: 100 },
        },
      },
    };
    const next = applyShatterTc(s);
    expect(next.calendar.year).toBe(1);
  });

  it("5 ticks with TimeManager produce no errors", () => {
    const mgr = new TimeManager();
    let s: GameState = {
      ...createInitialState(),
      time: {
        ...createInitialTime(),
        heat: 50,
        cfus: {
          ...createInitialTime().cfus,
          blastFurnace: { val: 1, on: 1, unlocked: true, heat: 0 },
        },
      },
    };
    for (let i = 0; i < 5; i++) {
      s = mgr.update(s);
    }
    expect(s.time.heat).toBeGreaterThanOrEqual(0);
  });

  it("temporalBattery (on=1) => effectCache includes temporalFluxMax after tick", () => {
    const mgr = new TimeManager();
    const s: GameState = {
      ...createInitialState(),
      time: {
        ...createInitialTime(),
        cfus: {
          ...createInitialTime().cfus,
          temporalBattery: { val: 1, on: 1, unlocked: true, heat: 0 },
        },
      },
    };
    const cache = buildEffectCache([mgr], s);
    // Base 3000 + temporalBattery 750 = 3750
    expect(cache.temporalFluxMax).toBe(3750);
  });
});

// ── Story 19-1: Shatter produces resources ─────────────────────────────────────

describe("applyShatterTc — resource production (Story 19-1)", () => {
  const TICKS_PER_YEAR = TICKS_PER_DAY * DAYS_PER_SEASON * SEASONS_PER_YEAR; // 4000

  function shatterState(extraEffects: Record<string, number>): GameState {
    const base = createInitialState();
    return {
      ...base,
      effectCache: { ...base.effectCache, ...extraEffects },
      resources: {
        ...base.resources,
        catnip: { value: 0, maxValue: 1_000_000 },
        wood: { value: 0, maxValue: 1_000_000 },
        minerals: { value: 0, maxValue: 0 }, // maxValue=0 means uncapped
      },
      time: {
        ...base.time,
        cfus: {
          ...base.time.cfus,
          blastFurnace: { val: 1, on: 1, unlocked: true, heat: 100 },
        },
      },
    };
  }

  it("produces no resources when shatterTCGain=0 (no ressourceRetrieval)", () => {
    const s = shatterState({ catnipPerTickBase: 1 });
    const next = applyShatterTc(s);
    expect(next.resources.catnip?.value).toBe(0);
  });

  it("produces resources proportional to perTick * ticksPerYear * shatterTCGain", () => {
    // catnipPerTickBase=1, shatterTCGain=1 → gain = 1 * 4000 * 1 = 4000
    const s = shatterState({
      catnipPerTickBase: 1,
      shatterTCGain: 1,
    });
    const next = applyShatterTc(s);
    // Capped at maxValue=1000000, actual gain=4000
    expect(next.resources.catnip?.value).toBeCloseTo(4000);
  });

  it("resources are capped at pre-shatter maxValue (not exceeded)", () => {
    // catnipPerTickBase=10, shatterTCGain=1 → raw gain = 40000, max=1000000
    const s = shatterState({
      catnipPerTickBase: 10,
      shatterTCGain: 1,
    });
    // Set catnip near max
    const s2 = {
      ...s,
      resources: {
        ...s.resources,
        catnip: { value: 990000, maxValue: 1_000_000 },
      },
    };
    const next = applyShatterTc(s2);
    // Should be capped at max(current value, maxValue) = max(990000, 1000000) = 1000000
    expect(next.resources.catnip?.value).toBeLessThanOrEqual(1_000_000);
  });

  it("shatterTCGain scales with rrRatio", () => {
    // shatterTCGain=0.5, rrRatio=1 → effective gain = 0.5 * (1+1) = 1
    // catnipPerTickBase=1 → total = 1 * 4000 = 4000
    const s = shatterState({
      catnipPerTickBase: 1,
      shatterTCGain: 0.5,
      rrRatio: 1,
    });
    const next = applyShatterTc(s);
    expect(next.resources.catnip?.value).toBeCloseTo(4000);
  });

  it("does not produce resources for resources with zero perTick", () => {
    const s = shatterState({
      shatterTCGain: 1,
      // no woodPerTickBase — wood stays 0
    });
    const next = applyShatterTc(s);
    expect(next.resources.wood?.value).toBe(0);
  });

  it("uncapped resources (maxValue=0) are not capped", () => {
    // minerals maxValue=0 means uncapped — should grow freely
    const s = shatterState({
      mineralsPerTickBase: 1,
      shatterTCGain: 1,
    });
    const next = applyShatterTc(s);
    expect(next.resources.minerals?.value).toBeCloseTo(4000);
  });
});

// ── Story 19-2: Heat efficiency multiplier ─────────────────────────────────────

describe("TimeManager.update — heat efficiency (Story 19-2)", () => {
  it("with heatEfficiency=0 (default), transfers at base heatPerTick rate", () => {
    const base = createInitialState();
    const s: GameState = {
      ...base,
      effectCache: { heatPerTick: 0.5, heatEfficiency: 0 },
      time: { ...base.time, heat: 10 },
    };
    const mgr = new TimeManager();
    const next = mgr.update(s);
    // efficiency = 1 + 0 = 1; effective = 0.5 * 1 = 0.5
    expect(next.time.heat).toBeCloseTo(9.5);
    expect(next.time.cfus.blastFurnace?.heat).toBeCloseTo(0.5);
  });

  it("with heatEfficiency=0.5, transfers at 1.5x base rate", () => {
    const base = createInitialState();
    const s: GameState = {
      ...base,
      effectCache: { heatPerTick: 0.5, heatEfficiency: 0.5 },
      time: { ...base.time, heat: 10 },
    };
    const mgr = new TimeManager();
    const next = mgr.update(s);
    // efficiency = 1 + 0.5 = 1.5; effective = 0.5 * 1.5 = 0.75
    expect(next.time.cfus.blastFurnace?.heat).toBeCloseTo(0.75);
  });
});

// ── Story 19-3: Base effect values ─────────────────────────────────────────────

describe("TimeManager.updateEffects — base values (Story 19-3)", () => {
  it("contributes heatPerTick=0.01 base even with no CFUs", () => {
    const s = createInitialState();
    const mgr = new TimeManager();
    const effects = mgr.updateEffects(s);
    expect(effects.heatPerTick).toBe(0.01);
  });

  it("contributes heatMax=100 base even with no CFUs", () => {
    const s = createInitialState();
    const mgr = new TimeManager();
    const effects = mgr.updateEffects(s);
    expect(effects.heatMax).toBe(100);
  });

  it("contributes temporalFluxMax=3000 base even with no CFUs", () => {
    const s = createInitialState();
    const mgr = new TimeManager();
    const effects = mgr.updateEffects(s);
    expect(effects.temporalFluxMax).toBe(3000);
  });
});

// ── Story 19-1: Shatter advances space routes ──────────────────────────────────

describe("applyShatterTc — space route advancement (Story 19-1)", () => {
  it("advances in-progress space routes by daysPerYear * routeSpeed", () => {
    const base = createInitialState();
    const s: GameState = {
      ...base,
      effectCache: { routeSpeed: 1 },
      time: {
        ...base.time,
        cfus: {
          ...base.time.cfus,
          blastFurnace: { val: 1, on: 1, unlocked: true, heat: 100 },
        },
      },
      space: {
        ...base.space,
        planets: {
          ...base.space.planets,
          moon: { unlocked: true, reached: false, routeDays: 500 },
        },
      },
    };
    const next = applyShatterTc(s);
    // daysPerYear = 100 * 4 = 400; moon had 500 → 500 - 400 = 100 remaining
    expect(next.space.planets.moon?.routeDays).toBeCloseTo(100);
    expect(next.space.planets.moon?.reached).toBe(false);
  });

  it("marks planet as reached when routeDays hits 0", () => {
    const base = createInitialState();
    const s: GameState = {
      ...base,
      effectCache: { routeSpeed: 1 },
      time: {
        ...base.time,
        cfus: {
          ...base.time.cfus,
          blastFurnace: { val: 1, on: 1, unlocked: true, heat: 100 },
        },
      },
      space: {
        ...base.space,
        planets: {
          ...base.space.planets,
          moon: { unlocked: true, reached: false, routeDays: 200 },
        },
      },
    };
    // daysPerYear = 400; moon routeDays=200 → reached
    const next = applyShatterTc(s);
    expect(next.space.planets.moon?.reached).toBe(true);
  });
});
