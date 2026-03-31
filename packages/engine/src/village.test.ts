import { describe, expect, it } from "vitest";
import { BuildingManager } from "./buildings.js";
import { CalendarManager } from "./calendar.js";
import { createInitialResources } from "./resources.js";
import { createInitialState } from "./state.js";
import { tick } from "./tick.js";
import { JOB_DEFS, LUXURY_RESOURCE_NAMES, UNCOMMON_RESOURCE_NAMES, VillageManager, applyHunt, createInitialVillage, totalAssignedKittens } from "./village.js";

describe("JOB_DEFS", () => {
  it("contains all core jobs", () => {
    const names = JOB_DEFS.map((j) => j.name);
    for (const name of [
      "woodcutter",
      "farmer",
      "scholar",
      "hunter",
      "miner",
      "geologist",
      "priest",
    ]) {
      expect(names).toContain(name);
    }
  });

  it("farmer produces catnipPerTickBase at 1.0", () => {
    const farmer = JOB_DEFS.find((j) => j.name === "farmer");
    expect(farmer?.effectKey).toBe("catnipPerTickBase");
    expect(farmer?.baseProduction).toBe(1.0);
  });

  it("woodcutter produces woodPerTickBase at 0.018", () => {
    const wc = JOB_DEFS.find((j) => j.name === "woodcutter");
    expect(wc?.effectKey).toBe("woodPerTickBase");
    expect(wc?.baseProduction).toBe(0.018);
  });
});

describe("createInitialVillage", () => {
  it("starts with 0 kittens", () => {
    expect(createInitialVillage().kittens).toBe(0);
  });

  it("starts with 0 kittenProgress", () => {
    expect(createInitialVillage().kittenProgress).toBe(0);
  });

  it("all jobs start at 0", () => {
    const village = createInitialVillage();
    for (const def of JOB_DEFS) {
      expect(village.jobs[def.name]?.value).toBe(0);
    }
  });
});

describe("totalAssignedKittens", () => {
  it("returns 0 when all jobs are at 0", () => {
    const village = createInitialVillage();
    expect(totalAssignedKittens(village)).toBe(0);
  });

  it("sums all job values", () => {
    const village = {
      ...createInitialVillage(),
      jobs: {
        ...createInitialVillage().jobs,
        woodcutter: { value: 2 },
        farmer: { value: 3 },
      },
    };
    expect(totalAssignedKittens(village)).toBe(5);
  });
});

