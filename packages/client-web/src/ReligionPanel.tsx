// ReligionPanel — faith, praise, ziggurat/religion/transcendence upgrades
import type { GameStateResponse } from "@kittens/api-spec";
import { RELIGION_UPGRADE_DEFS, ZIGGURAT_UPGRADE_DEFS } from "@kittens/engine";
import React from "react";
import { useGameAction } from "./useGameAction.js";

interface ResourceMap {
  [key: string]: { value: number };
}

interface ZuEntry {
  name: string;
  val: number;
  on: number;
  unlocked: boolean;
}

interface RuEntry {
  name: string;
  val: number;
  on: number;
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

function extractReligion(state: GameStateResponse): {
  worship: number;
  faithRatio: number;
  transcendenceTier: number;
  zu: ZuEntry[];
  ru: RuEntry[];
} {
  const raw = state as unknown as Record<string, unknown>;
  const religion = raw.religion as Record<string, unknown> | null | undefined;
  if (!religion) {
    return { worship: 0, faithRatio: 0, transcendenceTier: 0, zu: [], ru: [] };
  }
  const worship = typeof religion.worship === "number" ? religion.worship : 0;
  const faithRatio = typeof religion.faithRatio === "number" ? religion.faithRatio : 0;
  const transcendenceTier = typeof religion.transcendenceTier === "number" ? religion.transcendenceTier : 0;

  const zuRaw = religion.zu as Record<string, unknown> | null | undefined;
  const zu: ZuEntry[] = zuRaw
    ? Object.entries(zuRaw)
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
        .filter((e): e is ZuEntry => e !== null && e.unlocked)
    : [];

  const ruRaw = religion.ru as Record<string, unknown> | null | undefined;
  const ru: RuEntry[] = ruRaw
    ? Object.entries(ruRaw).map(([name, e]) => {
        if (typeof e !== "object" || e === null) return { name, val: 0, on: 0 };
        const entry = e as Record<string, unknown>;
        return {
          name,
          val: typeof entry.val === "number" ? entry.val : 0,
          on: typeof entry.on === "number" ? entry.on : 0,
        };
      })
    : [];

  return { worship, faithRatio, transcendenceTier, zu, ru };
}

export function ReligionPanel({ state }: Props): React.ReactElement {
  const { mutate, isPending } = useGameAction();

  if (!state) {
    return <div data-testid="religion-panel-loading">Loading religion...</div>;
  }

  const { worship, transcendenceTier, zu, ru } = extractReligion(state);
  const resources = extractResources(state);

  return (
    <div data-testid="religion-panel">
      <h2>Religion</h2>

      <section>
        <p>Faith (worship): {worship.toFixed(1)}</p>
        <button
          type="button"
          disabled={isPending}
          onClick={() => mutate({ type: "PRAISE" })}
        >
          Praise
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => mutate({ type: "ADORE" })}
        >
          Adore
        </button>
      </section>

      {zu.length > 0 && (
        <section>
          <h3>Ziggurat Upgrades</h3>
          <ul>
            {zu.map((u) => {
              const def = ZIGGURAT_UPGRADE_DEFS.find((d) => d.name === u.name);
              const prices = def?.prices ?? [];
              const affordable = canAfford(prices, resources);
              return (
                <li key={u.name} data-testid={`zu-${u.name}`}>
                  <span>{u.name}</span>
                  {" ×"}
                  {u.val}
                  <button
                    type="button"
                    data-testid={`zu-${u.name}-buy`}
                    disabled={isPending || !affordable}
                    onClick={() => mutate({ type: "BUY_ZIGGURAT_UPGRADE", name: u.name })}
                  >
                    Buy
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {ru.length > 0 && (
        <section>
          <h3>Religion Upgrades</h3>
          <ul>
            {ru.map((u) => {
              const def = RELIGION_UPGRADE_DEFS.find((d) => d.name === u.name);
              const prices = def?.prices ?? [];
              const affordable = canAfford(prices, resources);
              return (
                <li key={u.name} data-testid={`ru-${u.name}`}>
                  <span>{u.name}</span>
                  {" ×"}
                  {u.val}
                  <button
                    type="button"
                    data-testid={`ru-${u.name}-buy`}
                    disabled={isPending || !affordable}
                    onClick={() => mutate({ type: "BUY_RELIGION_UPGRADE", name: u.name })}
                  >
                    Buy
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section>
        <h3>Transcendence</h3>
        <p>Tier: {transcendenceTier}</p>
        <button
          type="button"
          disabled={isPending}
          onClick={() => mutate({ type: "TRANSCEND" })}
        >
          Transcend
        </button>
      </section>
    </div>
  );
}
