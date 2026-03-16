import type { Tick } from "@kittens/shared";
import { type ResourceState, createInitialResources } from "./resources.js";

/**
 * Root game state — the single serializable snapshot of a game.
 * This is the entire truth; nothing else is authoritative.
 */
export interface GameState {
  readonly version: number;
  readonly tick: Tick;
  /** Flat map of all active effects, rebuilt each tick by the effect system. */
  readonly effectCache: Record<string, number>;
  /** All resource pools (value + maxValue). */
  readonly resources: ResourceState;
}

export function createInitialState(): GameState {
  return {
    version: 1,
    tick: 0 as Tick,
    effectCache: {},
    resources: createInitialResources(),
  };
}

// ── Serialization ─────────────────────────────────────────────────────────────

/** Serialized form of GameState — safe for JSON.stringify */
export interface SerializedGameState {
  version: number;
  tick: number;
  effectCache: Record<string, number>;
  resources: Record<string, { value: number; maxValue: number }>;
}

/**
 * Serialize GameState to a plain object with no class instances.
 * Port of legacy `game.save()` in game.js:2393.
 */
export function serialize(state: GameState): SerializedGameState {
  const resources: Record<string, { value: number; maxValue: number }> = {};
  for (const [name, entry] of Object.entries(state.resources)) {
    resources[name] = { value: entry.value, maxValue: entry.maxValue };
  }
  return {
    version: state.version,
    tick: state.tick,
    effectCache: { ...state.effectCache },
    resources,
  };
}

/**
 * Restore GameState from a serialized snapshot.
 * Unknown fields are ignored (forward compatibility).
 * Port of legacy `game.load()` in game.js:2529.
 */
export function deserialize(data: SerializedGameState): GameState {
  const savedResources = data.resources ?? {};
  const resources: Record<string, { value: number; maxValue: number }> = {
    ...createInitialResources(),
  };
  for (const [name, entry] of Object.entries(savedResources)) {
    if (entry && typeof entry.value === "number" && typeof entry.maxValue === "number") {
      resources[name] = { value: entry.value, maxValue: entry.maxValue };
    }
  }

  return {
    version: data.version,
    tick: data.tick as Tick,
    effectCache: data.effectCache ?? {},
    resources,
  };
}
