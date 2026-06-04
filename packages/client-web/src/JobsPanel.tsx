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
  lifeEvents?: Array<{ year: number; kind: string; text: string }>;
  portraitPath?: string | null;
}

function buildKittenEntity(k: CensusKitten): KittenEntity {
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
  };
}

const CENSUS_PAGE_SIZE = 10;

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
  const [renameOpen, setRenameOpen] = useState(false);

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
      {visibility.village.censusVisible && (() => {
        const sim = extractSim(state);
        // Filter
        let filtered = sim;
        if (censusJobFilter === "free") {
          filtered = filtered.filter((k) => k.job === null);
        } else if (censusJobFilter !== "all") {
          filtered = filtered.filter((k) => k.job === censusJobFilter);
        }
        if (censusTraitFilter !== "all") {
          filtered = filtered.filter((k) => k.trait === censusTraitFilter);
        }
        // Sort
        if (censusSort === "name") {
          filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
        } else if (censusSort === "age") {
          filtered = [...filtered].sort((a, b) => b.age - a.age);
        } else if (censusSort === "rank") {
          filtered = [...filtered].sort((a, b) => b.rank - a.rank);
        } else if (censusSort === "exp") {
          filtered = [...filtered].sort((a, b) => (b.exp ?? 0) - (a.exp ?? 0));
        }
        const totalPages = Math.max(1, Math.ceil(filtered.length / CENSUS_PAGE_SIZE));
        const page = Math.min(censusPage, totalPages - 1);
        const pageKittens = filtered.slice(page * CENSUS_PAGE_SIZE, (page + 1) * CENSUS_PAGE_SIZE);
        // Collect unique jobs and traits for filter dropdowns
        const jobsInPop = [...new Set(sim.map((k) => k.job).filter((j): j is string => j !== null))].sort();
        const traitsInPop = [...new Set(sim.map((k) => k.trait))].sort();
        return (
          <div data-testid="village-census" className="panel-subsection">
            <div className="panel-sublabel">Census</div>
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
                <option value="default">Default</option>
                <option value="name">Name</option>
                <option value="age">Age</option>
                <option value="rank">Rank</option>
                <option value="exp">Exp</option>
              </select>
            </div>
            <ul data-testid="census-list" className="item-list census-list">
              {pageKittens.map((k) => {
                const kittenEntity = buildKittenEntity(k);
                return (
                <li
                  key={k.id}
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
                    <span
                      className="census-card__leader-mark"
                      data-testid={`census-kitten-${k.id}-leader-mark`}
                      title="Leader"
                      aria-label="Leader"
                    >
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
              })}
            </ul>
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
      })()}
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
              <ResourceIcon name={j.name} size="md" className="job-row__icon" aria-label={j.name} />
              <span className="item-row-name job-name">{j.name}</span>
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
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
