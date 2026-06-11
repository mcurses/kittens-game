import { describe, expect, it } from "vitest";
import { applyAction } from "./actions.js";
import {
  CHALLENGE_DEFS,
  ChallengeManager,
  anyChallengeActive,
  applyCompleteChallenge,
  applySoftResetChallenges,
  applyStartChallenge,
  createInitialChallenges,
  getChallengeEffectValue,
  getCountCompletions,
  getCountUniqueCompletions,
} from "./challenges.js";
import { buildEffectCache } from "./effects.js";
import { getLimitedDR } from "./effects.js";
import {
  BuildingManager,
  CalendarManager,
  ChallengeManager as ChallengeManagerExport,
  PrestigeManager,
  ReligionManager,
  ResourceManager,
  ScienceManager,
  VillageManager,
  WorkshopManager,
} from "./index.js";
import { createInitialState } from "./state.js";
import { tick } from "./tick.js";

// ── Story 1: ChallengeState shape and initial values ──────────────────────────

describe("createInitialChallenges", () => {
  it("returns an object with a challenges record", () => {
    const c = createInitialChallenges();
    expect(c).toHaveProperty("challenges");
    expect(typeof c.challenges).toBe("object");
  });

  it("defaultUnlocked challenges start with unlocked: true", () => {
    const c = createInitialChallenges();
    for (const def of CHALLENGE_DEFS) {
      if (def.defaultUnlocked) {
        expect(c.challenges[def.name]?.unlocked).toBe(true);
      }
    }
  });

  it("non-defaultUnlocked challenges start with unlocked: false", () => {
    const c = createInitialChallenges();
    for (const def of CHALLENGE_DEFS) {
      if (!def.defaultUnlocked) {
        expect(c.challenges[def.name]?.unlocked).toBe(false);
      }
    }
  });

  it("all challenges start with active: false, researched: false, on: 0, pending: false", () => {
    const c = createInitialChallenges();
    for (const entry of Object.values(c.challenges)) {
      expect(entry.active).toBe(false);
      expect(entry.researched).toBe(false);
      expect(entry.on).toBe(0);
      expect(entry.pending).toBe(false);
    }
  });

  it("GameState has a challenges field", () => {
    const s = createInitialState();
    expect(s).toHaveProperty("challenges");
    expect(s.challenges).toHaveProperty("challenges");
  });

  it("ironWill, winterIsComing, anarchy are defaultUnlocked", () => {
    const c = createInitialChallenges();
    expect(c.challenges.ironWill?.unlocked).toBe(true);
    expect(c.challenges.winterIsComing?.unlocked).toBe(true);
    expect(c.challenges.anarchy?.unlocked).toBe(true);
  });
});

// ── Story 2: START_CHALLENGE action ──────────────────────────────────────────

describe("applyStartChallenge", () => {
  it("sets active: true for an unlocked challenge", () => {
    const s = createInitialState();
    const next = applyStartChallenge(s, "winterIsComing");
    expect(next.challenges.challenges.winterIsComing?.active).toBe(true);
  });

  it("returns unchanged if challenge not unlocked", () => {
    const s = createInitialState();
    // energy is not defaultUnlocked
    const next = applyStartChallenge(s, "energy");
    expect(next).toBe(s);
  });

  it("returns unchanged if challenge already active", () => {
    const s = createInitialState();
    const withActive = {
      ...s,
      challenges: {
        challenges: {
          ...s.challenges.challenges,
          winterIsComing: { ...s.challenges.challenges.winterIsComing!, active: true },
        },
      },
    };
    const next = applyStartChallenge(withActive, "winterIsComing");
    expect(next).toBe(withActive);
  });

  it("returns unchanged if another challenge is already active", () => {
    const s = createInitialState();
    const withActive = {
      ...s,
      challenges: {
        challenges: {
          ...s.challenges.challenges,
          anarchy: { ...s.challenges.challenges.anarchy!, active: true },
        },
      },
    };
    // Try to start winterIsComing while anarchy is active
    const next = applyStartChallenge(withActive, "winterIsComing");
    expect(next).toBe(withActive);
  });

  it("works via applyAction START_CHALLENGE", () => {
    const s = createInitialState();
    const next = applyAction(s, { type: "START_CHALLENGE", name: "winterIsComing" });
    expect(next.challenges.challenges.winterIsComing?.active).toBe(true);
  });
});

