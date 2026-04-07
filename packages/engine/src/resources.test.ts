import type { Serializable } from "@kittens/shared";
import { describe, expect, it } from "vitest";
import {
  RESOURCE_NAMES,
  ResourceManager,
  calcResourcePerTick,
  createInitialResources,
} from "./resources.js";
import { createInitialState } from "./state.js";

describe("RESOURCE_NAMES", () => {
  it("includes catnip", () => {
    expect(RESOURCE_NAMES).toContain("catnip");
  });

  it("includes wood, minerals, coal, iron, titanium, gold, oil, uranium", () => {
    const core = ["wood", "minerals", "coal", "iron", "titanium", "gold", "oil", "uranium"];
    for (const name of core) {
      expect(RESOURCE_NAMES).toContain(name);
    }
  });

  it("includes luxury resources", () => {
    expect(RESOURCE_NAMES).toContain("furs");
    expect(RESOURCE_NAMES).toContain("ivory");
    expect(RESOURCE_NAMES).toContain("spice");
  });

  it("includes science, culture, faith, catpower", () => {
    expect(RESOURCE_NAMES).toContain("science");
    expect(RESOURCE_NAMES).toContain("culture");
    expect(RESOURCE_NAMES).toContain("faith");
    expect(RESOURCE_NAMES).toContain("catpower");
  });

  it("does not include kittens because population is not a generic resource", () => {
    expect(RESOURCE_NAMES).not.toContain("kittens");
  });
});

describe("createInitialResources", () => {
  it("returns an entry for every resource name", () => {
    const resources = createInitialResources();
    for (const name of RESOURCE_NAMES) {
      expect(resources[name]).toBeDefined();
    }
  });

  it("all resources start at value 0", () => {
    const resources = createInitialResources();
    for (const name of RESOURCE_NAMES) {
      expect(resources[name]?.value).toBe(0);
    }
  });

  it("all resources start at maxValue 0", () => {
    const resources = createInitialResources();
    for (const name of RESOURCE_NAMES) {
      expect(resources[name]?.maxValue).toBe(0);
    }
  });
});

describe("calcResourcePerTick", () => {
  it("returns 0 when all effects are absent", () => {
    expect(calcResourcePerTick({}, "catnip")).toBe(0);
  });

  it("applies base when only PerTickBase is set", () => {
    expect(calcResourcePerTick({ catnipPerTickBase: 0.125 }, "catnip")).toBe(0.125);
  });

  it("multiplies base by (1 + ratio)", () => {
    const cache = { catnipPerTickBase: 0.125, catnipRatio: 0.03 };
    expect(calcResourcePerTick(cache, "catnip")).toBeCloseTo(0.125 * 1.03);
  });

  it("adds PerTick directly without ratio scaling", () => {
    const cache = { catnipPerTick: 0.5 };
    expect(calcResourcePerTick(cache, "catnip")).toBe(0.5);
  });

  it("adds PerTickAutoprod directly", () => {
    const cache = { ironPerTickAutoprod: 0.02 };
    expect(calcResourcePerTick(cache, "iron")).toBe(0.02);
  });

  it("adds PerTickProd directly", () => {
    const cache = { manuscriptPerTickProd: 0.008 };
    expect(calcResourcePerTick(cache, "manuscript")).toBe(0.008);
  });

  it("adds PerTickCon (consumption, negative value) without ratio scaling", () => {
    const cache = { catnipPerTickBase: 1.0, catnipPerTickCon: -0.85 };
    expect(calcResourcePerTick(cache, "catnip")).toBeCloseTo(0.15);
  });

  it("applies full formula: base*(1+ratio) + perTick + perTickCon", () => {
    const cache = {
      catnipPerTickBase: 1.0,
      catnipRatio: 0.5,
      catnipPerTick: 0.1,
      catnipPerTickProd: 0.03,
      catnipPerTickAutoprod: 0.05,
      catnipPerTickCon: -0.2,
    };
    // 1.0 * 1.5 + 0.1 + 0.03 + 0.05 - 0.2 = 1.48
    expect(calcResourcePerTick(cache, "catnip")).toBeCloseTo(1.48);
  });

  it("works for non-catnip resources", () => {
    const cache = { woodPerTickBase: 0.018 };
    expect(calcResourcePerTick(cache, "wood")).toBe(0.018);
  });
});

