// ResourcePanel — resource inventory with rates and progress bars
import type { GameStateResponse } from "@kittens/api-spec";
import React from "react";
import { usePersistentUiState } from "./usePersistentUiState.js";

const TICKS_PER_SECOND = 5;
const RESOURCE_RATE_UNIT_KEY = "kittens.ui.resourceRateUnit";
type ResourceRateUnit = "perTick" | "perSecond";

interface ResourceEntry {
  name: string;
  value: number;
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
        ...(typeof e.maxValue === "number" ? { maxValue: e.maxValue } : {}),
        ...(typeof e.perTick === "number" ? { perTick: e.perTick } : {}),
      };
    })
    .filter((e): e is ResourceEntry => e !== null && e.value > 0);
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
        {resources.length === 0 ? (
          <li className="panel-empty">No resources yet.</li>
        ) : (
          resources.map((r) => (
            <ResourceItem
              key={r.name}
              resource={r}
              breakdown={getResourceBreakdown(effectCache, r.name)}
              showPerSecond={showPerSecond}
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
}: {
  resource: ResourceEntry;
  breakdown: ResourceBreakdown;
  showPerSecond: boolean;
}): React.ReactElement {
  const [tooltipVisible, setTooltipVisible] = React.useState(false);
  const hasTooltip = shouldShowTooltip(resource, breakdown);

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

  return (
    <li
      data-testid={`resource-${resource.name}`}
      className="resource-item"
      onMouseEnter={() => hasTooltip && setTooltipVisible(true)}
      onMouseLeave={() => setTooltipVisible(false)}
      onFocus={() => hasTooltip && setTooltipVisible(true)}
      onBlur={() => setTooltipVisible(false)}
      tabIndex={hasTooltip ? 0 : -1}
      aria-describedby={hasTooltip ? `tt-${resource.name}` : undefined}
    >
      {/* Name + value row */}
      <div className="resource-item-main">
        <span className="resource-name">{resource.name}</span>
        <span className="resource-values">
          <span className="resource-value">{formatValue(resource.value)}</span>
          {resource.maxValue !== undefined && (
            <span className="resource-max">/{formatValue(resource.maxValue)}</span>
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

      {/* Tooltip */}
      {hasTooltip && tooltipVisible && (
        <div
          id={`tt-${resource.name}`}
          role="tooltip"
          data-testid={`resource-tooltip-${resource.name}`}
          className="resource-tooltip"
        >
          <strong className="tt-title">{resource.name}</strong>

          {breakdown.base !== 0 && (
            <div>Base: {formatSigned(breakdown.base, showPerSecond)}</div>
          )}
          {breakdown.ratio !== 0 && (
            <div>
              Ratio bonus: {formatPct(breakdown.ratio)} ({formatSigned(breakdown.base * breakdown.ratio, showPerSecond)})
            </div>
          )}
          {breakdown.direct !== 0 && (
            <div>Direct: {formatSigned(breakdown.direct, showPerSecond)}</div>
          )}
          {breakdown.consumption !== 0 && (
            <div>Consumption: {formatSigned(breakdown.consumption, showPerSecond)}</div>
          )}

          {resource.perTick !== undefined && (
            <div style={{ marginTop: "0.3rem", borderTop: "1px dotted rgba(0,0,0,.15)", paddingTop: "0.3rem" }}>
              Net income: {formatSigned(resource.perTick, showPerSecond)}
            </div>
          )}

          {resource.perTick !== undefined && resource.perTick < 0 && resource.value > 0 && (
            <div>Time to zero: {formatDuration(resource.value / (-resource.perTick * TICKS_PER_SECOND))}</div>
          )}
          {resource.perTick !== undefined &&
            resource.perTick > 0 &&
            (resource.maxValue ?? 0) > resource.value && (
              <div>
                Time to cap:{" "}
                {formatDuration(
                  ((resource.maxValue ?? 0) - resource.value) /
                    (resource.perTick * TICKS_PER_SECOND),
                )}
              </div>
            )}
        </div>
      )}
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

function formatSigned(perTick: number, showPerSecond: boolean): string {
  return formatRate(perTick, showPerSecond);
}

function formatPct(value: number): string {
  return `${value > 0 ? "+" : ""}${(value * 100).toFixed(1)}%`;
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

function shouldShowTooltip(resource: ResourceEntry, breakdown: ResourceBreakdown): boolean {
  return (
    resource.perTick !== undefined &&
    (resource.perTick !== 0 ||
      breakdown.base !== 0 ||
      breakdown.ratio !== 0 ||
      breakdown.direct !== 0 ||
      breakdown.consumption !== 0)
  );
}

function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0s";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) {
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    return s > 0 ? `${m}m ${s}s` : `${m}m`;
  }
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function isResourceRateUnit(value: unknown): value is ResourceRateUnit {
  return value === "perTick" || value === "perSecond";
}
