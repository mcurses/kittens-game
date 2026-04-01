// DiplomacyPanel — races, embassies, trade
import type { GameStateResponse } from "@kittens/api-spec";
import { RACE_DEFS } from "@kittens/engine";
import React from "react";
import { useSlot } from "./SlotContext.js";
import { useGameAction } from "./useGameAction.js";
import { extractResources } from "./utils.js";

interface RaceEntry { name: string; unlocked: boolean; embassyLevel: number; }

function getRelation(standing: number): string {
  if (standing < 0) return "Hostile";
  if (standing > 0) return "Friendly";
  return "Neutral";
}
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
  const slot = useSlot();
  const { mutate, isPending } = useGameAction(slot);

  if (!state) {
    return <div className="loading-text" data-testid="diplomacy-panel-loading">Loading…</div>;
  }

  const races = extractDiplomacy(state);
  const _resources = extractResources(state);
  void _resources;

  return (
    <div data-testid="diplomacy-panel">
      <div className="panel-label">Races</div>
      {races.length === 0 ? (
        <p className="panel-empty">No races encountered yet.</p>
      ) : (
        <ul className="item-list">
          {races.map((r) => {
            const def = RACE_DEFS.find((d) => d.name === r.name);
            const relation = def ? getRelation(def.standing) : "Neutral";
            return (
              <li key={r.name} data-testid={`race-${r.name}`} className="item-row race-row">
                <div className="race-header">
                  <span className="item-row-name">{r.name}</span>
                  <span data-testid={`race-${r.name}-relation`} className={`race-relation race-relation--${relation.toLowerCase()}`}>
                    {relation}
                  </span>
                  <span className="item-row-cost">Embassy Lv.{r.embassyLevel}</span>
                </div>
                {def && (
                  <div className="race-economics">
                    <span data-testid={`race-${r.name}-buys`} className="race-buys">
                      Buys: {def.buys.map((b) => `${b.name} (${b.val})`).join(", ")}
                    </span>
                    <span data-testid={`race-${r.name}-sells`} className="race-sells">
                      Sells: {def.sells.map((s) => s.name).join(", ")}
                    </span>
                  </div>
                )}
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
            );
          })}
        </ul>
      )}
    </div>
  );
}
