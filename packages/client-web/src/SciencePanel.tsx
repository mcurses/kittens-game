// SciencePanel — displays available technologies with research controls and costs
import type { GameStateResponse } from "@kittens/api-spec";
import { TECH_DEFS } from "@kittens/engine";
import React from "react";
import { useInspector } from "./InspectorContext.js";
import { useSlot } from "./SlotContext.js";
import { useGameAction } from "./useGameAction.js";
import { canAfford, extractResources } from "./utils.js";

interface TechEntry {
  name: string;
  unlocked: boolean;
  researched: boolean;
}

interface Props {
  state: GameStateResponse | null | undefined;
}

/** Extract techs array from serialized game state (duck-typed). */
function extractTechs(state: GameStateResponse): TechEntry[] {
  const raw = state as unknown as Record<string, unknown>;
  const science = raw.science;
  if (typeof science !== "object" || science === null) return [];
  const techs = (science as Record<string, unknown>).techs;
  if (typeof techs !== "object" || techs === null) return [];
  return Object.entries(techs as Record<string, unknown>)
    .map(([name, entry]) => {
      if (typeof entry !== "object" || entry === null) return null;
      const e = entry as Record<string, unknown>;
      return {
        name,
        unlocked: e.unlocked === true,
        researched: e.researched === true,
      };
    })
    .filter((e): e is TechEntry => e !== null && e.unlocked);
}

export function SciencePanel({ state }: Props): React.ReactElement {
  const slot = useSlot();
  const { mutate, isPending } = useGameAction(slot);
  const { setInspected, clearInspected } = useInspector();

  if (!state) {
    return <div className="loading-text" data-testid="science-panel-loading">Loading…</div>;
  }

  const techs = extractTechs(state);
  const resources = extractResources(state);

  return (
    <div data-testid="science-panel">
      <div className="panel-label">Technologies</div>
      {techs.length === 0 ? (
        <p className="panel-empty">No technologies available.</p>
      ) : (
        <ul className="item-list">
          {techs.map((t) => {
            const def = TECH_DEFS.find((d) => d.name === t.name);
            const prices = def?.prices ?? [];
            const affordable = canAfford(prices, resources);
            const costLabel =
              prices.length > 0
                ? prices.map((p) => `${p.val} ${p.name}`).join(", ")
                : "";

            return (
              <li
                key={t.name}
                data-testid={`tech-${t.name}`}
                className="item-row"
                onMouseEnter={() =>
                  setInspected({
                    kind: "tech",
                    name: t.name,
                    description: def?.description,
                    researched: t.researched,
                    effects: def?.effects ?? {},
                    prices: [...prices],
                    resources,
                  })
                }
                onMouseLeave={clearInspected}
                onFocus={() =>
                  setInspected({
                    kind: "tech",
                    name: t.name,
                    description: def?.description,
                    researched: t.researched,
                    effects: def?.effects ?? {},
                    prices: [...prices],
                    resources,
                  })
                }
                onBlur={clearInspected}
                tabIndex={0}
              >
                <span className="item-row-name tech-name">{t.name}</span>
                {costLabel && !t.researched && (
                  <span className="item-row-cost">{costLabel}</span>
                )}
                <div className="item-row-actions">
                  {t.researched ? (
                    <span className="done-badge tech-done">✓ Done</span>
                  ) : (
                    <button
                      type="button"
                      className={`btn btn--sm${affordable ? " btn--primary" : " btn--secondary"}`}
                      disabled={isPending || !affordable}
                      onClick={() => mutate({ type: "RESEARCH", name: t.name })}
                    >
                      Research
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
