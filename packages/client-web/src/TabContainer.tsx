// TabContainer — tab navigation for main game panels
import type { GameStateResponse } from "@kittens/api-spec";
import { deriveUiVisibility, type UiMainTabId } from "@kittens/engine";
import React from "react";
import { AchievementsPanel } from "./AchievementsPanel.js";
import { BuildingsPanel } from "./BuildingsPanel.js";
import { ChallengesPanel } from "./ChallengesPanel.js";
import { DiplomacyPanel } from "./DiplomacyPanel.js";
import { JobsPanel } from "./JobsPanel.js";
import { ReligionPanel } from "./ReligionPanel.js";
import { SciencePanel } from "./SciencePanel.js";
import { SpacePanel } from "./SpacePanel.js";
import { StatsPanel } from "./StatsPanel.js";
import { TimePanel } from "./TimePanel.js";
import { usePersistentUiState } from "./usePersistentUiState.js";
import { WorkshopPanel } from "./WorkshopPanel.js";

type TabId = UiMainTabId;

const ACTIVE_MAIN_TAB_KEY = "kittens.ui.activeMainTab";

interface Props {
  state: GameStateResponse | null | undefined;
}

export function TabContainer({ state }: Props): React.ReactElement {
  const visibility = deriveUiVisibility(state);
  const visibleTabs = Object.values(visibility.tabs).filter((tab) => tab.visible);
  const [activeTab, setActiveTab] = usePersistentUiState<TabId>(
    ACTIVE_MAIN_TAB_KEY,
    "buildings",
    isTabId,
  );
  const fallbackTab = visibleTabs[0]?.id ?? "buildings";
  const effectiveTab = visibleTabs.some((t) => t.id === activeTab) ? activeTab : fallbackTab;

  return (
    <div data-testid="tab-container" style={{ display: "contents" }}>
      <nav className="tab-nav" aria-label="Game sections">
        {visibleTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            data-active={effectiveTab === tab.id ? "true" : "false"}
            className="btn btn--sm btn--tab"
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
        {effectiveTab === "stats"        && <StatsPanel />}
        {effectiveTab === "challenges"   && <ChallengesPanel />}
      </div>
    </div>
  );
}

function isTabId(value: unknown): value is TabId {
  return typeof value === "string" && value in deriveUiVisibility(null).tabs;
}
