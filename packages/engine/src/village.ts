import type { Serializable } from "@kittens/shared";
import type { Manager } from "./manager.js";
import { calcResourcePerTick } from "./resources.js";
import type { GameState } from "./state.js";

// ── Types ─────────────────────────────────────────────────────────────────────

/** Static definition for a kitten job */
export interface JobDef {
  readonly name: string;
  /** Effect cache key this job contributes to */
  readonly effectKey: string;
  /** Per-kitten-per-tick production rate */
  readonly baseProduction: number;
}

/** Runtime state for a single job slot */
export interface JobEntry {
  readonly value: number;
}

/** Village state slice */
export interface VillageState {
  readonly kittens: number;
  /** Fractional kitten growth accumulator. When >= 1, a new kitten spawns. */
  readonly kittenProgress: number;
  /** Map of all job states keyed by job name */
  readonly jobs: Record<string, JobEntry>;
  /** Total kittens that have died this run. Used by achievement conditions. */
  readonly deadKittens: number;
  /** Village happiness ratio (1.0 = baseline). Used by achievement conditions. */
  readonly happiness: number;
}

// ── Job Definitions ───────────────────────────────────────────────────────────

/**
 * All kitten jobs with their base production rates.
 * Port of legacy VillageManager job definitions in village.js.
 *
 * Job production goes into PerTickBase so it IS scaled by building ratios
 * (e.g., aqueduct boosts catnipPerTickBase including farmer output).
 */
export const JOB_DEFS: readonly JobDef[] = [
  { name: "woodcutter", effectKey: "woodPerTickBase", baseProduction: 0.018 },
  { name: "farmer", effectKey: "catnipPerTickBase", baseProduction: 1.0 },
  { name: "scholar", effectKey: "sciencePerTickBase", baseProduction: 0.035 },
  { name: "hunter", effectKey: "manpowerPerTickBase", baseProduction: 0.06 },
  { name: "miner", effectKey: "mineralsPerTickBase", baseProduction: 0.05 },
  { name: "geologist", effectKey: "coalPerTickBase", baseProduction: 0.015 },
  { name: "priest", effectKey: "faithPerTickBase", baseProduction: 0.0015 },
];

// ── Factory ───────────────────────────────────────────────────────────────────

/**
 * Return a fresh VillageState with zero kittens and all jobs at 0.
 */
