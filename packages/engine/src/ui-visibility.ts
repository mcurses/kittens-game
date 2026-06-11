import type { SerializedGameState } from "./state.js";
import { CRAFT_DEFS } from "./workshop.js";

export type UiMainTabId =
  | "buildings"
  | "jobs"
  | "science"
  | "workshop"
  | "religion"
  | "space"
  | "time"
  | "trade"
  | "achievements"
  | "stats"
  | "challenges";

export interface UiTabVisibility {
  readonly id: UiMainTabId;
  readonly label: string;
  readonly visible: boolean;
}

export interface UiJobVisibility {
  readonly visible: boolean;
}

export interface UiResourceVisibility {
  readonly visible: boolean;
}

export interface UiBuildingControlsVisibility {
  readonly controlMode: "none" | "count" | "binary";
  readonly toggleVisible: boolean;
  readonly automationVisible: boolean;
}

export interface DerivedUiVisibility {
  readonly tabs: Record<UiMainTabId, UiTabVisibility>;
  readonly buildings: Record<string, UiBuildingControlsVisibility>;
  readonly village: {
    readonly jobsVisible: boolean;
    readonly managementVisible: boolean;
    readonly censusVisible: boolean;
    readonly mapVisible: boolean;
    readonly festivalVisible: boolean;
  };
  readonly jobs: Record<string, UiJobVisibility>;
  readonly resources: Record<string, UiResourceVisibility>;
  readonly actions: {
    readonly huntVisible: boolean;
  };
  readonly time: {
    readonly shatterVisible: boolean;
  };
}

type SerializableStateLike = Partial<SerializedGameState> | null | undefined;

const MAIN_TAB_ORDER: readonly UiMainTabId[] = [
  "buildings",
  "jobs",
  "science",
  "workshop",
  "religion",
  "space",
  "time",
  "trade",
  "achievements",
  "stats",
  "challenges",
] as const;

const TAB_LABELS: Record<Exclude<UiMainTabId, "jobs">, string> = {
  buildings: "Buildings",
  science: "Science",
  workshop: "Workshop",
  religion: "Religion",
  space: "Space",
  time: "Time",
  trade: "Trade",
  achievements: "Achievements",
  stats: "Stats",
  challenges: "Challenges",
};

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
}

function getNumber(record: Record<string, unknown>, key: string): number {
  const value = record[key];
  return typeof value === "number" ? value : 0;
}

function getBoolean(record: Record<string, unknown>, key: string): boolean {
  return record[key] === true;
}

function isTechResearched(state: SerializableStateLike, name: string): boolean {
  const techs = asRecord(asRecord(asRecord(state).science).techs);
  return getBoolean(asRecord(techs[name]), "researched");
}

function isUpgradeResearched(state: SerializableStateLike, name: string): boolean {
  const upgrades = asRecord(asRecord(asRecord(state).workshop).upgrades);
  return getBoolean(asRecord(upgrades[name]), "researched");
}

function isPerkResearched(state: SerializableStateLike, name: string): boolean {
  const perks = asRecord(asRecord(asRecord(state).prestige).perks);
  return getBoolean(asRecord(perks[name]), "researched");
}

function isPerkReserved(state: SerializableStateLike, name: string): boolean {
  const perks = asRecord(asRecord(asRecord(state).prestige).perks);
  return getBoolean(asRecord(perks[name]), "reserve");
}

function isChallengeActive(state: SerializableStateLike, name: string): boolean {
  const challenges = asRecord(asRecord(asRecord(state).challenges).challenges);
  return getBoolean(asRecord(challenges[name]), "active");
}

function getBuildingOn(state: SerializableStateLike, name: string): number {
  const buildings = asRecord(asRecord(state).buildings);
  return getNumber(asRecord(buildings[name]), "on");
}

function getBuildingVal(state: SerializableStateLike, name: string): number {
  const buildings = asRecord(asRecord(state).buildings);
  return getNumber(asRecord(buildings[name]), "val");
}

function getResourceValue(state: SerializableStateLike, name: string): number {
  const resources = asRecord(asRecord(state).resources);
  return getNumber(asRecord(resources[name]), "value");
}

function isResourceUnlocked(state: SerializableStateLike, name: string): boolean {
  const resources = asRecord(asRecord(state).resources);
  const entry = asRecord(resources[name]);

  if (getBoolean(entry, "unlocked")) return true;
  if (getNumber(entry, "value") > 0) return true;

  switch (name) {
    case "catnip":
      return true;
    case "kittens": {
      const village = asRecord(asRecord(state).village);
      return (
        getNumber(village, "kittens") > 0 ||
        getNumber(village, "deadKittens") > 0 ||
        getVsuVal(state, "usedCryochambers") > 0
      );
    }
    case "zebras": {
      const races = asRecord(asRecord(asRecord(state).diplomacy).races);
      return getBoolean(asRecord(races.zebras), "unlocked");
    }
    default: {
      // Resource is visible once an unlocked craft produces it AND the player
      // has at least one unit of any input — mirrors the legacy reveal pacing
      // (wood appears after first catnip, beam after first wood, etc.).
      const crafts = asRecord(asRecord(asRecord(state).workshop).crafts);
      if (!getBoolean(asRecord(crafts[name]), "unlocked")) return false;
      const def = CRAFT_DEFS.find((d) => d.name === name);
      if (!def) return false;
      return def.prices.some((p) => getResourceValue(state, p.name) > 0);
    }
  }
}

