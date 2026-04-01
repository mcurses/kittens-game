import type { Serializable } from "@kittens/shared";
import { getLimitedDR } from "./effects.js";
import type { Manager } from "./manager.js";
import type { ResourceState } from "./resources.js";
import type { GameState } from "./state.js";

// ── Types ─────────────────────────────────────────────────────────────────────

/** A single price component for a building */
export interface PriceEntry {
  readonly name: string;
  readonly val: number;
}

/**
 * Static definition for a building.
 * Only includes effects that don't require runtime game context
 * (no calculateEffects with workshop upgrades, etc.).
 */
export interface BuildingDef {
  readonly name: string;
  /** Short human-readable description shown in the inspector panel */
  readonly description?: string;
  readonly prices: readonly PriceEntry[];
  readonly priceRatio: number;
  /** Static effects contributed to the effect cache */
  readonly effects: Readonly<Record<string, number>>;
  /**
   * If true, this building is a candidate for auto-unlock once resource thresholds are met.
   * Port of legacy `defaultUnlockable` on buildingsData entries.
   */
  readonly defaultUnlockable?: boolean;
  /**
   * Fraction of base price the player must have in each resource to unlock.
   * 0.3 means 30% of price required. Port of legacy `unlockRatio`.
   */
  readonly unlockRatio?: number;
  /**
   * Tech names that must all be researched before this building can auto-unlock.
   * Parallel to legacy `requiredTech` on buildingsData entries.
   * When present, the building unlocks only if all techs are researched AND unlockRatio threshold is met.
   */
  readonly requiredTech?: readonly string[];
}

/** Runtime state for a single building */
export interface BuildingEntry {
  /** Total buildings purchased */
  readonly val: number;
  /** Buildings currently active/on */
  readonly on: number;
  /** Whether this building has been unlocked (visible to the player). One-way: once true, stays true. */
  readonly unlocked?: boolean;
}

/** Flat map of all building states, keyed by building name */
export type BuildingState = Record<string, BuildingEntry>;

// ── Building Definitions ──────────────────────────────────────────────────────

/**
 * Static building definitions for early-game buildings.
 * Only buildings with fully static effects are included.
 * Port of legacy `buildingsData` in buildings.js.
 *
 * Effect scaling rules (from legacy BuildingsManager constructor):
 * - Effects ending in 'Max': multiply by bld.val
 * - All other effects: multiply by bld.on
 */
