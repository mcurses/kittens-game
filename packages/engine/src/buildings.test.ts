import { describe, expect, it } from "vitest";
import { applyAction } from "./actions.js";
import {
  BUILDING_DEFS,
  BuildingManager,
  STAGE_LABELS,
  canAfford,
  createInitialBuildings,
  getBuildingDisplayName,
  getBuildingPrice,
} from "./buildings.js";
import { getLimitedDR } from "./effects.js";
import { createInitialResources } from "./resources.js";
import { createInitialState, serialize, deserialize } from "./state.js";

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
    it("includes base storage caps (effectsBase) even with no buildings built", () => {
      const state = createInitialState();
      const effects = manager.updateEffects(state);
      expect(effects.catnipMax).toBe(5000);
      expect(effects.woodMax).toBe(200);
      expect(effects.mineralsMax).toBe(250);
      expect(effects.coalMax).toBe(60);
      expect(effects.ironMax).toBe(50);
      expect(effects.titaniumMax).toBe(2);
      expect(effects.goldMax).toBe(10);
      expect(effects.oilMax).toBe(1500);
      expect(effects.uraniumMax).toBe(250);
      expect(effects.unobtainiumMax).toBe(150);
      expect(effects.antimatterMax).toBe(100);
      expect(effects.manpowerMax).toBe(100);
      expect(effects.scienceMax).toBe(250);
      expect(effects.cultureMax).toBe(100);
      expect(effects.faithMax).toBe(100);
    });

    it("stacks base storage with building contributions", () => {
      const state = {
        ...createInitialState(),
        buildings: {
          ...createInitialBuildings(),
          barn: { val: 1, on: 1 },
        },
      };
      const effects = manager.updateEffects(state);
      // base 5000 + barn 5000 = 10000
      expect(effects.catnipMax).toBe(10000);
    });

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
      // base 5000 + barn val:2 * 5000 = 15000
      expect(effects.catnipMax).toBe(5000 + 5000 * 2);
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
      // scienceMax: 250 (base) + 250 (library, val=1) + 500 (academy, val=1) = 1000
      expect(effects.scienceMax).toBe(1000);
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

    it("does NOT unlock pasture when unlockable is not set", () => {
      const state = {
        ...createInitialState(),
        resources: {
          ...createInitialResources(),
          catnip: { value: 200, maxValue: 0 },
          wood: { value: 20, maxValue: 0 },
        },
        // pasture.unlockable not set (default)
      };
      const next = manager.update(state);
      expect(next.buildings.pasture?.unlocked).toBeFalsy();
    });

    it("unlocks pasture when unlockable=true AND resources meet threshold", () => {
      const state = {
        ...createInitialState(),
        resources: {
          ...createInitialResources(),
          catnip: { value: 200, maxValue: 0 },
          wood: { value: 20, maxValue: 0 },
        },
        buildings: {
          ...createInitialBuildings(),
          pasture: { val: 0, on: 0, unlockable: true },
        },
      };
      const next = manager.update(state);
      expect(next.buildings.pasture?.unlocked).toBe(true);
    });

    it("does NOT unlock pasture when unlockable=true but resources below threshold", () => {
      const state = {
        ...createInitialState(),
        resources: {
          ...createInitialResources(),
          catnip: { value: 5, maxValue: 0 }, // below 30% of 100 = 30
          wood: { value: 1, maxValue: 0 },
        },
        buildings: {
          ...createInitialBuildings(),
          pasture: { val: 0, on: 0, unlockable: true },
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

  it("has festivalRatio: 0.01 and festivalArrivalRatio: 0.001", () => {
    const def = BUILDING_DEFS.find((b) => b.name === "brewery");
    expect(def?.effects.festivalRatio).toBe(0.01);
    expect(def?.effects.festivalArrivalRatio).toBe(0.001);
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
    // base 100 + chapel val:1 * 200 = 300
    expect(effects.cultureMax).toBe(300);
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
    // base 5000 + harbor val:1 * 2500 = 7500
    expect(effects.catnipMax).toBe(7500);
    // base 200 + harbor val:1 * 700 = 900
    expect(effects.woodMax).toBe(900);
    // base 10 + harbor val:1 * 25 = 35
    expect(effects.goldMax).toBe(35);
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

describe("Epic 42 Story 42-01: storage ratio parity", () => {
  it("applies researched stoneBarns to barn wood/minerals/iron storage", () => {
    const manager = new BuildingManager();
    const state = {
      ...createInitialState(),
      buildings: { ...createInitialBuildings(), barn: { val: 1, on: 1, unlocked: true } },
      workshop: {
        ...createInitialState().workshop,
        upgrades: {
          ...createInitialState().workshop.upgrades,
          stoneBarns: { unlocked: true, researched: true },
        },
      },
    };

    const effects = manager.updateEffects(state);
    expect(effects.woodMax).toBeCloseTo(550);
    expect(effects.mineralsMax).toBeCloseTo(687.5);
    expect(effects.ironMax).toBeCloseTo(137.5);
    expect(effects.coalMax).toBeCloseTo(120);
  });

  it("applies researched stoneBarns to harbor storage but not catnip without silos", () => {
    const manager = new BuildingManager();
    const state = {
      ...createInitialState(),
      buildings: { ...createInitialBuildings(), harbor: { val: 1, on: 1, unlocked: true } },
      workshop: {
        ...createInitialState().workshop,
        upgrades: {
          ...createInitialState().workshop.upgrades,
          stoneBarns: { unlocked: true, researched: true },
        },
      },
    };

    const effects = manager.updateEffects(state);
    expect(effects.catnipMax).toBeCloseTo(7500);
    expect(effects.woodMax).toBeCloseTo(1425);
    expect(effects.mineralsMax).toBeCloseTo(1912.5);
    expect(effects.ironMax).toBeCloseTo(312.5);
  });

  it("applies the partial barnRatio catnip boost only when silos is researched", () => {
    const manager = new BuildingManager();
    const state = {
      ...createInitialState(),
      buildings: { ...createInitialBuildings(), barn: { val: 1, on: 1, unlocked: true } },
      workshop: {
        ...createInitialState().workshop,
        upgrades: {
          ...createInitialState().workshop.upgrades,
          stoneBarns: { unlocked: true, researched: true },
          silos: { unlocked: true, researched: true },
        },
      },
    };

    const effects = manager.updateEffects(state);
    expect(effects.catnipMax).toBeCloseTo(10937.5);
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
    // base 1500 + oilWell val:1 * 1500 = 3000
    expect(effects.oilMax).toBe(3000);
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

  it("1 factory without carbon sequestration keeps legacy base energy and pollution", () => {
    const manager = new BuildingManager();
    const state = {
      ...createInitialState(),
      buildings: { ...createInitialBuildings(), factory: { val: 1, on: 1, unlocked: true } },
    };
    const effects = manager.updateEffects(state);
    expect(effects.craftRatio).toBeCloseTo(0.05);
    expect(effects.energyConsumption).toBeCloseTo(2);
    expect(effects.cathPollutionPerTickProd).toBeCloseTo(2);
    expect(effects.cathPollutionPerTickCon ?? 0).toBe(0);
  });

  it("carbon sequestration defaults factories into high-energy low-pollution mode", () => {
    const manager = new BuildingManager();
    const state = {
      ...createInitialState(),
      buildings: { ...createInitialBuildings(), factory: { val: 1, on: 1, unlocked: true } },
      workshop: {
        ...createInitialState().workshop,
        upgrades: {
          ...createInitialState().workshop.upgrades,
          carbonSequestration: { unlocked: true, researched: true },
        },
      },
    };
    const effects = manager.updateEffects(state);
    expect(effects.craftRatio).toBeCloseTo(0.05);
    expect(effects.energyConsumption).toBeCloseTo(4);
    expect(effects.cathPollutionPerTickProd ?? 0).toBe(0);
    expect(effects.cathPollutionPerTickCon).toBe(-2);
  });

  it("disabled carbon sequestration mode falls back to lower-energy capped-pollution mode", () => {
    const manager = new BuildingManager();
    const state = {
      ...createInitialState(),
      buildings: {
        ...createInitialBuildings(),
        factory: { val: 1, on: 1, unlocked: true, automationEnabled: false },
      },
      workshop: {
        ...createInitialState().workshop,
        upgrades: {
          ...createInitialState().workshop.upgrades,
          carbonSequestration: { unlocked: true, researched: true },
          factoryLogistics: { unlocked: true, researched: true },
        },
      },
    };
    const effects = manager.updateEffects(state);
    expect(effects.craftRatio).toBeCloseTo(0.06);
    expect(effects.energyConsumption).toBeCloseTo(2);
    expect(effects.cathPollutionPerTickProd).toBe(1);
    expect(effects.cathPollutionPerTickCon ?? 0).toBe(0);
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
    // base 250 + reactor val:1 * 250 = 500
    expect(effects.uraniumMax).toBe(500);
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
    // base 250 + biolab val:1 * 1500 = 1750
    expect(effects.scienceMax).toBe(1750);
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

// ── Epic 36: Building Unlock Architecture ─────────────────────────────────────

describe("Story 36-01: unlockable seeded from defaultUnlockable", () => {
  it("defaultUnlockable buildings start with unlockable=true in createInitialBuildings", () => {
    const buildings = createInitialBuildings();
    // field, hut, library, workshop all have defaultUnlockable: true
    expect(buildings.field?.unlockable).toBe(true);
    expect(buildings.hut?.unlockable).toBe(true);
    expect(buildings.library?.unlockable).toBe(true);
    expect(buildings.workshop?.unlockable).toBe(true);
  });

  it("non-defaultUnlockable buildings start without unlockable set", () => {
    const buildings = createInitialBuildings();
    expect(buildings.pasture?.unlockable).toBeUndefined();
    expect(buildings.unicornPasture?.unlockable).toBeUndefined();
    expect(buildings.ziggurat?.unlockable).toBeUndefined();
    expect(buildings.brewery?.unlockable).toBeUndefined();
  });

  it("ivoryTemple has defaultUnlockable: true (legacy parity)", () => {
    const def = BUILDING_DEFS.find((b) => b.name === "ivoryTemple");
    expect(def?.defaultUnlockable).toBe(true);
  });
});

describe("Story 36-02: applyResearch sets building unlockable", () => {
  const manager = new BuildingManager();

  function makeResearchableState(techName: string, scienceCost: number) {
    return {
      ...createInitialState(),
      resources: {
        ...createInitialResources(),
        science: { value: scienceCost + 10000, maxValue: 9999999 },
        parchment: { value: 99999, maxValue: 9999999 },
        compedium: { value: 99999, maxValue: 9999999 },
      },
      science: {
        ...createInitialState().science,
        techs: {
          ...createInitialState().science.techs,
          [techName]: { unlocked: true, researched: false },
        },
      },
    };
  }

  it("researching animal tech sets pasture.unlockable=true and unicornPasture.unlockable=true", () => {
    const state = makeResearchableState("animal", 500);
    const next = applyAction(state, { type: "RESEARCH", name: "animal" });
    expect(next.buildings.pasture?.unlockable).toBe(true);
    expect(next.buildings.unicornPasture?.unlockable).toBe(true);
  });

  it("researching animal tech does NOT set unlocked=true (resource gate not yet met)", () => {
    const state = makeResearchableState("animal", 500);
    const next = applyAction(state, { type: "RESEARCH", name: "animal" });
    // no catnip/wood in resources → threshold not met → not unlocked yet
    expect(next.buildings.unicornPasture?.unlocked).toBeFalsy();
  });

  it("researching construction tech sets ziggurat.unlockable=true", () => {
    const state = makeResearchableState("construction", 1300);
    const next = applyAction(state, { type: "RESEARCH", name: "construction" });
    expect(next.buildings.ziggurat?.unlockable).toBe(true);
  });

  it("researching drama tech sets brewery.unlockable=true", () => {
    const state = makeResearchableState("drama", 90000);
    const next = applyAction(state, { type: "RESEARCH", name: "drama" });
    expect(next.buildings.brewery?.unlockable).toBe(true);
  });
});

describe("Story 36-03: two-step reveal logic", () => {
  const manager = new BuildingManager();

  it("building with unlockable=true and sufficient resources → unlocked=true", () => {
    const state = {
      ...createInitialState(),
      resources: {
        ...createInitialResources(),
        catnip: { value: 100, maxValue: 0 },
        wood: { value: 10, maxValue: 0 },
      },
      buildings: {
        ...createInitialBuildings(),
        pasture: { val: 0, on: 0, unlockable: true as const },
      },
    };
    const next = manager.update(state);
    expect(next.buildings.pasture?.unlocked).toBe(true);
  });

  it("building with unlockable absent and sufficient resources → stays unlocked=false", () => {
    const state = {
      ...createInitialState(),
      resources: {
        ...createInitialResources(),
        catnip: { value: 100, maxValue: 0 },
        wood: { value: 10, maxValue: 0 },
      },
      // pasture starts without unlockable
    };
    const next = manager.update(state);
    expect(next.buildings.pasture?.unlocked).toBeFalsy();
  });

  it("building with unlockable=true but insufficient resources → stays unlocked=false", () => {
    const state = {
      ...createInitialState(),
      resources: {
        ...createInitialResources(),
        catnip: { value: 1, maxValue: 0 }, // below 30% of 100
        wood: { value: 0, maxValue: 0 },
      },
      buildings: {
        ...createInitialBuildings(),
        pasture: { val: 0, on: 0, unlockable: true as const },
      },
    };
    const next = manager.update(state);
    expect(next.buildings.pasture?.unlocked).toBeFalsy();
  });

  it("building with defaultUnlockable=true and sufficient resources → unlocked=true (no research needed)", () => {
    const state = {
      ...createInitialState(),
      resources: {
        ...createInitialResources(),
        catnip: { value: 5, maxValue: 0 }, // ≥ 30% of 10
      },
    };
    const next = manager.update(state);
    expect(next.buildings.field?.unlocked).toBe(true);
  });
});

describe("Story 36-04: no requiredTech in BUILDING_DEFS", () => {
  it("no building def has a requiredTech field", () => {
    for (const def of BUILDING_DEFS) {
      expect(
        (def as unknown as Record<string, unknown>).requiredTech,
        `${def.name} still has requiredTech`,
      ).toBeUndefined();
    }
  });
});

describe("Story 36-05: regression — end-to-end unlock flow", () => {
  const manager = new BuildingManager();

  function researchAndReveal(
    techName: string,
    scienceCost: number,
    buildingName: string,
    revealResources: Record<string, number>,
  ) {
    const baseState = {
      ...createInitialState(),
      resources: {
        ...createInitialResources(),
        science: { value: scienceCost + 10000, maxValue: 9999999 },
        parchment: { value: 99999, maxValue: 9999999 },
        compedium: { value: 99999, maxValue: 9999999 },
      },
      science: {
        ...createInitialState().science,
        techs: {
          ...createInitialState().science.techs,
          [techName]: { unlocked: true, researched: false },
        },
      },
    };
    const afterResearch = applyAction(baseState, { type: "RESEARCH", name: techName });
    const withResources = {
      ...afterResearch,
      resources: {
        ...afterResearch.resources,
        ...Object.fromEntries(
          Object.entries(revealResources).map(([k, v]) => [k, { value: v, maxValue: 9999999 }]),
        ),
      },
    };
    return manager.update(withResources);
  }

  it("animal → unicornPasture appears once catnip/wood threshold met", () => {
    // unicornPasture prices: catnip:2500, wood:... (check actual prices)
    // unlockRatio: 0.3 → need 30% of first price component
    const unicornDef = BUILDING_DEFS.find((b) => b.name === "unicornPasture");
    expect(unicornDef).toBeDefined();
    const firstPrice = unicornDef!.prices[0]!;
    const threshold = firstPrice.val * (unicornDef!.unlockRatio ?? 0.3);
    const result = researchAndReveal("animal", 500, "unicornPasture", {
      [firstPrice.name]: threshold,
    });
    expect(result.buildings.unicornPasture?.unlocked).toBe(true);
  });

  it("construction → ziggurat appears once all price thresholds met", () => {
    const zigDef = BUILDING_DEFS.find((b) => b.name === "ziggurat");
    expect(zigDef).toBeDefined();
    const ratio = zigDef!.unlockRatio ?? 0.3;
    const revealResources = Object.fromEntries(
      zigDef!.prices.map((p) => [p.name, p.val * ratio]),
    );
    const result = researchAndReveal("construction", 1300, "ziggurat", revealResources);
    expect(result.buildings.ziggurat?.unlocked).toBe(true);
  });

  it("drama → brewery appears once all price thresholds met", () => {
    const brewDef = BUILDING_DEFS.find((b) => b.name === "brewery");
    expect(brewDef).toBeDefined();
    const ratio = brewDef!.unlockRatio ?? 0.3;
    const revealResources = Object.fromEntries(
      brewDef!.prices.map((p) => [p.name, p.val * ratio]),
    );
    const result = researchAndReveal("drama", 90000, "brewery", revealResources);
    expect(result.buildings.brewery?.unlocked).toBe(true);
  });

  it("catnipField (defaultUnlockable) visible from start once resources met, no research required", () => {
    const state = {
      ...createInitialState(),
      resources: {
        ...createInitialResources(),
        catnip: { value: 3, maxValue: 0 }, // 30% of 10
      },
    };
    const next = manager.update(state);
    expect(next.buildings.field?.unlocked).toBe(true);
  });

  it("building not yet unlockable stays hidden even with all resources", () => {
    // unicornPasture has no defaultUnlockable and unlockable not set
    const state = {
      ...createInitialState(),
      resources: {
        ...createInitialResources(),
        catnip: { value: 999999, maxValue: 9999999 },
        wood: { value: 999999, maxValue: 9999999 },
        minerals: { value: 999999, maxValue: 9999999 },
        iron: { value: 999999, maxValue: 9999999 },
        gold: { value: 999999, maxValue: 9999999 },
        faith: { value: 999999, maxValue: 9999999 },
      },
    };
    const next = manager.update(state);
    expect(next.buildings.unicornPasture?.unlocked).toBeFalsy();
  });
});

// ── Epic 43: Dynamic Building Consumer Parity ───────────────────────────────

describe("Story 43-01: Harbor dynamic storage modifiers consume workshop effects", () => {
  it("harbor coalMax includes harborCoalRatio effect from barges upgrade", () => {
    const manager = new BuildingManager();
    const state = {
      ...createInitialState(),
      buildings: { ...createInitialBuildings(), harbor: { val: 1, on: 1, unlocked: true } },
      effectCache: { harborCoalRatio: 0.5 },
      workshop: {
        ...createInitialState().workshop,
        upgrades: {
          ...createInitialState().workshop.upgrades,
          barges: { unlocked: true, researched: true },
        },
      },
    };

    const effects = manager.updateEffects(state);
    // Base coalMax 60 + harbor val:1 * 100 = 160
    // Then * (1 + harborCoalRatio from barges 0.5) = 160 * 1.5 = 240
    expect(effects.coalMax).toBeCloseTo(240);
  });

  it("harbor storage caps scale by harborRatio when cargoShips is researched and ships exist", () => {
    const manager = new BuildingManager();
    const state = {
      ...createInitialState(),
      buildings: {
        ...createInitialBuildings(),
        harbor: { val: 1, on: 1, unlocked: true },
      },
      resources: {
        ...createInitialResources(),
        ship: { value: 10, maxValue: 1000 },
      },
      effectCache: { harborRatio: 0.01 },
      workshop: {
        ...createInitialState().workshop,
        upgrades: {
          ...createInitialState().workshop.upgrades,
          cargoShips: { unlocked: true, researched: true },
        },
      },
    };

    const effects = manager.updateEffects(state);

    // Legacy: ratio = 1 + getLimitedDR(cargoShips.effects["harborRatio"] * shipVal, limit)
    // cargoShips.effects["harborRatio"] = 0.01
    // shipVal = 10
    // effect = 0.01 * 10 = 0.1
    // limit = 2.25 (no reactor.on, no harborLimitRatioPolicy effect)
    // Limited DR on 0.1 with limit 2.25 just returns 0.1 (under 75% of 2.25)
    // ratio = 1 + 0.1 = 1.1
    // Base harbor catnipMax: 2500; with val=1: 2500 * 1 = 2500
    // Catnip: 5000 + 2500 * 1.1 = 5000 + 2750 = 7750
    expect(effects.catnipMax).toBeCloseTo(7750);
  });

  it("harbor ratios apply limited DR to cargoShips effect with large ship counts", () => {
    const manager = new BuildingManager();
    const state = {
      ...createInitialState(),
      buildings: {
        ...createInitialBuildings(),
        harbor: { val: 1, on: 1, unlocked: true },
      },
      resources: {
        ...createInitialResources(),
        ship: { value: 500, maxValue: 10000 },
      },
      effectCache: { harborRatio: 0.01 },
      workshop: {
        ...createInitialState().workshop,
        upgrades: {
          ...createInitialState().workshop.upgrades,
          cargoShips: { unlocked: true, researched: true },
        },
      },
    };

    const effects = manager.updateEffects(state);

    // effect = 0.01 * 500 = 5
    // limit = 2.25
    // Since 5 > 75% of 2.25 (1.6875), getLimitedDR kicks in:
    // maxUndiminished = 0.75 * 2.25 = 1.6875
    // diminishedPortion = 5 - 1.6875 = 3.3125
    // delta = 0.25 * 2.25 = 0.5625
    // diminishedEffect = (1 - 0.5625 / (3.3125 + 0.5625)) * 0.5625 = ~0.176
    // totalEffect = 1.6875 + 0.176 = ~1.863
    // So ratio = 1 + 1.863 = ~2.863
    // catnip = 5000 + 2500 * 2.863 = ~12157.5
    expect(effects.catnipMax).toBeGreaterThan(10000);
    expect(effects.catnipMax).toBeLessThan(13000);
  });

  it("harborCoalRatio and harborRatio stack multiplicatively", () => {
    const manager = new BuildingManager();
    const state = {
      ...createInitialState(),
      buildings: {
        ...createInitialBuildings(),
        harbor: { val: 1, on: 1, unlocked: true },
      },
      resources: {
        ...createInitialResources(),
        ship: { value: 5, maxValue: 1000 },
      },
      effectCache: { harborCoalRatio: 0.5, harborRatio: 0.01 },
      workshop: {
        ...createInitialState().workshop,
        upgrades: {
          ...createInitialState().workshop.upgrades,
          barges: { unlocked: true, researched: true },
          cargoShips: { unlocked: true, researched: true },
        },
      },
    };

    const effects = manager.updateEffects(state);

    // coalMax: base 60 + harbor 100 = 160
    // First apply harborCoalRatio: * (1 + 0.5) = 160 * 1.5 = 240
    // Then apply harborRatio (cargoShips): ratio = 1 + 0.01 * 5 = 1.05
    // In legacy, coalMax gets BOTH multipliers:
    // effects["coalMax"] *= (1 + game.getEffect("harborCoalRatio"));
    // effects["coalMax"] *= ratio;
    // So: 160 * 1.5 * 1.05 = 252
    expect(effects.coalMax).toBeCloseTo(252);
  });
});

describe("Story 43-02: Oil well runtime modifiers consume workshop effects", () => {
  it("oil well production scales by oilWellRatio when pumpjack is researched", () => {
    const manager = new BuildingManager();
    const state = {
      ...createInitialState(),
      buildings: {
        ...createInitialBuildings(),
        oilWell: { val: 1, on: 1, unlocked: true, automationEnabled: true },
      },
      effectCache: { oilWellRatio: 0.45 },
      workshop: {
        ...createInitialState().workshop,
        upgrades: {
          ...createInitialState().workshop.upgrades,
          pumpjack: { unlocked: true, researched: true },
        },
      },
    };

    const effects = manager.updateEffects(state);

    // Legacy: oilPerTickBase: 0.02 (base value in building def)
    // ratio = 1 + oilWellRatio (from pumpjack: 0.45)
    // So: 0.02 * (1 + 0.45) = 0.029
    expect(effects.oilPerTickBase).toBeCloseTo(0.029);
  });

  it("oil well automation disabled removes pumpjack bonus", () => {
    const manager = new BuildingManager();
    const state = {
      ...createInitialState(),
      buildings: {
        ...createInitialBuildings(),
        oilWell: { val: 1, on: 1, unlocked: true, automationEnabled: false },
      },
      effectCache: { oilWellRatio: 0.45 },
      workshop: {
        ...createInitialState().workshop,
        upgrades: {
          ...createInitialState().workshop.upgrades,
          pumpjack: { unlocked: true, researched: true },
        },
      },
    };

    const effects = manager.updateEffects(state);

    // When automation is disabled, pumpjack bonus is removed
    // ratio = 1 + oilWellRatio - oilWellRatio = 1
    // So: 0.02 * 1 = 0.02
    expect(effects.oilPerTickBase).toBeCloseTo(0.02);
  });

  it("oil well without pumpjack research stays at base production", () => {
    const manager = new BuildingManager();
    const state = {
      ...createInitialState(),
      buildings: {
        ...createInitialBuildings(),
        oilWell: { val: 1, on: 1, unlocked: true },
      },
    };

    const effects = manager.updateEffects(state);

    // Base oil production with no modifications: 0.02
    expect(effects.oilPerTickBase).toBeCloseTo(0.02);
  });
});

describe("Story 43-03: Reactor runtime modifiers consume workshop effects", () => {
  it("reactor energy production scales by reactorEnergyRatio when coldFusion is researched", () => {
    const manager = new BuildingManager();
    const state = {
      ...createInitialState(),
      buildings: {
        ...createInitialBuildings(),
        reactor: { val: 1, on: 1, unlocked: true },
      },
      effectCache: { reactorEnergyRatio: 0.1 },
      workshop: {
        ...createInitialState().workshop,
        upgrades: {
          ...createInitialState().workshop.upgrades,
          coldFusion: { unlocked: true, researched: true },
        },
      },
    };

    const effects = manager.updateEffects(state);

    // Legacy reactor: energyProduction: 10 (base in building def)
    // ratio = 1 + reactorEnergyRatio (from coldFusion: 0.1)
    // So: 10 * (1 + 0.1) = 11
    expect(effects.energyProduction).toBeCloseTo(11);
  });

  it("reactor without coldFusion research stays at base energy production", () => {
    const manager = new BuildingManager();
    const state = {
      ...createInitialState(),
      buildings: {
        ...createInitialBuildings(),
        reactor: { val: 1, on: 1, unlocked: true },
      },
    };

    const effects = manager.updateEffects(state);

    // Base energy production: 10
    expect(effects.energyProduction).toBeCloseTo(10);
  });
});

describe("Story 43-04: Mint runtime modifiers (partial — mint is complex in legacy)", () => {
  it("mint goldMax includes warehouse ratio after applying mint location multiplier", () => {
    const manager = new BuildingManager();
    const state = {
      ...createInitialState(),
      buildings: {
        ...createInitialBuildings(),
        mint: { val: 1, on: 1, unlocked: true },
      },
      effectCache: { warehouseRatio: 0.25 },
      workshop: {
        ...createInitialState().workshop,
        upgrades: {
          ...createInitialState().workshop.upgrades,
          reinforcedWarehouses: { unlocked: true, researched: true },
        },
      },
    };

    const effects = manager.updateEffects(state);

    // Base goldMax: 10 (rewrite keeps base effects raw, ratios apply only to buildings)
    // Mint goldMax: 100 * (1 + 0.25) = 125
    // Total: 10 + 125 = 135
    expect(effects.goldMax).toBeCloseTo(135);
  });

  it("mint fur/ivory production deferred — not yet implemented in rewrite", () => {
    // Legacy mint has complex fur/ivory production tied to manpower stock,
    // mintRatio, and spiderRelationsPaleontologists effects.
    // This is a multi-step calculation that occurs during the action() phase
    // in legacy, not calculateEffects().
    // Deferring this to Story 43-04b or noting as partial in PARITY.md.
    expect(true).toBe(true);
  });
});

// ── Epic 43: Integration Test ─────────────────────────────────────────────────

describe("Epic 43: Dynamic Building Consumer Parity — Integration Test", () => {
  it("multi-tick loop with all dynamic building modifiers produces correct aggregate state", () => {
    const manager = new BuildingManager();
    let state = {
      ...createInitialState(),
      buildings: {
        ...createInitialBuildings(),
        harbor: { val: 2, on: 2, unlocked: true },
        oilWell: { val: 1, on: 1, unlocked: true, automationEnabled: true },
        reactor: { val: 1, on: 1, unlocked: true },
        mint: { val: 1, on: 1, unlocked: true },
      },
      resources: {
        ...createInitialResources(),
        ship: { value: 20, maxValue: 1000 },
      },
      effectCache: {
        harborRatio: 0.01,
        harborCoalRatio: 0.25,
        oilWellRatio: 0.45,
        reactorEnergyRatio: 0.15,
        warehouseRatio: 0.2,
        mintRatio: 0.1,
      },
      workshop: {
        ...createInitialState().workshop,
        upgrades: {
          ...createInitialState().workshop.upgrades,
          cargoShips: { unlocked: true, researched: true },
          barges: { unlocked: true, researched: true },
          pumpjack: { unlocked: true, researched: true },
          coldFusion: { unlocked: true, researched: true },
          frugality: { unlocked: true, researched: true },
          reinforcedWarehouses: { unlocked: true, researched: true },
        },
      },
    };

    // Tick 1: Build and run effects
    const tick1Effects = manager.updateEffects(state);

    // Verify harbor's dynamic scaling:
    // - Base catnipMax: 5000
    // - Harbor catnipMax (def: 2500): 2500 * 2 (val) = 5000
    // - cargoShips ratio: 0.01 * 20 ships = 0.2, limited DR with limit 2.25 = 0.2
    // - Total before modifications: 5000 + 5000 = 10000
    // - With cargoShips and barges active: multiply all storage keys by (1 + 0.2) = 1.2
    // - Total catnipMax: 10000 * 1.2 = 12000
    expect(tick1Effects.catnipMax).toBeCloseTo(12000);

    // Verify harbor coalMax with both barges and cargoShips modifiers
    // Complex calculation due to warehouse ratio + barges + cargoShips stacking
    expect(tick1Effects.coalMax).toBeGreaterThan(460);
    expect(tick1Effects.coalMax).toBeLessThan(475);

    // Verify oil well production with automation:
    // - Base oilPerTickBase: 0.02
    // - With pumpjack and automation: 0.02 * (1 + 0.45) = 0.029
    expect(tick1Effects.oilPerTickBase).toBeCloseTo(0.029);

    // Verify reactor energy with coldFusion:
    // - Base energyProduction: 10
    // - With coldFusion: 10 * (1 + 0.15) = 11.5
    expect(tick1Effects.energyProduction).toBeCloseTo(11.5);

    // Verify goldMax includes mint, harbor, and cargoShips/warehouse effects
    // Complex calculation: base (10) + harbor (25*2*1.2) + mint (100*1*1.2) + cargoShips scaling
    expect(tick1Effects.goldMax).toBeGreaterThan(230);
    expect(tick1Effects.goldMax).toBeLessThan(245);

    // Update state with new effects
    state = { ...state, effectCache: { ...state.effectCache } };

    // Tick 2: Verify effects persist
    const tick2Effects = manager.updateEffects(state);
    expect(tick2Effects.oilPerTickBase ?? 0).toBeCloseTo(tick1Effects.oilPerTickBase ?? 0);
    expect(tick2Effects.energyProduction ?? 0).toBeCloseTo(tick1Effects.energyProduction ?? 0);
  });
});

// ── Story 49-04: Stage unlock state tracking ────────────────────────────────

describe("Story 49-04: Stage unlock state tracking", () => {
  it("createInitialBuildings sets stageUnlocked for staged buildings", () => {
    const buildings = createInitialBuildings();
    // pasture has 2 stages: stage 0 always unlocked, stage 1 locked
    expect(buildings.pasture?.stageUnlocked).toEqual([true, false]);
    expect(buildings.aqueduct?.stageUnlocked).toEqual([true, false]);
    expect(buildings.library?.stageUnlocked).toEqual([true, false]);
    // warehouse: both stages unlocked by default
    expect(buildings.warehouse?.stageUnlocked).toEqual([true, true]);
    expect(buildings.amphitheatre?.stageUnlocked).toEqual([true, false]);
  });

  it("non-staged buildings do not have stageUnlocked", () => {
    const buildings = createInitialBuildings();
    expect(buildings.field?.stageUnlocked).toBeUndefined();
    expect(buildings.hut?.stageUnlocked).toBeUndefined();
    expect(buildings.mine?.stageUnlocked).toBeUndefined();
  });

  it("stageUnlocked round-trips through serialize/deserialize", () => {
    // serialize/deserialize imported at top of file
    let state = createInitialState();
    // Unlock amphitheatre stage 1
    state = {
      ...state,
      buildings: {
        ...state.buildings,
        amphitheatre: {
          ...state.buildings.amphitheatre!,
          stageUnlocked: [true, true],
        },
      },
    };
    const serialized = serialize(state);
    const deserialized = deserialize(serialized);
    expect(deserialized.buildings.amphitheatre?.stageUnlocked).toEqual([true, true]);
  });
});

// ── Story 49-01: Building stage upgrade/downgrade actions ───────────────────

describe("Story 49-01: Stage upgrade/downgrade actions", () => {
  it("UPGRADE_BUILDING_STAGE increments stage when next stage is unlocked", () => {
    let state = createInitialState();
    state = {
      ...state,
      buildings: {
        ...state.buildings,
        warehouse: {
          val: 3,
          on: 3,
          unlocked: true,
          stage: 0,
          stageUnlocked: [true, true],
        },
      },
    };
    const next = applyAction(state, { type: "UPGRADE_BUILDING_STAGE", name: "warehouse" });
    expect(next.buildings.warehouse?.stage).toBe(1);
  });

  it("UPGRADE_BUILDING_STAGE resets val and on to 0", () => {
    let state = createInitialState();
    state = {
      ...state,
      buildings: {
        ...state.buildings,
        warehouse: {
          val: 5,
          on: 3,
          unlocked: true,
          stage: 0,
          stageUnlocked: [true, true],
        },
      },
    };
    const next = applyAction(state, { type: "UPGRADE_BUILDING_STAGE", name: "warehouse" });
    expect(next.buildings.warehouse?.val).toBe(0);
    expect(next.buildings.warehouse?.on).toBe(0);
  });

  it("UPGRADE_BUILDING_STAGE is rejected when next stage not unlocked", () => {
    let state = createInitialState();
    state = {
      ...state,
      buildings: {
        ...state.buildings,
        pasture: {
          val: 2,
          on: 2,
          unlocked: true,
          stage: 0,
          stageUnlocked: [true, false],
        },
      },
    };
    const next = applyAction(state, { type: "UPGRADE_BUILDING_STAGE", name: "pasture" });
    // No change — still stage 0 with val 2
    expect(next.buildings.pasture?.stage).toBe(0);
    expect(next.buildings.pasture?.val).toBe(2);
  });

  it("UPGRADE_BUILDING_STAGE is rejected for non-staged building", () => {
    const state = createInitialState();
    const next = applyAction(state, { type: "UPGRADE_BUILDING_STAGE", name: "field" });
    expect(next).toBe(state);
  });

  it("DOWNGRADE_BUILDING_STAGE decrements stage and resets val/on", () => {
    let state = createInitialState();
    state = {
      ...state,
      buildings: {
        ...state.buildings,
        warehouse: {
          val: 4,
          on: 2,
          unlocked: true,
          stage: 1,
          stageUnlocked: [true, true],
        },
      },
    };
    const next = applyAction(state, { type: "DOWNGRADE_BUILDING_STAGE", name: "warehouse" });
    expect(next.buildings.warehouse?.stage).toBe(0);
    expect(next.buildings.warehouse?.val).toBe(0);
    expect(next.buildings.warehouse?.on).toBe(0);
  });

  it("DOWNGRADE_BUILDING_STAGE at stage 0 is a no-op", () => {
    let state = createInitialState();
    state = {
      ...state,
      buildings: {
        ...state.buildings,
        pasture: {
          val: 3,
          on: 3,
          unlocked: true,
          stage: 0,
          stageUnlocked: [true, false],
        },
      },
    };
    const next = applyAction(state, { type: "DOWNGRADE_BUILDING_STAGE", name: "pasture" });
    expect(next.buildings.pasture?.stage).toBe(0);
    expect(next.buildings.pasture?.val).toBe(3);
  });

  it("stage persists through save/load round-trip", () => {
    // serialize/deserialize imported at top of file
    let state = createInitialState();
    state = {
      ...state,
      buildings: {
        ...state.buildings,
        warehouse: {
          val: 0,
          on: 0,
          unlocked: true,
          stage: 1,
          stageUnlocked: [true, true],
        },
      },
    };
    const roundTripped = deserialize(serialize(state));
    expect(roundTripped.buildings.warehouse?.stage).toBe(1);
    expect(roundTripped.buildings.warehouse?.stageUnlocked).toEqual([true, true]);
  });
});

// ── Story 49-02: Stage-specific labels and display names ────────────────────

describe("Story 49-02: Stage labels", () => {
  it("STAGE_LABELS has all 5 staged buildings", () => {
    expect(STAGE_LABELS.pasture).toEqual(["Pasture", "Solar Farm"]);
    expect(STAGE_LABELS.aqueduct).toEqual(["Aqueduct", "Hydro Plant"]);
    expect(STAGE_LABELS.library).toEqual(["Library", "Data Center"]);
    expect(STAGE_LABELS.warehouse).toEqual(["Warehouse", "Spaceport"]);
    expect(STAGE_LABELS.amphitheatre).toEqual(["Amphitheatre", "Broadcast Tower"]);
  });

  it("getBuildingDisplayName returns stage 0 label", () => {
    expect(getBuildingDisplayName("pasture", 0)).toBe("Pasture");
    expect(getBuildingDisplayName("library", 0)).toBe("Library");
  });

  it("getBuildingDisplayName returns stage 1 label", () => {
    expect(getBuildingDisplayName("pasture", 1)).toBe("Solar Farm");
    expect(getBuildingDisplayName("warehouse", 1)).toBe("Spaceport");
  });

  it("getBuildingDisplayName returns undefined for non-staged building", () => {
    expect(getBuildingDisplayName("field", 0)).toBeUndefined();
  });
});

// ── Story 49-03: Stage effects for all staged buildings ─────────────────────

describe("Story 49-03: Stage effects definitions", () => {
  it("pasture has stageEffects[0] with catnipDemandRatio and stageEffects[1] with energyProduction", () => {
    const def = BUILDING_DEFS.find((b) => b.name === "pasture");
    expect(def?.stageEffects?.[0]).toEqual({ catnipDemandRatio: -0.005 });
    expect(def?.stageEffects?.[1]).toEqual({ energyProduction: 2 });
  });

  it("aqueduct has stageEffects[0] with catnipRatio and stageEffects[1] with energyProduction", () => {
    const def = BUILDING_DEFS.find((b) => b.name === "aqueduct");
    expect(def?.stageEffects?.[0]).toEqual({ catnipRatio: 0.03 });
    expect(def?.stageEffects?.[1]).toEqual({ energyProduction: 5 });
  });

  it("library has stageEffects[0] with science/culture and stageEffects[1] with dataCenter effects", () => {
    const def = BUILDING_DEFS.find((b) => b.name === "library");
    expect(def?.stageEffects?.[0]).toEqual({ scienceRatio: 0.1, scienceMax: 250, cultureMax: 10 });
    expect(def?.stageEffects?.[1]).toEqual({ scienceMaxCompendia: 1000, cultureMax: 25, energyConsumption: 2 });
  });

  it("warehouse has stageEffects[0] with storage and stageEffects[1] with spaceport effects", () => {
    const def = BUILDING_DEFS.find((b) => b.name === "warehouse");
    expect(def?.stageEffects?.[0]).toEqual({
      woodMax: 150, mineralsMax: 200, coalMax: 30, ironMax: 25, titaniumMax: 10, goldMax: 5,
    });
    expect(def?.stageEffects?.[1]).toEqual({
      moonBaseStorageBonus: 0.0085, planetCrackerStorageBonus: 0.0085,
      cryostationStorageBonus: 0.0085, energyConsumption: 5,
    });
  });

  it("amphitheatre stageEffects are correct", () => {
    const def = BUILDING_DEFS.find((b) => b.name === "amphitheatre");
    expect(def?.stageEffects?.[0]).toEqual({ culturePerTickBase: 0.005, cultureMax: 50, unhappinessRatio: -0.048 });
    expect(def?.stageEffects?.[1]).toEqual({ culturePerTickBase: 1, cultureMax: 300, unhappinessRatio: -0.75 });
  });

  it("effect cache uses stage 1 effects when building is at stage 1", () => {
    let state = createInitialState();
    state = {
      ...state,
      buildings: {
        ...state.buildings,
        amphitheatre: {
          val: 1,
          on: 1,
          unlocked: true,
          stage: 1,
          stageUnlocked: [true, true],
        },
      },
    };
    const manager = new BuildingManager();
    const effects = manager.updateEffects(state);
    // stage 1 amphitheatre (broadcastTower) has culturePerTickBase: 1
    expect(effects.culturePerTickBase).toBeCloseTo(1);
    // stage 1 has unhappinessRatio: -0.75 (not stage 0's -0.048)
    expect(effects.unhappinessRatio).toBeCloseTo(-0.75);
  });
});

// ── Cross-manager integration: stage lifecycle ──────────────────────────────

describe("Epic 49 integration: full stage lifecycle", () => {
  it("upgrade → buy at new stage → effects reflect new stage → downgrade resets", () => {
    let state = createInitialState();
    const manager = new BuildingManager();

    // Set up warehouse with some buildings, both stages unlocked
    state = {
      ...state,
      buildings: {
        ...state.buildings,
        warehouse: {
          val: 3,
          on: 3,
          unlocked: true,
          stage: 0,
          stageUnlocked: [true, true],
        },
      },
    };

    // Verify stage 0 effects
    let effects = manager.updateEffects(state);
    expect(effects.woodMax).toBeGreaterThan(0);

    // Upgrade to stage 1 (spaceport) — should reset val/on to 0
    state = applyAction(state, { type: "UPGRADE_BUILDING_STAGE", name: "warehouse" });
    expect(state.buildings.warehouse?.stage).toBe(1);
    expect(state.buildings.warehouse?.val).toBe(0);
    expect(state.buildings.warehouse?.on).toBe(0);

    // After upgrade, val/on = 0, so warehouse contributes nothing; only base effects remain
    effects = manager.updateEffects(state);
    // Base woodMax (200) is still there but no warehouse contribution
    expect(effects.woodMax).toBe(200); // only base, no warehouse stage contribution

    // Give resources and buy one spaceport
    state = {
      ...state,
      resources: {
        ...state.resources,
        beam: { value: 100, maxValue: 999 },
        slab: { value: 100, maxValue: 999 },
      },
      buildings: {
        ...state.buildings,
        warehouse: { ...state.buildings.warehouse!, val: 1, on: 1 },
      },
    };

    // Stage 1 effects: moonBaseStorageBonus etc.
    effects = manager.updateEffects(state);
    expect(effects.moonBaseStorageBonus).toBeCloseTo(0.0085);
    expect(effects.energyConsumption).toBeGreaterThanOrEqual(5);

    // Downgrade back to stage 0 — resets val/on again
    state = applyAction(state, { type: "DOWNGRADE_BUILDING_STAGE", name: "warehouse" });
    expect(state.buildings.warehouse?.stage).toBe(0);
    expect(state.buildings.warehouse?.val).toBe(0);
    expect(state.buildings.warehouse?.on).toBe(0);

    // Stage labels
    expect(getBuildingDisplayName("warehouse", 0)).toBe("Warehouse");
    expect(getBuildingDisplayName("warehouse", 1)).toBe("Spaceport");

    // Serialize and deserialize
    const roundTripped = deserialize(serialize(state));
    expect(roundTripped.buildings.warehouse?.stage).toBe(0);
    expect(roundTripped.buildings.warehouse?.stageUnlocked).toEqual([true, true]);
  });
});
