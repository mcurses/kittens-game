import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { InspectorProvider } from "./InspectorContext.js";
import { InspectorPanel } from "./InspectorPanel.js";
import { JobsPanel } from "./JobsPanel.js";

const mockMutate = vi.fn();
vi.mock("./useGameAction.js", () => ({
  useGameAction: () => ({ mutate: mockMutate, isPending: false, error: null }),
}));

function makeState(
  jobs: Record<string, { value: number; unlocked?: boolean }>,
  kittens = 5,
) {
  return {
    version: 1,
    tick: 0,
    village: { kittens, jobs },
  } as unknown as import("@kittens/api-spec").GameStateResponse;
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function WithInspector({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <InspectorProvider>
      {children}
      <InspectorPanel />
    </InspectorProvider>
  );
}

describe("JobsPanel", () => {
  it("shows loading placeholder when state is null", () => {
    render(<JobsPanel state={null} />);
    expect(screen.getByTestId("jobs-panel-loading")).toBeTruthy();
  });

  it("shows loading placeholder when state is undefined", () => {
    render(<JobsPanel state={undefined} />);
    expect(screen.getByTestId("jobs-panel-loading")).toBeTruthy();
  });

  it("shows no jobs message when jobs object is empty", () => {
    render(<JobsPanel state={makeState({})} />);
    expect(screen.getByText("No jobs available.")).toBeTruthy();
  });

  it("renders job name and assigned count", () => {
    const state = makeState({ farmer: { value: 3, unlocked: true } });
    render(<JobsPanel state={state} />);
    expect(screen.getByTestId("job-farmer")).toBeTruthy();
    expect(screen.getByText(/farmer/)).toBeTruthy();
    expect(screen.getByText(/3/)).toBeTruthy();
  });

  it("dispatches ASSIGN_JOB when + is clicked", () => {
    const state = makeState({ farmer: { value: 1, unlocked: true } });
    render(<JobsPanel state={state} />);
    fireEvent.click(screen.getByTestId("job-farmer-assign"));
    expect(mockMutate).toHaveBeenCalledWith({ type: "ASSIGN_JOB", job: "farmer" });
  });

  it("dispatches UNASSIGN_JOB when - is clicked", () => {
    const state = makeState({ farmer: { value: 2, unlocked: true } });
    render(<JobsPanel state={state} />);
    fireEvent.click(screen.getByTestId("job-farmer-unassign"));
    expect(mockMutate).toHaveBeenCalledWith({ type: "UNASSIGN_JOB", job: "farmer" });
  });

  it("renders multiple jobs", () => {
    const state = makeState({ farmer: { value: 2, unlocked: true }, scholar: { value: 1, unlocked: true } });
    render(<JobsPanel state={state} />);
    expect(screen.getByTestId("job-farmer")).toBeTruthy();
    expect(screen.getByTestId("job-scholar")).toBeTruthy();
  });
});

// ── Epic 32 Story 32-07: Village happiness/festival in JobsPanel ──────────────

function makeStateWithVillage(
  jobs: Record<string, { value: number; unlocked?: boolean }>,
  village: { kittens?: number; happiness?: number } = {},
  calendar: { festivalDays?: number } = {},
  science: { techs?: Record<string, { researched?: boolean }> } = {},
  resources: Record<string, { value: number }> = {},
) {
  return {
    version: 1,
    tick: 0,
    village: { kittens: village.kittens ?? 0, happiness: village.happiness ?? 1.0, jobs },
    calendar: { festivalDays: calendar.festivalDays ?? 0, day: 0, season: 0, year: 0 },
    science: { techs: science.techs ?? {} },
    resources,
  } as unknown as import("@kittens/api-spec").GameStateResponse;
}

describe("Story 32-07: Happiness display and festival in JobsPanel", () => {
  it("shows happiness percentage in jobs panel", () => {
    const state = makeStateWithVillage({}, { happiness: 5.33 });
    render(<JobsPanel state={state} />);
    expect(screen.getByTestId("jobs-happiness")).toBeTruthy();
    expect(screen.getByTestId("jobs-happiness").textContent).toMatch(/533%/);
  });

  it("shows happiness breakdown in inspector on focus and clears on blur", () => {
    const state = makeStateWithVillage(
      {},
      { kittens: 12, happiness: 1.76 },
      { festivalDays: 10 },
      {},
      {
        furs: { value: 1 },
        karma: { value: 20 },
      },
    );
    (state as unknown as { effectCache: Record<string, number> }).effectCache = {
      maxKittens: 20,
      happiness: 5,
      luxuryHappinessBonus: 2,
      consumableLuxuryHappiness: 1,
      unhappinessRatio: -0.5,
      festivalRatio: 0.5,
    };

    render(<WithInspector><JobsPanel state={state} /></WithInspector>);

    fireEvent.focus(screen.getByTestId("jobs-happiness"));
    expect(screen.getByText("Happiness")).toBeTruthy();
    expect(screen.getByText("Luxury bonus")).toBeTruthy();
    expect(screen.getByText("Penalty mitigation")).toBeTruthy();

    fireEvent.blur(screen.getByTestId("jobs-happiness"));
    expect(screen.getByText("Hover an item to inspect it")).toBeTruthy();
  });

  it("shows festival duration when festivalDays > 0", () => {
    const state = makeStateWithVillage({}, {}, { festivalDays: 172 });
    render(<JobsPanel state={state} />);
    expect(screen.getByTestId("jobs-festival")).toBeTruthy();
    expect(screen.getByTestId("jobs-festival").textContent).toMatch(/172/);
  });

  it("does not show festival element when festivalDays === 0", () => {
    const state = makeStateWithVillage({}, {}, { festivalDays: 0 });
    render(<JobsPanel state={state} />);
    expect(screen.queryByTestId("jobs-festival")).toBeNull();
  });

  it("shows Hold Festival button", () => {
    const state = makeStateWithVillage({}, {}, {}, { techs: { drama: { researched: true } } });
    render(<JobsPanel state={state} />);
    expect(screen.getByTestId("btn-hold-festival")).toBeTruthy();
  });

  it("dispatches HOLD_FESTIVAL when Hold Festival is clicked", () => {
    const state = makeStateWithVillage({}, {}, {}, { techs: { drama: { researched: true } } });
    render(<JobsPanel state={state} />);
    fireEvent.click(screen.getByTestId("btn-hold-festival"));
    expect(mockMutate).toHaveBeenCalledWith({ type: "HOLD_FESTIVAL" });
  });

  it("hides Hold Festival when drama is not researched", () => {
    const state = makeStateWithVillage({});
    render(<JobsPanel state={state} />);
    expect(screen.queryByTestId("btn-hold-festival")).toBeNull();
  });

  it("only renders unlocked jobs", () => {
    const state = makeStateWithVillage({
      woodcutter: { value: 2, unlocked: true },
      farmer: { value: 0, unlocked: false },
    });
    render(<JobsPanel state={state} />);
    expect(screen.getByTestId("job-woodcutter")).toBeTruthy();
    expect(screen.queryByTestId("job-farmer")).toBeNull();
  });

  it("shows management and census sections only when their legacy gates are met", () => {
    const hiddenState = makeStateWithVillage(
      { woodcutter: { value: 1, unlocked: true } },
      { kittens: 4 },
      {},
      { techs: {} },
      { zebras: { value: 0 } },
    );
    const visibleState = makeStateWithVillage(
      { woodcutter: { value: 1, unlocked: true } },
      { kittens: 6 },
      {},
      { techs: { civil: { researched: true } } },
      { zebras: { value: 0 } },
    );

    const { rerender } = render(<JobsPanel state={hiddenState} />);
    expect(screen.queryByTestId("village-management")).toBeNull();
    expect(screen.queryByTestId("village-census")).toBeNull();

    rerender(<JobsPanel state={visibleState} />);
    expect(screen.getByTestId("village-management")).toBeTruthy();
    expect(screen.getByTestId("village-census")).toBeTruthy();
  });
});
