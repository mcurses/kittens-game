import type { Tick } from "@kittens/shared";
import { type BuildingState, createInitialBuildings } from "./buildings.js";
import { type CalendarState, createInitialCalendar } from "./calendar.js";
import { type ChallengeState, createInitialChallenges } from "./challenges.js";
import { type PrestigeState, createInitialPrestige } from "./prestige.js";
import { type ReligionState, createInitialReligion } from "./religion.js";
import { type ResourceState, createInitialResources } from "./resources.js";
import { type ScienceState, createInitialScience } from "./science.js";
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
  };
}

// ── Serialization ─────────────────────────────────────────────────────────────

/** Serialized form of GameState — safe for JSON.stringify */
export interface SerializedGameState {
  version: number;
  tick: number;
  effectCache: Record<string, number>;
  resources: Record<string, { value: number; maxValue: number }>;
  buildings: Record<string, { val: number; on: number }>;
  village: {
    kittens: number;
    kittenProgress: number;
    jobs: Record<string, { value: number }>;
  };
  calendar: {
    day: number;
    season: number;
    year: number;
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
}

/**
 * Serialize GameState to a plain object with no class instances.
 * Port of legacy `game.save()` in game.js:2393.
 */
export function serialize(state: GameState): SerializedGameState {
  const resources: Record<string, { value: number; maxValue: number }> = {};
  for (const [name, entry] of Object.entries(state.resources)) {
    resources[name] = { value: entry.value, maxValue: entry.maxValue };
  }

  const buildings: Record<string, { val: number; on: number }> = {};
  for (const [name, entry] of Object.entries(state.buildings)) {
    buildings[name] = { val: entry.val, on: entry.on };
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
    },
    calendar: {
      day: state.calendar.day,
      season: state.calendar.season,
      year: state.calendar.year,
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
      resources[name] = { value: entry.value, maxValue: entry.maxValue };
    }
  }

  const savedBuildings = data.buildings ?? {};
  const buildings: Record<string, { val: number; on: number }> = {
    ...createInitialBuildings(),
  };
  for (const [name, entry] of Object.entries(savedBuildings)) {
    if (entry && typeof entry.val === "number" && typeof entry.on === "number") {
      buildings[name] = { val: entry.val, on: entry.on };
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
    village = { kittens, kittenProgress, jobs };
  }

  const savedCalendar = data.calendar;
  let calendar = createInitialCalendar();
  if (savedCalendar && typeof savedCalendar === "object") {
    calendar = {
      day: typeof savedCalendar.day === "number" ? savedCalendar.day : 0,
      season: typeof savedCalendar.season === "number" ? savedCalendar.season : 0,
      year: typeof savedCalendar.year === "number" ? savedCalendar.year : 0,
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
  };
}