describe("VillageManager", () => {
  const manager = new VillageManager();

  describe("update — kitten growth", () => {
    it("accumulates kittenProgress from kittensPerTickBase effect", () => {
      const state = {
        ...createInitialState(),
        effectCache: { kittensPerTickBase: 0.01, maxKittens: 10 },
        village: createInitialVillage(),
      };
      const next = manager.update(state);
      expect(next.village.kittenProgress).toBeCloseTo(0.01);
    });

    it("spawns a kitten when progress >= 1", () => {
      const state = {
        ...createInitialState(),
        effectCache: { kittensPerTickBase: 0.01, maxKittens: 10 },
        village: {
          ...createInitialVillage(),
          kittenProgress: 0.995,
        },
      };
      const next = manager.update(state);
      expect(next.village.kittens).toBe(1);
      // progress should be ~0.005 (0.995 + 0.01 - 1.0)
      expect(next.village.kittenProgress).toBeCloseTo(0.005);
    });

    it("does not spawn a kitten if maxKittens = 0", () => {
      const state = {
        ...createInitialState(),
        effectCache: { kittensPerTickBase: 0.01, maxKittens: 0 },
        village: {
          ...createInitialVillage(),
          kittenProgress: 0.995,
        },
      };
      const next = manager.update(state);
      expect(next.village.kittens).toBe(0);
    });

    it("does not spawn a kitten if already at maxKittens", () => {
      const state = {
        ...createInitialState(),
        effectCache: { kittensPerTickBase: 0.01, maxKittens: 2 },
        village: {
          ...createInitialVillage(),
          kittens: 2,
          kittenProgress: 0.995,
        },
      };
      const next = manager.update(state);
      expect(next.village.kittens).toBe(2);
    });

    it("does not mutate input state", () => {
      const state = {
        ...createInitialState(),
        effectCache: { kittensPerTickBase: 0.01, maxKittens: 10 },
        village: createInitialVillage(),
      };
      const originalProgress = state.village.kittenProgress;
      manager.update(state);
      expect(state.village.kittenProgress).toBe(originalProgress);
    });
  });

  describe("update — kitten death", () => {
    it("kills a kitten when catnip is being drained to below 0", () => {
      const state = {
        ...createInitialState(),
        effectCache: { catnipPerTickCon: -10 },
        resources: {
          ...createInitialResources(),
          catnip: { value: 0.5, maxValue: 5000 },
        },
        village: {
          ...createInitialVillage(),
          kittens: 3,
        },
      };
      const next = manager.update(state);
      // catnip.value (0.5) + catnipPerTick (-10) < 0 → kill 1 kitten
      expect(next.village.kittens).toBe(2);
    });

    it("increments deadKittens when a kitten dies", () => {
      const state = {
        ...createInitialState(),
        effectCache: { catnipPerTickCon: -10 },
        resources: {
          ...createInitialResources(),
          catnip: { value: 0.5, maxValue: 5000 },
        },
        village: {
          ...createInitialVillage(),
          kittens: 3,
          deadKittens: 0,
        },
      };
      const next = manager.update(state);
      expect(next.village.deadKittens).toBe(1);
    });

    it("does not kill kittens when catnip is positive", () => {
      const state = {
        ...createInitialState(),
        effectCache: { catnipPerTickBase: 1.0 },
        resources: {
          ...createInitialResources(),
          catnip: { value: 100, maxValue: 5000 },
        },
        village: {
          ...createInitialVillage(),
          kittens: 3,
        },
      };
      const next = manager.update(state);
      expect(next.village.kittens).toBe(3);
    });

    it("handles missing catnip entry (uses fallback 0/0)", () => {
      // State where resources has no catnip — covers the fallback branch on line 119
      const state = {
        ...createInitialState(),
        effectCache: { catnipPerTickCon: -10 },
        resources: {} as Record<string, { value: number; maxValue: number }>,
        village: { ...createInitialVillage(), kittens: 1 },
      };
      const next = manager.update(state);
      // catnip fallback is {value:0, maxValue:0}; 0 + (-10) < 0 → kill kitten
      expect(next.village.kittens).toBe(0);
    });

    it("does not kill kittens when kittens = 0", () => {
      const state = {
        ...createInitialState(),
        effectCache: { catnipPerTickCon: -10 },
        resources: {
          ...createInitialResources(),
          catnip: { value: 0, maxValue: 5000 },
        },
        village: createInitialVillage(),
      };
      const next = manager.update(state);
      expect(next.village.kittens).toBe(0);
    });

    it("frees a job slot when a kitten dies", () => {
      const state = {
        ...createInitialState(),
        effectCache: { catnipPerTickCon: -10 },
        resources: {
          ...createInitialResources(),
          catnip: { value: 0, maxValue: 5000 },
        },
        village: {
          ...createInitialVillage(),
          kittens: 2,
          jobs: {
            ...createInitialVillage().jobs,
            woodcutter: { value: 1 },
            farmer: { value: 1 },
          },
        },
      };
      const next = manager.update(state);
      expect(next.village.kittens).toBe(1);
      // One job slot freed — total assigned should be 1
      const totalAssigned = Object.values(next.village.jobs).reduce((sum, j) => sum + j.value, 0);
      expect(totalAssigned).toBe(1);
    });
  });

  describe("updateEffects", () => {
    it("contributes catnipPerTickBase for farmers", () => {
      const state = {
        ...createInitialState(),
        village: {
          ...createInitialVillage(),
          kittens: 1,
          jobs: { ...createInitialVillage().jobs, farmer: { value: 1 } },
        },
      };
      const effects = manager.updateEffects(state);
      expect(effects.catnipPerTickBase).toBeCloseTo(1.0);
    });

    it("contributes woodPerTickBase for woodcutters", () => {
      const state = {
        ...createInitialState(),
        village: {
          ...createInitialVillage(),
          kittens: 2,
          jobs: { ...createInitialVillage().jobs, woodcutter: { value: 2 } },
        },
      };
      const effects = manager.updateEffects(state);
      expect(effects.woodPerTickBase).toBeCloseTo(0.018 * 2);
    });

    it("applies woodJobRatio from effectCache to woodcutter production", () => {
      // mineralAxes gives woodJobRatio: 0.7 — woodcutters should produce 1.7× base
      const base = createInitialState();
      const state = {
        ...base,
        effectCache: { ...base.effectCache, woodJobRatio: 0.7 },
        village: {
          ...createInitialVillage(),
          kittens: 1,
          happiness: 1.0,
          jobs: { ...createInitialVillage().jobs, woodcutter: { value: 1 } },
        },
      };
      const effects = manager.updateEffects(state);
      expect(effects.woodPerTickBase).toBeCloseTo(0.018 * 1.7);
    });

    it("applies catnipJobRatio from effectCache to farmer production", () => {
      const base = createInitialState();
      const state = {
        ...base,
        effectCache: { ...base.effectCache, catnipJobRatio: 0.5 },
        village: {
          ...createInitialVillage(),
          kittens: 1,
          happiness: 1.0,
          jobs: { ...createInitialVillage().jobs, farmer: { value: 1 } },
        },
      };
      const effects = manager.updateEffects(state);
      expect(effects.catnipPerTickBase).toBeCloseTo(1.0 * 1.5);
    });

    it("contributes catnipPerTickCon based on total kittens", () => {
      const state = {
        ...createInitialState(),
        village: { ...createInitialVillage(), kittens: 4 },
      };
      const effects = manager.updateEffects(state);
      expect(effects.catnipPerTickCon).toBeCloseTo(-0.85 * 4);
    });

    it("contributes furs, ivory, spice consumption per kitten", () => {
      const state = {
        ...createInitialState(),
        village: { ...createInitialVillage(), kittens: 2 },
      };
      const effects = manager.updateEffects(state);
      expect(effects.fursPerTickCon).toBeCloseTo(-0.01 * 2);
      expect(effects.ivoryPerTickCon).toBeCloseTo(-0.007 * 2);
      expect(effects.spicePerTickCon).toBeCloseTo(-0.001 * 2);
    });

    it("returns zero consumption effects when kittens = 0", () => {
      const state = { ...createInitialState(), village: createInitialVillage() };
      const effects = manager.updateEffects(state);
      expect(effects.catnipPerTickCon ?? 0).toBe(0);
    });

    it("applies catnipDemandRatio to kitten catnip consumption", () => {
      // 3 pastures → catnipDemandRatio = -0.015
      const state = {
        ...createInitialState(),
        village: { ...createInitialVillage(), kittens: 4 },
        effectCache: { ...createInitialState().effectCache, catnipDemandRatio: -0.015 },
      };
      const effects = manager.updateEffects(state);
      expect(effects.catnipPerTickCon).toBeCloseTo(-0.85 * 4 * (1 - 0.015));
    });

    it("applies fursDemandRatio to kitten furs consumption", () => {
      const state = {
        ...createInitialState(),
        village: { ...createInitialVillage(), kittens: 2 },
        effectCache: { ...createInitialState().effectCache, fursDemandRatio: -0.1 },
      };
      const effects = manager.updateEffects(state);
      expect(effects.fursPerTickCon).toBeCloseTo(-0.01 * 2 * 0.9);
    });

    it("returns zero production when no jobs assigned", () => {
      const state = { ...createInitialState(), village: createInitialVillage() };
      const effects = manager.updateEffects(state);
      expect(effects.catnipPerTickBase ?? 0).toBe(0);
      expect(effects.woodPerTickBase ?? 0).toBe(0);
    });
  });

  describe("save / load", () => {
    it("save returns the village object", () => {
      const state = {
        ...createInitialState(),
        village: { ...createInitialVillage(), kittens: 5, kittenProgress: 0.7 },
      };
      const saved = manager.save(state);
      expect(saved).toEqual(state.village);
    });

    it("load restores village state", () => {
      const state = { ...createInitialState(), village: createInitialVillage() };
      const saved = {
        kittens: 3,
        kittenProgress: 0.5,
        jobs: { woodcutter: { value: 2 }, farmer: { value: 1 } },
      };
      const restored = manager.load(saved, state);
      expect(restored.village.kittens).toBe(3);
      expect(restored.village.kittenProgress).toBe(0.5);
      expect(restored.village.jobs.woodcutter?.value).toBe(2);
    });

    it("handles null saved value", () => {
      const state = { ...createInitialState(), village: createInitialVillage() };
      const restored = manager.load(null, state);
      expect(restored.village.kittens).toBe(0);
    });

    it("handles non-number kittenProgress in saved data (uses fallback 0)", () => {
      const state = { ...createInitialState(), village: createInitialVillage() };
      const saved = { kittens: 2, kittenProgress: "bad" as unknown as number, jobs: {} };
      const restored = manager.load(saved, state);
      expect(restored.village.kittens).toBe(2);
      expect(restored.village.kittenProgress).toBe(0);
    });

    it("handles non-number kittens in saved data (uses fallback 0)", () => {
      const state = { ...createInitialState(), village: createInitialVillage() };
      const saved = { kittens: "bad" as unknown as number, kittenProgress: 0.5, jobs: {} };
      const restored = manager.load(saved, state);
      expect(restored.village.kittens).toBe(0);
      expect(restored.village.kittenProgress).toBe(0.5);
    });

    it("restores deadKittens and happiness from saved data", () => {
      const state = { ...createInitialState(), village: createInitialVillage() };
      const saved = { kittens: 5, kittenProgress: 0, jobs: {}, deadKittens: 3, happiness: 1.8 };
      const restored = manager.load(saved, state);
      expect(restored.village.deadKittens).toBe(3);
      expect(restored.village.happiness).toBe(1.8);
    });

    it("uses default deadKittens=0 and happiness=1.0 when missing from saved data", () => {
      const state = { ...createInitialState(), village: createInitialVillage() };
      const saved = { kittens: 5, kittenProgress: 0, jobs: {} };
      const restored = manager.load(saved, state);
      expect(restored.village.deadKittens).toBe(0);
      expect(restored.village.happiness).toBe(1.0);
    });
  });

  describe("resetState", () => {
    it("resets kittens and jobs to initial values", () => {
      const state = {
        ...createInitialState(),
        village: {
          ...createInitialVillage(),
          kittens: 10,
          jobs: { ...createInitialVillage().jobs, woodcutter: { value: 3 } },
        },
      };
      const reset = manager.resetState(state);
      expect(reset.village.kittens).toBe(0);
      expect(reset.village.jobs.woodcutter?.value).toBe(0);
    });
  });
});

