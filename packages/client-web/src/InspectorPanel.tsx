// InspectorPanel — persistent detail view, updated on hover
import React from "react";
import {
  type BuildingEntity,
  type HappinessEntity,
  type InspectorEntity,
  type ReligionUpgradeEntity,
  type ResourceEntity,
  type TechEntity,
  type UpgradeEntity,
  type ZigguratUpgradeEntity,
  useInspector,
} from "./InspectorContext.js";
import { formatDuration, isStorageLimited } from "./utils.js";

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
  const elapsedSeconds = useElapsedInspectorSeconds(entity);

  switch (entity.kind) {
    case "happiness":
      return <HappinessDetail entity={entity} />;
    case "resource":
      return <ResourceDetail entity={entity} elapsedSeconds={elapsedSeconds} />;
    case "building":
      return <BuildingDetail entity={entity} elapsedSeconds={elapsedSeconds} />;
    case "upgrade":
      return <UpgradeDetail entity={entity} elapsedSeconds={elapsedSeconds} />;
    case "tech":
      return <TechDetail entity={entity} elapsedSeconds={elapsedSeconds} />;
    case "zigguratUpgrade":
      return <ZigguratUpgradeDetail entity={entity} elapsedSeconds={elapsedSeconds} />;
    case "religionUpgrade":
      return <ReligionUpgradeDetail entity={entity} elapsedSeconds={elapsedSeconds} />;
  }
}

function HappinessDetail({ entity }: { entity: HappinessEntity }): React.ReactElement {
  const { totalPct, breakdown } = entity;

  return (
    <div className="inspector-entity">
      <div className="inspector-name">Happiness</div>
      <div className="inspector-kind">Village metric</div>

      <dl className="inspector-stats">
        <div className="inspector-stat-row">
          <dt>Current total</dt>
          <dd>{formatSignedPct(totalPct, false)}</dd>
        </div>
      </dl>

      <div className="inspector-section">
        <div className="inspector-section-label">Breakdown</div>
        <dl className="inspector-stats">
          <div className="inspector-stat-row">
            <dt>Base happiness</dt>
            <dd>{formatSignedPct(breakdown.base)}</dd>
          </div>
          {breakdown.buildings !== 0 && (
            <div className="inspector-stat-row">
              <dt>Building bonus</dt>
              <dd>{formatSignedPct(breakdown.buildings)}</dd>
            </div>
          )}
          {breakdown.luxuries !== 0 && (
            <div className="inspector-stat-row">
              <dt>Luxury bonus</dt>
              <dd>{formatSignedPct(breakdown.luxuries)}</dd>
            </div>
          )}
          {breakdown.karma !== 0 && (
            <div className="inspector-stat-row">
              <dt>Karma bonus</dt>
              <dd>{formatSignedPct(breakdown.karma)}</dd>
            </div>
          )}
          {breakdown.festival !== 0 && (
            <div className="inspector-stat-row">
              <dt>Festival bonus</dt>
              <dd>{formatSignedPct(breakdown.festival)}</dd>
            </div>
          )}
          {breakdown.penalty !== 0 && (
            <div className="inspector-stat-row">
              <dt>Unhappiness penalty</dt>
              <dd className="stat-neg">{formatSignedPct(-breakdown.penalty)}</dd>
            </div>
          )}
          {breakdown.penaltyBase !== 0 && (
            <div className="inspector-stat-row">
              <dt>Base penalty</dt>
              <dd className="stat-neg">{formatSignedPct(-breakdown.penaltyBase)}</dd>
            </div>
          )}
          {breakdown.penaltyMitigation !== 0 && (
            <div className="inspector-stat-row">
              <dt>Penalty mitigation</dt>
              <dd>{formatSignedPct(breakdown.penaltyMitigation)}</dd>
            </div>
          )}
        </dl>
      </div>
    </div>
  );
}

// ── Resource detail ───────────────────────────────────────────────────────────

function ResourceDetail({
  entity,
  elapsedSeconds,
}: {
  entity: ResourceEntity;
  elapsedSeconds: number;
}): React.ReactElement {
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
          Time to zero: {formatDuration(value / (-perTick * TICKS_PER_SECOND) - elapsedSeconds)}
        </div>
      )}
      {perTick !== undefined &&
        perTick > 0 &&
        maxValue !== undefined &&
        maxValue > value && (
          <div className="inspector-notice">
            Time to cap:{" "}
            {formatDuration((maxValue - value) / (perTick * TICKS_PER_SECOND) - elapsedSeconds)}
          </div>
        )}
    </div>
  );
}

// ── Building detail ───────────────────────────────────────────────────────────

function BuildingDetail({
  entity,
  elapsedSeconds,
}: {
  entity: BuildingEntity;
  elapsedSeconds: number;
}): React.ReactElement {
  return (
    <div className="inspector-entity">
      <div className="inspector-name">{entity.name}</div>
      <div className="inspector-kind">Building · {entity.val} built</div>
      {entity.description && (
        <p className="inspector-description">{entity.description}</p>
      )}
      <EffectsSection effects={entity.effects} />
      <PricesSection
        prices={entity.prices}
        label="Cost (next)"
        resources={entity.resources}
        elapsedSeconds={elapsedSeconds}
      />
    </div>
  );
}

// ── Upgrade detail ────────────────────────────────────────────────────────────

