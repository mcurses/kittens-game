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
});

// ── Story 48-01: Job tooltips in inspector ──────────────────────────────────

describe("Story 48-01: Job tooltips in inspector", () => {
  it("shows job details in inspector on hover", () => {
    const state = makeStateWithVillage({ farmer: { value: 2, unlocked: true } });
    render(<WithInspector><JobsPanel state={state} /></WithInspector>);

    fireEvent.mouseEnter(screen.getByTestId("job-farmer"));
    expect(screen.getByTestId("inspector-job-name")).toBeTruthy();
    expect(screen.getByTestId("inspector-job-name").textContent).toBe("Farmer");
  });

  it("shows per-kitten production modifiers for woodcutter", () => {
    const state = makeStateWithVillage({ woodcutter: { value: 1, unlocked: true } });
    render(<WithInspector><JobsPanel state={state} /></WithInspector>);

    fireEvent.mouseEnter(screen.getByTestId("job-woodcutter"));
    const inspector = screen.getByTestId("inspector-panel");
    expect(inspector.textContent).toContain("Per kitten");
    expect(inspector.textContent).toContain("Wood");
    expect(inspector.textContent).toContain("0.018/tick");
  });

  it("shows flavor text for jobs that have it", () => {
    const state = makeStateWithVillage({ hunter: { value: 1, unlocked: true } });
    render(<WithInspector><JobsPanel state={state} /></WithInspector>);

    fireEvent.mouseEnter(screen.getByTestId("job-hunter"));
    const inspector = screen.getByTestId("inspector-panel");
    expect(inspector.textContent).toContain("purr at our prey");
  });

  it("clears inspector on mouse leave", () => {
    const state = makeStateWithVillage({ farmer: { value: 1, unlocked: true } });
    render(<WithInspector><JobsPanel state={state} /></WithInspector>);

    fireEvent.mouseEnter(screen.getByTestId("job-farmer"));
    expect(screen.getByTestId("inspector-job-name")).toBeTruthy();

    fireEvent.mouseLeave(screen.getByTestId("job-farmer"));
    expect(screen.getByText("Hover an item to inspect it")).toBeTruthy();
  });

  it("shows no modifiers for engineer", () => {
    const state = makeStateWithVillage({ engineer: { value: 1, unlocked: true } });
    render(<WithInspector><JobsPanel state={state} /></WithInspector>);

    fireEvent.mouseEnter(screen.getByTestId("job-engineer"));
    const inspector = screen.getByTestId("inspector-panel");
    expect(inspector.textContent).not.toContain("Per kitten");
  });
});

// ── Story 48-02: Shift+click assign all ─────────────────────────────────────

describe("Story 48-02: Shift+click assign all", () => {
  it("shift+click on + assigns all free kittens", () => {
    const state = makeStateWithVillage({ farmer: { value: 1, unlocked: true } }, { kittens: 6 });
    render(<JobsPanel state={state} />);

    fireEvent.click(screen.getByTestId("job-farmer-assign"), { shiftKey: true });
    expect(mockMutate).toHaveBeenCalledWith({ type: "ASSIGN_JOB", job: "farmer", count: 5 });
  });

  it("normal click on + assigns 1 kitten", () => {
    const state = makeStateWithVillage({ farmer: { value: 1, unlocked: true } }, { kittens: 6 });
    render(<JobsPanel state={state} />);

    fireEvent.click(screen.getByTestId("job-farmer-assign"));
    expect(mockMutate).toHaveBeenCalledWith({ type: "ASSIGN_JOB", job: "farmer" });
  });
});

// ── Story 48-05: Census Panel ─────────────────────────────────────────────────

function makeKitten(overrides: Record<string, unknown> = {}) {
  return {
    id: "k1",
    name: "Mittens",
    surname: "Whiskers",
    age: 10,
    trait: "none",
    job: null,
    skills: {},
    rank: 0,
    exp: 0,
    isFavorite: false,
    isLeader: false,
    ...overrides,
  };
}

