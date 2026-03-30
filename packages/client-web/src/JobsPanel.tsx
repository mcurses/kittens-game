// JobsPanel — displays jobs with assign/unassign stepper controls
import type { GameStateResponse } from "@kittens/api-spec";
import React from "react";
import { useGameAction } from "./useGameAction.js";

interface JobEntry {
  name: string;
  value: number;
}

interface Props {
  state: GameStateResponse | null | undefined;
}

/** Extract jobs array from serialized game state (duck-typed). */
function extractJobs(state: GameStateResponse): JobEntry[] {
  const raw = state as unknown as Record<string, unknown>;
  const village = raw.village;
  if (typeof village !== "object" || village === null) return [];
  const jobs = (village as Record<string, unknown>).jobs;
  if (typeof jobs !== "object" || jobs === null) return [];
  return Object.entries(jobs as Record<string, unknown>)
    .map(([name, entry]) => {
      if (typeof entry !== "object" || entry === null) return null;
      const e = entry as Record<string, unknown>;
      return {
        name,
        value: typeof e.value === "number" ? e.value : 0,
      };
    })
    .filter((e): e is JobEntry => e !== null);
}

export function JobsPanel({ state }: Props): React.ReactElement {
  const { mutate, isPending } = useGameAction();

  if (!state) {
    return <div className="loading-text" data-testid="jobs-panel-loading">Loading…</div>;
  }

  const jobs = extractJobs(state);

  return (
    <div data-testid="jobs-panel">
      <div className="panel-label">Job Assignments</div>
      {jobs.length === 0 ? (
        <p className="panel-empty">No jobs available.</p>
      ) : (
        <ul className="item-list">
          {jobs.map((j) => (
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
