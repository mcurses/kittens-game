import { produce } from "immer";
import { describe, expect, it } from "vitest";
import {
  ACHIEVEMENT_DEFS,
  AchievementManager,
  BADGE_DEFS,
  createInitialAchievements,
} from "./achievements.js";
import {
  BuildingManager,
  CalendarManager,
  ChallengeManager,
  DiplomacyManager,
  PrestigeManager,
  ReligionManager,
  ResourceManager,
  ScienceManager,
  SpaceManager,
  TimeManager,
  VillageManager,
  WorkshopManager,
} from "./index.js";
import { createInitialState, serialize } from "./state.js";
import { resetState, tick } from "./tick.js";

// ── Story 1: AchievementState shape and initial values ────────────────────────

describe("Story 1: AchievementState shape and initial values", () => {
  it("createInitialAchievements returns badgesUnlocked=false", () => {
    const s = createInitialAchievements();
    expect(s.badgesUnlocked).toBe(false);
  });

  it("all 30 achievements start with unlocked=false and starUnlocked=false", () => {
    const s = createInitialAchievements();
    expect(Object.keys(s.achievements).length).toBe(30);
    for (const ach of Object.values(s.achievements)) {
      expect(ach.unlocked).toBe(false);
      expect(ach.starUnlocked).toBe(false);
    }
  });

  it("all 20 badges start with unlocked=false", () => {
    const s = createInitialAchievements();
    expect(Object.keys(s.badges).length).toBe(20);
    for (const badge of Object.values(s.badges)) {
      expect(badge.unlocked).toBe(false);
    }
  });

  it("ACHIEVEMENT_DEFS has 30 entries with required fields", () => {
    expect(ACHIEVEMENT_DEFS.length).toBe(30);
    for (const def of ACHIEVEMENT_DEFS) {
      expect(typeof def.name).toBe("string");
      expect(def.name.length).toBeGreaterThan(0);
    }
  });

  it("BADGE_DEFS has 20 entries with required fields", () => {
    expect(BADGE_DEFS.length).toBe(20);
    for (const def of BADGE_DEFS) {
      expect(typeof def.name).toBe("string");
      expect(def.name.length).toBeGreaterThan(0);
    }
  });

  it("GameState includes achievements slice", () => {
    const state = createInitialState();
    expect(state.achievements).toBeDefined();
    expect(state.achievements.badgesUnlocked).toBe(false);
  });
});

// ── Story 2: Passive unlock on tick ───────────────────────────────────────────

describe("Story 2: AchievementManager.update() — passive unlock on tick", () => {
  const manager = new AchievementManager();

  it("achievement with condition met unlocks after update", () => {
    let state = createInitialState();
    // Set unicorns > 0
    state = produce(state, (draft) => {
      draft.resources.unicorns = { value: 1, maxValue: 999999 };
    });
    const next = manager.update(state);
    expect(next.achievements.achievements.unicornConspiracy?.unlocked).toBe(true);
  });

  it("achievement already unlocked stays unlocked", () => {
    let state = createInitialState();
    state = produce(state, (draft) => {
      draft.achievements.achievements.unicornConspiracy = { unlocked: true, starUnlocked: false };
      draft.resources.unicorns = { value: 0, maxValue: 999999 };
    });
    const next = manager.update(state);
    expect(next.achievements.achievements.unicornConspiracy?.unlocked).toBe(true);
  });

  it("achievement condition not met stays locked", () => {
    const state = createInitialState();
    const next = manager.update(state);
    expect(next.achievements.achievements.unicornConspiracy?.unlocked).toBe(false);
  });

  it("star condition met sets starUnlocked independently", () => {
    let state = createInitialState();
    // serenity star: kittens >= 1000 && deadKittens == 0
    state = produce(state, (draft) => {
      draft.village.kittens = 1000;
      draft.village.deadKittens = 0;
    });
    const next = manager.update(state);
    expect(next.achievements.achievements.serenity?.unlocked).toBe(true); // regular cond: kittens >= 50
    expect(next.achievements.achievements.serenity?.starUnlocked).toBe(true);
  });

  it("star condition not met leaves starUnlocked=false", () => {
    let state = createInitialState();
    // serenity regular: kittens >= 50; star: kittens >= 1000
    state = produce(state, (draft) => {
      draft.village.kittens = 50;
      draft.village.deadKittens = 0;
    });
    const next = manager.update(state);
    expect(next.achievements.achievements.serenity?.unlocked).toBe(true);
    expect(next.achievements.achievements.serenity?.starUnlocked).toBe(false);
  });

  it("badge with condition met unlocks and sets badgesUnlocked=true", () => {
    let state = createInitialState();
    // lostDates: time.flux <= -5
    state = produce(state, (draft) => {
      draft.time.flux = -5;
    });
    const next = manager.update(state);
    expect(next.achievements.badges.lostDates?.unlocked).toBe(true);
    expect(next.achievements.badgesUnlocked).toBe(true);
  });

  it("badge with no condition never auto-unlocks", () => {
    const state = createInitialState();
    const next = manager.update(state);
    // ivoryTower has no condition
    expect(next.achievements.badges.ivoryTower?.unlocked).toBe(false);
    // ghostInTheMachine has no condition
    expect(next.achievements.badges.ghostInTheMachine?.unlocked).toBe(false);
  });
});