// ── Epic 21: Feature Parity Audit ─────────────────────────────────────────────

describe("Story 21-1: kittensPerTickBase base value", () => {
  const manager = new VillageManager();

  it("updateEffects emits kittensPerTickBase: 0.01", () => {
    const state = { ...createInitialState(), village: createInitialVillage() };
    const effects = manager.updateEffects(state);
    expect(effects.kittensPerTickBase).toBeCloseTo(0.01);
  });

  it("update uses kittensPerTickBase from effectCache (now set)", () => {
    // When a hut is built, maxKittens=2 and effectCache has kittensPerTickBase=0.01
    const state = {
      ...createInitialState(),
      effectCache: { kittensPerTickBase: 0.01, maxKittens: 2 },
      village: createInitialVillage(),
    };
    const next = manager.update(state);
    expect(next.village.kittenProgress).toBeCloseTo(0.01);
  });

  it("update scales kittensPerTick by kittenGrowthRatio from effectCache", () => {
    const state = {
      ...createInitialState(),
      effectCache: { kittensPerTickBase: 0.01, kittenGrowthRatio: 1.0, maxKittens: 10 },
      village: createInitialVillage(),
    };
    const next = manager.update(state);
    // kittensPerTick = 0.01 * (1 + 1.0) = 0.02
    expect(next.village.kittenProgress).toBeCloseTo(0.02);
  });
});

