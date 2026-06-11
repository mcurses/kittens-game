// Shared client-side utilities for extracting typed data from duck-typed GameStateResponse

import type { GameStateResponse } from "@kittens/api-spec";

export interface ResourceMap {
  [key: string]: { value: number; maxValue?: number; perTick?: number };
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
        maxValue: typeof entry.maxValue === "number" ? entry.maxValue : undefined,
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

/**
 * Format a duration in seconds to a human-readable string.
 */
export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0s";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) {
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    return s > 0 ? `${m}m ${s}s` : `${m}m`;
  }
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

/**
 * Match legacy resPool.isStorageLimited() for the common priced-action case:
 * if the player does not already have enough and the price exceeds current cap,
 * the action is "maxed out" rather than merely unaffordable.
 */
export function isStorageLimited(
  prices: readonly { name: string; val: number }[],
  resources: ResourceMap,
): boolean {
  return prices.some((p) => {
    const resource = resources[p.name];
    const value = resource?.value ?? 0;
    const maxValue = resource?.maxValue ?? 0;
    if (p.val === Number.POSITIVE_INFINITY) return true;
    return maxValue > 0 && p.val > maxValue && p.val > value;
  });
}
