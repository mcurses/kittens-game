// ReligionPanel — faith, praise, ziggurat/religion/transcendence/TU upgrades
import type { GameStateResponse } from "@kittens/api-spec";
import { RELIGION_UPGRADE_DEFS, TRANSCENDENCE_UPGRADE_DEFS, ZIGGURAT_UPGRADE_DEFS } from "@kittens/engine";
import React from "react";
import { useInspector } from "./InspectorContext.js";
import { useSlot } from "./SlotContext.js";
import { useGameAction } from "./useGameAction.js";
import { canAfford, extractResources } from "./utils.js";

interface ZuEntry { name: string; val: number; on: number; unlocked: boolean; }
interface RuEntry { name: string; val: number; on: number; }
interface TuEntry { name: string; val: number; on: number; unlocked: boolean; }

interface Props { state: GameStateResponse | null | undefined; }

function extractReligion(state: GameStateResponse): {
  worship: number; faithRatio: number; transcendenceTier: number;
  zu: ZuEntry[]; ru: RuEntry[]; tu: TuEntry[];
} {
  const raw = state as unknown as Record<string, unknown>;
  const religion = raw.religion as Record<string, unknown> | null | undefined;
  if (!religion) return { worship: 0, faithRatio: 0, transcendenceTier: 0, zu: [], ru: [], tu: [] };

  const worship = typeof religion.worship === "number" ? religion.worship : 0;
  const faithRatio = typeof religion.faithRatio === "number" ? religion.faithRatio : 0;
  const transcendenceTier = typeof religion.transcendenceTier === "number" ? religion.transcendenceTier : 0;

  const zuRaw = religion.zu as Record<string, unknown> | null | undefined;
  const zu: ZuEntry[] = zuRaw
    ? Object.entries(zuRaw).map(([name, e]) => {
        if (typeof e !== "object" || e === null) return null;
        const entry = e as Record<string, unknown>;
        return { name, val: typeof entry.val === "number" ? entry.val : 0,
          on: typeof entry.on === "number" ? entry.on : 0, unlocked: entry.unlocked === true };
      }).filter((e): e is ZuEntry => e !== null && e.unlocked)
    : [];

  const ruRaw = religion.ru as Record<string, unknown> | null | undefined;
  const ru: RuEntry[] = ruRaw
    ? Object.entries(ruRaw).map(([name, e]) => {
        if (typeof e !== "object" || e === null) return { name, val: 0, on: 0 };
        const entry = e as Record<string, unknown>;
        return { name, val: typeof entry.val === "number" ? entry.val : 0,
          on: typeof entry.on === "number" ? entry.on : 0 };
      })
    : [];

  // TU (Transcendence Upgrades) — serialized as religion.tu or religion.transcendenceUpgrades
  const tuRaw = (religion.tu ?? religion.transcendenceUpgrades) as Record<string, unknown> | null | undefined;
  const tu: TuEntry[] = tuRaw
    ? Object.entries(tuRaw).map(([name, e]) => {
        if (typeof e !== "object" || e === null) return null;
        const entry = e as Record<string, unknown>;
        return { name, val: typeof entry.val === "number" ? entry.val : 0,
          on: typeof entry.on === "number" ? entry.on : 0, unlocked: entry.unlocked === true };
      }).filter((e): e is TuEntry => e !== null && (e.unlocked || e.val > 0))
    : [];

  return { worship, faithRatio, transcendenceTier, zu, ru, tu };
}

