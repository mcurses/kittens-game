import type { Serializable } from "@kittens/shared";
import { produce } from "immer";
import type { Manager } from "./manager.js";
import { DAYS_PER_SEASON, SEASON_DEFS, SEASONS_PER_YEAR } from "./calendar.js";
import { calcResourcePerTick } from "./resources.js";
import type { GameState } from "./state.js";
import {
  type Accessory,
  type Appearance,
  type Body,
  type Breed,
  type Eyes,
  generateAppearance,
  hashString,
  mulberry32,
} from "./kittens/appearance.js";
import {
  type BereavementContext,
  type YearlyPeer,
  describeBereavement,
  describeDeath,
  describeFestival,
  describeJobLeft,
  describeLeaderAppointment,
  describeLeaderRemoval,
  describeParenthood,
  describePromote,
  describeSpawn,
  generateOrigin,
  generateTraitFlavor,
  generateYearlyEvent,
} from "./kittens/loreTemplates.js";

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

/** Kitten trait names matching legacy */
export type KittenTrait = "scientist" | "manager" | "engineer" | "merchant" | "wise" | "metallurgist" | "chemist" | "none";

/** Kinds of events that can land in a kitten's life timeline. */
export type LifeEventKind =
  | "spawn"
  | "promote"
  | "jobChange"
  | "jobLeft"
  | "leader"
  | "leaderRemoved"
  | "yearly"
  | "died"
  | "bereavement"
  | "parenthood"
  | "festival"
  | "milestone";

/** One entry in a kitten's life-events timeline. Chronological by year. */
export interface LifeEvent {
  readonly year: number;
  readonly kind: LifeEventKind;
  readonly text: string;
  /**
   * Partner kitten id for Romance / Coworker-Bond events. The Inspector
   * resolves the name live via `kittenNameById`. The text already embeds the
   * name statically as a fallback when the partner is no longer in the sim
   * (e.g. died).
   */
  readonly relatedKittenId?: string;
}

/** Individual kitten tracked by the village simulation */
export interface Kitten {
  readonly id: string;
  readonly name: string;
  readonly surname: string;
  readonly age: number;
  readonly trait: KittenTrait;
  readonly job: string | null;
  readonly skills: Record<string, number>;
  readonly rank: number;
  readonly exp: number;
  readonly isFavorite: boolean;
  readonly isLeader: boolean;
  /** In-game year this kitten was born (may be negative for older arrivals when game started). */
  readonly birthYear: number;
  /** Deterministic appearance traits (breed, body, eyes, accessory) used for portrait generation. */
  readonly appearance: Appearance;
  /** Backstory generated deterministically from id at spawn (2–3 sentences). */
  readonly originStory: string;
  /** One-line trait flavor; deterministic from id + trait. */
  readonly traitFlavor: string;
  /** Chronological life events. Spawn is always first. */
  readonly lifeEvents: readonly LifeEvent[];
  /** Path to unique portrait WEBP (e.g. "/assets/characters/k5.webp") or null → falls back to job-generic. */
  readonly portraitPath: string | null;
  /** Mother's kitten id (if born in-village from known parents). Null for legacy/seed kittens. */
  readonly motherId: string | null;
  /** Father's kitten id (if born in-village from known parents). Null for legacy/seed kittens. */
  readonly fatherId: string | null;
  /** Back-reference list of children sired/borne by this kitten. */
  readonly childIds: readonly string[];
}

/** Village state slice */
export interface VillageState {
  /** User-given name of the village. Defaults to "Bonfire" on a fresh run. */
  readonly name: string;
  readonly kittens: number;
  /** Fractional kitten growth accumulator. When >= 1, a new kitten spawns. */
  readonly kittenProgress: number;
  /** Map of all job states keyed by job name */
  readonly jobs: Record<string, JobEntry>;
  /** Individual kitten simulation array */
  readonly sim: readonly Kitten[];
  /** Total kittens that have died this run. Used by achievement conditions. */
  readonly deadKittens: number;
  /** Village happiness ratio (1.0 = baseline). Used by achievement conditions. */
  readonly happiness: number;
  /** Current leader kitten ID, or null if no leader. */
  readonly leader: string | null;
}

/** Default village name used at run start and on soft-reset. */
export const DEFAULT_VILLAGE_NAME = "Bonfire";

/** Max length for a user-chosen village name. */
export const MAX_VILLAGE_NAME_LENGTH = 40;

/**
 * Validate + normalize a candidate village name. Returns the trimmed name on
 * success, or `null` if it fails validation (empty, too long, or contains
 * disallowed characters).
 */