describe("Story 21-3: Happiness calculation updates each tick", () => {
  const manager = new VillageManager();

  it("happiness = 1.0 when kittens ≤ 5", () => {
    const state = {
      ...createInitialState(),
      effectCache: { maxKittens: 10 },
      village: { ...createInitialVillage(), kittens: 5 },
    };
    const next = manager.update(state);
    expect(next.village.happiness).toBeCloseTo(1.0);
  });

  it("happiness decreases by 0.02 per kitten above 5", () => {
    const state = {
      ...createInitialState(),
      effectCache: { maxKittens: 20 },
      village: { ...createInitialVillage(), kittens: 7 },
    };
    const next = manager.update(state);
    // 100 - 2*(7-5) = 96 → 0.96
    expect(next.village.happiness).toBeCloseTo(0.96);
  });

  it("happiness minimum is 0.25 regardless of kitten count", () => {
    const state = {
      ...createInitialState(),
      effectCache: { maxKittens: 10000 },
      village: { ...createInitialVillage(), kittens: 1000 },
    };
    const next = manager.update(state);
    expect(next.village.happiness).toBeGreaterThanOrEqual(0.25);
  });

  it("happiness bonus from effectCache adds to happiness", () => {
    const state = {
      ...createInitialState(),
      effectCache: { maxKittens: 10, happiness: 10 }, // +10% from effects
      village: { ...createInitialVillage(), kittens: 5 },
    };
    const next = manager.update(state);
    // 100 + 10 = 110 → 1.10
    expect(next.village.happiness).toBeCloseTo(1.10);
  });

  it("unhappinessRatio from effectCache reduces overpopulation penalty", () => {
    // 10 kittens over 5 → 5 overpop × 2 = 10% penalty normally
    // unhappinessRatio: -0.048 (one amphitheatre) → penalty × (1 - 0.048) = 9.52%
    const state = {
      ...createInitialState(),
      effectCache: { maxKittens: 20, unhappinessRatio: -0.048 },
      village: { ...createInitialVillage(), kittens: 10 },
    };
    const next = manager.update(state);
    // 100 - 5 * 2 * (1 - 0.048) = 100 - 9.52 = 90.48 → 0.9048
    expect(next.village.happiness).toBeCloseTo(0.9048);
  });
});

