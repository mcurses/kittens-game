import { describe, expect, it } from "vitest";
import { createInitialResources } from "./resources.js";
import { createInitialState } from "./state.js";
import { JOB_DEFS, VillageManager, createInitialVillage, totalAssignedKittens } from "./village.js";

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
