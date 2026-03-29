import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SpacePanel } from "./SpacePanel.js";

const mockMutate = vi.fn();
vi.mock("./useGameAction.js", () => ({
  useGameAction: () => ({ mutate: mockMutate, isPending: false, error: null }),
}));

function makeState(
  space: {
    programs?: Record<string, { val: number; on: number; unlocked: boolean }>;
    planets?: Record<string, { unlocked: boolean; reached: boolean; routeDays: number }>;
    spaceBuildings?: Record<string, { val: number; on: number; unlocked: boolean }>;
  },
  resources: Record<string, { value: number }> = {},
) {
  return {
    version: 1,
    tick: 0,
    space: {
      programs: space.programs ?? {},
      planets: space.planets ?? {},
      spaceBuildings: space.spaceBuildings ?? {},
    },
    resources: Object.fromEntries(
      Object.entries(resources).map(([k, v]) => [k, { value: v.value, maxValue: 0, perTick: 0 }]),
    ),
  } as unknown as import("@kittens/api-spec").GameStateResponse;
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("SpacePanel", () => {
  it("shows loading placeholder when state is null", () => {
    render(<SpacePanel state={null} />);
    expect(screen.getByTestId("space-panel-loading")).toBeTruthy();
  });

  it("shows loading placeholder when state is undefined", () => {
    render(<SpacePanel state={undefined} />);
    expect(screen.getByTestId("space-panel-loading")).toBeTruthy();
  });

  it("renders space panel when state is present", () => {
    const state = makeState({});
    render(<SpacePanel state={state} />);
    expect(screen.getByTestId("space-panel")).toBeTruthy();
  });

  it("shows no content message when nothing is unlocked", () => {
    const state = makeState({});
    render(<SpacePanel state={state} />);
    expect(screen.getByText(/not.*unlocked|no space content/i)).toBeTruthy();
  });

  it("shows unlocked missions with Launch button", () => {
    const state = makeState({
      programs: {
        moonMission: { val: 0, on: 0, unlocked: true },
        sunMission: { val: 0, on: 0, unlocked: false },
      },
    });
    render(<SpacePanel state={state} />);
    expect(screen.getByTestId("program-moonMission")).toBeTruthy();
    expect(screen.queryByTestId("program-sunMission")).toBeNull();
  });

  it("dispatches LAUNCH_MISSION when Launch is clicked", () => {
    // moonMission costs titanium:5000, oil:45000, science:125000, starchart:500
    const state = makeState(
      { programs: { moonMission: { val: 0, on: 0, unlocked: true } } },
      {
        titanium: { value: 10000 },
        oil: { value: 100000 },
        science: { value: 200000 },
        starchart: { value: 1000 },
      },
    );
    render(<SpacePanel state={state} />);
    const btn = screen.getByTestId("program-moonMission-launch");
    fireEvent.click(btn);
    expect(mockMutate).toHaveBeenCalledWith({ type: "LAUNCH_MISSION", name: "moonMission" });
  });

  it("shows unlocked space buildings with Buy button", () => {
    const state = makeState({
      spaceBuildings: {
        moonBase: { val: 0, on: 0, unlocked: true },
        moonOutpost: { val: 0, on: 0, unlocked: false },
      },
    });
    render(<SpacePanel state={state} />);
    expect(screen.getByTestId("sb-moonBase")).toBeTruthy();
    expect(screen.queryByTestId("sb-moonOutpost")).toBeNull();
  });

  it("dispatches BUY_SPACE_BUILDING when Buy is clicked", () => {
    // moonBase costs titanium:9500, oil:70000, unobtainium:50, science:100000, starchart:700, concrate:250
    const state = makeState(
      { spaceBuildings: { moonBase: { val: 0, on: 0, unlocked: true } } },
      {
        titanium: { value: 100000 },
        oil: { value: 1000000 },
        unobtainium: { value: 1000 },
        science: { value: 1000000 },
        starchart: { value: 10000 },
        concrate: { value: 10000 },
      },
    );
    render(<SpacePanel state={state} />);
    const btn = screen.getByTestId("sb-moonBase-buy");
    fireEvent.click(btn);
    expect(mockMutate).toHaveBeenCalledWith({ type: "BUY_SPACE_BUILDING", name: "moonBase" });
  });
});
