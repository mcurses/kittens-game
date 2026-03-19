import type { Serializable } from "@kittens/shared";
import { getLimitedDR } from "./effects.js";
import type { Manager } from "./manager.js";
import type { GameState } from "./state.js";

// ── ChallengeDef ──────────────────────────────────────────────────────────────

export interface StackOptions {
  /** If true, use the effect base value directly (no multiplication by on). */
  readonly noStack?: boolean;
  /** Apply getLimitedDR(amount, LDRLimit) after stacking. */
  readonly LDRLimit?: number;
  /** Clamp the magnitude to this value (sign preserved). Applied after LDRLimit. */
  readonly capMagnitude?: number;
}

export interface ChallengeDef {
  readonly name: string;
  /** Whether the challenge is visible by default (without unlocking). */
  readonly defaultUnlocked: boolean;
  /**
   * Effects contributed when the challenge is NOT active (passive/reward state).
   * Stacked by `on` count with optional LDR.
   */
  readonly passiveEffects?: Readonly<Record<string, number>>;
  /**
   * Effects contributed when the challenge IS active (penalty state).
   * NOT stacked — use as-is or with special computation.
   */
  readonly activeEffects?: Readonly<Record<string, number>>;
  /** Stack options per effect name. */
  readonly stackOptions?: Readonly<Record<string, StackOptions>>;
}

// ── ChallengeEntry ────────────────────────────────────────────────────────────

export interface ChallengeEntry {
  readonly unlocked: boolean;
  /** Currently running this challenge. */
  readonly active: boolean;
  /** Completed at least once. */
  readonly researched: boolean;
  /** Number of completions. */
  readonly on: number;
  /** Player queued this for the next soft-reset (UI state). */
  readonly pending: boolean;
}

// ── ChallengeState ────────────────────────────────────────────────────────────

export interface ChallengeState {
  readonly challenges: Record<string, ChallengeEntry>;
}

// ── CHALLENGE_DEFS ────────────────────────────────────────────────────────────

