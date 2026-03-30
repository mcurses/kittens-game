// InspectorPanel — persistent detail view, updated on hover
import React from "react";
import {
  type BuildingEntity,
  type InspectorEntity,
  type ReligionUpgradeEntity,
  type ResourceEntity,
  type TechEntity,
  type UpgradeEntity,
  type ZigguratUpgradeEntity,
  useInspector,
} from "./InspectorContext.js";

const TICKS_PER_SECOND = 5;

export function InspectorPanel(): React.ReactElement {
  const { inspected } = useInspector();

  return (
    <div data-testid="inspector-panel" className="inspector-panel">
      {inspected ? <EntityDetail entity={inspected} /> : <InspectorPlaceholder />}
    </div>
  );
}

function InspectorPlaceholder(): React.ReactElement {
  return (
    <div className="inspector-placeholder">
      <span className="inspector-placeholder-text">Hover an item to inspect it</span>
    </div>
  );
}

function EntityDetail({ entity }: { entity: InspectorEntity }): React.ReactElement {
  switch (entity.kind) {
    case "resource":
      return <ResourceDetail entity={entity} />;
    case "building":
      return <BuildingDetail entity={entity} />;
    case "upgrade":
      return <UpgradeDetail entity={entity} />;
    case "tech":
      return <TechDetail entity={entity} />;
    case "zigguratUpgrade":
      return <ZigguratUpgradeDetail entity={entity} />;
    case "religionUpgrade":
      return <ReligionUpgradeDetail entity={entity} />;
  }
}

// ── Resource detail ───────────────────────────────────────────────────────────

function ResourceDetail({ entity }: { entity: ResourceEntity }): React.ReactElement {
  const { name, value, maxValue, perTick, breakdown } = entity;
  const showBreakdown =
    breakdown.base !== 0 || breakdown.ratio !== 0 || breakdown.direct !== 0 || breakdown.consumption !== 0;

  return (
    <div className="inspector-entity">
      <div className="inspector-name">{name}</div>
      <div className="inspector-kind">Resource</div>

      <dl className="inspector-stats">
        <div className="inspector-stat-row">
          <dt>Amount</dt>
          <dd>
            {formatValue(value)}
            {maxValue !== undefined ? ` / ${formatValue(maxValue)}` : ""}
          </dd>
        </div>
        {perTick !== undefined && perTick !== 0 && (
          <div className="inspector-stat-row">
            <dt>Net income</dt>
            <dd className={perTick > 0 ? "stat-pos" : "stat-neg"}>
              {formatRate(perTick)}
            </dd>
          </div>
        )}
      </dl>

      {showBreakdown && (
        <div className="inspector-section">
          <div className="inspector-section-label">Production breakdown</div>
          <dl className="inspector-stats">
            {breakdown.base !== 0 && (
              <div className="inspector-stat-row">
                <dt>Base</dt>
                <dd>{formatRate(breakdown.base)}</dd>
              </div>
            )}
            {breakdown.ratio !== 0 && (
              <div className="inspector-stat-row">
                <dt>Ratio bonus</dt>
                <dd>
                  {formatPct(breakdown.ratio)} ({formatRate(breakdown.base * breakdown.ratio)})
                </dd>
              </div>
            )}
            {breakdown.direct !== 0 && (
              <div className="inspector-stat-row">
                <dt>Direct</dt>
                <dd>{formatRate(breakdown.direct)}</dd>
              </div>
            )}
            {breakdown.consumption !== 0 && (
              <div className="inspector-stat-row">
                <dt>Consumption</dt>
                <dd className="stat-neg">{formatRate(breakdown.consumption)}</dd>
              </div>
            )}
          </dl>
        </div>
      )}

      {perTick !== undefined && perTick < 0 && value > 0 && (
        <div className="inspector-notice inspector-notice--warn">
          Time to zero: {formatDuration(value / (-perTick * TICKS_PER_SECOND))}
        </div>
      )}
      {perTick !== undefined &&
        perTick > 0 &&
        maxValue !== undefined &&
        maxValue > value && (
          <div className="inspector-notice">
            Time to cap:{" "}
            {formatDuration((maxValue - value) / (perTick * TICKS_PER_SECOND))}
          </div>
        )}
    </div>
  );
}

// ── Building detail ───────────────────────────────────────────────────────────

function BuildingDetail({ entity }: { entity: BuildingEntity }): React.ReactElement {
  return (
    <div className="inspector-entity">
      <div className="inspector-name">{entity.name}</div>
      <div className="inspector-kind">Building · {entity.val} built</div>
      {entity.description && (
        <p className="inspector-description">{entity.description}</p>
      )}
      <EffectsSection effects={entity.effects} />
      <PricesSection prices={entity.prices} label="Cost (next)" resources={entity.resources} />
    </div>
  );
}

// ── Upgrade detail ────────────────────────────────────────────────────────────

