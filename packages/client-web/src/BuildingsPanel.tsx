// BuildingsPanel — displays unlocked buildings with buy controls and price info
import type { GameStateResponse } from "@kittens/api-spec";
import { BUILDING_DEFS, getBuildingPrice } from "@kittens/engine";
import React from "react";
import { useGameAction } from "./useGameAction.js";

interface BuildingEntry {
  name: string;
  val: number;
  on: number;
  unlocked: boolean;
}

interface ResourceMap {
  [key: string]: { value: number };
}

interface Props {
  state: GameStateResponse | null | undefined;
}

/** Extract buildings array from serialized game state (duck-typed). Returns only unlocked buildings. */
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
        unlocked: typeof e.unlocked === "boolean" ? e.unlocked : false,
      };
    })
    .filter((e): e is BuildingEntry => e !== null && e.unlocked);
}

/** Extract resource values from serialized game state. */
function extractResources(state: GameStateResponse): ResourceMap {
  const raw = state as unknown as Record<string, unknown>;
  const resources = raw.resources;
  if (typeof resources !== "object" || resources === null) return {};
  const result: ResourceMap = {};
  for (const [k, v] of Object.entries(resources as Record<string, unknown>)) {
    if (typeof v === "object" && v !== null && typeof (v as Record<string, unknown>).value === "number") {
      result[k] = { value: (v as Record<string, unknown>).value as number };
    }
  }
  return result;
}

/** Check if the player can afford all prices. */
function canAfford(prices: readonly { name: string; val: number }[], resources: ResourceMap): boolean {
  return prices.every((p) => (resources[p.name]?.value ?? 0) >= p.val);
}

export function BuildingsPanel({ state }: Props): React.ReactElement {
  const { mutate, isPending } = useGameAction();

  if (!state) {
    return <div data-testid="buildings-panel-loading">Loading buildings...</div>;
  }

  const buildings = extractBuildings(state);
  const resources = extractResources(state);

  return (
    <div data-testid="buildings-panel">
      <h2>Buildings</h2>
      {buildings.length === 0 ? (
        <p>No buildings available.</p>
      ) : (
        <ul>
          {buildings.map((b) => {
            const def = BUILDING_DEFS.find((d) => d.name === b.name);
            const prices = def ? getBuildingPrice(def, b.val) : [];
            const affordable = canAfford(prices, resources);
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
                        {p.name}: {p.val.toFixed(0)}
                      </span>
                    ))}
                    {")"}
                  </span>
                )}
                <button
                  type="button"
                  disabled={isPending || !affordable}
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
