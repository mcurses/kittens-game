import { describe, expect, it } from "vitest";
import { BuildingManager } from "./buildings.js";
import { CalendarManager } from "./calendar.js";
import { createInitialResources } from "./resources.js";
import { createInitialState } from "./state.js";
import { tick } from "./tick.js";
import { applyAction } from "./actions.js";
import type { Kitten } from "./village.js";
import { JOB_DEFS, LUXURY_RESOURCE_NAMES, UNCOMMON_RESOURCE_NAMES, VillageManager, applyHoldFestival, applyHunt, computePollutionHappines, createInitialVillage, generateKitten, getLeaderBonus, totalAssignedKittens } from "./village.js";

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

  it("starts with the default village name", () => {
    expect(createInitialVillage().name).toBe("Bonfire");
  });
});

describe("RENAME_VILLAGE action — serialize round-trip", () => {
  it("persists a renamed village across serialize + load", async () => {
    // The bug we're guarding: state.ts:serialize() once omitted village.name,
    // so the new name was lost the moment the server persisted state.
    const { serialize } = await import("./state.js");
    const initial = { ...createInitialState(), village: createInitialVillage() };
    const renamed = applyAction(initial, { type: "RENAME_VILLAGE", name: "MyCity" });
    expect(renamed.village.name).toBe("MyCity");

    const serialized = serialize(renamed);
    expect(serialized.village.name).toBe("MyCity");

    // load round-trip
    const manager = new VillageManager();
    const loaded = manager.load(serialized.village, initial);
    expect(loaded.village.name).toBe("MyCity");
  });

  it("rejects invalid names (does not mutate state)", () => {
    const initial = { ...createInitialState(), village: createInitialVillage() };
    const renamed = applyAction(initial, { type: "RENAME_VILLAGE", name: "  " });
    expect(renamed.village.name).toBe("Bonfire");
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

// ── Story 48-04: Individual kitten state foundation ──────────────────────────

describe("Story 48-04: Individual kitten state", () => {
  it("generateKitten creates a kitten with valid fields", () => {
    const k = generateKitten();
    expect(k.id).toMatch(/^k\d+$/);
    expect(k.name.length).toBeGreaterThan(0);
    expect(k.surname.length).toBeGreaterThan(0);
    expect(k.age).toBeGreaterThanOrEqual(5);
    expect(k.trait).toBeDefined();
    expect(k.job).toBeNull();
    expect(k.skills).toEqual({});
    expect(k.rank).toBe(0);
    expect(k.exp).toBe(0);
    expect(k.isFavorite).toBe(false);
    expect(k.isLeader).toBe(false);
  });

  it("new kitten spawns into sim on growth", () => {
    const base = createInitialState();
    const state = {
      ...base,
      village: { ...base.village, kittens: 0, kittenProgress: 0.99, sim: [] },
      effectCache: { ...base.effectCache, kittensPerTickBase: 0.02, maxKittens: 10 },
    };
    const manager = new VillageManager();
    const next = manager.update(state);
    expect(next.village.kittens).toBe(1);
    expect(next.village.sim.length).toBe(1);
    expect(next.village.sim[0]?.name).toBeDefined();
  });

  it("kitten death removes from sim preferring non-favorite non-leader", () => {
    const base = createInitialState();
    const k1: Kitten = { id: "k1", name: "A", surname: "S", age: 5, trait: "none", job: null, skills: {}, rank: 0, exp: 0, isFavorite: true, isLeader: false, birthYear: 0, appearance: { breed: "tabby", body: "slim", eyes: "large-amber", accessory: null }, originStory: "", traitFlavor: "", lifeEvents: [], portraitPath: null };
    const k2: Kitten = { id: "k2", name: "B", surname: "S", age: 5, trait: "none", job: null, skills: {}, rank: 0, exp: 0, isFavorite: false, isLeader: false, birthYear: 0, appearance: { breed: "tabby", body: "slim", eyes: "large-amber", accessory: null }, originStory: "", traitFlavor: "", lifeEvents: [], portraitPath: null };
    const state = {
      ...base,
      village: { ...base.village, kittens: 2, sim: [k1, k2] },
      resources: { ...base.resources, catnip: { value: -1, maxValue: 100 } },
      effectCache: { ...base.effectCache, maxKittens: 10 },
    };
    const manager = new VillageManager();
    const next = manager.update(state);
    expect(next.village.kittens).toBe(1);
    expect(next.village.sim.length).toBe(1);
    // Non-favorite k2 should die first
    expect(next.village.sim[0]?.id).toBe("k1");
  });

  it("job assignment updates kitten.job in sim", () => {
    const base = createInitialState();
    const k1: Kitten = { id: "k1", name: "A", surname: "S", age: 5, trait: "none", job: null, skills: {}, rank: 0, exp: 0, isFavorite: false, isLeader: false, birthYear: 0, appearance: { breed: "tabby", body: "slim", eyes: "large-amber", accessory: null }, originStory: "", traitFlavor: "", lifeEvents: [], portraitPath: null };
    const state = {
      ...base,
      village: { ...base.village, kittens: 1, sim: [k1] },
    };
    const next = applyAction(state, { type: "ASSIGN_JOB", job: "farmer" });
    expect(next.village.jobs.farmer!.value).toBe(1);
    expect(next.village.sim[0]?.job).toBe("farmer");
  });

  it("skill growth per tick for assigned kittens", () => {
    const base = createInitialState();
    const k1: Kitten = { id: "k1", name: "A", surname: "S", age: 5, trait: "none", job: "farmer", skills: {}, rank: 0, exp: 0, isFavorite: false, isLeader: false, birthYear: 0, appearance: { breed: "tabby", body: "slim", eyes: "large-amber", accessory: null }, originStory: "", traitFlavor: "", lifeEvents: [], portraitPath: null };
    const state = {
      ...base,
      village: { ...base.village, kittens: 1, sim: [k1], jobs: { ...base.village.jobs, farmer: { value: 1 } } },
      effectCache: { ...base.effectCache, maxKittens: 10 },
    };
    const manager = new VillageManager();
    const next = manager.update(state);
    expect(next.village.sim[0]?.skills.farmer).toBeCloseTo(0.01);
  });

  it("save and load round-trips sim array", () => {
    const base = createInitialState();
    const k1: Kitten = { id: "k1", name: "A", surname: "S", age: 10, trait: "engineer", job: "miner", skills: { miner: 5.5 }, rank: 2, exp: 1000, isFavorite: true, isLeader: false, birthYear: 0, appearance: { breed: "tabby", body: "slim", eyes: "large-amber", accessory: null }, originStory: "", traitFlavor: "", lifeEvents: [], portraitPath: null };
    const state = {
      ...base,
      village: { ...base.village, kittens: 1, sim: [k1] },
    };
    const manager = new VillageManager();
    const saved = manager.save(state);
    const loaded = manager.load(saved, createInitialState());
    expect(loaded.village.sim.length).toBe(1);
    expect(loaded.village.sim[0]?.name).toBe("A");
    expect(loaded.village.sim[0]?.trait).toBe("engineer");
    expect(loaded.village.sim[0]?.skills.miner).toBe(5.5);
    expect(loaded.village.sim[0]?.rank).toBe(2);
    expect(loaded.village.sim[0]?.isFavorite).toBe(true);
  });
});

// ── Story 48-03: Bulk hunt shortcuts ─────────────────────────────────────────

describe("Story 48-03: Bulk hunt with amount", () => {
  it("limits squads to the specified amount", () => {
    const state = {
      ...createInitialState(),
      resources: {
        ...createInitialResources(),
        catpower: { value: 1000, maxValue: 0 },
        furs: { value: 0, maxValue: 0 },
      },
    };
    // 10 squads affordable, but request only 3
    const next = applyHunt(state, 3);
    expect(next.resources.catpower?.value).toBe(700); // 1000 - 3*100
  });

  it("caps amount at max affordable squads", () => {
    const state = {
      ...createInitialState(),
      resources: {
        ...createInitialResources(),
        catpower: { value: 200, maxValue: 0 },
        furs: { value: 0, maxValue: 0 },
      },
    };
    // Only 2 squads affordable, request 100
    const next = applyHunt(state, 100);
    expect(next.resources.catpower?.value).toBe(0); // all spent
  });

  it("sends all squads when amount is not specified", () => {
    const state = {
      ...createInitialState(),
      resources: {
        ...createInitialResources(),
        catpower: { value: 500, maxValue: 0 },
        furs: { value: 0, maxValue: 0 },
      },
    };
    const next = applyHunt(state);
    expect(next.resources.catpower?.value).toBe(0); // all 5 squads spent
  });
});

// ── Story 48-07: Kitten management actions ────────────────────────────────────

describe("Story 48-07: Kitten management actions", () => {
  it("PROMOTE_KITTEN increments rank and deducts gold and exp", () => {
    const base = createInitialState();
    const k1: Kitten = { id: "k1", name: "A", surname: "S", age: 5, trait: "none", job: "farmer", skills: {}, rank: 0, exp: 600, isFavorite: false, isLeader: false, birthYear: 0, appearance: { breed: "tabby", body: "slim", eyes: "large-amber", accessory: null }, originStory: "", traitFlavor: "", lifeEvents: [], portraitPath: null };
    const state = {
      ...base,
      village: { ...base.village, kittens: 1, sim: [k1], jobs: { farmer: { value: 1 } } },
      resources: { ...base.resources, gold: { value: 100, maxValue: 0 } },
    };
    // Rank 0 → 1: costs 500 exp and 25 gold
    const next = applyAction(state, { type: "PROMOTE_KITTEN", kittenId: "k1" });
    expect(next.village.sim[0]?.rank).toBe(1);
    expect(next.village.sim[0]?.exp).toBe(100); // 600 - 500
    expect(next.resources.gold?.value).toBe(75); // 100 - 25
  });

  it("PROMOTE_KITTEN fails if not enough exp", () => {
    const base = createInitialState();
    const k1: Kitten = { id: "k1", name: "A", surname: "S", age: 5, trait: "none", job: null, skills: {}, rank: 0, exp: 100, isFavorite: false, isLeader: false, birthYear: 0, appearance: { breed: "tabby", body: "slim", eyes: "large-amber", accessory: null }, originStory: "", traitFlavor: "", lifeEvents: [], portraitPath: null };
    const state = {
      ...base,
      village: { ...base.village, kittens: 1, sim: [k1] },
      resources: { ...base.resources, gold: { value: 100, maxValue: 0 } },
    };
    const next = applyAction(state, { type: "PROMOTE_KITTEN", kittenId: "k1" });
    expect(next.village.sim[0]?.rank).toBe(0); // unchanged
  });

  it("PROMOTE_KITTEN fails if not enough gold", () => {
    const base = createInitialState();
    const k1: Kitten = { id: "k1", name: "A", surname: "S", age: 5, trait: "none", job: null, skills: {}, rank: 0, exp: 600, isFavorite: false, isLeader: false, birthYear: 0, appearance: { breed: "tabby", body: "slim", eyes: "large-amber", accessory: null }, originStory: "", traitFlavor: "", lifeEvents: [], portraitPath: null };
    const state = {
      ...base,
      village: { ...base.village, kittens: 1, sim: [k1] },
      resources: { ...base.resources, gold: { value: 10, maxValue: 0 } },
    };
    const next = applyAction(state, { type: "PROMOTE_KITTEN", kittenId: "k1" });
    expect(next.village.sim[0]?.rank).toBe(0); // unchanged
  });

  it("TOGGLE_FAVORITE flips isFavorite", () => {
    const base = createInitialState();
    const k1: Kitten = { id: "k1", name: "A", surname: "S", age: 5, trait: "none", job: null, skills: {}, rank: 0, exp: 0, isFavorite: false, isLeader: false, birthYear: 0, appearance: { breed: "tabby", body: "slim", eyes: "large-amber", accessory: null }, originStory: "", traitFlavor: "", lifeEvents: [], portraitPath: null };
    const state = {
      ...base,
      village: { ...base.village, kittens: 1, sim: [k1] },
    };
    const next = applyAction(state, { type: "TOGGLE_FAVORITE", kittenId: "k1" });
    expect(next.village.sim[0]?.isFavorite).toBe(true);

    const next2 = applyAction(next, { type: "TOGGLE_FAVORITE", kittenId: "k1" });
    expect(next2.village.sim[0]?.isFavorite).toBe(false);
  });

  it("UNASSIGN_KITTEN removes kitten from job", () => {
    const base = createInitialState();
    const k1: Kitten = { id: "k1", name: "A", surname: "S", age: 5, trait: "none", job: "farmer", skills: {}, rank: 0, exp: 0, isFavorite: false, isLeader: false, birthYear: 0, appearance: { breed: "tabby", body: "slim", eyes: "large-amber", accessory: null }, originStory: "", traitFlavor: "", lifeEvents: [], portraitPath: null };
    const state = {
      ...base,
      village: { ...base.village, kittens: 1, sim: [k1], jobs: { farmer: { value: 1 } } },
    };
    const next = applyAction(state, { type: "UNASSIGN_KITTEN", kittenId: "k1" });
    expect(next.village.sim[0]?.job).toBeNull();
    expect(next.village.jobs.farmer!.value).toBe(0);
  });

  it("UNASSIGN_KITTEN is no-op if kitten has no job", () => {
    const base = createInitialState();
    const k1: Kitten = { id: "k1", name: "A", surname: "S", age: 5, trait: "none", job: null, skills: {}, rank: 0, exp: 0, isFavorite: false, isLeader: false, birthYear: 0, appearance: { breed: "tabby", body: "slim", eyes: "large-amber", accessory: null }, originStory: "", traitFlavor: "", lifeEvents: [], portraitPath: null };
    const state = {
      ...base,
      village: { ...base.village, kittens: 1, sim: [k1] },
    };
    const next = applyAction(state, { type: "UNASSIGN_KITTEN", kittenId: "k1" });
    expect(next).toBe(state); // unchanged reference
  });
});

// ── Story 48-08: Leader and government ─────────────────────────────────────────

describe("Story 48-08: Leader and government", () => {
  it("SET_LEADER marks a kitten as leader and clears previous leader", () => {
    const base = createInitialState();
    const k1: Kitten = { id: "k1", name: "A", surname: "S", age: 5, trait: "scientist", job: null, skills: {}, rank: 0, exp: 0, isFavorite: false, isLeader: false, birthYear: 0, appearance: { breed: "tabby", body: "slim", eyes: "large-amber", accessory: null }, originStory: "", traitFlavor: "", lifeEvents: [], portraitPath: null };
    const k2: Kitten = { id: "k2", name: "B", surname: "S", age: 5, trait: "engineer", job: null, skills: {}, rank: 0, exp: 0, isFavorite: false, isLeader: false, birthYear: 0, appearance: { breed: "tabby", body: "slim", eyes: "large-amber", accessory: null }, originStory: "", traitFlavor: "", lifeEvents: [], portraitPath: null };
    const state = {
      ...base,
      village: { ...base.village, kittens: 2, sim: [k1, k2], leader: null },
    };
    const next = applyAction(state, { type: "SET_LEADER", kittenId: "k1" });
    expect(next.village.sim[0]?.isLeader).toBe(true);
    expect(next.village.leader).toBe("k1");

    // Set another leader clears the first
    const next2 = applyAction(next, { type: "SET_LEADER", kittenId: "k2" });
    expect(next2.village.sim[0]?.isLeader).toBe(false);
    expect(next2.village.sim[1]?.isLeader).toBe(true);
    expect(next2.village.leader).toBe("k2");
  });

  it("REMOVE_LEADER demotes the current leader", () => {
    const base = createInitialState();
    const k1: Kitten = { id: "k1", name: "A", surname: "S", age: 5, trait: "scientist", job: null, skills: {}, rank: 0, exp: 0, isFavorite: false, isLeader: true, birthYear: 0, appearance: { breed: "tabby", body: "slim", eyes: "large-amber", accessory: null }, originStory: "", traitFlavor: "", lifeEvents: [], portraitPath: null };
    const state = {
      ...base,
      village: { ...base.village, kittens: 1, sim: [k1], leader: "k1" },
    };
    const next = applyAction(state, { type: "REMOVE_LEADER" });
    expect(next.village.sim[0]?.isLeader).toBe(false);
    expect(next.village.leader).toBeNull();
  });

  it("getLeaderBonus returns correct bonus for leader traits", () => {
    // Import the function

    const k: Kitten = { id: "k1", name: "A", surname: "S", age: 5, trait: "scientist", job: null, skills: {}, rank: 2, exp: 0, isFavorite: false, isLeader: true, birthYear: 0, appearance: { breed: "tabby", body: "slim", eyes: "large-amber", accessory: null }, originStory: "", traitFlavor: "", lifeEvents: [], portraitPath: null };
    const bonus = getLeaderBonus(k);
    // scientist +5% science discount, rank 2 → scaling = (2+1)/1.4 ≈ 2.142
    expect(bonus!.type).toBe("scienceDiscount");
    expect(bonus!.value).toBeCloseTo(0.05 * (3 / 1.4));
  });

  it("getLeaderBonus rank 0 uses scale factor 1.0", () => {
    const k: Kitten = { id: "k1", name: "A", surname: "S", age: 5, trait: "engineer", job: null, skills: {}, rank: 0, exp: 0, isFavorite: false, isLeader: true, birthYear: 0, appearance: { breed: "tabby", body: "slim", eyes: "large-amber", accessory: null }, originStory: "", traitFlavor: "", lifeEvents: [], portraitPath: null };
    const bonus = getLeaderBonus(k);
    expect(bonus!.type).toBe("craftBonus");
    expect(bonus!.value).toBeCloseTo(0.05);
  });

  it("getLeaderBonus returns null for 'none' trait", () => {

    const k: Kitten = { id: "k1", name: "A", surname: "S", age: 5, trait: "none", job: null, skills: {}, rank: 0, exp: 0, isFavorite: false, isLeader: true, birthYear: 0, appearance: { breed: "tabby", body: "slim", eyes: "large-amber", accessory: null }, originStory: "", traitFlavor: "", lifeEvents: [], portraitPath: null };
    const bonus = getLeaderBonus(k);
    expect(bonus).toBeNull();
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

// ── Story 32-07: HOLD_FESTIVAL action ────────────────────────────────────────

describe("applyHoldFestival", () => {
  it("costs manpower:1500, culture:5000, parchment:2500 and sets festivalDays=400", () => {
    const base = createInitialState();
    const state = {
      ...base,
      resources: {
        ...base.resources,
        catpower: { value: 2000, maxValue: 5000 },
        culture: { value: 6000, maxValue: 0 },
        parchment: { value: 3000, maxValue: 0 },
      },
    };
    const next = applyHoldFestival(state);
    expect(next.resources.catpower?.value).toBe(500); // 2000 - 1500
    expect(next.resources.culture?.value).toBe(1000); // 6000 - 5000
    expect(next.resources.parchment?.value).toBe(500); // 3000 - 2500
    expect(next.calendar.festivalDays).toBe(400); // 100 days * 4 seasons
  });

  it("returns state unchanged if insufficient resources", () => {
    const base = createInitialState();
    const next = applyHoldFestival(base);
    expect(next).toBe(base);
    expect(next.calendar.festivalDays).toBe(0);
  });

  it("adds to festivalDays when carnivals perk is researched", () => {
    const base = createInitialState();
    const state = {
      ...base,
      resources: {
        ...base.resources,
        catpower: { value: 2000, maxValue: 5000 },
        culture: { value: 6000, maxValue: 0 },
        parchment: { value: 3000, maxValue: 0 },
      },
      calendar: { ...base.calendar, festivalDays: 200 },
      prestige: {
        ...base.prestige,
        perks: { carnivals: { researched: true, unlocked: true } },
      },
    };
    const next = applyHoldFestival(state);
    expect(next.calendar.festivalDays).toBe(600); // 200 + 400
  });
});

// ── computePollutionHappines: Pollution Level Boundaries ────────────────────

describe("computePollutionHappines", () => {
  const POL_LBASE = 10_000_000;

  it("returns 0 for zero or negative pollution", () => {
    expect(computePollutionHappines(0)).toBe(0);
    expect(computePollutionHappines(-100)).toBe(0);
  });

  describe("Level 0: No pollution penalty (pollutionLevel = 0)", () => {
    it("returns 0 for pollution < 1,000,000", () => {
      expect(computePollutionHappines(999_999)).toBe(0);
      expect(computePollutionHappines(500_000)).toBe(0);
      expect(computePollutionHappines(1)).toBe(0);
    });
  });

  describe("Level 1: Linear ramp starting at 50% of range (pollutionLevel = 1)", () => {
    const level1Min = 1_000_000; // Math.floor(Math.log10(1_000_000 * 10 / 10_000_000)) = 0
    const level1Max = 100_000_000; // Math.floor(Math.log10(100_000_000 * 10 / 10_000_000)) = 2, so level 1 goes up to just below this
    const halfThreshold = POL_LBASE * 10 / 2; // 10_000_000 * 10 / 2 = 50_000_000

    it("returns 0 below halfThreshold", () => {
      expect(computePollutionHappines(level1Min)).toBe(0);
      expect(computePollutionHappines(halfThreshold - 1)).toBe(0);
    });

    it("returns negative value at and above halfThreshold", () => {
      const atHalf = computePollutionHappines(halfThreshold);
      const aboveHalf = computePollutionHappines(halfThreshold + 1_000_000);
      expect(atHalf).toBeCloseTo(0, 10); // exactly at threshold is 0
      expect(aboveHalf).toBeLessThan(0);
      expect(aboveHalf).toBeCloseTo(-0.00000032 * 1_000_000, 5);
    });

    it("scales linearly with pollution above halfThreshold", () => {
      const penalty1 = computePollutionHappines(halfThreshold + 1_000_000);
      const penalty2 = computePollutionHappines(halfThreshold + 2_000_000);
      const diff = penalty2 - penalty1;
      expect(diff).toBeCloseTo(-0.00000032 * 1_000_000, 5);
    });
  });

  describe("Level 2: Log-based penalty with coefficient 1.08 (pollutionLevel = 2)", () => {
    const level2Min = 100_000_000; // Math.floor(Math.log10(100_000_000 * 10 / 10_000_000)) = 2
    const level2Max = 1_000_000_000; // Math.floor(Math.log10(1_000_000_000 * 10 / 10_000_000)) = 3

    it("applies log-based penalty at level 2", () => {
      const pollution = 500_000_000; // well into level 2
      const result = computePollutionHappines(pollution);
      const expected = -Math.log(pollution) * 1.08;
      expect(result).toBeCloseTo(expected, 4);
    });

    it("transitions from level 1 to level 2 around 100 million", () => {
      const level1Penalty = computePollutionHappines(50_000_000); // upper level 1
      const level2Penalty = computePollutionHappines(100_000_000); // level 2
      // Level 2 has steeper penalty curve
      expect(level2Penalty).toBeLessThan(level1Penalty);
    });
  });

  describe("Level 3: Log-based penalty with coefficient 1.18 (pollutionLevel = 3)", () => {
    const level3Min = 1_000_000_000; // Math.floor(Math.log10(1_000_000_000 * 10 / 10_000_000)) = 3

    it("applies log-based penalty at level 3", () => {
      const pollution = 5_000_000_000; // well into level 3
      const result = computePollutionHappines(pollution);
      const expected = -Math.log(pollution) * 1.18;
      expect(result).toBeCloseTo(expected, 4);
    });

    it("has steeper penalty than level 2", () => {
      const level2Pollution = 500_000_000;
      const level3Pollution = 5_000_000_000;
      const penalty2 = computePollutionHappines(level2Pollution);
      const penalty3 = computePollutionHappines(level3Pollution);
      // Higher coefficient (1.18 vs 1.08) means steeper penalty
      expect(penalty3).toBeLessThan(penalty2);
    });
  });

  describe("Level 4+: Log-based penalty with coefficient 1.2 (pollutionLevel >= 4)", () => {
    const level4Min = 10_000_000_000; // Math.floor(Math.log10(10_000_000_000 * 10 / 10_000_000)) = 4

    it("applies log-based penalty at level 4", () => {
      const pollution = 50_000_000_000;
      const result = computePollutionHappines(pollution);
      const expected = -Math.log(pollution) * 1.2;
      expect(result).toBeCloseTo(expected, 4);
    });

    it("has steepest penalty at highest levels", () => {
      const level3Pollution = 5_000_000_000;
      const level4Pollution = 50_000_000_000;
      const penalty3 = computePollutionHappines(level3Pollution);
      const penalty4 = computePollutionHappines(level4Pollution);
      // Coefficient 1.2 is highest, plus log grows
      expect(penalty4).toBeLessThan(penalty3);
    });
  });

  it("boundary test: transitions between all levels", () => {
    const tests = [
      { pollution: 999_999, expectedPenalty: 0 },
      { pollution: 1_000_000, expectedPenalty: 0 },
      { pollution: 50_000_000, expectedPenalty: 0 }, // below halfThreshold
      { pollution: 50_000_001, expectedPenalty: "negative" }, // above halfThreshold
      { pollution: 100_000_000, expectedPenalty: "negative" }, // level 2
      { pollution: 1_000_000_000, expectedPenalty: "negative" }, // level 3
      { pollution: 10_000_000_000, expectedPenalty: "negative" }, // level 4
    ];

    for (const test of tests) {
      const result = computePollutionHappines(test.pollution);
      if (test.expectedPenalty === 0) {
        expect(result).toBeCloseTo(0, 10);
      } else if (test.expectedPenalty === "negative") {
        expect(result).toBeLessThan(0);
      }
    }
  });

  describe("Precise Boundary Tests", () => {
    it("pollutionLevel 0 → 1 boundary at 1,000,000", () => {
      const justBelow = 999_999;
      const justAt = 1_000_000;
      const justAbove = 1_000_001;

      expect(computePollutionHappines(justBelow)).toBe(0);
      expect(computePollutionHappines(justAt)).toBe(0);
      expect(computePollutionHappines(justAbove)).toBe(0);
    });

    it("Level 1 halfThreshold transition at 50,000,000", () => {
      const halfThreshold = POL_LBASE * 10 / 2; // 50,000,000
      const justBelow = halfThreshold - 1;
      const justAt = halfThreshold;
      const justAbove = halfThreshold + 1;

      expect(computePollutionHappines(justBelow)).toBe(0);
      expect(computePollutionHappines(justAt)).toBeCloseTo(0, 10);
      expect(computePollutionHappines(justAbove)).toBeLessThan(0);
    });

    it("pollutionLevel 1 → 2 boundary at 100,000,000", () => {
      // pollutionLevel = Math.floor(Math.log10(pollution * 10 / POL_LBASE))
      // At 100,000,000: Math.log10(100,000,000 * 10 / 10,000,000) = Math.log10(100) = 2
      const justBelow = 99_999_999;
      const justAt = 100_000_000;
      const justAbove = 100_000_001;

      const belowResult = computePollutionHappines(justBelow);
      const atResult = computePollutionHappines(justAt);
      const aboveResult = computePollutionHappines(justAbove);

      // Just below should use level 1 formula (coefficient changes)
      // Just at and above should use level 2 formula
      expect(belowResult).toBeLessThan(0); // level 1
      expect(atResult).toBeLessThan(0); // level 2
      expect(aboveResult).toBeLessThan(0); // level 2

      // Level 2 has higher coefficient (1.08 vs linear), so penalty should be steeper
      expect(Math.abs(atResult)).toBeGreaterThan(Math.abs(belowResult));
    });

    it("pollutionLevel 2 → 3 boundary at 1,000,000,000", () => {
      // At 1,000,000,000: Math.log10(1,000,000,000 * 10 / 10,000,000) = Math.log10(1000) = 3
      const justBelow = 999_999_999;
      const justAt = 1_000_000_000;
      const justAbove = 1_000_000_001;

      const belowResult = computePollutionHappines(justBelow);
      const atResult = computePollutionHappines(justAt);
      const aboveResult = computePollutionHappines(justAbove);

      // Just below uses level 2 (coefficient 1.08)
      // Just at and above use level 3 (coefficient 1.18)
      expect(belowResult).toBeLessThan(0); // level 2
      expect(atResult).toBeLessThan(0); // level 3
      expect(aboveResult).toBeLessThan(0); // level 3

      // Level 3 has higher coefficient than level 2, so penalty should be steeper
      expect(Math.abs(atResult)).toBeGreaterThan(Math.abs(belowResult));
    });

    it("pollutionLevel 3 → 4 boundary at 10,000,000,000", () => {
      // At 10,000,000,000: Math.log10(10,000,000,000 * 10 / 10,000,000) = Math.log10(10000) = 4
      const justBelow = 9_999_999_999;
      const justAt = 10_000_000_000;
      const justAbove = 10_000_000_001;

      const belowResult = computePollutionHappines(justBelow);
      const atResult = computePollutionHappines(justAt);
      const aboveResult = computePollutionHappines(justAbove);

      // Just below uses level 3 (coefficient 1.18)
      // Just at and above use level 4+ (coefficient 1.2)
      expect(belowResult).toBeLessThan(0); // level 3
      expect(atResult).toBeLessThan(0); // level 4
      expect(aboveResult).toBeLessThan(0); // level 4

      // Level 4 has higher coefficient than level 3, so penalty should be steeper
      expect(Math.abs(atResult)).toBeGreaterThan(Math.abs(belowResult));
    });

    it("Level 1 linear scale: penalty increases by 0.32 per million above threshold", () => {
      const halfThreshold = POL_LBASE * 10 / 2;
      const coeff = -0.00000032;

      const base = computePollutionHappines(halfThreshold + 1_000_000);
      const plusOne = computePollutionHappines(halfThreshold + 2_000_000);
      const plusTwo = computePollutionHappines(halfThreshold + 3_000_000);

      // Difference should be constant (linear)
      const diff1 = plusOne - base;
      const diff2 = plusTwo - plusOne;
      const expectedDiff = coeff * 1_000_000;

      expect(diff1).toBeCloseTo(expectedDiff, 8);
      expect(diff2).toBeCloseTo(expectedDiff, 8);
    });

    it("Level 2 log scale: consistent with -Math.log(x) * 1.08", () => {
      const pollution = 250_000_000; // well into level 2
      const result = computePollutionHappines(pollution);
      const expected = -Math.log(pollution) * 1.08;
      expect(result).toBeCloseTo(expected, 4);
    });

    it("Level 3 log scale: consistent with -Math.log(x) * 1.18", () => {
      const pollution = 2_500_000_000; // well into level 3
      const result = computePollutionHappines(pollution);
      const expected = -Math.log(pollution) * 1.18;
      expect(result).toBeCloseTo(expected, 4);
    });

    it("Level 4+ log scale: consistent with -Math.log(x) * 1.2", () => {
      const pollution = 25_000_000_000; // well into level 4
      const result = computePollutionHappines(pollution);
      const expected = -Math.log(pollution) * 1.2;
      expect(result).toBeCloseTo(expected, 4);
    });
  });
});

// ── Epic 48: Cross-manager integration test ──────────────────────────────────

describe("Epic 48: Village multi-tick integration", () => {
  it("spawns kittens, assigns jobs, grows skills, and promotes over multiple ticks", () => {
    let state = createInitialState();
    // Setup: enough resources for kitten growth
    state = {
      ...state,
      effectCache: {
        ...state.effectCache,
        kittensPerTickBase: 0.5,
        maxKittens: 20,
      },
      resources: {
        ...state.resources,
        catnip: { value: 10000, maxValue: 50000 },
        gold: { value: 100, maxValue: 0 },
      },
    };

    const manager = new VillageManager();

    // Run ticks until we have kittens
    for (let i = 0; i < 5; i++) {
      state = manager.update(state);
    }
    expect(state.village.kittens).toBeGreaterThanOrEqual(2);
    expect(state.village.sim.length).toBe(state.village.kittens);

    // Assign a kitten as farmer
    state = applyAction(state, { type: "ASSIGN_JOB", job: "farmer" });
    expect(state.village.jobs.farmer!.value).toBe(1);
    const farmerId = state.village.sim.find((k) => k.job === "farmer")!.id;

    // Run more ticks for skill growth
    for (let i = 0; i < 10; i++) {
      state = manager.update(state);
    }
    const farmer = state.village.sim.find((k) => k.id === farmerId)!;
    expect(farmer.skills.farmer).toBeGreaterThan(0);

    // Set farmer as leader
    state = applyAction(state, { type: "SET_LEADER", kittenId: farmerId });
    expect(state.village.leader).toBe(farmerId);
    expect(state.village.sim.find((k) => k.id === farmerId)!.isLeader).toBe(true);

    // Toggle favorite
    state = applyAction(state, { type: "TOGGLE_FAVORITE", kittenId: farmerId });
    expect(state.village.sim.find((k) => k.id === farmerId)!.isFavorite).toBe(true);

    // Remove leader
    state = applyAction(state, { type: "REMOVE_LEADER" });
    expect(state.village.leader).toBeNull();

    // Unassign kitten from job
    state = applyAction(state, { type: "UNASSIGN_KITTEN", kittenId: farmerId });
    expect(state.village.sim.find((k) => k.id === farmerId)!.job).toBeNull();
    expect(state.village.jobs.farmer!.value).toBe(0);
  });
});