// ── Story 3: COMPLETE_CHALLENGE action ────────────────────────────────────────

describe("applyCompleteChallenge", () => {
  it("sets researched: true, increments on, sets active: false", () => {
    const s = createInitialState();
    const withActive = {
      ...s,
      challenges: {
        challenges: {
          ...s.challenges.challenges,
          winterIsComing: { ...s.challenges.challenges.winterIsComing!, active: true },
        },
      },
    };
    const next = applyCompleteChallenge(withActive, "winterIsComing");
    expect(next.challenges.challenges.winterIsComing?.researched).toBe(true);
    expect(next.challenges.challenges.winterIsComing?.on).toBe(1);
    expect(next.challenges.challenges.winterIsComing?.active).toBe(false);
  });

  it("returns unchanged if challenge not active", () => {
    const s = createInitialState();
    const next = applyCompleteChallenge(s, "winterIsComing");
    expect(next).toBe(s);
  });

  it("increments on each time challenge is completed", () => {
    const s = createInitialState();
    let state = {
      ...s,
      challenges: {
        challenges: {
          ...s.challenges.challenges,
          anarchy: {
            ...s.challenges.challenges.anarchy!,
            active: true,
            on: 3,
            researched: true,
          },
        },
      },
    };
    state = applyCompleteChallenge(state, "anarchy") as typeof state;
    expect(state.challenges.challenges.anarchy?.on).toBe(4);
  });

  it("getCountCompletions returns sum of all on values", () => {
    const c = createInitialChallenges();
    const modified = {
      challenges: {
        ...c.challenges,
        winterIsComing: { ...c.challenges.winterIsComing!, on: 5 },
        anarchy: { ...c.challenges.anarchy!, on: 3 },
      },
    };
    expect(getCountCompletions(modified)).toBe(8);
  });

  it("getCountUniqueCompletions returns count of researched challenges", () => {
    const c = createInitialChallenges();
    const modified = {
      challenges: {
        ...c.challenges,
        winterIsComing: { ...c.challenges.winterIsComing!, on: 5, researched: true },
        anarchy: { ...c.challenges.anarchy!, on: 3, researched: true },
      },
    };
    expect(getCountUniqueCompletions(modified)).toBe(2);
  });

  it("anyChallengeActive returns true when one is active", () => {
    const s = createInitialState();
    const withActive = {
      ...s.challenges,
      challenges: {
        ...s.challenges.challenges,
        anarchy: { ...s.challenges.challenges.anarchy!, active: true },
      },
    };
    expect(anyChallengeActive(withActive)).toBe(true);
  });

  it("works via applyAction COMPLETE_CHALLENGE", () => {
    const s = createInitialState();
    const withActive = {
      ...s,
      challenges: {
        challenges: {
          ...s.challenges.challenges,
          anarchy: { ...s.challenges.challenges.anarchy!, active: true },
        },
      },
    };
    const next = applyAction(withActive, { type: "COMPLETE_CHALLENGE", name: "anarchy" });
    expect(next.challenges.challenges.anarchy?.researched).toBe(true);
    expect(next.challenges.challenges.anarchy?.active).toBe(false);
  });
});

// ── Story 4: ChallengeManager.updateEffects ───────────────────────────────────

