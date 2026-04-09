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
  "catpower",
  "science",
  "culture",
  "faith",
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

// ── Resource display metadata ────────────────────────────────────────────────

export type ResourceType = "common" | "uncommon" | "rare" | "exotic";

export interface ResourceDisplayMeta {
  readonly type: ResourceType;
  /** Optional custom display color (CSS color string). Overrides type-based color. */
  readonly color?: string;
}

/**
 * Display metadata per resource, matching legacy resource definitions.
 * Ports `legacy/js/resources.js` type/color properties.
 */
export const RESOURCE_DISPLAY: Readonly<Record<string, ResourceDisplayMeta>> = {
  // Common — raw (no special color)
  catnip: { type: "common" },
  wood: { type: "common" },
  minerals: { type: "common" },
  coal: { type: "common" },
  iron: { type: "common" },
  titanium: { type: "common" },
  gold: { type: "common" },
  oil: { type: "common" },
  uranium: { type: "uncommon", color: "#4EA24E" },
  unobtainium: { type: "rare", color: "#A00000" },
  // Common — transient
  antimatter: { type: "exotic", color: "#5A0EDE" },
  catpower: { type: "common", color: "#DBA901" },
  science: { type: "common", color: "#01A9DB" },
  culture: { type: "common", color: "#DF01D7" },
  faith: { type: "common", color: "gray" },
  zebras: { type: "common" },
  starchart: { type: "common" },
  temporalFlux: { type: "common" },
  gflops: { type: "common" },
  hashrates: { type: "common" },
  // Luxury
  furs: { type: "uncommon" },
  ivory: { type: "uncommon" },
  spice: { type: "uncommon" },
  unicorns: { type: "rare" },
  alicorn: { type: "rare" },
  necrocorn: { type: "rare", color: "#9A2EFE" },
  tears: { type: "rare" },
  karma: { type: "common" },
  paragon: { type: "common" },
  burnedParagon: { type: "common" },
  timeCrystal: { type: "rare" },
  sorrow: { type: "rare" },
  relic: { type: "exotic" },
  void: { type: "exotic" },
  elderBox: { type: "exotic" },
  wrappingPaper: { type: "common" },
  blackcoin: { type: "exotic" },
  bloodstone: { type: "exotic" },
  tMythril: { type: "exotic" },
  // Craft
  beam: { type: "common" },
  slab: { type: "common" },
  plate: { type: "common" },
  steel: { type: "uncommon" },
  concrate: { type: "common" },
  gear: { type: "uncommon" },
  alloy: { type: "uncommon" },
  eludium: { type: "rare" },
  scaffold: { type: "common" },
  ship: { type: "common" },
  tanker: { type: "common" },
  kerosene: { type: "uncommon" },
  parchment: { type: "common" },
  manuscript: { type: "common" },
  compedium: { type: "common" },
  blueprint: { type: "uncommon" },
};

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
 *           + effectCache[name + 'PerTickProd']
 *           + effectCache[name + 'PerTickAutoprod']
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
  const prod = effectCache[`${name}PerTickProd`] ?? 0;
  const autoprod = effectCache[`${name}PerTickAutoprod`] ?? 0;
  const con = effectCache[`${name}PerTickCon`] ?? 0;

  return base * (1 + ratio) + direct + prod + autoprod + con;
}

/**
 * Legacy resource caps are recomputed from the current effect cache each update.
 * When no `${name}Max` effect is present, the resource is uncapped.
 */
export function getResourceMaxValue(effectCache: Record<string, number>, name: string): number {
  return effectCache[`${name}Max`] ?? 0;
}

/**
 * Recompute resource caps from the current effect cache without applying per-tick deltas.
 * Used after save/load so stale serialized maxValue fields do not survive when their
 * driving effect has disappeared.
 *
 * @param resources Current resource state
 * @param effectCache Effect cache for cap lookups
 * Legacy parity: over-cap values are always preserved. The cap is only enforced during
 * per-tick production (ResourceManager.update), not when rebuilding maxValue after actions.
 */
export function syncResourceCaps(
  resources: ResourceState,
  effectCache: Record<string, number>,
): ResourceState {
  const synced: ResourceState = {};

  for (const name of RESOURCE_NAMES) {
    const entry = resources[name] ?? { value: 0, maxValue: 0 };
    const maxValue = getResourceMaxValue(effectCache, name);
    // Never clamp existing value — legacy only prevents growth beyond cap, not shrinkage.
    synced[name] = { value: entry.value, maxValue };
  }

  return synced;
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
      const maxValue = getResourceMaxValue(state.effectCache, name);
      const perTick = calcResourcePerTick(state.effectCache, name);

      let newValue = entry.value + perTick;
      if (newValue < 0) newValue = 0;

      // Match legacy addRes: if already over-cap, allow to remain but don't grow further.
      // limit = max(prevValue, maxValue) ensures over-cap stocks can only decrease, not grow.
      if (maxValue > 0) {
        const limit = Math.max(entry.value, maxValue);
        if (newValue > limit) newValue = limit;
      }

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
