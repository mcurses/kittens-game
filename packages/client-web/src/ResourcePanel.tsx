// ResourcePanel — resource inventory with rates and progress bars
import type { GameStateResponse } from "@kittens/api-spec";
import { CRAFT_DEFS, deriveUiVisibility } from "@kittens/engine";
import React from "react";
import { type ResourceEntity, useInspector } from "./InspectorContext.js";
import { type IngredientNode, expandCraftCosts } from "./expandCraftCosts.js";
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

export function ResourcePanel({ state }: Props): React.ReactElement {
  const [rateUnit, setRateUnit] = usePersistentUiState<ResourceRateUnit>(
    RESOURCE_RATE_UNIT_KEY,
    "perTick",
    isResourceRateUnit,
  );
  const { inspected } = useInspector();
  const showPerSecond = rateUnit === "perSecond";

  if (!state) {
    return <div className="loading-text" data-testid="resource-panel-loading">Loading resources...</div>;
  }

  const resources = extractResources(state);
  const effectCache = extractEffectCache(state);
  const visibility = deriveUiVisibility(state);
  const visibleResources = resources.filter(
    (resource) =>
      resource.name !== "kittens" &&
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
  elapsedSeconds,
}: {
  resource: ResourceEntry;
  node: IngredientNode;
  elapsedSeconds: number;
}): React.ReactElement | null {
  const { value, maxValue, perTick } = resource;
  const storeLimited = maxValue !== undefined && maxValue > 0 && node.amount > maxValue;
  if (storeLimited) return null;
  if (value >= node.amount) return null;

  const perSec = (perTick ?? 0) * TICKS_PER_SECOND;
  if (perSec <= 0) {
    return <div className="resource-item-eta">—</div>;
  }

  const baseSeconds = (node.amount - value) / perSec;
  const remaining = Math.max(0, baseSeconds - elapsedSeconds);
  return <div className="resource-item-eta">in {formatDuration(remaining)}</div>;
}

// ── ResourceItem ──────────────────────────────────────────

function ResourceItem({
  resource,
  breakdown,
  showPerSecond,
  demandRatio,
  highlightMap,
}: {
  resource: ResourceEntry;
  breakdown: ResourceBreakdown;
  showPerSecond: boolean;
  demandRatio?: number | undefined;
  highlightMap: Map<string, IngredientNode> | null;
}): React.ReactElement {
  const { setInspected, clearInspected } = useInspector();
  const [elapsedSeconds, setElapsedSeconds] = React.useState(0);

  // Live ETA countdown — only active when this resource is highlighted
  const node = highlightMap?.get(resource.name) ?? null;
  const isHighlighted = node !== null;
  React.useEffect(() => {
    if (!isHighlighted) {
      setElapsedSeconds(0);
      return;
    }
    setElapsedSeconds(0);
    const id = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [isHighlighted, inspectedKey(highlightMap)]);

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
        <span className="resource-name">{resource.name}</span>
        <span className="resource-values">
          <span className="resource-value">{formatValue(resource.value)}</span>
          {resource.maxValue !== undefined && resource.maxValue > 0 && (
            <span className="resource-max">/{formatValue(resource.maxValue)}</span>
          )}
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
      </div>

      {/* ETA label (only when highlighted and deficit exists) */}
      {node && (
        <EtaLabel resource={resource} node={node} elapsedSeconds={elapsedSeconds} />
      )}

    </li>
  );
}

/** Stable key so useEffect resets elapsed when the inspected action changes. */
function inspectedKey(map: Map<string, IngredientNode> | null): string {
  if (!map) return "";
  return Array.from(map.keys()).sort().join(",");
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
