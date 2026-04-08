import type { Manager } from "./manager.js";
import type { GameState } from "./state.js";

/**
 * Names of effects subject to Limited Diminishing Returns.
 * Matches legacy `_hasLimitedDiminishingReturn()` in game.js.
 */
const LIMITED_DR_EFFECTS = new Set([
  "catnipDemandRatio",
  "fursDemandRatio",
  "ivoryDemandRatio",
  "spiceDemandRatio",
  "unhappinessRatio",
]);

/**
 * Hyperbolic diminishing returns function.
 *
 * Port of legacy `getLimitedDR(effect, limit)` in game.js:2269.
 * - First 75% of `limit` is undiminished.
 * - The remaining portion asymptotically approaches 25% of `limit`.
 * - Sign of the input is preserved.
 */
export function getLimitedDR(effect: number, limit: number): number {
  if (effect === 0) return 0;

  const absEffect = Math.abs(effect);
  const maxUndiminished = 0.75 * limit;

  if (absEffect <= maxUndiminished) {
    return effect;
  }

  const diminishedPortion = absEffect - maxUndiminished;
  const delta = 0.25 * limit;
  const diminishedEffect = (1 - delta / (diminishedPortion + delta)) * delta;
  const totalEffect = maxUndiminished + diminishedEffect;

  return effect < 0 ? -totalEffect : totalEffect;
}

/**
 * Aggregate effect contributions from all managers into a flat cache.
 * Effects subject to limited DR are capped before being stored.
 *
 * Port of legacy `updateCaches()` + `updateEffectCached()` in game.js:2248 / core.js:125.
 */
export function buildEffectCache(
  managers: readonly Manager[],
  state: GameState,
): Record<string, number> {
  const raw: Record<string, number> = {};

  for (const manager of managers) {
    const effects = manager.updateEffects(state);
    for (const [name, value] of Object.entries(effects)) {
      raw[name] = (raw[name] ?? 0) + value;
    }
  }

  // Apply limited DR to qualifying effects
  const cache: Record<string, number> = {};
  for (const [name, value] of Object.entries(raw)) {
    cache[name] = LIMITED_DR_EFFECTS.has(name) ? getLimitedDR(value, 1) : value;
  }

  // Carry forward imported metadata keys (underscore-prefixed) from the current state
  for (const [name, value] of Object.entries(state.effectCache)) {
    if (name.startsWith("_") && !(name in cache)) {
      cache[name] = value;
    }
  }

  return cache;
}

/**
 * Look up a single effect from the cache. Returns 0 if not present.
 * Port of legacy `getEffect(name)` in game.js:2244.
 */
export function getEffect(cache: Record<string, number>, name: string): number {
  return cache[name] ?? 0;
}
