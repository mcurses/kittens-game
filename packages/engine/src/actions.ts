import type { Tick } from "@kittens/shared";
import type { GameState } from "./state.js";

/** Discriminated union of all possible game actions */
export type GameAction = { readonly type: "TICK" };

/**
 * Pure reducer: apply an action to a state and return the next state.
 * Never mutates the input state.
 */
export function applyAction(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "TICK":
      return { ...state, tick: (state.tick + 1) as Tick };
  }
}
