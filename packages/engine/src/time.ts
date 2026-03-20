import type { Serializable } from "@kittens/shared";
import { produce } from "immer";
import { DAYS_PER_SEASON, SEASONS_PER_YEAR, TICKS_PER_DAY } from "./calendar.js";
import type { Manager } from "./manager.js";
import { RESOURCE_NAMES, calcResourcePerTick } from "./resources.js";
import type { ResourceState } from "./resources.js";
import type { GameState } from "./state.js";

/** Number of ticks in one full in-game year */
const TICKS_PER_YEAR = TICKS_PER_DAY * DAYS_PER_SEASON * SEASONS_PER_YEAR;

// ── Types ──────────────────────────────────────────────────────────────────────

export interface PriceEntry {
  readonly name: string;
  readonly val: number;
}

/** Static definition for a Chronoforge upgrade (CFU) */
export interface CfuDef {
  readonly name: string;
  readonly prices: readonly PriceEntry[];
  readonly priceRatio: number;
  /** Static base effects (per unit `on`) */
  readonly effects: Readonly<Record<string, number>>;
  readonly unlocked: boolean;
  /** Whether this CFU has a `heat` field (blastFurnace only) */
  readonly hasHeat?: boolean;
  /** Other CFU names this unlocks when val > 0 */
  readonly unlocksCfu?: readonly string[];
}

/** Static definition for a Voidspace upgrade (VSU) */
export interface VsuDef {
  readonly name: string;
  readonly prices: readonly PriceEntry[];
  readonly priceRatio: number;
  /** Static base effects (per unit `on`) */
  readonly effects: Readonly<Record<string, number>>;
  readonly unlocked: boolean;
}

/** Runtime state for a single CFU */
export interface CfuEntry {
  readonly val: number;
  readonly on: number;
  readonly unlocked: boolean;
  /** Heat accumulated in the blastFurnace; 0 for other CFUs */
  readonly heat: number;
}

/** Runtime state for a single VSU */
export interface VsuEntry {
  readonly val: number;
  readonly on: number;
  readonly unlocked: boolean;
}

/** Time subsystem state */
export interface TimeState {
  readonly cfus: Record<string, CfuEntry>;
  readonly vsus: Record<string, VsuEntry>;
  /** Global heat pool (transfers to blastFurnace each tick) */
  readonly heat: number;
  /** Flux: years skipped by CF time jumps */
  readonly flux: number;
  /** Whether temporal acceleration is active (drains temporalFlux) */
  readonly isAccelerated: boolean;
}

// ── Static Definitions ────────────────────────────────────────────────────────

export const CFU_DEFS: readonly CfuDef[] = [
  {
    name: "temporalBattery",
    prices: [{ name: "timeCrystal", val: 5 }],
    priceRatio: 1.25,
    effects: { temporalFluxMax: 750 },
    unlocked: true,
  },
  {
    name: "blastFurnace",
    prices: [
      { name: "timeCrystal", val: 25 },
      { name: "relic", val: 5 },
    ],
    priceRatio: 1.25,
    effects: { heatPerTick: 0.02, heatMax: 100 },
    unlocked: true,
    hasHeat: true,
    unlocksCfu: ["timeBoiler"],
  },
  {
    name: "timeBoiler",
    prices: [{ name: "timeCrystal", val: 25000 }],
    priceRatio: 1.25,
    effects: { heatMaxExpansion: 10, energyConsumption: 1 },
    unlocked: false,
  },
  {
    name: "controlledDelay",
    prices: [
      { name: "timeCrystal", val: 1 },
      { name: "gear", val: 10 },
    ],
    priceRatio: 1,
    effects: { energyConsumption: 0.75 },
    unlocked: false,
  },
  {
    name: "temporalAccelerator",
    prices: [
      { name: "timeCrystal", val: 10 },
      { name: "relic", val: 1000 },
    ],
    priceRatio: 1.25,
    effects: { timeRatio: 0.05 },
    unlocked: true,
    unlocksCfu: ["temporalImpedance"],
  },
  {
    name: "temporalImpedance",
    prices: [
      { name: "timeCrystal", val: 100 },
      { name: "relic", val: 250 },
    ],
    priceRatio: 1.05,
    effects: { timeImpedance: 1000 },
    unlocked: false,
  },
  {
    name: "ressourceRetrieval",
    prices: [{ name: "timeCrystal", val: 1000 }],
    priceRatio: 1.3,
    effects: { shatterTCGain: 0.01 },
    unlocked: false,
  },
  {
    name: "temporalPress",
    prices: [
      { name: "timeCrystal", val: 100 },
      { name: "void", val: 10 },
    ],
    priceRatio: 1.1,
    effects: { shatterYearBoost: 0, energyConsumption: 5 },
    unlocked: false,
  },
];