function UpgradeDetail({
  entity,
  elapsedSeconds,
}: {
  entity: UpgradeEntity;
  elapsedSeconds: number;
}): React.ReactElement {
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
      {!entity.researched && (
        <PricesSection
          prices={entity.prices}
          label="Cost"
          resources={entity.resources}
          elapsedSeconds={elapsedSeconds}
        />
      )}
    </div>
  );
}

// ── Tech detail ───────────────────────────────────────────────────────────────

function TechDetail({
  entity,
  elapsedSeconds,
}: {
  entity: TechEntity;
  elapsedSeconds: number;
}): React.ReactElement {
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
      {!entity.researched && (
        <PricesSection
          prices={entity.prices}
          label="Cost"
          resources={entity.resources}
          elapsedSeconds={elapsedSeconds}
        />
      )}
    </div>
  );
}

// ── Ziggurat upgrade detail ───────────────────────────────────────────────────

function ZigguratUpgradeDetail({
  entity,
  elapsedSeconds,
}: {
  entity: ZigguratUpgradeEntity;
  elapsedSeconds: number;
}): React.ReactElement {
  return (
    <div className="inspector-entity">
      <div className="inspector-name">{entity.name}</div>
      <div className="inspector-kind">Ziggurat Upgrade · ×{entity.val}</div>
      {entity.description && (
        <p className="inspector-description">{entity.description}</p>
      )}
      <EffectsSection effects={entity.effects} />
      <PricesSection
        prices={entity.prices}
        label="Cost (next)"
        resources={entity.resources}
        elapsedSeconds={elapsedSeconds}
      />
    </div>
  );
}

// ── Religion upgrade detail ───────────────────────────────────────────────────

function ReligionUpgradeDetail({
  entity,
  elapsedSeconds,
}: {
  entity: ReligionUpgradeEntity;
  elapsedSeconds: number;
}): React.ReactElement {
  return (
    <div className="inspector-entity">
      <div className="inspector-name">{entity.name}</div>
      <div className="inspector-kind">Religion Upgrade · ×{entity.val}</div>
      {entity.description && (
        <p className="inspector-description">{entity.description}</p>
      )}
      <EffectsSection effects={entity.effects} />
      <PricesSection
        prices={entity.prices}
        label="Cost (next)"
        resources={entity.resources}
        elapsedSeconds={elapsedSeconds}
      />
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
  elapsedSeconds,
}: {
  prices: Array<{ name: string; val: number }>;
  label: string;
  resources?: Record<string, { value: number; maxValue?: number; perTick?: number }>;
  elapsedSeconds: number;
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
          const storageLimited = isStorageLimited([p], resources);
          const shortfall = need - have;
          const ticksNeeded =
            !affordable && !storageLimited && perTick && perTick > 0
              ? shortfall / perTick
              : null;
          const remainingSeconds =
            ticksNeeded !== null ? ticksNeeded / TICKS_PER_SECOND - elapsedSeconds : null;

          return (
            <div
              key={p.name}
              className={`inspector-stat-row inspector-price-row${storageLimited ? " inspector-price-row--limited" : ""}`}
              data-testid={`inspector-price-${p.name}${storageLimited ? "-limited" : ""}`}
            >
              <dt className="inspector-price-name">{p.name}</dt>
              <dd className="inspector-price-detail">
                <span className={affordable ? "stat-pos" : "stat-neg"}>
                  {formatValue(have)}
                </span>
                <span className="inspector-price-sep"> / </span>
                <span>{formatValue(need)}{storageLimited ? "*" : ""}</span>
                {remainingSeconds !== null && (
                  <span className="inspector-price-eta">
                    {" "}~{formatDuration(remainingSeconds)}
                  </span>
                )}
              </dd>
            </div>
          );
        })}
      </dl>
      {isStorageLimited(prices, resources) && (
        <div className="inspector-notice inspector-notice--warn">
          * Limited by current storage
        </div>
      )}
    </div>
  );
}

function useElapsedInspectorSeconds(entity: InspectorEntity): number {
  const shouldTick = entityHasLiveDurations(entity);
  const [elapsedSeconds, setElapsedSeconds] = React.useState(0);

  React.useEffect(() => {
    setElapsedSeconds(0);
    if (!shouldTick) return;

    const intervalId = window.setInterval(() => {
      setElapsedSeconds((seconds) => seconds + 1);
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [entity, shouldTick]);

  return elapsedSeconds;
}

function entityHasLiveDurations(entity: InspectorEntity): boolean {
  if (entity.kind === "happiness") return false;
  if (entity.kind === "resource") {
    return (
      (entity.perTick !== undefined && entity.perTick < 0 && entity.value > 0) ||
      (entity.perTick !== undefined &&
        entity.perTick > 0 &&
        entity.maxValue !== undefined &&
        entity.maxValue > entity.value)
    );
  }

  if (
    entity.kind === "building" ||
    entity.kind === "upgrade" ||
    entity.kind === "tech" ||
    entity.kind === "zigguratUpgrade" ||
    entity.kind === "religionUpgrade"
  ) {
    return entity.prices.some((price) => {
      const resource = entity.resources[price.name];
      const have = resource?.value ?? 0;
      const perTick = resource?.perTick ?? 0;
      return have < price.val && perTick > 0 && !isStorageLimited([price], entity.resources);
    });
  }

  return false;
}

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

function formatSignedPct(value: number, withPlus = true): string {
  const rounded = Math.round(value);
  if (!withPlus) return `${rounded}%`;
  return `${rounded > 0 ? "+" : ""}${rounded}%`;
}
