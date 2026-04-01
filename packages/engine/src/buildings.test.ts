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

  it("hut has maxKittens:2 and catpowerMax:75", () => {
    const hut = BUILDING_DEFS.find((b) => b.name === "hut");
    expect(hut?.effects.maxKittens).toBe(2);
    expect(hut?.effects.catpowerMax).toBe(75);
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

  it("applies global priceRatio from effectCache (prestige perk discount)", () => {
    // priceRatio: -0.01 → effective ratio = 1.12 + getLimitedDR(-0.01, 0.12)
    // getLimitedDR(-0.01, 0.12): abs(0.01) < 0.75*0.12=0.09 → undiminished → -0.01
    // effective ratio = 1.11
    const field = BUILDING_DEFS.find((b) => b.name === "field");
    if (!field) throw new Error("field not found");
    const prices = getBuildingPrice(field, 1, { priceRatio: -0.01 });
    expect(prices[0]?.val).toBeCloseTo(10 * 1.11);
  });

  it("applies per-building PriceRatio from effectCache", () => {
    const field = BUILDING_DEFS.find((b) => b.name === "field");
    if (!field) throw new Error("field not found");
    const prices = getBuildingPrice(field, 1, { fieldPriceRatio: -0.05 });
    // effective ratio = 1.12 - 0.05 = 1.07
    expect(prices[0]?.val).toBeCloseTo(10 * 1.07);
  });

  it("effectCache with no relevant keys yields same result as no effectCache", () => {
    const field = BUILDING_DEFS.find((b) => b.name === "field");
    if (!field) throw new Error("field not found");
    expect(getBuildingPrice(field, 2, {})[0]?.val).toBeCloseTo(
      getBuildingPrice(field, 2)[0]?.val ?? 0,
    );
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
    it("returns state unchanged when no buildings meet unlock thresholds", () => {
      const state = { ...createInitialState(), buildings: createInitialBuildings() };
      const next = manager.update(state);
      expect(next.buildings).toBe(state.buildings);
    });

    it("auto-unlocks defaultUnlockable building when unlockRatio threshold is met", () => {
      const state = {
        ...createInitialState(),
        resources: { ...createInitialResources(), catnip: { value: 5, maxValue: 0 } },
      };
      const next = manager.update(state);
      expect(next.buildings.field?.unlocked).toBe(true);
    });

    it("does NOT unlock pasture (requiredTech:animal) when tech is not researched", () => {
      const state = {
        ...createInitialState(),
        resources: {
          ...createInitialResources(),
          catnip: { value: 200, maxValue: 0 },
          wood: { value: 20, maxValue: 0 },
        },
        // animal tech not researched (default)
      };
      const next = manager.update(state);
      expect(next.buildings.pasture?.unlocked).toBeFalsy();
    });

    it("unlocks pasture when animal tech is researched AND resources meet threshold", () => {
      const state = {
        ...createInitialState(),
        resources: {
          ...createInitialResources(),
          catnip: { value: 200, maxValue: 0 },
          wood: { value: 20, maxValue: 0 },
        },
        science: {
          ...createInitialState().science,
          techs: {
            ...createInitialState().science.techs,
            animal: { unlocked: true, researched: true },
          },
        },
      };
      const next = manager.update(state);
      expect(next.buildings.pasture?.unlocked).toBe(true);
    });

    it("does NOT unlock pasture when animal researched but resources below threshold", () => {
      const state = {
        ...createInitialState(),
        resources: {
          ...createInitialResources(),
          catnip: { value: 5, maxValue: 0 }, // below 30% of 100 = 30
          wood: { value: 1, maxValue: 0 },
        },
        science: {
          ...createInitialState().science,
          techs: {
            ...createInitialState().science.techs,
            animal: { unlocked: true, researched: true },
          },
        },
      };
      const next = manager.update(state);
      expect(next.buildings.pasture?.unlocked).toBeFalsy();
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
          field: { val: 10, on: 10, unlocked: true },
        },
      };
      const reset = manager.resetState(state);
      expect(reset.buildings.field?.val).toBe(0);
      expect(reset.buildings.field?.on).toBe(0);
      expect(reset.buildings.field?.unlocked).toBe(false);
    });
  });
});

// ── Epic 21: Story 21-2 — Building unlock system ─────────────────────────────

describe("Story 21-2: Building unlock system", () => {
  const manager = new BuildingManager();

  it("field starts locked (unlocked=false)", () => {
    const state = createInitialState();
    expect(state.buildings.field?.unlocked).toBe(false);
  });

  it("field unlocks when catnip >= 3 (30% of price 10)", () => {
    const state = {
      ...createInitialState(),
      resources: {
        ...createInitialResources(),
        catnip: { value: 3, maxValue: 0 },
      },
    };
    const next = manager.update(state);
    expect(next.buildings.field?.unlocked).toBe(true);
  });

  it("field stays locked when catnip < 3", () => {
    const state = {
      ...createInitialState(),
      resources: {
        ...createInitialResources(),
        catnip: { value: 2, maxValue: 0 },
      },
    };
    const next = manager.update(state);
    expect(next.buildings.field?.unlocked).toBe(false);
  });

  it("once unlocked, field stays unlocked even if catnip drops below threshold", () => {
    const stateWithCatnip = {
      ...createInitialState(),
      resources: {
        ...createInitialResources(),
        catnip: { value: 3, maxValue: 0 },
      },
    };
    const unlocked = manager.update(stateWithCatnip);
    expect(unlocked.buildings.field?.unlocked).toBe(true);

    const stateNoCatnip = {
      ...unlocked,
      resources: {
        ...createInitialResources(),
        catnip: { value: 0, maxValue: 0 },
      },
    };
    const stillUnlocked = manager.update(stateNoCatnip);
    expect(stillUnlocked.buildings.field?.unlocked).toBe(true);
  });

  it("hut unlocks when wood >= 1.5 (30% of price 5)", () => {
    const state = {
      ...createInitialState(),
      resources: {
        ...createInitialResources(),
        wood: { value: 1.5, maxValue: 0 },
      },
    };
    const next = manager.update(state);
    expect(next.buildings.hut?.unlocked).toBe(true);
  });

  it("field and hut have defaultUnlockable and unlockRatio in BUILDING_DEFS", () => {
    const field = BUILDING_DEFS.find((b) => b.name === "field");
    const hut = BUILDING_DEFS.find((b) => b.name === "hut");
    expect(field?.defaultUnlockable).toBe(true);
    expect(field?.unlockRatio).toBe(0.3);
    expect(hut?.defaultUnlockable).toBe(true);
    expect(hut?.unlockRatio).toBe(0.3);
  });
});

