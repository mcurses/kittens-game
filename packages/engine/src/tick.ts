import type { Tick } from "@kittens/shared";
import { buildEffectCache } from "./effects.js";
import type { Manager } from "./manager.js";
import { type GameState, createInitialState } from "./state.js";

/**
 * Advance the game by one tick.
 * Pure function: does not mutate the input state.
 *
 * Port of legacy `game.update()` → `updateModel()` in game.js:3891.
 * Manager update order matches legacy: managers are called in registration order.
 */
export function tick(state: GameState, managers: readonly Manager[]): GameState {
  // 1. Run each manager's update in order
  let next: GameState = { ...state, tick: (state.tick + 1) as Tick };
  for (const manager of managers) {
    next = manager.update(next);
  }

  // 2. Rebuild the effect cache from all managers
  const effectCache = buildEffectCache(managers, next);
  return { ...next, effectCache };
}

/**
 * Return a fresh initial game state, with all managers reset.
 * Port of legacy `game.resetState()` in game.js:2317.
 */
export function resetState(managers: readonly Manager[]): GameState {
  let state = createInitialState();
  for (const manager of managers) {
    state = manager.resetState(state);
  }
  return state;
}