function getRaceUnlocked(state: SerializableStateLike, name: string): boolean {
  const races = asRecord(asRecord(asRecord(state).diplomacy).races);
  return getBoolean(asRecord(races[name]), "unlocked");
}

function getAnyUnlockedAchievement(state: SerializableStateLike): boolean {
  const achievements = asRecord(asRecord(state).achievements).achievements;
  return Array.isArray(achievements)
    ? achievements.some((entry) => getBoolean(asRecord(entry), "unlocked"))
    : false;
}

function getVsuVal(state: SerializableStateLike, name: string): number {
  const vsus = asRecord(asRecord(asRecord(state).time).vsus);
  return getNumber(asRecord(vsus[name]), "val");
}

function getVillageKittens(state: SerializableStateLike): number {
  const village = asRecord(asRecord(state).village);
  return getNumber(village, "kittens");
}

function getVillageFreeKittens(state: SerializableStateLike): number {
  const village = asRecord(asRecord(state).village);
  const jobs = asRecord(village.jobs);
  let assigned = 0;
  for (const entry of Object.values(jobs)) {
    assigned += getNumber(asRecord(entry), "value");
  }
  return Math.max(0, getNumber(village, "kittens") - assigned);
}

export function getVillageTitle(kittens: number): string {
  if (kittens > 10000) return "Deities";
  if (kittens > 5000) return "Elders";
  if (kittens > 2000) return "Union";
  if (kittens > 1500) return "Council";
  if (kittens > 1200) return "Consortium";
  if (kittens > 1000) return "Civilisation";
  if (kittens > 900) return "Society";
  if (kittens > 800) return "Reich";
  if (kittens > 700) return "Federation";
  if (kittens > 600) return "Hegemony";
  if (kittens > 500) return "Dominion";
  if (kittens > 400) return "Imperium";
  if (kittens > 300) return "Empire";
  if (kittens > 250) return "Megalopolis";
  if (kittens > 200) return "Metropolis";
  if (kittens > 150) return "City";
  if (kittens > 100) return "Town";
  if (kittens > 50) return "Smalltown";
  if (kittens > 30) return "Settlement";
  if (kittens > 15) return "Village";
  if (kittens > 0) return "Small Village";
  return "Outpost";
}

function getVillageLabel(state: SerializableStateLike): string {
  const kittens = getVillageKittens(state);
  const freeKittens = getVillageFreeKittens(state);
  const base = getVillageTitle(kittens);
  return freeKittens > 0 ? `${base} (${freeKittens})` : base;
}

function getJobVisibility(state: SerializableStateLike): Record<string, UiJobVisibility> {
  const jobs: Record<string, UiJobVisibility> = {
    woodcutter: { visible: true },
    farmer: { visible: isTechResearched(state, "agriculture") },
    scholar: {
      visible: getBuildingOn(state, "library") > 0 || isUpgradeResearched(state, "astrophysicists"),
    },
    hunter: { visible: isTechResearched(state, "archery") },
    miner: { visible: isTechResearched(state, "mining") },
    priest: { visible: isTechResearched(state, "theology") && !isChallengeActive(state, "atheism") },
    geologist: { visible: isTechResearched(state, "archeology") },
    engineer: { visible: isTechResearched(state, "mechanization") },
  };

  const rawJobs = asRecord(asRecord(asRecord(state).village).jobs);
  for (const name of Object.keys(rawJobs)) {
    if (!(name in jobs)) jobs[name] = { visible: false };
  }

  return jobs;
}

function getResourceVisibility(state: SerializableStateLike): Record<string, UiResourceVisibility> {
  const resources = asRecord(asRecord(state).resources);
  const result: Record<string, UiResourceVisibility> = {};

  for (const [name, rawEntry] of Object.entries(resources)) {
    const entry = asRecord(rawEntry);
    result[name] = {
      visible: getBoolean(entry, "unlocked") || getNumber(entry, "value") > 0 || isResourceUnlocked(state, name),
    };
  }

  return result;
}