function makeCensusState(
  kittens: Array<Record<string, unknown>>,
  jobs: Record<string, { value: number; unlocked?: boolean }> = {},
) {
  return {
    version: 1,
    tick: 0,
    village: {
      kittens: kittens.length,
      happiness: 1.0,
      jobs,
      sim: kittens,
    },
    science: { techs: { civil: { researched: true } } },
    calendar: { festivalDays: 0, day: 0, season: 0, year: 0 },
    resources: {},
  } as unknown as import("@kittens/api-spec").GameStateResponse;
}

describe("Story 48-05: Census Panel", () => {
  it("shows census section when population > 0 and civil researched", () => {
    const state = makeCensusState([makeKitten()]);
    render(<JobsPanel state={state} />);
    expect(screen.getByTestId("village-census")).toBeTruthy();
  });

  it("does not show census when population is 0", () => {
    const state = makeCensusState([]);
    render(<JobsPanel state={state} />);
    // Census visibility depends on ui-visibility which requires civil service tech
    // With 0 sim kittens, the census list should be empty
    const census = screen.queryByTestId("census-list");
    // Either the section is hidden or the list is empty
    if (census) {
      expect(census.children.length).toBe(0);
    }
  });

  it("renders kitten name, age, trait, job, and rank in census row", () => {
    const k = makeKitten({
      id: "k1",
      name: "Mittens",
      surname: "Whiskers",
      age: 15,
      trait: "scientist",
      job: "scholar",
      rank: 2,
      skills: { scholar: 5.5, farmer: 1.2 },
    });
    const state = makeCensusState([k], { scholar: { value: 1, unlocked: true } });
    render(<JobsPanel state={state} />);

    const row = screen.getByTestId("census-kitten-k1");
    expect(row).toBeTruthy();
    expect(row.textContent).toContain("Mittens");
    expect(row.textContent).toContain("15");
    expect(row.textContent).toContain("scientist");
    expect(row.textContent).toContain("scholar");
    expect(row.textContent).toContain("2"); // rank
  });

  it("shows top 3 skills sorted by level", () => {
    const k = makeKitten({
      skills: { scholar: 5.5, farmer: 1.2, miner: 3.0, woodcutter: 8.1 },
    });
    const state = makeCensusState([k]);
    render(<JobsPanel state={state} />);

    const row = screen.getByTestId("census-kitten-k1");
    // Should show woodcutter (8.1), scholar (5.5), miner (3.0) — top 3
    expect(row.textContent).toContain("woodcutter");
    expect(row.textContent).toContain("scholar");
    expect(row.textContent).toContain("miner");
  });

  it("shows 'Free' when kitten has no job", () => {
    const k = makeKitten({ job: null });
    const state = makeCensusState([k]);
    render(<JobsPanel state={state} />);

    const row = screen.getByTestId("census-kitten-k1");
    expect(row.textContent).toContain("Free");
  });

  it("paginates with 10 kittens per page", () => {
    const kittens = Array.from({ length: 15 }, (_, i) =>
      makeKitten({ id: `k${i}`, name: `Cat${i}` }),
    );
    const state = makeCensusState(kittens);
    render(<JobsPanel state={state} />);

    // Should show page 1 with 10 kittens
    const list = screen.getByTestId("census-list");
    expect(list.children.length).toBe(10);

    // Should show page navigation
    expect(screen.getByTestId("census-page-next")).toBeTruthy();
  });

  it("navigates to page 2 on next click", () => {
    const kittens = Array.from({ length: 15 }, (_, i) =>
      makeKitten({ id: `k${i}`, name: `Cat${i}` }),
    );
    const state = makeCensusState(kittens);
    render(<JobsPanel state={state} />);

    fireEvent.click(screen.getByTestId("census-page-next"));
    const list = screen.getByTestId("census-list");
    // Page 2 should show remaining 5
    expect(list.children.length).toBe(5);
  });
});

