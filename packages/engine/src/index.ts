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
export type { ResourceEntry, ResourceState } from "./resources.js";
export {
  RESOURCE_NAMES,
  ResourceManager,
  calcResourcePerTick,
  createInitialResources,
} from "./resources.js";
export type { BuildingDef, BuildingEntry, BuildingState, PriceEntry } from "./buildings.js";
export {
  BUILDING_DEFS,
  BuildingManager,
  canAfford,
  createInitialBuildings,
  getBuildingPrice,
} from "./buildings.js";
export type { JobDef, JobEntry, VillageState } from "./village.js";
export {
  JOB_DEFS,
  VillageManager,
  createInitialVillage,
  totalAssignedKittens,
} from "./village.js";
