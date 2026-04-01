import type { Tick } from "@kittens/shared";
import { type AchievementState, createInitialAchievements } from "./achievements.js";
import { type BuildingState, createInitialBuildings } from "./buildings.js";
import { type CalendarState, createInitialCalendar } from "./calendar.js";
import { type ChallengeState, createInitialChallenges } from "./challenges.js";
import { type DiplomacyState, createInitialDiplomacy } from "./diplomacy.js";
import { type PrestigeState, createInitialPrestige } from "./prestige.js";
import { type ReligionState, createInitialReligion } from "./religion.js";
import { type ResourceState, calcResourcePerTick, createInitialResources } from "./resources.js";
import { type ScienceState, createInitialScience } from "./science.js";
import { type SpaceState, createInitialSpace } from "./space.js";
import { type TimeState, createInitialTime } from "./time.js";
import { type VillageState, createInitialVillage } from "./village.js";
import { type WorkshopState, createInitialWorkshop } from "./workshop.js";

/**
 * Root game state — the single serializable snapshot of a game.
 * This is the entire truth; nothing else is authoritative.
 */
export interface GameState {
  readonly version: number;
  readonly tick: Tick;
  /** Flat map of all active effects, rebuilt each tick by the effect system. */
  readonly effectCache: Record<string, number>;
  /** All resource pools (value + maxValue). */
  readonly resources: ResourceState;
  /** All building counts (val + on). */
  readonly buildings: BuildingState;
  /** Village population: kittens, growth progress, and job assignments. */
  readonly village: VillageState;
  /** In-game calendar: day, season, year. */
  readonly calendar: CalendarState;
  /** Science: researched techs and policies. */
  readonly science: ScienceState;
  /** Workshop: purchased upgrades and craft unlock state. */
  readonly workshop: WorkshopState;
  /** Religion: faith, worship, ziggurat/religion/transcendence upgrades. */
  readonly religion: ReligionState;
  /** Prestige: perks purchased with paragon, persist across soft resets. */
  readonly prestige: PrestigeState;
  /** Challenges: active/completed challenges and their completion counts. */
  readonly challenges: ChallengeState;
  /** Space: missions, planets, and space buildings. */
  readonly space: SpaceState;
  /** Diplomacy: races, embassy levels, trade state. */
  readonly diplomacy: DiplomacyState;
  /** Time mechanics: CFU/VSU upgrades, heat, flux. */
  readonly time: TimeState;
  /** Achievements and badges unlocked this run. */
  readonly achievements: AchievementState;
}

export function createInitialState(): GameState {
  return {
    version: 1,
    tick: 0 as Tick,
    effectCache: {},
    resources: createInitialResources(),
    buildings: createInitialBuildings(),
    village: createInitialVillage(),
    calendar: createInitialCalendar(),
    science: createInitialScience(),
    workshop: createInitialWorkshop(),
    religion: createInitialReligion(),
    prestige: createInitialPrestige(),
    challenges: createInitialChallenges(),
    space: createInitialSpace(),
    diplomacy: createInitialDiplomacy(),
    time: createInitialTime(),
    achievements: createInitialAchievements(),
  };
}

// ── Serialization ─────────────────────────────────────────────────────────────

