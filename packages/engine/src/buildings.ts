import type { Serializable } from "@kittens/shared";
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
  readonly prices: readonly PriceEntry[];
  readonly priceRatio: number;
  /** Static effects contributed to the effect cache */
  readonly effects: Readonly<Record<string, number>>;
}

/** Runtime state for a single building */
export interface BuildingEntry {
  /** Total buildings purchased */
  readonly val: number;
  /** Buildings currently active/on */
  readonly on: number;
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
    prices: [{ name: "catnip", val: 10 }],
    priceRatio: 1.12,
    effects: { catnipPerTickBase: 0.125 },
  },
  {
    name: "pasture",
    prices: [
      { name: "catnip", val: 100 },
      { name: "wood", val: 10 },
    ],
    priceRatio: 1.15,
    effects: { catnipDemandRatio: -0.005 },
  },
  {
    name: "aqueduct",
    prices: [{ name: "minerals", val: 75 }],
    priceRatio: 1.12,
    effects: { catnipRatio: 0.03 },
  },
  // ── Population ──────────────────────────────────────────────────────────────
  {
    name: "hut",
    prices: [{ name: "wood", val: 5 }],
    priceRatio: 2.5,
    effects: { manpowerMax: 75, maxKittens: 2 },
  },
  {
    name: "logHouse",
    prices: [
      { name: "wood", val: 200 },
      { name: "minerals", val: 250 },
    ],
    priceRatio: 1.15,
    effects: { manpowerMax: 50, maxKittens: 1 },
  },
  {
    name: "mansion",
    prices: [
      { name: "titanium", val: 25 },
      { name: "slab", val: 185 },
      { name: "steel", val: 75 },
    ],
    priceRatio: 1.15,
    effects: { manpowerMax: 50, maxKittens: 1 },
  },
  // ── Science ──────────────────────────────────────────────────────────────────
  {
    name: "library",
    prices: [{ name: "wood", val: 25 }],
    priceRatio: 1.15,
    effects: { scienceRatio: 0.1, scienceMax: 250, cultureMax: 10 },
  },
  {
    name: "academy",
    prices: [
      { name: "wood", val: 50 },
      { name: "minerals", val: 70 },
      { name: "science", val: 100 },
    ],
    priceRatio: 1.15,
    effects: { scienceRatio: 0.2, scienceMax: 500, cultureMax: 25 },
  },
  // ── Resource production ──────────────────────────────────────────────────────
  {
    name: "mine",
    prices: [{ name: "wood", val: 100 }],
    priceRatio: 1.15,
    effects: { mineralsRatio: 0.2 },
  },
  // ── Resource storage ─────────────────────────────────────────────────────────
  {
    name: "barn",
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
  },
  {
    name: "warehouse",
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
  },
];

// ── Factory ───────────────────────────────────────────────────────────────────

/**
 * Return a fresh BuildingState with all buildings at val:0, on:0.
 */
export function createInitialBuildings(): BuildingState {
  const state: BuildingState = {};
  for (const def of BUILDING_DEFS) {
    state[def.name] = { val: 0, on: 0 };
  }
  return state;
}

// ── Price calculation ─────────────────────────────────────────────────────────

/**
 * Calculate the current prices to buy a building given how many are already owned.
 * price = base * priceRatio^count
 *
 * Port of legacy `buildings.js` price scaling.
 */
export function getBuildingPrice(def: BuildingDef, count: number): readonly PriceEntry[] {
  const multiplier = def.priceRatio ** count;
  return def.prices.map((p) => ({ name: p.name, val: p.val * multiplier }));
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
  update(state: GameState): GameState {
    // Buildings don't self-update each tick; changes come from BUY_BUILDING actions.
    return state;
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
        buildings[def.name] = {
          val: (entry as Record<string, unknown>).val as number,
          on: (entry as Record<string, unknown>).on as number,
        };
      }
    }

    return { ...state, buildings };
  }

  resetState(state: GameState): GameState {
    return { ...state, buildings: createInitialBuildings() };
  }
}
