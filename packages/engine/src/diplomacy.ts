import type { Serializable } from "@kittens/shared";
import { produce } from "immer";
import type { Manager } from "./manager.js";
import type { GameState } from "./state.js";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface SellEntry {
  readonly name: string;
  /** Base amount per successful trade */
  readonly value: number;
  /** Probability of this item appearing (0–1) */
  readonly chance: number;
  /** Seasonal modifiers keyed by season name */
  readonly seasons?: Readonly<Record<string, number>>;
  /** Embassy level required to receive this item */
  readonly minLevel?: number;
}

export interface BuyEntry {
  readonly name: string;
  readonly val: number;
}

export interface RaceDef {
  readonly name: string;
  /** Default standing (-1 to 1). Positive = bonus trades, negative = trade failures. */
  readonly standing: number;
  /** Whether the race is hidden until specific conditions are met */
  readonly hidden: boolean;
  /** Embassy price (culture-based) */
  readonly embassyPrice: number;
  /** Resource this race buys from the player */
  readonly buys: readonly BuyEntry[];
  /** Resources this race sells to the player */
  readonly sells: readonly SellEntry[];
}

export interface RaceEntry {
  readonly unlocked: boolean;
  readonly embassyLevel: number;
}

export interface DiplomacyState {
  readonly races: Record<string, RaceEntry>;
  /** Base gold cost per trade (default 15) */
  readonly baseGoldCost: number;
  /** Base manpower cost per trade (default 50) */
  readonly baseManpowerCost: number;
}

// ── Race Definitions ──────────────────────────────────────────────────────────

export const RACE_DEFS: readonly RaceDef[] = [
  {
    name: "lizards",
    standing: 0.25,
    hidden: false,
    embassyPrice: 100,
    buys: [{ name: "minerals", val: 1000 }],
    sells: [
      {
        name: "wood",
        value: 500,
        chance: 1,
        seasons: { spring: -0.05, summer: 0.35, autumn: 0.15, winter: 0.05 },
      },
      { name: "beam", value: 10, chance: 0.25, minLevel: 5 },
      { name: "scaffold", value: 1, chance: 0.1, minLevel: 10 },
    ],
  },
  {
    name: "sharks",
    standing: 0,
    hidden: false,
    embassyPrice: 100,
    buys: [{ name: "iron", val: 100 }],
    sells: [
      {
        name: "catnip",
        value: 35000,
        chance: 1,
        seasons: { spring: 0.2, summer: -0.05, autumn: 0.15, winter: 0.45 },
      },
      { name: "parchment", value: 5, chance: 0.25, minLevel: 5 },
      { name: "manuscript", value: 3, chance: 0.15, minLevel: 10 },
      { name: "compedium", value: 1, chance: 0.1, minLevel: 15 },
    ],
  },
  {
    name: "griffins",
    standing: -0.15,
    hidden: false,
    embassyPrice: 1000,
    buys: [{ name: "wood", val: 500 }],
    sells: [
      {
        name: "iron",
        value: 250,
        chance: 1,
        seasons: { spring: -0.25, summer: -0.05, autumn: 0.35, winter: -0.2 },
      },
      { name: "steel", value: 25, chance: 0.25, minLevel: 5 },
      { name: "gear", value: 5, chance: 0.1, minLevel: 10 },
    ],
  },
  {
    name: "nagas",
    standing: 0,
    hidden: true,
    embassyPrice: 500,
    buys: [{ name: "ivory", val: 500 }],
    sells: [
      {
        name: "minerals",
        value: 1000,
        chance: 1,
        seasons: { spring: 0.25, summer: 0.05, autumn: -0.35, winter: -0.05 },
      },
      { name: "slab", value: 5, chance: 0.75, minLevel: 5 },
      { name: "concrate", value: 5, chance: 0.25, minLevel: 10 },
      { name: "megalith", value: 1, chance: 0.1, minLevel: 15 },
    ],
  },
  {
    name: "zebras",
    standing: -0.3,
    hidden: true,
    embassyPrice: 25000,
    buys: [{ name: "slab", val: 50 }],
    sells: [
      {
        name: "iron",
        value: 300,
        chance: 1,
        seasons: { spring: 0, summer: 0.15, autumn: -0.1, winter: -0.2 },
      },
      {
        name: "plate",
        value: 2,
        chance: 0.65,
        seasons: { spring: 0.05, summer: -0.15, autumn: 0.05, winter: 0.25 },
      },
      { name: "alloy", value: 0.25, chance: 0.05, minLevel: 5 },
    ],
  },
  {
    name: "spiders",
    standing: 0.15,
    hidden: true,
    embassyPrice: 5000,
    buys: [{ name: "scaffold", val: 50 }],
    sells: [
      {
        name: "coal",
        value: 350,
        chance: 1,
        seasons: { spring: 0, summer: 0.05, autumn: 0.15, winter: -0.05 },
      },
      { name: "oil", value: 100, chance: 0.25, minLevel: 5 },
    ],
  },
  {
    name: "dragons",
    standing: 0,
    hidden: true,
    embassyPrice: 7500,
    buys: [{ name: "titanium", val: 250 }],
    sells: [
      { name: "uranium", value: 1, chance: 0.95 },
      { name: "thorium", value: 1, chance: 0.5, minLevel: 5 },
    ],
  },
  {
    name: "leviathans",
    standing: 0,
    hidden: true,
    embassyPrice: 0, // No embassy
    buys: [{ name: "unobtainium", val: 5000 }],
    sells: [
      { name: "starchart", value: 250, chance: 0.5 },
      { name: "timeCrystal", value: 0.25, chance: 0.98 },
      { name: "sorrow", value: 1, chance: 0.15 },
      { name: "relic", value: 1, chance: 0.05 },
    ],
  },
];

