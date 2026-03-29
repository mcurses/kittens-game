// TimePanel — Chronoforge mechanics: CFUs, VSUs, heat, flux
import type { GameStateResponse } from "@kittens/api-spec";
import { CFU_DEFS, VSU_DEFS, getCfuPrice, getVsuPrice } from "@kittens/engine";
import React from "react";
import { useGameAction } from "./useGameAction.js";

interface ResourceMap {
  [key: string]: { value: number };
}

interface CfuEntry {
  name: string;
  val: number;
  on: number;
  unlocked: boolean;
  heat: number;
}

interface VsuEntry {
  name: string;
  val: number;
  on: number;
  unlocked: boolean;
}

interface Props {
  state: GameStateResponse | null | undefined;
}

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

function canAfford(prices: readonly { name: string; val: number }[], resources: ResourceMap): boolean {
  return prices.every((p) => (resources[p.name]?.value ?? 0) >= p.val);
}

function extractTime(state: GameStateResponse): {
  heat: number;
  flux: number;
  cfus: CfuEntry[];
  vsus: VsuEntry[];
  unlocked: boolean;
} {
  const raw = state as unknown as Record<string, unknown>;
  const time = raw.time as Record<string, unknown> | null | undefined;
  if (!time) return { heat: 0, flux: 0, cfus: [], vsus: [], unlocked: false };

  const heat = typeof time.heat === "number" ? time.heat : 0;
  const flux = typeof time.flux === "number" ? time.flux : 0;

  const cfusRaw = time.cfus as Record<string, unknown> | null | undefined;
  const cfus: CfuEntry[] = cfusRaw
    ? Object.entries(cfusRaw)
        .map(([name, e]) => {
          if (typeof e !== "object" || e === null) return null;
          const entry = e as Record<string, unknown>;
          return {
            name,
            val: typeof entry.val === "number" ? entry.val : 0,
            on: typeof entry.on === "number" ? entry.on : 0,
            unlocked: entry.unlocked === true,
            heat: typeof entry.heat === "number" ? entry.heat : 0,
          };
        })
        .filter((e): e is CfuEntry => e !== null && e.unlocked)
    : [];

  const vsusRaw = time.vsus as Record<string, unknown> | null | undefined;
  const vsus: VsuEntry[] = vsusRaw
    ? Object.entries(vsusRaw)
        .map(([name, e]) => {
          if (typeof e !== "object" || e === null) return null;
          const entry = e as Record<string, unknown>;
          return {
            name,
            val: typeof entry.val === "number" ? entry.val : 0,
            on: typeof entry.on === "number" ? entry.on : 0,
            unlocked: entry.unlocked === true,
          };
        })
        .filter((e): e is VsuEntry => e !== null && e.unlocked)
    : [];

  const unlocked = cfus.length > 0 || vsus.length > 0 || heat > 0 || flux > 0;

  return { heat, flux, cfus, vsus, unlocked };
}

export function TimePanel({ state }: Props): React.ReactElement {
  const { mutate, isPending } = useGameAction();

  if (!state) {
    return <div data-testid="time-panel-loading">Loading time...</div>;
  }

  const { heat, flux, cfus, vsus, unlocked } = extractTime(state);
  const resources = extractResources(state);

  if (!unlocked) {
    return (
      <div data-testid="time-panel">
        <h2>Time</h2>
        <p>Time mechanics not yet unlocked.</p>
      </div>
    );
  }

  return (
    <div data-testid="time-panel">
      <h2>Time</h2>
      <section>
        <p>Heat: {heat.toFixed(1)}</p>
        <p>Flux: {flux.toFixed(1)}</p>
        <button
          type="button"
          disabled={isPending}
          onClick={() => mutate({ type: "SHATTER_TC" })}
        >
          Shatter TC
        </button>
      </section>

      {cfus.length > 0 && (
        <section>
          <h3>Chronoforge Upgrades (CFU)</h3>
          <ul>
            {cfus.map((c) => {
              const def = CFU_DEFS.find((d) => d.name === c.name);
              const prices = def ? getCfuPrice(def, c.val) : [];
              const affordable = canAfford(prices, resources);
              return (
                <li key={c.name} data-testid={`cfu-${c.name}`}>
                  <span>{c.name}</span>
                  {" ×"}
                  {c.val}
                  <button
                    type="button"
                    data-testid={`cfu-${c.name}-buy`}
                    disabled={isPending || !affordable}
                    onClick={() => mutate({ type: "BUY_CFU", name: c.name })}
                  >
                    Buy
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {vsus.length > 0 && (
        <section>
          <h3>Voidspace Upgrades (VSU)</h3>
          <ul>
            {vsus.map((v) => {
              const def = VSU_DEFS.find((d) => d.name === v.name);
              const prices = def ? getVsuPrice(def, v.val) : [];
              const affordable = canAfford(prices, resources);
              return (
                <li key={v.name} data-testid={`vsu-${v.name}`}>
                  <span>{v.name}</span>
                  {" ×"}
                  {v.val}
                  <button
                    type="button"
                    data-testid={`vsu-${v.name}-buy`}
                    disabled={isPending || !affordable}
                    onClick={() => mutate({ type: "BUY_VSU", name: v.name })}
                  >
                    Buy
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
