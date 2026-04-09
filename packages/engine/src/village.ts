import type { Serializable } from "@kittens/shared";
import { produce } from "immer";
import type { Manager } from "./manager.js";
import { DAYS_PER_SEASON, SEASONS_PER_YEAR } from "./calendar.js";
import { calcResourcePerTick } from "./resources.js";
import type { GameState } from "./state.js";

// ── Types ─────────────────────────────────────────────────────────────────────

/** Static definition for a kitten job */
export interface JobDef {
  readonly name: string;
  /** Effect cache key this job contributes to, if the job has direct production. */
  readonly effectKey?: string;
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

// ── Luxury resource constants ─────────────────────────────────────────────────

/**
 * All non-common resource names that contribute to happiness.
 * Port of legacy village.js updateHappines() luxury loop:
 * resources where type != "common".
 * Uncommon: furs, ivory, spice
 * Rare: unicorns, alicorn, necrocorn, tears, karma
 * Exotic: relic, void, elderBox, wrappingPaper, blackcoin, bloodstone, tMythril
 */
export const LUXURY_RESOURCE_NAMES: ReadonlySet<string> = new Set([
  "furs", "ivory", "spice",
  "unicorns", "alicorn", "necrocorn", "tears", "karma",
  "relic", "void", "elderBox", "wrappingPaper", "blackcoin", "bloodstone", "tMythril",
]);

/**
 * Uncommon resources that also receive the consumableLuxuryHappiness bonus.
 * Port of legacy village.js luxury loop: type == "uncommon".
 */
export const UNCOMMON_RESOURCE_NAMES: ReadonlySet<string> = new Set(["furs", "ivory", "spice"]);

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
  { name: "hunter", effectKey: "catpowerPerTickBase", baseProduction: 0.06 },
  { name: "miner", effectKey: "mineralsPerTickBase", baseProduction: 0.05 },
  { name: "geologist", effectKey: "coalPerTickBase", baseProduction: 0.015 },
  { name: "priest", effectKey: "faithPerTickBase", baseProduction: 0.0015 },
  { name: "engineer", baseProduction: 0 },
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

// ── Pollution happiness ───────────────────────────────────────────────────────

const POL_LBASE = 10_000_000;

/**
 * Compute the happiness penalty from cathPollution.
 * Port of legacy buildings.js calculatePollutionEffects() → pollutionHappines term.
 */
export function computePollutionHappines(cathPollution: number): number {
  if (cathPollution <= 0) return 0;
  const pollutionLevel = Math.max(Math.floor(Math.log10(cathPollution * 10 / POL_LBASE)), 0);

  if (pollutionLevel >= 4) return -Math.log(cathPollution) * 1.2;
  if (pollutionLevel === 3) return -Math.log(cathPollution) * 1.18;
  if (pollutionLevel === 2) return -Math.log(cathPollution) * 1.08;
  if (pollutionLevel === 1) {
    // Linear ramp starting at 50% of level-1 range
    const halfThreshold = POL_LBASE * 10 / 2;
    return cathPollution >= halfThreshold ? -0.00000032 * (cathPollution - halfThreshold) : 0;
  }
  return 0;
}

// ── Happiness computation ─────────────────────────────────────────────────────

/**
 * Compute the village happiness ratio from the current game state and effect cache.
 *
 * Extracted so it can be called outside the tick loop (e.g. immediately after import).
 * Port of legacy VillageManager.updateHappines().
 */
export function computeHappiness(state: GameState): number {
  const kittens = state.village.kittens;
  let happinessPct = 100;

  // Unhappiness from population > 5
  const overPop = kittens - 5;
  if (overPop > 0) {
    const unhappinessRatio = state.effectCache.unhappinessRatio ?? 0;
    happinessPct -= overPop * 2 * (1 + unhappinessRatio);
  }

  // Environment effect: policy bonuses + pollution happiness
  // Port of legacy village.js getEnvironmentEffect()
  // = environmentHappinessBonus + environmentUnhappiness + pollutionHappines
  const pollutionHappines = computePollutionHappines(state.effectCache._cathPollution ?? 0);
  const environmentEffect =
    (state.effectCache.environmentHappinessBonus ?? 0) +
    (state.effectCache.environmentUnhappiness ?? 0) +
    pollutionHappines;

  happinessPct += (state.effectCache.happiness ?? 0) + environmentEffect + (state.effectCache.challengeHappiness ?? 0);

  const happinessPerLuxury = 10 + (state.effectCache.luxuryHappinessBonus ?? 0);
  const consumableLuxuryHappiness = state.effectCache.consumableLuxuryHappiness ?? 0;
  for (const name of LUXURY_RESOURCE_NAMES) {
    const res = state.resources[name];
    if (!res || res.value <= 0) continue;
    if (name === "elderBox" && (state.resources.wrappingPaper?.value ?? 0) > 0) continue;
    happinessPct += happinessPerLuxury;
    if (UNCOMMON_RESOURCE_NAMES.has(name)) happinessPct += consumableLuxuryHappiness;
  }

  if (state.calendar.festivalDays > 0) {
    happinessPct += 30 * (1 + (state.effectCache.festivalRatio ?? 0));
  }

  happinessPct += state.resources.karma?.value ?? 0;

  // Overpopulation penalty: kittens beyond housing capacity
  // Port of legacy village.js:831-835
  // Only apply when maxKittens is actually computed (> 0); a value of 0 means
  // the effect cache hasn't been built yet (e.g. no housing buildings).
  const maxKittens = state.effectCache.maxKittens ?? 0;
  if (maxKittens > 0) {
    const overpopulation = kittens - maxKittens;
    if (overpopulation > 0) {
      happinessPct -= overpopulation * 2;
    }
  }

  if (happinessPct < 25) happinessPct = 25;
  return happinessPct / 100;
}

// ── VillageManager ────────────────────────────────────────────────────────────

/**
 * Manages village population: kitten growth, death, and job validation.
 * Port of legacy VillageManager in village.js.
 */
export class VillageManager implements Manager {
  readonly sectionKey = "village";

