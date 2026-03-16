import { describe, expect, it } from "vitest";
import {
  BUILDING_DEFS,
  BuildingManager,
  canAfford,
  createInitialBuildings,
  getBuildingPrice,
} from "./buildings.js";
import { createInitialResources } from "./resources.js";
import { createInitialState } from "./state.js";

describe("BUILDING_DEFS", () => {
  it("contains field", () => {
    expect(BUILDING_DEFS.find((b) => b.name === "field")).toBeDefined();
  });

  it("contains all core early-game buildings", () => {
    const names = BUILDING_DEFS.map((b) => b.name);
    for (const name of [
      "field",
      "pasture",
      "aqueduct",
      "hut",
      "logHouse",
      "mansion",
      "library",
      "academy",
      "mine",
      "barn",
      "warehouse",
    ]) {
      expect(names).toContain(name);
    }
  });

  it("field has catnipPerTickBase effect of 0.125", () => {
    const field = BUILDING_DEFS.find((b) => b.name === "field");
    expect(field?.effects.catnipPerTickBase).toBe(0.125);
  });

  it("field has price catnip:10 and priceRatio 1.12", () => {
    const field = BUILDING_DEFS.find((b) => b.name === "field");
    expect(field?.prices[0]?.name).toBe("catnip");
    expect(field?.prices[0]?.val).toBe(10);
    expect(field?.priceRatio).toBe(1.12);
  });

  it("hut has maxKittens:2 and manpowerMax:75", () => {
    const hut = BUILDING_DEFS.find((b) => b.name === "hut");
    expect(hut?.effects.maxKittens).toBe(2);
    expect(hut?.effects.manpowerMax).toBe(75);
  });

  it("barn has catnipMax:5000", () => {
    const barn = BUILDING_DEFS.find((b) => b.name === "barn");
    expect(barn?.effects.catnipMax).toBe(5000);
  });

  it("mine has mineralsRatio:0.2", () => {
    const mine = BUILDING_DEFS.find((b) => b.name === "mine");
    expect(mine?.effects.mineralsRatio).toBe(0.2);
  });
});

describe("createInitialBuildings", () => {
  it("returns an entry for every building in BUILDING_DEFS", () => {
    const buildings = createInitialBuildings();
    for (const def of BUILDING_DEFS) {
      expect(buildings[def.name]).toBeDefined();
    }
  });

  it("all buildings start at val:0, on:0", () => {
    const buildings = createInitialBuildings();
    for (const def of BUILDING_DEFS) {
      expect(buildings[def.name]?.val).toBe(0);
      expect(buildings[def.name]?.on).toBe(0);
    }
  });
});

describe("getBuildingPrice", () => {
  it("returns base price when count=0", () => {
    const field = BUILDING_DEFS.find((b) => b.name === "field");
    if (!field) throw new Error("field not found");
    const prices = getBuildingPrice(field, 0);
    expect(prices[0]?.val).toBe(10);
  });

  it("scales price by priceRatio^count when count=1", () => {
    const field = BUILDING_DEFS.find((b) => b.name === "field");
    if (!field) throw new Error("field not found");
    const prices = getBuildingPrice(field, 1);
    expect(prices[0]?.val).toBeCloseTo(10 * 1.12);
  });

  it("scales price by priceRatio^count when count=2", () => {
    const field = BUILDING_DEFS.find((b) => b.name === "field");
    if (!field) throw new Error("field not found");
    const prices = getBuildingPrice(field, 2);
    expect(prices[0]?.val).toBeCloseTo(10 * 1.12 * 1.12);
  });

  it("scales all prices (multi-price building)", () => {
    const pasture = BUILDING_DEFS.find((b) => b.name === "pasture");
    if (!pasture) throw new Error("pasture not found");
    const prices = getBuildingPrice(pasture, 1);
    expect(prices.length).toBe(2);
    expect(prices[0]?.val).toBeCloseTo(100 * 1.15);
    expect(prices[1]?.val).toBeCloseTo(10 * 1.15);
  });
});

describe("canAfford", () => {
  it("returns true when all resources are sufficient", () => {
    const resources = {
      ...createInitialResources(),
      catnip: { value: 100, maxValue: 5000 },
    };
    const prices = [{ name: "catnip", val: 10 }];
    expect(canAfford(prices, resources)).toBe(true);
  });

  it("returns false when a resource is insufficient", () => {
    const resources = {
      ...createInitialResources(),
      catnip: { value: 5, maxValue: 5000 },
    };
    const prices = [{ name: "catnip", val: 10 }];
    expect(canAfford(prices, resources)).toBe(false);
  });

  it("returns false when a resource is missing from state", () => {
    const prices = [{ name: "catnip", val: 10 }];
    expect(canAfford(prices, {})).toBe(false);
  });

  it("returns true when cost is exactly equal to available", () => {
    const resources = {
      ...createInitialResources(),
      catnip: { value: 10, maxValue: 5000 },
    };
    const prices = [{ name: "catnip", val: 10 }];
    expect(canAfford(prices, resources)).toBe(true);
  });

  it("returns true for empty prices array", () => {
    expect(canAfford([], createInitialResources())).toBe(true);
  });
});