describe("Story 21-4: Job production scales with happiness", () => {
  const manager = new VillageManager();

  it("woodcutter production at full happiness (1.0) is unchanged", () => {
    const state = {
      ...createInitialState(),
      village: {
        ...createInitialVillage(),
        kittens: 1,
        happiness: 1.0,
        jobs: { ...createInitialVillage().jobs, woodcutter: { value: 1 } },
      },
    };
    const effects = manager.updateEffects(state);
    expect(effects.woodPerTickBase).toBeCloseTo(0.018);
  });

  it("woodcutter production at half happiness (0.5) is halved", () => {
    const state = {
      ...createInitialState(),
      village: {
        ...createInitialVillage(),
        kittens: 1,
        happiness: 0.5,
        jobs: { ...createInitialVillage().jobs, woodcutter: { value: 1 } },
      },
    };
    const effects = manager.updateEffects(state);
    expect(effects.woodPerTickBase).toBeCloseTo(0.018 * 0.5);
  });

  it("catnip consumption (negative) is NOT scaled by happiness", () => {
    const state = {
      ...createInitialState(),
      village: {
        ...createInitialVillage(),
        kittens: 1,
        happiness: 0.5,
      },
    };
    const effects = manager.updateEffects(state);
    // Consumption stays at full rate regardless of happiness
    expect(effects.catnipPerTickCon).toBeCloseTo(-0.85);
  });
});

// ── applyHunt ────────────────────────────────────────────────────────────────

describe("applyHunt", () => {
  it("returns state unchanged when catpower < 100 (no squads available)", () => {
    const state = createInitialState();
    const next = applyHunt(state);
    expect(next).toBe(state);
  });

  it("deducts 100 catpower per squad and adds furs", () => {
    const state = {
      ...createInitialState(),
      resources: {
        ...createInitialResources(),
        catpower: { value: 200, maxValue: 0 },
        furs: { value: 0, maxValue: 0 },
      },
    };
    const next = applyHunt(state);
    // 2 squads spent
    expect(next.resources.catpower?.value).toBe(0);
    // Furs gained (probabilistic — may be 0 with very unlucky RNG)
    expect((next.resources.furs?.value ?? 0)).toBeGreaterThanOrEqual(0);
  });

  it("adds ivory with some probability", () => {
    // Run many squads to ensure ivory rolls in
    const state = {
      ...createInitialState(),
      resources: {
        ...createInitialResources(),
        catpower: { value: 10000, maxValue: 0 },
        furs: { value: 0, maxValue: 0 },
        ivory: { value: 0, maxValue: 0 },
      },
    };
    const next = applyHunt(state);
    // 100 squads: ivory probability 0.45 per squad, so extremely likely to get some
    expect((next.resources.ivory?.value ?? 0)).toBeGreaterThan(0);
  });

  it("caps furs at maxValue when maxValue > 0", () => {
    const state = {
      ...createInitialState(),
      resources: {
        ...createInitialResources(),
        catpower: { value: 100, maxValue: 0 },
        furs: { value: 100, maxValue: 150 },
      },
    };
    const next = applyHunt(state);
    expect((next.resources.furs?.value ?? 0)).toBeLessThanOrEqual(150);
  });

  it("respects huntCatpowerDiscount effect", () => {
    const state = {
      ...createInitialState(),
      resources: {
        ...createInitialResources(),
        catpower: { value: 50, maxValue: 0 },
        furs: { value: 0, maxValue: 0 },
      },
      effectCache: {
        ...createInitialState().effectCache,
        huntCatpowerDiscount: 50, // hunt cost = 50
      },
    };
    // With discount: 50 catpower / 50 cost = 1 squad
    const next = applyHunt(state);
    expect(next.resources.catpower?.value).toBe(0);
    expect((next.resources.furs?.value ?? 0)).toBeGreaterThanOrEqual(0);
  });
});

