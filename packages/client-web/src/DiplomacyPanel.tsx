// DiplomacyPanel — races, embassies, trade
import type { GameStateResponse } from "@kittens/api-spec";
import React from "react";
import { useGameAction } from "./useGameAction.js";
import { extractResources } from "./utils.js";

interface RaceEntry { name: string; unlocked: boolean; embassyLevel: number; }
interface Props { state: GameStateResponse | null | undefined; }

function extractDiplomacy(state: GameStateResponse): RaceEntry[] {
  const raw = state as unknown as Record<string, unknown>;
  const diplomacy = raw.diplomacy as Record<string, unknown> | null | undefined;
  if (!diplomacy) return [];
  const racesRaw = diplomacy.races as Record<string, unknown> | null | undefined;
  if (!racesRaw) return [];
  return Object.entries(racesRaw)
    .map(([name, e]) => {
      if (typeof e !== "object" || e === null) return null;
      const entry = e as Record<string, unknown>;
      return { name, unlocked: entry.unlocked === true,
        embassyLevel: typeof entry.embassyLevel === "number" ? entry.embassyLevel : 0 };
    })
    .filter((e): e is RaceEntry => e !== null && e.unlocked);
}

export function DiplomacyPanel({ state }: Props): React.ReactElement {
  const { mutate, isPending } = useGameAction();

  if (!state) {
    return <div className="loading-text" data-testid="diplomacy-panel-loading">Loading…</div>;
  }

  const races = extractDiplomacy(state);
  const _resources = extractResources(state);

  return (
    <div data-testid="diplomacy-panel">
      <div className="panel-label">Races</div>
      {races.length === 0 ? (
        <p className="panel-empty">No races encountered yet.</p>
      ) : (
        <ul className="item-list">
          {races.map((r) => (
            <li key={r.name} data-testid={`race-${r.name}`} className="item-row">
              <span className="item-row-name">{r.name}</span>
              <span className="item-row-cost">Embassy Lv.{r.embassyLevel}</span>
              <div className="item-row-actions">
                <button type="button" data-testid={`race-${r.name}-embassy`}
                  className="btn btn--secondary btn--sm"
                  disabled={isPending}
                  onClick={() => mutate({ type: "SEND_EMBASSY", race: r.name })}>
                  Embassy
                </button>
                <button type="button" data-testid={`race-${r.name}-trade`}
                  className="btn btn--primary btn--sm"
                  disabled={isPending}
                  onClick={() => mutate({ type: "TRADE", race: r.name })}>
                  Trade
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
