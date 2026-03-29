// DiplomacyPanel — races, embassies, trade
import type { GameStateResponse } from "@kittens/api-spec";
import React from "react";
import { useGameAction } from "./useGameAction.js";
import { extractResources } from "./utils.js";

interface RaceEntry {
  name: string;
  unlocked: boolean;
  embassyLevel: number;
}

interface Props {
  state: GameStateResponse | null | undefined;
}

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
      return {
        name,
        unlocked: entry.unlocked === true,
        embassyLevel: typeof entry.embassyLevel === "number" ? entry.embassyLevel : 0,
      };
    })
    .filter((e): e is RaceEntry => e !== null && e.unlocked);
}

export function DiplomacyPanel({ state }: Props): React.ReactElement {
  const { mutate, isPending } = useGameAction();

  if (!state) {
    return <div data-testid="diplomacy-panel-loading">Loading diplomacy...</div>;
  }

  const races = extractDiplomacy(state);
  const _resources = extractResources(state);

  return (
    <div data-testid="diplomacy-panel">
      <h2>Diplomacy</h2>
      {races.length === 0 ? (
        <p>No races encountered yet.</p>
      ) : (
        <ul>
          {races.map((r) => (
            <li key={r.name} data-testid={`race-${r.name}`}>
              <span>{r.name}</span>
              {" (embassy: "}
              {r.embassyLevel}
              {")"}
              <button
                type="button"
                data-testid={`race-${r.name}-embassy`}
                disabled={isPending}
                onClick={() => mutate({ type: "SEND_EMBASSY", race: r.name })}
              >
                Send Embassy
              </button>
              <button
                type="button"
                data-testid={`race-${r.name}-trade`}
                disabled={isPending}
                onClick={() => mutate({ type: "TRADE", race: r.name })}
              >
                Trade
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
