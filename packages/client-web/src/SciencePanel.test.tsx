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
  extra?: {
    policies?: Record<string, { unlocked: boolean; blocked: boolean; researched: boolean }>;
    prestige?: { perks: Record<string, { unlocked: boolean; researched: boolean }> };
  },
) {
  return {
    version: 1,
    tick: 0,
    science: { techs, policies: extra?.policies ?? {} },
    prestige: extra?.prestige ?? { perks: {} },
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
  window.localStorage.clear();
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

  it("keeps Research button and marks it storage-limited when tech cost exceeds current storage", () => {
    const state = makeState(
      { archery: { unlocked: true, researched: false } },
      { science: { value: 0, maxValue: 200 } },
    );
    render(<WithInspector><SciencePanel state={state} /></WithInspector>);
    const btn = screen.getByTestId("tech-archery-research");
    expect(btn.textContent).toBe("Research");
    expect(btn.className).toMatch(/btn--limited/);
    expect(btn.hasAttribute("disabled")).toBe(true);
  });

  it("inspector highlights the storage-limited resource line", async () => {
    const state = makeState(
      { archery: { unlocked: true, researched: false } },
      { science: { value: 0, maxValue: 200 } },
    );
    const userEvent = (await import("@testing-library/user-event")).default;
    render(<WithInspector><SciencePanel state={state} /></WithInspector>);
    await userEvent.hover(screen.getByTestId("tech-archery"));
    expect(screen.getByTestId("inspector-price-science-limited").textContent).toMatch(/\*/);
    expect(screen.getByText(/limited by current storage/i)).toBeTruthy();
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

  it("restores hide-researched from localStorage on reload", () => {
    window.localStorage.setItem("science:hideResearched", "true");
    const state = makeState({
      calendar: { unlocked: true, researched: true },
      archery: { unlocked: true, researched: false },
    });
    render(<WithInspector><SciencePanel state={state} /></WithInspector>);
    expect(screen.getByTestId("science-hide-researched")).toBeTruthy();
    expect((screen.getByTestId("science-hide-researched") as HTMLInputElement).checked).toBe(true);
    expect(screen.queryByTestId("tech-calendar")).toBeNull();
    expect(screen.getByTestId("tech-archery")).toBeTruthy();
  });
});

// ── Story 51-01: Policy panel ─────────────────────────────────────────────────

describe("Story 51-01: Policy panel", () => {
  it("renders Policies section when any policy is unlocked", () => {
    const state = makeState({}, {}, {
      policies: { liberty: { unlocked: true, blocked: false, researched: false } },
    });
    render(<WithInspector><SciencePanel state={state} /></WithInspector>);
    expect(screen.getByText("Policies")).toBeTruthy();
  });

  it("hides Policies section when no policies are unlocked", () => {
    const state = makeState({}, {}, {
      policies: { liberty: { unlocked: false, blocked: false, researched: false } },
    });
    render(<WithInspector><SciencePanel state={state} /></WithInspector>);
    expect(screen.queryByText("Policies")).toBeNull();
  });

  it("shows unlocked policy with Adopt button", () => {
    const state = makeState({}, { culture: { value: 200 } }, {
      policies: { liberty: { unlocked: true, blocked: false, researched: false } },
    });
    render(<WithInspector><SciencePanel state={state} /></WithInspector>);
    expect(screen.getByTestId("policy-liberty")).toBeTruthy();
    expect(screen.getByRole("button", { name: /adopt/i })).toBeTruthy();
  });

  it("shows adopted policy with Done badge", () => {
    const state = makeState({}, {}, {
      policies: { liberty: { unlocked: true, blocked: false, researched: true } },
    });
    render(<WithInspector><SciencePanel state={state} /></WithInspector>);
    expect(screen.getByTestId("policy-liberty")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /adopt/i })).toBeNull();
    expect(screen.getByText(/done/i)).toBeTruthy();
  });

  it("shows blocked policy as Blocked with disabled button", () => {
    const state = makeState({}, { culture: { value: 200 } }, {
      policies: { tradition: { unlocked: true, blocked: true, researched: false } },
    });
    render(<WithInspector><SciencePanel state={state} /></WithInspector>);
    expect(screen.getByTestId("policy-tradition")).toBeTruthy();
    expect(screen.getByText("Blocked")).toBeTruthy();
  });

  it("dispatches RESEARCH_POLICY when Adopt is clicked", () => {
    const state = makeState({}, { culture: { value: 200 } }, {
      policies: { liberty: { unlocked: true, blocked: false, researched: false } },
    });
    render(<WithInspector><SciencePanel state={state} /></WithInspector>);
    fireEvent.click(screen.getByRole("button", { name: /adopt/i }));
    expect(mockMutate).toHaveBeenCalledWith({ type: "RESEARCH_POLICY", name: "liberty" });
  });

  it("disables Adopt button when player cannot afford policy", () => {
    const state = makeState({}, { culture: { value: 0 } }, {
      policies: { liberty: { unlocked: true, blocked: false, researched: false } },
    });
    render(<WithInspector><SciencePanel state={state} /></WithInspector>);
    const btn = screen.getByRole("button", { name: /adopt/i });
    expect(btn.hasAttribute("disabled")).toBe(true);
  });

  it("hide-researched toggle filters adopted policies", () => {
    const state = makeState({}, {}, {
      policies: {
        liberty: { unlocked: true, blocked: false, researched: true },
        tradition: { unlocked: true, blocked: false, researched: false },
      },
    });
    render(<WithInspector><SciencePanel state={state} /></WithInspector>);
    expect(screen.getByTestId("policy-liberty")).toBeTruthy();
    fireEvent.click(screen.getByTestId("policy-hide-researched"));
    expect(screen.queryByTestId("policy-liberty")).toBeNull();
    expect(screen.getByTestId("policy-tradition")).toBeTruthy();
  });

  it("hide-blocked toggle filters blocked policies", () => {
    const state = makeState({}, {}, {
      policies: {
        liberty: { unlocked: true, blocked: false, researched: false },
        tradition: { unlocked: true, blocked: true, researched: false },
      },
    });
    render(<WithInspector><SciencePanel state={state} /></WithInspector>);
    expect(screen.getByTestId("policy-tradition")).toBeTruthy();
    fireEvent.click(screen.getByTestId("policy-hide-blocked"));
    expect(screen.queryByTestId("policy-tradition")).toBeNull();
    expect(screen.getByTestId("policy-liberty")).toBeTruthy();
  });
});

