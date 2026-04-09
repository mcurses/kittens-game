// InspectorPanel — persistent detail view, updated on hover
import React from "react";
import {
  type BuildingEntity,
  type CraftEntity,
  type CraftShortcutEntity,
  type HappinessEntity,
  type InspectorEntity,
  type JobEntity,
  type PerkEntity,
  type PolicyEntity,
  type ReligionUpgradeEntity,
  type ResourceAttributionEntry,
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
    case "craft":
      return <CraftDetail entity={entity} />;
    case "craftShortcut":
      return <CraftShortcutDetail entity={entity} elapsedSeconds={elapsedSeconds} />;
    case "job":
      return <JobDetail entity={entity} />;
    case "policy":
      return <PolicyDetail entity={entity} elapsedSeconds={elapsedSeconds} />;
    case "perk":
      return <PerkDetail entity={entity} elapsedSeconds={elapsedSeconds} />;
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

      <AttributionSection attribution={entity.attribution} />

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

// ── Attribution section ──────────────────────────────────────────────────────

function AttributionSection({
  attribution,
}: {
  attribution?: ResourceAttributionEntry[];
}): React.ReactElement | null {
  if (!attribution || attribution.length === 0) return null;

  const production = attribution.filter((a) => a.channel !== "consumption" && a.channel !== "ratio");
  const ratios = attribution.filter((a) => a.channel === "ratio");
  const consumption = attribution.filter((a) => a.channel === "consumption");

  return (
    <div className="inspector-section" data-testid="inspector-attribution">
      <div className="inspector-section-label">Per-source breakdown</div>
      <dl className="inspector-stats">
        {production.map((s) => (
          <div key={`prod-${s.label}`} className="inspector-stat-row">
            <dt>{s.label}</dt>
            <dd className="stat-pos">{formatRate(s.amount)}</dd>
          </div>
        ))}
        {ratios.map((s) => (
          <div key={`ratio-${s.label}`} className="inspector-stat-row">
            <dt>{s.label}</dt>
            <dd className="stat-pos">{formatPct(s.amount)}</dd>
          </div>
        ))}
        {consumption.map((s) => (
          <div key={`con-${s.label}`} className="inspector-stat-row">
            <dt>{s.label}</dt>
            <dd className="stat-neg">{formatRate(s.amount)}</dd>
          </div>
        ))}
      </dl>
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
      <div className="inspector-kind">
        Building · {entity.val} built
        {entity.on !== undefined && entity.on < entity.val && ` (${entity.on} on)`}
      </div>
      {entity.description && (
        <p className="inspector-description">{entity.description}</p>
      )}
      {entity.automationEnabled !== undefined && (
        <div className="inspector-notice" data-testid="inspector-automation">
          Automation: {entity.automationEnabled ? "ON" : "OFF"}
        </div>
      )}
      {(entity.effects.cathPollutionPerTickProd ?? 0) > 0 && (
        <div className="inspector-notice inspector-notice--warn" data-testid="inspector-pollution">
          This building produces pollution
        </div>
      )}
      <EffectsSection effects={entity.effects} />
      <PricesSection
        prices={entity.prices}
        label="Cost (next)"
        resources={entity.resources}
        elapsedSeconds={elapsedSeconds}
      />
      {entity.flavor && (
        <p className="inspector-flavor" data-testid="inspector-flavor">{entity.flavor}</p>
      )}
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
      {entity.flavor && (
        <p className="inspector-flavor" data-testid="inspector-flavor">{entity.flavor}</p>
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
      {entity.flavor && (
        <p className="inspector-flavor" data-testid="inspector-flavor">{entity.flavor}</p>
      )}
    </div>
  );
}

// ── Policy detail ─────────────────────────────────────────────────────────────

function PolicyDetail({
  entity,
  elapsedSeconds,
}: {
  entity: PolicyEntity;
  elapsedSeconds: number;
}): React.ReactElement {
  return (
    <div className="inspector-entity">
      <div className="inspector-name">{entity.name}</div>
      <div className="inspector-kind">
        Policy{entity.researched ? " · Adopted" : entity.blocked ? " · Blocked" : ""}
      </div>
      {entity.description && (
        <p className="inspector-description">{entity.description}</p>
      )}
      <EffectsSection effects={entity.effects} />
      {!entity.researched && !entity.blocked && (
        <PricesSection
          prices={entity.prices}
          label="Cost"
          resources={entity.resources}
          elapsedSeconds={elapsedSeconds}
        />
      )}
      {entity.flavor && (
        <p className="inspector-flavor" data-testid="inspector-flavor">{entity.flavor}</p>
      )}
    </div>
  );
}

// ── Perk detail ───────────────────────────────────────────────────────────────

function PerkDetail({
  entity,
  elapsedSeconds,
}: {
  entity: PerkEntity;
  elapsedSeconds: number;
}): React.ReactElement {
  return (
    <div className="inspector-entity">
      <div className="inspector-name">{entity.name}</div>
      <div className="inspector-kind">
        Metaphysics Perk{entity.researched ? " · Purchased" : ""}
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
      {entity.flavor && (
        <p className="inspector-flavor" data-testid="inspector-flavor">{entity.flavor}</p>
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

function CraftDetail({
  entity,
}: {
  entity: CraftEntity;
}): React.ReactElement {
  return (
    <div className="inspector-entity">
      <div className="inspector-name">{entity.name}</div>
      <div className="inspector-kind">Craft</div>
      {entity.engineers > 0 && (
        <div className="inspector-section">
          <div className="inspector-section-label">Engineers</div>
          <dl className="inspector-stats">
            <dt>Assigned</dt>
            <dd>{entity.engineers}</dd>
          </dl>
        </div>
      )}
      {entity.flavor && (
        <p className="inspector-flavor" data-testid="inspector-flavor">{entity.flavor}</p>
      )}
    </div>
  );
}

function CraftShortcutDetail({
  entity,
  elapsedSeconds,
}: {
  entity: CraftShortcutEntity;
  elapsedSeconds: number;
}): React.ReactElement {
  return (
    <div className="inspector-entity">
      <div className="inspector-name">{entity.name}</div>
      <div className="inspector-kind">Craft ×{entity.amount} → {entity.output}</div>
      <PricesSection
        prices={entity.prices}
        label="Cost"
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
    entity.kind === "religionUpgrade" ||
    entity.kind === "policy" ||
    entity.kind === "perk"
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

function JobDetail({ entity }: { entity: JobEntity }): React.ReactElement {
  const { name, description, flavor, modifiers } = entity;
  return (
    <div className="inspector-entity">
      <div className="inspector-name" data-testid="inspector-job-name">{prettifyName(name)}</div>
      <div className="inspector-kind">Job</div>
      {description && <div className="inspector-description">{description}</div>}
      {modifiers.length > 0 && (
        <div className="inspector-section">
          <div className="inspector-section-label">Per kitten</div>
          <dl className="inspector-stats">
            {modifiers.map((m) => (
              <div key={m.resource} className="inspector-stat-row">
                <dt>{prettifyName(m.resource)}</dt>
                <dd>{m.perTick > 0 ? "+" : ""}{m.perTick}/tick</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
      {flavor && <div className="inspector-flavor">{flavor}</div>}
    </div>
  );
}

function prettifyName(camelCase: string): string {
  return camelCase.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (c) => c.toUpperCase());
}
