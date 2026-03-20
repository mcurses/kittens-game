// BuildingsPanel — displays all buildings with buy controls
import type { GameStateResponse } from "@kittens/api-spec";
import React from "react";
import { useGameAction } from "./useGameAction.js";

interface BuildingEntry {
  name: string;
  val: number;
  on: number;
}

interface Props {
  state: GameStateResponse | null | undefined;
}

/** Extract buildings array from serialized game state (duck-typed). */
function extractBuildings(state: GameStateResponse): BuildingEntry[] {
  const raw = state as unknown as Record<string, unknown>;
  const buildings = raw.buildings;
  if (typeof buildings !== "object" || buildings === null) return [];
  return Object.entries(buildings as Record<string, unknown>)
    .map(([name, entry]) => {
      if (typeof entry !== "object" || entry === null) return null;
      const e = entry as Record<string, unknown>;
      return {
        name,
        val: typeof e.val === "number" ? e.val : 0,
        on: typeof e.on === "number" ? e.on : 0,
      };
    })
    .filter((e): e is BuildingEntry => e !== null);
}

export function BuildingsPanel({ state }: Props): React.ReactElement {
  const { mutate, isPending } = useGameAction();

  if (!state) {
    return <div data-testid="buildings-panel-loading">Loading buildings...</div>;
  }

  const buildings = extractBuildings(state);

  return (
    <div data-testid="buildings-panel">
      <h2>Buildings</h2>
      {buildings.length === 0 ? (
        <p>No buildings available.</p>
      ) : (
        <ul>
          {buildings.map((b) => (
            <li key={b.name} data-testid={`building-${b.name}`}>
              <span className="building-name">{b.name}</span>
              {": "}
              <span className="building-count">{b.val}</span>
              <button
                type="button"
                disabled={isPending}
                onClick={() => mutate({ type: "BUY_BUILDING", name: b.name })}
              >
                Buy
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
