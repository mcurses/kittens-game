// TabContainer — tab navigation for main game panels
import type { GameStateResponse } from "@kittens/api-spec";
import React from "react";
import { AchievementsPanel } from "./AchievementsPanel.js";
import { BuildingsPanel } from "./BuildingsPanel.js";
import { DiplomacyPanel } from "./DiplomacyPanel.js";
import { JobsPanel } from "./JobsPanel.js";
import { ReligionPanel } from "./ReligionPanel.js";
import { SciencePanel } from "./SciencePanel.js";
import { SpacePanel } from "./SpacePanel.js";
import { TimePanel } from "./TimePanel.js";
import { usePersistentUiState } from "./usePersistentUiState.js";
import { WorkshopPanel } from "./WorkshopPanel.js";

type TabId =
  | "buildings"
  | "jobs"
  | "science"
  | "workshop"
  | "religion"
  | "space"
  | "time"
  | "trade"
  | "achievements";

const ALL_TABS: { id: TabId; label: string }[] = [
  { id: "buildings", label: "Buildings" },
  { id: "jobs", label: "Jobs" },
  { id: "science", label: "Science" },
  { id: "workshop", label: "Workshop" },
  { id: "religion", label: "Religion" },
  { id: "space", label: "Space" },
  { id: "time", label: "Time" },
  { id: "trade", label: "Trade" },
  { id: "achievements", label: "Achievements" },
];

/**
 * Derive which tabs are currently unlocked from game state.
 * Mirrors legacy game.js updateTabVisibility() conditions.
 */
function getVisibleTabs(state: GameStateResponse | null | undefined): readonly TabId[] {
  // Buildings, Jobs, and Workshop always visible.
  // Workshop condition is `workshop building built`, but that building isn't implemented yet (Epic 27).
  // Show always as fallback so upgrade system remains accessible.
  const visible: TabId[] = ["buildings", "jobs", "workshop"];
  if (!state) return visible;

  const raw = state as Record<string, unknown>;
  const buildings = raw.buildings as Record<string, { val?: number; on?: number }> | null | undefined;
  const resources = raw.resources as Record<string, { value?: number }> | null | undefined;
  const science = raw.science as Record<string, unknown> | null | undefined;
  const techs = science?.techs as Record<string, { researched?: boolean }> | null | undefined;
  const time = raw.time as Record<string, unknown> | null | undefined;
  const vsu = time?.vsu as Record<string, { val?: number }> | null | undefined;
  const diplomacy = raw.diplomacy as Record<string, unknown> | null | undefined;
  const races = diplomacy?.races as Record<string, { unlocked?: boolean }> | null | undefined;
  const achievementsRaw = raw.achievements as { achievements?: { unlocked?: boolean }[] } | null | undefined;

  // Science: library built OR calendar/chronophysics researched
  if (
    (buildings?.library?.on ?? 0) > 0 ||
    techs?.calendar?.researched === true ||
    techs?.chronophysics?.researched === true
  ) {
    visible.push("science");
  }

  // Religion: any faith accrued
  if ((resources?.faith?.value ?? 0) > 0) visible.push("religion");

  // Space: rocketry researched
  if (techs?.rocketry?.researched === true) visible.push("space");

  // Time: calendar researched OR cryochambers used
  if (techs?.calendar?.researched === true || (vsu?.usedCryochambers?.val ?? 0) > 0) {
    visible.push("time");
  }

  // Trade: any race unlocked
  if (races && Object.values(races).some((r) => r.unlocked === true)) visible.push("trade");

  // Achievements: any unlocked
  if (achievementsRaw?.achievements?.some((a) => a.unlocked === true) === true) {
    visible.push("achievements");
  }

  return visible;
}

const ACTIVE_MAIN_TAB_KEY = "kittens.ui.activeMainTab";

interface Props {
  state: GameStateResponse | null | undefined;
}

export function TabContainer({ state }: Props): React.ReactElement {
  const visibleTabs = ALL_TABS.filter((t) => getVisibleTabs(state).includes(t.id));
  const [activeTab, setActiveTab] = usePersistentUiState<TabId>(
    ACTIVE_MAIN_TAB_KEY,
    "buildings",
    isTabId,
  );
  // If the active tab is no longer visible, fall back to buildings
  const effectiveTab = visibleTabs.some((t) => t.id === activeTab) ? activeTab : "buildings";

  return (
    <div data-testid="tab-container" style={{ display: "contents" }}>
      <nav className="tab-nav" aria-label="Game sections">
        {visibleTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            data-active={effectiveTab === tab.id ? "true" : "false"}
            className="tab-btn"
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="tab-content" role="tabpanel">
        {effectiveTab === "buildings"    && <BuildingsPanel state={state} />}
        {effectiveTab === "jobs"         && <JobsPanel state={state} />}
        {effectiveTab === "science"      && <SciencePanel state={state} />}
        {effectiveTab === "workshop"     && <WorkshopPanel state={state} />}
        {effectiveTab === "religion"     && <ReligionPanel state={state} />}
        {effectiveTab === "space"        && <SpacePanel state={state} />}
        {effectiveTab === "time"         && <TimePanel state={state} />}
        {effectiveTab === "trade"        && <DiplomacyPanel state={state} />}
        {effectiveTab === "achievements" && <AchievementsPanel state={state} />}
      </div>
    </div>
  );
}

function isTabId(value: unknown): value is TabId {
  return ALL_TABS.some((tab) => tab.id === value);
}