/** Serialized form of GameState — safe for JSON.stringify */
export interface SerializedGameState {
  version: number;
  tick: number;
  effectCache: Record<string, number>;
  resources: Record<string, { value: number; maxValue: number; perTick: number }>;
  buildings: Record<
    string,
    { val: number; on: number; unlocked?: boolean; jammed?: boolean; automationEnabled?: boolean }
  >;
  village: {
    kittens: number;
    kittenProgress: number;
    jobs: Record<string, { value: number }>;
    deadKittens?: number;
    happiness?: number;
  };
  calendar: {
    day: number;
    season: number;
    year: number;
    festivalDays?: number;
  };
  science: {
    techs: Record<string, { unlocked: boolean; researched: boolean }>;
    policies: Record<string, { unlocked: boolean; blocked: boolean; researched: boolean }>;
  };
  workshop: {
    upgrades: Record<string, { unlocked: boolean; researched: boolean }>;
    crafts: Record<string, { unlocked: boolean }>;
  };
  religion?: {
    worship: number;
    faithRatio: number;
    transcendenceTier: number;
    zu: Record<string, { val: number; on: number; unlocked: boolean }>;
    ru: Record<string, { val: number; on: number }>;
    tu: Record<string, { val: number; on: number; unlocked: boolean }>;
  };
  prestige?: {
    perks: Record<string, { unlocked: boolean; researched: boolean }>;
  };
  challenges?: {
    challenges: Record<
      string,
      { unlocked: boolean; active: boolean; researched: boolean; on: number; pending: boolean }
    >;
  };
  space?: {
    programs: Record<string, { val: number; on: number; unlocked: boolean }>;
    planets: Record<string, { unlocked: boolean; reached: boolean; routeDays: number }>;
    spaceBuildings: Record<string, { val: number; on: number; unlocked: boolean }>;
  };
  diplomacy?: {
    races: Record<string, { unlocked: boolean; embassyLevel: number }>;
    baseGoldCost: number;
    baseCatpowerCost: number;
  };
  time?: {
    cfus: Record<string, { val: number; on: number; unlocked: boolean; heat: number }>;
    vsus: Record<string, { val: number; on: number; unlocked: boolean }>;
    heat: number;
    flux: number;
    isAccelerated: boolean;
  };
  achievements?: {
    badgesUnlocked: boolean;
    achievements: Array<{ name: string; unlocked: boolean; starUnlocked: boolean }>;
    badges: Array<{ name: string; unlocked: boolean }>;
  };
}

/**
 * Serialize GameState to a plain object with no class instances.
 * Port of legacy `game.save()` in game.js:2393.
 */