export const CHALLENGE_DEFS: readonly ChallengeDef[] = [
  {
    name: "ironWill",
    defaultUnlocked: true,
    // ironWill has no stacked effects — it's a game mode flag
  },
  {
    name: "winterIsComing",
    defaultUnlocked: true,
    passiveEffects: {
      springCatnipRatio: 0.05,
      summerSolarFarmRatio: 0.05,
      coldChance: 0,
      coldHarshness: 0,
    },
    activeEffects: {
      springCatnipRatio: 0,
      summerSolarFarmRatio: 0,
      coldChance: 0.05,
      coldHarshness: -0.02,
    },
    stackOptions: {
      springCatnipRatio: { LDRLimit: 2 },
      summerSolarFarmRatio: { LDRLimit: 2 },
      coldChance: { LDRLimit: 0.825 },
      coldHarshness: { LDRLimit: 1 },
    },
  },
  {
    name: "anarchy",
    defaultUnlocked: true,
    passiveEffects: {
      masterSkillMultiplier: 0.2,
      kittenLaziness: 0,
    },
    activeEffects: {
      // masterSkillMultiplier is 0 when active (skills have no effect)
      masterSkillMultiplier: 0,
      // kittenLaziness is dynamic when active: 0.5 + getLimitedDR(0.05 * on, 0.25)
      // Computed separately in updateEffects
      kittenLaziness: 0,
    },
    stackOptions: {
      masterSkillMultiplier: { LDRLimit: 4 },
      kittenLaziness: { LDRLimit: 0.25, noStack: true },
    },
  },
  {
    name: "energy",
    defaultUnlocked: false,
    passiveEffects: {
      energyConsumptionRatio: -0.02,
      energyConsumptionIncrease: 0,
    },
    activeEffects: {
      energyConsumptionRatio: 0,
      energyConsumptionIncrease: 0.1,
    },
    stackOptions: {
      energyConsumptionRatio: { LDRLimit: 1 },
    },
  },
  {
    name: "atheism",
    defaultUnlocked: false,
    passiveEffects: {
      faithSolarRevolutionBoost: 0.1,
      cultureMaxChallenge: 0,
      scienceMaxChallenge: 0,
      manpowerMaxChallenge: 0,
      challengeHappiness: 0,
    },
    activeEffects: {
      faithSolarRevolutionBoost: 0,
      cultureMaxChallenge: -250,
      scienceMaxChallenge: -500,
      challengeHappiness: -0.5,
      manpowerMaxChallenge: -125,
    },
    stackOptions: {
      faithSolarRevolutionBoost: { LDRLimit: 4 },
    },
  },
  {
    name: "1000Years",
    defaultUnlocked: false,
    passiveEffects: {
      shatterCostReduction: -0.02,
      shatterCostIncreaseChallenge: 0,
      shatterVoidCost: 0,
      temporalPressCap: 10,
      heatEfficiency: 0.1,
      heatCompression: 0.05,
    },
    activeEffects: {
      shatterCostReduction: 0,
      shatterCostIncreaseChallenge: 0.5,
      shatterVoidCost: 0.4,
      temporalPressCap: 0,
      heatEfficiency: 0,
      heatCompression: 0,
    },
    stackOptions: {
      shatterCostReduction: { LDRLimit: 1 },
      heatEfficiency: { capMagnitude: 3 },
    },
  },
  {
    name: "blackSky",
    defaultUnlocked: false,
    passiveEffects: {
      corruptionBoostRatioChallenge: 0.1,
      bskSattelitePenalty: 0,
    },
    activeEffects: {
      corruptionBoostRatioChallenge: 0,
      // bskSattelitePenalty when active: 0.1 * on (computed dynamically in updateEffects)
      bskSattelitePenalty: 0,
    },
    stackOptions: {
      corruptionBoostRatioChallenge: { LDRLimit: 2 },
      bskSattelitePenalty: { LDRLimit: 30 },
    },
  },
  {
    name: "pacifism",
    defaultUnlocked: false,
    passiveEffects: {
      alicornPerTickRatio: 0.1,
      tradeKnowledge: 1,
      weaponEfficency: 0,
      policyFakeBought: 0,
      embassyFakeBought: 0,
      steamworksFakeBought: 0,
      tradeKnowledgeRatio: 0,
    },
    activeEffects: {
      alicornPerTickRatio: 0,
      tradeKnowledge: 0,
      weaponEfficency: -0.1,
      policyFakeBought: 1,
      embassyFakeBought: 1,
      steamworksFakeBought: 0, // dynamic: Math.floor(1.5 * on || 1) / (on || 1) — deferred
      tradeKnowledgeRatio: 0,
    },
    stackOptions: {
      tradeKnowledgeRatio: { noStack: true },
      weaponEfficency: { capMagnitude: 1 },
    },
  },
  {
    name: "unicornTears",
    defaultUnlocked: false,
    passiveEffects: {
      bonfireTearsPriceRatioChallenge: 0,
      scienceTearsPricesChallenge: 0,
      workshopTearsPricesChallenge: 0,
      cathPollutionPerTearOvercapped: 0,
      unicornsMax: 0,
      tearsMax: 0,
      alicornMax: 0,
      zigguratIvoryPriceRatio: -0.001,
      zigguratIvoryCostIncrease: 0.01,
    },
    activeEffects: {
      // bonfireTearsPriceRatioChallenge: computed dynamically (1.2 + 0.03 * on with LDR) — deferred
      bonfireTearsPriceRatioChallenge: 1.2,
      scienceTearsPricesChallenge: 0.25,
      workshopTearsPricesChallenge: 0.01,
      cathPollutionPerTearOvercapped: 3,
      unicornsMax: 10,
      tearsMax: 1,
      alicornMax: 0.2,
      zigguratIvoryPriceRatio: 0,
      zigguratIvoryCostIncrease: 0,
    },
    stackOptions: {
      bonfireTearsPriceRatioChallenge: { noStack: true, LDRLimit: 2.5 },
      scienceTearsPricesChallenge: { LDRLimit: 75 },
      workshopTearsPricesChallenge: { LDRLimit: 1 },
      cathPollutionPerTearOvercapped: { noStack: true },
      unicornsMax: { noStack: true },
      tearsMax: { noStack: true },
      alicornMax: { noStack: true },
      zigguratIvoryPriceRatio: { LDRLimit: 0.15 },
      zigguratIvoryCostIncrease: { LDRLimit: 1 },
    },
  },
  {
    name: "postApocalypse",
    defaultUnlocked: false,
    passiveEffects: {
      arrivalSlowdown: 0,
      cryochamberSupport: 1,
    },
    activeEffects: {
      arrivalSlowdown: 10,
      cryochamberSupport: 1,
    },
  },
];