// ── Story 3: Resource-based achievement conditions ────────────────────────────

describe("Story 3: Resource-based achievement conditions", () => {
  const manager = new AchievementManager();

  const resourceAchievements: Array<{
    ach: string;
    resource: string;
    value: number;
    threshold: number;
  }> = [
    { ach: "unicornConspiracy", resource: "unicorns", value: 1, threshold: 0 },
    { ach: "uniception", resource: "tears", value: 1, threshold: 0 },
    { ach: "sinsOfEmpire", resource: "alicorn", value: 1, threshold: 0 },
    { ach: "anachronox", resource: "timeCrystal", value: 1, threshold: 0 },
    { ach: "deadSpace", resource: "necrocorn", value: 1, threshold: 0 },
    { ach: "sadnessAbyss", resource: "sorrow", value: 100, threshold: 99 },
    { ach: "heartOfDarkness", resource: "zebras", value: 2, threshold: 1 },
    { ach: "lotusMachine", resource: "karma", value: 1, threshold: 0 },
  ];

  for (const { ach, resource, value, threshold } of resourceAchievements) {
    it(`${ach} unlocks when ${resource} = ${value}`, () => {
      let state = createInitialState();
      state = produce(state, (draft) => {
        draft.resources[resource] = { value, maxValue: 999999 };
      });
      const next = manager.update(state);
      expect(next.achievements.achievements[ach]?.unlocked).toBe(true);
    });

    it(`${ach} stays locked when ${resource} = ${threshold}`, () => {
      let state = createInitialState();
      state = produce(state, (draft) => {
        draft.resources[resource] = { value: threshold, maxValue: 999999 };
      });
      const next = manager.update(state);
      expect(next.achievements.achievements[ach]?.unlocked).toBe(false);
    });
  }
});

// ── Story 4: Religion-based achievement conditions ────────────────────────────

describe("Story 4: Religion-based achievement conditions", () => {
  const manager = new AchievementManager();

  it("sunGod unlocks when religion.worship >= 696342", () => {
    let state = createInitialState();
    state = produce(state, (draft) => {
      draft.religion.worship = 696342;
    });
    const next = manager.update(state);
    expect(next.achievements.achievements.sunGod?.unlocked).toBe(true);
  });

  it("sunGod does NOT unlock when religion.worship < 696342", () => {
    let state = createInitialState();
    state = produce(state, (draft) => {
      draft.religion.worship = 696341;
    });
    const next = manager.update(state);
    expect(next.achievements.achievements.sunGod?.unlocked).toBe(false);
  });
});

// ── Story 5: Population-based achievement conditions ─────────────────────────

