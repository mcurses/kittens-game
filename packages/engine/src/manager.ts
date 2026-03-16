import type { Serializable } from "@kittens/shared";
import type { GameState } from "./state.js";

/**
 * Every domain manager implements this interface.
 * Managers are pure: they receive state, return state. No side effects.
 */
export interface Manager {
  /** Advance this manager's domain by one tick. Returns the updated state. */
  update(state: GameState): GameState;

  /** Return this manager's contribution to the global effect cache for the given state. */
  updateEffects(state: GameState): Record<string, number>;

  /** Serialize this manager's slice of state into a plain object. */
  save(state: GameState): Serializable;

  /** Restore this manager's slice of state from a saved object. */
  load(saved: Serializable, state: GameState): GameState;

  /** Return a fresh reset of this manager's slice of state. */
  resetState(state: GameState): GameState;
}

/** No-op manager for testing and placeholder use */
export class NullManager implements Manager {
  update(state: GameState): GameState {
    return state;
  }

  updateEffects(_state: GameState): Record<string, number> {
    return {};
  }

  save(_state: GameState): Serializable {
    return null;
  }

  load(_saved: Serializable, state: GameState): GameState {
    return state;
  }

  resetState(state: GameState): GameState {
    return state;
  }
}
