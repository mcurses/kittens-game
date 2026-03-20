// SciencePanel — displays available technologies with research controls
import type { GameStateResponse } from "@kittens/api-spec";
import React from "react";
import { useGameAction } from "./useGameAction.js";

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
  const { mutate, isPending } = useGameAction();

  if (!state) {
    return <div data-testid="science-panel-loading">Loading science...</div>;
  }

  const techs = extractTechs(state);

  return (
    <div data-testid="science-panel">
      <h2>Science</h2>
      {techs.length === 0 ? (
        <p>No technologies available.</p>
      ) : (
        <ul>
          {techs.map((t) => (
            <li key={t.name} data-testid={`tech-${t.name}`}>
              <span className="tech-name">{t.name}</span>
              {t.researched ? (
                <span className="tech-done"> — Done</span>
              ) : (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => mutate({ type: "RESEARCH", name: t.name })}
                >
                  Research
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