function getBuildingControlsVisibility(state: SerializableStateLike): Record<string, UiBuildingControlsVisibility> {
  const buildings = asRecord(asRecord(state).buildings);
  const ecology = isTechResearched(state, "ecology");
  const pumpjack = isUpgradeResearched(state, "pumpjack");
  const biofuel = isUpgradeResearched(state, "biofuel");
  const factoryAutomation = isUpgradeResearched(state, "factoryAutomation");
  const carbonSequestration = isUpgradeResearched(state, "carbonSequestration");

  const result: Record<string, UiBuildingControlsVisibility> = {};
  for (const name of Object.keys(buildings)) {
    let controlMode: UiBuildingControlsVisibility["controlMode"] = "none";
    let toggleVisible = false;
    let automationVisible = false;
    switch (name) {
      case "smelter":
      case "calciner":
      case "accelerator":
      case "mint":
      case "brewery":
        controlMode = "count";
        toggleVisible = true;
        break;
      case "steamworks":
        controlMode = "binary";
        toggleVisible = true;
        automationVisible = factoryAutomation;
        break;
      case "factory":
        automationVisible = carbonSequestration;
        break;
      case "mine":
      case "quarry":
        controlMode = ecology ? "count" : "none";
        toggleVisible = ecology;
        break;
      case "oilWell":
        controlMode = pumpjack ? "binary" : "none";
        toggleVisible = pumpjack;
        break;
      case "biolab":
        controlMode = biofuel ? "binary" : "none";
        toggleVisible = biofuel;
        break;
      default:
        controlMode = "none";
        toggleVisible = false;
        break;
    }
    result[name] = { controlMode, toggleVisible, automationVisible };
  }

  return result;
}

export function deriveUiVisibility(state: SerializableStateLike): DerivedUiVisibility {
  const jobsVisible =
    getBuildingOn(state, "hut") > 0 ||
    isResourceUnlocked(state, "kittens") ||
    isResourceUnlocked(state, "zebras") ||
    getVsuVal(state, "usedCryochambers") > 0;
  const workshopVisible = getBuildingOn(state, "workshop") > 0;
  const tabs: Record<UiMainTabId, UiTabVisibility> = {
    buildings: { id: "buildings", label: TAB_LABELS.buildings, visible: true },
    jobs: { id: "jobs", label: getVillageLabel(state), visible: jobsVisible },
    science: {
      id: "science",
      label: TAB_LABELS.science,
      visible:
        getBuildingOn(state, "library") > 0 ||
        isTechResearched(state, "calendar") ||
        isTechResearched(state, "chronophysics"),
    },
    workshop: { id: "workshop", label: TAB_LABELS.workshop, visible: workshopVisible },
    religion: {
      id: "religion",
      label: TAB_LABELS.religion,
      visible:
        getResourceValue(state, "faith") > 0 ||
        (isChallengeActive(state, "atheism") && getBuildingVal(state, "ziggurat") > 0),
    },
    space: {
      id: "space",
      label: TAB_LABELS.space,
      visible: isTechResearched(state, "rocketry"),
    },
    time: {
      id: "time",
      label: TAB_LABELS.time,
      visible: isTechResearched(state, "calendar") || getVsuVal(state, "usedCryochambers") > 0,
    },
    trade: {
      id: "trade",
      label: TAB_LABELS.trade,
      visible: Object.values(asRecord(asRecord(asRecord(state).diplomacy).races)).some((entry) =>
        getBoolean(asRecord(entry), "unlocked"),
      ),
    },
    achievements: {
      id: "achievements",
      label: TAB_LABELS.achievements,
      visible: getAnyUnlockedAchievement(state),
    },
    stats: {
      id: "stats",
      label: TAB_LABELS.stats,
      visible: getResourceValue(state, "karma") > 0 || isTechResearched(state, "math"),
    },
    challenges: {
      id: "challenges",
      label: TAB_LABELS.challenges,
      visible: isPerkResearched(state, "adjustmentBureau") || isPerkReserved(state, "adjustmentBureau"),
    },
  };

  return {
    tabs,
    buildings: getBuildingControlsVisibility(state),
    village: {
      jobsVisible: !isChallengeActive(state, "ironWill") || getVillageKittens(state) > 0,
      managementVisible: getVillageKittens(state) >= 5 || getResourceValue(state, "zebras") > 0 || getRaceUnlocked(state, "zebras"),
      censusVisible: isTechResearched(state, "civil"),
      mapVisible: isTechResearched(state, "archery"),
      festivalVisible: isTechResearched(state, "drama"),
    },
    jobs: getJobVisibility(state),
    resources: getResourceVisibility(state),
    actions: {
      huntVisible: isTechResearched(state, "archery") && !isChallengeActive(state, "pacifism"),
    },
    time: {
      shatterVisible: isUpgradeResearched(state, "tachyonModerator"),
    },
  };
}

export function getVisibleMainTabs(state: SerializableStateLike): UiMainTabId[] {
  const visibility = deriveUiVisibility(state);
  return MAIN_TAB_ORDER.filter((tabId) => visibility.tabs[tabId].visible);
}