  update(state: GameState): GameState {
    let { kittens, kittenProgress, jobs } = state.village;

    // ── Kitten growth ─────────────────────────────────────────────────────────
    const kittensPerTickBase = state.effectCache.kittensPerTickBase ?? 0;
    const kittenGrowthRatio = state.effectCache.kittenGrowthRatio ?? 0;
    const kittensPerTick = kittensPerTickBase * (1 + kittenGrowthRatio);
    // Legacy floors maxKittens for population cap checks (village.js sim.maxKittens is integer).
    const maxKittens = Math.floor(state.effectCache.maxKittens ?? 0);

    // Port of legacy sim.update(): only accumulate progress while below capacity.
    // When kittens reach maxKittens, reset progress to 0 (no backlog building up).
    if (kittens < maxKittens) {
      kittenProgress += kittensPerTick;
      if (kittenProgress >= 1) {
        kittens += 1;
        kittenProgress -= 1;
        if (kittens >= maxKittens) {
          kittenProgress = 0;
        }
      }
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
    // Delegate to computeHappiness() so import-time recomputation uses the same formula.
    // Note: update() has already applied kittens/jobs/deaths to state, so we build
    // a partial state with the updated village slice before computing happiness.
    const stateForHappiness = { ...state, village: { ...state.village, kittens, kittenProgress, jobs, deadKittens } };
    const happiness = computeHappiness(stateForHappiness);

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

    // ── Job production (scaled by happiness and workshop tool ratio) ──────────
    // Port of legacy game.js:3211: production *= (1 + getEffect(res.name + "JobRatio"))
    const happiness = village.happiness;
    for (const def of JOB_DEFS) {
      const job = village.jobs[def.name];
      if (!job || job.value === 0 || !def.effectKey || def.baseProduction === 0) continue;
      const resourceName = def.effectKey.replace("PerTickBase", "");
      const jobRatio = state.effectCache[`${resourceName}JobRatio`] ?? 0;
      const production = def.baseProduction * job.value * happiness * (1 + jobRatio);
      effects[def.effectKey] = (effects[def.effectKey] ?? 0) + production;
    }

    // ── Kitten consumption ────────────────────────────────────────────────────
    if (village.kittens > 0) {
      const catnipDemandRatio = state.effectCache.catnipDemandRatio ?? 0;
      const fursDemandRatio = state.effectCache.fursDemandRatio ?? 0;
      const ivoryDemandRatio = state.effectCache.ivoryDemandRatio ?? 0;
      const spiceDemandRatio = state.effectCache.spiceDemandRatio ?? 0;

      // catnipDemandWorkerRatioGlobal reduces catnip consumption for assigned worker kittens.
      // Port of legacy workshop.js "assistance" upgrade effect.
      // Unassigned kittens consume at full rate; assigned workers get the discount applied
      // proportionally to their share of the total population.
      const catnipDemandWorkerRatioGlobal = state.effectCache.catnipDemandWorkerRatioGlobal ?? 0;
      const assignedKittens = Math.min(totalAssignedKittens(village), village.kittens);
      const unassignedKittens = village.kittens - assignedKittens;
      const workerCatnipBase = -0.85 * (1 + catnipDemandRatio);
      const catnipCon =
        unassignedKittens * workerCatnipBase +
        assignedKittens * workerCatnipBase * (1 + catnipDemandWorkerRatioGlobal);
      effects.catnipPerTickCon = catnipCon;
      effects.fursPerTickCon = -0.01 * village.kittens * (1 + fursDemandRatio);
      effects.ivoryPerTickCon = -0.007 * village.kittens * (1 + ivoryDemandRatio);
      effects.spicePerTickCon = -0.001 * village.kittens * (1 + spiceDemandRatio);
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

// ── Hunt action ───────────────────────────────────────────────────────────────

/**
 * Sum of `n` independent uniform [0,1] random variables (Irwin-Hall distribution).
 * Port of legacy math.js irwinHallRandom().
 */
function irwinHallRandom(n: number): number {
  if (n <= 0) return 0;
  let result = 0;
  for (let i = 0; i < n; i++) {
    result += Math.random();
  }
  return result;
}

/**
 * Count of successes in `n` Bernoulli trials with probability `p` (Binomial distribution).
 * Port of legacy math.js binominalRandomInteger().
 */
function binomialRandom(n: number, p: number): number {
  if (p <= 0 || n <= 0) return 0;
  if (p >= 1) return n;
  let result = 0;
  for (let i = 0; i < n; i++) {
    if (Math.random() < p) result++;
  }
  return result;
}

/**
 * Add a resource amount, capping to maxValue when maxValue > 0.
 * Port of legacy addRes semantics.
 */
function addRes(
  resources: Record<string, { value: number; maxValue: number }>,
  name: string,
  amount: number,
): void {
  const entry = resources[name];
  if (!entry || amount <= 0) return;
  if (entry.maxValue > 0) {
    entry.value = Math.min(entry.value + amount, entry.maxValue);
  } else {
    entry.value += amount;
  }
}

/**
 * Apply a HUNT action: spend catpower to gain furs, ivory, and occasionally unicorns.
 * Cost: 100 catpower per squad (reduced by huntCatpowerDiscount effect).
 * Port of legacy village.js huntFraction(1) / gainHuntRes().
 */
export function applyHunt(state: GameState): GameState {
  const huntCost = 100 - (state.effectCache.huntCatpowerDiscount ?? 0);
  const catpower = state.resources.catpower?.value ?? 0;
  const squads = Math.floor(catpower / huntCost);
  if (squads < 1) return state;

  const hunterRatio = state.effectCache.hunterRatio ?? 0;

  const fursGained = Math.floor(
    80 * irwinHallRandom(squads) + 65 * hunterRatio * irwinHallRandom(squads),
  );
  const ivoryHunts = binomialRandom(squads, 0.45 + 0.02 * hunterRatio);
  const ivoryGained = Math.floor(
    50 * irwinHallRandom(ivoryHunts) + 40 * hunterRatio * irwinHallRandom(ivoryHunts),
  );
  const unicornsGained = binomialRandom(squads, 0.05);

  return produce(state, (draft) => {
    const mp = draft.resources.catpower;
    if (mp) mp.value = Math.max(0, mp.value - squads * huntCost);
    addRes(draft.resources, "furs", fursGained);
    addRes(draft.resources, "ivory", ivoryGained);
    if (unicornsGained > 0) addRes(draft.resources, "unicorns", unicornsGained);
  });
}

/**
 * Hold a festival: costs manpower:1500, culture:5000, parchment:2500.
 * Sets festivalDays = DAYS_PER_SEASON * SEASONS_PER_YEAR (= 400).
 * If "carnivals" perk is researched, adds to festivalDays instead of setting.
 */
export function applyHoldFestival(state: GameState): GameState {
  const manpower = state.resources.catpower?.value ?? 0;
  const culture = state.resources.culture?.value ?? 0;
  const parchment = state.resources.parchment?.value ?? 0;

  if (manpower < 1500 || culture < 5000 || parchment < 2500) return state;

  const festivalLength = DAYS_PER_SEASON * SEASONS_PER_YEAR;
  const carnivalsResearched = state.prestige?.perks?.carnivals?.researched === true;

  return produce(state, (draft) => {
    const mp = draft.resources.catpower;
    if (mp) mp.value = Math.max(0, mp.value - 1500);
    const cult = draft.resources.culture;
    if (cult) cult.value = Math.max(0, cult.value - 5000);
    const parch = draft.resources.parchment;
    if (parch) parch.value = Math.max(0, parch.value - 2500);
    if (carnivalsResearched) {
      draft.calendar.festivalDays = (draft.calendar.festivalDays ?? 0) + festivalLength;
    } else {
      draft.calendar.festivalDays = festivalLength;
    }
  });
}
