// BuildingsPanel — displays unlocked buildings with buy controls and price info
import type { GameStateResponse } from "@kittens/api-spec";
import { BUILDING_DEFS } from "@kittens/engine";
import React from "react";
import { useGameAction } from "./useGameAction.js";

interface BuildingEntry {
  name: string;
  val: number;
  on: number;
}

interface PriceEntry {
  name: string;
  val: number;
}

interface Props {
  state: GameStateResponse | null | undefined;
}

/** Extract buildings array from serialized game state (duck-typed). Only returns unlocked ones (val > 0). */
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
    .filter((e): e is BuildingEntry => e !== null && e.val > 0);
}

/** Look up base prices for a building by name from BUILDING_DEFS. */
function getPrices(name: string): readonly PriceEntry[] {
  const def = BUILDING_DEFS.find((d) => d.name === name);
  return def ? def.prices : [];
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
          {buildings.map((b) => {
            const prices = getPrices(b.name);
            return (
              <li key={b.name} data-testid={`building-${b.name}`}>
                <span className="building-name">{b.name}</span>
                {": "}
                <span className="building-count">{b.val}</span>
                {prices.length > 0 && (
                  <span className="building-prices">
                    {" ("}
                    {prices.map((p, i) => (
                      <span key={p.name}>
                        {i > 0 ? ", " : ""}
                        {p.name}: {p.val}
                      </span>
                    ))}
                    {")"}
                  </span>
                )}
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => mutate({ type: "BUY_BUILDING", name: b.name })}
                >
                  Buy
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