export const VSU_DEFS: readonly VsuDef[] = [
  {
    name: "cryochambers",
    prices: [
      { name: "karma", val: 1 },
      { name: "timeCrystal", val: 2 },
      { name: "void", val: 100 },
    ],
    priceRatio: 1.25,
    effects: { maxKittens: 1 },
    unlocked: false,
  },
  {
    name: "usedCryochambers",
    prices: [],
    priceRatio: 1.25,
    effects: {},
    unlocked: false,
  },
  {
    name: "voidHoover",
    prices: [
      { name: "antimatter", val: 1000 },
      { name: "timeCrystal", val: 10 },
      { name: "void", val: 250 },
    ],
    priceRatio: 1.25,
    effects: { temporalParadoxVoid: 1 },
    unlocked: false,
  },
  {
    name: "voidRift",
    prices: [{ name: "void", val: 75 }],
    priceRatio: 1.3,
    effects: { umbraBoostRatio: 0.1, globalResourceRatio: 0.02 },
    unlocked: false,
  },
  {
    name: "chronocontrol",
    prices: [
      { name: "temporalFlux", val: 3000 },
      { name: "timeCrystal", val: 30 },
      { name: "void", val: 500 },
    ],
    priceRatio: 1.25,
    effects: { temporalParadoxDay: 0, energyConsumption: 15 },
    unlocked: false,
  },
  {
    name: "voidResonator",
    prices: [
      { name: "timeCrystal", val: 1000 },
      { name: "relic", val: 10000 },
      { name: "void", val: 50 },
    ],
    priceRatio: 1.25,
    effects: { voidResonance: 0.1 },
    unlocked: false,
  },
];

// ── Initial state ─────────────────────────────────────────────────────────────

