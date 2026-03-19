import type { Serializable } from "@kittens/shared";
import { produce } from "immer";
import type { Manager } from "./manager.js";
import type { GameState } from "./state.js";

// ── Types ──────────────────────────────────────────────────────────────────────

/** Runtime state for a single achievement */
export interface AchievementEntry {
  readonly unlocked: boolean;
  readonly starUnlocked: boolean;
}

/** Runtime state for a single badge */
export interface BadgeEntry {
  readonly unlocked: boolean;
}

/** Achievements state slice */
export interface AchievementState {
  readonly badgesUnlocked: boolean;
  readonly achievements: Record<string, AchievementEntry>;
  readonly badges: Record<string, BadgeEntry>;
}

/** Static definition for an achievement */
export interface AchievementDef {
  readonly name: string;
  readonly hidden?: boolean;
  readonly unethical?: boolean;
  /** Returns true when this achievement should unlock. Omit for always-locked. */
  readonly condition?: (state: GameState) => boolean;
  /** Returns true when the star variant should unlock. */
  readonly starCondition?: (state: GameState) => boolean;
}

/** Static definition for a badge */
export interface BadgeDef {
  readonly name: string;
  readonly difficulty: string;
  /** Returns true when this badge should unlock. Omit for externally-managed only. */
  readonly condition?: (state: GameState) => boolean;
}

// ── Achievement Definitions ────────────────────────────────────────────────────

/**
 * All achievement definitions.
 * Port of legacy `classes.managers.Achievements.achievements` in achievements.js:5-259.
 *
 * Conditions reference pure GameState (no `this`-bound closures).
 * Achievements with state not yet tracked (ironWill, cheatMode, stats) use
 * `() => false` stubs — documented inline.
 */
export const ACHIEVEMENT_DEFS: readonly AchievementDef[] = [
  {
    name: "theElderLegacy",
    hidden: true,
    // Time-locked to January 2017 — always false.
    condition: (_state) => false,
  },
  {
    name: "unicornConspiracy",
    condition: (state) => (state.resources.unicorns?.value ?? 0) > 0,
  },
  {
    name: "uniception",
    condition: (state) => (state.resources.tears?.value ?? 0) > 0,
  },
  {
    name: "sinsOfEmpire",
    condition: (state) => (state.resources.alicorn?.value ?? 0) > 0,
  },
  {
    name: "anachronox",
    condition: (state) => (state.resources.timeCrystal?.value ?? 0) > 0,
  },
  {
    name: "deadSpace",
    condition: (state) => (state.resources.necrocorn?.value ?? 0) > 0,
  },
  {
    name: "sadnessAbyss",
    condition: (state) => (state.resources.sorrow?.value ?? 0) >= 100,
  },
  {
    // Requires ironWill flag — not yet tracked; stub as false.
    name: "ironWill",
    condition: (_state) => false,
  },
  {
    name: "uberkatzhen",
    condition: (_state) => false,
  },
  {
    name: "hundredYearsSolitude",
    condition: (_state) => false,
  },
  {
    name: "soilUptuned",
    condition: (_state) => false,
  },
  {
    name: "atlasUnmeowed",
    condition: (_state) => false,
  },
  {
    name: "meowMeowRevolution",
    condition: (_state) => false,
  },
  {
    // Requires ironWill flag — stub as false.
    name: "spaceOddity",
    condition: (_state) => false,
    starCondition: (_state) => false,
  },
  {
    name: "jupiterAscending",
    condition: (state) =>
      (state.space.programs.orbitalLaunch?.on ?? 0) > 0 && state.calendar.year <= 1,
    // starCondition requires startedWithoutChronospheres flag — stub false.
    starCondition: (_state) => false,
  },
  {
    name: "veryLargeArray",
    condition: (state) =>
      (state.buildings.observatory?.on ?? 0) >= 100 &&
      !(state.workshop.upgrades.seti?.researched ?? false),
  },
  {
    name: "shadowOfTheColossus",
    condition: (state) =>
      (state.buildings.ziggurat?.val ?? 0) > 0 && (state.effectCache.maxKittens ?? 0) === 1,
  },
  {
    name: "sunGod",
    condition: (state) => state.religion.worship >= 696342,
  },
  {
    name: "heartOfDarkness",
    condition: (state) => (state.resources.zebras?.value ?? 0) > 1,
  },
  {
    name: "winterIsComing",
    unethical: true,
    condition: (state) => state.village.deadKittens >= 10,
  },
  {
    name: "youMonster",
    unethical: true,
    condition: (state) => state.village.deadKittens >= 100,
    starCondition: (state) => state.village.deadKittens >= 666666,
  },
  {
    // Requires cheatMode flag — stub as false.
    name: "superUnethicalClimax",
    unethical: true,
    condition: (_state) => false,
  },
  {
    // Requires systemShockMode flag — stub as false.
    name: "systemShock",
    unethical: true,
    condition: (_state) => false,
  },
  {
    name: "lotusMachine",
    condition: (state) => (state.resources.karma?.value ?? 0) >= 1,
  },
  {
    name: "serenity",
    condition: (state) => state.village.kittens >= 50 && state.village.deadKittens === 0,
    starCondition: (state) => state.village.kittens >= 1000 && state.village.deadKittens === 0,
  },
  {
    name: "utopiaProject",
    condition: (state) =>
      state.village.happiness >= 1.5 && (state.resources.kittens?.value ?? 0) > 35,
    starCondition: (state) =>
      state.village.happiness >= 5.0 && (state.resources.kittens?.value ?? 0) > 35,
  },
  {
    name: "deathStranding",
    condition: (state) => state.space.planets.furthestRing?.reached === true,
  },
  {
    // cathammer requires stats.totalYears and darkFutureBeginning — stub false.
    name: "cathammer",
    condition: (_state) => false,
    starCondition: (_state) => false,
  },
  {
    // eternalBacchanalia requires calendar.festivalDays — stub false.
    name: "eternalBacchanalia",
    condition: (_state) => false,
  },
  {
    name: "challenger",
    condition: (state) => getCountUniqueCompletions(state) >= 5,
    starCondition: (state) => getCountTotalCompletions(state) >= 100,
  },
];