describe("Story 5: Population-based achievement conditions", () => {
  const manager = new AchievementManager();

  it("VillageState has deadKittens field initialized to 0", () => {
    const state = createInitialState();
    expect(state.village.deadKittens).toBe(0);
  });

  it("VillageState has happiness field initialized to 1.0", () => {
    const state = createInitialState();
    expect(state.village.happiness).toBe(1.0);
  });

  it("serenity unlocks when kittens >= 50 and deadKittens == 0", () => {
    let state = createInitialState();
    state = produce(state, (draft) => {
      draft.village.kittens = 50;
      draft.village.deadKittens = 0;
    });
    const next = manager.update(state);
    expect(next.achievements.achievements.serenity?.unlocked).toBe(true);
  });

  it("serenity does NOT unlock when kittens < 50", () => {
    let state = createInitialState();
    state = produce(state, (draft) => {
      draft.village.kittens = 49;
      draft.village.deadKittens = 0;
    });
    const next = manager.update(state);
    expect(next.achievements.achievements.serenity?.unlocked).toBe(false);
  });

  it("serenity does NOT unlock when deadKittens > 0", () => {
    let state = createInitialState();
    state = produce(state, (draft) => {
      draft.village.kittens = 50;
      draft.village.deadKittens = 1;
    });
    const next = manager.update(state);
    expect(next.achievements.achievements.serenity?.unlocked).toBe(false);
  });

  it("serenity star unlocks when kittens >= 1000 and deadKittens == 0", () => {
    let state = createInitialState();
    state = produce(state, (draft) => {
      draft.village.kittens = 1000;
      draft.village.deadKittens = 0;
    });
    const next = manager.update(state);
    expect(next.achievements.achievements.serenity?.starUnlocked).toBe(true);
  });

  it("utopiaProject unlocks when happiness >= 1.5 and kittens resource > 35", () => {
    let state = createInitialState();
    state = produce(state, (draft) => {
      draft.village.happiness = 1.5;
      draft.resources.kittens = { value: 36, maxValue: 999999 };
    });
    const next = manager.update(state);
    expect(next.achievements.achievements.utopiaProject?.unlocked).toBe(true);
  });

  it("utopiaProject does NOT unlock when kittens resource <= 35", () => {
    let state = createInitialState();
    state = produce(state, (draft) => {
      draft.village.happiness = 1.5;
      draft.resources.kittens = { value: 35, maxValue: 999999 };
    });
    const next = manager.update(state);
    expect(next.achievements.achievements.utopiaProject?.unlocked).toBe(false);
  });

  it("utopiaProject star unlocks when happiness >= 5 and kittens > 35", () => {
    let state = createInitialState();
    state = produce(state, (draft) => {
      draft.village.happiness = 5.0;
      draft.resources.kittens = { value: 36, maxValue: 999999 };
    });
    const next = manager.update(state);
    expect(next.achievements.achievements.utopiaProject?.starUnlocked).toBe(true);
  });
});

// ── Story 6: Building-based achievement conditions ────────────────────────────

describe("Story 6: Building-based achievement conditions", () => {
  const manager = new AchievementManager();

  it("veryLargeArray unlocks when observatory.on >= 100 and seti not researched", () => {
    let state = createInitialState();
    state = produce(state, (draft) => {
      draft.buildings.observatory = { val: 100, on: 100 };
      // seti not researched by default
    });
    const next = manager.update(state);
    expect(next.achievements.achievements.veryLargeArray?.unlocked).toBe(true);
  });

  it("veryLargeArray does NOT unlock when seti is researched", () => {
    let state = createInitialState();
    state = produce(state, (draft) => {
      draft.buildings.observatory = { val: 100, on: 100 };
      draft.workshop.upgrades.seti = { unlocked: true, researched: true };
    });
    const next = manager.update(state);
    expect(next.achievements.achievements.veryLargeArray?.unlocked).toBe(false);
  });

  it("veryLargeArray does NOT unlock when observatory.on < 100", () => {
    let state = createInitialState();
    state = produce(state, (draft) => {
      draft.buildings.observatory = { val: 99, on: 99 };
    });
    const next = manager.update(state);
    expect(next.achievements.achievements.veryLargeArray?.unlocked).toBe(false);
  });

  it("shadowOfTheColossus unlocks when ziggurat.val > 0 and effectCache.maxKittens == 1", () => {
    let state = createInitialState();
    state = produce(state, (draft) => {
      draft.buildings.ziggurat = { val: 1, on: 1 };
      draft.effectCache.maxKittens = 1;
    });
    const next = manager.update(state);
    expect(next.achievements.achievements.shadowOfTheColossus?.unlocked).toBe(true);
  });

  it("shadowOfTheColossus does NOT unlock when maxKittens != 1", () => {
    let state = createInitialState();
    state = produce(state, (draft) => {
      draft.buildings.ziggurat = { val: 1, on: 1 };
      draft.effectCache.maxKittens = 10;
    });
    const next = manager.update(state);
    expect(next.achievements.achievements.shadowOfTheColossus?.unlocked).toBe(false);
  });

  it("badge sequenceBreak unlocks when moon not reached but dune reached", () => {
    let state = createInitialState();
    state = produce(state, (draft) => {
      if (draft.space.planets.moon) {
        draft.space.planets.moon = { ...draft.space.planets.moon, reached: false };
      }
      if (draft.space.planets.dune) {
        draft.space.planets.dune = { ...draft.space.planets.dune, reached: true, unlocked: true };
      }
    });
    const next = manager.update(state);
    expect(next.achievements.badges.sequenceBreak?.unlocked).toBe(true);
  });
});