describe("BuildingManager", () => {
  const manager = new BuildingManager();

  describe("updateEffects", () => {
    it("returns catnipPerTickBase for fields (non-Max effect uses on)", () => {
      const state = {
        ...createInitialState(),
        buildings: {
          ...createInitialBuildings(),
          field: { val: 3, on: 3 },
        },
      };
      const effects = manager.updateEffects(state);
      expect(effects.catnipPerTickBase).toBeCloseTo(0.125 * 3);
    });

    it("uses val (not on) for Max effects", () => {
      const state = {
        ...createInitialState(),
        buildings: {
          ...createInitialBuildings(),
          barn: { val: 2, on: 0 },
        },
      };
      const effects = manager.updateEffects(state);
      expect(effects.catnipMax).toBe(5000 * 2);
    });

    it("returns 0 for non-Max effects when on=0", () => {
      const state = {
        ...createInitialState(),
        buildings: {
          ...createInitialBuildings(),
          field: { val: 1, on: 0 },
        },
      };
      const effects = manager.updateEffects(state);
      expect(effects.catnipPerTickBase ?? 0).toBe(0);
    });

    it("returns catnipRatio for aqueduct", () => {
      const state = {
        ...createInitialState(),
        buildings: {
          ...createInitialBuildings(),
          aqueduct: { val: 1, on: 1 },
        },
      };
      const effects = manager.updateEffects(state);
      expect(effects.catnipRatio).toBeCloseTo(0.03);
    });

    it("returns empty object when no buildings are built", () => {
      const state = { ...createInitialState(), buildings: createInitialBuildings() };
      const effects = manager.updateEffects(state);
      // All buildings at val=0, on=0 → all effects are 0 or absent
      expect(effects.catnipPerTickBase ?? 0).toBe(0);
    });

    it("handles missing building entry in state gracefully", () => {
      // State where buildings is empty — covers the !entry continue branch
      const state = {
        ...createInitialState(),
        buildings: {} as Record<string, { val: number; on: number }>,
      };
      const effects = manager.updateEffects(state);
      expect(effects.catnipPerTickBase ?? 0).toBe(0);
    });

    it("sums effects from multiple building types", () => {
      const state = {
        ...createInitialState(),
        buildings: {
          ...createInitialBuildings(),
          library: { val: 1, on: 1 },
          academy: { val: 1, on: 1 },
        },
      };
      const effects = manager.updateEffects(state);
      // scienceRatio: 0.1 (library) + 0.2 (academy) = 0.3
      expect(effects.scienceRatio).toBeCloseTo(0.3);
      // scienceMax: 250 (library, val=1) + 500 (academy, val=1) = 750
      expect(effects.scienceMax).toBe(750);
    });
  });

  describe("update", () => {
    it("returns state unchanged (buildings don't self-update)", () => {
      const state = { ...createInitialState(), buildings: createInitialBuildings() };
      const next = manager.update(state);
      expect(next.buildings).toBe(state.buildings);
    });
  });

  describe("save / load", () => {
    it("save returns the buildings object", () => {
      const state = {
        ...createInitialState(),
        buildings: {
          ...createInitialBuildings(),
          field: { val: 5, on: 5 },
        },
      };
      const saved = manager.save(state);
      expect(saved).toEqual(state.buildings);
    });

    it("load restores building values from saved data", () => {
      const state = { ...createInitialState(), buildings: createInitialBuildings() };
      const saved = { field: { val: 3, on: 3 } };
      const restored = manager.load(saved, state);
      expect(restored.buildings.field?.val).toBe(3);
      expect(restored.buildings.field?.on).toBe(3);
    });

    it("load falls back to initial for missing entries", () => {
      const state = { ...createInitialState(), buildings: createInitialBuildings() };
      const restored = manager.load({}, state);
      expect(restored.buildings.field?.val).toBe(0);
    });

    it("handles null saved value gracefully", () => {
      const state = { ...createInitialState(), buildings: createInitialBuildings() };
      const restored = manager.load(null, state);
      expect(restored.buildings.field?.val).toBe(0);
    });
  });

  describe("resetState", () => {
    it("resets all buildings to val:0, on:0", () => {
      const state = {
        ...createInitialState(),
        buildings: {
          ...createInitialBuildings(),
          field: { val: 10, on: 10 },
        },
      };
      const reset = manager.resetState(state);
      expect(reset.buildings.field?.val).toBe(0);
      expect(reset.buildings.field?.on).toBe(0);
    });
  });
});
