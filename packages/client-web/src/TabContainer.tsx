// TabContainer — tab navigation for main game panels
import type { GameStateResponse } from "@kittens/api-spec";
import React, { useState } from "react";
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
  | "diplomacy"
  | "achievements";

const TABS: { id: TabId; label: string }[] = [
  { id: "buildings", label: "Buildings" },
  { id: "jobs", label: "Jobs" },
  { id: "science", label: "Science" },
  { id: "workshop", label: "Workshop" },
  { id: "religion", label: "Religion" },
  { id: "space", label: "Space" },
  { id: "time", label: "Time" },
  { id: "diplomacy", label: "Diplomacy" },
  { id: "achievements", label: "Achievements" },
];
const ACTIVE_MAIN_TAB_KEY = "kittens.ui.activeMainTab";

interface Props {
  state: GameStateResponse | null | undefined;
}

export function TabContainer({ state }: Props): React.ReactElement {
  const [activeTab, setActiveTab] = usePersistentUiState<TabId>(
    ACTIVE_MAIN_TAB_KEY,
    "buildings",
    isTabId,
  );

  return (
    <div data-testid="tab-container">
      <nav>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            data-active={activeTab === tab.id ? "true" : "false"}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>
      {activeTab === "buildings" && <BuildingsPanel state={state} />}
      {activeTab === "jobs" && <JobsPanel state={state} />}
      {activeTab === "science" && <SciencePanel state={state} />}
      {activeTab === "workshop" && <WorkshopPanel state={state} />}
      {activeTab === "religion" && <ReligionPanel state={state} />}
      {activeTab === "space" && <SpacePanel state={state} />}
      {activeTab === "time" && <TimePanel state={state} />}
      {activeTab === "diplomacy" && <DiplomacyPanel state={state} />}
      {activeTab === "achievements" && <AchievementsPanel state={state} />}
    </div>
  );
}

function isTabId(value: unknown): value is TabId {
  return TABS.some((tab) => tab.id === value);
}