// ── Story 7: Space-based achievement conditions ───────────────────────────────

describe("Story 7: Space-based achievement conditions", () => {
  const manager = new AchievementManager();

  it("deathStranding unlocks when furthestRing planet is reached", () => {
    let state = createInitialState();
    state = produce(state, (draft) => {
      if (draft.space.planets.furthestRing) {
        draft.space.planets.furthestRing = {
          ...draft.space.planets.furthestRing,
          reached: true,
          unlocked: true,
        };
      }
    });
    const next = manager.update(state);
    expect(next.achievements.achievements.deathStranding?.unlocked).toBe(true);
  });

  it("deathStranding does NOT unlock when furthestRing not reached", () => {
    const state = createInitialState();
    const next = manager.update(state);
    expect(next.achievements.achievements.deathStranding?.unlocked).toBe(false);
  });

  it("jupiterAscending unlocks when orbitalLaunch.on > 0 and year <= 1", () => {
    let state = createInitialState();
    state = produce(state, (draft) => {
      draft.space.programs.orbitalLaunch = { val: 1, on: 1, unlocked: true };
      draft.calendar.year = 1;
    });
    const next = manager.update(state);
    expect(next.achievements.achievements.jupiterAscending?.unlocked).toBe(true);
  });

  it("jupiterAscending does NOT unlock when year > 1", () => {
    let state = createInitialState();
    state = produce(state, (draft) => {
      draft.space.programs.orbitalLaunch = { val: 1, on: 1, unlocked: true };
      draft.calendar.year = 2;
    });
    const next = manager.update(state);
    expect(next.achievements.achievements.jupiterAscending?.unlocked).toBe(false);
  });
});

// ── Story 8: Challenge-based achievement conditions ───────────────────────────

describe("Story 8: Challenge-based achievement conditions", () => {
  const manager = new AchievementManager();

  it("challenger unlocks when unique challenge completions >= 5", () => {
    let state = createInitialState();
    // Give 5 different challenges on >= 1
    state = produce(state, (draft) => {
      const challenges = draft.challenges.challenges;
      let count = 0;
      for (const key of Object.keys(challenges)) {
        if (count >= 5) break;
        const existing = challenges[key];
        if (existing) {
          existing.on = 1;
        }
        count++;
      }
    });
    const next = manager.update(state);
    expect(next.achievements.achievements.challenger?.unlocked).toBe(true);
  });

  it("challenger does NOT unlock when unique completions < 5", () => {
    let state = createInitialState();
    state = produce(state, (draft) => {
      const challenges = draft.challenges.challenges;
      let count = 0;
      for (const key of Object.keys(challenges)) {
        if (count >= 4) break;
        const existing = challenges[key];
        if (existing) {
          existing.on = 1;
        }
        count++;
      }
    });
    const next = manager.update(state);
    expect(next.achievements.achievements.challenger?.unlocked).toBe(false);
  });

  it("challenger star unlocks when total challenge completions >= 100", () => {
    let state = createInitialState();
    state = produce(state, (draft) => {
      const challenges = draft.challenges.challenges;
      const keys = Object.keys(challenges);
      // Give first challenge 100 completions
      const first = keys[0] ? challenges[keys[0]] : null;
      if (first) {
        first.on = 100;
      }
    });
    const next = manager.update(state);
    expect(next.achievements.achievements.challenger?.starUnlocked).toBe(true);
  });
});

// ── Story 9: Time-based achievement conditions (badges) ───────────────────────

