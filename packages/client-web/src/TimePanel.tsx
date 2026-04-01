// TimePanel — Chronoforge mechanics: CFUs, VSUs, heat, flux
import type { GameStateResponse } from "@kittens/api-spec";
import { CFU_DEFS, VSU_DEFS, deriveUiVisibility, getCfuPrice, getVsuPrice } from "@kittens/engine";
import React from "react";
import { useSlot } from "./SlotContext.js";
import { useGameAction } from "./useGameAction.js";
import { canAfford, extractResources } from "./utils.js";

interface CfuEntry { name: string; val: number; on: number; unlocked: boolean; heat: number; }
interface VsuEntry { name: string; val: number; on: number; unlocked: boolean; }
interface Props { state: GameStateResponse | null | undefined; }

function extractTime(state: GameStateResponse): { heat: number; flux: number; cfus: CfuEntry[]; vsus: VsuEntry[]; unlocked: boolean; } {
  const raw = state as unknown as Record<string, unknown>;
  const time = raw.time as Record<string, unknown> | null | undefined;
  if (!time) return { heat: 0, flux: 0, cfus: [], vsus: [], unlocked: false };

  const heat = typeof time.heat === "number" ? time.heat : 0;
  const flux = typeof time.flux === "number" ? time.flux : 0;

  const cfusRaw = time.cfus as Record<string, unknown> | null | undefined;
  const cfus: CfuEntry[] = cfusRaw
    ? Object.entries(cfusRaw).map(([name, e]) => {
        if (typeof e !== "object" || e === null) return null;
        const entry = e as Record<string, unknown>;
        return { name, val: typeof entry.val === "number" ? entry.val : 0,
          on: typeof entry.on === "number" ? entry.on : 0, unlocked: entry.unlocked === true,
          heat: typeof entry.heat === "number" ? entry.heat : 0 };
      }).filter((e): e is CfuEntry => e !== null && e.unlocked)
    : [];

  const vsusRaw = time.vsus as Record<string, unknown> | null | undefined;
  const vsus: VsuEntry[] = vsusRaw
    ? Object.entries(vsusRaw).map(([name, e]) => {
        if (typeof e !== "object" || e === null) return null;
        const entry = e as Record<string, unknown>;
        return { name, val: typeof entry.val === "number" ? entry.val : 0,
          on: typeof entry.on === "number" ? entry.on : 0, unlocked: entry.unlocked === true };
      }).filter((e): e is VsuEntry => e !== null && e.unlocked)
    : [];

  const unlocked = cfus.length > 0 || vsus.length > 0 || heat > 0 || flux > 0;
  return { heat, flux, cfus, vsus, unlocked };
}

export function TimePanel({ state }: Props): React.ReactElement {
  const slot = useSlot();
  const { mutate, isPending } = useGameAction(slot);

  if (!state) {
    return <div className="loading-text" data-testid="time-panel-loading">Loading…</div>;
  }

  const { heat, flux, cfus, vsus, unlocked } = extractTime(state);
  const resources = extractResources(state);
  const visibility = deriveUiVisibility(state);

  if (!unlocked) {
    return (
      <div data-testid="time-panel">
        <p className="panel-empty">Time mechanics not yet unlocked.</p>
      </div>
    );
  }

  return (
    <div data-testid="time-panel">
      <div className="stat-grid">
        <div className="stat-card">
          <span className="stat-val">{heat.toFixed(1)}</span>
          <span className="stat-lbl">Heat</span>
        </div>
        <div className="stat-card">
          <span className="stat-val">{flux.toFixed(1)}</span>
          <span className="stat-lbl">Flux</span>
        </div>
      </div>

      {visibility.time.shatterVisible && (
        <button type="button" className="btn btn--secondary btn--sm"
          disabled={isPending} onClick={() => mutate({ type: "SHATTER_TC" })}>
          Shatter TC
        </button>
      )}

      {cfus.length > 0 && (
        <div className="panel-subsection">
          <div className="panel-sublabel">Chronoforge Upgrades</div>
          <ul className="item-list">
            {cfus.map((c) => {
              const def = CFU_DEFS.find((d) => d.name === c.name);
              const prices = def ? getCfuPrice(def, c.val) : [];
              const affordable = canAfford(prices, resources);
              return (
                <li key={c.name} data-testid={`cfu-${c.name}`} className="item-row">
                  <span className="item-row-name">{c.name}</span>
                  <span className="item-row-cost">×{c.val}</span>
                  <button type="button" data-testid={`cfu-${c.name}-buy`}
                    className={`btn btn--sm${affordable ? " btn--primary" : " btn--secondary"}`}
                    disabled={isPending || !affordable}
                    onClick={() => mutate({ type: "BUY_CFU", name: c.name })}>
                    Buy
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {vsus.length > 0 && (
        <div className="panel-subsection">
          <div className="panel-sublabel">Voidspace Upgrades</div>
          <ul className="item-list">
            {vsus.map((v) => {
              const def = VSU_DEFS.find((d) => d.name === v.name);
              const prices = def ? getVsuPrice(def, v.val) : [];
              const affordable = canAfford(prices, resources);
              return (
                <li key={v.name} data-testid={`vsu-${v.name}`} className="item-row">
                  <span className="item-row-name">{v.name}</span>
                  <span className="item-row-cost">×{v.val}</span>
                  <button type="button" data-testid={`vsu-${v.name}-buy`}
                    className={`btn btn--sm${affordable ? " btn--primary" : " btn--secondary"}`}
                    disabled={isPending || !affordable}
                    onClick={() => mutate({ type: "BUY_VSU", name: v.name })}>
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