// ── Story 51-02: Prestige perks panel ─────────────────────────────────────────

describe("Story 51-02: Prestige perks panel", () => {
  it("renders Metaphysics section when metaphysics tech is researched", () => {
    const state = makeState(
      { metaphysics: { unlocked: true, researched: true } },
      { paragon: { value: 10 } },
      { prestige: { perks: { engeneering: { unlocked: true, researched: false } } } },
    );
    render(<WithInspector><SciencePanel state={state} /></WithInspector>);
    expect(screen.getByText("Metaphysics")).toBeTruthy();
  });

  it("renders Metaphysics section when any perk is researched (no metaphysics tech)", () => {
    const state = makeState(
      {},
      {},
      { prestige: { perks: { engeneering: { unlocked: true, researched: true } } } },
    );
    render(<WithInspector><SciencePanel state={state} /></WithInspector>);
    expect(screen.getByText("Metaphysics")).toBeTruthy();
  });

  it("hides Metaphysics section when no qualification", () => {
    const state = makeState({}, {}, {
      prestige: { perks: { engeneering: { unlocked: true, researched: false } } },
    });
    render(<WithInspector><SciencePanel state={state} /></WithInspector>);
    expect(screen.queryByText("Metaphysics")).toBeNull();
  });

  it("shows unlocked perk with Purchase button", () => {
    const state = makeState(
      { metaphysics: { unlocked: true, researched: true } },
      { paragon: { value: 100 } },
      { prestige: { perks: { engeneering: { unlocked: true, researched: false } } } },
    );
    render(<WithInspector><SciencePanel state={state} /></WithInspector>);
    expect(screen.getByTestId("perk-engeneering")).toBeTruthy();
    expect(screen.getByRole("button", { name: /purchase/i })).toBeTruthy();
  });

  it("shows purchased perk with Done badge", () => {
    const state = makeState(
      { metaphysics: { unlocked: true, researched: true } },
      { paragon: { value: 10 } },
      { prestige: { perks: { engeneering: { unlocked: true, researched: true } } } },
    );
    render(<WithInspector><SciencePanel state={state} /></WithInspector>);
    expect(screen.getByTestId("perk-engeneering")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /purchase/i })).toBeNull();
  });

  it("disables Purchase button when paragon insufficient", () => {
    const state = makeState(
      { metaphysics: { unlocked: true, researched: true } },
      { paragon: { value: 1 } },
      { prestige: { perks: { engeneering: { unlocked: true, researched: false } } } },
    );
    render(<WithInspector><SciencePanel state={state} /></WithInspector>);
    const btn = screen.getByRole("button", { name: /purchase/i });
    expect(btn.hasAttribute("disabled")).toBe(true);
  });

  it("dispatches PURCHASE_PERK when Purchase is clicked", () => {
    const state = makeState(
      { metaphysics: { unlocked: true, researched: true } },
      { paragon: { value: 100 } },
      { prestige: { perks: { engeneering: { unlocked: true, researched: false } } } },
    );
    render(<WithInspector><SciencePanel state={state} /></WithInspector>);
    fireEvent.click(screen.getByRole("button", { name: /purchase/i }));
    expect(mockMutate).toHaveBeenCalledWith({ type: "PURCHASE_PERK", name: "engeneering" });
  });

  it("shows Burn Paragon button when paragon > 0", () => {
    const state = makeState(
      { metaphysics: { unlocked: true, researched: true } },
      { paragon: { value: 10 } },
      { prestige: { perks: { engeneering: { unlocked: true, researched: false } } } },
    );
    render(<WithInspector><SciencePanel state={state} /></WithInspector>);
    expect(screen.getByRole("button", { name: /burn paragon/i })).toBeTruthy();
  });

  it("dispatches BURN_PARAGON when Burn Paragon is clicked", () => {
    const state = makeState(
      { metaphysics: { unlocked: true, researched: true } },
      { paragon: { value: 10 } },
      { prestige: { perks: { engeneering: { unlocked: true, researched: false } } } },
    );
    render(<WithInspector><SciencePanel state={state} /></WithInspector>);
    fireEvent.click(screen.getByRole("button", { name: /burn paragon/i }));
    expect(mockMutate).toHaveBeenCalledWith({ type: "BURN_PARAGON" });
  });
});

