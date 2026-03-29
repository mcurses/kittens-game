import type { Serializable } from "@kittens/shared";
import type { Manager } from "./manager.js";
import type { GameState } from "./state.js";

// ── Resource names ────────────────────────────────────────────────────────────

/**
 * All known resource names from legacy resourceData array.
 * Port of `legacy/js/resources.js` — resourceData[*].name
 */
export const RESOURCE_NAMES = [
  // Common — raw
  "catnip",
  "wood",
  "minerals",
  "coal",
  "iron",
  "titanium",
  "gold",
  "oil",
  "uranium",
  "unobtainium",
  // Common — transient
  "antimatter",
  "manpower",
  "science",
  "culture",
  "faith",
  "kittens",
  "zebras",
  "starchart",
  "temporalFlux",
  "gflops",
  "hashrates",
  // Luxury
  "furs",
  "ivory",
  "spice",
  "unicorns",
  "alicorn",
  "necrocorn",
  "tears",
  "karma",
  "paragon",
  "burnedParagon",
  "timeCrystal",
  "sorrow",
  "relic",
  "void",
  "elderBox",
  "wrappingPaper",
  "blackcoin",
  "bloodstone",
  "tMythril",
  // Craft
  "beam",
  "slab",
  "plate",
  "steel",
  "concrate",
  "gear",
  "alloy",
  "eludium",
  "scaffold",
  "ship",
  "tanker",
  "kerosene",
  "parchment",
  "manuscript",
  "compedium",
  "blueprint",
] as const;

// ── Types ─────────────────────────────────────────────────────────────────────

/** A single resource pool entry. */
export interface ResourceEntry {
  readonly value: number;
  readonly maxValue: number;
}

/** Flat map of all resource pools, keyed by resource name. */
export type ResourceState = Record<string, ResourceEntry>;

// ── Factory ───────────────────────────────────────────────────────────────────

/**
 * Return a fresh ResourceState with all resources at 0.
 * Port of legacy `resPool.resetState()`.
 */
export function createInitialResources(): ResourceState {
  const state: ResourceState = {};
  for (const name of RESOURCE_NAMES) {
    state[name] = { value: 0, maxValue: 0 };
  }
  return state;
}

// ── Per-tick formula ──────────────────────────────────────────────────────────

/**
 * Calculate the per-tick delta for a single resource from the effect cache.
 *
 * Formula (simplified from legacy `calcResourcePerTick` in game.js:~3174):
 *   perTick = effectCache[name + 'PerTickBase'] * (1 + effectCache[name + 'Ratio'])
 *           + effectCache[name + 'PerTick']
 *           + effectCache[name + 'PerTickCon']
 *
 * Note: PerTickCon values are negative (consumption).
 * Note: Job production is added to PerTickBase (so it IS scaled by Ratio),
 *       matching the actual legacy behavior where jobs are multiplied by aqueduct ratio.
 */
export function calcResourcePerTick(effectCache: Record<string, number>, name: string): number {
  const base = effectCache[`${name}PerTickBase`] ?? 0;
  const ratio = effectCache[`${name}Ratio`] ?? 0;
  const direct = effectCache[`${name}PerTick`] ?? 0;
  const con = effectCache[`${name}PerTickCon`] ?? 0;

  return base * (1 + ratio) + direct + con;
}

// ── ResourceManager ───────────────────────────────────────────────────────────

/**
 * Manages resource values: applies per-tick production/consumption,
 * enforces min/max bounds, and updates maxValue from the effect cache.
 *
 * Port of legacy `resPool.update()` in resources.js.
 */
export class ResourceManager implements Manager {
  readonly sectionKey = "resources";

  update(state: GameState): GameState {
    const newResources: ResourceState = {};

    for (const name of RESOURCE_NAMES) {
      const entry = state.resources[name] ?? { value: 0, maxValue: 0 };
      // maxValue comes from effectCache[nameMax] when set; otherwise use stored maxValue
      const effectMaxValue = state.effectCache[`${name}Max`];
      const maxValue = effectMaxValue !== undefined ? effectMaxValue : entry.maxValue;
      const perTick = calcResourcePerTick(state.effectCache, name);

      let newValue = entry.value + perTick;
      if (newValue < 0) newValue = 0;

      // Match legacy addRes: maxValue === 0 means uncapped; otherwise clamp to maxValue.
      if (maxValue > 0 && newValue > maxValue) newValue = maxValue;

      newResources[name] = { value: newValue, maxValue };
    }

    return { ...state, resources: newResources };
  }

  updateEffects(_state: GameState): Record<string, number> {
    // Resources do not contribute to the effect cache directly.
    // Production effects come from buildings/village managers.
    return {};
  }

  save(state: GameState): Serializable {
    return state.resources as unknown as Serializable;
  }

  load(saved: Serializable, state: GameState): GameState {
    if (!saved || typeof saved !== "object" || Array.isArray(saved)) {
      return { ...state, resources: createInitialResources() };
    }
    const raw = saved as Record<string, unknown>;
    const resources: ResourceState = { ...createInitialResources() };

    for (const name of RESOURCE_NAMES) {
      const entry = raw[name];
      if (
        entry &&
        typeof entry === "object" &&
        !Array.isArray(entry) &&
        typeof (entry as Record<string, unknown>).value === "number" &&
        typeof (entry as Record<string, unknown>).maxValue === "number"
      ) {
        resources[name] = {
          value: (entry as Record<string, unknown>).value as number,
          maxValue: (entry as Record<string, unknown>).maxValue as number,
        };
      }
    }

    return { ...state, resources };
  }

  resetState(state: GameState): GameState {
    return { ...state, resources: createInitialResources() };
  }
}
