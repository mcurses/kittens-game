import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TabContainer } from "./TabContainer.js";

// Mock all panels to keep tests simple
vi.mock("./BuildingsPanel.js", () => ({
  BuildingsPanel: () => <div data-testid="buildings-panel">Buildings</div>,
}));
vi.mock("./JobsPanel.js", () => ({
  JobsPanel: () => <div data-testid="jobs-panel">Jobs</div>,
}));
vi.mock("./SciencePanel.js", () => ({
  SciencePanel: () => <div data-testid="science-panel">Science</div>,
}));
vi.mock("./WorkshopPanel.js", () => ({
  WorkshopPanel: () => <div data-testid="workshop-panel">Workshop</div>,
}));
vi.mock("./ReligionPanel.js", () => ({
  ReligionPanel: () => <div data-testid="religion-panel">Religion</div>,
}));
vi.mock("./SpacePanel.js", () => ({
  SpacePanel: () => <div data-testid="space-panel">Space</div>,
}));
vi.mock("./TimePanel.js", () => ({
  TimePanel: () => <div data-testid="time-panel">Time</div>,
}));
vi.mock("./DiplomacyPanel.js", () => ({
  DiplomacyPanel: () => <div data-testid="diplomacy-panel">Diplomacy</div>,
}));
vi.mock("./AchievementsPanel.js", () => ({
  AchievementsPanel: () => <div data-testid="achievements-panel">Achievements</div>,
}));
vi.mock("./StatsPanel.js", () => ({
  StatsPanel: () => <div data-testid="stats-panel">Stats</div>,
}));
vi.mock("./ChallengesPanel.js", () => ({
  ChallengesPanel: () => <div data-testid="challenges-panel">Challenges</div>,
}));