describe("ChallengeManager.updateEffects", () => {
  const mgr = new ChallengeManager();

  it("returns empty record when no challenges active or completed", () => {
    const s = createInitialState();
    const effects = mgr.updateEffects(s);
    // No completed challenges → no passive effects
    // No active challenges → no active effects
    expect(Object.keys(effects)).toHaveLength(0);
  });

  it("passive effects stack by on count: winterIsComing 5 completions", () => {
    const s = createInitialState();
    const withCompletions = {
      ...s,
      challenges: {
        challenges: {
          ...s.challenges.challenges,
          winterIsComing: {
            ...s.challenges.challenges.winterIsComing!,
            on: 5,
            researched: true,
          },
        },
      },
    };
    const effects = mgr.updateEffects(withCompletions);
    // springCatnipRatio: 0.05 * 5 = 0.25, LDRLimit: 2 → still 0.25 (well below limit)
    expect(effects.springCatnipRatio).toBeCloseTo(0.25);
  });

  it("passive effects apply LDR when beyond 75% of limit", () => {
    const s = createInitialState();
    // 100 completions × 0.05 = 5.0; LDRLimit 2 → LDR kicks in
    const withCompletions = {
      ...s,
      challenges: {
        challenges: {
          ...s.challenges.challenges,
          winterIsComing: {
            ...s.challenges.challenges.winterIsComing!,
            on: 100,
            researched: true,
          },
        },
      },
    };
    const effects = mgr.updateEffects(withCompletions);
    const expected = getLimitedDR(5.0, 2);
    expect(effects.springCatnipRatio).toBeCloseTo(expected);
  });

  it("active effects apply penalty values, not stacked", () => {
    const s = createInitialState();
    const withActive = {
      ...s,
      challenges: {
        challenges: {
          ...s.challenges.challenges,
          winterIsComing: {
            ...s.challenges.challenges.winterIsComing!,
            active: true,
            on: 5,
          },
        },
      },
    };
    const effects = mgr.updateEffects(withActive);
    // Active: springCatnipRatio = 0 (not stacked)
    expect(effects.springCatnipRatio).toBe(0);
    // Active: coldChance = 0.05
    expect(effects.coldChance).toBeCloseTo(0.05);
    // Active: coldHarshness = -0.02
    expect(effects.coldHarshness).toBeCloseTo(-0.02);
  });

  it("anarchy active: kittenLaziness is dynamic (0.5 + getLimitedDR(0.05 * on, 0.25))", () => {
    const s = createInitialState();
    const withActive = {
      ...s,
      challenges: {
        challenges: {
          ...s.challenges.challenges,
          anarchy: {
            ...s.challenges.challenges.anarchy!,
            active: true,
            on: 1,
          },
        },
      },
    };
    const effects = mgr.updateEffects(withActive);
    const expected = 0.5 + getLimitedDR(0.05 * 1, 0.25);
    expect(effects.kittenLaziness).toBeCloseTo(expected);
  });

  it("anarchy passive: masterSkillMultiplier stacks with LDR limit 4", () => {
    const s = createInitialState();
    const withCompletions = {
      ...s,
      challenges: {
        challenges: {
          ...s.challenges.challenges,
          anarchy: {
            ...s.challenges.challenges.anarchy!,
            on: 20,
            researched: true,
          },
        },
      },
    };
    const effects = mgr.updateEffects(withCompletions);
    // 0.2 * 20 = 4.0; LDRLimit: 4 → getLimitedDR(4, 4) = 3.25
    const expected = getLimitedDR(4.0, 4);
    expect(effects.masterSkillMultiplier).toBeCloseTo(expected);
  });
});

// ── Story 5: getChallengeEffectValue ──────────────────────────────────────────

describe("getChallengeEffectValue", () => {
  it("stacks by multiplying base by on", () => {
    expect(getChallengeEffectValue("x", 0.05, 5)).toBeCloseTo(0.25);
  });

  it("noStack: returns base value directly without multiplying", () => {
    expect(getChallengeEffectValue("x", 0.5, 100, { noStack: true })).toBeCloseTo(0.5);
  });

  it("LDRLimit: applies getLimitedDR after stacking", () => {
    const expected = getLimitedDR(0.05 * 100, 2);
    expect(getChallengeEffectValue("x", 0.05, 100, { LDRLimit: 2 })).toBeCloseTo(expected);
  });

  it("capMagnitude: clamps magnitude while preserving sign (positive)", () => {
    // 0.1 * 15 = 1.5; capped to 1.0
    expect(getChallengeEffectValue("x", 0.1, 15, { capMagnitude: 1 })).toBeCloseTo(1.0);
  });

  it("capMagnitude: clamps magnitude while preserving sign (negative)", () => {
    // -0.1 * 15 = -1.5; capped magnitude to 1.0 → -1.0
    expect(getChallengeEffectValue("x", -0.1, 15, { capMagnitude: 1 })).toBeCloseTo(-1.0);
  });

  it("LDRLimit + capMagnitude: LDR applied first, then cap", () => {
    // 0.1 * 40 = 4.0; getLimitedDR(4, 3) = 2.75; cap(2.75, 3) = 2.75
    const afterLDR = getLimitedDR(0.1 * 40, 3);
    expect(getChallengeEffectValue("x", 0.1, 40, { LDRLimit: 3, capMagnitude: 3 })).toBeCloseTo(
      afterLDR,
    );
  });

  it("noStack: returns base value directly, ignoring LDRLimit (matches legacy line 14-16)", () => {
    // Legacy: "if (stackOptions.noStack) { return amt; }" — no LDR applied
    expect(getChallengeEffectValue("x", 0.5, 100, { noStack: true, LDRLimit: 0.25 })).toBeCloseTo(
      0.5,
    );
  });
});

