// ResourcePanel — displays all resources and their per-tick rates
import type { GameStateResponse } from "@kittens/api-spec";
import React from "react";

interface ResourceEntry {
  name: string;
  value: number;
  maxValue?: number;
  perTick?: number;
}

interface Props {
  state: GameStateResponse | null | undefined;
}

/** Extract resources array from serialized game state (duck-typed). */
function extractResources(state: GameStateResponse): ResourceEntry[] {
  const raw = state as unknown as Record<string, unknown>;
  const resources = raw.resources;
  if (typeof resources !== "object" || resources === null) return [];
  return Object.entries(resources as Record<string, unknown>)
    .map(([name, entry]) => {
      if (typeof entry !== "object" || entry === null) return null;
      const e = entry as Record<string, unknown>;
      return {
        name,
        value: typeof e.value === "number" ? e.value : 0,
        maxValue: typeof e.maxValue === "number" ? e.maxValue : undefined,
        perTick: typeof e.perTick === "number" ? e.perTick : undefined,
      };
    })
    .filter((e): e is ResourceEntry => e !== null);
}

export function ResourcePanel({ state }: Props): React.ReactElement {
  if (!state) {
    return <div data-testid="resource-panel-loading">Loading resources...</div>;
  }

  const resources = extractResources(state);

  return (
    <div data-testid="resource-panel">
      <h2>Resources</h2>
      {resources.length === 0 ? (
        <p>No resources yet.</p>
      ) : (
        <ul>
          {resources.map((r) => (
            <li key={r.name} data-testid={`resource-${r.name}`}>
              <span className="resource-name">{r.name}</span>
              {": "}
              <span className="resource-value">
                {r.value.toFixed(2)}
                {r.maxValue !== undefined ? ` / ${r.maxValue.toFixed(0)}` : ""}
              </span>
              {r.perTick !== undefined && r.perTick !== 0 ? (
                <span className="resource-rate">
                  {" "}
                  ({r.perTick > 0 ? "+" : ""}
                  {r.perTick.toFixed(3)}/tick)
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
