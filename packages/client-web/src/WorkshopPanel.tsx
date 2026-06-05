// WorkshopPanel — displays upgrades and craftable resources with costs
import type { GameStateResponse } from "@kittens/api-spec";
import { CRAFT_DEFS, UPGRADE_DEFS } from "@kittens/engine";
import React from "react";
import { useInspector } from "./InspectorContext.js";
import { useSlot } from "./SlotContext.js";
import { useGameAction } from "./useGameAction.js";
import { CRAFT_FLAVOR, UPGRADE_FLAVOR, prettifyName } from "./flavorText.js";
import { PlaceholderImage } from "./PlaceholderImage.js";
import { spriteFor } from "./resourceSprites.js";
import { ResourceIcon } from "./ui/index.js";
import { usePersistentUiState } from "./usePersistentUiState.js";
import { type ResourceMap, canAfford, extractEffectCache, extractResources, isStorageLimited } from "./utils.js";

interface UpgradeEntry {
  name: string;
  unlocked: boolean;
  researched: boolean;
}

interface CraftEntry {
  name: string;
  unlocked: boolean;
  engineers: number;
  progress: number;
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
        engineers: typeof e.engineers === "number" ? e.engineers : 0,
        progress: typeof e.progress === "number" ? e.progress : 0,
      };
    })
    .filter((e): e is CraftEntry => e !== null && e.unlocked);
}

/** Check if mechanization tech is researched */
function isMechanizationResearched(state: GameStateResponse): boolean {
  const raw = state as unknown as Record<string, unknown>;
  const science = raw.science;
  if (typeof science !== "object" || science === null) return false;
  const techs = (science as Record<string, unknown>).techs;
  if (typeof techs !== "object" || techs === null) return false;
  const mech = (techs as Record<string, unknown>).mechanization;
  if (typeof mech !== "object" || mech === null) return false;
  return (mech as Record<string, unknown>).researched === true;
}