// ── Story 6: SOFT_RESET integration ──────────────────────────────────────────

describe("SOFT_RESET and challenges", () => {
  const managers = [
    new ResourceManager(),
    new BuildingManager(),
    new VillageManager(),
    new CalendarManager(),
    new ScienceManager(),
    new WorkshopManager(),
    new ReligionManager(),
    new PrestigeManager(),
    new ChallengeManagerExport(),
  ];

  it("SOFT_RESET sets active: false for active challenges", () => {
    const s = createInitialState();
    const withActive = {
      ...s,
      challenges: {
        challenges: {
          ...s.challenges.challenges,
          anarchy: { ...s.challenges.challenges.anarchy!, active: true },
        },
      },
    };
    const next = applyAction(withActive, { type: "SOFT_RESET" }, managers);
    expect(next.challenges.challenges.anarchy?.active).toBe(false);
  });

  it("SOFT_RESET preserves on and researched", () => {
    const s = createInitialState();
    const withCompletions = {
      ...s,
      challenges: {
        challenges: {
          ...s.challenges.challenges,
          winterIsComing: {
            ...s.challenges.challenges.winterIsComing!,
            on: 5,
            researched: true,
          },
        },
      },
    };
    const next = applyAction(withCompletions, { type: "SOFT_RESET" }, managers);
    expect(next.challenges.challenges.winterIsComing?.on).toBe(5);
    expect(next.challenges.challenges.winterIsComing?.researched).toBe(true);
  });

  it("SOFT_RESET sets pending: false", () => {
    const s = createInitialState();
    const withPending = {
      ...s,
      challenges: {
        challenges: {
          ...s.challenges.challenges,
          anarchy: { ...s.challenges.challenges.anarchy!, pending: true },
        },
      },
    };
    const next = applyAction(withPending, { type: "SOFT_RESET" }, managers);
    expect(next.challenges.challenges.anarchy?.pending).toBe(false);
  });
});

// ── Story 7: Save / load / reset ─────────────────────────────────────────────

