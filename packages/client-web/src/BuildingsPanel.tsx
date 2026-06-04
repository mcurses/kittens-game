// BuildingsPanel — displays unlocked buildings as cards with buy controls
import type { GameStateResponse } from "@kittens/api-spec";
import { BUILDING_DEFS, deriveUiVisibility, getBuildingDisplayName, getBuildingPrice } from "@kittens/engine";
import React, { useState } from "react";
import { useInspector } from "./InspectorContext.js";
import { PlaceholderImage } from "./PlaceholderImage.js";
import { useSlot } from "./SlotContext.js";
import { useGameAction } from "./useGameAction.js";
import { ResourceIcon } from "./ui/index.js";
import { BUILDING_FLAVOR, prettifyName } from "./flavorText.js";
import { iconPathFor } from "./buildingIconTier.js";
import { canAfford, extractEffectCache, extractResources, isStorageLimited } from "./utils.js";

interface BuildingEntry {
  name: string;
  val: number;
  on: number;
  unlocked: boolean;
  automationEnabled?: boolean;
  jammed?: boolean;
  stage?: number;
  stageUnlocked?: boolean[];
}

interface Props {
  state: GameStateResponse | null | undefined;
}

const BUILDING_CATEGORIES = [
  {
    label: "Food Production",
    slug: "food-production",
    buildings: ["field", "pasture", "aqueduct"],
  },
  {
    label: "Population",
    slug: "population",
    buildings: ["hut", "logHouse", "mansion"],
  },
  {
    label: "Science",
    slug: "science",
    buildings: ["library", "academy", "observatory", "biolab"],
  },
  {
    label: "Storage",
    slug: "storage",
    buildings: ["barn", "warehouse", "harbor"],
  },
  {
    label: "Resources",
    slug: "resources",
    buildings: ["mine", "quarry", "lumberMill", "oilWell", "accelerator"],
  },
  {
    label: "Industry",
    slug: "industry",
    buildings: ["steamworks", "magneto", "smelter", "calciner", "factory", "reactor", "aiCore"],
  },
  {
    label: "Culture",
    slug: "culture",
    buildings: ["amphitheatre", "chapel", "temple"],
  },
  {
    label: "Other",
    slug: "other",
    buildings: ["workshop", "tradepost", "mint", "brewery", "unicornPasture"],
  },
  {
    label: "Mega Structures",
    slug: "mega-structures",
    buildings: ["ziggurat", "chronosphere"],
  },
  {
    label: "Zebras",
    slug: "zebras",
    buildings: ["zebraOutpost", "zebraWorkshop", "zebraForge"],
  },
] as const;

const BUILDING_CATEGORY_INDEX = new Map(
  BUILDING_CATEGORIES.flatMap((category, categoryIndex) =>
    category.buildings.map((name, buildingIndex) => [name, { categoryIndex, buildingIndex }] as const),
  ),
);

/** Extract buildings array from serialized game state (duck-typed). Returns only unlocked buildings. */
function extractBuildings(state: GameStateResponse): BuildingEntry[] {
  const raw = state as unknown as Record<string, unknown>;
  const buildings = raw.buildings;
  if (typeof buildings !== "object" || buildings === null) return [];
  return Object.entries(buildings as Record<string, unknown>)
    .map(([name, entry]) => {
      if (typeof entry !== "object" || entry === null) return null;
      const e = entry as Record<string, unknown>;
      return {
        name,
        val: typeof e.val === "number" ? e.val : 0,
        on: typeof e.on === "number" ? e.on : 0,
        unlocked: typeof e.unlocked === "boolean" ? e.unlocked : false,
        automationEnabled: typeof e.automationEnabled === "boolean" ? e.automationEnabled : undefined,
        jammed: typeof e.jammed === "boolean" ? e.jammed : undefined,
        stage: typeof e.stage === "number" ? e.stage : undefined,
        stageUnlocked: Array.isArray(e.stageUnlocked) ? e.stageUnlocked as boolean[] : undefined,
      };
    })
    .filter((e): e is BuildingEntry => e !== null && e.unlocked)
    .sort((a, b) => {
      const left = BUILDING_CATEGORY_INDEX.get(a.name);
      const right = BUILDING_CATEGORY_INDEX.get(b.name);
      if (left && right) {
        if (left.categoryIndex !== right.categoryIndex) {
          return left.categoryIndex - right.categoryIndex;
        }
        return left.buildingIndex - right.buildingIndex;
      }
      if (left) return -1;
      if (right) return 1;
      return a.name.localeCompare(b.name);
    });
}