// ── Badge Definitions ──────────────────────────────────────────────────────────

/**
 * All badge definitions.
 * Port of legacy `classes.managers.Achievements.badges` in achievements.js:261-411.
 */
export const BADGE_DEFS: readonly BadgeDef[] = [
  {
    name: "lotus",
    difficulty: "A",
    // Requires stats.totalResets — stub false.
    condition: (_state) => false,
  },
  {
    name: "ivoryTower",
    difficulty: "S+",
    // No condition — externally unlocked only.
  },
  {
    name: "useless",
    difficulty: "F",
    // Requires village leader trait — stub false.
    condition: (_state) => false,
  },
  {
    name: "beta",
    difficulty: "B",
    // Browser URL check — always false in engine.
    condition: (_state) => false,
  },
  {
    name: "silentHill",
    difficulty: "S",
    // Server MOTD check — always false in engine.
    condition: (_state) => false,
  },
  {
    name: "evergreen",
    difficulty: "F",
    // No condition.
  },
  {
    name: "deadSpace",
    difficulty: "S",
    condition: (state) =>
      (state.resources.kittens?.value ?? 0) >= 1000 &&
      (state.resources.kittens?.maxValue ?? 1) === 0,
  },
  {
    name: "reginaNoctis",
    difficulty: "S",
    condition: (state) =>
      (state.resources.kittens?.value ?? 0) >= 500 && (state.resources.alicorn?.value ?? 0) === 0,
  },
  {
    name: "ghostInTheMachine",
    difficulty: "S",
    // No condition.
  },
  {
    name: "abOwo",
    difficulty: "A",
    // No condition.
  },
  {
    name: "cleanPaws",
    difficulty: "C",
    // No condition.
  },
  {
    name: "sequenceBreak",
    difficulty: "D",
    condition: (state) =>
      !(state.space.planets.moon?.reached === true) && state.space.planets.dune?.reached === true,
  },
  {
    name: "fantasticFurColor",
    difficulty: "F",
    // Requires village leader color — stub false.
    condition: (_state) => false,
  },
  {
    name: "whatYearIsIt",
    difficulty: "C",
    // No condition.
  },
  {
    name: "tardis",
    difficulty: "C",
    // No condition.
  },
  {
    name: "wheredThisComeFrom",
    difficulty: "S",
    // No condition.
  },
  {
    name: "lostDates",
    difficulty: "B",
    condition: (state) => state.time.flux <= -5,
  },
  {
    name: "buffet",
    difficulty: "A",
    // Leviathan energy not yet tracked — stub false.
    condition: (_state) => false,
  },
  {
    name: "newHome",
    difficulty: "D",
    // Requires detailed space building effect calc — stub false.
    condition: (_state) => false,
  },
  {
    name: "betterSafeThanSorry",
    difficulty: "E",
    // No condition.
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Count challenges with at least one completion (unique completions).
 */
function getCountUniqueCompletions(state: GameState): number {
  let count = 0;
  for (const entry of Object.values(state.challenges.challenges)) {
    if (entry.on > 0) count++;
  }
  return count;
}

/**
 * Count total challenge completions across all challenges.
 */
function getCountTotalCompletions(state: GameState): number {
  let total = 0;
  for (const entry of Object.values(state.challenges.challenges)) {
    total += entry.on;
  }
  return total;
}

// ── Factory ────────────────────────────────────────────────────────────────────

/**
 * Return a fresh AchievementState with all entries locked.
 * Port of legacy `achievements.resetState()` in achievements.js:475-487.
 */
export function createInitialAchievements(): AchievementState {
  const achievements: Record<string, AchievementEntry> = {};
  for (const def of ACHIEVEMENT_DEFS) {
    achievements[def.name] = { unlocked: false, starUnlocked: false };
  }

  const badges: Record<string, BadgeEntry> = {};
  for (const def of BADGE_DEFS) {
    badges[def.name] = { unlocked: false };
  }

  return {
    badgesUnlocked: false,
    achievements,
    badges,
  };
}

// ── AchievementManager ────────────────────────────────────────────────────────

/**
 * Scans all achievement and badge conditions each tick.
 * Unlocks achievements/badges whose conditions are met.
 * Port of legacy `classes.managers.Achievements.update()` in achievements.js:440-473.
 *
 * No GameActions are dispatched by this manager — achievements unlock passively.
 */
export class AchievementManager implements Manager {
  update(state: GameState): GameState {
    return produce(state, (draft) => {
      // Check achievements
      for (const def of ACHIEVEMENT_DEFS) {
        const entry = draft.achievements.achievements[def.name];
        if (!entry) continue;

        if (!entry.unlocked && def.condition && def.condition(state)) {
          entry.unlocked = true;
        }
        if (!entry.starUnlocked && def.starCondition && def.starCondition(state)) {
          entry.starUnlocked = true;
        }
      }

      // Check badges
      for (const def of BADGE_DEFS) {
        const entry = draft.achievements.badges[def.name];
        if (!entry) continue;

        if (!entry.unlocked && def.condition && def.condition(state)) {
          entry.unlocked = true;
          draft.achievements.badgesUnlocked = true;
        }
      }
    });
  }

  updateEffects(_state: GameState): Record<string, number> {
    // Achievements produce no gameplay effects.
    return {};
  }

  save(state: GameState): Serializable {
    const achievements = ACHIEVEMENT_DEFS.map((def) => {
      const entry = state.achievements.achievements[def.name] ?? {
        unlocked: false,
        starUnlocked: false,
      };
      return {
        name: def.name,
        unlocked: entry.unlocked,
        starUnlocked: entry.starUnlocked,
      };
    });
    const badges = BADGE_DEFS.map((def) => {
      const entry = state.achievements.badges[def.name] ?? { unlocked: false };
      return {
        name: def.name,
        unlocked: entry.unlocked,
      };
    });
    return {
      badgesUnlocked: state.achievements.badgesUnlocked,
      achievements,
      badges,
    } as unknown as Serializable;
  }

  load(saved: Serializable, state: GameState): GameState {
    if (!saved || typeof saved !== "object" || Array.isArray(saved)) {
      return { ...state, achievements: createInitialAchievements() };
    }
    const raw = saved as Record<string, unknown>;

    const achState: AchievementState = createInitialAchievements();

    // Restore badgesUnlocked
    const badgesUnlocked = typeof raw.badgesUnlocked === "boolean" ? raw.badgesUnlocked : false;

    // Restore achievements
    const achievements: Record<string, AchievementEntry> = { ...achState.achievements };
    if (Array.isArray(raw.achievements)) {
      for (const item of raw.achievements) {
        if (!item || typeof item !== "object") continue;
        const entry = item as Record<string, unknown>;
        const name = typeof entry.name === "string" ? entry.name : null;
        if (!name || !(name in achievements)) continue;
        achievements[name] = {
          unlocked: typeof entry.unlocked === "boolean" ? entry.unlocked : false,
          starUnlocked: typeof entry.starUnlocked === "boolean" ? entry.starUnlocked : false,
        };
      }
    }

    // Restore badges
    const badges: Record<string, BadgeEntry> = { ...achState.badges };
    if (Array.isArray(raw.badges)) {
      for (const item of raw.badges) {
        if (!item || typeof item !== "object") continue;
        const entry = item as Record<string, unknown>;
        const name = typeof entry.name === "string" ? entry.name : null;
        if (!name || !(name in badges)) continue;
        badges[name] = {
          unlocked: typeof entry.unlocked === "boolean" ? entry.unlocked : false,
        };
      }
    }

    return {
      ...state,
      achievements: { badgesUnlocked, achievements, badges },
    };
  }

  resetState(state: GameState): GameState {
    return { ...state, achievements: createInitialAchievements() };
  }
}