export function serialize(state: GameState): SerializedGameState {
  const resources: Record<string, { value: number; maxValue: number; perTick: number }> = {};
  for (const [name, entry] of Object.entries(state.resources)) {
    resources[name] = {
      value: entry.value,
      maxValue: entry.maxValue,
      perTick: calcResourcePerTick(state.effectCache, name),
    };
  }

  const buildings: Record<
    string,
    { val: number; on: number; unlocked?: boolean; jammed?: boolean; automationEnabled?: boolean }
  > = {};
  for (const [name, entry] of Object.entries(state.buildings)) {
    buildings[name] = {
      val: entry.val,
      on: entry.on,
      ...(entry.unlocked !== undefined ? { unlocked: entry.unlocked } : {}),
      ...(entry.jammed !== undefined ? { jammed: entry.jammed } : {}),
      ...(entry.automationEnabled !== undefined ? { automationEnabled: entry.automationEnabled } : {}),
    };
  }

  const jobs: Record<string, { value: number }> = {};
  for (const [name, entry] of Object.entries(state.village.jobs)) {
    jobs[name] = { value: entry.value };
  }

  return {
    version: state.version,
    tick: state.tick,
    effectCache: { ...state.effectCache },
    resources,
    buildings,
    village: {
      kittens: state.village.kittens,
      kittenProgress: state.village.kittenProgress,
      jobs,
      deadKittens: state.village.deadKittens,
      happiness: state.village.happiness,
    },
    calendar: {
      day: state.calendar.day,
      season: state.calendar.season,
      year: state.calendar.year,
      festivalDays: state.calendar.festivalDays,
    },
    science: {
      techs: Object.fromEntries(
        Object.entries(state.science.techs).map(([n, e]) => [
          n,
          { unlocked: e.unlocked, researched: e.researched },
        ]),
      ),
      policies: Object.fromEntries(
        Object.entries(state.science.policies).map(([n, e]) => [
          n,
          { unlocked: e.unlocked, blocked: e.blocked, researched: e.researched },
        ]),
      ),
    },
    workshop: {
      upgrades: Object.fromEntries(
        Object.entries(state.workshop.upgrades).map(([n, e]) => [
          n,
          { unlocked: e.unlocked, researched: e.researched },
        ]),
      ),
      crafts: Object.fromEntries(
        Object.entries(state.workshop.crafts).map(([n, e]) => [n, { unlocked: e.unlocked }]),
      ),
    },
    religion: {
      worship: state.religion.worship,
      faithRatio: state.religion.faithRatio,
      transcendenceTier: state.religion.transcendenceTier,
      zu: Object.fromEntries(
        Object.entries(state.religion.zigguratUpgrades).map(([n, e]) => [
          n,
          { val: e.val, on: e.on, unlocked: e.unlocked },
        ]),
      ),
      ru: Object.fromEntries(
        Object.entries(state.religion.religionUpgrades).map(([n, e]) => [
          n,
          { val: e.val, on: e.on },
        ]),
      ),
      tu: Object.fromEntries(
        Object.entries(state.religion.transcendenceUpgrades).map(([n, e]) => [
          n,
          { val: e.val, on: e.on, unlocked: e.unlocked },
        ]),
      ),
    },
    prestige: {
      perks: Object.fromEntries(
        Object.entries(state.prestige.perks).map(([n, e]) => [
          n,
          { unlocked: e.unlocked, researched: e.researched },
        ]),
      ),
    },
    challenges: {
      challenges: Object.fromEntries(
        Object.entries(state.challenges.challenges).map(([n, e]) => [
          n,
          {
            unlocked: e.unlocked,
            active: e.active,
            researched: e.researched,
            on: e.on,
            pending: e.pending,
          },
        ]),
      ),
    },
    space: {
      programs: Object.fromEntries(
        Object.entries(state.space.programs).map(([n, e]) => [
          n,
          { val: e.val, on: e.on, unlocked: e.unlocked },
        ]),
      ),
      planets: Object.fromEntries(
        Object.entries(state.space.planets).map(([n, e]) => [
          n,
          { unlocked: e.unlocked, reached: e.reached, routeDays: e.routeDays },
        ]),
      ),
      spaceBuildings: Object.fromEntries(
        Object.entries(state.space.spaceBuildings).map(([n, e]) => [
          n,
          { val: e.val, on: e.on, unlocked: e.unlocked },
        ]),
      ),
    },
    diplomacy: {
      races: Object.fromEntries(
        Object.entries(state.diplomacy.races).map(([n, e]) => [
          n,
          { unlocked: e.unlocked, embassyLevel: e.embassyLevel },
        ]),
      ),
      baseGoldCost: state.diplomacy.baseGoldCost,
      baseCatpowerCost: state.diplomacy.baseCatpowerCost,
    },
    time: {
      cfus: Object.fromEntries(
        Object.entries(state.time.cfus).map(([n, e]) => [
          n,
          { val: e.val, on: e.on, unlocked: e.unlocked, heat: e.heat },
        ]),
      ),
      vsus: Object.fromEntries(
        Object.entries(state.time.vsus).map(([n, e]) => [
          n,
          { val: e.val, on: e.on, unlocked: e.unlocked },
        ]),
      ),
      heat: state.time.heat,
      flux: state.time.flux,
      isAccelerated: state.time.isAccelerated,
    },
    achievements: {
      badgesUnlocked: state.achievements.badgesUnlocked,
      achievements: Object.entries(state.achievements.achievements).map(([name, e]) => ({
        name,
        unlocked: e.unlocked,
        starUnlocked: e.starUnlocked,
      })),
      badges: Object.entries(state.achievements.badges).map(([name, e]) => ({
        name,
        unlocked: e.unlocked,
      })),
    },
  };
}

/**
 * Restore GameState from a serialized snapshot.
 * Unknown fields are ignored (forward compatibility).
 * Port of legacy `game.load()` in game.js:2529.
 */