// ── Epic 27: New building definitions ─────────────────────────────────────────

describe("Story 27-02: amphitheatre", () => {
  it("exists in BUILDING_DEFS", () => {
    expect(BUILDING_DEFS.find((b) => b.name === "amphitheatre")).toBeDefined();
  });

  it("has correct prices: 200 wood, 1200 minerals, 3 parchment", () => {
    const def = BUILDING_DEFS.find((b) => b.name === "amphitheatre");
    expect(def?.prices.find((p) => p.name === "wood")?.val).toBe(200);
    expect(def?.prices.find((p) => p.name === "minerals")?.val).toBe(1200);
    expect(def?.prices.find((p) => p.name === "parchment")?.val).toBe(3);
  });

  it("has priceRatio 1.15", () => {
    const def = BUILDING_DEFS.find((b) => b.name === "amphitheatre");
    expect(def?.priceRatio).toBe(1.15);
  });

  it("has culturePerTickBase: 0.005", () => {
    const def = BUILDING_DEFS.find((b) => b.name === "amphitheatre");
    expect(def?.effects.culturePerTickBase).toBe(0.005);
  });

  it("has cultureMax: 50", () => {
    const def = BUILDING_DEFS.find((b) => b.name === "amphitheatre");
    expect(def?.effects.cultureMax).toBe(50);
  });

  it("has unhappinessRatio: -0.048", () => {
    const def = BUILDING_DEFS.find((b) => b.name === "amphitheatre");
    expect(def?.effects.unhappinessRatio).toBe(-0.048);
  });

  it("produces culture > 0 when 1 amphitheatre is built", () => {
    const manager = new BuildingManager();
    const state = {
      ...createInitialState(),
      buildings: {
        ...createInitialBuildings(),
        amphitheatre: { val: 1, on: 1, unlocked: true },
      },
    };
    const effects = manager.updateEffects(state);
    expect(effects.culturePerTickBase).toBeGreaterThan(0);
    expect(effects.cultureMax).toBeGreaterThan(0);
    expect(effects.unhappinessRatio).toBeLessThan(0);
  });
});

describe("Story 27-03: lumberMill", () => {
  it("exists in BUILDING_DEFS", () => {
    expect(BUILDING_DEFS.find((b) => b.name === "lumberMill")).toBeDefined();
  });

  it("has correct prices: 100 wood, 250 minerals, 50 iron", () => {
    const def = BUILDING_DEFS.find((b) => b.name === "lumberMill");
    expect(def?.prices.find((p) => p.name === "wood")?.val).toBe(100);
    expect(def?.prices.find((p) => p.name === "minerals")?.val).toBe(250);
    expect(def?.prices.find((p) => p.name === "iron")?.val).toBe(50);
  });

  it("has woodRatio: 0.1", () => {
    const def = BUILDING_DEFS.find((b) => b.name === "lumberMill");
    expect(def?.effects.woodRatio).toBe(0.1);
  });

  it("1 lumberMill → woodRatio 0.1 in effectCache", () => {
    const manager = new BuildingManager();
    const state = {
      ...createInitialState(),
      buildings: {
        ...createInitialBuildings(),
        lumberMill: { val: 1, on: 1, unlocked: true },
      },
    };
    const effects = manager.updateEffects(state);
    expect(effects.woodRatio).toBeCloseTo(0.1);
  });
});

describe("Story 27-04: smelter", () => {
  it("exists in BUILDING_DEFS", () => {
    expect(BUILDING_DEFS.find((b) => b.name === "smelter")).toBeDefined();
  });

  it("has correct price: 200 minerals", () => {
    const def = BUILDING_DEFS.find((b) => b.name === "smelter");
    expect(def?.prices.find((p) => p.name === "minerals")?.val).toBe(200);
  });

  it("has ironRatio: 0.5", () => {
    const def = BUILDING_DEFS.find((b) => b.name === "smelter");
    expect(def?.effects.ironRatio).toBe(0.5);
  });

  it("1 active smelter → legacy base autoproduction and consumption", () => {
    const manager = new BuildingManager();
    const state = {
      ...createInitialState(),
      buildings: {
        ...createInitialBuildings(),
        smelter: { val: 1, on: 1, unlocked: true },
      },
    };
    const effects = manager.updateEffects(state);
    expect(effects.ironPerTickAutoprod).toBeCloseTo(0.02);
    expect(effects.woodPerTickCon).toBeCloseTo(-0.05);
    expect(effects.mineralsPerTickCon).toBeCloseTo(-0.1);
  });

  it("smelterRatio upgrade scales iron and coal autoproduction", () => {
    const manager = new BuildingManager();
    const state = {
      ...createInitialState(),
      buildings: {
        ...createInitialBuildings(),
        smelter: { val: 1, on: 1, unlocked: true },
      },
      effectCache: { smelterRatio: 0.95 },
      workshop: {
        ...createInitialState().workshop,
        upgrades: {
          ...createInitialState().workshop.upgrades,
          coalFurnace: { unlocked: true, researched: true },
        },
      },
    };
    const effects = manager.updateEffects(state);
    expect(effects.ironPerTickAutoprod).toBeCloseTo(0.039);
    expect(effects.coalPerTickAutoprod).toBeCloseTo(0.00975);
  });

  it("goldOre and nuclearSmelters unlock gold and titanium autoproduction", () => {
    const manager = new BuildingManager();
    const state = {
      ...createInitialState(),
      buildings: {
        ...createInitialBuildings(),
        smelter: { val: 2, on: 2, unlocked: true },
      },
      workshop: {
        ...createInitialState().workshop,
        upgrades: {
          ...createInitialState().workshop.upgrades,
          goldOre: { unlocked: true, researched: true },
          nuclearSmelters: { unlocked: true, researched: true },
        },
      },
    };
    const effects = manager.updateEffects(state);
    expect(effects.goldPerTickAutoprod).toBeCloseTo(0.002);
    expect(effects.titaniumPerTickAutoprod).toBeCloseTo(0.003);
  });
});