/** Get total engineer kittens from village.jobs.engineer */
function getTotalEngineers(state: GameStateResponse): number {
  const raw = state as unknown as Record<string, unknown>;
  const village = raw.village;
  if (typeof village !== "object" || village === null) return 0;
  const jobs = (village as Record<string, unknown>).jobs;
  if (typeof jobs !== "object" || jobs === null) return 0;
  const eng = (jobs as Record<string, unknown>).engineer;
  if (typeof eng !== "object" || eng === null) return 0;
  return typeof (eng as Record<string, unknown>).value === "number"
    ? ((eng as Record<string, unknown>).value as number)
    : 0;
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

/** Compute craft output for a given amount, respecting ignoreBonuses and tier ratios */
function computeCraftOutput(craftName: string, amount: number, effectCache: Record<string, number>): number {
  const def = CRAFT_DEFS.find((d) => d.name === craftName);
  if (!def) return amount;
  if (def.ignoreBonuses) return amount;
  let craftRatio = effectCache.craftRatio ?? 0;
  if (def.tier >= 1 && def.tier <= 5) {
    craftRatio += effectCache[`t${def.tier}CraftRatio`] ?? 0;
  }
  return amount * (1 + craftRatio);
}

/** Format craft output for display: drop ".0" suffix */
function formatOutput(n: number): string {
  return n === Math.floor(n) ? String(n) : n.toFixed(1);
}

export function WorkshopPanel({ state }: Props): React.ReactElement {
  const slot = useSlot();
  const { mutate, isPending } = useGameAction(slot);
  const { setInspected, clearInspected, setPinned, pinned } = useInspector();
  const [hideResearched, setHideResearched] = usePersistentUiState<boolean>(
    "workshop:hideResearched",
    false,
    isBoolean,
  );

  if (!state) {
    return <div className="loading-text" data-testid="workshop-panel-loading">Loading…</div>;
  }

  const upgrades = extractUpgrades(state);
  const crafts = extractCrafts(state);
  const resources = extractResources(state);
  const effectCache = extractEffectCache(state);
  const craftRatio = effectCache.craftRatio ?? 0;
  const mechanization = isMechanizationResearched(state);
  const totalEngineers = getTotalEngineers(state);
  const assignedEngineers = crafts.reduce((sum, c) => sum + c.engineers, 0);
  const freeEngineers = totalEngineers - assignedEngineers;

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
        <ul className="card-grid">
          {visibleUpgrades.map((u) => {
            const def = UPGRADE_DEFS.find((d) => d.name === u.name);
            const prices = def?.prices ?? [];
            const affordable = canAfford(prices, resources);
            const storageLimited = isStorageLimited(prices, resources);
            const costLabel =
              prices.length > 0
                ? prices.map((p) => `${p.val} ${p.name}`).join(" · ")
                : "";
            const upgradeEntity = () => ({
              kind: "upgrade" as const,
              name: u.name,
              description: def?.description,
              flavor: UPGRADE_FLAVOR[u.name],
              researched: u.researched,
              effects: def?.effects ?? {},
              prices: [...prices],
              resources,
              iconPath: def?.iconPath,
            });
            const inspect = () => setInspected(upgradeEntity());
            const isPinnedHere = pinned?.kind === "upgrade" && pinned.name === u.name;

            return (
              <li
                key={u.name}
                data-testid={`upgrade-${u.name}`}
                className={`upgrade-card${u.researched ? " upgrade-card--done" : ""}`}
                data-pinned={isPinnedHere ? "true" : "false"}
                onClick={(e) => {
                  const tgt = e.target as HTMLElement;
                  if (tgt.closest("button, input, select, a, [data-no-pin]")) return;
                  setPinned(upgradeEntity());
                }}
                onMouseEnter={inspect}
                onMouseLeave={clearInspected}
                onFocus={inspect}
                onBlur={clearInspected}
                tabIndex={0}
              >
                <div className="upgrade-card__image-wrap">
                  <PlaceholderImage
                    variant="character"
                    src={def?.iconPath}
                    alt={u.name}
                    className="upgrade-card__image"
                  />
                  {!u.researched && (
                    <button
                      type="button"
                      data-testid={`upgrade-${u.name}-purchase`}
                      className={`btn btn--xs upgrade-card__buy${affordable ? " btn--primary" : " btn--secondary"}${storageLimited ? " btn--limited" : ""}`}
                      disabled={isPending || !affordable}
                      onClick={() => mutate({ type: "PURCHASE_UPGRADE", name: u.name })}
                    >
                      Buy
                    </button>
                  )}
                  {u.researched && (
                    <span className="upgrade-card__done-badge">✓ Done</span>
                  )}
                </div>
                <div className="upgrade-card__footer">
                  <span className="upgrade-card__name">{prettifyName(u.name)}</span>
                  {!u.researched && costLabel && (
                    <span className="upgrade-card__cost">{costLabel}</span>
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
          {mechanization && totalEngineers > 0 && (
            <div className="craft-engineer-summary" data-testid="free-engineers">
              Free engineers: {freeEngineers} / {totalEngineers}
            </div>
          )}
          <ul className="item-list">
            {crafts.map((c) => {
              const def = CRAFT_DEFS.find((d) => d.name === c.name);
              const [s1, s2, s3, all] = computeCraftShortcuts(c.name, resources);
              const shortcuts = [
                { key: "s1", amount: s1, label: `×${s1}` },
                { key: "s2", amount: s2, label: `×${s2}` },
                { key: "s3", amount: s3, label: `×${s3}` },
                { key: "all", amount: all, label: "All" },
              ];

              const progressPct = Math.min(99, Math.floor(c.progress * 100));
              const progressStr = progressPct < 10 ? `0${progressPct}` : String(progressPct);
              const showProgress = mechanization && c.engineers > 0;

              const outputSprite = spriteFor(c.name);
              const inputPrice = def?.prices[0];
              const inputSprite = inputPrice ? spriteFor(inputPrice.name) : undefined;
              const craftEntity = () => ({
                kind: "craft" as const,
                name: c.name,
                flavor: CRAFT_FLAVOR[c.name],
                engineers: c.engineers,
                progress: c.progress,
              });
              const inspect = () => setInspected(craftEntity());
              const isPinnedHere = pinned?.kind === "craft" && pinned.name === c.name;

              return (
                <li
                  key={c.name}
                  data-testid={`craft-${c.name}`}
                  className="item-row craft-row"
                  data-pinned={isPinnedHere ? "true" : "false"}
                  onClick={(e) => {
                    const tgt = e.target as HTMLElement;
                    if (tgt.closest("button, input, select, a, [data-no-pin]")) return;
                    setPinned(craftEntity());
                  }}
                  onMouseEnter={inspect}
                  onMouseLeave={clearInspected}
                  onFocus={inspect}
                  onBlur={clearInspected}
                  tabIndex={0}
                >
                  <ResourceIcon name={c.name} size="md" className="craft-row__icon" />
                  <div className="craft-row__content">
                    <span className="item-row-name craft-name">{prettifyName(c.name)}</span>
                    {inputPrice && (
                      <span className="craft-row__cost" data-testid={`craft-${c.name}-cost`}>
                        for {inputPrice.val}{" "}
                        <ResourceIcon name={inputPrice.name} size="xs" />{" "}
                        {prettifyName(inputPrice.name)}
                      </span>
                    )}
                  </div>
                  {showProgress && (
                    <span className="craft-progress" data-testid={`craft-${c.name}-progress`}>
                      [{progressStr}%]
                    </span>
                  )}
                  <div className="craft-amounts">
                    {shortcuts.map((sc) => {
                      const output = computeCraftOutput(c.name, sc.amount, effectCache);
                      const scaledPrices = def
                        ? def.prices.map((p) => ({ name: p.name, val: p.val * sc.amount }))
                        : [];
                      return (
                        <button
                          key={sc.key}
                          type="button"
                          data-testid={`craft-${c.name}-${sc.key}`}
                          className="btn btn--secondary btn--xs"
                          disabled={isPending}
                          title={`+${formatOutput(output)}`}
                          onClick={() => mutate({ type: "CRAFT", name: c.name, amount: sc.amount })}
                          onMouseEnter={(e) => {
                            e.stopPropagation();
                            setInspected({
                              kind: "craftShortcut",
                              name: c.name,
                              amount: sc.amount,
                              output,
                              prices: scaledPrices,
                              resources,
                            });
                          }}
                        >
                          {sc.label}
                        </button>
                      );
                    })}
                  </div>
                  {mechanization && (
                    <div className="craft-engineers" data-testid={`craft-${c.name}-engineers`}>
                      <button
                        type="button"
                        data-testid={`craft-${c.name}-engineer-remove`}
                        className="btn btn--xs btn--secondary"
                        disabled={isPending || c.engineers <= 0}
                        onClick={() => mutate({ type: "UNASSIGN_CRAFT_ENGINEER", name: c.name })}
                      >
                        -
                      </button>
                      <span className="craft-engineer-count">{c.engineers}</span>
                      <button
                        type="button"
                        data-testid={`craft-${c.name}-engineer-add`}
                        className="btn btn--xs btn--secondary"
                        disabled={isPending || freeEngineers <= 0}
                        onClick={() => mutate({ type: "ASSIGN_CRAFT_ENGINEER", name: c.name })}
                      >
                        +
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}
