// TabContainer — tab navigation for main game panels
import type { GameStateResponse } from "@kittens/api-spec";
import React, { useState } from "react";
import { BuildingsPanel } from "./BuildingsPanel.js";
import { JobsPanel } from "./JobsPanel.js";
import { ResourcePanel } from "./ResourcePanel.js";
import { SciencePanel } from "./SciencePanel.js";
import { WorkshopPanel } from "./WorkshopPanel.js";

type TabId = "resources" | "buildings" | "jobs" | "science" | "workshop";

const TABS: { id: TabId; label: string }[] = [
  { id: "resources", label: "Resources" },
  { id: "buildings", label: "Buildings" },
  { id: "jobs", label: "Jobs" },
  { id: "science", label: "Science" },
  { id: "workshop", label: "Workshop" },
];

interface Props {
  state: GameStateResponse | null | undefined;
}

export function TabContainer({ state }: Props): React.ReactElement {
  const [activeTab, setActiveTab] = useState<TabId>("resources");

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
      {activeTab === "resources" && <ResourcePanel state={state} />}
      {activeTab === "buildings" && <BuildingsPanel state={state} />}
      {activeTab === "jobs" && <JobsPanel state={state} />}
      {activeTab === "science" && <SciencePanel state={state} />}
      {activeTab === "workshop" && <WorkshopPanel state={state} />}
    </div>
  );
}