function UpgradeDetail({ entity }: { entity: UpgradeEntity }): React.ReactElement {
  return (
    <div className="inspector-entity">
      <div className="inspector-name">{entity.name}</div>
      <div className="inspector-kind">
        Workshop Upgrade{entity.researched ? " · Purchased" : ""}
      </div>
      {entity.description && (
        <p className="inspector-description">{entity.description}</p>
      )}
      <EffectsSection effects={entity.effects} />
      {!entity.researched && <PricesSection prices={entity.prices} label="Cost" resources={entity.resources} />}
    </div>
  );
}

// ── Tech detail ───────────────────────────────────────────────────────────────

function TechDetail({ entity }: { entity: TechEntity }): React.ReactElement {
  return (
    <div className="inspector-entity">
      <div className="inspector-name">{entity.name}</div>
      <div className="inspector-kind">
        Technology{entity.researched ? " · Researched" : ""}
      </div>
      {entity.description && (
        <p className="inspector-description">{entity.description}</p>
      )}
      <EffectsSection effects={entity.effects} />
      {!entity.researched && <PricesSection prices={entity.prices} label="Cost" resources={entity.resources} />}
    </div>
  );
}

// ── Ziggurat upgrade detail ───────────────────────────────────────────────────

function ZigguratUpgradeDetail({ entity }: { entity: ZigguratUpgradeEntity }): React.ReactElement {
  return (
    <div className="inspector-entity">
      <div className="inspector-name">{entity.name}</div>
      <div className="inspector-kind">Ziggurat Upgrade · ×{entity.val}</div>
      {entity.description && (
        <p className="inspector-description">{entity.description}</p>
      )}
      <EffectsSection effects={entity.effects} />
      <PricesSection prices={entity.prices} label="Cost (next)" resources={entity.resources} />
    </div>
  );
}

// ── Religion upgrade detail ───────────────────────────────────────────────────

function ReligionUpgradeDetail({ entity }: { entity: ReligionUpgradeEntity }): React.ReactElement {
  return (
    <div className="inspector-entity">
      <div className="inspector-name">{entity.name}</div>
      <div className="inspector-kind">Religion Upgrade · ×{entity.val}</div>
      {entity.description && (
        <p className="inspector-description">{entity.description}</p>
      )}
      <EffectsSection effects={entity.effects} />
      <PricesSection prices={entity.prices} label="Cost (next)" resources={entity.resources} />
    </div>
  );
}

// ── Shared sub-components ─────────────────────────────────────────────────────

function EffectsSection({
  effects,
}: {
  effects: Record<string, number>;
}): React.ReactElement | null {
  const entries = Object.entries(effects).filter(([, v]) => v !== 0);
  if (entries.length === 0) return null;
  return (
    <div className="inspector-section">
      <div className="inspector-section-label">Effects</div>
      <dl className="inspector-stats">
        {entries.map(([key, val]) => (
          <div key={key} className="inspector-stat-row">
            <dt className="inspector-effect-key">{key}</dt>
            <dd className={val > 0 ? "stat-pos" : "stat-neg"}>
              {val > 0 ? "+" : ""}
              {val % 1 === 0 ? val.toFixed(0) : val.toFixed(3)}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function PricesSection({
  prices,
  label,
  resources = {},
}: {
  prices: Array<{ name: string; val: number }>;
  label: string;
  resources?: Record<string, { value: number; perTick?: number }>;
}): React.ReactElement | null {
  if (prices.length === 0) return null;
  return (
    <div className="inspector-section">
      <div className="inspector-section-label">{label}</div>
      <dl className="inspector-stats inspector-prices">
        {prices.map((p) => {
          const res = resources[p.name];
          const have = res?.value ?? 0;
          const need = p.val;
          const perTick = res?.perTick;
          const affordable = have >= need;
          const shortfall = need - have;
          const ticksNeeded =
            !affordable && perTick && perTick > 0
              ? shortfall / perTick
              : null;

          return (
            <div key={p.name} className="inspector-stat-row inspector-price-row">
              <dt className="inspector-price-name">{p.name}</dt>
              <dd className="inspector-price-detail">
                <span className={affordable ? "stat-pos" : "stat-neg"}>
                  {formatValue(have)}
                </span>
                <span className="inspector-price-sep"> / </span>
                <span>{formatValue(need)}</span>
                {ticksNeeded !== null && (
                  <span className="inspector-price-eta">
                    {" "}~{formatDuration(ticksNeeded / TICKS_PER_SECOND)}
                  </span>
                )}
              </dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}

// ── Formatting helpers ────────────────────────────────────────────────────────

function formatValue(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 10_000) return `${(n / 1_000).toFixed(1)}k`;
  if (n >= 1_000) return n.toFixed(0);
  return n.toFixed(2);
}

function formatRate(perTick: number): string {
  const sign = perTick > 0 ? "+" : "";
  return `${sign}${perTick.toFixed(3)}/tick`;
}

function formatPct(value: number): string {
  return `${value > 0 ? "+" : ""}${(value * 100).toFixed(1)}%`;
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
