// ResourcePanel — resource inventory with rates and progress bars
import type { GameStateResponse } from "@kittens/api-spec";
import { CRAFT_DEFS, RESOURCE_DISPLAY, SEASON_DEFS, deriveUiVisibility, getResourceAttribution } from "@kittens/engine";
import React from "react";
import { type ResourceAttributionEntry, type ResourceEntity, useInspector } from "./InspectorContext.js";
import { useSlot } from "./SlotContext.js";
import { type IngredientNode, expandCraftCosts } from "./expandCraftCosts.js";
import { useGameAction } from "./useGameAction.js";
import { usePersistentUiState } from "./usePersistentUiState.js";
import { formatDuration } from "./utils.js";

const TICKS_PER_SECOND = 5;
const RESOURCE_RATE_UNIT_KEY = "kittens.ui.resourceRateUnit";
type ResourceRateUnit = "perTick" | "perSecond";

interface ResourceEntry {
  name: string;
  value: number;
  unlocked?: boolean;
  maxValue?: number;
  perTick?: number;
}

interface ResourceBreakdown {
  base: number;
  ratio: number;
  direct: number;
  consumption: number;
}

interface Props {
  state: GameStateResponse | null | undefined;
}

/** Extract resources array from serialized game state (duck-typed). */
function extractResources(state: GameStateResponse): ResourceEntry[] {
  const raw = state as unknown as Record<string, unknown>;
  const resources = raw.resources;
  if (typeof resources !== "object" || resources === null) return [];
  return Object.entries(resources as Record<string, unknown>)
    .map(([name, entry]) => {
      if (typeof entry !== "object" || entry === null) return null;
      const e = entry as Record<string, unknown>;
      return {
        name,
        value: typeof e.value === "number" ? e.value : 0,
        ...(typeof e.unlocked === "boolean" ? { unlocked: e.unlocked } : {}),
        ...(typeof e.maxValue === "number" ? { maxValue: e.maxValue } : {}),
        ...(typeof e.perTick === "number" ? { perTick: e.perTick } : {}),
      };
    })
    .filter((e): e is ResourceEntry => e !== null);
}

function extractHiddenResources(state: GameStateResponse): Set<string> {
  const raw = state as unknown as Record<string, unknown>;
  const hidden = raw.hiddenResources;
  if (!Array.isArray(hidden)) return new Set();
  return new Set(hidden.filter((n): n is string => typeof n === "string"));
}

function extractCalendar(state: GameStateResponse): { day: number; season: number; year: number } | null {
  const raw = state as unknown as Record<string, unknown>;
  const cal = raw.calendar;
  if (typeof cal !== "object" || cal === null) return null;
  const c = cal as Record<string, unknown>;
  if (typeof c.season !== "number") return null;
  return { day: (c.day as number) ?? 0, season: c.season, year: (c.year as number) ?? 0 };
}

function extractEffectCache(state: GameStateResponse): Record<string, number> {
  const raw = state as unknown as Record<string, unknown>;
  const effectCache = raw.effectCache;
  if (typeof effectCache !== "object" || effectCache === null) return {};
  const result: Record<string, number> = {};
  for (const [key, value] of Object.entries(effectCache as Record<string, unknown>)) {
    if (typeof value === "number") result[key] = value;
  }
  return result;
}

/** Extract the set of resource names that have an unlocked craft recipe. */
function extractUnlockedCraftNames(state: GameStateResponse): Set<string> {
  const raw = state as unknown as Record<string, unknown>;
  const workshop = raw.workshop;
  if (typeof workshop !== "object" || workshop === null) return new Set();
  const crafts = (workshop as Record<string, unknown>).crafts;
  if (typeof crafts !== "object" || crafts === null) return new Set();
  const result = new Set<string>();
  for (const [name, entry] of Object.entries(crafts as Record<string, unknown>)) {
    if (typeof entry === "object" && entry !== null && (entry as Record<string, unknown>).unlocked === true) {
      result.add(name);
    }
  }
  return result;
}

