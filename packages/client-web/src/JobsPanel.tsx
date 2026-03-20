// JobsPanel — displays jobs with assign/unassign controls
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
    return <div data-testid="jobs-panel-loading">Loading jobs...</div>;
  }

  const jobs = extractJobs(state);

  return (
    <div data-testid="jobs-panel">
      <h2>Jobs</h2>
      {jobs.length === 0 ? (
        <p>No jobs available.</p>
      ) : (
        <ul>
          {jobs.map((j) => (
            <li key={j.name} data-testid={`job-${j.name}`}>
              <span className="job-name">{j.name}</span>
              {": "}
              <span className="job-count">{j.value}</span>
              <button
                type="button"
                data-testid={`job-${j.name}-assign`}
                disabled={isPending}
                onClick={() => mutate({ type: "ASSIGN_JOB", job: j.name })}
              >
                +
              </button>
              <button
                type="button"
                data-testid={`job-${j.name}-unassign`}
                disabled={isPending || j.value <= 0}
                onClick={() => mutate({ type: "UNASSIGN_JOB", job: j.name })}
              >
                -
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