describe("ChallengeManager save/load/reset", () => {
  const mgr = new ChallengeManager();

  it("save includes challenges field", () => {
    const s = createInitialState();
    const saved = mgr.save(s);
    expect(saved).toHaveProperty("challenges");
  });

  it("load restores challenge states", () => {
    const s = createInitialState();
    const data = {
      challenges: {
        winterIsComing: { unlocked: true, active: false, researched: true, on: 5, pending: false },
        anarchy: { unlocked: true, active: true, researched: false, on: 0, pending: false },
      },
    };
    const loaded = mgr.load(data, s);
    expect(loaded.challenges.challenges.winterIsComing?.on).toBe(5);
    expect(loaded.challenges.challenges.winterIsComing?.researched).toBe(true);
    expect(loaded.challenges.challenges.anarchy?.active).toBe(true);
  });

  it("resetState resets all challenge fields to initial values", () => {
    const s = createInitialState();
    const withData = {
      ...s,
      challenges: {
        challenges: {
          ...s.challenges.challenges,
          winterIsComing: {
            unlocked: true,
            active: true,
            researched: true,
            on: 10,
            pending: true,
          },
        },
      },
    };
    const reset = mgr.resetState(withData);
    expect(reset.challenges.challenges.winterIsComing).toEqual({
      unlocked: true,
      active: false,
      researched: false,
      on: 0,
      pending: false,
    });
  });

  it("load with missing challenges field initializes to defaults", () => {
    const s = createInitialState();
    const loaded = mgr.load({}, s);
    expect(loaded.challenges.challenges.winterIsComing?.on).toBe(0);
    expect(loaded.challenges.challenges.ironWill?.unlocked).toBe(true);
  });

  it("softReset method preserves on/researched, cancels active/pending", () => {
    const s = createInitialState();
    const withData = {
      ...s,
      challenges: {
        challenges: {
          ...s.challenges.challenges,
          anarchy: { unlocked: true, active: true, researched: true, on: 7, pending: true },
        },
      },
    };
    const reset = applySoftResetChallenges(withData);
    expect(reset.challenges.challenges.anarchy?.on).toBe(7);
    expect(reset.challenges.challenges.anarchy?.researched).toBe(true);
    expect(reset.challenges.challenges.anarchy?.active).toBe(false);
    expect(reset.challenges.challenges.anarchy?.pending).toBe(false);
  });

  it("legacy compatibility: researched=true + on=0 → on becomes 1", () => {
    const s = createInitialState();
    const data = {
      challenges: {
        anarchy: { unlocked: true, active: false, researched: true, on: 0, pending: false },
      },
    };
    const loaded = mgr.load(data, s);
    expect(loaded.challenges.challenges.anarchy?.on).toBe(1);
  });

  it("legacy compatibility: currentChallenge field sets active on that challenge", () => {
    const s = createInitialState();
    const data = {
      challenges: {
        anarchy: { unlocked: true, active: false, researched: false, on: 0, pending: false },
      },
      currentChallenge: "anarchy",
    };
    const loaded = mgr.load(data, s);
    expect(loaded.challenges.challenges.anarchy?.active).toBe(true);
  });
});

// ── Story 8: Cross-manager integration ───────────────────────────────────────

describe("ChallengeManager cross-manager integration", () => {
  const managers = [
    new ResourceManager(),
    new BuildingManager(),
    new VillageManager(),
    new CalendarManager(),
    new ScienceManager(),
    new WorkshopManager(),
    new ReligionManager(),
    new PrestigeManager(),
    new ChallengeManagerExport(),
  ];

  it("tick() advances without error when ChallengeManager is registered", () => {
    const s = createInitialState();
    expect(() => tick(s, managers)).not.toThrow();
  });

  it("anarchy active → effectCache contains kittenLaziness effect", () => {
    const s = createInitialState();
    const withActive = {
      ...s,
      challenges: {
        challenges: {
          ...s.challenges.challenges,
          anarchy: {
            ...s.challenges.challenges.anarchy!,
            active: true,
            on: 1,
          },
        },
      },
    };
    const effects = buildEffectCache(managers, withActive);
    expect(effects.kittenLaziness).toBeGreaterThan(0);
  });

  it("winterIsComing 5 completions → effectCache contains springCatnipRatio", () => {
    const s = createInitialState();
    const withCompletions = {
      ...s,
      challenges: {
        challenges: {
          ...s.challenges.challenges,
          winterIsComing: {
            ...s.challenges.challenges.winterIsComing!,
            on: 5,
            researched: true,
          },
        },
      },
    };
    const effects = buildEffectCache(managers, withCompletions);
    expect(effects.springCatnipRatio).toBeCloseTo(0.25); // 0.05 * 5 = 0.25, no LDR at this level
  });

  it("SOFT_RESET with active challenge: active becomes false, on preserved", () => {
    const s = createInitialState();
    const withState = {
      ...s,
      challenges: {
        challenges: {
          ...s.challenges.challenges,
          winterIsComing: {
            ...s.challenges.challenges.winterIsComing!,
            active: true,
            on: 3,
            researched: true,
          },
        },
      },
    };
    const next = applyAction(withState, { type: "SOFT_RESET" }, managers);
    expect(next.challenges.challenges.winterIsComing?.active).toBe(false);
    expect(next.challenges.challenges.winterIsComing?.on).toBe(3);
  });
});