/** Compute adaptive craft shortcut amounts matching legacy left.jsx logic. */
function computeCraftShortcuts(
  craftName: string,
  resources: ResourceEntry[],
): [number, number, number, number] {
  const def = CRAFT_DEFS.find((d) => d.name === craftName);
  if (!def || def.prices.length === 0) return [1, 25, 100, 0];
  const resMap = new Map(resources.map((r) => [r.name, r.value]));
  let all = Infinity;
  for (const p of def.prices) {
    const v = resMap.get(p.name) ?? 0;
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

export function ResourcePanel({ state }: Props): React.ReactElement {
  const [rateUnit, setRateUnit] = usePersistentUiState<ResourceRateUnit>(
    RESOURCE_RATE_UNIT_KEY,
    "perTick",
    isResourceRateUnit,
  );
  const { inspected } = useInspector();
  const slot = useSlot();
  const { mutate, isPending } = useGameAction(slot);
  const showPerSecond = rateUnit === "perSecond";

  // Compute per-source attribution from the raw game state.
  // Must be called before the early return to satisfy Rules of Hooks.
  const attributionMap = React.useMemo(() => {
    if (!state) return new Map<string, ResourceAttributionEntry[]>();
    const resources = extractResources(state);
    const map = new Map<string, ResourceAttributionEntry[]>();
    const rawState = state as unknown as import("@kittens/engine").GameState;
    if (rawState.effectCache && rawState.buildings && rawState.village) {
      for (const r of resources) {
        const attr = getResourceAttribution(rawState, r.name);
        if (attr.length > 0) map.set(r.name, attr);
      }
    }
    return map;
  }, [state]);

  if (!state) {
    return <div className="loading-text" data-testid="resource-panel-loading">Loading resources...</div>;
  }

  const resources = extractResources(state);
  const effectCache = extractEffectCache(state);
  const visibility = deriveUiVisibility(state);
  const craftableNames = extractUnlockedCraftNames(state);
  const craftRatio = effectCache.craftRatio ?? 0;

  const hiddenResources = extractHiddenResources(state);
  const calendar = extractCalendar(state);

  const visibleResources = resources.filter(
    (resource) =>
      resource.name !== "kittens" &&
      !hiddenResources.has(resource.name) &&
      ((visibility.resources[resource.name]?.visible ?? resource.unlocked === true) ||
        resource.value > 0),
  );

  // Build highlight map only when an action item (with prices) is inspected.
  // ResourceEntity has no prices field — hovering a resource must NOT trigger highlighting.
  const highlightMap: Map<string, IngredientNode> | null =
    inspected !== null && "prices" in inspected && inspected.prices.length > 0
      ? expandCraftCosts(
          inspected.prices,
          CRAFT_DEFS,
          Object.fromEntries(
            resources.map((r) => [
              r.name,
              { value: r.value, maxValue: r.maxValue, perTick: r.perTick },
            ]),
          ),
        )
      : null;

  return (
    <>
      <div className="resource-panel-header">
        <span className="resource-panel-label">Resources</span>
        <button
          type="button"
          className="rate-toggle"
          onClick={() => setRateUnit(showPerSecond ? "perTick" : "perSecond")}
          aria-pressed={showPerSecond}
        >
          {showPerSecond ? "Show per tick" : "Show per second"}
        </button>
      </div>

      <ul
        className="resource-list"
        data-testid="resource-panel"
        aria-label="Resources"
      >
        {visibleResources.length === 0 ? (
          <li className="panel-empty">No resources yet.</li>
        ) : (
          buildRenderOrder(visibleResources, highlightMap).map((r) => (
            <ResourceItem
              key={r.name}
              resource={r}
              breakdown={getResourceBreakdown(effectCache, r.name)}
              showPerSecond={showPerSecond}
              highlightMap={highlightMap}
              craftable={craftableNames.has(r.name)}
              allResources={resources}
              craftRatio={craftRatio}
              attribution={attributionMap.get(r.name)}
              onCraft={(name, amount) => mutate({ type: "CRAFT", name, amount })}
              isPending={isPending}
              seasonIndex={calendar?.season}
              {...(r.name === "catnip" && "catnipDemandRatio" in effectCache ? { demandRatio: effectCache.catnipDemandRatio } : {})}
            />
          ))
        )}
      </ul>
    </>
  );
}

// ── Highlight helpers ─────────────────────────────────────

/**
 * When highlighting is active, reorder resources into a parent→child tree
 * followed by the dimmed tail. When inactive, return original order.
 */
function buildRenderOrder(
  resources: ResourceEntry[],
  highlightMap: Map<string, IngredientNode> | null,
): ResourceEntry[] {
  if (!highlightMap) return resources;

  const byName = new Map(resources.map((r) => [r.name, r]));

  // Build a children index: parentName → ordered list of child names
  const childrenOf = new Map<string, string[]>();
  for (const [name, node] of highlightMap) {
    if (node.depth > 1 && node.parentName) {
      const siblings = childrenOf.get(node.parentName) ?? [];
      siblings.push(name);
      childrenOf.set(node.parentName, siblings);
    }
  }

  const visited = new Set<string>();
  const ordered: ResourceEntry[] = [];

  function visit(name: string): void {
    if (visited.has(name)) return;
    visited.add(name);
    const r = byName.get(name);
    if (r) ordered.push(r);
    for (const child of childrenOf.get(name) ?? []) visit(child);
  }

  // Emit depth-1 roots in their original prices order
  for (const [name, node] of highlightMap) {
    if (node.depth === 1) visit(name);
  }

  // Append dimmed resources in original order
  for (const r of resources) {
    if (!visited.has(r.name)) ordered.push(r);
  }

  return ordered;
}

function getItemClass(
  name: string,
  highlightMap: Map<string, IngredientNode> | null,
): string {
  if (highlightMap === null) return "resource-item";
  const node = highlightMap.get(name);
  if (!node) return "resource-item resource-item--dimmed";
  const indent = node.depth > 1 ? ` resource-item--child-depth-${node.depth - 1}` : "";
  if (node.depth === 1) return `resource-item resource-item--highlighted${indent}`;
  if (node.depth === 2) return `resource-item resource-item--highlighted-secondary${indent}`;
  return `resource-item resource-item--highlighted-tertiary${indent}`;
}

function TargetMarker({
  resource,
  node,
}: {
  resource: ResourceEntry;
  node: IngredientNode;
}): React.ReactElement | null {
  const { value, maxValue } = resource;
  if (!maxValue || maxValue <= 0) return null;

  const storeLimited = node.amount > maxValue;
  const met = value >= node.amount;
  const pctLeft = storeLimited ? 1 : Math.min(node.amount / maxValue, 1);
  const markerClass = storeLimited
    ? "resource-bar-target resource-bar-target--limited"
    : met
    ? "resource-bar-target resource-bar-target--met"
    : "resource-bar-target resource-bar-target--unmet";

  return (
    <div
      className={markerClass}
      style={{ left: `${pctLeft * 100}%` }}
      aria-hidden="true"
    />
  );
}

function EtaLabel({
  resource,
  node,
}: {
  resource: ResourceEntry;
  node: IngredientNode;
}): React.ReactElement | null {
  const { value, maxValue, perTick } = resource;
  const storeLimited = maxValue !== undefined && maxValue > 0 && node.amount > maxValue;
  if (storeLimited) return null;
  if (value >= node.amount) return null;

  const perSec = (perTick ?? 0) * TICKS_PER_SECOND;
  if (perSec <= 0) {
    return <div className="resource-item-eta">—</div>;
  }

  const remaining = Math.max(0, (node.amount - value) / perSec);
  return <div className="resource-item-eta">in {formatDuration(remaining)}</div>;
}

// ── ResourceItem ──────────────────────────────────────────

function ResourceItem({
  resource,
  breakdown,
  showPerSecond,
  demandRatio,
  highlightMap,
  craftable,
  allResources,
  craftRatio,
  attribution,
  onCraft,
  isPending,
  seasonIndex,
}: {
  resource: ResourceEntry;
  breakdown: ResourceBreakdown;
  showPerSecond: boolean;
  demandRatio?: number | undefined;
  highlightMap: Map<string, IngredientNode> | null;
  craftable: boolean;
  allResources: ResourceEntry[];
  craftRatio: number;
  attribution?: ResourceAttributionEntry[];
  onCraft: (name: string, amount: number) => void;
  isPending: boolean;
  seasonIndex?: number;
}): React.ReactElement {
  const { setInspected, clearInspected } = useInspector();

  const node = highlightMap?.get(resource.name) ?? null;

  const pct =
    resource.maxValue && resource.maxValue > 0
      ? Math.min(1, resource.value / resource.maxValue)
      : null;

  const fillClass =
    pct === null
      ? ""
      : pct >= 0.99
      ? "resource-bar-fill--capped"
      : pct < 0.10
      ? "resource-bar-fill--low"
      : "";

  const rateSign =
    resource.perTick === undefined || resource.perTick === 0
      ? null
      : resource.perTick > 0
      ? "pos"
      : "neg";

  const handleInspect = () => {
    const entity: ResourceEntity = {
      kind: "resource",
      name: resource.name,
      value: resource.value,
      maxValue: resource.maxValue,
      perTick: resource.perTick,
      breakdown,
      attribution,
    };
    setInspected(entity);
  };

  const itemClass = getItemClass(resource.name, highlightMap);

  return (
    <li
      data-testid={`resource-${resource.name}`}
      className={itemClass}
      onMouseEnter={handleInspect}
      onMouseLeave={clearInspected}
      onFocus={handleInspect}
      onBlur={clearInspected}
      tabIndex={0}
    >
      {/* Name + value row */}
      <div className="resource-item-main">
        <span
          className={getResourceNameClass(resource.name)}
          style={getResourceNameStyle(resource.name)}
        >
          {resource.name}
        </span>
        <span className="resource-values">
          <span className={getCapacityClass(resource.value, resource.maxValue)}>{formatValue(resource.value)}</span>
          {resource.maxValue !== undefined && resource.maxValue > 0 ? (
            <span className="resource-max">/{formatValue(resource.maxValue)}</span>
          ) : node ? (
            <span className="resource-max resource-max--target">/{formatValue(node.amount)}</span>
          ) : null}
          {demandRatio !== undefined && demandRatio < 0 && (
            <span className="resource-demand" title="Demand reduction">
              {Math.round(demandRatio * 100)}%
            </span>
          )}
        </span>
      </div>

      {/* Progress bar + rate */}
      <div className="resource-item-meta">
        {pct !== null ? (
          <div className="resource-bar" aria-hidden="true">
            <div
              className={`resource-bar-fill ${fillClass}`}
              style={{ width: `${pct * 100}%` }}
            />
            {node && (
              <TargetMarker resource={resource} node={node} />
            )}
          </div>
        ) : (
          <div style={{ flex: 1 }} />
        )}

        {resource.perTick !== undefined && resource.perTick !== 0 ? (
          <span className={`rate-badge${rateSign ? ` rate-badge--${rateSign}` : ""}`}>
            {formatRate(resource.perTick, showPerSecond)}
          </span>
        ) : (
          <span className="rate-badge" />
        )}
        <WeatherBadge resourceName={resource.name} perTick={resource.perTick} seasonIndex={seasonIndex} />
      </div>

      {/* ETA label (only when highlighted and deficit exists) */}
      {node && (
        <EtaLabel resource={resource} node={node} />
      )}

      {/* Inline craft shortcuts for craftable resources */}
      {craftable && (
        <CraftShortcuts
          resourceName={resource.name}
          allResources={allResources}
          craftRatio={craftRatio}
          onCraft={onCraft}
          isPending={isPending}
        />
      )}

    </li>
  );
}

// ── CraftShortcuts ────────────────────────────────────────

function CraftShortcuts({
  resourceName,
  allResources,
  craftRatio,
  onCraft,
  isPending,
}: {
  resourceName: string;
  allResources: ResourceEntry[];
  craftRatio: number;
  onCraft: (name: string, amount: number) => void;
  isPending: boolean;
}): React.ReactElement {
  const [s1, s2, s3, all] = computeCraftShortcuts(resourceName, allResources);
  const def = CRAFT_DEFS.find((d) => d.name === resourceName);
  const resMap = new Map(allResources.map((r) => [r.name, r.value]));
  const bonus = def && !def.ignoreBonuses ? 1 + craftRatio : 1;
  const canAffordN = (n: number): boolean => {
    if (!def || n <= 0) return false;
    return def.prices.every((p) => (resMap.get(p.name) ?? 0) >= p.val * n);
  };

  const formatOutput = (n: number): string => {
    const out = n * bonus;
    if (bonus === 1 || out === n) return `+${n}`;
    return `+${out % 1 === 0 ? out.toFixed(0) : out.toFixed(2)}`;
  };

  /** Build a cost breakdown tooltip for a given craft amount. "All" gets no breakdown (legacy). */
  const costTooltip = (n: number, isAll: boolean): string => {
    if (isAll || !def) return `Craft ${formatOutput(n)} ${resourceName}`;
    const lines = def.prices.map((p) => `${p.name}: ${formatValue(p.val * n)}`);
    return `Craft ${formatOutput(n)} ${resourceName}\n${lines.join("\n")}`;
  };

  return (
    <div className="resource-craft-shortcuts" data-testid={`resource-craft-${resourceName}`}>
      <button
        type="button"
        className="btn btn--secondary btn--xs"
        data-testid={`resource-craft-${resourceName}-s1`}
        disabled={isPending || !canAffordN(s1)}
        onClick={() => onCraft(resourceName, s1)}
        title={costTooltip(s1, false)}
      >
        {formatOutput(s1)}
      </button>
      <button
        type="button"
        className="btn btn--secondary btn--xs"
        data-testid={`resource-craft-${resourceName}-s2`}
        disabled={isPending || !canAffordN(s2)}
        onClick={() => onCraft(resourceName, s2)}
        title={costTooltip(s2, false)}
      >
        {formatOutput(s2)}
      </button>
      <button
        type="button"
        className="btn btn--secondary btn--xs"
        data-testid={`resource-craft-${resourceName}-s3`}
        disabled={isPending || !canAffordN(s3)}
        onClick={() => onCraft(resourceName, s3)}
        title={costTooltip(s3, false)}
      >
        {formatOutput(s3)}
      </button>
      <button
        type="button"
        className="btn btn--secondary btn--xs"
        data-testid={`resource-craft-${resourceName}-all`}
        disabled={isPending || all <= 0}
        onClick={() => onCraft(resourceName, all)}
        title={costTooltip(all, true)}
      >
        +All
      </button>
    </div>
  );
}

// ── Resource display helpers ──────────────────────────────────

/** Map of season index → resources that have season modifiers. Currently only catnip. */
const SEASON_MODIFIED_RESOURCES = new Set(["catnip"]);

function getResourceNameClass(name: string): string {
  const meta = RESOURCE_DISPLAY[name];
  if (!meta) return "resource-name";
  if (meta.color) return "resource-name"; // custom color uses inline style
  if (meta.type === "uncommon") return "resource-name resource-name--uncommon";
  if (meta.type === "rare") return "resource-name resource-name--rare";
  if (meta.type === "exotic") return "resource-name resource-name--exotic";
  return "resource-name";
}

function getResourceNameStyle(name: string): React.CSSProperties | undefined {
  const meta = RESOURCE_DISPLAY[name];
  if (!meta?.color) return undefined;
  if (meta.type === "rare") return { color: meta.color, textShadow: `1px 0px 10px Coral` };
  return { color: meta.color };
}

function getCapacityClass(value: number, maxValue?: number): string {
  if (!maxValue || maxValue <= 0) return "resource-value";
  if (value > maxValue * 0.95) return "resource-value resource-value--notice";
  if (value > maxValue * 0.75) return "resource-value resource-value--warn";
  return "resource-value";
}

function WeatherBadge({
  resourceName,
  perTick,
  seasonIndex,
}: {
  resourceName: string;
  perTick?: number;
  seasonIndex?: number;
}): React.ReactElement | null {
  if (seasonIndex === undefined) return null;
  if (!SEASON_MODIFIED_RESOURCES.has(resourceName)) return null;
  if (!perTick || perTick === 0) return null;

  const def = SEASON_DEFS[seasonIndex];
  if (!def) return null;

  const modifier = def.catnipModifier;
  if (modifier === 1) return null; // no effect in summer/autumn

  const pct = modifier === 0 ? -100 : Math.max(-99, Math.round((modifier - 1) * 100));
  const sign = pct > 0 ? "+" : "";
  const cls = pct > 0 ? "weather-badge weather-badge--pos" : "weather-badge weather-badge--neg";

  return <span className={cls}>[{sign}{pct}%]</span>;
}

// ── Formatting helpers ─────────────────────────────────────

function formatValue(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 10_000) return `${(n / 1_000).toFixed(1)}k`;
  if (n >= 1_000) return n.toFixed(0);
  return n.toFixed(2);
}

function formatRate(perTick: number, showPerSecond: boolean): string {
  const rate = showPerSecond ? perTick * TICKS_PER_SECOND : perTick;
  const unit = showPerSecond ? "sec" : "tick";
  return `${rate > 0 ? "+" : ""}${rate.toFixed(3)}/${unit}`;
}

function getResourceBreakdown(
  effectCache: Record<string, number>,
  resourceName: string,
): ResourceBreakdown {
  return {
    base: effectCache[`${resourceName}PerTickBase`] ?? 0,
    ratio: effectCache[`${resourceName}Ratio`] ?? 0,
    direct: effectCache[`${resourceName}PerTick`] ?? 0,
    consumption: effectCache[`${resourceName}PerTickCon`] ?? 0,
  };
}

function isResourceRateUnit(value: unknown): value is ResourceRateUnit {
  return value === "perTick" || value === "perSecond";
}