export function sanitizeVillageName(input: string): string | null {
  const trimmed = input.trim();
  if (trimmed.length === 0) return null;
  if (trimmed.length > MAX_VILLAGE_NAME_LENGTH) return null;
  // Allow letters, digits, spaces, dashes and apostrophes. Excludes control
  // chars and most punctuation to avoid weird UI/log injection.
  if (!/^[\p{L}\p{N} '\-]+$/u.test(trimmed)) return null;
  return trimmed;
}

// ── Kitten name pool (legacy village.js) ──────────────────────────────────

const KITTEN_NAMES = [
  "Angel", "Charlie", "Mittens", "Oreo", "Lily", "Ellie", "Amber", "Molly", "Jasper",
  "Oscar", "Theo", "Maddie", "Cassie", "Timber", "Meeko", "Micha", "Tami", "Plato",
  "Bea", "Cedar", "Cleo", "Dali", "Fiona", "Hazel", "Iggi", "Jasmine", "Kali", "Luna",
  "Reilly", "Reo", "Rikka", "Ruby", "Tammy", "Amy", "Henry",
];

const KITTEN_SURNAMES = [
  "Smoke", "Dust", "Chalk", "Fur", "Clay", "Paws", "Tails", "Sand", "Scratch", "Berry", "Shadow",
  "Ash", "Bark", "Bowl", "Brass", "Dusk", "Gaze", "Gleam", "Grass", "Moss", "Plaid", "Puff", "Rain",
  "Silk", "Silver", "Speck", "Stripes", "Tingle", "Wool", "Yarn", "Snail", "Rabbit",
];

const KITTEN_TRAITS: readonly KittenTrait[] = [
  "scientist", "manager", "engineer", "merchant", "wise", "metallurgist", "chemist", "none",
];

let nextKittenId = 0;

function isPersistedAppearance(v: unknown): v is Appearance {
  if (!v || typeof v !== "object") return false;
  const a = v as Record<string, unknown>;
  return typeof a.breed === "string" && typeof a.body === "string" && typeof a.eyes === "string"
    && (a.accessory === null || typeof a.accessory === "string");
}

/**
 * Generate a new kitten. When `parentCandidates` contains ≥2 adult kittens
 * (age ≥ 5), two are picked deterministically (mulberry32 keyed on new id) as
 * mother + father; the newborn arrives as a native (age 0), inherits a trait
 * via the rule below, and its spawn lifeEvent names the parents. Without
 * parents, falls back to the legacy seed-population behaviour (random
 * name/surname/trait/age).
 *
 * Trait inheritance: 40% mother's trait, 40% father's, 20% "none"
 * (a "wildcard"). Matches the existing lore that kittens are individuals,
 * not deterministic copies of their parents.
 */
export function generateKitten(
  currentYear: number = 0,
  parentCandidates?: readonly Kitten[],
): Kitten {
  const id = `k${++nextKittenId}`;
  // Adult parents: age ≥ 5 and not the same individual (set-dedup not needed
  // because sim entries already are distinct).
  const adults = parentCandidates?.filter((k) => k.age >= 5) ?? [];
  const canHaveParents = adults.length >= 2;

  const seededRng = mulberry32(hashString(`birth:${id}`));
  let motherId: string | null = null;
  let fatherId: string | null = null;
  let motherName: string | undefined;
  let fatherName: string | undefined;
  let inheritedTrait: KittenTrait | null = null;

  if (canHaveParents) {
    const i1 = Math.floor(seededRng() * adults.length);
    let i2 = Math.floor(seededRng() * adults.length);
    if (i2 === i1) i2 = (i2 + 1) % adults.length;
    const mother = adults[i1]!;
    const father = adults[i2]!;
    motherId = mother.id;
    fatherId = father.id;
    motherName = mother.name;
    fatherName = father.name;
    const roll = seededRng();
    if (roll < 0.4) inheritedTrait = mother.trait;
    else if (roll < 0.8) inheritedTrait = father.trait;
    else inheritedTrait = "none";
  }

  const name = KITTEN_NAMES[Math.floor(seededRng() * KITTEN_NAMES.length)] ?? "Unknown";

  // Surname pick: bias fresh-pick away from surnames already used in the village
  // so a small village does not collapse to two families. With parents, roll
  // 60% father / 25% mother / 15% fresh (kitten "chose own name"). Without
  // parents (seed-pop), always fresh.
  const usedSurnames = new Set<string>((parentCandidates ?? []).map((k) => k.surname));
  const unusedPool = KITTEN_SURNAMES.filter((s) => !usedSurnames.has(s));
  const freshPool = unusedPool.length > 0 ? unusedPool : KITTEN_SURNAMES;
  const freshSurname = freshPool[Math.floor(seededRng() * freshPool.length)] ?? "Unknown";
  let surname: string;
  if (canHaveParents && parentCandidates) {
    const surnameRoll = seededRng();
    const fatherSurname = parentCandidates.find((k) => k.id === fatherId)?.surname;
    const motherSurname = parentCandidates.find((k) => k.id === motherId)?.surname;
    if (surnameRoll < 0.60 && fatherSurname) {
      surname = fatherSurname;
    } else if (surnameRoll < 0.85 && motherSurname) {
      surname = motherSurname;
    } else {
      surname = freshSurname;
    }
  } else {
    surname = freshSurname;
  }

  const trait = inheritedTrait
    ?? KITTEN_TRAITS[Math.floor(seededRng() * KITTEN_TRAITS.length)]
    ?? "none";

  // Native-born (parents present): age 0 + currentYear birth. Legacy seed-pop
  // path keeps the random older-arrival distribution.
  let age: number;
  let birthYear: number;
  if (canHaveParents) {
    age = 0;
    birthYear = currentYear;
  } else {
    age = 5 + Math.floor(Math.random() * 10);
    if (Math.random() < 0.3) age += Math.floor(Math.random() * 30);
    birthYear = currentYear - age;
  }

  const appearance = generateAppearance(id);
  const originStory = generateOrigin(id, age);
  const traitFlavor = generateTraitFlavor(id, trait);
  const parents: { motherName?: string; fatherName?: string } = {};
  if (motherName) parents.motherName = motherName;
  if (fatherName) parents.fatherName = fatherName;
  const spawnText = describeSpawn(
    age,
    parents.motherName || parents.fatherName ? parents : undefined,
  );
  const lifeEvents: LifeEvent[] = [{ year: birthYear, kind: "spawn", text: spawnText }];
  return {
    id, name, surname, age, trait, job: null, skills: {}, rank: 0, exp: 0,
    isFavorite: false, isLeader: false,
    birthYear, appearance, originStory, traitFlavor, lifeEvents, portraitPath: null,
    motherId, fatherId, childIds: [],
  };
}

/** Append a life event to a kitten's timeline. Returns a new Kitten (pure). */
export function appendLifeEvent(k: Kitten, event: LifeEvent): Kitten {
  return { ...k, lifeEvents: [...k.lifeEvents, event] };
}

/**
 * Heuristic detector for the German lore strings stored in older saves.
 * Catches umlauts, ß, and a small set of high-signal German fragments that
 * appeared in the prior template pools. Cheap and good enough for migration.
 */
function looksGerman(text: string): boolean {
  if (/[äöüÄÖÜß]/.test(text)) return true;
  return /\b(Im Jahr|Geboren|Stammt|Kam vor|verbrachte|verliebte|Verstarb|Trauerte|Mutter von|Vater von|Genoss das|Tanzte|Erlag|Verhungerte|Schlief|wurde im Dorf|Wurde zum|Wurde dem|Verließ|jüngst|berufen|zugewiesen)\b/.test(text);
}

/**
 * Replace any German-looking strings on legacy-saved kittens with freshly
 * generated English equivalents. originStory and traitFlavor are fully
 * deterministic from (id, age, trait) so they round-trip cleanly. lifeEvents
 * are reconstructed kind-by-kind: spawn uses describeSpawn, yearly is
 * regenerated via generateYearlyEvent (same determinism keyed on
 * (kittenId, year)), and the rarer kinds fall back to a generic short phrase
 * since their original arguments aren't stored on the event.
 */
function migrateGermanLore(sim: readonly Kitten[]): Kitten[] {
  const peers: YearlyPeer[] = sim.map((k) => ({ id: k.id, name: k.name, surname: k.surname, age: k.age }));
  const nameById = new Map<string, string>(sim.map((k) => [k.id, k.name]));
  return sim.map((k) => {
    const newOrigin = looksGerman(k.originStory) ? generateOrigin(k.id, k.age) : k.originStory;
    const newFlavor = looksGerman(k.traitFlavor) ? generateTraitFlavor(k.id, k.trait) : k.traitFlavor;
    const otherPeers = peers.filter((p) => p.id !== k.id);
    const sameJob = k.job ? otherPeers.filter((p) => sim.find((s) => s.id === p.id)?.job === k.job) : [];
    const newEvents: LifeEvent[] = k.lifeEvents.map((e) => {
      if (!looksGerman(e.text)) return e;
      if (e.kind === "spawn") {
        const parents: { motherName?: string; fatherName?: string } = {};
        const m = k.motherId ? nameById.get(k.motherId) : undefined;
        const f = k.fatherId ? nameById.get(k.fatherId) : undefined;
        if (m) parents.motherName = m;
        if (f) parents.fatherName = f;
        const hasParent = parents.motherName || parents.fatherName;
        const text = describeSpawn(k.age, hasParent ? parents : undefined);
        return { year: e.year, kind: "spawn", text };
      }
      if (e.kind === "yearly") {
        const seasonIdx = Math.abs(hashString(`${k.id}:${e.year}`)) % SEASON_DEFS.length;
        const seasonName = SEASON_DEFS[seasonIdx]!.name;
        const ev = generateYearlyEvent(k.id, e.year, k.job, k.trait, seasonName, otherPeers, sameJob, k.age);
        return ev.relatedKittenId
          ? { year: e.year, kind: "yearly", text: ev.text, relatedKittenId: ev.relatedKittenId }
          : { year: e.year, kind: "yearly", text: ev.text };
      }
      // Rare kinds (jobChange, jobLeft, parenthood, festival, milestone, died,
      // bereavement, leader, promote) don't store the original arguments. Drop a
      // short generic English line that preserves the year + kind so the timeline
      // stays readable without lying about specifics.
      const fallback: Record<string, string> = {
        jobChange: "Took on new work.",
        jobLeft: "Left the post.",
        parenthood: "Became a parent.",
        festival: "Took part in the festival.",
        milestone: "Witnessed a village milestone.",
        died: "Passed on.",
        bereavement: "Grieved for a fellow villager.",
        leader: "Stepped up as leader.",
        leaderRemoved: "Stepped down as leader.",
        promote: "Was promoted.",
      };
      return { year: e.year, kind: e.kind, text: fallback[e.kind] ?? "A quiet year." };
    });
    return { ...k, originStory: newOrigin, traitFlavor: newFlavor, lifeEvents: newEvents };
  });
}

/**
 * Detect kittens that came in as legacy-import skeletons (Unknown name,
 * trait none, age 0 despite a real birthYear) and reanimate them with
 * deterministic real fields. Same kitten id always produces the same
 * regenerated name / trait / surname across loads. Job rebinding runs as a
 * second pass so the per-kitten `job` field matches the village.jobs counter.
 */
function reanimateSkeletonKittens(
  sim: readonly Kitten[],
  currentYear: number,
  jobsCounter: Record<string, JobEntry>,
): Kitten[] {
  function isSkeleton(k: Kitten): boolean {
    const nameDefault = !k.name || k.name === "Unknown";
    const surnameDefault = !k.surname || k.surname === "Unknown";
    const noTrait = k.trait === "none";
    const noAge = k.age === 0 && k.birthYear < currentYear - 1;
    return nameDefault && surnameDefault && noTrait && noAge;
  }
  const usedSurnames = new Set<string>(sim.map((k) => k.surname).filter((s) => s && s !== "Unknown"));
  const repaired = sim.map((k) => {
    if (!isSkeleton(k)) return k;
    const rng = mulberry32(hashString(`reanimate:${k.id}`));
    const newName = KITTEN_NAMES[Math.floor(rng() * KITTEN_NAMES.length)] ?? "Unknown";
    const unusedSurnames = KITTEN_SURNAMES.filter((s) => !usedSurnames.has(s));
    const surnamePool = unusedSurnames.length > 0 ? unusedSurnames : KITTEN_SURNAMES;
    const newSurname = surnamePool[Math.floor(rng() * surnamePool.length)] ?? "Unknown";
    usedSurnames.add(newSurname);
    const newTrait = KITTEN_TRAITS[Math.floor(rng() * KITTEN_TRAITS.length)] ?? "none";
    const newAge = Math.max(0, currentYear - k.birthYear);
    const newOrigin = generateOrigin(k.id, newAge);
    const newFlavor = generateTraitFlavor(k.id, newTrait);
    return {
      ...k,
      name: newName,
      surname: newSurname,
      age: newAge,
      trait: newTrait,
      originStory: newOrigin,
      traitFlavor: newFlavor,
    };
  });

  // Job rebind: when the village.jobs counter for "miner" says 30 but only 0
  // kittens have job === "miner", grant the first 30 unassigned kittens the job.
  // This heals the legacy-import case where counters survived but per-kitten
  // assignments didn't, without ever stealing a job from a kitten that already
  // has one.
  const assignedCount: Record<string, number> = {};
  for (const k of repaired) {
    if (k.job) assignedCount[k.job] = (assignedCount[k.job] ?? 0) + 1;
  }
  const unassigned = repaired.filter((k) => k.job === null).map((k) => k.id);
  const newJobById = new Map<string, string>();
  for (const def of JOB_DEFS) {
    const target = jobsCounter[def.name]?.value ?? 0;
    const have = assignedCount[def.name] ?? 0;
    const need = target - have;
    for (let i = 0; i < need && unassigned.length > 0; i++) {
      const id = unassigned.shift()!;
      newJobById.set(id, def.name);
    }
  }
  if (newJobById.size === 0) return repaired;
  return repaired.map((k) => {
    const newJob = newJobById.get(k.id);
    return newJob ? { ...k, job: newJob } : k;
  });
}

/**
 * For each kitten with only a spawn-event (legacy or first-load) and age ≥ 3,
 * generate 1–4 deterministic narrative events spread across their life so the
 * Inspector timeline carries the "was bisher geschah" feel the user expects.
 *
 * Deterministic via `mulberry32(hashString(kittenId))` → same kitten → same
 * backfilled story across loads. Idempotent: kittens with ≥ 2 events skip.
 *
 * Season is inferred deterministically per (kittenId, year) since legacy saves
 * don't record per-event season.
 */
function backfillBackstory(sim: readonly Kitten[], currentYear: number): Kitten[] {
  const peers: YearlyPeer[] = sim.map((k) => ({ id: k.id, name: k.name, surname: k.surname, age: k.age }));
  return sim.map((k) => {
    if (k.lifeEvents.length > 1) return k as Kitten;
    if (k.age < 3) return k as Kitten;
    const eventCount = Math.min(4, Math.floor(k.age / 3));
    if (eventCount <= 0) return k as Kitten;
    const earliest = k.birthYear + 2;
    const latest = Math.max(earliest, currentYear - 1);
    const span = Math.max(1, latest - earliest);
    const otherPeers = peers.filter((p) => p.id !== k.id);
    const sameJob = k.job ? otherPeers.filter((p) => {
      const peerKitten = sim.find((s) => s.id === p.id);
      return peerKitten?.job === k.job;
    }) : [];
    const added: LifeEvent[] = [];
    for (let i = 0; i < eventCount; i++) {
      const year = earliest + Math.floor((span * (i + 1)) / (eventCount + 1));
      const seasonIdx = Math.abs(hashString(`${k.id}:${year}`)) % SEASON_DEFS.length;
      const seasonName = SEASON_DEFS[seasonIdx]!.name;
      const ev = generateYearlyEvent(k.id, year, k.job, k.trait, seasonName, otherPeers, sameJob, k.age);
      const e: LifeEvent = ev.relatedKittenId
        ? { year, kind: "yearly", text: ev.text, relatedKittenId: ev.relatedKittenId }
        : { year, kind: "yearly", text: ev.text };
      added.push(e);
    }
    return { ...k, lifeEvents: [...k.lifeEvents, ...added].sort((a, b) => a.year - b.year) };
  });
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
    name: DEFAULT_VILLAGE_NAME,
    kittens: 0,
    kittenProgress: 0,
    jobs,
    sim: [],
    deadKittens: 0,
    happiness: 1.0,
    leader: null,
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

/**
 * Pick up to 3 survivors to bereave, deterministically per (victim.id).
 * Returns a map from survivor.id → bereavement context. Same-job comrades and
 * the village leader are weighted higher than arbitrary neighbours; if neither
 * exists, falls back to random "general" mourners. Replay-stable.
 */
function pickBereavementSample(
  sim: readonly Kitten[],
  victimIdx: number,
  leaderId: string | null,
): Map<string, BereavementContext> {
  const out = new Map<string, BereavementContext>();
  const victim = sim[victimIdx];
  if (!victim) return out;
  const others = sim.filter((_, i) => i !== victimIdx);
  if (others.length === 0) return out;
  const rng = mulberry32(hashString(`bereavement-sample:${victim.id}`));
  // Weight pool: job-comrade entries each appear twice, leader once, rest once.
  const pool: { id: string; context: BereavementContext }[] = [];
  for (const k of others) {
    if (victim.job && k.job === victim.job) {
      pool.push({ id: k.id, context: "job" }, { id: k.id, context: "job" });
    }
    if (k.id === leaderId) {
      pool.push({ id: k.id, context: "leader" });
    }
    pool.push({ id: k.id, context: "general" });
  }
  const targetCount = Math.min(3, others.length);
  let guard = 0;
  while (out.size < targetCount && guard < pool.length * 4) {
    guard += 1;
    const idx = Math.floor(rng() * pool.length);
    const pick = pool[idx]!;
    if (out.has(pick.id)) continue;
    out.set(pick.id, pick.context);
  }
  return out;
}

/**
 * Pick a kitten to die: prefer non-favorite, non-leader.
 * Returns index in sim array, or -1 if sim is empty.
 */
function pickDeathVictim(sim: readonly Kitten[]): number {
  if (sim.length === 0) return -1;
  // First: non-favorite, non-leader
  for (let i = 0; i < sim.length; i++) {
    const k = sim[i]!;
    if (!k.isFavorite && !k.isLeader) return i;
  }
  // Then: non-leader
  for (let i = 0; i < sim.length; i++) {
    if (!sim[i]!.isLeader) return i;
  }
  // Last resort: any
  return 0;
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
    let sim = [...state.village.sim];

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
        // Pass current sim as parent candidates: when ≥2 adults exist the
        // newborn gets parents and the parents get a "parenthood" lifeEvent.
        const newborn = generateKitten(state.calendar.year, sim);
        if (newborn.motherId || newborn.fatherId) {
          const year = state.calendar.year;
          const childName = newborn.name;
          sim = sim.map((k) => {
            if (k.id === newborn.motherId) {
              return {
                ...k,
                childIds: [...k.childIds, newborn.id],
                lifeEvents: [
                  ...k.lifeEvents,
                  { year, kind: "parenthood", text: describeParenthood(childName, "mother") },
                ],
              };
            }
            if (k.id === newborn.fatherId) {
              return {
                ...k,
                childIds: [...k.childIds, newborn.id],
                lifeEvents: [
                  ...k.lifeEvents,
                  { year, kind: "parenthood", text: describeParenthood(childName, "father") },
                ],
              };
            }
            return k;
          });
        }
        sim.push(newborn);
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
      // Remove a kitten: prefer non-favorite, non-leader
      const victim = pickDeathVictim(sim);
      if (victim >= 0) {
        const dead = sim[victim]!;
        // Community memory: log the death and append bereavement events to a
        // small deterministic sample of survivors before removing the victim.
        // Same-job comrades and the village leader are weighted higher than
        // arbitrary neighbours. Replay-stable via mulberry32 seed on
        // (victim.id, year).
        const year = state.calendar.year;
        const seasonName = SEASON_DEFS[state.calendar.season]?.name ?? "winter";
        const survivors = pickBereavementSample(sim, victim, state.village.leader);
        sim = sim.map((k, i) => {
          if (i === victim) {
            return {
              ...k,
              lifeEvents: [
                ...k.lifeEvents,
                { year, kind: "died", text: describeDeath(k.age, seasonName) },
              ],
            };
          }
          const context = survivors.get(k.id);
          if (!context) return k;
          const victimName = `${dead.name} ${dead.surname}`.trim();
          return {
            ...k,
            lifeEvents: [
              ...k.lifeEvents,
              { year, kind: "bereavement", text: describeBereavement(victimName, context) },
            ],
          };
        });
        sim = sim.filter((_, i) => i !== victim);
        if (dead.job) {
          jobs = { ...jobs, [dead.job]: { value: Math.max(0, (jobs[dead.job]?.value ?? 0) - 1) } };
        }
      } else {
        jobs = freeOneJobSlot(jobs);
      }
    }

    // ── Skill growth: kittens gain XP in their assigned job per tick ──────────
    sim = sim.map((k) => {
      if (!k.job) return k;
      const currentSkill = k.skills[k.job] ?? 0;
      if (currentSkill >= 20001) return k; // hard cap
      // Legacy: skill growth rate = 0.01 per tick (simplified)
      return { ...k, skills: { ...k.skills, [k.job]: Math.min(20001, currentSkill + 0.01) } };
    });

    // ── Happiness calculation ──────────────────────────────────────────────────
    const stateForHappiness = { ...state, village: { ...state.village, kittens, kittenProgress, jobs, sim, deadKittens } };
    const happiness = computeHappiness(stateForHappiness);

    return {
      ...state,
      village: { ...state.village, kittens, kittenProgress, jobs, sim, deadKittens, happiness },
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

    // ── Leader bonus ────────────────────────────────────────────────────────────
    if (village.leader) {
      const leader = village.sim.find((k) => k.id === village.leader);
      if (leader) {
        const bonus = getLeaderBonus(leader);
        if (bonus) {
          effects[bonus.type] = (effects[bonus.type] ?? 0) + bonus.value;
        }
      }
    }

    // ── Favorite bonuses (half-leader, capped one-per-trait) ─────────────────
    const favContrib = getFavoriteContributions(village.sim);
    for (const [key, value] of Object.entries(favContrib)) {
      effects[key] = (effects[key] ?? 0) + value;
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

    // Deserialize individual kittens. New lore/appearance fields are migrated
    // for old saves: when missing, derive deterministically from id so the same
    // kitten always gets the same backstory + appearance across loads.
    const currentYear = state.calendar?.year ?? 0;
    let sim: Kitten[] = [];
    if (Array.isArray(raw.sim)) {
      sim = (raw.sim as unknown[]).filter((k): k is Record<string, unknown> => k != null && typeof k === "object")
        .map((k) => {
          const id = typeof k.id === "string" ? k.id : `k${++nextKittenId}`;
          const age = typeof k.age === "number" ? k.age : 0;
          const trait = (typeof k.trait === "string" ? k.trait : "none") as KittenTrait;

          const birthYear = typeof k.birthYear === "number" ? k.birthYear : currentYear - age;
          const appearance = isPersistedAppearance(k.appearance)
            ? (k.appearance as Appearance)
            : generateAppearance(id);
          const originStory = typeof k.originStory === "string" ? k.originStory : generateOrigin(id, age);
          const traitFlavor = typeof k.traitFlavor === "string" ? k.traitFlavor : generateTraitFlavor(id, trait);
          const lifeEvents: readonly LifeEvent[] = Array.isArray(k.lifeEvents)
            ? (k.lifeEvents as unknown[])
                .filter((e): e is Record<string, unknown> => e != null && typeof e === "object")
                .map((e) => {
                  const base = {
                    year: typeof e.year === "number" ? e.year : 0,
                    kind: (typeof e.kind === "string" ? e.kind : "spawn") as LifeEventKind,
                    text: typeof e.text === "string" ? e.text : "",
                  };
                  return typeof e.relatedKittenId === "string"
                    ? { ...base, relatedKittenId: e.relatedKittenId }
                    : base;
                })
            : [{ year: birthYear, kind: "spawn", text: describeSpawn(age) }];
          const portraitPath = typeof k.portraitPath === "string" ? k.portraitPath : null;

          // Family lineage (Paket G). Old saves lack these, default to null/[].
          const motherId = typeof k.motherId === "string" ? k.motherId : null;
          const fatherId = typeof k.fatherId === "string" ? k.fatherId : null;
          const childIds: readonly string[] = Array.isArray(k.childIds)
            ? (k.childIds as unknown[]).filter((c): c is string => typeof c === "string")
            : [];
          return {
            id,
            name: typeof k.name === "string" ? k.name : "Unknown",
            surname: typeof k.surname === "string" ? k.surname : "Unknown",
            age,
            trait,
            job: typeof k.job === "string" ? k.job : null,
            skills: (k.skills && typeof k.skills === "object" && !Array.isArray(k.skills))
              ? k.skills as Record<string, number> : {},
            rank: typeof k.rank === "number" ? k.rank : 0,
            exp: typeof k.exp === "number" ? k.exp : 0,
            isFavorite: k.isFavorite === true,
            isLeader: k.isLeader === true,
            birthYear, appearance, originStory, traitFlavor, lifeEvents, portraitPath,
            motherId, fatherId, childIds,
          };
        });
    }

    const leader = typeof saved.leader === "string" ? saved.leader as string : null;
    const name = typeof raw.name === "string" && sanitizeVillageName(raw.name)
      ? (sanitizeVillageName(raw.name) as string)
      : initial.name;

    // Migrate German lore strings from older saves before backfill: origin,
    // trait flavor, and per-event text get regenerated in English when the
    // heuristic detector flags them. Yearly events stay deterministic across
    // the migration via generateYearlyEvent keyed on (kittenId, year).
    const englishSim = migrateGermanLore(sim);

    // Reanimate skeleton kittens left over from the legacy import: ones with
    // "Unknown" name, trait "none" and age 0 despite a real birthYear get
    // deterministic real names/traits/ages, then we rebind jobs so per-kitten
    // `job` matches the village.jobs counter.
    const livingSim = reanimateSkeletonKittens(englishSim, currentYear, jobs);

    // Retrofit lore: kittens with only a spawn-event and age ≥ 3 get 1–4
    // deterministic backstory events distributed across their life so the
    // Inspector timeline doesn't feel empty for legacy saves. Idempotent:
    // once events exist, this loop is a no-op on subsequent loads.
    const filledSim = backfillBackstory(livingSim, currentYear);

    return { ...state, village: { name, kittens, kittenProgress, jobs, sim: filledSim, deadKittens, happiness, leader } };
  }

  resetState(state: GameState): GameState {
    return { ...state, village: createInitialVillage() };
  }

  /** Age all kittens by 1 year. Called from calendar year tick. */
  static ageKittens(state: GameState): GameState {
    const newYear = state.calendar.year;
    const seasonName = SEASON_DEFS[state.calendar.season]?.name ?? "summer";
    const sim = state.village.sim.map((k) => {
      // 25% chance to append a yearly snippet, deterministic per (kittenId, year)
      // so replaying the same save doesn't drift.
      const eventRng = mulberry32(hashString(`yearly-roll:${k.id}:${newYear}`));
      if (eventRng() >= 0.25) {
        return { ...k, age: k.age + 1 };
      }
      const peers = state.village.sim.filter((p) => p.id !== k.id);
      const sameJob = k.job ? peers.filter((p) => p.job === k.job) : [];
      const ev = generateYearlyEvent(k.id, newYear, k.job, k.trait, seasonName, peers, sameJob, k.age);
      const newEvent: LifeEvent = ev.relatedKittenId
        ? { year: newYear, kind: "yearly", text: ev.text, relatedKittenId: ev.relatedKittenId }
        : { year: newYear, kind: "yearly", text: ev.text };
      return { ...k, age: k.age + 1, lifeEvents: [...k.lifeEvents, newEvent] };
    });
    return { ...state, village: { ...state.village, sim } };
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
export function applyHunt(state: GameState, amount?: number): GameState {
  const huntCost = 100 - (state.effectCache.huntCatpowerDiscount ?? 0);
  const catpower = state.resources.catpower?.value ?? 0;
  const maxSquads = Math.floor(catpower / huntCost);
  const squads = amount != null ? Math.min(amount, maxSquads) : maxSquads;
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
// ── Leader bonus ──────────────────────────────────────────────────────────────

interface LeaderBonus {
  type: string;
  value: number;
}

const LEADER_TRAIT_BONUSES: Record<string, { type: string; base: number }> = {
  engineer: { type: "craftBonus", base: 0.05 },
  merchant: { type: "tradeBonus", base: 0.03 },
  manager: { type: "huntBonus", base: 0.50 },
  scientist: { type: "scienceDiscount", base: 0.05 },
  wise: { type: "religionDiscount", base: 0.10 },
  metallurgist: { type: "smelterBonus", base: 0.10 },
  chemist: { type: "chemistBonus", base: 0.05 },
};

/**
 * Trait → preferred jobs, ordered: primary first, then secondary.
 * Used by `pickKittensForJob` to assign trait-matched kittens before fungible ones,
 * and by the UI to surface a "perfect match" indicator. Empty array = no affinity
 * (falls back to skill / order). All lore-driven: kittens become individuals
 * with vocations rather than fungible labor slots.
 */
export const TRAIT_JOB_AFFINITY: Record<KittenTrait, readonly string[]> = {
  scientist:    ["scholar"],
  metallurgist: ["miner", "geologist"],
  chemist:      ["geologist", "priest"],
  engineer:     ["engineer", "woodcutter"],
  merchant:     ["hunter"],
  manager:      ["farmer", "woodcutter"],
  wise:         ["priest"],
  none:         [],
};

/** Score: 2 = primary match, 1 = secondary, 0 = none. */
export function getJobAffinityScore(trait: KittenTrait, jobName: string): 0 | 1 | 2 {
  const list = TRAIT_JOB_AFFINITY[trait];
  if (!list || list.length === 0) return 0;
  if (list[0] === jobName) return 2;
  return list.includes(jobName) ? 1 : 0;
}

/**
 * Pick up to `count` unassigned kittens to fill `jobName`, preferring trait
 * affinity, then skill, then stable order. Returns kitten ids only. Callers
 * apply the assignment + lore lifeEvent themselves.
 */
export function pickKittensForJob(
  sim: readonly Kitten[],
  jobName: string,
  count: number,
): { id: string; score: 0 | 1 | 2 }[] {
  if (count <= 0) return [];
  const candidates = sim
    .filter((k) => k.job === null)
    .map((k) => ({
      id: k.id,
      score: getJobAffinityScore(k.trait, jobName),
      skill: k.skills[jobName] ?? 0,
    }))
    .sort((a, b) => b.score - a.score || b.skill - a.skill);
  return candidates.slice(0, count).map((c) => ({ id: c.id, score: c.score }));
}

export function getLeaderBonus(kitten: Kitten): LeaderBonus | null {
  const def = LEADER_TRAIT_BONUSES[kitten.trait];
  if (!def) return null;
  const scale = kitten.rank === 0 ? 1.0 : (kitten.rank + 1) / 1.4;
  return { type: def.type, value: def.base * scale };
}

/**
 * Per-trait contributions from favorite (non-leader) kittens. Each trait
 * counts at most once: the highest-ranked favorite of that trait wins,
 * with id as deterministic tiebreak. Bonus is half the leader value so
 * favorites feel meaningful but don't replace leader strategy.
 */
export function getFavoriteContributions(
  sim: readonly Kitten[],
): Record<string, number> {
  const applied = new Set<string>();
  const favs = sim
    .filter((k) => k.isFavorite && !k.isLeader && LEADER_TRAIT_BONUSES[k.trait])
    .slice()
    .sort((a, b) => b.rank - a.rank || a.id.localeCompare(b.id));
  const out: Record<string, number> = {};
  for (const fav of favs) {
    if (applied.has(fav.trait)) continue;
    applied.add(fav.trait);
    const bonus = getLeaderBonus(fav);
    if (!bonus) continue;
    out[bonus.type] = (out[bonus.type] ?? 0) + bonus.value * 0.5;
  }
  return out;
}

export function applySetLeader(state: GameState, kittenId: string): GameState {
  const idx = state.village.sim.findIndex((k) => k.id === kittenId);
  if (idx < 0) return state;

  const year = state.calendar.year;
  return produce(state, (draft) => {
    // Clear previous leader and log demotion event
    for (const k of draft.village.sim) {
      if (k.isLeader && k.id !== kittenId) {
        (k as { isLeader: boolean }).isLeader = false;
        (k as { lifeEvents: LifeEvent[] }).lifeEvents = [
          ...k.lifeEvents,
          { year, kind: "leaderRemoved", text: describeLeaderRemoval() },
        ];
      }
    }
    const k = draft.village.sim[idx]!;
    if (!k.isLeader) {
      (k as { isLeader: boolean }).isLeader = true;
      (k as { lifeEvents: LifeEvent[] }).lifeEvents = [
        ...k.lifeEvents,
        { year, kind: "leader", text: describeLeaderAppointment() },
      ];
    }
    (draft.village as { leader: string | null }).leader = kittenId;
  });
}

export function applyRemoveLeader(state: GameState): GameState {
  if (state.village.leader === null) return state;

  const year = state.calendar.year;
  return produce(state, (draft) => {
    for (const k of draft.village.sim) {
      if (k.isLeader) {
        (k as { isLeader: boolean }).isLeader = false;
        (k as { lifeEvents: LifeEvent[] }).lifeEvents = [
          ...k.lifeEvents,
          { year, kind: "leaderRemoved", text: describeLeaderRemoval() },
        ];
      }
    }
    (draft.village as { leader: string | null }).leader = null;
  });
}

/** Promote cost: 500 * 1.75^rank exp, 25 * (rank + 1) gold */
function promoteExpCost(rank: number): number {
  return Math.floor(500 * Math.pow(1.75, rank));
}
function promoteGoldCost(rank: number): number {
  return 25 * (rank + 1);
}

export function applyPromoteKitten(state: GameState, kittenId: string): GameState {
  const idx = state.village.sim.findIndex((k) => k.id === kittenId);
  if (idx < 0) return state;
  const kitten = state.village.sim[idx]!;
  const expCost = promoteExpCost(kitten.rank);
  const goldCost = promoteGoldCost(kitten.rank);
  if (kitten.exp < expCost) return state;
  if ((state.resources.gold?.value ?? 0) < goldCost) return state;

  const year = state.calendar.year;
  const newRank = kitten.rank + 1;
  return produce(state, (draft) => {
    const k = draft.village.sim[idx]!;
    (k as { rank: number }).rank = newRank;
    (k as { exp: number }).exp -= expCost;
    (k as { lifeEvents: LifeEvent[] }).lifeEvents = [
      ...k.lifeEvents,
      { year, kind: "promote", text: describePromote(newRank) },
    ];
    const gold = draft.resources.gold;
    if (gold) gold.value -= goldCost;
  });
}

export function applyToggleFavorite(state: GameState, kittenId: string): GameState {
  const idx = state.village.sim.findIndex((k) => k.id === kittenId);
  if (idx < 0) return state;

  return produce(state, (draft) => {
    const k = draft.village.sim[idx]!;
    (k as { isFavorite: boolean }).isFavorite = !k.isFavorite;
  });
}

/**
 * Set a kitten's unique portrait path. The path must point under
 * `/assets/characters/` and end with `.webp` to prevent injection of arbitrary
 * URLs into the UI.
 */
export function applySetKittenPortrait(
  state: GameState,
  kittenId: string,
  path: string | null,
): GameState {
  const idx = state.village.sim.findIndex((k) => k.id === kittenId);
  if (idx < 0) return state;
  if (path !== null) {
    if (!path.startsWith("/assets/characters/") || !path.endsWith(".webp")) return state;
  }
  return produce(state, (draft) => {
    const k = draft.village.sim[idx]!;
    (k as { portraitPath: string | null }).portraitPath = path;
  });
}

export function applyUnassignKitten(state: GameState, kittenId: string): GameState {
  const idx = state.village.sim.findIndex((k) => k.id === kittenId);
  if (idx < 0) return state;
  const kitten = state.village.sim[idx]!;
  if (kitten.job === null) return state;

  const jobName = kitten.job;
  const year = state.calendar.year;
  return produce(state, (draft) => {
    const k = draft.village.sim[idx]!;
    (k as { job: string | null }).job = null;
    (k as { lifeEvents: LifeEvent[] }).lifeEvents = [
      ...k.lifeEvents,
      { year, kind: "jobLeft", text: describeJobLeft(jobName, "unassigned") },
    ];
    const job = draft.village.jobs[jobName];
    if (job && job.value > 0) job.value -= 1;
  });
}

export function applyHoldFestival(state: GameState): GameState {
  const manpower = state.resources.catpower?.value ?? 0;
  const culture = state.resources.culture?.value ?? 0;
  const parchment = state.resources.parchment?.value ?? 0;

  if (manpower < 1500 || culture < 5000 || parchment < 2500) return state;

  const festivalLength = DAYS_PER_SEASON * SEASONS_PER_YEAR;
  const carnivalsResearched = state.prestige?.perks?.carnivals?.researched === true;

  const year = state.calendar.year;
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
    // Every kitten in the village remembers the festival, deterministic per
    // (kittenId, year) so replays produce identical lifeEvent text.
    for (const k of draft.village.sim) {
      (k as { lifeEvents: LifeEvent[] }).lifeEvents = [
        ...k.lifeEvents,
        { year, kind: "festival", text: describeFestival(k.id, year) },
      ];
    }
  });
}

/**
 * Append a milestone lifeEvent to 1-2 sim-kittens, prefering trait matches
 * for the milestone. Deterministic per (year + key). Used by the BUY_BUILDING
 * + RESEARCH handlers when something happens FOR THE FIRST TIME, so it stays
 * special and not spammy.
 */
export function applyMilestoneWitnesses(
  state: GameState,
  milestoneKey: string,
  text: (kittenId: string, year: number, name: string) => string,
  preferredTraits: readonly KittenTrait[],
  displayName: string,
): GameState {
  const sim = state.village.sim;
  if (sim.length === 0) return state;
  const year = state.calendar.year;
  const rng = mulberry32(hashString(`milestone:${milestoneKey}:${year}`));
  // Build a weighted pool: matching-trait kittens appear twice; others once.
  const pool: string[] = [];
  for (const k of sim) {
    pool.push(k.id);
    if (preferredTraits.includes(k.trait)) pool.push(k.id);
  }
  const witnesses = new Set<string>();
  const target = Math.min(2, sim.length);
  let guard = 0;
  while (witnesses.size < target && guard < pool.length * 4) {
    guard += 1;
    const id = pool[Math.floor(rng() * pool.length)]!;
    witnesses.add(id);
  }
  return produce(state, (draft) => {
    for (const k of draft.village.sim) {
      if (!witnesses.has(k.id)) continue;
      (k as { lifeEvents: LifeEvent[] }).lifeEvents = [
        ...k.lifeEvents,
        { year, kind: "milestone", text: text(k.id, year, displayName) },
      ];
    }
  });
}