// ── Story 51-03: Policy and perk flavor text ──────────────────────────────────

describe("Story 51-03: Policy and perk flavor text in inspector", () => {
  it("shows policy details in inspector on hover", async () => {
    const state = makeState({}, { culture: { value: 200 } }, {
      policies: { liberty: { unlocked: true, blocked: false, researched: false } },
    });
    const userEvent = (await import("@testing-library/user-event")).default;
    render(<WithInspector><SciencePanel state={state} /></WithInspector>);
    await userEvent.hover(screen.getByTestId("policy-liberty"));
    expect(screen.getByTestId("inspector-panel")).toBeTruthy();
    expect(screen.getAllByText(/liberty/).length).toBeGreaterThan(0);
  });

  it("shows perk details in inspector on hover", async () => {
    const state = makeState(
      { metaphysics: { unlocked: true, researched: true } },
      { paragon: { value: 100 } },
      { prestige: { perks: { engeneering: { unlocked: true, researched: false } } } },
    );
    const userEvent = (await import("@testing-library/user-event")).default;
    render(<WithInspector><SciencePanel state={state} /></WithInspector>);
    await userEvent.hover(screen.getByTestId("perk-engeneering"));
    expect(screen.getByTestId("inspector-panel")).toBeTruthy();
    expect(screen.getAllByText(/engeneering/).length).toBeGreaterThan(0);
  });
});