export function createInitialVillage(): VillageState {
  const jobs: Record<string, JobEntry> = {};
  for (const def of JOB_DEFS) {
    jobs[def.name] = { value: 0 };
  }
  return {
    kittens: 0,
    kittenProgress: 0,
    jobs,
    deadKittens: 0,
    happiness: 1.0,
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Return the total number of kittens currently assigned to any job.
 */
export function totalAssignedKittens(village: VillageState): number {
  let total = 0;
  for (const job of Object.values(village.jobs)) {
    total += job.value;
  }
  return total;
}

/**
 * Free one job slot when a kitten dies.
 * Reduces the first non-zero job by 1 (iterates JOB_DEFS order).
 * Port of legacy village.js kitten death job cleanup.
 */
function freeOneJobSlot(jobs: Record<string, JobEntry>): Record<string, JobEntry> {
  const newJobs = { ...jobs };
  for (const def of JOB_DEFS) {
    const job = newJobs[def.name];
    if (job && job.value > 0) {
      newJobs[def.name] = { value: job.value - 1 };
      return newJobs;
    }
  }
  return newJobs;
}

// ── VillageManager ────────────────────────────────────────────────────────────

/**
 * Manages village population: kitten growth, death, and job validation.
 * Port of legacy VillageManager in village.js.
 */
export class VillageManager implements Manager {
  update(state: GameState): GameState {
    let { kittens, kittenProgress, jobs } = state.village;

    // ── Kitten growth ─────────────────────────────────────────────────────────
    const kittensPerTickBase = state.effectCache.kittensPerTickBase ?? 0;
    const kittenGrowthRatio = state.effectCache.kittenGrowthRatio ?? 0;
    const kittensPerTick = kittensPerTickBase * (1 + kittenGrowthRatio);
    const maxKittens = state.effectCache.maxKittens ?? 0;

    kittenProgress += kittensPerTick;

    if (kittenProgress >= 1 && kittens < maxKittens) {
      kittens += 1;
      kittenProgress -= 1;
    }

    // ── Kitten death ──────────────────────────────────────────────────────────
    const catnip = state.resources.catnip ?? { value: 0, maxValue: 0 };
    const catnipDelta = calcResourcePerTick(state.effectCache, "catnip");

    let deadKittens = state.village.deadKittens;

    if (kittens > 0 && catnip.value + catnipDelta < 0) {
      kittens -= 1;
      deadKittens += 1;
      // Free a job slot for the dead kitten
      jobs = freeOneJobSlot(jobs);
    }

    // ── Happiness calculation ──────────────────────────────────────────────────
    // Port of legacy VillageManager.updateHappines():
    // starts at 100, 2% penalty per kitten above 5, plus effects, min 25%
    let happinessPct = 100;
    const unhappinessPerKitten = 2;
    const overPop = kittens - 5;
    if (overPop > 0) happinessPct -= overPop * unhappinessPerKitten;
    happinessPct += state.effectCache.happiness ?? 0;
    if (happinessPct < 25) happinessPct = 25;
    const happiness = happinessPct / 100;

    return {
      ...state,
      village: { ...state.village, kittens, kittenProgress, jobs, deadKittens, happiness },
    };
  }

  updateEffects(state: GameState): Record<string, number> {
    const { village } = state;
    const effects: Record<string, number> = {};

    // ── Base kitten arrival rate ───────────────────────────────────────────────
    // Port of legacy kittensPerTickBase: 0.01 (hardcoded constant on VillageManager)
    effects.kittensPerTickBase = 0.01;

    // ── Job production (scaled by happiness) ──────────────────────────────────
    const happiness = village.happiness;
    for (const def of JOB_DEFS) {
      const job = village.jobs[def.name];
      if (!job || job.value === 0) continue;
      const production = def.baseProduction * job.value * happiness;
      effects[def.effectKey] = (effects[def.effectKey] ?? 0) + production;
    }

    // ── Kitten consumption ────────────────────────────────────────────────────
    if (village.kittens > 0) {
      effects.catnipPerTickCon = -0.85 * village.kittens;
      effects.fursPerTickCon = -0.01 * village.kittens;
      effects.ivoryPerTickCon = -0.007 * village.kittens;
      effects.spicePerTickCon = -0.001 * village.kittens;
    }

    return effects;
  }

  save(state: GameState): Serializable {
    return state.village as unknown as Serializable;
  }

  load(saved: Serializable, state: GameState): GameState {
    if (!saved || typeof saved !== "object" || Array.isArray(saved)) {
      return { ...state, village: createInitialVillage() };
    }
    const raw = saved as Record<string, unknown>;
    const initial = createInitialVillage();

    const kittens = typeof raw.kittens === "number" ? raw.kittens : initial.kittens;
    const kittenProgress =
      typeof raw.kittenProgress === "number" ? raw.kittenProgress : initial.kittenProgress;

    const jobs: Record<string, JobEntry> = { ...initial.jobs };
    const rawJobs = raw.jobs;
    if (rawJobs && typeof rawJobs === "object" && !Array.isArray(rawJobs)) {
      const jobsObj = rawJobs as Record<string, unknown>;
      for (const def of JOB_DEFS) {
        const entry = jobsObj[def.name];
        if (entry && typeof entry === "object" && !Array.isArray(entry)) {
          const val = (entry as Record<string, unknown>).value;
          if (typeof val === "number") {
            jobs[def.name] = { value: val };
          }
        }
      }
    }

    const deadKittens = typeof raw.deadKittens === "number" ? raw.deadKittens : 0;
    const happiness = typeof raw.happiness === "number" ? raw.happiness : 1.0;

    return { ...state, village: { kittens, kittenProgress, jobs, deadKittens, happiness } };
  }

  resetState(state: GameState): GameState {
    return { ...state, village: createInitialVillage() };
  }
}