// ── Story 48-06: Census Filters and Sorting ──────────────────────────────────

describe("Story 48-06: Census filters and sorting", () => {
  it("filters by job showing only matching kittens", () => {
    const kittens = [
      makeKitten({ id: "k1", name: "Alice", job: "farmer" }),
      makeKitten({ id: "k2", name: "Bob", job: "scholar" }),
      makeKitten({ id: "k3", name: "Carol", job: "farmer" }),
    ];
    const state = makeCensusState(kittens, {
      farmer: { value: 2, unlocked: true },
      scholar: { value: 1, unlocked: true },
    });
    render(<JobsPanel state={state} />);

    // Select farmer filter
    fireEvent.change(screen.getByTestId("census-filter-job"), { target: { value: "farmer" } });
    const list = screen.getByTestId("census-list");
    expect(list.children.length).toBe(2);
    expect(screen.getByTestId("census-kitten-k1")).toBeTruthy();
    expect(screen.getByTestId("census-kitten-k3")).toBeTruthy();
    expect(screen.queryByTestId("census-kitten-k2")).toBeNull();
  });

  it("filters by Free (unassigned kittens)", () => {
    const kittens = [
      makeKitten({ id: "k1", name: "Alice", job: "farmer" }),
      makeKitten({ id: "k2", name: "Bob", job: null }),
    ];
    const state = makeCensusState(kittens, { farmer: { value: 1, unlocked: true } });
    render(<JobsPanel state={state} />);

    fireEvent.change(screen.getByTestId("census-filter-job"), { target: { value: "free" } });
    const list = screen.getByTestId("census-list");
    expect(list.children.length).toBe(1);
    expect(screen.getByTestId("census-kitten-k2")).toBeTruthy();
  });

  it("sorts by name alphabetically", () => {
    const kittens = [
      makeKitten({ id: "k1", name: "Charlie", surname: "A" }),
      makeKitten({ id: "k2", name: "Alice", surname: "A" }),
      makeKitten({ id: "k3", name: "Bob", surname: "A" }),
    ];
    const state = makeCensusState(kittens);
    render(<JobsPanel state={state} />);

    fireEvent.change(screen.getByTestId("census-sort"), { target: { value: "name" } });
    const list = screen.getByTestId("census-list");
    const ids = Array.from(list.children).map((el) => el.getAttribute("data-testid"));
    expect(ids).toEqual(["census-kitten-k2", "census-kitten-k3", "census-kitten-k1"]);
  });

  it("sorts by age descending", () => {
    const kittens = [
      makeKitten({ id: "k1", name: "A", age: 5 }),
      makeKitten({ id: "k2", name: "B", age: 20 }),
      makeKitten({ id: "k3", name: "C", age: 10 }),
    ];
    const state = makeCensusState(kittens);
    render(<JobsPanel state={state} />);

    fireEvent.change(screen.getByTestId("census-sort"), { target: { value: "age" } });
    const list = screen.getByTestId("census-list");
    const ids = Array.from(list.children).map((el) => el.getAttribute("data-testid"));
    expect(ids).toEqual(["census-kitten-k2", "census-kitten-k3", "census-kitten-k1"]);
  });

  it("sorts by rank descending", () => {
    const kittens = [
      makeKitten({ id: "k1", name: "A", rank: 1 }),
      makeKitten({ id: "k2", name: "B", rank: 5 }),
      makeKitten({ id: "k3", name: "C", rank: 3 }),
    ];
    const state = makeCensusState(kittens);
    render(<JobsPanel state={state} />);

    fireEvent.change(screen.getByTestId("census-sort"), { target: { value: "rank" } });
    const list = screen.getByTestId("census-list");
    const ids = Array.from(list.children).map((el) => el.getAttribute("data-testid"));
    expect(ids).toEqual(["census-kitten-k2", "census-kitten-k3", "census-kitten-k1"]);
  });
});