describe("Story 9: Time-based achievement conditions (badges)", () => {
  const manager = new AchievementManager();

  it("badge lostDates unlocks when time.flux <= -5", () => {
    let state = createInitialState();
    state = produce(state, (draft) => {
      draft.time.flux = -5;
    });
    const next = manager.update(state);
    expect(next.achievements.badges.lostDates?.unlocked).toBe(true);
  });

  it("badge lostDates does NOT unlock when time.flux > -5", () => {
    let state = createInitialState();
    state = produce(state, (draft) => {
      draft.time.flux = -4;
    });
    const next = manager.update(state);
    expect(next.achievements.badges.lostDates?.unlocked).toBe(false);
  });

  it("badge buffet is a no-condition stub (stays locked)", () => {
    // Leviathan energy not yet tracked; badge stays locked
    const state = createInitialState();
    const next = manager.update(state);
    expect(next.achievements.badges.buffet?.unlocked).toBe(false);
  });
});

// ── Story 10: Kitten population badges ───────────────────────────────────────

describe("Story 10: Kitten population badges", () => {
  const manager = new AchievementManager();

  it("badge deadSpace unlocks when kittens.value >= 1000 and kittens.maxValue == 0", () => {
    let state = createInitialState();
    state = produce(state, (draft) => {
      draft.resources.kittens = { value: 1000, maxValue: 0 };
    });
    const next = manager.update(state);
    expect(next.achievements.badges.deadSpace?.unlocked).toBe(true);
    expect(next.achievements.badgesUnlocked).toBe(true);
  });

  it("badge deadSpace does NOT unlock when maxValue > 0", () => {
    let state = createInitialState();
    state = produce(state, (draft) => {
      draft.resources.kittens = { value: 1000, maxValue: 10 };
    });
    const next = manager.update(state);
    expect(next.achievements.badges.deadSpace?.unlocked).toBe(false);
  });

  it("badge reginaNoctis unlocks when kittens.value >= 500 and alicorn.value == 0", () => {
    let state = createInitialState();
    state = produce(state, (draft) => {
      draft.resources.kittens = { value: 500, maxValue: 999999 };
      draft.resources.alicorn = { value: 0, maxValue: 999999 };
    });
    const next = manager.update(state);
    expect(next.achievements.badges.reginaNoctis?.unlocked).toBe(true);
  });

  it("badge reginaNoctis does NOT unlock when alicorn.value > 0", () => {
    let state = createInitialState();
    state = produce(state, (draft) => {
      draft.resources.kittens = { value: 500, maxValue: 999999 };
      draft.resources.alicorn = { value: 1, maxValue: 999999 };
    });
    const next = manager.update(state);
    expect(next.achievements.badges.reginaNoctis?.unlocked).toBe(false);
  });
});

// ── Story 11: Save / load / reset for achievements state ─────────────────────

