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
