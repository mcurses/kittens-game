// WorkshopPanel — displays upgrades and craftable resources with costs
import type { GameStateResponse } from "@kittens/api-spec";
import { CRAFT_DEFS, UPGRADE_DEFS } from "@kittens/engine";
import React from "react";
import { useInspector } from "./InspectorContext.js";
import { useSlot } from "./SlotContext.js";
import { useGameAction } from "./useGameAction.js";
import { usePersistentUiState } from "./usePersistentUiState.js";
import { type ResourceMap, canAfford, extractEffectCache, extractResources } from "./utils.js";

interface UpgradeEntry {
  name: string;
  unlocked: boolean;
  researched: boolean;
}

interface CraftEntry {
  name: string;
  unlocked: boolean;
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

/** Story 35-01: Compute adaptive craft shortcut amounts matching legacy left.jsx logic. */
function computeCraftShortcuts(craftName: string, resources: ResourceMap): [number, number, number, number] {
  const def = CRAFT_DEFS.find((d) => d.name === craftName);
  if (!def || def.prices.length === 0) return [1, 25, 100, 0];
  let all = Infinity;
  for (const p of def.prices) {
    const v = resources[p.name]?.value ?? 0;
    all = Math.min(all, Math.floor(v / p.val));
  }
  const n = all === Infinity ? 0 : all;
  return [
    Math.max(1, Math.floor(n * 0.01)),
    Math.max(25, Math.floor(n * 0.05)),
    Math.max(100, Math.floor(n * 0.1)),
    n,
  ];
}

export function WorkshopPanel({ state }: Props): React.ReactElement {
  const slot = useSlot();
  const { mutate, isPending } = useGameAction(slot);
  const { setInspected, clearInspected } = useInspector();
  const [hideResearched, setHideResearched] = usePersistentUiState<boolean>(
    "workshop:hideResearched",
    false,
  );

  if (!state) {
    return <div className="loading-text" data-testid="workshop-panel-loading">Loading…</div>;
  }

  const upgrades = extractUpgrades(state);
  const crafts = extractCrafts(state);
  const resources = extractResources(state);
  const effectCache = extractEffectCache(state);
  const craftRatio = effectCache.craftRatio ?? 0;

  const visibleUpgrades = hideResearched ? upgrades.filter((u) => !u.researched) : upgrades;

  return (
    <div data-testid="workshop-panel">
      <div className="panel-label">Upgrades</div>
      <label className="toggle-label" data-testid="workshop-hide-researched-label">
        <input
          type="checkbox"
          data-testid="workshop-hide-researched"
          checked={hideResearched}
          onChange={(e) => setHideResearched(e.target.checked)}
        />
        {" Hide researched"}
      </label>
      {visibleUpgrades.length === 0 ? (
        <p className="panel-empty">No upgrades available.</p>
      ) : (
        <ul className="item-list">
          {visibleUpgrades.map((u) => {
            const def = UPGRADE_DEFS.find((d) => d.name === u.name);
            const prices = def?.prices ?? [];
            const affordable = canAfford(prices, resources);
            const costLabel =
              prices.length > 0
                ? prices.map((p) => `${p.val} ${p.name}`).join(", ")
                : "";

            return (
              <li
                key={u.name}
                data-testid={`upgrade-${u.name}`}
                className="item-row"
                onMouseEnter={() =>
                  setInspected({
                    kind: "upgrade",
                    name: u.name,
                    description: def?.description,
                    researched: u.researched,
                    effects: def?.effects ?? {},
                    prices: [...prices],
                    resources,
                  })
                }
                onMouseLeave={clearInspected}
                onFocus={() =>
                  setInspected({
                    kind: "upgrade",
                    name: u.name,
                    description: def?.description,
                    researched: u.researched,
                    effects: def?.effects ?? {},
                    prices: [...prices],
                    resources,
                  })
                }
                onBlur={clearInspected}
                tabIndex={0}
              >
                <span className="item-row-name upgrade-name">{u.name}</span>
                {costLabel && !u.researched && (
                  <span className="item-row-cost">{costLabel}</span>
                )}
                <div className="item-row-actions">
                  {u.researched ? (
                    <span className="done-badge upgrade-done">✓ Done</span>
                  ) : (
                    <button
                      type="button"
                      className={`btn btn--sm${affordable ? " btn--primary" : " btn--secondary"}`}
                      disabled={isPending || !affordable}
                      onClick={() => mutate({ type: "PURCHASE_UPGRADE", name: u.name })}
                    >
                      Purchase
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {crafts.length > 0 && (
        <div className="panel-subsection">
          <div className="panel-sublabel">
            Crafting
            {craftRatio > 0 && (
              <span
                className="craft-effectiveness"
                data-testid="craft-effectiveness"
              >
                {" "}(+{Math.round(craftRatio * 100)}% effectiveness)
              </span>
            )}
          </div>
          <ul className="item-list">
            {crafts.map((c) => {
              const [s1, s2, s3, all] = computeCraftShortcuts(c.name, resources);
              return (
                <li key={c.name} data-testid={`craft-${c.name}`} className="item-row">
                  <span className="item-row-name craft-name">{c.name}</span>
                  <div className="craft-amounts">
                    <button
                      key="s1"
                      type="button"
                      data-testid={`craft-${c.name}-s1`}
                      className="btn btn--secondary btn--xs"
                      disabled={isPending}
                      onClick={() => mutate({ type: "CRAFT", name: c.name, amount: s1 })}
                    >
                      ×{s1}
                    </button>
                    <button
                      key="s2"
                      type="button"
                      data-testid={`craft-${c.name}-s2`}
                      className="btn btn--secondary btn--xs"
                      disabled={isPending}
                      onClick={() => mutate({ type: "CRAFT", name: c.name, amount: s2 })}
                    >
                      ×{s2}
                    </button>
                    <button
                      key="s3"
                      type="button"
                      data-testid={`craft-${c.name}-s3`}
                      className="btn btn--secondary btn--xs"
                      disabled={isPending}
                      onClick={() => mutate({ type: "CRAFT", name: c.name, amount: s3 })}
                    >
                      ×{s3}
                    </button>
                    <button
                      key="all"
                      type="button"
                      data-testid={`craft-${c.name}-all`}
                      className="btn btn--secondary btn--xs"
                      disabled={isPending}
                      onClick={() => mutate({ type: "CRAFT", name: c.name, amount: all })}
                    >
                      All
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
