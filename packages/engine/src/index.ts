// @kittens/engine — pure game logic, zero I/O
// Invariant: (state, action) => newState

export type { GameState, SerializedGameState } from "./state.js";
export { createInitialState, serialize, deserialize } from "./state.js";
export type { GameAction } from "./actions.js";
export { applyAction } from "./actions.js";
export type { Manager } from "./manager.js";
export { NullManager } from "./manager.js";
export { getLimitedDR, buildEffectCache, getEffect } from "./effects.js";
export { tick, resetState } from "./tick.js";
