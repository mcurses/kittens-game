// ResourcePanel — displays all resources and their per-tick rates
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
        maxValue: typeof e.maxValue === "number" ? e.maxValue : undefined,
        perTick: typeof e.perTick === "number" ? e.perTick : undefined,
      };
    })
    .filter((e): e is ResourceEntry => e !== null && e.value > 0);
}

function extractEffectCache(state: GameStateResponse): Record<string, number> {
  const raw = state as unknown as Record<string, unknown>;
  const effectCache = raw.effectCache;
  if (typeof effectCache !== "object" || effectCache === null) {
    return {};
  }

  const result: Record<string, number> = {};
  for (const [key, value] of Object.entries(effectCache as Record<string, unknown>)) {
    if (typeof value === "number") {
      result[key] = value;
    }
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
    return <div data-testid="resource-panel-loading">Loading resources...</div>;
  }

  const resources = extractResources(state);
  const effectCache = extractEffectCache(state);

  return (
    <div
      data-testid="resource-panel"
      style={{
        border: "1px solid #8d8d8d",
        padding: "0.75rem",
        backgroundColor: "#f7f3e8",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.5rem",
          marginBottom: "0.5rem",
        }}
      >
        <h2 style={{ margin: 0 }}>Resources</h2>
        <button
          type="button"
          onClick={() => setRateUnit(showPerSecond ? "perTick" : "perSecond")}
          aria-pressed={showPerSecond}
          style={{
            fontSize: "0.8rem",
            padding: "0.2rem 0.45rem",
            border: "1px solid #8d8d8d",
            backgroundColor: showPerSecond ? "#ddd4bc" : "#fdfaf0",
            cursor: "pointer",
          }}
        >
          {showPerSecond ? "Show per tick" : "Show per second"}
        </button>
      </div>
      {resources.length === 0 ? (
        <p>No resources yet.</p>
      ) : (
        <ul
          style={{
            listStyle: "none",
            margin: 0,
            padding: 0,
          }}
        >
          {resources.map((r) => (
            <ResourceRow
              key={r.name}
              resource={r}
              breakdown={getResourceBreakdown(effectCache, r.name)}
              showPerSecond={showPerSecond}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function ResourceRow({
  resource,
  breakdown,
  showPerSecond,
}: {
  resource: ResourceEntry;
  breakdown: ResourceBreakdown;
  showPerSecond: boolean;
}): React.ReactElement {
  const [isTooltipVisible, setIsTooltipVisible] = React.useState(false);
  const hasTooltip = resource.perTick !== undefined && shouldShowTooltip(resource, breakdown);

  return (
    <li
      key={resource.name}
      data-testid={`resource-${resource.name}`}
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "space-between",
        gap: "0.25rem 0.5rem",
        padding: "0.2rem 0",
        borderBottom: "1px dotted rgba(0, 0, 0, 0.15)",
        position: "relative",
      }}
      onMouseEnter={() => {
        if (hasTooltip) {
          setIsTooltipVisible(true);
        }
      }}
      onMouseLeave={() => setIsTooltipVisible(false)}
      onFocus={() => {
        if (hasTooltip) {
          setIsTooltipVisible(true);
        }
      }}
      onBlur={() => setIsTooltipVisible(false)}
      tabIndex={hasTooltip ? 0 : -1}
      aria-describedby={hasTooltip ? `${resource.name}-resource-tooltip` : undefined}
    >
      <span className="resource-name" style={{ textTransform: "capitalize" }}>
        {resource.name}
      </span>
      <span>
        <span className="resource-value">
          {resource.value.toFixed(2)}
          {resource.maxValue !== undefined ? ` / ${resource.maxValue.toFixed(0)}` : ""}
        </span>
        {resource.perTick !== undefined && resource.perTick !== 0 ? (
          <span className="resource-rate" style={{ opacity: 0.7 }}>
            {" "}
            ({formatRate(resource.perTick, showPerSecond)})
          </span>
        ) : null}
      </span>
      {hasTooltip && isTooltipVisible ? (
        <div
          id={`${resource.name}-resource-tooltip`}
          role="tooltip"
          data-testid={`resource-tooltip-${resource.name}`}
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            zIndex: 10,
            width: "220px",
            marginTop: "0.35rem",
            padding: "0.55rem 0.65rem",
            border: "1px solid #8d8d8d",
            backgroundColor: "#fff8e8",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.12)",
            fontSize: "0.8rem",
            lineHeight: 1.4,
          }}
        >
          <strong style={{ display: "block", marginBottom: "0.3rem", textTransform: "capitalize" }}>
            {resource.name}
          </strong>
          <div>Base: {formatSignedAmount(breakdown.base, showPerSecond)}</div>
          {breakdown.ratio !== 0 ? (
            <div>
              Ratio bonus: {formatPercent(breakdown.ratio)} (
              {formatSignedAmount(breakdown.base * breakdown.ratio, showPerSecond)})
            </div>
          ) : null}
          {breakdown.direct !== 0 ? (
            <div>Direct: {formatSignedAmount(breakdown.direct, showPerSecond)}</div>
          ) : null}
          {breakdown.consumption !== 0 ? (
            <div>Consumption: {formatSignedAmount(breakdown.consumption, showPerSecond)}</div>
          ) : null}
          {resource.perTick !== undefined ? (
            <div style={{ marginTop: "0.3rem", borderTop: "1px dotted rgba(0, 0, 0, 0.2)", paddingTop: "0.3rem" }}>
              Net income: {formatSignedAmount(resource.perTick, showPerSecond)}
            </div>
          ) : null}
          {resource.perTick !== undefined && resource.perTick < 0 && resource.value > 0 ? (
            <div>Time to zero: {formatDuration(resource.value / (-resource.perTick * TICKS_PER_SECOND))}</div>
          ) : null}
          {resource.perTick !== undefined &&
          resource.perTick > 0 &&
          (resource.maxValue ?? 0) > resource.value ? (
            <div>
              Time to cap:{" "}
              {formatDuration(((resource.maxValue ?? 0) - resource.value) / (resource.perTick * TICKS_PER_SECOND))}
            </div>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

function formatRate(perTick: number, showPerSecond: boolean): string {
  const rate = showPerSecond ? perTick * TICKS_PER_SECOND : perTick;
  const unit = showPerSecond ? "sec" : "tick";
  return `${rate > 0 ? "+" : ""}${rate.toFixed(3)}/${unit}`;
}

function formatSignedAmount(perTick: number, showPerSecond: boolean): string {
  return formatRate(perTick, showPerSecond);
}

function formatPercent(value: number): string {
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
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return "0s";
  }

  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  }

  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
}

function isResourceRateUnit(value: unknown): value is ResourceRateUnit {
  return value === "perTick" || value === "perSecond";
}