export const BUILDING_DEFS: readonly BuildingDef[] = [
  // ── Food production ─────────────────────────────────────────────────────────
  {
    name: "field",
    description: "Grows catnip passively each tick. The foundation of your food supply.",
    prices: [{ name: "catnip", val: 10 }],
    priceRatio: 1.12,
    effects: { catnipPerTickBase: 0.125 },
    defaultUnlockable: true,
    unlockRatio: 0.3,
  },
  {
    name: "pasture",
    description: "Grazing land that reduces how much catnip each kitten consumes.",
    prices: [
      { name: "catnip", val: 100 },
      { name: "wood", val: 10 },
    ],
    priceRatio: 1.15,
    effects: { catnipDemandRatio: -0.005 },
    unlockRatio: 0.3,
    requiredTech: ["animal"],
  },
  {
    name: "aqueduct",
    description: "Irrigation channels that boost catnip field output by routing water to crops.",
    prices: [{ name: "minerals", val: 75 }],
    priceRatio: 1.12,
    effects: { catnipRatio: 0.03 },
    unlockRatio: 0.3,
    requiredTech: ["engineering"],
  },
  // ── Population ──────────────────────────────────────────────────────────────
  {
    name: "hut",
    description: "Simple shelters that house more kittens and expand catpower capacity.",
    prices: [{ name: "wood", val: 5 }],
    priceRatio: 2.5,
    effects: { catpowerMax: 75, maxKittens: 2 },
    defaultUnlockable: true,
    unlockRatio: 0.3,
  },
  {
    name: "logHouse",
    description: "Sturdier log construction providing comfortable housing for growing families.",
    prices: [
      { name: "wood", val: 200 },
      { name: "minerals", val: 250 },
    ],
    priceRatio: 1.15,
    effects: { catpowerMax: 50, maxKittens: 1 },
    unlockRatio: 0.3,
    requiredTech: ["construction"],
  },
  {
    name: "mansion",
    description: "Opulent estate crafted from advanced materials — the pinnacle of kitten housing.",
    prices: [
      { name: "titanium", val: 25 },
      { name: "slab", val: 185 },
      { name: "steel", val: 75 },
    ],
    priceRatio: 1.15,
    effects: { catpowerMax: 50, maxKittens: 1 },
    unlockRatio: 0.3,
    requiredTech: ["architecture"],
  },
  // ── Science ──────────────────────────────────────────────────────────────────
  {
    name: "library",
    description: "Repository of knowledge that boosts science output and expands culture capacity.",
    prices: [{ name: "wood", val: 25 }],
    priceRatio: 1.15,
    effects: { scienceRatio: 0.1, scienceMax: 250, cultureMax: 10 },
    defaultUnlockable: true,
    unlockRatio: 0.3,
  },
  {
    name: "academy",
    description: "Advanced research institution providing a major boost to science generation.",
    prices: [
      { name: "wood", val: 50 },
      { name: "minerals", val: 70 },
      { name: "science", val: 100 },
    ],
    priceRatio: 1.15,
    effects: { scienceRatio: 0.2, scienceMax: 500, cultureMax: 25 },
    unlockRatio: 0.3,
    requiredTech: ["math"],
  },
  // ── Resource production ──────────────────────────────────────────────────────
  {
    name: "mine",
    description: "Underground excavation that increases the rate of mineral extraction.",
    prices: [{ name: "wood", val: 100 }],
    priceRatio: 1.15,
    effects: { mineralsRatio: 0.2 },
    unlockRatio: 0.3,
    requiredTech: ["mining"],
  },
  // ── Resource storage ─────────────────────────────────────────────────────────
  {
    name: "barn",
    description: "Large storage structure that dramatically increases capacity for all basic resources.",
    prices: [{ name: "wood", val: 50 }],
    priceRatio: 1.75,
    effects: {
      catnipMax: 5000,
      woodMax: 200,
      mineralsMax: 250,
      coalMax: 60,
      ironMax: 50,
      titaniumMax: 2,
      goldMax: 10,
    },
    unlockRatio: 0.3,
    requiredTech: ["agriculture"],
  },
  {
    name: "warehouse",
    description: "Reinforced storage facility built from refined materials for mid-game resources.",
    prices: [
      { name: "beam", val: 1.5 },
      { name: "slab", val: 2 },
    ],
    priceRatio: 1.15,
    effects: {
      woodMax: 150,
      mineralsMax: 200,
      coalMax: 30,
      ironMax: 25,
      titaniumMax: 10,
      goldMax: 5,
    },
    unlockRatio: 0.3,
    requiredTech: ["construction"],
  },
  // ── Culture / happiness ──────────────────────────────────────────────────────
  {
    name: "amphitheatre",
    description: "Entertainment venue that boosts culture production and reduces unhappiness.",
    prices: [
      { name: "wood", val: 200 },
      { name: "minerals", val: 1200 },
      { name: "parchment", val: 3 },
    ],
    priceRatio: 1.15,
    effects: {
      culturePerTickBase: 0.005,
      cultureMax: 50,
      unhappinessRatio: -0.048,
    },
    unlockRatio: 0.3,
    requiredTech: ["writing"],
  },
  {
    name: "brewery",
    description: "Produces fermented beverages that boost kitten happiness.",
    prices: [
      { name: "wood", val: 1000 },
      { name: "culture", val: 750 },
      { name: "spice", val: 5 },
      { name: "parchment", val: 375 },
    ],
    priceRatio: 1.5,
    effects: {
      happiness: 0.01,
    },
    unlockRatio: 0.2,
    requiredTech: ["agriculture"],
  },
  // ── Resource production multipliers ──────────────────────────────────────────
  {
    name: "lumberMill",
    description: "Advanced sawmill that significantly increases wood production.",
    prices: [
      { name: "wood", val: 100 },
      { name: "minerals", val: 250 },
      { name: "iron", val: 50 },
    ],
    priceRatio: 1.15,
    effects: {
      woodRatio: 0.1,
    },
    unlockRatio: 0.3,
    requiredTech: ["construction"],
  },
  {
    name: "smelter",
    description: "Smelts minerals into refined metals, boosting iron production.",
    prices: [{ name: "minerals", val: 200 }],
    priceRatio: 1.15,
    effects: {
      ironRatio: 0.5,
    },
    unlockRatio: 0.3,
    requiredTech: ["mining"],
  },
  {
    name: "observatory",
    description: "Telescope complex that significantly amplifies science output.",
    prices: [
      { name: "iron", val: 750 },
      { name: "science", val: 1000 },
      { name: "slab", val: 35 },
      { name: "scaffold", val: 50 },
    ],
    priceRatio: 1.1,
    effects: {
      scienceRatio: 0.25,
      scienceMax: 1000,
    },
    unlockRatio: 0.3,
    requiredTech: ["astronomy"],
  },
  {
    name: "mint",
    description: "Coin mint that expands gold storage capacity.",
    prices: [
      { name: "minerals", val: 5000 },
      { name: "gold", val: 500 },
      { name: "plate", val: 200 },
    ],
    priceRatio: 1.15,
    effects: {
      goldMax: 100,
    },
    unlockRatio: 0.3,
    requiredTech: ["currency"],
  },
  // ── Religion ─────────────────────────────────────────────────────────────────
  {
    name: "temple",
    description: "Sacred structure that increases culture output, faith capacity, and happiness.",
    prices: [
      { name: "gold", val: 50 },
      { name: "slab", val: 25 },
      { name: "plate", val: 15 },
      { name: "manuscript", val: 10 },
    ],
    priceRatio: 1.15,
    effects: {
      culturePerTickBase: 0.1,
      faithMax: 100,
    },
    unlockRatio: 0.3,
    requiredTech: ["philosophy"],
  },
  // ── Unicorns ─────────────────────────────────────────────────────────────────
  {
    name: "unicornPasture",
    description: "Magical pasture that generates a small trickle of unicorns each tick.",
    prices: [{ name: "unicorns", val: 2 }],
    priceRatio: 1.75,
    effects: {
      unicornsPerTickBase: 0.001,
      catnipDemandRatio: -0.0015,
    },
    unlockRatio: 0.3,
  },
  // ── Advanced production ───────────────────────────────────────────────────────
  {
    name: "calciner",
    description: "Industrial furnace that refines ore into iron and titanium.",
    prices: [
      { name: "titanium", val: 15 },
      { name: "oil", val: 500 },
      { name: "steel", val: 100 },
      { name: "blueprint", val: 1 },
    ],
    priceRatio: 1.15,
    effects: {
      ironPerTickBase: 0.15,
      titaniumPerTickBase: 0.0005,
      // Story 31-07: consumption side (legacy buildings.js:1092–1097)
      mineralsPerTickCon: -1.5,
      oilPerTickCon: -0.024,
      energyConsumption: 1,
    },
    unlockRatio: 0.3,
    requiredTech: ["metallurgy"],
  },

  // ── Story 31-01: Chapel ───────────────────────────────────────────────────────
  // Legacy buildings.js lines 1832–1861
  {
    name: "chapel",
    description: "A small place of worship that produces culture and faith.",
    prices: [
      { name: "minerals", val: 2000 },
      { name: "culture", val: 250 },
      { name: "parchment", val: 250 },
    ],
    priceRatio: 1.15,
    effects: {
      culturePerTickBase: 0.05,
      faithPerTickBase: 0.005,
      cultureMax: 200,
    },
  },

  // ── Story 31-02: Workshop (building def) ──────────────────────────────────────
  // Legacy buildings.js lines 1436–1463
  {
    name: "workshop",
    description: "Provides crafting capacity and boosts craft output.",
    prices: [
      { name: "wood", val: 100 },
      { name: "minerals", val: 400 },
    ],
    priceRatio: 1.15,
    defaultUnlockable: true,
    unlockRatio: 0.0025,
    effects: {
      craftRatio: 0.06,
    },
  },

  // ── Story 31-03: Steamworks ───────────────────────────────────────────────────
  // Legacy buildings.js lines 1208–1315
  {
    name: "steamworks",
    description: "Steam-powered factory that produces energy and boosts magneto efficiency.",
    prices: [
      { name: "steel", val: 65 },
      { name: "gear", val: 20 },
      { name: "blueprint", val: 1 },
    ],
    priceRatio: 1.25,
    effects: {
      energyProduction: 1,
      magnetoBoostRatio: 0.15,
      coalRatioGlobal: -0.8,
      cathPollutionPerTickProd: 1,
    },
  },

  // ── Story 31-04: Magneto ──────────────────────────────────────────────────────
  // Legacy buildings.js lines 1317–1365
  {
    name: "magneto",
    description: "Electromagnetic generator that produces energy and boosts production.",
    prices: [
      { name: "gear", val: 5 },
      { name: "alloy", val: 10 },
      { name: "blueprint", val: 1 },
    ],
    priceRatio: 1.25,
    effects: {
      oilPerTick: -0.05,
      energyProduction: 5,
      magnetoRatio: 0.02,
      cathPollutionPerTickProd: 5,
    },
  },

  // ── Story 31-05: Tradepost ────────────────────────────────────────────────────
  // Legacy buildings.js lines 1630–1653
  {
    name: "tradepost",
    description: "Reduces luxury demand and improves trade capacity.",
    prices: [
      { name: "wood", val: 500 },
      { name: "minerals", val: 200 },
      { name: "gold", val: 10 },
    ],
    priceRatio: 1.15,
    unlockRatio: 0.3,
    effects: {
      fursDemandRatio: -0.04,
      ivoryDemandRatio: -0.04,
      spiceDemandRatio: -0.04,
      tradeRatio: 0.015,
    },
  },

  // ── Story 31-06: Harbor ───────────────────────────────────────────────────────
  // Legacy buildings.js lines 870–920
  {
    name: "harbor",
    description: "Port facility that increases storage capacity for many resources.",
    prices: [
      { name: "slab", val: 50 },
      { name: "plate", val: 75 },
      { name: "scaffold", val: 5 },
    ],
    priceRatio: 1.15,
    effects: {
      catnipMax: 2500,
      woodMax: 700,
      mineralsMax: 950,
      coalMax: 100,
      ironMax: 150,
      titaniumMax: 50,
      goldMax: 25,
    },
  },

  // ── Story 31-08: Quarry ───────────────────────────────────────────────────────
  // Legacy buildings.js lines 961–995
  {
    name: "quarry",
    description: "Mine that boosts mineral production and provides coal.",
    prices: [
      { name: "slab", val: 1000 },
      { name: "steel", val: 125 },
      { name: "scaffold", val: 50 },
    ],
    priceRatio: 1.15,
    unlockRatio: 0.3,
    effects: {
      mineralsRatio: 0.35,
      coalPerTickBase: 0.015,
      cathPollutionPerTickProd: 0.25,
    },
  },

  // ── Story 31-09: Oil Well ─────────────────────────────────────────────────────
  // Legacy buildings.js lines 1386–1432
  {
    name: "oilWell",
    description: "Extracts crude oil from the ground.",
    prices: [
      { name: "steel", val: 50 },
      { name: "gear", val: 25 },
      { name: "scaffold", val: 25 },
    ],
    priceRatio: 1.15,
    effects: {
      oilPerTickBase: 0.02,
      oilMax: 1500,
    },
  },

  // ── Story 31-10: Factory ──────────────────────────────────────────────────────
  // Legacy buildings.js lines 1465–1515
  {
    name: "factory",
    description: "Industrial facility that greatly boosts craft output.",
    prices: [
      { name: "titanium", val: 2000 },
      { name: "plate", val: 2500 },
      { name: "concrate", val: 15 },
    ],
    priceRatio: 1.15,
    effects: {
      craftRatio: 0.05,
      energyConsumption: 2,
    },
  },

  // ── Story 31-11: Ziggurat (building) ─────────────────────────────────────────
  // Legacy buildings.js lines 1977–2025
  {
    name: "ziggurat",
    description: "Ancient wonder that boosts culture capacity and unlocks religion upgrades.",
    prices: [
      { name: "scaffold", val: 50 },
      { name: "blueprint", val: 1 },
      { name: "megalith", val: 50 },
    ],
    priceRatio: 1.25,
    unlockRatio: 0.01,
    effects: {
      cultureMaxRatio: 0.08,
    },
  },

  // ── Story 31-13: Chronosphere ─────────────────────────────────────────────────
  // Legacy buildings.js lines 2027–2049
  {
    name: "chronosphere",
    description: "Temporal wonder that preserves resources across resets.",
    prices: [
      { name: "unobtainium", val: 2500 },
      { name: "science", val: 250000 },
      { name: "timeCrystal", val: 1 },
      { name: "blueprint", val: 100 },
    ],
    priceRatio: 1.25,
    effects: {
      temporalParadoxChance: 0.01,
      resStasisRatio: 0.015,
      energyConsumption: 20,
    },
  },

  // ── Story 31-14: Reactor ──────────────────────────────────────────────────────
  // Legacy buildings.js lines 1517–1565
  {
    name: "reactor",
    description: "Nuclear reactor that generates energy and boosts global production.",
    prices: [
      { name: "titanium", val: 3500 },
      { name: "plate", val: 5000 },
      { name: "concrate", val: 50 },
      { name: "blueprint", val: 25 },
    ],
    priceRatio: 1.15,
    effects: {
      uraniumPerTick: -0.001,
      productionRatio: 0.05,
      uraniumMax: 250,
      energyProduction: 10,
    },
  },

  // ── Story 31-15: Biolab ───────────────────────────────────────────────────────
  // Legacy buildings.js lines 675–743
  {
    name: "biolab",
    description: "Biological laboratory that boosts science production.",
    prices: [
      { name: "science", val: 1500 },
      { name: "slab", val: 100 },
      { name: "alloy", val: 25 },
    ],
    priceRatio: 1.10,
    effects: {
      scienceRatio: 0.35,
      refineRatio: 0.1,
      scienceMax: 1500,
    },
  },

  // ── Story 31-16: AI Core ──────────────────────────────────────────────────────
  // Legacy buildings.js lines 2051–2098
  {
    name: "aiCore",
    description: "Artificial intelligence system that produces gflops.",
    prices: [
      { name: "antimatter", val: 125 },
      { name: "science", val: 500000 },
    ],
    priceRatio: 1.15,
    unlockRatio: 0.01,
    effects: {
      gflopsPerTickBase: 0.02,
      energyConsumption: 2,
    },
  },

  // ── Story 31-17: Accelerator ──────────────────────────────────────────────────
  // Legacy buildings.js lines 1567–1627
  {
    name: "accelerator",
    description: "Particle accelerator that converts titanium into uranium.",
    prices: [
      { name: "titanium", val: 7500 },
      { name: "uranium", val: 25 },
      { name: "concrate", val: 125 },
    ],
    priceRatio: 1.15,
    effects: {
      titaniumPerTickCon: -0.015,
      uraniumPerTickAutoprod: 0.0025,
      energyConsumption: 2,
    },
  },

  // ── Story 31-17: Zebra buildings ─────────────────────────────────────────────
  // Legacy buildings.js lines 2102–2182
  {
    name: "zebraOutpost",
    description: "Zebra outpost that boosts hunter efficiency.",
    prices: [{ name: "bloodstone", val: 1 }],
    priceRatio: 1.35,
    unlockRatio: 0.01,
    effects: {
      hunterRatio: 0.05,
      catpowerMax: 5,
    },
  },
  {
    name: "zebraWorkshop",
    description: "Zebra workshop that provides catpower storage.",
    prices: [{ name: "bloodstone", val: 5 }],
    priceRatio: 1.15,
    unlockRatio: 0.01,
    effects: {
      catpowerMax: 25,
    },
  },
  {
    name: "zebraForge",
    description: "Zebra forge that provides catpower storage and tMythril crafting.",
    prices: [{ name: "bloodstone", val: 50 }],
    priceRatio: 1.15,
    unlockRatio: 0.01,
    effects: {
      catpowerMax: 50,
      tMythrilCraftRatio: 0.01,
    },
  },
];