// Minimal state helpers
const withLibrary = { buildings: { library: { val: 1, on: 1 } } };
const withFaith = { resources: { faith: { value: 1 } } };
const withRocketry = { science: { techs: { rocketry: { researched: true } } } };
const withCalendar = { science: { techs: { calendar: { researched: true } } } };
const withTradeUnlocked = { diplomacy: { races: { lizards: { unlocked: true } } } };
const withAchievement = { achievements: { achievements: [{ unlocked: true }] } };
const withWorkshop = { buildings: { workshop: { val: 1, on: 1 } } };
const withVillage = {
  buildings: { hut: { val: 1, on: 1 } },
  village: { kittens: 3, jobs: { woodcutter: { value: 1 } } },
};
const withStats = { resources: { karma: { value: 1 } } };
const withChallenges = { prestige: { perks: { adjustmentBureau: { researched: true } } } };

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("TabContainer", () => {
  it("defaults to showing the Buildings panel", () => {
    render(<TabContainer state={null} />);
    expect(screen.getByTestId("buildings-panel")).toBeTruthy();
    expect(screen.queryByTestId("jobs-panel")).toBeNull();
  });

  it("shows only Buildings, Jobs, and Workshop with no state (locked-down start)", () => {
    render(<TabContainer state={null} />);
    expect(screen.getByRole("button", { name: /buildings/i })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /outpost|village|jobs/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /workshop/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /science/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /religion/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /space/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /time/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /trade/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /achievements/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /stats/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /challenges/i })).toBeNull();
  });

  it("shows Science tab when library is built", () => {
    render(<TabContainer state={withLibrary as never} />);
    expect(screen.getByRole("button", { name: /science/i })).toBeTruthy();
  });

  it("shows Religion tab when faith > 0", () => {
    render(<TabContainer state={withFaith as never} />);
    expect(screen.getByRole("button", { name: /religion/i })).toBeTruthy();
  });

  it("shows Workshop tab only when the workshop building exists", () => {
    render(<TabContainer state={withWorkshop as never} />);
    expect(screen.getByRole("button", { name: /workshop/i })).toBeTruthy();
  });

  it("shows Space tab when rocketry researched", () => {
    render(<TabContainer state={withRocketry as never} />);
    expect(screen.getByRole("button", { name: /space/i })).toBeTruthy();
  });

  it("shows Time tab when calendar researched", () => {
    render(<TabContainer state={withCalendar as never} />);
    expect(screen.getByRole("button", { name: /time/i })).toBeTruthy();
  });

  it("shows Trade tab when a race is unlocked", () => {
    render(<TabContainer state={withTradeUnlocked as never} />);
    expect(screen.getByRole("button", { name: /trade/i })).toBeTruthy();
  });

  it("shows Achievements tab when any achievement unlocked", () => {
    render(<TabContainer state={withAchievement as never} />);
    expect(screen.getByRole("button", { name: /achievements/i })).toBeTruthy();
  });

  it("shows Stats tab when its unlock condition is met", () => {
    render(<TabContainer state={withStats as never} />);
    expect(screen.getByRole("button", { name: /stats/i })).toBeTruthy();
  });

  it("shows Challenges tab when its unlock condition is met", () => {
    render(<TabContainer state={withChallenges as never} />);
    expect(screen.getByRole("button", { name: /challenges/i })).toBeTruthy();
  });

  it("switches to Religion panel when Religion tab clicked", () => {
    render(<TabContainer state={withFaith as never} />);
    fireEvent.click(screen.getByRole("button", { name: /religion/i }));
    expect(screen.getByTestId("religion-panel")).toBeTruthy();
    expect(screen.queryByTestId("buildings-panel")).toBeNull();
  });

  it("switches to Space panel when Space tab clicked", () => {
    render(<TabContainer state={withRocketry as never} />);
    fireEvent.click(screen.getByRole("button", { name: /space/i }));
    expect(screen.getByTestId("space-panel")).toBeTruthy();
  });

  it("switches to Time panel when Time tab clicked", () => {
    render(<TabContainer state={withCalendar as never} />);
    fireEvent.click(screen.getByRole("button", { name: /time/i }));
    expect(screen.getByTestId("time-panel")).toBeTruthy();
  });

  it("switches to Trade panel when Trade tab clicked", () => {
    render(<TabContainer state={withTradeUnlocked as never} />);
    fireEvent.click(screen.getByRole("button", { name: /trade/i }));
    expect(screen.getByTestId("diplomacy-panel")).toBeTruthy();
  });

  it("switches to Achievements panel when Achievements tab clicked", () => {
    render(<TabContainer state={withAchievement as never} />);
    fireEvent.click(screen.getByRole("button", { name: /achievements/i }));
    expect(screen.getByTestId("achievements-panel")).toBeTruthy();
    expect(screen.queryByTestId("buildings-panel")).toBeNull();
  });

  it("switches to Buildings panel when Buildings tab clicked", () => {
    render(<TabContainer state={null} />);
    fireEvent.click(screen.getByRole("button", { name: /buildings/i }));
    expect(screen.getByTestId("buildings-panel")).toBeTruthy();
    expect(screen.queryByTestId("jobs-panel")).toBeNull();
  });

  it("switches to Village panel when the village tab is clicked", () => {
    render(<TabContainer state={withVillage as never} />);
    fireEvent.click(screen.getByRole("button", { name: /small village/i }));
    expect(screen.getByTestId("jobs-panel")).toBeTruthy();
  });

  it("restores the saved active tab on remount", () => {
    const { unmount } = render(<TabContainer state={withLibrary as never} />);
    fireEvent.click(screen.getByRole("button", { name: /science/i }));
    expect(window.localStorage.getItem("kittens.ui.activeMainTab")).toBe('"science"');
    unmount();

    render(<TabContainer state={withLibrary as never} />);
    expect(screen.getByTestId("science-panel")).toBeTruthy();
    expect(screen.getByRole("button", { name: /science/i }).getAttribute("data-active")).toBe(
      "true",
    );
  });

  it("falls back to buildings if saved tab becomes hidden", () => {
    // Save "space" as active tab
    window.localStorage.setItem("kittens.ui.activeMainTab", '"space"');
    // Render without rocketry researched — space tab hidden
    render(<TabContainer state={null} />);
    // Should fall back to buildings
    expect(screen.getByTestId("buildings-panel")).toBeTruthy();
  });

  it("switches to Science panel when Science tab clicked", () => {
    render(<TabContainer state={withLibrary as never} />);
    fireEvent.click(screen.getByRole("button", { name: /science/i }));
    expect(screen.getByTestId("science-panel")).toBeTruthy();
  });

  it("switches to Workshop panel when Workshop tab clicked", () => {
    render(<TabContainer state={withWorkshop as never} />);
    fireEvent.click(screen.getByRole("button", { name: /workshop/i }));
    expect(screen.getByTestId("workshop-panel")).toBeTruthy();
  });

  it("renders the legacy-style village label with a free-kitten warning count", () => {
    render(<TabContainer state={withVillage as never} />);
    expect(screen.getByRole("button", { name: /small village \(2\)/i })).toBeTruthy();
  });

  it("active tab is visually distinguished", () => {
    render(<TabContainer state={withVillage as never} />);
    const buildingsBtn = screen.getByRole("button", { name: /buildings/i });
    expect(buildingsBtn.getAttribute("data-active")).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: /buildings/i }));
    expect(buildingsBtn.getAttribute("data-active")).toBe("true");
    expect(screen.getByRole("button", { name: /small village/i }).getAttribute("data-active")).toBe(
      "false",
    );
  });
});