describe("ResourceManager", () => {
  const manager = new ResourceManager();

  describe("update", () => {
    it("adds perTick to resource value", () => {
      const state = {
        ...createInitialState(),
        resources: {
          ...createInitialResources(),
          catnip: { value: 0, maxValue: 100 },
        },
        effectCache: { catnipPerTickBase: 0.125 },
      };
      const next = manager.update(state);
      expect(next.resources.catnip?.value).toBeCloseTo(0.125);
    });

    it("clamps resource value to maxValue", () => {
      const state = {
        ...createInitialState(),
        resources: {
          ...createInitialResources(),
          catnip: { value: 99.9, maxValue: 100 },
        },
        effectCache: { catnipMax: 100, catnipPerTickBase: 0.5 },
      };
      const next = manager.update(state);
      expect(next.resources.catnip?.value).toBe(100);
    });

    it("does not let resource go below 0", () => {
      const state = {
        ...createInitialState(),
        resources: {
          ...createInitialResources(),
          catnip: { value: 0.1, maxValue: 100 },
        },
        effectCache: { catnipPerTickCon: -10 },
      };
      const next = manager.update(state);
      expect(next.resources.catnip?.value).toBe(0);
    });

    it("updates maxValue from effectCache {name}Max", () => {
      const state = {
        ...createInitialState(),
        resources: {
          ...createInitialResources(),
          catnip: { value: 0, maxValue: 0 },
        },
        effectCache: { catnipMax: 5000 },
      };
      const next = manager.update(state);
      expect(next.resources.catnip?.maxValue).toBe(5000);
    });

    it("clears stale temporary caps when no current {name}Max effect exists", () => {
      const state = {
        ...createInitialState(),
        resources: {
          ...createInitialResources(),
          unicorns: { value: 10, maxValue: 10 },
          tears: { value: 1, maxValue: 1 },
          alicorn: { value: 0.2, maxValue: 0.2 },
        },
        effectCache: {},
      };
      const next = manager.update(state);
      expect(next.resources.unicorns?.maxValue).toBe(0);
      expect(next.resources.tears?.maxValue).toBe(0);
      expect(next.resources.alicorn?.maxValue).toBe(0);
    });

    it("keeps active temporary caps when the current effect cache still provides them", () => {
      // Legacy over-cap preservation: if value already exceeds cap, it is preserved
      // (only growth is blocked, not the existing stock). Legacy addRes uses
      // limit = Math.max(prevValue, maxValue), so 500 with cap 10 stays 500.
      const state = {
        ...createInitialState(),
        resources: {
          ...createInitialResources(),
          unicorns: { value: 500, maxValue: 10 },
        },
        effectCache: { unicornsMax: 10 },
      };
      const next = manager.update(state);
      expect(next.resources.unicorns?.maxValue).toBe(10);
      expect(next.resources.unicorns?.value).toBe(500); // over-cap stock preserved
    });

    it("does not mutate input state", () => {
      const state = {
        ...createInitialState(),
        resources: {
          ...createInitialResources(),
          catnip: { value: 5, maxValue: 100 },
        },
        effectCache: { catnipPerTickBase: 1 },
      };
      const originalValue = state.resources.catnip?.value;
      manager.update(state);
      expect(state.resources.catnip?.value).toBe(originalValue);
    });

    it("handles missing resource entry in state (uses 0/0 fallback)", () => {
      // A state where 'wood' is absent — covers the fallback branch in update()
      const state = {
        ...createInitialState(),
        resources: {} as Record<string, { value: number; maxValue: number }>,
        effectCache: { woodMax: 100, woodPerTickBase: 0.5 },
      };
      const next = manager.update(state);
      // wood starts at 0 (fallback), gets 0.5 perTick, stays at 0.5
      expect(next.resources.wood?.value).toBeCloseTo(0.5);
    });

    it("treats maxValue 0 as uncapped for positive perTick gains", () => {
      const state = {
        ...createInitialState(),
        resources: {
          ...createInitialResources(),
          catnip: { value: 0, maxValue: 0 },
        },
        effectCache: { catnipPerTickBase: 1.0 },
      };
      const next = manager.update(state);
      expect(next.resources.catnip?.value).toBe(1);
    });

    it("does not accumulate a kittens stockpile from kittensPerTickBase", () => {
      const initial = createInitialState();
      const state = {
        ...initial,
        resources: createInitialResources(),
        village: { ...initial.village, kittens: 3 },
        effectCache: { kittensPerTickBase: 0.01, maxKittens: 10 },
      };
      const next = manager.update(state);
      expect("kittens" in next.resources).toBe(false);
      expect(next.village.kittens).toBe(3);
    });

    it("does not clamp a resource already above a zero maxValue back to 0", () => {
      const state = {
        ...createInitialState(),
        resources: {
          ...createInitialResources(),
          catnip: { value: 1, maxValue: 0 },
        },
        effectCache: { catnipPerTickBase: 0 },
      };
      const next = manager.update(state);
      expect(next.resources.catnip?.value).toBe(1);
    });
  });

  describe("updateEffects", () => {
    it("returns empty object (resources don't contribute effects)", () => {
      const state = createInitialState();
      expect(manager.updateEffects(state)).toEqual({});
    });
  });

  describe("load edge cases", () => {
    it("handles null saved value gracefully", () => {
      const state = {
        ...createInitialState(),
        resources: createInitialResources(),
        effectCache: {},
      };
      const restored = manager.load(null, state);
      expect(restored.resources.catnip?.value).toBe(0);
    });

    it("handles array saved value gracefully", () => {
      const state = {
        ...createInitialState(),
        resources: createInitialResources(),
        effectCache: {},
      };
      const restored = manager.load([] as Serializable, state);
      expect(restored.resources.catnip?.value).toBe(0);
    });
  });

  describe("save / load", () => {
    it("save returns the resources object", () => {
      const state = {
        ...createInitialState(),
        resources: {
          ...createInitialResources(),
          catnip: { value: 42, maxValue: 5000 },
        },
        effectCache: {},
      };
      const saved = manager.save(state);
      expect(saved).toEqual(state.resources);
    });

    it("load restores resource values from saved data", () => {
      const state = {
        ...createInitialState(),
        resources: createInitialResources(),
        effectCache: {},
      };
      const saved = { catnip: { value: 99, maxValue: 5000 } };
      const restored = manager.load(saved, state);
      expect(restored.resources.catnip?.value).toBe(99);
      expect(restored.resources.catnip?.maxValue).toBe(5000);
    });

    it("load falls back to initial resources for missing entries", () => {
      const state = {
        ...createInitialState(),
        resources: createInitialResources(),
        effectCache: {},
      };
      const restored = manager.load({}, state);
      expect(restored.resources.catnip?.value).toBe(0);
    });

    it("load drops stale kittens entries from saved resource data", () => {
      const state = {
        ...createInitialState(),
        resources: createInitialResources(),
        effectCache: {},
      };
      const saved = {
        catnip: { value: 99, maxValue: 5000 },
        kittens: { value: 999, maxValue: 0 },
      };
      const restored = manager.load(saved as Serializable, state);
      expect(restored.resources.catnip?.value).toBe(99);
      expect("kittens" in restored.resources).toBe(false);
    });
  });

  describe("resetState", () => {
    it("resets all resources to initial values", () => {
      const state = {
        ...createInitialState(),
        resources: {
          ...createInitialResources(),
          catnip: { value: 999, maxValue: 5000 },
        },
        effectCache: {},
      };
      const reset = manager.resetState(state);
      expect(reset.resources.catnip?.value).toBe(0);
    });
  });

});