describe("Story 27-05: observatory", () => {
  it("exists in BUILDING_DEFS", () => {
    expect(BUILDING_DEFS.find((b) => b.name === "observatory")).toBeDefined();
  });

  it("has scienceRatio: 0.25", () => {
    const def = BUILDING_DEFS.find((b) => b.name === "observatory");
    expect(def?.effects.scienceRatio).toBe(0.25);
  });

  it("1 observatory → scienceRatio 0.25 in effectCache", () => {
    const manager = new BuildingManager();
    const state = {
      ...createInitialState(),
      buildings: {
        ...createInitialBuildings(),
        observatory: { val: 1, on: 1, unlocked: true },
      },
    };
    const effects = manager.updateEffects(state);
    expect(effects.scienceRatio).toBeCloseTo(0.25);
  });
});

describe("Story 27-06: brewery", () => {
  it("exists in BUILDING_DEFS", () => {
    expect(BUILDING_DEFS.find((b) => b.name === "brewery")).toBeDefined();
  });

  it("has happiness: 0.01", () => {
    const def = BUILDING_DEFS.find((b) => b.name === "brewery");
    expect(def?.effects.happiness).toBe(0.01);
  });
});

describe("Story 27-07: mint", () => {
  it("exists in BUILDING_DEFS", () => {
    expect(BUILDING_DEFS.find((b) => b.name === "mint")).toBeDefined();
  });

  it("has goldMax: 100", () => {
    const def = BUILDING_DEFS.find((b) => b.name === "mint");
    expect(def?.effects.goldMax).toBe(100);
  });
});

describe("Story 27-08: temple", () => {
  it("exists in BUILDING_DEFS", () => {
    expect(BUILDING_DEFS.find((b) => b.name === "temple")).toBeDefined();
  });

  it("has culturePerTickBase: 0.1 and faithMax: 100", () => {
    const def = BUILDING_DEFS.find((b) => b.name === "temple");
    expect(def?.effects.culturePerTickBase).toBe(0.1);
    expect(def?.effects.faithMax).toBe(100);
  });
});

describe("Story 27-09: unicornPasture", () => {
  it("exists in BUILDING_DEFS", () => {
    expect(BUILDING_DEFS.find((b) => b.name === "unicornPasture")).toBeDefined();
  });

  it("has correct price: 2 unicorns and priceRatio 1.75", () => {
    const def = BUILDING_DEFS.find((b) => b.name === "unicornPasture");
    expect(def?.prices[0]?.name).toBe("unicorns");
    expect(def?.prices[0]?.val).toBe(2);
    expect(def?.priceRatio).toBe(1.75);
  });

  it("has unicornsPerTickBase: 0.001", () => {
    const def = BUILDING_DEFS.find((b) => b.name === "unicornPasture");
    expect(def?.effects.unicornsPerTickBase).toBe(0.001);
  });

  it("1 unicornPasture → unicorns per tick > 0", () => {
    const manager = new BuildingManager();
    const state = {
      ...createInitialState(),
      buildings: {
        ...createInitialBuildings(),
        unicornPasture: { val: 1, on: 1, unlocked: true },
      },
    };
    const effects = manager.updateEffects(state);
    expect(effects.unicornsPerTickBase).toBeGreaterThan(0);
  });
});

describe("Story 27-10: calciner", () => {
  it("exists in BUILDING_DEFS", () => {
    expect(BUILDING_DEFS.find((b) => b.name === "calciner")).toBeDefined();
  });

  it("has ironPerTickBase and titaniumPerTickBase effects", () => {
    const def = BUILDING_DEFS.find((b) => b.name === "calciner");
    expect(def?.effects.ironPerTickBase).toBeGreaterThan(0);
    expect(def?.effects.titaniumPerTickBase).toBeGreaterThan(0);
  });
});

// ── Story 30-01: temple dynamic happiness ─────────────────────────────────────
describe("Story 30-01: temple dynamic happiness", () => {
  it("1 temple, sunAltar.on=0 → happiness = 0.4", () => {
    const manager = new BuildingManager();
    const state = {
      ...createInitialState(),
      buildings: { ...createInitialBuildings(), temple: { val: 1, on: 1, unlocked: true } },
    };
    const effects = manager.updateEffects(state);
    expect(effects.happiness).toBeCloseTo(0.4);
  });

  it("2 temples, sunAltar.on=7 → happiness = 2 * (0.4 + 0.1*7) = 2.2", () => {
    const manager = new BuildingManager();
    const state = {
      ...createInitialState(),
      buildings: { ...createInitialBuildings(), temple: { val: 2, on: 2, unlocked: true } },
      religion: {
        ...createInitialState().religion,
        religionUpgrades: {
          ...createInitialState().religion.religionUpgrades,
          sunAltar: { val: 7, on: 7 },
        },
      },
    };
    const effects = manager.updateEffects(state);
    expect(effects.happiness).toBeCloseTo(2.2);
  });

  it("0 temples → no temple happiness contribution", () => {
    const manager = new BuildingManager();
    const state = {
      ...createInitialState(),
      buildings: { ...createInitialBuildings(), temple: { val: 0, on: 0, unlocked: false } },
    };
    const effects = manager.updateEffects(state);
    // Only brewery contributes happiness (0 breweries = 0); total should be 0
    expect(effects.happiness ?? 0).toBe(0);
  });

  it("temple on=1 but val=0 → no happiness (off buildings)", () => {
    // on should never exceed val in practice, but defensive test
    const manager = new BuildingManager();
    const state = {
      ...createInitialState(),
      buildings: { ...createInitialBuildings(), temple: { val: 1, on: 0, unlocked: true } },
    };
    const effects = manager.updateEffects(state);
    expect(effects.happiness ?? 0).toBe(0);
  });
});