// ── createInitialChallenges ───────────────────────────────────────────────────

export function createInitialChallenges(): ChallengeState {
  const challenges: Record<string, ChallengeEntry> = {};
  for (const def of CHALLENGE_DEFS) {
    challenges[def.name] = {
      unlocked: def.defaultUnlocked,
      active: false,
      researched: false,
      on: 0,
      pending: false,
    };
  }
  return { challenges };
}

// ── Aggregate query helpers ───────────────────────────────────────────────────

/** Returns the sum of all challenge completion counts. */
export function getCountCompletions(state: ChallengeState): number {
  let total = 0;
  for (const entry of Object.values(state.challenges)) {
    total += entry.on;
  }
  return total;
}

/** Returns the number of distinct challenges completed at least once. */
export function getCountUniqueCompletions(state: ChallengeState): number {
  let total = 0;
  for (const entry of Object.values(state.challenges)) {
    total += entry.researched ? 1 : 0;
  }
  return total;
}

/** Returns true if any challenge is currently active. */
export function anyChallengeActive(state: ChallengeState): boolean {
  for (const entry of Object.values(state.challenges)) {
    if (entry.active) return true;
  }
  return false;
}

// ── applyStartChallenge ───────────────────────────────────────────────────────

/**
 * START_CHALLENGE action: begin a challenge run.
 * Port of legacy togglePending / applyPending logic.
 */
export function applyStartChallenge(state: GameState, name: string): GameState {
  const def = CHALLENGE_DEFS.find((d) => d.name === name);
  if (!def) return state;

  const entry = state.challenges.challenges[name];
  if (!entry) return state;
  if (!entry.unlocked) return state;
  if (entry.active) return state;

  // Only one challenge can be active at a time
  if (anyChallengeActive(state.challenges)) return state;

  const newChallenges = {
    ...state.challenges.challenges,
    [name]: { ...entry, active: true, pending: false },
  };

  return {
    ...state,
    challenges: { challenges: newChallenges },
  };
}

// ── applyCompleteChallenge ────────────────────────────────────────────────────

/**
 * COMPLETE_CHALLENGE action: mark the active challenge as completed.
 * Port of legacy researchChallenge().
 */
export function applyCompleteChallenge(state: GameState, name: string): GameState {
  const def = CHALLENGE_DEFS.find((d) => d.name === name);
  if (!def) return state;

  const entry = state.challenges.challenges[name];
  if (!entry) return state;
  if (!entry.active) return state;

  const newChallenges = {
    ...state.challenges.challenges,
    [name]: {
      ...entry,
      researched: true,
      on: entry.on + 1,
      active: false,
    },
  };

  return {
    ...state,
    challenges: { challenges: newChallenges },
  };
}

// ── getChallengeEffectValue ───────────────────────────────────────────────────

/**
 * Compute the effective value of a single challenge effect for contribution to effectCache.
 * Port of the `getEffect` function in the legacy ChallengesManager constructor.
 */
export function getChallengeEffectValue(
  effectName: string,
  baseAmount: number,
  on: number,
  stackOptions?: StackOptions,
): number {
  const opts = stackOptions ?? {};

  if (opts.noStack) {
    // Use value directly from the challenge data with NO further modifications.
    // Port of legacy line 14-16: "if (stackOptions.noStack) { return amt; }"
    return baseAmount;
  }

  // Default: stack by multiplying by completion count
  let amt = baseAmount * on;

  if (opts.LDRLimit !== undefined) {
    amt = getLimitedDR(amt, opts.LDRLimit);
  }

  if (opts.capMagnitude !== undefined) {
    const cap = opts.capMagnitude;
    amt = Math.max(-cap, Math.min(cap, amt));
  }

  return amt;
}

// ── ChallengeManager ──────────────────────────────────────────────────────────