export function deserialize(data: SerializedGameState): GameState {
  const savedResources = data.resources ?? {};
  const resources: Record<string, { value: number; maxValue: number }> = {
    ...createInitialResources(),
  };
  for (const [name, entry] of Object.entries(savedResources)) {
    if (entry && typeof entry.value === "number" && typeof entry.maxValue === "number") {
      // perTick is a computed field — not stored back into GameState
      resources[name] = { value: entry.value, maxValue: entry.maxValue };
    }
  }

  const savedBuildings = data.buildings ?? {};
  const buildings: Record<
    string,
    { val: number; on: number; unlocked?: boolean; jammed?: boolean; automationEnabled?: boolean }
  > = {
    ...createInitialBuildings(),
  };
  for (const [name, entry] of Object.entries(savedBuildings)) {
    if (entry && typeof entry.val === "number" && typeof entry.on === "number") {
      buildings[name] = {
        val: entry.val,
        on: entry.on,
        ...(typeof entry.unlocked === "boolean" ? { unlocked: entry.unlocked } : {}),
        ...(typeof entry.jammed === "boolean" ? { jammed: entry.jammed } : {}),
        ...(typeof entry.automationEnabled === "boolean"
          ? { automationEnabled: entry.automationEnabled }
          : {}),
      };
    }
  }

  const savedVillage = data.village;
  let village = createInitialVillage();
  if (savedVillage && typeof savedVillage === "object") {
    const kittens = typeof savedVillage.kittens === "number" ? savedVillage.kittens : 0;
    const kittenProgress =
      typeof savedVillage.kittenProgress === "number" ? savedVillage.kittenProgress : 0;
    const jobs: Record<string, { value: number }> = { ...createInitialVillage().jobs };
    if (savedVillage.jobs && typeof savedVillage.jobs === "object") {
      for (const [name, entry] of Object.entries(savedVillage.jobs)) {
        if (entry && typeof entry.value === "number") {
          jobs[name] = { value: entry.value };
        }
      }
    }
    const deadKittens = typeof savedVillage.deadKittens === "number" ? savedVillage.deadKittens : 0;
    const happiness = typeof savedVillage.happiness === "number" ? savedVillage.happiness : 1.0;
    village = { kittens, kittenProgress, jobs, deadKittens, happiness };
  }

  const savedCalendar = data.calendar;
  let calendar = createInitialCalendar();
  if (savedCalendar && typeof savedCalendar === "object") {
    calendar = {
      day: typeof savedCalendar.day === "number" ? savedCalendar.day : 0,
      season: typeof savedCalendar.season === "number" ? savedCalendar.season : 0,
      year: typeof savedCalendar.year === "number" ? savedCalendar.year : 0,
      festivalDays: typeof savedCalendar.festivalDays === "number" ? Math.max(0, savedCalendar.festivalDays) : 0,
    };
  }

  // Science state is handled entirely by ScienceManager.load() — start from initial
  const science = createInitialScience();

  // Workshop state is handled entirely by WorkshopManager.load() — start from initial
  const workshop = createInitialWorkshop();

  // Religion state is handled entirely by ReligionManager.load() — start from initial
  const religion = createInitialReligion();

  // Prestige state is handled entirely by PrestigeManager.load() — start from initial
  const prestige = createInitialPrestige();

  // Challenges state is handled entirely by ChallengeManager.load() — start from initial
  const challenges = createInitialChallenges();

  // Space state is handled entirely by SpaceManager.load() — start from initial
  const space = createInitialSpace();

  // Diplomacy state is handled entirely by DiplomacyManager.load() — start from initial
  const diplomacy = createInitialDiplomacy();

  // Time state is handled entirely by TimeManager.load() — start from initial
  const time = createInitialTime();

  // Achievements state is handled entirely by AchievementManager.load() — start from initial
  const achievements = createInitialAchievements();

  return {
    version: data.version,
    tick: data.tick as Tick,
    effectCache: data.effectCache ?? {},
    resources,
    buildings,
    village,
    calendar,
    science,
    workshop,
    religion,
    prestige,
    challenges,
    space,
    diplomacy,
    time,
    achievements,
  };
}
