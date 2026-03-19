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
export type { CalendarState, SeasonDef } from "./calendar.js";
export {
  TICKS_PER_DAY,
  DAYS_PER_SEASON,
  SEASONS_PER_YEAR,
  SEASON_DEFS,
  CalendarManager,
  createInitialCalendar,
} from "./calendar.js";
export type {
  ScienceState,
  TechDef,
  TechEntry,
  PolicyDef,
  PolicyEntry,
  TechUnlocks,
  PolicyUnlocks,
} from "./science.js";
export {
  TECH_DEFS,
  POLICY_DEFS,
  ScienceManager,
  createInitialScience,
  applyResearch,
  applyResearchPolicy,
} from "./science.js";
export type {
  WorkshopState,
  UpgradeDef,
  UpgradeEntry,
  UpgradeUnlocks,
  CraftDef,
  CraftEntry,
} from "./workshop.js";
export {
  UPGRADE_DEFS,
  CRAFT_DEFS,
  WorkshopManager,
  createInitialWorkshop,
  applyPurchaseUpgrade,
  applyCraft,
} from "./workshop.js";
export type {
  ReligionState,
  ZigguratUpgradeDef,
  ZigguratUpgradeEntry,
  ReligionUpgradeDef,
  ReligionUpgradeEntry,
  TranscendenceUpgradeDef,
  TranscendenceUpgradeEntry,
} from "./religion.js";
export {
  ZIGGURAT_UPGRADE_DEFS,
  RELIGION_UPGRADE_DEFS,
  TRANSCENDENCE_UPGRADE_DEFS,
  ReligionManager,
  createInitialReligion,
  applyBuyZigguratUpgrade,
  applyBuyReligionUpgrade,
  applyBuyTranscendenceUpgrade,
  applyPraise,
  applyAdore,
  applyTranscend,
  getApocryphaBonus,
  getTranscendNextPrice,
  getTranscendTotalPrice,
  getSolarRevolutionRatio,
} from "./religion.js";