describe("Story 11: Save / load / reset for achievements state", () => {
  const manager = new AchievementManager();

  it("serialize includes achievements and badges fields", () => {
    const state = createInitialState();
    const s = serialize(state);
    expect(s.achievements).toBeDefined();
    expect(s.achievements?.badgesUnlocked).toBe(false);
    expect(Array.isArray(s.achievements?.achievements)).toBe(true);
    expect(Array.isArray(s.achievements?.badges)).toBe(true);
  });

  it("serialize includes unlocked state in achievements array", () => {
    let state = createInitialState();
    state = produce(state, (draft) => {
      draft.achievements.achievements.unicornConspiracy = { unlocked: true, starUnlocked: false };
    });
    const s = serialize(state);
    const ach = s.achievements?.achievements.find((a) => a.name === "unicornConspiracy");
    expect(ach?.unlocked).toBe(true);
    expect(ach?.starUnlocked).toBe(false);
  });

  it("load restores achievement unlocked state by name", () => {
    let state = createInitialState();
    state = produce(state, (draft) => {
      draft.achievements.achievements.unicornConspiracy = { unlocked: true, starUnlocked: true };
      draft.achievements.badgesUnlocked = true;
      draft.achievements.badges.lostDates = { unlocked: true };
    });
    const saved = manager.save(state);
    const base = createInitialState();
    const restored = manager.load(saved, base);
    expect(restored.achievements.achievements.unicornConspiracy?.unlocked).toBe(true);
    expect(restored.achievements.achievements.unicornConspiracy?.starUnlocked).toBe(true);
    expect(restored.achievements.badgesUnlocked).toBe(true);
    expect(restored.achievements.badges.lostDates?.unlocked).toBe(true);
  });

  it("load ignores unknown achievement names in save data", () => {
    const serialized = {
      achievements: {
        badgesUnlocked: false,
        achievements: [{ name: "unknownAchievement", unlocked: true, starUnlocked: false }],
        badges: [],
      },
    };
    const base = createInitialState();
    // Should not throw
    const restored = manager.load(serialized as Parameters<typeof manager.load>[0], base);
    expect(restored.achievements.achievements.unicornConspiracy?.unlocked).toBe(false);
  });

  it("load returns initial achievements when saved is null/invalid", () => {
    const base = createInitialState();
    const restored = manager.load(null as unknown as Parameters<typeof manager.load>[0], base);
    expect(restored.achievements.badgesUnlocked).toBe(false);
    expect(Object.keys(restored.achievements.achievements).length).toBe(30);
  });

  it("save uses fallback values when achievement entry missing from state", () => {
    // Create a state with missing achievement entry (simulates legacy save migration)
    const state = createInitialState();
    // Directly call save — all entries present so fallback not hit in normal flow
    // This tests the ?? fallback path by producing a state with sparse achievements
    const sparseState = produce(state, (draft) => {
      // Remove an entry so the fallback fires (set to undefined via type cast)
      (draft.achievements.achievements as Record<string, unknown>).unicornConspiracy = undefined;
    });
    const saved = manager.save(sparseState);
    const raw = saved as unknown as { achievements: Array<{ name: string; unlocked: boolean }> };
    const ach = raw.achievements.find((a) => a.name === "unicornConspiracy");
    expect(ach?.unlocked).toBe(false);
  });

  it("resetState sets all unlocked=false and badgesUnlocked=false", () => {
    let state = createInitialState();
    state = produce(state, (draft) => {
      draft.achievements.achievements.unicornConspiracy = { unlocked: true, starUnlocked: true };
      draft.achievements.badgesUnlocked = true;
    });
    const reset = manager.resetState(state);
    expect(reset.achievements.achievements.unicornConspiracy?.unlocked).toBe(false);
    expect(reset.achievements.achievements.unicornConspiracy?.starUnlocked).toBe(false);
    expect(reset.achievements.badgesUnlocked).toBe(false);
  });
});

// ── Story 12: Cross-manager integration test ──────────────────────────────────

describe("Story 12: Cross-manager integration test", () => {
  const managers = [
    new ResourceManager(),
    new BuildingManager(),
    new VillageManager(),
    new CalendarManager(),
    new ScienceManager(),
    new WorkshopManager(),
    new ReligionManager(),
    new PrestigeManager(),
    new ChallengeManager(),
    new SpaceManager(),
    new DiplomacyManager(),
    new TimeManager(),
    new AchievementManager(),
  ];

  it("unicornConspiracy unlocks in a full tick when unicorns resource > 0", () => {
    let state = resetState(managers);
    state = produce(state, (draft) => {
      draft.resources.unicorns = { value: 1, maxValue: 999999 };
    });
    const next = tick(state, managers);
    expect(next.achievements.achievements.unicornConspiracy?.unlocked).toBe(true);
  });

  it("serenity unlocks in full tick when kittens >= 50 and deadKittens == 0", () => {
    let state = resetState(managers);
    state = produce(state, (draft) => {
      draft.village.kittens = 50;
      draft.village.deadKittens = 0;
    });
    const next = tick(state, managers);
    expect(next.achievements.achievements.serenity?.unlocked).toBe(true);
  });

  it("jupiterAscending unlocks in full tick when orbitalLaunch.on > 0 and year <= 1", () => {
    let state = resetState(managers);
    state = produce(state, (draft) => {
      draft.space.programs.orbitalLaunch = { val: 1, on: 1, unlocked: true };
      draft.calendar.year = 0;
    });
    const next = tick(state, managers);
    expect(next.achievements.achievements.jupiterAscending?.unlocked).toBe(true);
  });

  it("AchievementManager is the last manager and integrates cleanly", () => {
    const state = resetState(managers);
    const next = tick(state, managers);
    // No achievements should unlock on a blank state
    for (const ach of Object.values(next.achievements.achievements)) {
      // theElderLegacy is time-locked — always false. Others depend on state.
      // Just check the structure is intact.
      expect(typeof ach.unlocked).toBe("boolean");
    }
  });
});