export function ReligionPanel({ state }: Props): React.ReactElement {
  const slot = useSlot();
  const { mutate, isPending } = useGameAction(slot);
  const { setInspected, clearInspected } = useInspector();

  if (!state) {
    return <div className="loading-text" data-testid="religion-panel-loading">Loading…</div>;
  }

  const { worship, faithRatio, transcendenceTier, zu, ru, tu } = extractReligion(state);
  const resources = extractResources(state);

  return (
    <div data-testid="religion-panel">
      <div className="worship-display">
        <span className="worship-value">{worship.toFixed(1)}</span>
        <span className="worship-label">Faith (worship)</span>
        <div className="worship-actions">
          <button type="button" className="btn btn--secondary btn--sm"
            disabled={isPending} onClick={() => mutate({ type: "PRAISE" })}>
            Praise
          </button>
          {faithRatio > 0 && (
            <span className="praise-multiplier" data-testid="praise-multiplier">
              ×{faithRatio.toFixed(2)}
            </span>
          )}
          <button type="button" className="btn btn--primary btn--sm"
            disabled={isPending} onClick={() => mutate({ type: "ADORE" })}>
            Adore
          </button>
        </div>
      </div>

      {zu.length > 0 && (
        <div className="panel-subsection">
          <div className="panel-sublabel">Ziggurat Upgrades</div>
          <ul className="item-list">
            {zu.map((u) => {
              const def = ZIGGURAT_UPGRADE_DEFS.find((d) => d.name === u.name);
              const prices = def?.prices ?? [];
              const affordable = canAfford(prices, resources);
              return (
                <li key={u.name} data-testid={`zu-${u.name}`} className="item-row"
                  onMouseEnter={() => setInspected({ kind: "zigguratUpgrade", name: u.name,
                    description: def?.description, val: u.val, effects: def?.effects ?? {},
                    prices, resources })}
                  onMouseLeave={clearInspected}
                  onFocus={() => setInspected({ kind: "zigguratUpgrade", name: u.name,
                    description: def?.description, val: u.val, effects: def?.effects ?? {},
                    prices, resources })}
                  onBlur={clearInspected}
                  tabIndex={0}>
                  <span className="item-row-name">{u.name}</span>
                  <span className="item-row-cost">×{u.val}</span>
                  <button type="button" data-testid={`zu-${u.name}-buy`}
                    className={`btn btn--sm${affordable ? " btn--primary" : " btn--secondary"}`}
                    disabled={isPending || !affordable}
                    onClick={() => mutate({ type: "BUY_ZIGGURAT_UPGRADE", name: u.name })}>
                    Buy
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {ru.length > 0 && (
        <div className="panel-subsection">
          <div className="panel-sublabel">Religion Upgrades</div>
          <ul className="item-list">
            {ru.map((u) => {
              const def = RELIGION_UPGRADE_DEFS.find((d) => d.name === u.name);
              const prices = def?.prices ?? [];
              const affordable = canAfford(prices, resources);
              const isDone = def?.oneTime === true && u.val >= 1;
              return (
                <li key={u.name} data-testid={`ru-${u.name}`} className="item-row"
                  onMouseEnter={() => setInspected({ kind: "religionUpgrade", name: u.name,
                    description: def?.description, val: u.val, effects: def?.effects ?? {},
                    prices, resources })}
                  onMouseLeave={clearInspected}
                  onFocus={() => setInspected({ kind: "religionUpgrade", name: u.name,
                    description: def?.description, val: u.val, effects: def?.effects ?? {},
                    prices, resources })}
                  onBlur={clearInspected}
                  tabIndex={0}>
                  <span className="item-row-name">{u.name}</span>
                  {isDone ? (
                    <span className="item-row-done">✓ Done</span>
                  ) : (
                    <>
                      <span className="item-row-cost">×{u.val}</span>
                      <button type="button" data-testid={`ru-${u.name}-buy`}
                        className={`btn btn--sm${affordable ? " btn--primary" : " btn--secondary"}`}
                        disabled={isPending || !affordable}
                        onClick={() => mutate({ type: "BUY_RELIGION_UPGRADE", name: u.name })}>
                        Buy
                      </button>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="panel-subsection">
        <div className="panel-sublabel">Transcendence</div>
        <div className="item-row">
          <span className="item-row-name">Transcendence</span>
          <span className="item-row-cost">Tier: {transcendenceTier}</span>
          <button type="button" className="btn btn--sm btn--primary"
            disabled={isPending} onClick={() => mutate({ type: "TRANSCEND" })}>
            Transcend
          </button>
        </div>
      </div>

      {tu.length > 0 && (
        <div className="panel-subsection">
          <div className="panel-sublabel">Cryptotheology</div>
          <ul className="item-list">
            {tu.map((u) => {
              const def = TRANSCENDENCE_UPGRADE_DEFS.find((d) => d.name === u.name);
              const prices = def?.prices ?? [];
              return (
                <li key={u.name} data-testid={`tu-${u.name}`} className="item-row"
                  onMouseEnter={() => setInspected({ kind: "zigguratUpgrade", name: u.name,
                    description: undefined, val: u.val, effects: def?.effects ?? {},
                    prices, resources })}
                  onMouseLeave={clearInspected}
                  onFocus={() => setInspected({ kind: "zigguratUpgrade", name: u.name,
                    description: undefined, val: u.val, effects: def?.effects ?? {},
                    prices, resources })}
                  onBlur={clearInspected}
                  tabIndex={0}>
                  <span className="item-row-name">{u.name}</span>
                  <span className="item-row-cost">×{u.val}</span>
                  <button type="button" data-testid={`tu-${u.name}-buy`}
                    className="btn btn--sm btn--primary"
                    disabled={isPending}
                    onClick={() => mutate({ type: "BUY_TRANSCENDENCE_UPGRADE", name: u.name })}>
                    Buy
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
