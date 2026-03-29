// WorkshopPanel — displays upgrades and craftable resources with costs
import type { GameStateResponse } from "@kittens/api-spec";
import { UPGRADE_DEFS } from "@kittens/engine";
import React from "react";
import { useGameAction } from "./useGameAction.js";

interface UpgradeEntry {
  name: string;
  unlocked: boolean;
  researched: boolean;
}

interface CraftEntry {
  name: string;
  unlocked: boolean;
}

interface ResourceMap {
  [key: string]: { value: number };
}

interface Props {
  state: GameStateResponse | null | undefined;
}

function extractUpgrades(state: GameStateResponse): UpgradeEntry[] {
  const raw = state as unknown as Record<string, unknown>;
  const workshop = raw.workshop;
  if (typeof workshop !== "object" || workshop === null) return [];
  const upgrades = (workshop as Record<string, unknown>).upgrades;
  if (typeof upgrades !== "object" || upgrades === null) return [];
  return Object.entries(upgrades as Record<string, unknown>)
    .map(([name, entry]) => {
      if (typeof entry !== "object" || entry === null) return null;
      const e = entry as Record<string, unknown>;
      return {
        name,
        unlocked: e.unlocked === true,
        researched: e.researched === true,
      };
    })
    .filter((e): e is UpgradeEntry => e !== null && e.unlocked);
}

function extractCrafts(state: GameStateResponse): CraftEntry[] {
  const raw = state as unknown as Record<string, unknown>;
  const workshop = raw.workshop;
  if (typeof workshop !== "object" || workshop === null) return [];
  const crafts = (workshop as Record<string, unknown>).crafts;
  if (typeof crafts !== "object" || crafts === null) return [];
  return Object.entries(crafts as Record<string, unknown>)
    .map(([name, entry]) => {
      if (typeof entry !== "object" || entry === null) return null;
      const e = entry as Record<string, unknown>;
      return {
        name,
        unlocked: e.unlocked === true,
      };
    })
    .filter((e): e is CraftEntry => e !== null && e.unlocked);
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

export function WorkshopPanel({ state }: Props): React.ReactElement {
  const { mutate, isPending } = useGameAction();

  if (!state) {
    return <div data-testid="workshop-panel-loading">Loading workshop...</div>;
  }

  const upgrades = extractUpgrades(state);
  const crafts = extractCrafts(state);
  const resources = extractResources(state);

  return (
    <div data-testid="workshop-panel">
      <h2>Workshop</h2>
      {upgrades.length === 0 ? (
        <p>No upgrades available.</p>
      ) : (
        <ul>
          {upgrades.map((u) => {
            const def = UPGRADE_DEFS.find((d) => d.name === u.name);
            const prices = def?.prices ?? [];
            const affordable = canAfford(prices, resources);
            const costLabel = prices.length > 0
              ? ` (${prices.map((p) => `${p.val} ${p.name}`).join(", ")})`
              : "";
            return (
              <li key={u.name} data-testid={`upgrade-${u.name}`}>
                <span className="upgrade-name">{u.name}</span>
                {u.researched ? (
                  <span className="upgrade-done"> — Done</span>
                ) : (
                  <button
                    type="button"
                    disabled={isPending || !affordable}
                    onClick={() => mutate({ type: "PURCHASE_UPGRADE", name: u.name })}
                  >
                    Purchase{costLabel}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {crafts.length > 0 && (
        <section>
          <h3>Crafting</h3>
          <ul>
            {crafts.map((c) => (
              <li key={c.name} data-testid={`craft-${c.name}`}>
                <span className="craft-name">{c.name}</span>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => mutate({ type: "CRAFT", name: c.name, amount: 1 })}
                >
                  Craft
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
