import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { InspectorProvider } from "./InspectorContext.js";
import { InspectorPanel } from "./InspectorPanel.js";
import { VillagePanel } from "./VillagePanel.js";

function makeState(
  village: { kittens: number; happiness?: number },
  effectCache?: Record<string, number>,
) {
  return {
    version: 1,
    tick: 0,
    village,
    effectCache: effectCache ?? {},
  } as unknown as import("@kittens/api-spec").GameStateResponse;
}

afterEach(() => {
  cleanup();
});

function WithInspector({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <InspectorProvider>
      {children}
      <InspectorPanel />
    </InspectorProvider>
  );
}

describe("VillagePanel", () => {
  it("shows loading placeholder when state is null", () => {
    render(<VillagePanel state={null} />);
    expect(screen.getByTestId("village-panel-loading")).toBeTruthy();
    expect(screen.getByText(/loading village/i)).toBeTruthy();
  });

  it("shows loading placeholder when state is undefined", () => {
    render(<VillagePanel state={undefined} />);
    expect(screen.getByTestId("village-panel-loading")).toBeTruthy();
  });

  it("shows 0 kittens", () => {
    const state = makeState({ kittens: 0 });
    render(<VillagePanel state={state} />);
    expect(screen.getByTestId("village-panel")).toBeTruthy();
    expect(screen.getByText(/0 \/ 0 kittens/)).toBeTruthy();
  });

  it("shows N kittens with happiness %", () => {
    const state = makeState(
      { kittens: 5, happiness: 0.82 },
      { maxKittens: 10 },
    );
    render(<VillagePanel state={state} />);
    expect(screen.getByText(/5 \/ 10 kittens/)).toBeTruthy();
    expect(screen.getByText(/82% happy/)).toBeTruthy();
  });

  it("shows maxKittens from effectCache", () => {
    const state = makeState({ kittens: 3 }, { maxKittens: 20 });
    render(<VillagePanel state={state} />);
    expect(screen.getByText(/3 \/ 20 kittens/)).toBeTruthy();
  });

  it("shows 0 maxKittens when effectCache has no maxKittens", () => {
    const state = makeState({ kittens: 2 }, {});
    render(<VillagePanel state={state} />);
    expect(screen.getByText(/2 \/ 0 kittens/)).toBeTruthy();
  });

  it("shows 100% happy when happiness is 1.0", () => {
    const state = makeState({ kittens: 1, happiness: 1.0 });
    render(<VillagePanel state={state} />);
    expect(screen.getByText(/100% happy/)).toBeTruthy();
  });

  it("shows 0% happy when happiness is 0", () => {
    const state = makeState({ kittens: 1, happiness: 0 });
    render(<VillagePanel state={state} />);
    expect(screen.getByText(/0% happy/)).toBeTruthy();
  });

  it("uses village kittens even if resources contain a conflicting kittens entry", () => {
    const state = {
      ...makeState({ kittens: 12, happiness: 1.0 }, { maxKittens: 12 }),
      resources: {
        kittens: { value: 6217.28, maxValue: 0, perTick: 0.01 },
      },
    } as unknown as import("@kittens/api-spec").GameStateResponse;
    render(<VillagePanel state={state} />);
    expect(screen.getByText(/12 \/ 12 kittens/)).toBeTruthy();
  });

  it("shows happiness breakdown in inspector on hover", () => {
    const state = {
      ...makeState(
        { kittens: 12, happiness: 1.76 },
        {
          maxKittens: 20,
          happiness: 5,
          luxuryHappinessBonus: 2,
          consumableLuxuryHappiness: 1,
          unhappinessRatio: -0.5,
          festivalRatio: 0.5,
        },
      ),
      calendar: { day: 0, season: 0, year: 0, festivalDays: 10 },
      resources: {
        furs: { value: 1 },
        karma: { value: 20 },
      },
    } as unknown as import("@kittens/api-spec").GameStateResponse;

    render(<WithInspector><VillagePanel state={state} /></WithInspector>);
    fireEvent.mouseEnter(screen.getByTestId("village-happiness"));

    expect(screen.getByText("Happiness")).toBeTruthy();
    expect(screen.getByText("Current total")).toBeTruthy();
    expect(screen.getByText("176%")).toBeTruthy();
    expect(screen.getByText("Base happiness")).toBeTruthy();
    expect(screen.getByText("+100%")).toBeTruthy();
    expect(screen.getByText("Building bonus")).toBeTruthy();
    expect(screen.getByText("+5%")).toBeTruthy();
    expect(screen.getByText("Luxury bonus")).toBeTruthy();
    expect(screen.getByText("+25%")).toBeTruthy();
    expect(screen.getByText("Karma bonus")).toBeTruthy();
    expect(screen.getByText("+20%")).toBeTruthy();
    expect(screen.getByText("Festival bonus")).toBeTruthy();
    expect(screen.getByText("+45%")).toBeTruthy();
    expect(screen.getByText("Unhappiness penalty")).toBeTruthy();
    expect(screen.getByText("-7%")).toBeTruthy();
    expect(screen.getByText("Base penalty")).toBeTruthy();
    expect(screen.getByText("-14%")).toBeTruthy();
    expect(screen.getByText("Penalty mitigation")).toBeTruthy();
    expect(screen.getByText("+7%")).toBeTruthy();
  });
});