// ── Story 30-05: brewery consumption ─────────────────────────────────────────
describe("Story 30-05: brewery consumption", () => {
  it("1 brewery, no breweryConsumptionRatio → catnipPerTickCon = -1", () => {
    const manager = new BuildingManager();
    const state = {
      ...createInitialState(),
      buildings: { ...createInitialBuildings(), brewery: { val: 1, on: 1, unlocked: true } },
    };
    const effects = manager.updateEffects(state);
    expect(effects.catnipPerTickCon).toBeCloseTo(-1);
    expect(effects.spicePerTickCon).toBeCloseTo(-0.1);
  });

  it("3 breweries → catnipPerTickCon = -3", () => {
    const manager = new BuildingManager();
    const state = {
      ...createInitialState(),
      buildings: { ...createInitialBuildings(), brewery: { val: 3, on: 3, unlocked: true } },
    };
    const effects = manager.updateEffects(state);
    expect(effects.catnipPerTickCon).toBeCloseTo(-3);
    expect(effects.spicePerTickCon).toBeCloseTo(-0.3);
  });

  it("1 brewery, breweryConsumptionRatio=0.5 → catnipPerTickCon = -1.5", () => {
    const manager = new BuildingManager();
    const state = {
      ...createInitialState(),
      buildings: { ...createInitialBuildings(), brewery: { val: 1, on: 1, unlocked: true } },
      effectCache: { breweryConsumptionRatio: 0.5 },
    };
    const effects = manager.updateEffects(state);
    expect(effects.catnipPerTickCon).toBeCloseTo(-1.5);
    expect(effects.spicePerTickCon).toBeCloseTo(-0.15);
  });

  it("0 breweries on → no consumption", () => {
    const manager = new BuildingManager();
    const state = {
      ...createInitialState(),
      buildings: { ...createInitialBuildings(), brewery: { val: 2, on: 0, unlocked: true } },
    };
    const effects = manager.updateEffects(state);
    expect(effects.catnipPerTickCon ?? 0).toBe(0);
    expect(effects.spicePerTickCon ?? 0).toBe(0);
  });
});

describe("Story 27-02: contains all new buildings", () => {
  it("contains all new buildings in BUILDING_DEFS", () => {
    const names = BUILDING_DEFS.map((b) => b.name);
    for (const name of [
      "amphitheatre",
      "lumberMill",
      "smelter",
      "observatory",
      "brewery",
      "mint",
      "temple",
      "unicornPasture",
      "calciner",
    ]) {
      expect(names).toContain(name);
    }
  });
});

// ── Epic 31: Missing Buildings (Round 2) ─────────────────────────────────────

describe("Story 31-01: chapel", () => {
  it("exists in BUILDING_DEFS", () => {
    expect(BUILDING_DEFS.find((b) => b.name === "chapel")).toBeDefined();
  });

  it("has correct prices: 2000 minerals, 250 culture, 250 parchment", () => {
    const def = BUILDING_DEFS.find((b) => b.name === "chapel");
    expect(def?.prices.find((p) => p.name === "minerals")?.val).toBe(2000);
    expect(def?.prices.find((p) => p.name === "culture")?.val).toBe(250);
    expect(def?.prices.find((p) => p.name === "parchment")?.val).toBe(250);
  });

  it("has priceRatio 1.15", () => {
    const def = BUILDING_DEFS.find((b) => b.name === "chapel");
    expect(def?.priceRatio).toBe(1.15);
  });

  it("has culturePerTickBase:0.05, faithPerTickBase:0.005, cultureMax:200", () => {
    const def = BUILDING_DEFS.find((b) => b.name === "chapel");
    expect(def?.effects.culturePerTickBase).toBe(0.05);
    expect(def?.effects.faithPerTickBase).toBe(0.005);
    expect(def?.effects.cultureMax).toBe(200);
  });

  it("1 chapel → culture and faith production in effectCache", () => {
    const manager = new BuildingManager();
    const state = {
      ...createInitialState(),
      buildings: { ...createInitialBuildings(), chapel: { val: 1, on: 1, unlocked: true } },
    };
    const effects = manager.updateEffects(state);
    expect(effects.culturePerTickBase).toBeCloseTo(0.05);
    expect(effects.faithPerTickBase).toBeCloseTo(0.005);
    expect(effects.cultureMax).toBe(200);
  });
});

describe("Story 31-02: workshop building def", () => {
  it("exists in BUILDING_DEFS", () => {
    expect(BUILDING_DEFS.find((b) => b.name === "workshop")).toBeDefined();
  });

  it("has correct prices: 100 wood, 400 minerals and priceRatio 1.15", () => {
    const def = BUILDING_DEFS.find((b) => b.name === "workshop");
    expect(def?.prices.find((p) => p.name === "wood")?.val).toBe(100);
    expect(def?.prices.find((p) => p.name === "minerals")?.val).toBe(400);
    expect(def?.priceRatio).toBe(1.15);
  });

  it("has defaultUnlockable:true and unlockRatio:0.0025", () => {
    const def = BUILDING_DEFS.find((b) => b.name === "workshop");
    expect(def?.defaultUnlockable).toBe(true);
    expect(def?.unlockRatio).toBe(0.0025);
  });

  it("has craftRatio:0.06", () => {
    const def = BUILDING_DEFS.find((b) => b.name === "workshop");
    expect(def?.effects.craftRatio).toBe(0.06);
  });

  it("1 workshop → craftRatio 0.06 in effectCache", () => {
    const manager = new BuildingManager();
    const state = {
      ...createInitialState(),
      buildings: { ...createInitialBuildings(), workshop: { val: 1, on: 1, unlocked: true } },
    };
    const effects = manager.updateEffects(state);
    expect(effects.craftRatio).toBeCloseTo(0.06);
  });
});

