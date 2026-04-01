import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { InspectorProvider } from "./InspectorContext.js";
import { InspectorPanel } from "./InspectorPanel.js";
import { SciencePanel } from "./SciencePanel.js";

const mockMutate = vi.fn();
vi.mock("./useGameAction.js", () => ({
  useGameAction: () => ({ mutate: mockMutate, isPending: false, error: null }),
}));

function makeState(
  techs: Record<string, { unlocked: boolean; researched: boolean }>,
  resources: Record<string, { value: number; maxValue?: number }> = {},
) {
  return {
    version: 1,
    tick: 0,
    science: { techs, policies: {} },
    resources: Object.fromEntries(
      Object.entries(resources).map(([k, v]) => [k, { value: v.value, maxValue: v.maxValue ?? 0, perTick: 0 }]),
    ),
  } as unknown as import("@kittens/api-spec").GameStateResponse;
}

function WithInspector({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <InspectorProvider>
      {children}
      <InspectorPanel />
    </InspectorProvider>
  );
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("SciencePanel", () => {
  it("shows loading placeholder when state is null", () => {
    render(<WithInspector><SciencePanel state={null} /></WithInspector>);
    expect(screen.getByTestId("science-panel-loading")).toBeTruthy();
  });

  it("shows loading placeholder when state is undefined", () => {
    render(<WithInspector><SciencePanel state={undefined} /></WithInspector>);
    expect(screen.getByTestId("science-panel-loading")).toBeTruthy();
  });

  it("shows no techs message when science is empty", () => {
    render(<WithInspector><SciencePanel state={makeState({})} /></WithInspector>);
    expect(screen.getByText("No technologies available.")).toBeTruthy();
  });

  it("hides techs that are not unlocked", () => {
    const state = makeState({
      agriculture: { unlocked: false, researched: false },
      archery: { unlocked: true, researched: false },
    });
    render(<WithInspector><SciencePanel state={state} /></WithInspector>);
    expect(screen.queryByTestId("tech-agriculture")).toBeNull();
    expect(screen.getByTestId("tech-archery")).toBeTruthy();
  });

  it("shows unlocked unresearched tech with Research button", () => {
    // agriculture costs 100 science; provide enough to afford it
    const state = makeState(
      { agriculture: { unlocked: true, researched: false } },
      { science: { value: 200 } },
    );
    render(<WithInspector><SciencePanel state={state} /></WithInspector>);
    expect(screen.getByTestId("tech-agriculture")).toBeTruthy();
    expect(screen.getByRole("button", { name: /research/i })).toBeTruthy();
  });

  it("shows researched tech as Done (no button)", () => {
    const state = makeState({ agriculture: { unlocked: true, researched: true } });
    render(<WithInspector><SciencePanel state={state} /></WithInspector>);
    expect(screen.getByTestId("tech-agriculture")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /research/i })).toBeNull();
    expect(screen.getByText(/done/i)).toBeTruthy();
  });

  it("dispatches RESEARCH action when Research is clicked", () => {
    // archery costs 300 science; provide enough to afford it
    const state = makeState(
      { archery: { unlocked: true, researched: false } },
      { science: { value: 1000 } },
    );
    render(<WithInspector><SciencePanel state={state} /></WithInspector>);
    fireEvent.click(screen.getByRole("button", { name: /research/i }));
    expect(mockMutate).toHaveBeenCalledWith({ type: "RESEARCH", name: "archery" });
  });

  // Story 25-4: cost display
  it("shows tech price in Research button text", () => {
    // 'calendar' tech costs 30 science
    const state = makeState({ calendar: { unlocked: true, researched: false } });
    render(<WithInspector><SciencePanel state={state} /></WithInspector>);
    // button label should include cost info
    expect(screen.getByRole("button", { name: /research/i })).toBeTruthy();
    expect(screen.getByText(/30/)).toBeTruthy();
  });

  it("disables Research button when player cannot afford tech", () => {
    // calendar costs 30 science; player has 0
    const state = makeState(
      { calendar: { unlocked: true, researched: false } },
      { science: { value: 0 } },
    );
    render(<WithInspector><SciencePanel state={state} /></WithInspector>);
    const btn = screen.getByRole("button", { name: /research/i });
    expect(btn.hasAttribute("disabled")).toBe(true);
  });

  it("enables Research button when player can afford tech", () => {
    // calendar costs 30 science; player has 100
    const state = makeState(
      { calendar: { unlocked: true, researched: false } },
      { science: { value: 100 } },
    );
    render(<WithInspector><SciencePanel state={state} /></WithInspector>);
    const btn = screen.getByRole("button", { name: /research/i });
    expect(btn.hasAttribute("disabled")).toBe(false);
  });

  it("shows Maxed state when tech cost exceeds current storage", () => {
    const state = makeState(
      { archery: { unlocked: true, researched: false } },
      { science: { value: 0, maxValue: 200 } },
    );
    render(<WithInspector><SciencePanel state={state} /></WithInspector>);
    expect(screen.getByTestId("tech-archery-maxed").textContent).toMatch(/maxed/i);
    expect(screen.queryByRole("button", { name: /research/i })).toBeNull();
  });

  it("shows tech details in inspector on hover", async () => {
    const state = makeState({ agriculture: { unlocked: true, researched: false } });
    const userEvent = (await import("@testing-library/user-event")).default;
    render(<WithInspector><SciencePanel state={state} /></WithInspector>);
    await userEvent.hover(screen.getByTestId("tech-agriculture"));
    expect(screen.getByTestId("inspector-panel")).toBeTruthy();
    expect(screen.getAllByText(/agriculture/).length).toBeGreaterThan(0);
  });

  it("renders multiple unlocked techs", () => {
    const state = makeState({
      agriculture: { unlocked: true, researched: false },
      archery: { unlocked: true, researched: true },
      calendar: { unlocked: false, researched: false },
    });
    render(<WithInspector><SciencePanel state={state} /></WithInspector>);
    expect(screen.getByTestId("tech-agriculture")).toBeTruthy();
    expect(screen.getByTestId("tech-archery")).toBeTruthy();
    expect(screen.queryByTestId("tech-calendar")).toBeNull();
  });
});

// ── Story 35-03: Science hide-researched toggle ───────────────────────────────

describe("Story 35-03: Science hide-researched toggle", () => {
  it("shows hide-researched checkbox", () => {
    const state = makeState({ calendar: { unlocked: true, researched: false } });
    render(<WithInspector><SciencePanel state={state} /></WithInspector>);
    expect(screen.getByTestId("science-hide-researched")).toBeTruthy();
  });

  it("hide-researched toggle hides researched techs when checked", () => {
    const state = makeState({
      calendar: { unlocked: true, researched: true },
      archery: { unlocked: true, researched: false },
    });
    render(<WithInspector><SciencePanel state={state} /></WithInspector>);
    // Initially both visible
    expect(screen.getByTestId("tech-calendar")).toBeTruthy();
    fireEvent.click(screen.getByTestId("science-hide-researched"));
    // calendar is researched → hidden; archery still visible
    expect(screen.queryByTestId("tech-calendar")).toBeNull();
    expect(screen.getByTestId("tech-archery")).toBeTruthy();
  });

  it("hide-researched toggle shows all when unchecked", () => {
    const state = makeState({
      calendar: { unlocked: true, researched: true },
    });
    render(<WithInspector><SciencePanel state={state} /></WithInspector>);
    const toggle = screen.getByTestId("science-hide-researched");
    fireEvent.click(toggle); // hide
    fireEvent.click(toggle); // show again
    expect(screen.getByTestId("tech-calendar")).toBeTruthy();
  });
});