function groupBuildings(buildings: readonly BuildingEntry[]): Array<{
  label: string;
  slug: string;
  buildings: BuildingEntry[];
}> {
  const grouped = BUILDING_CATEGORIES.map((category) => ({
    label: category.label,
    slug: category.slug,
    buildings: [] as BuildingEntry[],
  }));

  const fallback = {
    label: "Other",
    slug: "other",
    buildings: [] as BuildingEntry[],
  };

  for (const building of buildings) {
    const location = BUILDING_CATEGORY_INDEX.get(building.name);
    if (location) {
      grouped[location.categoryIndex]?.buildings.push(building);
    } else {
      fallback.buildings.push(building);
    }
  }

  if (fallback.buildings.length > 0 && grouped.every((category) => category.slug !== fallback.slug)) {
    grouped.push(fallback);
  }

  return grouped.filter((category) => category.buildings.length > 0);
}

type BuildingFilter = "all" | "available" | "enabled" | "togglable";

const FILTER_TABS: { key: BuildingFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "available", label: "Available" },
  { key: "enabled", label: "Enabled" },
  { key: "togglable", label: "Togglable" },
];

export function BuildingsPanel({ state }: Props): React.ReactElement {
  const slot = useSlot();
  const { mutate, isPending } = useGameAction(slot);
  const inspector = useInspector();
  const { setInspected, clearInspected, setPinned, pinned } = inspector;
  const [activeFilter, setActiveFilter] = useState<BuildingFilter>("all");

  if (!state) {
    return <div className="loading-text" data-testid="buildings-panel-loading">Loading…</div>;
  }

  const buildings = extractBuildings(state);
  const resources = extractResources(state);
  const effectCache = extractEffectCache(state);
  const visibility = deriveUiVisibility(state);

  // Apply filter
  const filteredBuildings = buildings.filter((b) => {
    switch (activeFilter) {
      case "all":
        return true;
      case "available": {
        const def = BUILDING_DEFS.find((d) => d.name === b.name);
        const prices = def ? getBuildingPrice(def, b.val, effectCache) : [];
        return canAfford(prices, resources);
      }
      case "enabled":
        return b.on > 0;
      case "togglable": {
        const mode = visibility.buildings[b.name]?.controlMode;
        return mode === "count" || mode === "binary";
      }
    }
  });

  const categories = groupBuildings(filteredBuildings);

  return (
    <div data-testid="buildings-panel">
      <div className="panel-label">Structures</div>
      <div className="panel-controls">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            data-testid={`building-filter-${tab.key}`}
            data-active={activeFilter === tab.key ? "true" : "false"}
            className="btn btn--xs btn--filter"
            onClick={() => setActiveFilter(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {filteredBuildings.length === 0 ? (
        <p className="panel-empty">No buildings available.</p>
      ) : (
        <div className="building-groups">
          {categories.map((category) => (
            <section
              key={category.slug}
              data-testid={`building-category-${category.slug}`}
              className={`panel-section${category.buildings.length <= 2 ? " panel-section--compact" : ""}`}
            >
              <h3 className="panel-subheading">{category.label}</h3>
              <ul className="card-grid" style={{ listStyle: "none" }}>
                {category.buildings.map((b) => {
                  const def = BUILDING_DEFS.find((d) => d.name === b.name);
                  const prices = def ? getBuildingPrice(def, b.val, effectCache) : [];
                  const affordable = canAfford(prices, resources);
                  const storageLimited = isStorageLimited(prices, resources);
                  const displayName = getBuildingDisplayName(b.name, b.stage ?? 0) ?? prettifyName(b.name);
                  const currentStage = b.stage ?? 0;
                  const hasStages = b.stageUnlocked != null && b.stageUnlocked.length > 1;
                  const canUpgrade = hasStages && currentStage < b.stageUnlocked!.length - 1 && b.stageUnlocked![currentStage + 1] === true;
                  const canDowngrade = hasStages && currentStage > 0;

                  const isPinnedHere = pinned?.kind === "building" && pinned.name === b.name;
                  return (
                    <li
                      key={b.name}
                      data-testid={`building-${b.name}`}
                      className="item-card"
                      data-pinned={isPinnedHere ? "true" : "false"}
                      onClick={(e) => {
                        const t = e.target as HTMLElement;
                        if (t.closest("button, input, select, a, [data-no-pin]")) return;
                        setPinned({
                          kind: "building",
                          name: b.name,
                          description: def?.description,
                          flavor: BUILDING_FLAVOR[b.name],
                          automationEnabled: b.automationEnabled,
                          val: b.val,
                          on: b.on,
                          effects: def?.effects ?? {},
                          prices,
                          resources,
                          iconPath: iconPathFor(b.name, b.val),
                        });
                      }}
                      onMouseEnter={() =>
                        setInspected({
                          kind: "building",
                          name: b.name,
                          description: def?.description,
                          flavor: BUILDING_FLAVOR[b.name],
                          automationEnabled: b.automationEnabled,
                          val: b.val,
                          on: b.on,
                          effects: def?.effects ?? {},
                          prices,
                          resources,
                          iconPath: iconPathFor(b.name, b.val),
                        })
                      }
                      onMouseLeave={clearInspected}
                      onFocus={() =>
                        setInspected({
                          kind: "building",
                          name: b.name,
                          description: def?.description,
                          flavor: BUILDING_FLAVOR[b.name],
                          automationEnabled: b.automationEnabled,
                          val: b.val,
                          on: b.on,
                          effects: def?.effects ?? {},
                          prices,
                          resources,
                          iconPath: iconPathFor(b.name, b.val),
                        })
                      }
                      onBlur={clearInspected}
                      tabIndex={0}
                    >
                      <PlaceholderImage
                        variant="building"
                        src={iconPathFor(b.name, b.val)}
                        alt={displayName}
                        className="item-card__image"
                      />
                      <div className="item-card__overlay-top">
                        <span className="item-name building-name">{displayName}</span>
                        <span className={`item-count building-count${b.val > 0 ? " item-count--has" : ""}`}>
                          {b.on < b.val ? `${b.on}/${b.val}` : b.val}
                        </span>
                      </div>

                      {(canUpgrade || canDowngrade) && (
                        <div className="item-card__stage-controls">
                          {canDowngrade && (
                            <button
                              type="button"
                              data-testid={`building-${b.name}-downgrade`}
                              className="btn btn--xs btn--secondary"
                              disabled={isPending}
                              onClick={() => mutate({ type: "DOWNGRADE_BUILDING_STAGE", name: b.name })}
                            >
                              v
                            </button>
                          )}
                          {canUpgrade && (
                            <button
                              type="button"
                              data-testid={`building-${b.name}-upgrade`}
                              className="btn btn--xs btn--secondary"
                              disabled={isPending}
                              onClick={() => mutate({ type: "UPGRADE_BUILDING_STAGE", name: b.name })}
                            >
                              ^
                            </button>
                          )}
                        </div>
                      )}

                      <div className="item-card__footer">
                        <div className="item-card__footer-primary">
                          {prices.length > 0 && (
                            <div className="item-prices building-prices">
                              {prices.map((p, i) => (
                                <span key={p.name}>
                                  {i > 0 ? " · " : ""}
                                  <ResourceIcon name={p.name} size="xs" /> {p.name} {p.val.toFixed(0)}
                                </span>
                              ))}
                            </div>
                          )}
                          <button
                            type="button"
                            data-testid={`building-${b.name}-buy`}
                            className={`btn btn--sm${affordable ? " btn--primary" : " btn--secondary"}${storageLimited ? " btn--limited" : ""}`}
                            disabled={isPending || !affordable}
                            onClick={() => mutate({ type: "BUY_BUILDING", name: b.name })}
                          >
                            Buy
                          </button>
                        </div>

                        {b.val > 0 && (
                          (visibility.buildings[b.name]?.automationVisible ||
                            visibility.buildings[b.name]?.controlMode === "count" ||
                            visibility.buildings[b.name]?.controlMode === "binary") && (
                            <div className="item-actions">
                              {visibility.buildings[b.name]?.automationVisible && (
                                <>
                                  <button
                                    type="button"
                                    className="btn btn--xs btn--secondary"
                                    disabled={isPending || b.automationEnabled === true}
                                    onClick={() => mutate({ type: "ENABLE_BUILDING_AUTOMATION", name: b.name })}
                                  >
                                    Auto On
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn--xs btn--secondary"
                                    disabled={isPending || b.automationEnabled === false}
                                    onClick={() => mutate({ type: "DISABLE_BUILDING_AUTOMATION", name: b.name })}
                                  >
                                    Auto Off
                                  </button>
                                </>
                              )}
                              {visibility.buildings[b.name]?.controlMode === "count" &&
                                renderCountControls(b, isPending, mutate)}
                              {visibility.buildings[b.name]?.controlMode === "binary" &&
                                renderBinaryControls(b, isPending, mutate)}
                            </div>
                          )
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function renderCountControls(
  building: BuildingEntry,
  isPending: boolean,
  mutate: ReturnType<typeof useGameAction>["mutate"],
): React.ReactNode {
  const offCount = building.on <= 0;
  const fullCount = building.on >= building.val;
  return (
    <div className="stage-counter">
      <div className="stage-counter__group stage-counter__group--down">
        <button
          type="button"
          data-testid={`building-${building.name}-disable-all`}
          className="btn btn--xs btn--secondary"
          disabled={isPending || offCount}
          onClick={() => mutate({ type: "DISABLE_BUILDING", name: building.name, amount: building.on })}
          aria-label={`Disable all ${building.name}`}
        >
          −All
        </button>
        <button
          type="button"
          data-testid={`building-${building.name}-disable-25`}
          className="btn btn--xs btn--secondary"
          disabled={isPending || offCount}
          onClick={() => mutate({ type: "DISABLE_BUILDING", name: building.name, amount: 25 })}
        >
          −25
        </button>
        <button
          type="button"
          data-testid={`building-${building.name}-disable-1`}
          className="btn btn--xs btn--secondary"
          disabled={isPending || offCount}
          onClick={() => mutate({ type: "DISABLE_BUILDING", name: building.name, amount: 1 })}
        >
          −
        </button>
      </div>
      <span className="stage-counter__readout">{building.on}/{building.val}</span>
      <div className="stage-counter__group stage-counter__group--up">
        <button
          type="button"
          data-testid={`building-${building.name}-enable-1`}
          className="btn btn--xs btn--secondary"
          disabled={isPending || fullCount}
          onClick={() => mutate({ type: "ENABLE_BUILDING", name: building.name, amount: 1 })}
        >
          +
        </button>
        <button
          type="button"
          data-testid={`building-${building.name}-enable-25`}
          className="btn btn--xs btn--secondary"
          disabled={isPending || fullCount}
          onClick={() => mutate({ type: "ENABLE_BUILDING", name: building.name, amount: 25 })}
        >
          +25
        </button>
        <button
          type="button"
          data-testid={`building-${building.name}-enable-all`}
          className="btn btn--xs btn--secondary"
          disabled={isPending || fullCount}
          onClick={() =>
            mutate({ type: "ENABLE_BUILDING", name: building.name, amount: building.val - building.on })
          }
          aria-label={`Enable all ${building.name}`}
        >
          +All
        </button>
      </div>
    </div>
  );
}

function renderBinaryControls(
  building: BuildingEntry,
  isPending: boolean,
  mutate: ReturnType<typeof useGameAction>["mutate"],
): React.ReactNode {
  return (
    <>
      <button
        type="button"
        data-testid={`building-${building.name}-enable-binary`}
        className="btn btn--sm btn--secondary"
        disabled={isPending || building.on >= building.val}
        onClick={() => mutate({ type: "ENABLE_BUILDING", name: building.name, amount: building.val })}
      >
        On
      </button>
      <button
        type="button"
        data-testid={`building-${building.name}-disable-binary`}
        className="btn btn--sm btn--secondary"
        disabled={isPending || building.on <= 0}
        onClick={() => mutate({ type: "DISABLE_BUILDING", name: building.name, amount: building.on })}
      >
        Off
      </button>
    </>
  );
}