describe("Story 31-03: steamworks", () => {
  it("exists in BUILDING_DEFS", () => {
    expect(BUILDING_DEFS.find((b) => b.name === "steamworks")).toBeDefined();
  });

  it("has correct prices: 65 steel, 20 gear, 1 blueprint", () => {
    const def = BUILDING_DEFS.find((b) => b.name === "steamworks");
    expect(def?.prices.find((p) => p.name === "steel")?.val).toBe(65);
    expect(def?.prices.find((p) => p.name === "gear")?.val).toBe(20);
    expect(def?.prices.find((p) => p.name === "blueprint")?.val).toBe(1);
  });

  it("has priceRatio 1.25", () => {
    const def = BUILDING_DEFS.find((b) => b.name === "steamworks");
    expect(def?.priceRatio).toBe(1.25);
  });

  it("has energyProduction:1, magnetoBoostRatio:0.15, coalRatioGlobal:-0.8", () => {
    const def = BUILDING_DEFS.find((b) => b.name === "steamworks");
    expect(def?.effects.energyProduction).toBe(1);
    expect(def?.effects.magnetoBoostRatio).toBe(0.15);
    expect(def?.effects.coalRatioGlobal).toBe(-0.8);
  });

  it("1 steamworks → energyProduction and coalRatioGlobal in effectCache", () => {
    const manager = new BuildingManager();
    const state = {
      ...createInitialState(),
      buildings: { ...createInitialBuildings(), steamworks: { val: 1, on: 1, unlocked: true } },
    };
    const effects = manager.updateEffects(state);
    expect(effects.energyProduction).toBeCloseTo(1);
    expect(effects.coalRatioGlobal).toBeCloseTo(-0.8);
    expect(effects.magnetoBoostRatio).toBeCloseTo(0.15);
  });

  it("coalRatioGlobalReduction and printing upgrades feed dynamic steamworks effects", () => {
    const manager = new BuildingManager();
    const state = {
      ...createInitialState(),
      buildings: { ...createInitialBuildings(), steamworks: { val: 1, on: 1, unlocked: true } },
      effectCache: {
        coalRatioGlobalReduction: 0.4,
        magnetoBoostBonusPolicy: 0.05,
      },
      workshop: {
        ...createInitialState().workshop,
        upgrades: {
          ...createInitialState().workshop.upgrades,
          printingPress: { unlocked: true, researched: true },
          offsetPress: { unlocked: true, researched: true },
          photolithography: { unlocked: true, researched: true },
        },
      },
    };
    const effects = manager.updateEffects(state);
    expect(effects.coalRatioGlobal).toBeCloseTo(-0.4);
    expect(effects.magnetoBoostRatio).toBeCloseTo(0.2);
    expect(effects.manuscriptPerTickProd).toBeCloseTo(0.008);
  });
});

describe("Story 31-04: magneto", () => {
  it("exists in BUILDING_DEFS", () => {
    expect(BUILDING_DEFS.find((b) => b.name === "magneto")).toBeDefined();
  });

  it("has correct prices: 5 gear, 10 alloy, 1 blueprint and priceRatio 1.25", () => {
    const def = BUILDING_DEFS.find((b) => b.name === "magneto");
    expect(def?.prices.find((p) => p.name === "gear")?.val).toBe(5);
    expect(def?.prices.find((p) => p.name === "alloy")?.val).toBe(10);
    expect(def?.prices.find((p) => p.name === "blueprint")?.val).toBe(1);
    expect(def?.priceRatio).toBe(1.25);
  });

  it("has oilPerTick:-0.05, energyProduction:5, magnetoRatio:0.02", () => {
    const def = BUILDING_DEFS.find((b) => b.name === "magneto");
    expect(def?.effects.oilPerTick).toBe(-0.05);
    expect(def?.effects.energyProduction).toBe(5);
    expect(def?.effects.magnetoRatio).toBe(0.02);
  });

  it("1 magneto → magnetoRatio 0.02 in effectCache", () => {
    const manager = new BuildingManager();
    const state = {
      ...createInitialState(),
      buildings: { ...createInitialBuildings(), magneto: { val: 1, on: 1, unlocked: true } },
    };
    const effects = manager.updateEffects(state);
    expect(effects.magnetoRatio).toBeCloseTo(0.02);
    expect(effects.energyProduction).toBeCloseTo(5);
    expect(effects.oilPerTick).toBeCloseTo(-0.05);
  });
});

describe("Story 31-05: tradepost", () => {
  it("exists in BUILDING_DEFS", () => {
    expect(BUILDING_DEFS.find((b) => b.name === "tradepost")).toBeDefined();
  });

  it("has correct prices: 500 wood, 200 minerals, 10 gold and unlockRatio 0.3", () => {
    const def = BUILDING_DEFS.find((b) => b.name === "tradepost");
    expect(def?.prices.find((p) => p.name === "wood")?.val).toBe(500);
    expect(def?.prices.find((p) => p.name === "minerals")?.val).toBe(200);
    expect(def?.prices.find((p) => p.name === "gold")?.val).toBe(10);
    expect(def?.unlockRatio).toBe(0.3);
  });

  it("has fursDemandRatio:-0.04, ivoryDemandRatio:-0.04, spiceDemandRatio:-0.04, tradeRatio:0.015", () => {
    const def = BUILDING_DEFS.find((b) => b.name === "tradepost");
    expect(def?.effects.fursDemandRatio).toBe(-0.04);
    expect(def?.effects.ivoryDemandRatio).toBe(-0.04);
    expect(def?.effects.spiceDemandRatio).toBe(-0.04);
    expect(def?.effects.tradeRatio).toBe(0.015);
  });

  it("1 tradepost → demand ratios in effectCache", () => {
    const manager = new BuildingManager();
    const state = {
      ...createInitialState(),
      buildings: { ...createInitialBuildings(), tradepost: { val: 1, on: 1, unlocked: true } },
    };
    const effects = manager.updateEffects(state);
    expect(effects.fursDemandRatio).toBeCloseTo(-0.04);
    expect(effects.ivoryDemandRatio).toBeCloseTo(-0.04);
    expect(effects.spiceDemandRatio).toBeCloseTo(-0.04);
    expect(effects.tradeRatio).toBeCloseTo(0.015);
  });
});

describe("Story 31-06: harbor", () => {
  it("exists in BUILDING_DEFS", () => {
    expect(BUILDING_DEFS.find((b) => b.name === "harbor")).toBeDefined();
  });

  it("has correct prices: 50 slab, 75 plate, 5 scaffold and priceRatio 1.15", () => {
    const def = BUILDING_DEFS.find((b) => b.name === "harbor");
    expect(def?.prices.find((p) => p.name === "slab")?.val).toBe(50);
    expect(def?.prices.find((p) => p.name === "plate")?.val).toBe(75);
    expect(def?.prices.find((p) => p.name === "scaffold")?.val).toBe(5);
    expect(def?.priceRatio).toBe(1.15);
  });

  it("has catnipMax:2500, woodMax:700, mineralsMax:950, coalMax:100, ironMax:150, titaniumMax:50, goldMax:25", () => {
    const def = BUILDING_DEFS.find((b) => b.name === "harbor");
    expect(def?.effects.catnipMax).toBe(2500);
    expect(def?.effects.woodMax).toBe(700);
    expect(def?.effects.mineralsMax).toBe(950);
    expect(def?.effects.coalMax).toBe(100);
    expect(def?.effects.ironMax).toBe(150);
    expect(def?.effects.titaniumMax).toBe(50);
    expect(def?.effects.goldMax).toBe(25);
  });

  it("1 harbor → storage boosts in effectCache (val-based)", () => {
    const manager = new BuildingManager();
    const state = {
      ...createInitialState(),
      buildings: { ...createInitialBuildings(), harbor: { val: 1, on: 1, unlocked: true } },
    };
    const effects = manager.updateEffects(state);
    expect(effects.catnipMax).toBe(2500);
    expect(effects.woodMax).toBe(700);
    expect(effects.goldMax).toBe(25);
  });
});

