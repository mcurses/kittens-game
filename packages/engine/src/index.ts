// @kittens/engine — pure game logic, zero I/O
// Invariant: (state, action) => newState

export type { GameState, SerializedGameState } from "./state.js";
export { createInitialState, serialize, deserialize } from "./state.js";
export type { DerivedUiVisibility, UiMainTabId, UiTabVisibility } from "./ui-visibility.js";
export { deriveUiVisibility, getVillageTitle, getVisibleMainTabs } from "./ui-visibility.js";
export { migrateLegacySave } from "./legacy-migration.js";
export type { GameAction } from "./actions.js";
export { applyAction } from "./actions.js";
export type { Manager } from "./manager.js";
export { NullManager } from "./manager.js";
export { getLimitedDR, buildEffectCache, getEffect } from "./effects.js";
export { tick, resetState } from "./tick.js";
export type { ResourceDisplayMeta, ResourceEntry, ResourceState, ResourceType } from "./resources.js";
export {
  RESOURCE_DISPLAY,
  RESOURCE_NAMES,
  ResourceManager,
  calcResourcePerTick,
  createInitialResources,
  getResourceMaxValue,
  syncResourceCaps,
} from "./resources.js";
export type { BuildingDef, BuildingEntry, BuildingState, PriceEntry } from "./buildings.js";
export {
  BUILDING_DEFS,
  BuildingManager,
  STAGE_LABELS,
  canAfford,
  createInitialBuildings,
  getBuildingDisplayName,
  getBuildingPrice,
} from "./buildings.js";
export type { JobDef, JobEntry, Kitten, KittenTrait, VillageState } from "./village.js";
export {
  JOB_DEFS,
  VillageManager,
  computeHappiness,
  createInitialVillage,
  generateKitten,
  getLeaderBonus,
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
export type {
  ChallengeState,
  ChallengeDef,
  ChallengeEntry,
  StackOptions,
} from "./challenges.js";
export {
  CHALLENGE_DEFS,
  ChallengeManager,
  createInitialChallenges,
  applyStartChallenge,
  applyCompleteChallenge,
  getChallengeEffectValue,
  getCountCompletions,
  getCountUniqueCompletions,
  anyChallengeActive,
  applySoftResetChallenges,
} from "./challenges.js";
export type {
  DiplomacyState,
  RaceDef,
  RaceEntry,
  SellEntry,
  BuyEntry,
} from "./diplomacy.js";
export {
  RACE_DEFS,
  BASE_GOLD_COST,
  BASE_CATPOWER_COST,
  DiplomacyManager,
  createInitialDiplomacy,
  applySendEmbassy,
  applyTrade,
  getEmbassyCost,
  getTradeCost,
  calculateTradeYield,
} from "./diplomacy.js";
export type {
  SpaceState,
  ProgramDef,
  ProgramEntry,
  PlanetDef,
  PlanetEntry,
  SpaceBuildingDef,
  SpaceBuildingEntry,
} from "./space.js";
export {
  PROGRAM_DEFS,
  PLANET_DEFS,
  SPACE_BUILDING_DEFS,
  SpaceManager,
  createInitialSpace,
  applyLaunchMission,
  applyBuySpaceBuilding,
  getSpaceBuildingPrice,
} from "./space.js";
export type {
  TimeState,
  CfuDef,
  CfuEntry,
  VsuDef,
  VsuEntry,
} from "./time.js";
export {
  CFU_DEFS,
  VSU_DEFS,
  TimeManager,
  createInitialTime,
  applyBuyCfu,
  applyBuyVsu,
  applyShatterTc,
  getCfuPrice,
  getVsuPrice,
} from "./time.js";
export type { PrestigeState, PerkDef, PerkEntry, PerkUnlocks } from "./prestige.js";
export {
  PERK_DEFS,
  PrestigeManager,
  createInitialPrestige,
  applyPurchasePerk,
  applySoftReset,
  getParagonProductionRatio,
  getParagonStorageRatio,
} from "./prestige.js";
export type { ProductionSource } from "./attribution.js";
export { getResourceAttribution } from "./attribution.js";
export type {
  AchievementState,
  AchievementEntry,
  BadgeEntry,
  AchievementDef,
  BadgeDef,
} from "./achievements.js";
export {
  ACHIEVEMENT_DEFS,
  BADGE_DEFS,
  AchievementManager,
  createInitialAchievements,
} from "./achievements.js";
