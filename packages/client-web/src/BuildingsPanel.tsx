// BuildingsPanel — displays unlocked buildings as cards with buy controls
import type { GameStateResponse } from "@kittens/api-spec";
import { BUILDING_DEFS, deriveUiVisibility, getBuildingPrice } from "@kittens/engine";
import React from "react";
import { useInspector } from "./InspectorContext.js";
import { useSlot } from "./SlotContext.js";
import { useGameAction } from "./useGameAction.js";
import { canAfford, extractEffectCache, extractResources } from "./utils.js";

interface BuildingEntry {
  name: string;
  val: number;
  on: number;
  unlocked: boolean;
}

interface Props {
  state: GameStateResponse | null | undefined;
}

/** Split camelCase to Title Case: "lumberMill" → "Lumber Mill" */
function prettifyName(name: string): string {
  return name
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
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

export function BuildingsPanel({ state }: Props): React.ReactElement {
  const slot = useSlot();
  const { mutate, isPending } = useGameAction(slot);
  const { setInspected, clearInspected } = useInspector();

  if (!state) {
    return <div className="loading-text" data-testid="buildings-panel-loading">Loading…</div>;
  }

  const buildings = extractBuildings(state);
  const resources = extractResources(state);
  const effectCache = extractEffectCache(state);
  const visibility = deriveUiVisibility(state);

  return (
    <div data-testid="buildings-panel">
      <div className="panel-label">Structures</div>
      {buildings.length === 0 ? (
        <p className="panel-empty">No buildings available.</p>
      ) : (
        <ul className="card-grid" style={{ listStyle: "none" }}>
          {buildings.map((b) => {
            const def = BUILDING_DEFS.find((d) => d.name === b.name);
            const prices = def ? getBuildingPrice(def, b.val, effectCache) : [];
            const affordable = canAfford(prices, resources);

            return (
              <li
                key={b.name}
                data-testid={`building-${b.name}`}
                className="item-card"
                onMouseEnter={() =>
                  setInspected({
                    kind: "building",
                    name: b.name,
                    description: def?.description,
                    val: b.val,
                    effects: def?.effects ?? {},
                    prices,
                    resources,
                  })
                }
                onMouseLeave={clearInspected}
                onFocus={() =>
                  setInspected({
                    kind: "building",
                    name: b.name,
                    description: def?.description,
                    val: b.val,
                    effects: def?.effects ?? {},
                    prices,
                    resources,
                  })
                }
                onBlur={clearInspected}
                tabIndex={0}
              >
                <div className="item-card-header">
                  <span className="item-name building-name">{prettifyName(b.name)}</span>
                  <span className={`item-count building-count${b.val > 0 ? " item-count--has" : ""}`}>
                    {b.on < b.val ? `${b.on}/${b.val}` : b.val}
                  </span>
                </div>

                {prices.length > 0 && (
                  <div className="item-prices building-prices">
                    {prices.map((p, i) => (
                      <span key={p.name}>
                        {i > 0 ? " · " : ""}
                        {p.name} {p.val.toFixed(0)}
                      </span>
                    ))}
                  </div>
                )}

                <div className="item-actions">
                  {b.val > 0 && visibility.buildings[b.name]?.toggleVisible && (
                    <>
                      <button
                        type="button"
                        className="btn btn--sm btn--secondary"
                        disabled={isPending || b.on >= b.val}
                        onClick={() => mutate({ type: "ENABLE_BUILDING", name: b.name })}
                      >
                        On
                      </button>
                      <button
                        type="button"
                        className="btn btn--sm btn--secondary"
                        disabled={isPending || b.on <= 0}
                        onClick={() => mutate({ type: "DISABLE_BUILDING", name: b.name })}
                      >
                        Off
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    className={`btn btn--sm${affordable ? " btn--primary" : " btn--secondary"}`}
                    disabled={isPending || !affordable}
                    onClick={() => mutate({ type: "BUY_BUILDING", name: b.name })}
                  >
                    Buy
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
