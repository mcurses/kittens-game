// DiplomacyPanel — races, embassies, trade
import type { GameStateResponse } from "@kittens/api-spec";
import { RACE_DEFS } from "@kittens/engine";
import type React from "react";
import { useSlot } from "./SlotContext.js";
import { useGameAction } from "./useGameAction.js";
import { extractResources } from "./utils.js";

interface RaceEntry {
  name: string;
  unlocked: boolean;
  embassyLevel: number;
}
interface DiplomacyMeta {
  baseGoldCost: number;
  baseCatpowerCost: number;
}

function getRelation(standing: number): string {
  if (standing < 0) return "Hostile";
  if (standing > 0) return "Friendly";
  return "Neutral";
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
    .filter((e): e is RaceEntry => e?.unlocked);
}

function extractDiplomacyMeta(state: GameStateResponse): DiplomacyMeta {
  const raw = state as unknown as Record<string, unknown>;
  const diplomacy = raw.diplomacy as Record<string, unknown> | null | undefined;
  return {
    baseGoldCost: typeof diplomacy?.baseGoldCost === "number" ? diplomacy.baseGoldCost : 15,
    baseCatpowerCost:
      typeof diplomacy?.baseCatpowerCost === "number" ? diplomacy.baseCatpowerCost : 50,
  };
}

function getMaxTradeAmount(
  raceName: string,
  resources: ReturnType<typeof extractResources>,
  meta: DiplomacyMeta,
): number {
  const def = RACE_DEFS.find((d) => d.name === raceName);
  const buy = def?.buys[0];
  if (!buy) return 0;

  const goldTrades = Math.floor((resources.gold?.value ?? 0) / Math.max(meta.baseGoldCost, 1));
  const catpowerTrades = Math.floor(
    (resources.catpower?.value ?? 0) / Math.max(meta.baseCatpowerCost, 1),
  );
  const buyTrades = Math.floor((resources[buy.name]?.value ?? 0) / buy.val);

  return Math.max(0, Math.min(goldTrades, catpowerTrades, buyTrades));
}

export function DiplomacyPanel({ state }: Props): React.ReactElement {
  const slot = useSlot();
  const { mutate, isPending } = useGameAction(slot);

  if (!state) {
    return (
      <div className="loading-text" data-testid="diplomacy-panel-loading">
        Loading…
      </div>
    );
  }

  const races = extractDiplomacy(state);
  const resources = extractResources(state);
  const diplomacyMeta = extractDiplomacyMeta(state);

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
            const maxTradeAmount = getMaxTradeAmount(r.name, resources, diplomacyMeta);
            const tradeHalf = Math.floor(maxTradeAmount / 2);
            const tradeFifth = Math.floor(maxTradeAmount / 5);
            return (
              <li key={r.name} data-testid={`race-${r.name}`} className="item-row race-row">
                <div className="race-header">
                  <span className="item-row-name">{r.name}</span>
                  <span
                    data-testid={`race-${r.name}-relation`}
                    className={`race-relation race-relation--${relation.toLowerCase()}`}
                  >
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
                  <button
                    type="button"
                    data-testid={`race-${r.name}-embassy`}
                    className="btn btn--secondary btn--sm"
                    disabled={isPending}
                    onClick={() => mutate({ type: "SEND_EMBASSY", name: r.name })}
                  >
                    Embassy
                  </button>
                  <button
                    type="button"
                    data-testid={`race-${r.name}-trade`}
                    className="btn btn--primary btn--sm"
                    disabled={isPending}
                    onClick={() => mutate({ type: "TRADE", name: r.name })}
                  >
                    Trade
                  </button>
                  {maxTradeAmount >= 50 && (
                    <button
                      type="button"
                      data-testid={`race-${r.name}-trade-half`}
                      className="btn btn--primary btn--sm"
                      disabled={isPending || tradeHalf <= 0}
                      onClick={() => mutate({ type: "TRADE", name: r.name, amount: tradeHalf })}
                    >
                      {`×${tradeHalf}`}
                    </button>
                  )}
                  {maxTradeAmount >= 25 && (
                    <button
                      type="button"
                      data-testid={`race-${r.name}-trade-fifth`}
                      className="btn btn--primary btn--sm"
                      disabled={isPending || tradeFifth <= 0}
                      onClick={() => mutate({ type: "TRADE", name: r.name, amount: tradeFifth })}
                    >
                      {`×${tradeFifth}`}
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
