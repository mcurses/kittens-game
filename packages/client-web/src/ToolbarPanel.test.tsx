import { cleanup, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ToolbarPanel } from "./ToolbarPanel.js";

vi.mock("./useGameAction.js", () => ({
  useGameAction: () => ({ mutate: vi.fn(), isPending: false, error: null }),
}));

function makeState(opts: {
  techs?: Record<string, { unlocked: boolean; researched: boolean }>;
  resources?: Record<string, { value: number; maxValue?: number; perTick?: number }>;
  effectCache?: Record<string, number>;
  challenges?: Record<string, { active: boolean; researched: boolean }>;
}) {
  return {
    version: 1,
    tick: 0,
    science: { techs: opts.techs ?? {}, policies: {} },
    resources: Object.fromEntries(
      Object.entries(opts.resources ?? {}).map(([k, v]) => [
        k,
        { value: v.value, maxValue: v.maxValue ?? 0, perTick: v.perTick ?? 0 },
      ]),
    ),
    effectCache: opts.effectCache ?? {},
    challenges: opts.challenges ?? {},
  } as unknown as import("@kittens/api-spec").GameStateResponse;
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// ── Story 52-01: Energy display ───────────────────────────────────────────────

describe("Story 52-01: Energy display", () => {
  it("renders only the card-size toggle when state is null", () => {
    const { container } = render(<ToolbarPanel state={null} />);
    // No energy / sorrow indicators, but the card-size toggle is always present.
    expect(container.querySelector('[data-testid="toolbar-energy"]')).toBeNull();
    expect(container.querySelector('[data-testid="toolbar-sorrow"]')).toBeNull();
    expect(container.querySelector('[data-testid="toolbar-card-size"]')).not.toBeNull();
  });

  it("hides energy when electricity tech not researched", () => {
    const state = makeState({
      techs: { electricity: { unlocked: true, researched: false } },
      effectCache: { energyProduction: 5, energyConsumption: 2 },
    });
    render(<ToolbarPanel state={state} />);
    expect(screen.queryByTestId("toolbar-energy")).toBeNull();
  });

  it("shows energy when electricity tech is researched", () => {
    const state = makeState({
      techs: { electricity: { unlocked: true, researched: true } },
      effectCache: { energyProduction: 5, energyConsumption: 2 },
    });
    render(<ToolbarPanel state={state} />);
    expect(screen.getByTestId("toolbar-energy")).toBeTruthy();
  });

  it("displays net energy value with W suffix", () => {
    const state = makeState({
      techs: { electricity: { unlocked: true, researched: true } },
      effectCache: { energyProduction: 10, energyConsumption: 3 },
    });
    render(<ToolbarPanel state={state} />);
    const el = screen.getByTestId("toolbar-energy");
    expect(el.textContent).toMatch(/7.*W/);
  });

  it("shows positive energy in green", () => {
    const state = makeState({
      techs: { electricity: { unlocked: true, researched: true } },
      effectCache: { energyProduction: 10, energyConsumption: 3 },
    });
    render(<ToolbarPanel state={state} />);
    const el = screen.getByTestId("toolbar-energy");
    expect(el.className).not.toMatch(/warning/);
  });

  it("shows negative energy with warning class", () => {
    const state = makeState({
      techs: { electricity: { unlocked: true, researched: true } },
      effectCache: { energyProduction: 2, energyConsumption: 5 },
    });
    render(<ToolbarPanel state={state} />);
    const el = screen.getByTestId("toolbar-energy");
    expect(el.className).toMatch(/warning/);
  });

  it("shows tooltip with production and consumption breakdown", () => {
    const state = makeState({
      techs: { electricity: { unlocked: true, researched: true } },
      effectCache: { energyProduction: 10, energyConsumption: 3 },
    });
    render(<ToolbarPanel state={state} />);
    const el = screen.getByTestId("toolbar-energy");
    const title = el.getAttribute("title") ?? "";
    expect(title).toMatch(/10/);
    expect(title).toMatch(/3/);
  });

  it("shows deficit penalty in tooltip when energy negative", () => {
    const state = makeState({
      techs: { electricity: { unlocked: true, researched: true } },
      effectCache: { energyProduction: 2, energyConsumption: 5 },
    });
    render(<ToolbarPanel state={state} />);
    const el = screen.getByTestId("toolbar-energy");
    const title = el.getAttribute("title") ?? "";
    // delta = 2/5 = 0.4, penalty = floor((1-0.4)*100) = 60%
    expect(title).toMatch(/60%/);
  });

  it("caps deficit penalty at 75%", () => {
    const state = makeState({
      techs: { electricity: { unlocked: true, researched: true } },
      effectCache: { energyProduction: 0, energyConsumption: 10 },
    });
    render(<ToolbarPanel state={state} />);
    const el = screen.getByTestId("toolbar-energy");
    const title = el.getAttribute("title") ?? "";
    // delta = max(0/10, 0.25) = 0.25, penalty = floor((1-0.25)*100) = 75%
    expect(title).toMatch(/75%/);
  });

  it("applies energyProductionRatio to production", () => {
    const state = makeState({
      techs: { electricity: { unlocked: true, researched: true } },
      effectCache: {
        energyProduction: 10,
        energyConsumption: 5,
        energyProductionRatio: 0.5,
      },
    });
    render(<ToolbarPanel state={state} />);
    const el = screen.getByTestId("toolbar-energy");
    // prod = 10 * (1 + 0.5) = 15, cons = 5, net = 10
    expect(el.textContent).toMatch(/10.*W/);
  });
});

// ── Story 52-02: Sorrow indicator ─────────────────────────────────────────────

describe("Story 52-02: Sorrow indicator", () => {
  it("hides sorrow when value is 0", () => {
    const state = makeState({
      resources: { sorrow: { value: 0, maxValue: 17 } },
    });
    render(<ToolbarPanel state={state} />);
    expect(screen.queryByTestId("toolbar-sorrow")).toBeNull();
  });

  it("hides sorrow when absent from resources", () => {
    const state = makeState({});
    render(<ToolbarPanel state={state} />);
    expect(screen.queryByTestId("toolbar-sorrow")).toBeNull();
  });

  it("shows sorrow percentage when value > 0", () => {
    const state = makeState({
      resources: { sorrow: { value: 5, maxValue: 17 } },
    });
    render(<ToolbarPanel state={state} />);
    const el = screen.getByTestId("toolbar-sorrow");
    expect(el.textContent).toMatch(/BLS.*5%/);
  });

  it("shows max styling when sorrow is at maxValue", () => {
    const state = makeState({
      resources: { sorrow: { value: 17, maxValue: 17 } },
    });
    render(<ToolbarPanel state={state} />);
    const el = screen.getByTestId("toolbar-sorrow");
    expect(el.className).toMatch(/max/);
  });

  it("does not show max styling when below maxValue", () => {
    const state = makeState({
      resources: { sorrow: { value: 10, maxValue: 17 } },
    });
    render(<ToolbarPanel state={state} />);
    const el = screen.getByTestId("toolbar-sorrow");
    expect(el.className).not.toMatch(/max/);
  });

  it("has tooltip with sorrow description", () => {
    const state = makeState({
      resources: { sorrow: { value: 5, maxValue: 17 } },
    });
    render(<ToolbarPanel state={state} />);
    const el = screen.getByTestId("toolbar-sorrow");
    expect(el.getAttribute("title")).toBeTruthy();
  });
});
