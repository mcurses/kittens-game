// Shared client-side utilities for extracting typed data from duck-typed GameStateResponse

import type { GameStateResponse } from "@kittens/api-spec";

export interface ResourceMap {
  [key: string]: { value: number; perTick?: number };
}

/**
 * Extract resources from state into a typed map.
 * Shared across all panels that need to check affordability.
 */
export function extractResources(state: GameStateResponse): ResourceMap {
  const raw = state as unknown as Record<string, unknown>;
  const resources = raw.resources;
  if (typeof resources !== "object" || resources === null) return {};
  const result: ResourceMap = {};
  for (const [k, v] of Object.entries(resources as Record<string, unknown>)) {
    if (
      typeof v === "object" &&
      v !== null &&
      typeof (v as Record<string, unknown>).value === "number"
    ) {
      const entry = v as Record<string, unknown>;
      result[k] = {
        value: entry.value as number,
        perTick: typeof entry.perTick === "number" ? entry.perTick : undefined,
      };
    }
  }
  return result;
}

/**
 * Extract the effectCache from state (plain number record).
 */
export function extractEffectCache(state: GameStateResponse): Record<string, number> {
  const raw = state as unknown as Record<string, unknown>;
  const cache = raw.effectCache;
  if (typeof cache !== "object" || cache === null) return {};
  const result: Record<string, number> = {};
  for (const [k, v] of Object.entries(cache as Record<string, unknown>)) {
    if (typeof v === "number") result[k] = v;
  }
  return result;
}

/**
 * Check whether the given resource map can afford all prices.
 */
export function canAfford(
  prices: readonly { name: string; val: number }[],
  resources: ResourceMap,
): boolean {
  return prices.every((p) => (resources[p.name]?.value ?? 0) >= p.val);
}