export function createInitialTime(): TimeState {
  const cfus: Record<string, CfuEntry> = {};
  for (const def of CFU_DEFS) {
    cfus[def.name] = {
      val: 0,
      on: 0,
      unlocked: def.unlocked,
      heat: 0,
    };
  }

  const vsus: Record<string, VsuEntry> = {};
  for (const def of VSU_DEFS) {
    vsus[def.name] = {
      val: 0,
      on: 0,
      unlocked: def.unlocked,
    };
  }

  return { cfus, vsus, heat: 0, flux: 0, isAccelerated: false };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function canAfford(prices: readonly PriceEntry[], resources: ResourceState): boolean {
  for (const price of prices) {
    const entry = resources[price.name];
    if (!entry || entry.value < price.val) return false;
  }
  return true;
}

export function getCfuPrice(def: CfuDef, count: number): readonly PriceEntry[] {
  return def.prices.map((p) => ({
    name: p.name,
    val: p.val * Math.pow(def.priceRatio, count),
  }));
}

export function getVsuPrice(def: VsuDef, count: number): readonly PriceEntry[] {
  return def.prices.map((p) => ({
    name: p.name,
    val: p.val * Math.pow(def.priceRatio, count),
  }));
}

// ── Action: BUY_CFU ──────────────────────────────────────────────────────────

export function applyBuyCfu(state: GameState, name: string): GameState {
  const def = CFU_DEFS.find((d) => d.name === name);
  if (!def) return state;

  const entry = state.time.cfus[name];
  if (!entry || !entry.unlocked) return state;

  const prices = getCfuPrice(def, entry.val);
  if (!canAfford(prices, state.resources)) return state;

  return produce(state, (draft) => {
    // Deduct resources
    for (const price of prices) {
      const res = draft.resources[price.name];
      if (res) res.value -= price.val;
    }

    // Increment val and on
    const cfu = draft.time.cfus[name];
    if (cfu) {
      cfu.val += 1;
      cfu.on += 1;
    }

    // Propagate unlock chain
    for (const unlockName of def.unlocksCfu ?? []) {
      const target = draft.time.cfus[unlockName];
      if (target) target.unlocked = true;
    }
  });
}

// ── Action: BUY_VSU ──────────────────────────────────────────────────────────

export function applyBuyVsu(state: GameState, name: string): GameState {
  const def = VSU_DEFS.find((d) => d.name === name);
  if (!def) return state;

  const entry = state.time.vsus[name];
  if (!entry || !entry.unlocked) return state;

  const prices = getVsuPrice(def, entry.val);
  if (!canAfford(prices, state.resources)) return state;

  return produce(state, (draft) => {
    // Deduct resources
    for (const price of prices) {
      const res = draft.resources[price.name];
      if (res) res.value -= price.val;
    }

    // Increment val and on
    const vsu = draft.time.vsus[name];
    if (vsu) {
      vsu.val += 1;
      vsu.on += 1;
    }
  });
}

// ── Action: SHATTER_TC ────────────────────────────────────────────────────────

export function applyShatterTc(state: GameState): GameState {
  const blastFurnace = state.time.cfus.blastFurnace;
  if (!blastFurnace || blastFurnace.on < 1) return state;
  if (blastFurnace.heat < 100) return state;

  // shatterTCGain from effectCache (ressourceRetrieval provides 0.01 per unit)
  const shatterTCGain =
    (state.effectCache.shatterTCGain ?? 0) * (1 + (state.effectCache.rrRatio ?? 0));

  // Advance space routes
  const routeSpeed = state.effectCache.routeSpeed ?? 1;

  return produce(state, (draft) => {
    const bf = draft.time.cfus.blastFurnace;
    if (bf) {
      bf.heat -= 100;
    }

    // Advance space route travel (reduce routeDays for in-progress missions)
    const daysInYear = DAYS_PER_SEASON * SEASONS_PER_YEAR;
    for (const [, planet] of Object.entries(draft.space.planets)) {
      if (planet.unlocked && !planet.reached) {
        planet.routeDays = Math.max(0, planet.routeDays - daysInYear * routeSpeed);
        if (planet.routeDays <= 0) {
          planet.reached = true;
        }
      }
    }

    // ShatterTC resource production: each shatter = 1 year of per-tick production
    if (shatterTCGain > 0) {
      const ticksInYear = TICKS_PER_YEAR;

      // Snapshot maxValues before adding (cap applied to pre-shatter values, not new caps)
      const preShatMaxValues: Record<string, number> = {};
      for (const name of RESOURCE_NAMES) {
        const entry = state.resources[name];
        if (entry) {
          // Match legacy: use current value as floor for cap (resource can't lose from shatter)
          preShatMaxValues[name] = Math.max(entry.value, entry.maxValue > 0 ? entry.maxValue : Number.MAX_VALUE);
        }
      }

      for (const name of RESOURCE_NAMES) {
        const perTick = calcResourcePerTick(state.effectCache, name);
        if (perTick <= 0) continue;
        const gain = perTick * ticksInYear * shatterTCGain;
        if (gain <= 0) continue;

        const entry = draft.resources[name];
        if (entry) {
          const cap = preShatMaxValues[name] ?? Number.MAX_VALUE;
          entry.value = Math.min(entry.value + gain, cap);
        }
      }
    }

    // Advance calendar year by 1
    draft.calendar.year += 1;
    // Accumulate flux
    draft.time.flux += 1;
  });
}

// ── TimeManager ───────────────────────────────────────────────────────────────

/** Base effects contributed to effectCache regardless of upgrades (legacy time.effectsBase) */
const TIME_EFFECTS_BASE: Readonly<Record<string, number>> = {
  heatPerTick: 0.01,
  heatMax: 100,
  temporalFluxMax: 3000, // 60 * 10 * 5 = 3000 (10 minutes at 5 ticks/s)
};

export class TimeManager implements Manager {
  update(state: GameState): GameState {
    return produce(state, (draft) => {
      // Transfer heat from global pool to blastFurnace
      if (draft.time.heat > 0) {
        const baseHeatPerTick = state.effectCache.heatPerTick ?? TIME_EFFECTS_BASE.heatPerTick ?? 0.01;
        // Apply heatEfficiency multiplier (legacy: efficiency = 1 + heatEfficiency)
        const efficiency = 1 + (state.effectCache.heatEfficiency ?? 0);
        const effectiveHeatPerTick = baseHeatPerTick * efficiency;
        const transfer = Math.min(effectiveHeatPerTick, draft.time.heat);
        const bf = draft.time.cfus.blastFurnace;
        if (bf) {
          bf.heat += transfer;
        }
        draft.time.heat -= transfer;
        if (draft.time.heat < 0) draft.time.heat = 0;
      }

      // If heat reaches 0, isAccelerated becomes false
      if (draft.time.heat <= 0) {
        draft.time.isAccelerated = false;
      }
    });
  }

  updateEffects(state: GameState): Record<string, number> {
    // Start with base effects (always present)
    const effects: Record<string, number> = { ...TIME_EFFECTS_BASE };

    for (const def of CFU_DEFS) {
      const cfu = state.time.cfus[def.name];
      if (!cfu || cfu.on === 0) continue;

      for (const [key, baseVal] of Object.entries(def.effects)) {
        effects[key] = (effects[key] ?? 0) + baseVal * cfu.on;
      }
    }

    for (const def of VSU_DEFS) {
      const vsu = state.time.vsus[def.name];
      if (!vsu || vsu.on === 0) continue;

      for (const [key, baseVal] of Object.entries(def.effects)) {
        effects[key] = (effects[key] ?? 0) + baseVal * vsu.on;
      }
    }

    return effects;
  }

  resetState(state: GameState): GameState {
    return produce(state, (draft) => {
      draft.time = createInitialTime();
    });
  }

  save(state: GameState): Serializable {
    const cfus: Record<string, { val: number; on: number; unlocked: boolean; heat: number }> = {};
    for (const [name, entry] of Object.entries(state.time.cfus)) {
      cfus[name] = { val: entry.val, on: entry.on, unlocked: entry.unlocked, heat: entry.heat };
    }

    const vsus: Record<string, { val: number; on: number; unlocked: boolean }> = {};
    for (const [name, entry] of Object.entries(state.time.vsus)) {
      vsus[name] = { val: entry.val, on: entry.on, unlocked: entry.unlocked };
    }

    return {
      cfus,
      vsus,
      heat: state.time.heat,
      flux: state.time.flux,
      isAccelerated: state.time.isAccelerated,
    };
  }

  load(saved: Serializable, state: GameState): GameState {
    const data = saved as {
      cfus?: Record<string, { val?: number; on?: number; unlocked?: boolean; heat?: number }>;
      vsus?: Record<string, { val?: number; on?: number; unlocked?: boolean }>;
      heat?: number;
      flux?: number;
      isAccelerated?: boolean;
    };

    return produce(state, (draft) => {
      draft.time.heat = typeof data.heat === "number" ? data.heat : 0;
      draft.time.flux = typeof data.flux === "number" ? data.flux : 0;
      draft.time.isAccelerated = typeof data.isAccelerated === "boolean" ? data.isAccelerated : false;

      // Restore CFU values
      if (data.cfus) {
        for (const [name, saved_cfu] of Object.entries(data.cfus)) {
          const cfu = draft.time.cfus[name];
          if (!cfu) continue;
          if (typeof saved_cfu.val === "number") cfu.val = saved_cfu.val;
          if (typeof saved_cfu.on === "number") cfu.on = saved_cfu.on;
          if (typeof saved_cfu.unlocked === "boolean") cfu.unlocked = saved_cfu.unlocked;
          if (typeof saved_cfu.heat === "number") cfu.heat = saved_cfu.heat;
        }
      }

      // Replay unlock chains for any CFU with val > 0
      for (const def of CFU_DEFS) {
        const cfu = draft.time.cfus[def.name];
        if (cfu && cfu.val > 0) {
          for (const unlockName of def.unlocksCfu ?? []) {
            const target = draft.time.cfus[unlockName];
            if (target) target.unlocked = true;
          }
        }
      }

      // Restore VSU values
      if (data.vsus) {
        for (const [name, saved_vsu] of Object.entries(data.vsus)) {
          const vsu = draft.time.vsus[name];
          if (!vsu) continue;
          if (typeof saved_vsu.val === "number") vsu.val = saved_vsu.val;
          if (typeof saved_vsu.on === "number") vsu.on = saved_vsu.on;
          if (typeof saved_vsu.unlocked === "boolean") vsu.unlocked = saved_vsu.unlocked;
        }
      }
    });
  }
}