// ── Factory ───────────────────────────────────────────────────────────────────

/**
 * Return a fresh BuildingState with all buildings at val:0, on:0.
 */
export function createInitialBuildings(): BuildingState {
  const state: BuildingState = {};
  for (const def of BUILDING_DEFS) {
    state[def.name] = { val: 0, on: 0, unlocked: false };
  }
  return state;
}

// ── Price calculation ─────────────────────────────────────────────────────────

/**
 * Calculate the current prices to buy a building given how many are already owned.
 *
 * Port of legacy `buildings.js getPriceRatioWithAccessor()`.
 * Effective ratio = def.priceRatio + getLimitedDR(effectCache[name+"PriceRatio"] + effectCache["priceRatio"], ratioBase)
 * where ratioBase = def.priceRatio - 1.
 * The DR cap prevents prestige/map bonuses from reducing ratio below 1 (no free buildings).
 */
export function getBuildingPrice(
  def: BuildingDef,
  count: number,
  effectCache: Record<string, number> = {},
): readonly PriceEntry[] {
  const ratioBase = def.priceRatio - 1;
  const ratioDiff = getLimitedDR(
    (effectCache[`${def.name}PriceRatio`] ?? 0) + (effectCache.priceRatio ?? 0),
    ratioBase,
  );
  const ratio = def.priceRatio + ratioDiff;
  return def.prices.map((p) => ({ name: p.name, val: p.val * ratio ** count }));
}

