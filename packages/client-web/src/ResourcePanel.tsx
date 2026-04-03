// ResourcePanel — resource inventory with rates and progress bars
import type { GameStateResponse } from "@kittens/api-spec";
import { deriveUiVisibility } from "@kittens/engine";
import React from "react";
import { type ResourceEntity, useInspector } from "./InspectorContext.js";
import { usePersistentUiState } from "./usePersistentUiState.js";

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
          visibleResources.map((r) => (
            <ResourceItem
              key={r.name}
              resource={r}
              breakdown={getResourceBreakdown(effectCache, r.name)}
              showPerSecond={showPerSecond}
              {...(r.name === "catnip" && "catnipDemandRatio" in effectCache ? { demandRatio: effectCache.catnipDemandRatio } : {})}
            />
          ))
        )}
      </ul>
    </>
  );
}

function ResourceItem({
  resource,
  breakdown,
  showPerSecond,
  demandRatio,
}: {
  resource: ResourceEntry;
  breakdown: ResourceBreakdown;
  showPerSecond: boolean;
  demandRatio?: number | undefined;
}): React.ReactElement {
  const { setInspected, clearInspected } = useInspector();

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

  return (
    <li
      data-testid={`resource-${resource.name}`}
      className="resource-item"
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
    </li>
  );
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
