// JobsPanel — displays jobs with assign/unassign stepper controls
import type { GameStateResponse } from "@kittens/api-spec";
import { deriveUiVisibility } from "@kittens/engine";
import React, { useState } from "react";
import type { JobEntity, KittenEntity } from "./InspectorContext.js";
import { useInspector } from "./InspectorContext.js";
import { kittenAvatarPath } from "./kittenAvatar.js";
import { PlaceholderImage } from "./PlaceholderImage.js";
import { useSlot } from "./SlotContext.js";
import { ResourceIcon } from "./ui/index.js";
import { JOB_FLAVOR } from "./flavorText.js";
import { buildHappinessEntity } from "./happinessInspector.js";
import { useGameAction } from "./useGameAction.js";
import { deriveVillageStage } from "./villageStage.js";
import { RenameVillageDialog } from "./RenameVillageDialog.js";

interface JobEntry {
  name: string;
  value: number;
  unlocked: boolean;
}

/** Per-kitten-per-tick production for each job — matches engine JOB_DEFS */
const JOB_MODIFIERS: Record<string, Array<{ resource: string; perTick: number }>> = {
  woodcutter: [{ resource: "wood", perTick: 0.018 }],
  farmer: [{ resource: "catnip", perTick: 1.0 }],
  scholar: [{ resource: "science", perTick: 0.035 }],
  hunter: [{ resource: "catpower", perTick: 0.06 }],
  miner: [{ resource: "minerals", perTick: 0.05 }],
  geologist: [{ resource: "coal", perTick: 0.015 }],
  priest: [{ resource: "faith", perTick: 0.0015 }],
  engineer: [],
};

const JOB_DESCRIPTIONS: Record<string, string> = {
  woodcutter: "Produces wood for construction",
  farmer: "Grows catnip for the village",
  scholar: "Conducts research to advance science",
  hunter: "Gathers catpower for hunting expeditions",
  miner: "Extracts minerals from the earth",
  geologist: "Surveys land for coal deposits",
  priest: "Offers prayers to generate faith",
  engineer: "Operates automated crafting machinery",
};

function buildJobEntity(name: string): JobEntity {
  return {
    kind: "job",
    name,
    description: JOB_DESCRIPTIONS[name],
    flavor: JOB_FLAVOR[name],
    modifiers: JOB_MODIFIERS[name] ?? [],
  };
}

interface CensusKitten {
  id: string;
  name: string;
  surname: string;
  age: number;
  trait: string;
  job: string | null;
  skills: Record<string, number>;
  rank: number;
  exp: number;
  isFavorite: boolean;
  isLeader: boolean;
  // Lore fields — present on new saves and back-filled on migration in the engine.
  birthYear?: number;
  appearance?: { breed: string; body: string; eyes: string; accessory: string | null };
  originStory?: string;
  traitFlavor?: string;
  lifeEvents?: Array<{ year: number; kind: string; text: string; relatedKittenId?: string }>;
  portraitPath?: string | null;
  motherId?: string | null;
  fatherId?: string | null;
  childIds?: readonly string[];
}

function buildKittenEntity(k: CensusKitten, kittenNameById?: Record<string, string>): KittenEntity {
  return {
    kind: "kitten",
    id: k.id,
    name: k.name,
    surname: k.surname,
    age: k.age,
    birthYear: k.birthYear ?? 0,
    trait: k.trait,
    job: k.job,
    rank: k.rank,
    exp: k.exp,
    isFavorite: k.isFavorite,
    isLeader: k.isLeader,
    appearance: k.appearance ?? { breed: "tabby", body: "slim", eyes: "large-amber", accessory: null },
    originStory: k.originStory ?? "",
    traitFlavor: k.traitFlavor ?? "",
    lifeEvents: k.lifeEvents ?? [],
    portraitPath: k.portraitPath ?? null,
    motherId: k.motherId ?? null,
    fatherId: k.fatherId ?? null,
    ...(k.childIds && k.childIds.length > 0 ? { childIds: k.childIds } : {}),
    ...(kittenNameById ? { kittenNameById } : {}),
  };
}