// ── Affordability check ───────────────────────────────────────────────────────

/**
 * Check whether the given resource state can afford all prices.
 * Returns true if all resources have sufficient value.
 */
export function canAfford(prices: readonly PriceEntry[], resources: ResourceState): boolean {
  for (const price of prices) {
    const entry = resources[price.name];
    if (!entry || entry.value < price.val) {
      return false;
    }
  }
  return true;
}

// ── BuildingManager ───────────────────────────────────────────────────────────

/**
 * Manages building state and contributes static effects to the effect cache.
 * Does NOT handle resource deduction (that's done in applyAction for BUY_BUILDING).
 *
 * Port of legacy `BuildingsManager` in buildings.js.
 */
export class BuildingManager implements Manager {
  readonly sectionKey = "buildings";

  update(state: GameState): GameState {
    // Check auto-unlock for defaultUnlockable buildings (one-way: never lock back once unlocked).
    // Port of legacy BuildingsManager.update() isUnlocked() check with unlockRatio.
    let changed = false;
    const buildings = { ...state.buildings };

    for (const def of BUILDING_DEFS) {
      if (def.unlockRatio === undefined) continue;
      const entry = buildings[def.name];
      if (!entry || entry.unlocked) continue; // already unlocked — skip

      // Check if this building is unlockable at all:
      // - defaultUnlockable: always unlockable once resources met
      // - requiredTech: all listed techs must be researched
      let isUnlockable = def.defaultUnlockable === true;
      if (!isUnlockable && def.requiredTech?.length) {
        isUnlockable = def.requiredTech.every(
          (techName) => state.science.techs[techName]?.researched === true,
        );
      }
      if (!isUnlockable) continue;

      // Check if player has unlockRatio fraction of all price components
      let meetsThreshold = true;
      for (const price of def.prices) {
        const res = state.resources[price.name];
        if ((res?.value ?? 0) < price.val * def.unlockRatio) {
          meetsThreshold = false;
          break;
        }
      }

      if (meetsThreshold) {
        buildings[def.name] = { ...entry, unlocked: true };
        changed = true;
      }
    }

    return changed ? { ...state, buildings } : state;
  }