export class ChallengeManager implements Manager {
  update(state: GameState): GameState {
    // No per-tick challenge update needed in engine (completion conditions
    // are driven by server-side checks, not inline tick logic)
    return state;
  }

  updateEffects(state: GameState): Record<string, number> {
    const effects: Record<string, number> = {};

    for (const def of CHALLENGE_DEFS) {
      const entry = state.challenges.challenges[def.name];
      if (!entry) continue;

      if (entry.active) {
        // Use active effects (penalties)
        if (!def.activeEffects) continue;
        for (const [effectName, baseValue] of Object.entries(def.activeEffects)) {
          // Special case: anarchy kittenLaziness is dynamic when active
          if (def.name === "anarchy" && effectName === "kittenLaziness") {
            const dynamicLaziness =
              0.5 + getLimitedDR(0.05 * entry.on, 0.25);
            effects[effectName] = (effects[effectName] ?? 0) + dynamicLaziness;
            continue;
          }
          // Active effects are not stacked by on
          effects[effectName] = (effects[effectName] ?? 0) + baseValue;
        }
      } else if (entry.on > 0) {
        // Use passive effects (rewards), stacked by on
        if (!def.passiveEffects) continue;
        for (const [effectName, baseValue] of Object.entries(def.passiveEffects)) {
          const opts = def.stackOptions?.[effectName];
          const effectValue = getChallengeEffectValue(effectName, baseValue, entry.on, opts);
          effects[effectName] = (effects[effectName] ?? 0) + effectValue;
        }
      }
    }

    return effects;
  }

  resetState(state: GameState): GameState {
    // Full reset: all fields back to defaults (used by hard-reset)
    return { ...state, challenges: createInitialChallenges() };
  }

  /**
   * Soft-reset behavior: preserve on/researched, reset active/pending.
   * Called during SOFT_RESET to cancel in-progress challenges.
   */
  softReset(state: GameState): GameState {
    const newChallenges: Record<string, ChallengeEntry> = {};
    for (const [name, entry] of Object.entries(state.challenges.challenges)) {
      newChallenges[name] = {
        ...entry,
        active: false,
        pending: false,
      };
    }
    return { ...state, challenges: { challenges: newChallenges } };
  }

  save(state: GameState): Serializable {
    return {
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
    };
  }

  load(data: Serializable, state: GameState): GameState {
    if (!data || typeof data !== "object") return state;
    const d = data as Record<string, unknown>;

    const savedChallenges = d["challenges"];
    if (!savedChallenges || typeof savedChallenges !== "object") return state;

    const initial = createInitialChallenges();
    const challenges = { ...initial.challenges };

    for (const [name, raw] of Object.entries(
      savedChallenges as Record<string, unknown>,
    )) {
      if (!raw || typeof raw !== "object") continue;
      const e = raw as Record<string, unknown>;

      const unlocked =
        typeof e["unlocked"] === "boolean"
          ? e["unlocked"]
          : (challenges[name]?.unlocked ?? false);
      const active =
        typeof e["active"] === "boolean" ? e["active"] : false;
      const researched =
        typeof e["researched"] === "boolean" ? e["researched"] : false;
      let on = typeof e["on"] === "number" ? e["on"] : 0;
      const pending =
        typeof e["pending"] === "boolean" ? e["pending"] : false;

      // Legacy compatibility: researched=true + on=0 → set on=1
      if (researched && on === 0) {
        on = 1;
      }

      challenges[name] = { unlocked, active, researched, on, pending };
    }

    // Legacy save format: currentChallenge field
    const currentChallenge = d["currentChallenge"];
    if (typeof currentChallenge === "string" && challenges[currentChallenge]) {
      const cur = challenges[currentChallenge];
      challenges[currentChallenge] = { ...cur, active: true };
    }

    return {
      ...state,
      challenges: { challenges },
    };
  }
}

// ── applySoftResetChallenges ──────────────────────────────────────────────────

/**
 * Apply challenge-specific soft reset: preserve on/researched, cancel active/pending.
 * Called from applySoftReset in prestige.ts.
 */
export function applySoftResetChallenges(state: GameState): GameState {
  const mgr = new ChallengeManager();
  return mgr.softReset(state);
}