const CENSUS_PAGE_SIZE_CARDS = 10;
const CENSUS_PAGE_SIZE_COMPACT = 50;
/** Population threshold at which Census auto-switches to the compact row mode. */
const CENSUS_COMPACT_THRESHOLD = 100;
/** Number of Featured Citizens to display in the top-strip when compact mode is active. */
const FEATURED_COUNT = 5;

type CensusFilterPill = "featured" | "veterans" | "rookies" | "free";

/** First non-spawn life event (newest first), or null if only the spawn event exists. */
function newestLifeEventText(k: CensusKitten): string | null {
  const events = k.lifeEvents ?? [];
  for (let i = events.length - 1; i >= 0; i--) {
    const e = events[i]!;
    if (e.kind !== "spawn") return e.text;
  }
  return null;
}

/** Short fallback story when no recent event exists. Truncates with ellipsis. */
function originShorthand(k: CensusKitten): string | null {
  const origin = k.originStory?.trim();
  if (!origin) return null;
  return origin.length > 80 ? origin.slice(0, 78).trimEnd() + "…" : origin;
}

function extractCurrentYear(state: GameStateResponse): number {
  const raw = state as unknown as Record<string, unknown>;
  const cal = raw.calendar as Record<string, unknown> | undefined;
  return typeof cal?.year === "number" ? cal.year : 0;
}

/** Rank a kitten for "interesting first" sort — higher score = sorted earlier. */
function interestingScore(k: CensusKitten, currentYear: number): number {
  let s = 0;
  if (k.isLeader) s += 1000;
  if (k.isFavorite) s += 500;
  const events = k.lifeEvents ?? [];
  const hasRecentEvent = events.some((e) => e.year === currentYear && e.kind !== "spawn");
  if (hasRecentEvent) s += 200;
  s += (k.rank ?? 0) * 10;
  return s;
}

/** Pick FEATURED_COUNT kittens with the strongest current story signals. */
function pickFeatured(sim: CensusKitten[], currentYear: number): CensusKitten[] {
  if (sim.length === 0) return [];
  return [...sim]
    .map((k) => ({ k, score: interestingScore(k, currentYear) + k.age * 0.1 }))
    .sort((a, b) => b.score - a.score)
    .slice(0, FEATURED_COUNT)
    .map((entry) => entry.k);
}

interface Props {
  state: GameStateResponse | null | undefined;
}

interface VillageInfo {
  jobs: JobEntry[];
  happiness: number;
  festivalDays: number;
}

/** Extract jobs array and village info from serialized game state (duck-typed). */
function extractVillageInfo(state: GameStateResponse): VillageInfo {
  const raw = state as unknown as Record<string, unknown>;
  const village = raw.village;
  const calendar = raw.calendar as Record<string, unknown> | null | undefined;
  const festivalDays = typeof calendar?.festivalDays === "number" ? calendar.festivalDays : 0;

  if (typeof village !== "object" || village === null) return { jobs: [], happiness: 1, festivalDays };
  const v = village as Record<string, unknown>;
  const happiness = typeof v.happiness === "number" ? v.happiness : 1;
  const jobs = v.jobs;
  if (typeof jobs !== "object" || jobs === null) return { jobs: [], happiness, festivalDays };
  const jobList = Object.entries(jobs as Record<string, unknown>)
    .map(([name, entry]) => {
      if (typeof entry !== "object" || entry === null) return null;
      const e = entry as Record<string, unknown>;
      return {
        name,
        value: typeof e.value === "number" ? e.value : 0,
        unlocked: e.unlocked === true,
      };
    })
    .filter((e): e is JobEntry => e !== null);
  return { jobs: jobList, happiness, festivalDays };
}

function extractSim(state: GameStateResponse): CensusKitten[] {
  const raw = state as unknown as Record<string, unknown>;
  const village = raw.village as Record<string, unknown> | null | undefined;
  const sim = village?.sim;
  if (!Array.isArray(sim)) return [];
  return sim as CensusKitten[];
}

function topSkills(skills: Record<string, number>, count: number): Array<{ name: string; level: number }> {
  return Object.entries(skills)
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([name, level]) => ({ name, level }));
}