// ── Constants ─────────────────────────────────────────────────────────────────

export const BASE_GOLD_COST = 15;
export const BASE_MANPOWER_COST = 50;

// ── Initial state ─────────────────────────────────────────────────────────────

export function createInitialDiplomacy(): DiplomacyState {
  const races: Record<string, RaceEntry> = {};
  for (const def of RACE_DEFS) {
    races[def.name] = { unlocked: false, embassyLevel: 0 };
  }
  return {
    races,
    baseGoldCost: BASE_GOLD_COST,
    baseManpowerCost: BASE_MANPOWER_COST,
  };
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Embassy cost for the next level.
 * Legacy: embassyPrices is a flat array with a single culture cost, but in practice
 * the cost scales with (embassyLevel + 1) * basePrice.
 * Simplified: cost = (embassyLevel + 1) * def.embassyPrice
 */
export function getEmbassyCost(def: RaceDef, level: number): number {
  return (level + 1) * def.embassyPrice;
}

/**
 * Get trade cost for one trade.
 * Returns { gold, manpower, buyResource, buyAmount }
 */
export function getTradeCost(
  def: RaceDef,
  state: DiplomacyState,
): { gold: number; manpower: number; buyName: string; buyVal: number } {
  const buy = def.buys[0];
  return {
    gold: state.baseGoldCost,
    manpower: state.baseManpowerCost,
    buyName: buy?.name ?? "",
    buyVal: buy?.val ?? 0,
  };
}

/**
 * Check if a sell entry is valid for the given embassy level.
 */
function isSellValid(sell: SellEntry, embassyLevel: number): boolean {
  return !sell.minLevel || embassyLevel >= sell.minLevel;
}

/**
 * Calculate deterministic trade yield.
 * Uses chance as a threshold — items with chance=1 are always received,
 * items with chance<1 and embassyLevel >= minLevel receive base amount * chance.
 *
 * Note: This is a simplified deterministic model. The legacy system uses binomial
 * RNG which requires entropy from the server layer (Epic 17+).
 */
export function calculateTradeYield(
  def: RaceDef,
  embassyLevel: number,
  tradeRatio: number,
  seasonName: string,
): Record<string, number> {
  const result: Record<string, number> = {};
  const multiplier = 1 + tradeRatio;

  for (const sell of def.sells) {
    if (!isSellValid(sell, embassyLevel)) continue;

    const seasonMod = sell.seasons ? (sell.seasons[seasonName] ?? 0) : 0;
    const seasonMultiplier = 1 + seasonMod;
    // Deterministic: include if chance >= 0.5 (majority chance), scale by chance
    const amount = sell.value * sell.chance * multiplier * seasonMultiplier;
    if (amount > 0) {
      result[sell.name] = (result[sell.name] ?? 0) + amount;
    }
  }

  return result;
}

// ── SEASON helpers (matches calendar seasons) ─────────────────────────────────

const SEASON_NAMES = ["spring", "summer", "autumn", "winter"] as const;

function getSeasonName(seasonIndex: number): string {
  return SEASON_NAMES[seasonIndex % 4] ?? "spring";
}

// ── Action: SEND_EMBASSY ──────────────────────────────────────────────────────

export function applySendEmbassy(state: GameState, raceName: string): GameState {
  const def = RACE_DEFS.find((r) => r.name === raceName);
  if (!def) return state;

  const race = state.diplomacy.races[raceName];
  if (!race?.unlocked) return state;

  if (def.embassyPrice === 0) return state; // leviathans have no embassy

  const cost = getEmbassyCost(def, race.embassyLevel);
  const culture = state.resources.culture;
  if (!culture || culture.value < cost) return state;

  return produce(state, (draft) => {
    const c = draft.resources.culture;
    if (c) c.value -= cost;
    const r = draft.diplomacy.races[raceName];
    if (r) r.embassyLevel += 1;
  });
}

// ── Action: TRADE ─────────────────────────────────────────────────────────────

export function applyTrade(state: GameState, raceName: string): GameState {
  const def = RACE_DEFS.find((r) => r.name === raceName);
  if (!def) return state;

  const race = state.diplomacy.races[raceName];
  if (!race?.unlocked) return state;

  const cost = getTradeCost(def, state.diplomacy);
  const gold = state.resources.gold;
  const manpower = state.resources.manpower;
  const buyRes = state.resources[cost.buyName];

  if (!gold || gold.value < cost.gold) return state;
  if (!manpower || manpower.value < cost.manpower) return state;
  if (!buyRes || buyRes.value < cost.buyVal) return state;

  const tradeRatio = state.effectCache.tradeRatio ?? 0;
  const seasonName = getSeasonName(state.calendar.season);

  const yield_ = calculateTradeYield(def, race.embassyLevel, tradeRatio, seasonName);

  return produce(state, (draft) => {
    // Deduct costs
    const g = draft.resources.gold;
    if (g) g.value -= cost.gold;
    const m = draft.resources.manpower;
    if (m) m.value -= cost.manpower;
    const b = draft.resources[cost.buyName];
    if (b) b.value -= cost.buyVal;

    // Add trade yield (capped at maxValue)
    for (const [resName, amount] of Object.entries(yield_)) {
      const res = draft.resources[resName];
      if (res) {
        res.value = Math.min(res.value + amount, res.maxValue);
      }
    }
  });
}

// ── DiplomacyManager ──────────────────────────────────────────────────────────

export class DiplomacyManager implements Manager {
  readonly sectionKey = "diplomacy";

  update(state: GameState): GameState {
    return produce(state, (draft) => {
      // Unlock nagas when culture >= 1500
      const nagasEntry = draft.diplomacy.races.nagas;
      if (nagasEntry && !nagasEntry.unlocked) {
        const culture = draft.resources.culture;
        if (culture && culture.value >= 1500) {
          nagasEntry.unlocked = true;
        }
      }

      // Unlock zebras when ship >= 1
      const zebrasEntry = draft.diplomacy.races.zebras;
      if (zebrasEntry && !zebrasEntry.unlocked) {
        const ship = draft.resources.ship;
        if (ship && ship.value >= 1) {
          zebrasEntry.unlocked = true;
        }
      }

      // Unlock spiders when ship >= 100 and scienceMax > 125000
      const spidersEntry = draft.diplomacy.races.spiders;
      if (spidersEntry && !spidersEntry.unlocked) {
        const ship = draft.resources.ship;
        const scienceMax = draft.effectCache.scienceMax ?? 0;
        if (ship && ship.value >= 100 && scienceMax > 125000) {
          spidersEntry.unlocked = true;
        }
      }

      // Unlock dragons when nuclearFission is researched
      const dragonsEntry = draft.diplomacy.races.dragons;
      if (dragonsEntry && !dragonsEntry.unlocked) {
        const nuclearFission = draft.science.techs.nuclearFission;
        if (nuclearFission?.researched) {
          dragonsEntry.unlocked = true;
        }
      }
    });
  }

  updateEffects(_state: GameState): Record<string, number> {
    // Diplomacy has no direct effectCache contributions (tradepost building handles tradeRatio)
    return {};
  }

  resetState(state: GameState): GameState {
    return produce(state, (draft) => {
      draft.diplomacy = createInitialDiplomacy();
    });
  }

  save(state: GameState): Serializable {
    const races: Record<string, { unlocked: boolean; embassyLevel: number }> = {};
    for (const [name, entry] of Object.entries(state.diplomacy.races)) {
      races[name] = { unlocked: entry.unlocked, embassyLevel: entry.embassyLevel };
    }
    return {
      races,
      baseGoldCost: state.diplomacy.baseGoldCost,
      baseManpowerCost: state.diplomacy.baseManpowerCost,
    };
  }

  load(saved: Serializable, state: GameState): GameState {
    const data = saved as {
      races?: Record<string, { unlocked?: boolean; embassyLevel?: number }>;
      baseGoldCost?: number;
      baseManpowerCost?: number;
    };

    return produce(state, (draft) => {
      draft.diplomacy = createInitialDiplomacy();

      const savedRaces = data.races ?? {};
      for (const [name, entry] of Object.entries(savedRaces)) {
        const race = draft.diplomacy.races[name];
        if (race && entry && typeof entry === "object") {
          if (typeof entry.unlocked === "boolean") race.unlocked = entry.unlocked;
          if (typeof entry.embassyLevel === "number") race.embassyLevel = entry.embassyLevel;
        }
      }

      if (typeof data.baseGoldCost === "number") {
        draft.diplomacy.baseGoldCost = data.baseGoldCost;
      }
      if (typeof data.baseManpowerCost === "number") {
        draft.diplomacy.baseManpowerCost = data.baseManpowerCost;
      }
    });
  }
}
