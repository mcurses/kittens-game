// @kittens/engine — pure game logic, zero I/O
// Invariant: (state, action) => newState

export type { GameState } from "./state.js";
export type { GameAction } from "./actions.js";
export { applyAction } from "./actions.js";
