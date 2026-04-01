// JobsPanel — displays jobs with assign/unassign stepper controls
import type { GameStateResponse } from "@kittens/api-spec";
import { deriveUiVisibility } from "@kittens/engine";
import React from "react";
import { useSlot } from "./SlotContext.js";
import { useGameAction } from "./useGameAction.js";

interface JobEntry {
  name: string;
  value: number;
  unlocked: boolean;
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

export function JobsPanel({ state }: Props): React.ReactElement {
  const slot = useSlot();
  const { mutate, isPending } = useGameAction(slot);

  if (!state) {
    return <div className="loading-text" data-testid="jobs-panel-loading">Loading…</div>;
  }

  const { jobs, happiness, festivalDays } = extractVillageInfo(state);
  const visibility = deriveUiVisibility(state);
  const visibleJobs = jobs.filter((job) => job.unlocked || visibility.jobs[job.name]?.visible === true);

  return (
    <div data-testid="jobs-panel">
      <div className="village-info">
        <span data-testid="jobs-happiness" className="happiness-display">
          Happiness: {Math.round(happiness * 100)}%
        </span>
        {festivalDays > 0 && (
          <span data-testid="jobs-festival" className="festival-display">
            Festival: {Math.round(festivalDays)}d remaining
          </span>
        )}
        {visibility.village.festivalVisible && (
          <button type="button" data-testid="btn-hold-festival" className="btn btn--sm btn--secondary"
            disabled={isPending} onClick={() => mutate({ type: "HOLD_FESTIVAL" })}>
            Hold Festival
          </button>
        )}
      </div>
      {visibility.village.managementVisible && (
        <div data-testid="village-management" className="panel-subsection">
          <div className="panel-sublabel">Management</div>
        </div>
      )}
      {visibility.village.censusVisible && (
        <div data-testid="village-census" className="panel-subsection">
          <div className="panel-sublabel">Census</div>
        </div>
      )}
      {visibility.village.mapVisible && (
        <div data-testid="village-map" className="panel-subsection">
          <div className="panel-sublabel">Map</div>
        </div>
      )}
      <div className="panel-label">Job Assignments</div>
      {!visibility.village.jobsVisible || visibleJobs.length === 0 ? (
        <p className="panel-empty">No jobs available.</p>
      ) : (
        <ul className="item-list">
          {visibleJobs.map((j) => (
            <li key={j.name} data-testid={`job-${j.name}`} className="item-row">
              <span className="item-row-name job-name">{j.name}</span>
              <div className="job-stepper">
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
                  disabled={isPending}
                  onClick={() => mutate({ type: "ASSIGN_JOB", job: j.name })}
                  aria-label={`Assign kittens to ${j.name}`}
                >
                  +
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