describe("Story 31-07: calciner consumption side", () => {
  it("calciner has mineralsPerTickCon and oilPerTickCon effects", () => {
    const def = BUILDING_DEFS.find((b) => b.name === "calciner");
    expect(def?.effects.mineralsPerTickCon).toBeLessThan(0);
    expect(def?.effects.oilPerTickCon).toBeLessThan(0);
  });

  it("1 calciner on → minerals and oil consumption in effectCache", () => {
    const manager = new BuildingManager();
    const state = {
      ...createInitialState(),
      buildings: { ...createInitialBuildings(), calciner: { val: 1, on: 1, unlocked: true } },
    };
    const effects = manager.updateEffects(state);
    expect(effects.mineralsPerTickCon).toBeCloseTo(-1.5);
    expect(effects.oilPerTickCon).toBeCloseTo(-0.024);
  });

  it("calciner off → no consumption", () => {
    const manager = new BuildingManager();
    const state = {
      ...createInitialState(),
      buildings: { ...createInitialBuildings(), calciner: { val: 1, on: 0, unlocked: true } },
    };
    const effects = manager.updateEffects(state);
    expect(effects.mineralsPerTickCon ?? 0).toBe(0);
    expect(effects.oilPerTickCon ?? 0).toBe(0);
  });
});

describe("Story 31-08: quarry", () => {
  it("exists in BUILDING_DEFS", () => {
    expect(BUILDING_DEFS.find((b) => b.name === "quarry")).toBeDefined();
  });

  it("has correct prices: 1000 slab, 125 steel, 50 scaffold and unlockRatio 0.3", () => {
    const def = BUILDING_DEFS.find((b) => b.name === "quarry");
    expect(def?.prices.find((p) => p.name === "slab")?.val).toBe(1000);
    expect(def?.prices.find((p) => p.name === "steel")?.val).toBe(125);
    expect(def?.prices.find((p) => p.name === "scaffold")?.val).toBe(50);
    expect(def?.unlockRatio).toBe(0.3);
  });

  it("has mineralsRatio:0.35 and coalPerTickBase:0.015", () => {
    const def = BUILDING_DEFS.find((b) => b.name === "quarry");
    expect(def?.effects.mineralsRatio).toBe(0.35);
    expect(def?.effects.coalPerTickBase).toBe(0.015);
  });

  it("1 quarry → mineralsRatio and coalPerTickBase in effectCache", () => {
    const manager = new BuildingManager();
    const state = {
      ...createInitialState(),
      buildings: { ...createInitialBuildings(), quarry: { val: 1, on: 1, unlocked: true } },
    };
    const effects = manager.updateEffects(state);
    expect(effects.mineralsRatio).toBeCloseTo(0.35);
    expect(effects.coalPerTickBase).toBeCloseTo(0.015);
  });
});

describe("Story 31-09: oilWell", () => {
  it("exists in BUILDING_DEFS", () => {
    expect(BUILDING_DEFS.find((b) => b.name === "oilWell")).toBeDefined();
  });

  it("has correct prices: 50 steel, 25 gear, 25 scaffold and priceRatio 1.15", () => {
    const def = BUILDING_DEFS.find((b) => b.name === "oilWell");
    expect(def?.prices.find((p) => p.name === "steel")?.val).toBe(50);
    expect(def?.prices.find((p) => p.name === "gear")?.val).toBe(25);
    expect(def?.prices.find((p) => p.name === "scaffold")?.val).toBe(25);
    expect(def?.priceRatio).toBe(1.15);
  });

  it("has oilPerTickBase:0.02 and oilMax:1500", () => {
    const def = BUILDING_DEFS.find((b) => b.name === "oilWell");
    expect(def?.effects.oilPerTickBase).toBe(0.02);
    expect(def?.effects.oilMax).toBe(1500);
  });

  it("1 oilWell → oilPerTickBase in effectCache", () => {
    const manager = new BuildingManager();
    const state = {
      ...createInitialState(),
      buildings: { ...createInitialBuildings(), oilWell: { val: 1, on: 1, unlocked: true } },
    };
    const effects = manager.updateEffects(state);
    expect(effects.oilPerTickBase).toBeCloseTo(0.02);
    expect(effects.oilMax).toBe(1500);
  });
});

describe("Story 31-10: factory", () => {
  it("exists in BUILDING_DEFS", () => {
    expect(BUILDING_DEFS.find((b) => b.name === "factory")).toBeDefined();
  });

  it("has correct prices: 2000 titanium, 2500 plate, 15 concrate and priceRatio 1.15", () => {
    const def = BUILDING_DEFS.find((b) => b.name === "factory");
    expect(def?.prices.find((p) => p.name === "titanium")?.val).toBe(2000);
    expect(def?.prices.find((p) => p.name === "plate")?.val).toBe(2500);
    expect(def?.prices.find((p) => p.name === "concrate")?.val).toBe(15);
    expect(def?.priceRatio).toBe(1.15);
  });

  it("has craftRatio:0.05 and energyConsumption:2", () => {
    const def = BUILDING_DEFS.find((b) => b.name === "factory");
    expect(def?.effects.craftRatio).toBe(0.05);
    expect(def?.effects.energyConsumption).toBe(2);
  });

  it("1 factory → craftRatio 0.05 in effectCache", () => {
    const manager = new BuildingManager();
    const state = {
      ...createInitialState(),
      buildings: { ...createInitialBuildings(), factory: { val: 1, on: 1, unlocked: true } },
    };
    const effects = manager.updateEffects(state);
    expect(effects.craftRatio).toBeCloseTo(0.05);
    expect(effects.energyConsumption).toBeCloseTo(2);
  });
});