export function JobsPanel({ state }: Props): React.ReactElement {
  const slot = useSlot();
  const { mutate, isPending } = useGameAction(slot);
  const { setInspected, clearInspected, setPinned } = useInspector();
  const [censusPage, setCensusPage] = useState(0);
  const [censusJobFilter, setCensusJobFilter] = useState("all");
  const [censusTraitFilter, setCensusTraitFilter] = useState("all");
  const [censusSort, setCensusSort] = useState("default");
  const [censusPills, setCensusPills] = useState<Set<CensusFilterPill>>(() => new Set());
  const [renameOpen, setRenameOpen] = useState(false);
  const togglePill = React.useCallback((pill: CensusFilterPill) => {
    setCensusPills((prev) => {
      const next = new Set(prev);
      if (next.has(pill)) next.delete(pill); else next.add(pill);
      return next;
    });
    setCensusPage(0);
  }, []);

  if (!state) {
    return <div className="loading-text" data-testid="jobs-panel-loading">Loading…</div>;
  }

  const { jobs, happiness, festivalDays } = extractVillageInfo(state);
  const happinessEntity = buildHappinessEntity(state);
  const visibility = deriveUiVisibility(state);
  const visibleJobs = jobs.filter((job) => job.unlocked || visibility.jobs[job.name]?.visible === true);
  const totalAssigned = jobs.reduce((sum, j) => sum + j.value, 0);
  const villageRaw = (state as unknown as Record<string, unknown>).village as Record<string, unknown> | undefined;
  const totalKittens = typeof villageRaw?.kittens === "number" ? villageRaw.kittens : 0;
  const freeKittens = totalKittens - totalAssigned;
  const villageName = typeof villageRaw?.name === "string" && villageRaw.name.trim() !== ""
    ? villageRaw.name
    : "Bonfire";
  const buildingsRaw = (state as unknown as Record<string, unknown>).buildings as
    | Record<string, { val?: number }>
    | undefined;
  const totalBuildings = buildingsRaw
    ? Object.values(buildingsRaw).reduce(
        (sum, b) => sum + (typeof b?.val === "number" ? b.val : 0),
        0,
      )
    : 0;
  const stage = deriveVillageStage(totalKittens, totalBuildings);
  const mapSrc = `/assets/maps/village-${stage.key}.webp`;

  return (
    <div data-testid="jobs-panel">
      <div className="village-info">
        <PlaceholderImage
          variant="map"
          src={mapSrc}
          alt={`${villageName} — ${stage.label}`}
          className="village-info__map"
        />
        <div className="village-info__overlay">
          <button
            type="button"
            data-testid="village-name-edit"
            className="village-info__name"
            onClick={() => setRenameOpen(true)}
            aria-label={`Rename village (currently ${villageName})`}
          >
            {villageName}
            <span className="village-info__stage">{stage.label}</span>
          </button>
          <button
            type="button"
            data-testid="jobs-happiness"
            className="happiness-display"
            onMouseEnter={() => setInspected(happinessEntity)}
            onMouseLeave={clearInspected}
            onFocus={() => setInspected(happinessEntity)}
            onBlur={clearInspected}
            aria-label={`Village happiness ${Math.round(happiness * 100)}%`}
          >
            Happiness: {Math.round(happiness * 100)}%
          </button>
          {festivalDays > 0 && (
            <span data-testid="jobs-festival" className="festival-display">
              Festival: {Math.round(festivalDays)}d remaining
            </span>
          )}
        </div>
        {visibility.village.festivalVisible && (
          <button
            type="button"
            data-testid="btn-hold-festival"
            className="btn btn--sm btn--secondary village-info__festival-btn"
            disabled={isPending}
            onClick={() => mutate({ type: "HOLD_FESTIVAL" })}
          >
            Hold Festival
          </button>
        )}
      </div>
      {renameOpen && (
        <RenameVillageDialog
          currentName={villageName}
          onCancel={() => setRenameOpen(false)}
          onConfirm={(newName) => {
            mutate({ type: "RENAME_VILLAGE", name: newName });
            setRenameOpen(false);
          }}
        />
      )}
      {visibility.village.managementVisible && (
        <div data-testid="village-management" className="panel-subsection">
          <div className="panel-sublabel">Management</div>
        </div>
      )}
      <div className="panel-label">Job Assignments</div>
      {!visibility.village.jobsVisible || visibleJobs.length === 0 ? (
        <p className="panel-empty">No jobs available.</p>
      ) : (
        <ul className="item-list">
          {visibleJobs.map((j) => (
            <li key={j.name} data-testid={`job-${j.name}`} className="item-row job-row"
              onMouseEnter={() => setInspected(buildJobEntity(j.name))}
              onMouseLeave={clearInspected}
            >
              <div className="job-row__head">
                <ResourceIcon name={j.name} size="xl" className="job-row__icon" aria-label={j.name} />
                <div className="job-row__title">
                  <span className="item-row-name job-name">{j.name}</span>
                  {JOB_FLAVOR[j.name] && (
                    <span className="job-flavor">{JOB_FLAVOR[j.name]}</span>
                  )}
                </div>
              </div>
              <div className="job-row__controls">
                <div className="job-stepper">
                <button
                  type="button"
                  className="btn btn--secondary btn--xs"
                  data-testid={`job-${j.name}-unassign-all`}
                  disabled={isPending || j.value <= 0}
                  onClick={() => mutate({ type: "UNASSIGN_JOB", job: j.name, count: j.value })}
                  aria-label={`Remove all kittens from ${j.name}`}
                >
                  −All
                </button>
                <button
                  type="button"
                  className="btn btn--secondary btn--xs"
                  data-testid={`job-${j.name}-unassign-5`}
                  disabled={isPending || j.value <= 0}
                  onClick={() => mutate({ type: "UNASSIGN_JOB", job: j.name, count: Math.min(5, j.value) })}
                  aria-label={`Remove 5 kittens from ${j.name}`}
                >
                  −5
                </button>
                <button
                  type="button"
                  className="btn btn--secondary btn--icon"
                  data-testid={`job-${j.name}-unassign`}
                  disabled={isPending || j.value <= 0}
                  onClick={() => mutate({ type: "UNASSIGN_JOB", job: j.name })}
                  aria-label={`Remove kittens from ${j.name}`}
                >
                  −
                </button>
                <span className="job-count-display job-count">{j.value}</span>
                <button
                  type="button"
                  className="btn btn--secondary btn--icon"
                  data-testid={`job-${j.name}-assign`}
                  disabled={isPending || freeKittens <= 0}
                  onClick={(e) => mutate({ type: "ASSIGN_JOB", job: j.name, ...(e.shiftKey ? { count: freeKittens } : {}) })}
                  aria-label={`Assign kittens to ${j.name}`}
                >
                  +
                </button>
                <button
                  type="button"
                  className="btn btn--secondary btn--xs"
                  data-testid={`job-${j.name}-assign-5`}
                  disabled={isPending || freeKittens <= 0}
                  onClick={() => mutate({ type: "ASSIGN_JOB", job: j.name, count: Math.min(5, freeKittens) })}
                  aria-label={`Assign 5 kittens to ${j.name}`}
                >
                  +5
                </button>
                <button
                  type="button"
                  className="btn btn--secondary btn--xs"
                  data-testid={`job-${j.name}-assign-all`}
                  disabled={isPending || freeKittens <= 0}
                  onClick={() => mutate({ type: "ASSIGN_JOB", job: j.name, count: freeKittens })}
                  aria-label={`Assign all free kittens to ${j.name}`}
                >
                  +All
                </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      {visibility.village.censusVisible && (
        <CensusSection
          state={state}
          censusPage={censusPage}
          setCensusPage={setCensusPage}
          censusJobFilter={censusJobFilter}
          setCensusJobFilter={setCensusJobFilter}
          censusTraitFilter={censusTraitFilter}
          setCensusTraitFilter={setCensusTraitFilter}
          censusSort={censusSort}
          setCensusSort={setCensusSort}
          censusPills={censusPills}
          togglePill={togglePill}
          setInspected={setInspected}
          clearInspected={clearInspected}
          setPinned={setPinned}
          mutate={mutate}
          isPending={isPending}
        />
      )}
    </div>
  );
}

// ── Census section ──────────────────────────────────────────────────────────
//
// Splits the population view into two modes:
//   • Card grid (< CENSUS_COMPACT_THRESHOLD kittens) — original detailed cards
//   • Compact rows (≥ CENSUS_COMPACT_THRESHOLD) — slim table-like rows plus a
//     Featured Citizens strip on top and a story-hint per row so the village
//     still feels like a village even at 500+ population.

interface CensusSectionProps {
  state: GameStateResponse;
  censusPage: number;
  setCensusPage: (n: number) => void;
  censusJobFilter: string;
  setCensusJobFilter: (v: string) => void;
  censusTraitFilter: string;
  setCensusTraitFilter: (v: string) => void;
  censusSort: string;
  setCensusSort: (v: string) => void;
  censusPills: Set<CensusFilterPill>;
  togglePill: (pill: CensusFilterPill) => void;
  setInspected: (entity: KittenEntity) => void;
  clearInspected: () => void;
  setPinned: (entity: KittenEntity | null) => void;
  mutate: ReturnType<typeof useGameAction>["mutate"];
  isPending: boolean;
}

function CensusSection(props: CensusSectionProps): React.ReactElement {
  const {
    state, censusPage, setCensusPage,
    censusJobFilter, setCensusJobFilter,
    censusTraitFilter, setCensusTraitFilter,
    censusSort, setCensusSort,
    censusPills, togglePill,
    setInspected, clearInspected, setPinned,
    mutate, isPending,
  } = props;

  const sim = React.useMemo(() => extractSim(state), [state]);
  const currentYear = React.useMemo(() => extractCurrentYear(state), [state]);
  const compactMode = sim.length >= CENSUS_COMPACT_THRESHOLD;
  const pageSize = compactMode ? CENSUS_PAGE_SIZE_COMPACT : CENSUS_PAGE_SIZE_CARDS;

  const filtered = React.useMemo(() => {
    let out = sim;
    if (censusJobFilter === "free") out = out.filter((k) => k.job === null);
    else if (censusJobFilter !== "all") out = out.filter((k) => k.job === censusJobFilter);
    if (censusTraitFilter !== "all") out = out.filter((k) => k.trait === censusTraitFilter);

    if (censusPills.size > 0) {
      out = out.filter((k) => {
        if (censusPills.has("featured")) {
          const recentEvent = (k.lifeEvents ?? []).some((e) => e.year === currentYear && e.kind !== "spawn");
          if (k.isLeader || k.isFavorite || recentEvent) return true;
          return false;
        }
        return true;
      });
      if (censusPills.has("free")) out = out.filter((k) => k.job === null);
      if (censusPills.has("veterans")) {
        const sorted = [...out].sort((a, b) => b.age - a.age);
        const cut = Math.max(1, Math.ceil(sorted.length * 0.1));
        const top = new Set(sorted.slice(0, cut).map((k) => k.id));
        out = out.filter((k) => top.has(k.id));
      }
      if (censusPills.has("rookies")) {
        const sorted = [...out].sort((a, b) => a.age - b.age);
        const cut = Math.max(1, Math.ceil(sorted.length * 0.1));
        const top = new Set(sorted.slice(0, cut).map((k) => k.id));
        out = out.filter((k) => top.has(k.id));
      }
    }

    const sortMode = censusSort === "default" && compactMode ? "interesting" : censusSort;
    if (sortMode === "name") out = [...out].sort((a, b) => a.name.localeCompare(b.name));
    else if (sortMode === "age") out = [...out].sort((a, b) => b.age - a.age);
    else if (sortMode === "rank") out = [...out].sort((a, b) => b.rank - a.rank);
    else if (sortMode === "exp") out = [...out].sort((a, b) => (b.exp ?? 0) - (a.exp ?? 0));
    else if (sortMode === "interesting") {
      out = [...out].sort((a, b) => interestingScore(b, currentYear) - interestingScore(a, currentYear));
    }
    return out;
  }, [sim, currentYear, censusJobFilter, censusTraitFilter, censusPills, censusSort, compactMode]);

  const featured = React.useMemo(
    () => (compactMode ? pickFeatured(sim, currentYear) : []),
    [sim, currentYear, compactMode],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const page = Math.min(censusPage, totalPages - 1);
  const pageKittens = filtered.slice(page * pageSize, (page + 1) * pageSize);

  const jobsInPop = React.useMemo(
    () => [...new Set(sim.map((k) => k.job).filter((j): j is string => j !== null))].sort(),
    [sim],
  );
  const traitsInPop = React.useMemo(() => [...new Set(sim.map((k) => k.trait))].sort(), [sim]);
  // Lookup for clickable parent links in the inspector.
  const kittenNameById = React.useMemo(() => {
    const out: Record<string, string> = {};
    for (const k of sim) out[k.id] = `${k.name} ${k.surname}`.trim();
    return out;
  }, [sim]);

  return (
    <div data-testid="village-census" className="panel-subsection">
      <div className="panel-sublabel">
        Census <span className="census-count">{sim.length}</span>
      </div>

      {compactMode && featured.length > 0 && (
        <FeaturedCitizensStrip
          featured={featured}
          setInspected={setInspected}
          clearInspected={clearInspected}
          setPinned={setPinned}
          kittenNameById={kittenNameById}
        />
      )}

      <div className="panel-controls">
        <select data-testid="census-filter-job" className="btn-select" value={censusJobFilter}
          onChange={(e) => { setCensusJobFilter(e.target.value); setCensusPage(0); }}>
          <option value="all">All jobs</option>
          <option value="free">Free</option>
          {jobsInPop.map((j) => <option key={j} value={j}>{j}</option>)}
        </select>
        <select data-testid="census-filter-trait" className="btn-select" value={censusTraitFilter}
          onChange={(e) => { setCensusTraitFilter(e.target.value); setCensusPage(0); }}>
          <option value="all">All traits</option>
          {traitsInPop.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select data-testid="census-sort" className="btn-select" value={censusSort}
          onChange={(e) => { setCensusSort(e.target.value); setCensusPage(0); }}>
          <option value="default">{compactMode ? "Featured first" : "Default"}</option>
          <option value="name">Name</option>
          <option value="age">Age</option>
          <option value="rank">Rank</option>
          <option value="exp">Exp</option>
        </select>
      </div>

      {compactMode && (
        <div className="census-pills" role="group" aria-label="Quick filters">
          {(["featured", "veterans", "rookies", "free"] as const).map((pill) => (
            <button
              key={pill}
              type="button"
              className={`census-pill${censusPills.has(pill) ? " census-pill--active" : ""}`}
              aria-pressed={censusPills.has(pill)}
              onClick={() => togglePill(pill)}
            >
              {pill.charAt(0).toUpperCase() + pill.slice(1)}
            </button>
          ))}
        </div>
      )}

      {compactMode ? (
        <ul data-testid="census-list" className="census-rows">
          {pageKittens.map((k) => (
            <CompactKittenRow
              key={k.id}
              k={k}
              setInspected={setInspected}
              clearInspected={clearInspected}
              setPinned={setPinned}
              mutate={mutate}
              isPending={isPending}
              kittenNameById={kittenNameById}
            />
          ))}
        </ul>
      ) : (
        <ul data-testid="census-list" className="item-list census-list">
          {pageKittens.map((k) => (
            <CensusCard
              key={k.id}
              k={k}
              setInspected={setInspected}
              clearInspected={clearInspected}
              setPinned={setPinned}
              mutate={mutate}
              isPending={isPending}
              kittenNameById={kittenNameById}
            />
          ))}
        </ul>
      )}

      {totalPages > 1 && (
        <div className="census-pagination">
          <button type="button" data-testid="census-page-prev" className="btn btn--xs btn--secondary"
            disabled={page <= 0} onClick={() => setCensusPage(page - 1)}>
            ◀
          </button>
          <span className="census-page-info">{page + 1} / {totalPages}</span>
          <button type="button" data-testid="census-page-next" className="btn btn--xs btn--secondary"
            disabled={page >= totalPages - 1} onClick={() => setCensusPage(page + 1)}>
            ▶
          </button>
        </div>
      )}
    </div>
  );
}

interface KittenItemProps {
  k: CensusKitten;
  setInspected: (entity: KittenEntity) => void;
  clearInspected: () => void;
  setPinned: (entity: KittenEntity | null) => void;
  mutate: ReturnType<typeof useGameAction>["mutate"];
  isPending: boolean;
  kittenNameById?: Record<string, string>;
}

function CensusCard({ k, setInspected, clearInspected, setPinned, mutate, isPending, kittenNameById }: KittenItemProps): React.ReactElement {
  const kittenEntity = buildKittenEntity(k, kittenNameById);
  return (
    <li
      data-testid={`census-kitten-${k.id}`}
      className="census-card"
      tabIndex={0}
      onMouseEnter={() => setInspected(kittenEntity)}
      onMouseLeave={clearInspected}
      onFocus={() => setInspected(kittenEntity)}
      onBlur={clearInspected}
      onClick={(e) => {
        const t = e.target as HTMLElement;
        if (t.closest("button, input, select, a, [data-no-pin]")) return;
        setPinned(kittenEntity);
      }}
    >
      <PlaceholderImage
        variant="character"
        src={kittenAvatarPath(k)}
        alt={`${k.name} ${k.surname}`}
        className="census-card__portrait"
      />
      <button type="button" data-testid={`census-kitten-${k.id}-favorite`}
        className="btn btn--xs btn--icon census-favorite"
        onClick={() => mutate({ type: "TOGGLE_FAVORITE", kittenId: k.id })}>
        {k.isFavorite ? "★" : "☆"}
      </button>
      {k.isLeader && (
        <span className="census-card__leader-mark" data-testid={`census-kitten-${k.id}-leader-mark`} title="Leader" aria-label="Leader">
          ♛
        </span>
      )}
      <div className="census-card__name-strip">
        <div className="census-card__name">{k.name} {k.surname}</div>
        <div className="census-card__job">{k.job ?? "Free"}</div>
      </div>
      <div className="census-card__actions">
        <button type="button" data-testid={`census-kitten-${k.id}-promote`}
          className="btn btn--xs btn--secondary census-promote"
          disabled={isPending}
          onClick={() => mutate({ type: "PROMOTE_KITTEN", kittenId: k.id })}>
          Promote
        </button>
        {k.job !== null && (
          <button type="button" data-testid={`census-kitten-${k.id}-unassign`}
            className="btn btn--xs btn--secondary census-unassign"
            disabled={isPending}
            onClick={() => mutate({ type: "UNASSIGN_KITTEN", kittenId: k.id })}>
            Unassign
          </button>
        )}
        <button type="button" data-testid={`census-kitten-${k.id}-leader`}
          className={`btn btn--xs ${k.isLeader ? "btn--primary" : "btn--secondary"} census-leader`}
          disabled={isPending}
          onClick={() => mutate({ type: "SET_LEADER", kittenId: k.id })}>
          {k.isLeader ? "Leader" : "Make Leader"}
        </button>
      </div>
    </li>
  );
}

function CompactKittenRow({ k, setInspected, clearInspected, setPinned, mutate, isPending, kittenNameById }: KittenItemProps): React.ReactElement {
  const kittenEntity = buildKittenEntity(k, kittenNameById);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const storyHint = newestLifeEventText(k) ?? originShorthand(k);

  return (
    <li
      data-testid={`census-kitten-${k.id}`}
      className={`census-row${k.isLeader ? " census-row--leader" : ""}${k.isFavorite ? " census-row--fav" : ""}`}
      tabIndex={0}
      onMouseEnter={() => setInspected(kittenEntity)}
      onMouseLeave={clearInspected}
      onFocus={() => setInspected(kittenEntity)}
      onBlur={clearInspected}
      onClick={(e) => {
        const t = e.target as HTMLElement;
        if (t.closest("button, input, select, a, [data-no-pin]")) return;
        setPinned(kittenEntity);
      }}
    >
      <img className="census-row__avatar" src={kittenAvatarPath(k)} alt="" role="presentation" />
      <div className="census-row__name">
        <span className="census-row__name-text">{k.name} {k.surname}</span>
        {k.isLeader && <span className="census-row__leader-mark" title="Leader" aria-label="Leader">♛</span>}
        {k.isFavorite && <span className="census-row__fav-mark" title="Favorite" aria-label="Favorite">★</span>}
      </div>
      <span className="census-row__job">{k.job ?? "free"}</span>
      <span className="census-row__trait" title={`Trait: ${k.trait}`}>{k.trait === "none" ? "—" : k.trait}</span>
      <span className="census-row__rank">R{k.rank}</span>
      <span className="census-row__xp">{k.exp >= 1000 ? `${(k.exp / 1000).toFixed(1)}k` : k.exp.toFixed(0)}</span>
      {storyHint && <span className="census-row__story">{storyHint}</span>}
      <div className="census-row__actions" data-no-pin>
        <button
          type="button"
          data-testid={`census-kitten-${k.id}-menu`}
          className="btn btn--xs btn--icon census-row__menu-btn"
          aria-label="Actions"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
        >
          ⋯
        </button>
        {menuOpen && (
          <div className="census-row__menu" role="menu" onClick={(e) => e.stopPropagation()}>
            <button type="button" role="menuitem" className="census-row__menu-item"
              disabled={isPending}
              onClick={() => { mutate({ type: "TOGGLE_FAVORITE", kittenId: k.id }); setMenuOpen(false); }}>
              {k.isFavorite ? "Unfavorite" : "Favorite"}
            </button>
            <button type="button" role="menuitem" className="census-row__menu-item"
              disabled={isPending}
              onClick={() => { mutate({ type: "PROMOTE_KITTEN", kittenId: k.id }); setMenuOpen(false); }}>
              Promote
            </button>
            <button type="button" role="menuitem" className="census-row__menu-item"
              disabled={isPending}
              onClick={() => { mutate({ type: "SET_LEADER", kittenId: k.id }); setMenuOpen(false); }}>
              {k.isLeader ? "Leader (active)" : "Make Leader"}
            </button>
            {k.job !== null && (
              <button type="button" role="menuitem" className="census-row__menu-item"
                disabled={isPending}
                onClick={() => { mutate({ type: "UNASSIGN_KITTEN", kittenId: k.id }); setMenuOpen(false); }}>
                Unassign
              </button>
            )}
          </div>
        )}
      </div>
    </li>
  );
}

interface FeaturedStripProps {
  featured: CensusKitten[];
  setInspected: (entity: KittenEntity) => void;
  clearInspected: () => void;
  setPinned: (entity: KittenEntity | null) => void;
  kittenNameById?: Record<string, string>;
}

function FeaturedCitizensStrip({ featured, setInspected, clearInspected, setPinned, kittenNameById }: FeaturedStripProps): React.ReactElement {
  return (
    <div className="featured-strip" data-testid="featured-citizens">
      <div className="featured-strip__label">Featured Citizens</div>
      <ul className="featured-strip__row">
        {featured.map((k) => {
          const entity = buildKittenEntity(k, kittenNameById);
          return (
            <li
              key={k.id}
              className="featured-citizen"
              data-testid={`featured-${k.id}`}
              tabIndex={0}
              onMouseEnter={() => setInspected(entity)}
              onMouseLeave={clearInspected}
              onFocus={() => setInspected(entity)}
              onBlur={clearInspected}
              onClick={(e) => {
                const t = e.target as HTMLElement;
                if (t.closest("button, input, select, a, [data-no-pin]")) return;
                setPinned(entity);
              }}
            >
              <img className="featured-citizen__avatar" src={kittenAvatarPath(k)} alt="" role="presentation" />
              <div className="featured-citizen__meta">
                <div className="featured-citizen__name">{k.name} {k.surname}</div>
                <div className="featured-citizen__job">{k.job ?? "free"}{k.isLeader ? " · ♛" : ""}{k.isFavorite ? " · ★" : ""}</div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