  updateEffects(state: GameState): Record<string, number> {
    const effects: Record<string, number> = {};

    for (const def of BUILDING_DEFS) {
      const entry = state.buildings[def.name];
      if (!entry) continue;
      if (entry.val === 0 && entry.on === 0) continue;

      for (const [effectName, baseValue] of Object.entries(def.effects)) {
        // Max effects scale by val; all other effects scale by on
        const multiplier = effectName.endsWith("Max") ? entry.val : entry.on;
        if (multiplier === 0) continue;
        effects[effectName] = (effects[effectName] ?? 0) + baseValue * multiplier;
      }
    }

    // ── Temple dynamic happiness (Story 30-01) ────────────────────────────────
    // Legacy buildings.js temple.calculateEffects(): happiness = 0.4 + 0.1 * sunAltar.on
    // sunAltar is a religion upgrade; value depends on state, so must be dynamic.
    const temple = state.buildings.temple;
    if (temple && temple.on > 0) {
      const sunAltarOn = state.religion?.religionUpgrades?.sunAltar?.on ?? 0;
      effects.happiness = (effects.happiness ?? 0) + (0.4 + 0.1 * sunAltarOn) * temple.on;
    }

    // ── Brewery consumption (Story 30-05) ─────────────────────────────────────
    // Legacy buildings.js: per active brewery per tick: -1 catnip, -0.1 spice
    // Both scaled by (1 + breweryConsumptionRatio).
    const brewery = state.buildings.brewery;
    if (brewery && brewery.on > 0) {
      const brewRatio = state.effectCache.breweryConsumptionRatio ?? 0;
      effects.catnipPerTickCon = (effects.catnipPerTickCon ?? 0) + -1 * brewery.on * (1 + brewRatio);
      effects.spicePerTickCon = (effects.spicePerTickCon ?? 0) + -0.1 * brewery.on * (1 + brewRatio);
    }

    return effects;
  }

  save(state: GameState): Serializable {
    return state.buildings as unknown as Serializable;
  }

  load(saved: Serializable, state: GameState): GameState {
    if (!saved || typeof saved !== "object" || Array.isArray(saved)) {
      return { ...state, buildings: createInitialBuildings() };
    }
    const raw = saved as Record<string, unknown>;
    const buildings: BuildingState = { ...createInitialBuildings() };

    for (const def of BUILDING_DEFS) {
      const entry = raw[def.name];
      if (
        entry &&
        typeof entry === "object" &&
        !Array.isArray(entry) &&
        typeof (entry as Record<string, unknown>).val === "number" &&
        typeof (entry as Record<string, unknown>).on === "number"
      ) {
        const e = entry as Record<string, unknown>;
        buildings[def.name] = {
          val: e.val as number,
          on: e.on as number,
          unlocked: typeof e.unlocked === "boolean" ? e.unlocked : false,
        };
      }
    }

    return { ...state, buildings };
  }

  resetState(state: GameState): GameState {
    return { ...state, buildings: createInitialBuildings() };
  }
}