describe("Story 31-11: ziggurat building", () => {
  it("exists in BUILDING_DEFS", () => {
    expect(BUILDING_DEFS.find((b) => b.name === "ziggurat")).toBeDefined();
  });

  it("has correct prices: 50 scaffold, 1 blueprint, 50 megalith and unlockRatio 0.01", () => {
    const def = BUILDING_DEFS.find((b) => b.name === "ziggurat");
    expect(def?.prices.find((p) => p.name === "scaffold")?.val).toBe(50);
    expect(def?.prices.find((p) => p.name === "blueprint")?.val).toBe(1);
    expect(def?.prices.find((p) => p.name === "megalith")?.val).toBe(50);
    expect(def?.unlockRatio).toBe(0.01);
    expect(def?.priceRatio).toBe(1.25);
  });

  it("has cultureMaxRatio:0.08", () => {
    const def = BUILDING_DEFS.find((b) => b.name === "ziggurat");
    expect(def?.effects.cultureMaxRatio).toBe(0.08);
  });

  it("1 ziggurat → cultureMaxRatio 0.08 in effectCache", () => {
    const manager = new BuildingManager();
    const state = {
      ...createInitialState(),
      buildings: { ...createInitialBuildings(), ziggurat: { val: 1, on: 1, unlocked: true } },
    };
    const effects = manager.updateEffects(state);
    expect(effects.cultureMaxRatio).toBeCloseTo(0.08);
  });
});

describe("Story 31-13: chronosphere", () => {
  it("exists in BUILDING_DEFS", () => {
    expect(BUILDING_DEFS.find((b) => b.name === "chronosphere")).toBeDefined();
  });

  it("has correct prices: 2500 unobtainium, 250000 science, 1 timeCrystal, 100 blueprint", () => {
    const def = BUILDING_DEFS.find((b) => b.name === "chronosphere");
    expect(def?.prices.find((p) => p.name === "unobtainium")?.val).toBe(2500);
    expect(def?.prices.find((p) => p.name === "science")?.val).toBe(250000);
    expect(def?.prices.find((p) => p.name === "timeCrystal")?.val).toBe(1);
    expect(def?.prices.find((p) => p.name === "blueprint")?.val).toBe(100);
    expect(def?.priceRatio).toBe(1.25);
  });

  it("has temporalParadoxChance:0.01, resStasisRatio:0.015, energyConsumption:20", () => {
    const def = BUILDING_DEFS.find((b) => b.name === "chronosphere");
    expect(def?.effects.temporalParadoxChance).toBe(0.01);
    expect(def?.effects.resStasisRatio).toBe(0.015);
    expect(def?.effects.energyConsumption).toBe(20);
  });

  it("1 chronosphere → effects in effectCache", () => {
    const manager = new BuildingManager();
    const state = {
      ...createInitialState(),
      buildings: { ...createInitialBuildings(), chronosphere: { val: 1, on: 1, unlocked: true } },
    };
    const effects = manager.updateEffects(state);
    expect(effects.temporalParadoxChance).toBeCloseTo(0.01);
    expect(effects.resStasisRatio).toBeCloseTo(0.015);
    expect(effects.energyConsumption).toBeCloseTo(20);
  });
});

describe("Story 31-14: reactor", () => {
  it("exists in BUILDING_DEFS", () => {
    expect(BUILDING_DEFS.find((b) => b.name === "reactor")).toBeDefined();
  });

  it("has correct prices: 3500 titanium, 5000 plate, 50 concrate, 25 blueprint", () => {
    const def = BUILDING_DEFS.find((b) => b.name === "reactor");
    expect(def?.prices.find((p) => p.name === "titanium")?.val).toBe(3500);
    expect(def?.prices.find((p) => p.name === "plate")?.val).toBe(5000);
    expect(def?.prices.find((p) => p.name === "concrate")?.val).toBe(50);
    expect(def?.prices.find((p) => p.name === "blueprint")?.val).toBe(25);
    expect(def?.priceRatio).toBe(1.15);
  });

  it("has uraniumPerTick:-0.001, productionRatio:0.05, uraniumMax:250, energyProduction:10", () => {
    const def = BUILDING_DEFS.find((b) => b.name === "reactor");
    expect(def?.effects.uraniumPerTick).toBe(-0.001);
    expect(def?.effects.productionRatio).toBe(0.05);
    expect(def?.effects.uraniumMax).toBe(250);
    expect(def?.effects.energyProduction).toBe(10);
  });

  it("1 reactor → productionRatio and energyProduction in effectCache", () => {
    const manager = new BuildingManager();
    const state = {
      ...createInitialState(),
      buildings: { ...createInitialBuildings(), reactor: { val: 1, on: 1, unlocked: true } },
    };
    const effects = manager.updateEffects(state);
    expect(effects.productionRatio).toBeCloseTo(0.05);
    expect(effects.energyProduction).toBeCloseTo(10);
    expect(effects.uraniumPerTick).toBeCloseTo(-0.001);
    expect(effects.uraniumMax).toBe(250);
  });
});

describe("Story 31-15: biolab", () => {
  it("exists in BUILDING_DEFS", () => {
    expect(BUILDING_DEFS.find((b) => b.name === "biolab")).toBeDefined();
  });

  it("has correct prices: 1500 science, 100 slab, 25 alloy and priceRatio 1.10", () => {
    const def = BUILDING_DEFS.find((b) => b.name === "biolab");
    expect(def?.prices.find((p) => p.name === "science")?.val).toBe(1500);
    expect(def?.prices.find((p) => p.name === "slab")?.val).toBe(100);
    expect(def?.prices.find((p) => p.name === "alloy")?.val).toBe(25);
    expect(def?.priceRatio).toBe(1.10);
  });

  it("has scienceRatio:0.35, refineRatio:0.1, scienceMax:1500", () => {
    const def = BUILDING_DEFS.find((b) => b.name === "biolab");
    expect(def?.effects.scienceRatio).toBe(0.35);
    expect(def?.effects.refineRatio).toBe(0.1);
    expect(def?.effects.scienceMax).toBe(1500);
  });

  it("1 biolab → scienceRatio and scienceMax in effectCache", () => {
    const manager = new BuildingManager();
    const state = {
      ...createInitialState(),
      buildings: { ...createInitialBuildings(), biolab: { val: 1, on: 1, unlocked: true } },
    };
    const effects = manager.updateEffects(state);
    expect(effects.scienceRatio).toBeCloseTo(0.35);
    expect(effects.scienceMax).toBe(1500);
    expect(effects.refineRatio).toBeCloseTo(0.1);
  });
});

