import type { Tick } from "@kittens/shared";

/**
 * Root game state — the single serializable snapshot of a game.
 * This is the entire truth; nothing else is authoritative.
 */
export interface GameState {
  readonly version: number;
  readonly tick: Tick;
  /** Flat map of all active effects, rebuilt each tick by the effect system. */
  readonly effectCache: Record<string, number>;
}

export function createInitialState(): GameState {
  return {
    version: 1,
    tick: 0 as Tick,
    effectCache: {},
  };
}

// ── Serialization ─────────────────────────────────────────────────────────────

/** Serialized form of GameState — safe for JSON.stringify */
export interface SerializedGameState {
  version: number;
  tick: number;
  effectCache: Record<string, number>;
}

/**
 * Serialize GameState to a plain object with no class instances.
 * Port of legacy `game.save()` in game.js:2393.
 */
export function serialize(state: GameState): SerializedGameState {
  return {
    version: state.version,
    tick: state.tick,
    effectCache: { ...state.effectCache },
  };
}

/**
 * Restore GameState from a serialized snapshot.
 * Unknown fields are ignored (forward compatibility).
 * Port of legacy `game.load()` in game.js:2529.
 */
export function deserialize(data: SerializedGameState): GameState {
  return {
    version: data.version,
    tick: data.tick as Tick,
    effectCache: data.effectCache ?? {},
  };
}