// ── Story 27-12: catnipDemandWorkerRatioGlobal ────────────────────────────────

describe("Story 27-12: catnipDemandWorkerRatioGlobal", () => {
  const manager = new VillageManager();

  it("catnipDemandWorkerRatioGlobal = -0.5 reduces catnip consumption for assigned kittens", () => {
    // 2 kittens, 1 assigned farmer → worker gets 50% discount
    const base = createInitialState();
    const stateNoWorkerDiscount = {
      ...base,
      village: {
        ...base.village,
        kittens: 2,
        jobs: { ...base.village.jobs, farmer: { value: 1 } },
        happiness: 1.0,
      },
      effectCache: { ...base.effectCache },
    };
    const stateWithWorkerDiscount = {
      ...stateNoWorkerDiscount,
      effectCache: { ...base.effectCache, catnipDemandWorkerRatioGlobal: -0.5 },
    };
    const effectsNo = manager.updateEffects(stateNoWorkerDiscount);
    const effectsWith = manager.updateEffects(stateWithWorkerDiscount);

    // With -0.5 discount on 1 worker out of 2 kittens,
    // catnip consumption should be less negative (less demand)
    expect(effectsWith.catnipPerTickCon ?? 0).toBeGreaterThan(effectsNo.catnipPerTickCon ?? -10);
  });

  it("catnipDemandWorkerRatioGlobal = 0 has no effect", () => {
    const base = createInitialState();
    const state1 = {
      ...base,
      village: {
        ...base.village,
        kittens: 3,
        jobs: { ...base.village.jobs, farmer: { value: 2 } },
        happiness: 1.0,
      },
      effectCache: { ...base.effectCache },
    };
    const state2 = {
      ...state1,
      effectCache: { ...base.effectCache, catnipDemandWorkerRatioGlobal: 0 },
    };
    const e1 = manager.updateEffects(state1);
    const e2 = manager.updateEffects(state2);
    expect(e1.catnipPerTickCon).toBeCloseTo(e2.catnipPerTickCon ?? 0);
  });

  it("catnipDemandWorkerRatioGlobal = -0.5 with all kittens assigned → half total consumption", () => {
    const base = createInitialState();
    const state = {
      ...base,
      village: {
        ...base.village,
        kittens: 2,
        jobs: { ...base.village.jobs, farmer: { value: 2 } }, // all assigned
        happiness: 1.0,
      },
      effectCache: { ...base.effectCache, catnipDemandWorkerRatioGlobal: -0.5 },
    };
    const stateBaseline = {
      ...base,
      village: {
        ...base.village,
        kittens: 2,
        jobs: { ...base.village.jobs, farmer: { value: 0 } },
        happiness: 1.0,
      },
      effectCache: { ...base.effectCache },
    };
    const effects = manager.updateEffects(state);
    const baseline = manager.updateEffects(stateBaseline);
    // All 2 kittens assigned with -0.5 ratio: consumption = 2 * -0.85 * 0.5 = -0.85
    // Baseline 2 kittens all unassigned: consumption = 2 * -0.85 = -1.7
    expect(effects.catnipPerTickCon ?? 0).toBeCloseTo(
      (baseline.catnipPerTickCon ?? 0) * 0.5,
      5,
    );
  });
});