describe("Story 31-16: aiCore", () => {
  it("exists in BUILDING_DEFS", () => {
    expect(BUILDING_DEFS.find((b) => b.name === "aiCore")).toBeDefined();
  });

  it("has correct prices: 125 antimatter, 500000 science and unlockRatio 0.01", () => {
    const def = BUILDING_DEFS.find((b) => b.name === "aiCore");
    expect(def?.prices.find((p) => p.name === "antimatter")?.val).toBe(125);
    expect(def?.prices.find((p) => p.name === "science")?.val).toBe(500000);
    expect(def?.unlockRatio).toBe(0.01);
    expect(def?.priceRatio).toBe(1.15);
  });

  it("has gflopsPerTickBase:0.02 and energyConsumption:2", () => {
    const def = BUILDING_DEFS.find((b) => b.name === "aiCore");
    expect(def?.effects.gflopsPerTickBase).toBe(0.02);
    expect(def?.effects.energyConsumption).toBe(2);
  });

  it("1 aiCore → gflopsPerTickBase and energyConsumption in effectCache", () => {
    const manager = new BuildingManager();
    const state = {
      ...createInitialState(),
      buildings: { ...createInitialBuildings(), aiCore: { val: 1, on: 1, unlocked: true } },
    };
    const effects = manager.updateEffects(state);
    expect(effects.gflopsPerTickBase).toBeCloseTo(0.02);
    expect(effects.energyConsumption).toBeCloseTo(2);
  });
});

describe("Story 31-17: accelerator and zebra buildings", () => {
  it("accelerator exists in BUILDING_DEFS", () => {
    expect(BUILDING_DEFS.find((b) => b.name === "accelerator")).toBeDefined();
  });

  it("accelerator has correct prices: 7500 titanium, 25 uranium, 125 concrate", () => {
    const def = BUILDING_DEFS.find((b) => b.name === "accelerator");
    expect(def?.prices.find((p) => p.name === "titanium")?.val).toBe(7500);
    expect(def?.prices.find((p) => p.name === "uranium")?.val).toBe(25);
    expect(def?.prices.find((p) => p.name === "concrate")?.val).toBe(125);
    expect(def?.priceRatio).toBe(1.15);
  });

  it("accelerator has titaniumPerTickCon:-0.015, uraniumPerTickAutoprod:0.0025, energyConsumption:2", () => {
    const def = BUILDING_DEFS.find((b) => b.name === "accelerator");
    expect(def?.effects.titaniumPerTickCon).toBe(-0.015);
    expect(def?.effects.uraniumPerTickAutoprod).toBe(0.0025);
    expect(def?.effects.energyConsumption).toBe(2);
  });

  it("zebraOutpost exists in BUILDING_DEFS with hunterRatio:0.05 and catpowerMax:5", () => {
    const def = BUILDING_DEFS.find((b) => b.name === "zebraOutpost");
    expect(def).toBeDefined();
    expect(def?.effects.hunterRatio).toBe(0.05);
    expect(def?.effects.catpowerMax).toBe(5);
    expect(def?.prices.find((p) => p.name === "bloodstone")?.val).toBe(1);
    expect(def?.priceRatio).toBe(1.35);
  });

  it("zebraWorkshop exists in BUILDING_DEFS with catpowerMax:25", () => {
    const def = BUILDING_DEFS.find((b) => b.name === "zebraWorkshop");
    expect(def).toBeDefined();
    expect(def?.effects.catpowerMax).toBe(25);
    expect(def?.prices.find((p) => p.name === "bloodstone")?.val).toBe(5);
  });

  it("zebraForge exists in BUILDING_DEFS with catpowerMax:50 and tMythrilCraftRatio:0.01", () => {
    const def = BUILDING_DEFS.find((b) => b.name === "zebraForge");
    expect(def).toBeDefined();
    expect(def?.effects.catpowerMax).toBe(50);
    expect(def?.effects.tMythrilCraftRatio).toBe(0.01);
    expect(def?.prices.find((p) => p.name === "bloodstone")?.val).toBe(50);
  });

  it("1 accelerator on → titaniumPerTickCon and uraniumPerTickAutoprod in effectCache", () => {
    const manager = new BuildingManager();
    const state = {
      ...createInitialState(),
      buildings: { ...createInitialBuildings(), accelerator: { val: 1, on: 1, unlocked: true } },
    };
    const effects = manager.updateEffects(state);
    expect(effects.titaniumPerTickCon).toBeCloseTo(-0.015);
    expect(effects.uraniumPerTickAutoprod).toBeCloseTo(0.0025);
    expect(effects.energyConsumption).toBeCloseTo(2);
  });

  it("zebraOutpost catpowerMax scales by val not on", () => {
    const manager = new BuildingManager();
    const state = {
      ...createInitialState(),
      buildings: { ...createInitialBuildings(), zebraOutpost: { val: 3, on: 0, unlocked: true } },
    };
    const effects = manager.updateEffects(state);
    expect(effects.catpowerMax).toBe(5 * 3);
  });
});

describe("Story 31: all new buildings in BUILDING_DEFS and createInitialBuildings", () => {
  it("contains all 17 new buildings in BUILDING_DEFS", () => {
    const names = BUILDING_DEFS.map((b) => b.name);
    for (const name of [
      "chapel",
      "workshop",
      "steamworks",
      "magneto",
      "tradepost",
      "harbor",
      "quarry",
      "oilWell",
      "factory",
      "ziggurat",
      "chronosphere",
      "reactor",
      "biolab",
      "aiCore",
      "accelerator",
      "zebraOutpost",
      "zebraWorkshop",
      "zebraForge",
    ]) {
      expect(names, `missing: ${name}`).toContain(name);
    }
  });

  it("createInitialBuildings includes all new buildings", () => {
    const buildings = createInitialBuildings();
    for (const name of [
      "chapel", "workshop", "steamworks", "magneto", "tradepost", "harbor",
      "quarry", "oilWell", "factory", "ziggurat", "chronosphere", "reactor",
      "biolab", "aiCore", "accelerator", "zebraOutpost", "zebraWorkshop", "zebraForge",
    ]) {
      expect(buildings[name], `missing in initial state: ${name}`).toBeDefined();
    }
  });
});
