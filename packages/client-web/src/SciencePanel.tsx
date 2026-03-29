// SciencePanel — displays available technologies with research controls and costs
import type { GameStateResponse } from "@kittens/api-spec";
import { TECH_DEFS } from "@kittens/engine";
import React from "react";
import { useGameAction } from "./useGameAction.js";

interface TechEntry {
  name: string;
  unlocked: boolean;
  researched: boolean;
}

interface ResourceMap {
  [key: string]: { value: number };
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

export function SciencePanel({ state }: Props): React.ReactElement {
  const { mutate, isPending } = useGameAction();

  if (!state) {
    return <div data-testid="science-panel-loading">Loading science...</div>;
  }

  const techs = extractTechs(state);
  const resources = extractResources(state);

  return (
    <div data-testid="science-panel">
      <h2>Science</h2>
      {techs.length === 0 ? (
        <p>No technologies available.</p>
      ) : (
        <ul>
          {techs.map((t) => {
            const def = TECH_DEFS.find((d) => d.name === t.name);
            const prices = def?.prices ?? [];
            const affordable = canAfford(prices, resources);
            const costLabel = prices.length > 0
              ? ` (${prices.map((p) => `${p.val} ${p.name}`).join(", ")})`
              : "";
            return (
              <li key={t.name} data-testid={`tech-${t.name}`}>
                <span className="tech-name">{t.name}</span>
                {t.researched ? (
                  <span className="tech-done"> — Done</span>
                ) : (
                  <button
                    type="button"
                    disabled={isPending || !affordable}
                    onClick={() => mutate({ type: "RESEARCH", name: t.name })}
                  >
                    Research{costLabel}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