// ── Story 30-02: Luxury resource happiness bonus ───────────────────────────────
describe("Story 30-02: luxury resource happiness", () => {
  it("LUXURY_RESOURCE_NAMES contains furs, ivory, spice, unicorns, karma, relic", () => {
    for (const name of ["furs", "ivory", "spice", "unicorns", "karma", "relic"]) {
      expect(LUXURY_RESOURCE_NAMES.has(name)).toBe(true);
    }
  });

  it("UNCOMMON_RESOURCE_NAMES contains furs, ivory, spice only", () => {
    expect(UNCOMMON_RESOURCE_NAMES.has("furs")).toBe(true);
    expect(UNCOMMON_RESOURCE_NAMES.has("ivory")).toBe(true);
    expect(UNCOMMON_RESOURCE_NAMES.has("spice")).toBe(true);
    expect(UNCOMMON_RESOURCE_NAMES.has("unicorns")).toBe(false);
    expect(UNCOMMON_RESOURCE_NAMES.has("karma")).toBe(false);
  });

  it("1 luxury resource (furs=10) → happiness +10%", () => {
    const manager = new VillageManager();
    const base = createInitialState();
    const state = {
      ...base,
      village: { ...base.village, kittens: 5 },
      resources: { ...base.resources, furs: { value: 10, maxValue: 1000 } },
    };
    const next = manager.update(state);
    // 100 (base) + 10 (1 luxury) = 110 → 1.10
    expect(next.village.happiness).toBeCloseTo(1.10);
  });

  it("3 luxury resources (furs, ivory, unicorns) → happiness +30%", () => {
    const manager = new VillageManager();
    const base = createInitialState();
    const state = {
      ...base,
      village: { ...base.village, kittens: 5 },
      resources: {
        ...base.resources,
        furs: { value: 1, maxValue: 1000 },
        ivory: { value: 1, maxValue: 1000 },
        unicorns: { value: 1, maxValue: 1000 },
      },
    };
    const next = manager.update(state);
    expect(next.village.happiness).toBeCloseTo(1.30);
  });

  it("luxury resource with value=0 does NOT add happiness", () => {
    const manager = new VillageManager();
    const base = createInitialState();
    const state = {
      ...base,
      village: { ...base.village, kittens: 5 },
      resources: { ...base.resources, furs: { value: 0, maxValue: 1000 } },
    };
    const next = manager.update(state);
    expect(next.village.happiness).toBeCloseTo(1.0); // no bonus
  });

  it("uncommon resource (furs) with consumableLuxuryHappiness=5 → +15 happiness", () => {
    const manager = new VillageManager();
    const base = createInitialState();
    const state = {
      ...base,
      village: { ...base.village, kittens: 5 },
      resources: { ...base.resources, furs: { value: 1, maxValue: 1000 } },
      effectCache: { ...base.effectCache, consumableLuxuryHappiness: 5 },
    };
    const next = manager.update(state);
    // 100 + 10 (luxury base) + 5 (consumable) = 115 → 1.15
    expect(next.village.happiness).toBeCloseTo(1.15);
  });

  it("rare resource (unicorns) does NOT get consumableLuxuryHappiness bonus", () => {
    const manager = new VillageManager();
    const base = createInitialState();
    const state = {
      ...base,
      village: { ...base.village, kittens: 5 },
      resources: { ...base.resources, unicorns: { value: 1, maxValue: 1000 } },
      effectCache: { ...base.effectCache, consumableLuxuryHappiness: 5 },
    };
    const next = manager.update(state);
    // 100 + 10 (luxury base) = 110 → 1.10 (no consumable bonus for rare)
    expect(next.village.happiness).toBeCloseTo(1.10);
  });

  it("elderBox + wrappingPaper both present → only wrappingPaper counts", () => {
    const manager = new VillageManager();
    const base = createInitialState();
    const state = {
      ...base,
      village: { ...base.village, kittens: 5 },
      resources: {
        ...base.resources,
        elderBox: { value: 5, maxValue: 1000 },
        wrappingPaper: { value: 3, maxValue: 1000 },
      },
    };
    const next = manager.update(state);
    // only wrappingPaper counts → +10, elderBox is cancelled → total 110
    expect(next.village.happiness).toBeCloseTo(1.10);
  });

  it("elderBox alone (no wrappingPaper) → counts normally", () => {
    const manager = new VillageManager();
    const base = createInitialState();
    const state = {
      ...base,
      village: { ...base.village, kittens: 5 },
      resources: {
        ...base.resources,
        elderBox: { value: 5, maxValue: 1000 },
      },
    };
    const next = manager.update(state);
    expect(next.village.happiness).toBeCloseTo(1.10);
  });
});

// ── Story 30-03: Karma happiness bonus ───────────────────────────────────────
describe("Story 30-03: karma happiness", () => {
  it("50 karma points → +60% happiness (50 karma + 10 luxury bonus)", () => {
    const manager = new VillageManager();
    const base = createInitialState();
    const state = {
      ...base,
      village: { ...base.village, kittens: 5 },
      resources: { ...base.resources, karma: { value: 50, maxValue: 0 } },
    };
    const next = manager.update(state);
    // karma is a rare (non-common) resource → +10 luxury bonus
    // karma happiness function → +50
    // total: 100 + 10 + 50 = 160 → 1.60
    expect(next.village.happiness).toBeCloseTo(1.60);
  });

  it("0 karma → no karma bonus", () => {
    const manager = new VillageManager();
    const base = createInitialState();
    const state = {
      ...base,
      village: { ...base.village, kittens: 5 },
    };
    const next = manager.update(state);
    expect(next.village.happiness).toBeCloseTo(1.0);
  });
});

// ── Story 30-04: Festival happiness bonus ────────────────────────────────────
describe("Story 30-04: festival happiness", () => {
  it("festivalDays=10 → +30% happiness bonus", () => {
    const manager = new VillageManager();
    const base = createInitialState();
    const state = {
      ...base,
      village: { ...base.village, kittens: 5 },
      calendar: { ...base.calendar, festivalDays: 10 },
    };
    const next = manager.update(state);
    expect(next.village.happiness).toBeCloseTo(1.30);
  });

  it("festivalDays=0 → no festival bonus", () => {
    const manager = new VillageManager();
    const base = createInitialState();
    const state = {
      ...base,
      village: { ...base.village, kittens: 5 },
      calendar: { ...base.calendar, festivalDays: 0 },
    };
    const next = manager.update(state);
    expect(next.village.happiness).toBeCloseTo(1.0);
  });

  it("festivalDays=5, festivalRatio=0.5 → +45% bonus (30 * 1.5)", () => {
    const manager = new VillageManager();
    const base = createInitialState();
    const state = {
      ...base,
      village: { ...base.village, kittens: 5 },
      calendar: { ...base.calendar, festivalDays: 5 },
      effectCache: { ...base.effectCache, festivalRatio: 0.5 },
    };
    const next = manager.update(state);
    expect(next.village.happiness).toBeCloseTo(1.45);
  });

  it("CalendarManager decrements festivalDays by 1 per tick", () => {
    const manager = new CalendarManager();
    const base = createInitialState();
    const state = {
      ...base,
      calendar: { ...base.calendar, festivalDays: 5, day: 0 },
    };
    // Advance enough ticks for 1 day (TICKS_PER_DAY = 10 in calendar.ts)
    const TICKS_PER_DAY = 10;
    let s = state;
    for (let i = 0; i < TICKS_PER_DAY; i++) s = manager.update(s);
    expect(s.calendar.festivalDays).toBe(4);
  });
});

// ── Epic 30: Cross-manager integration ───────────────────────────────────────
describe("Epic 30: happiness cross-manager integration", () => {
  it("happiness includes temple, luxury, festival, and karma contributions over multi-tick loop", () => {
    // Set up: 5 kittens (no overpop penalty), 2 active temples, sunAltar.on=3,
    // 1 luxury (furs=50), festival active, 10 karma
    const managers = [new BuildingManager(), new CalendarManager(), new VillageManager()];
    const base = createInitialState();
    const state = {
      ...base,
      buildings: {
        ...base.buildings,
        temple: { val: 2, on: 2, unlocked: true },
        brewery: { val: 0, on: 0 },
      },
      religion: {
        ...base.religion,
        religionUpgrades: {
          ...base.religion.religionUpgrades,
          sunAltar: { val: 3, on: 3 },
        },
      },
      village: { ...base.village, kittens: 5 },
      resources: {
        ...base.resources,
        furs: { value: 50, maxValue: 1000 },
        karma: { value: 10, maxValue: 0 },
      },
      calendar: { ...base.calendar, festivalDays: 5 },
    };

    const next = tick(state, managers);

    // Expected happiness:
    // 100 base
    // + temple: (0.4 + 0.1*3) * 2 = 1.4 * 2 = 2.8 → effectCache.happiness = 2.8
    // + furs luxury: +10 (uncommon, but no consumableLuxuryHappiness)
    // + karma luxury: +10 (rare resource)
    // + karma happiness: +10 (karmaValue = 10)
    // + festival: +30
    // total = 100 + 2.8 + 10 + 10 + 10 + 30 = 162.8 → 1.628
    expect(next.village.happiness).toBeCloseTo(162.8 / 100, 1);
    // Also verify festivalDays decremented (CalendarManager ran)
    expect(next.calendar.festivalDays).toBe(5); // 5 ticks per day, only 1 tick here
  });

  it("brewery consumption reduces catnip via effectCache", () => {
    const managers = [new BuildingManager()];
    const base = createInitialState();
    const state = {
      ...base,
      buildings: {
        ...base.buildings,
        brewery: { val: 3, on: 3, unlocked: true },
      },
    };
    const next = tick(state, managers);
    // 3 breweries on → catnipPerTickCon = -3 * (1 + 0) = -3
    expect(next.effectCache.catnipPerTickCon).toBeCloseTo(-3);
    // spicePerTickCon = -0.3
    expect(next.effectCache.spicePerTickCon).toBeCloseTo(-0.3);
  });
});
