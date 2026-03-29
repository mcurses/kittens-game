import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DiplomacyPanel } from "./DiplomacyPanel.js";

const mockMutate = vi.fn();
vi.mock("./useGameAction.js", () => ({
  useGameAction: () => ({ mutate: mockMutate, isPending: false, error: null }),
}));

function makeState(
  diplomacy: {
    races?: Record<string, { unlocked: boolean; embassyLevel: number }>;
  },
) {
  return {
    version: 1,
    tick: 0,
    diplomacy: {
      races: diplomacy.races ?? {},
      baseGoldCost: 15,
      baseManpowerCost: 100,
    },
  } as unknown as import("@kittens/api-spec").GameStateResponse;
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("DiplomacyPanel", () => {
  it("shows loading placeholder when state is null", () => {
    render(<DiplomacyPanel state={null} />);
    expect(screen.getByTestId("diplomacy-panel-loading")).toBeTruthy();
  });

  it("shows loading placeholder when state is undefined", () => {
    render(<DiplomacyPanel state={undefined} />);
    expect(screen.getByTestId("diplomacy-panel-loading")).toBeTruthy();
  });

  it("renders diplomacy panel when state is present", () => {
    const state = makeState({});
    render(<DiplomacyPanel state={state} />);
    expect(screen.getByTestId("diplomacy-panel")).toBeTruthy();
  });

  it("shows no races message when races is empty", () => {
    const state = makeState({});
    render(<DiplomacyPanel state={state} />);
    expect(screen.getByText(/no races/i)).toBeTruthy();
  });

  it("shows only unlocked races", () => {
    const state = makeState({
      races: {
        zebras: { unlocked: true, embassyLevel: 0 },
        griffins: { unlocked: false, embassyLevel: 0 },
      },
    });
    render(<DiplomacyPanel state={state} />);
    expect(screen.getByTestId("race-zebras")).toBeTruthy();
    expect(screen.queryByTestId("race-griffins")).toBeNull();
  });

  it("shows Send Embassy button for each race", () => {
    const state = makeState({
      races: { zebras: { unlocked: true, embassyLevel: 2 } },
    });
    render(<DiplomacyPanel state={state} />);
    expect(screen.getByTestId("race-zebras-embassy")).toBeTruthy();
  });

  it("dispatches SEND_EMBASSY when button is clicked", () => {
    const state = makeState({
      races: { zebras: { unlocked: true, embassyLevel: 0 } },
    });
    render(<DiplomacyPanel state={state} />);
    fireEvent.click(screen.getByTestId("race-zebras-embassy"));
    expect(mockMutate).toHaveBeenCalledWith({ type: "SEND_EMBASSY", race: "zebras" });
  });

  it("dispatches TRADE when Trade button is clicked", () => {
    const state = makeState({
      races: { zebras: { unlocked: true, embassyLevel: 1 } },
    });
    render(<DiplomacyPanel state={state} />);
    fireEvent.click(screen.getByTestId("race-zebras-trade"));
    expect(mockMutate).toHaveBeenCalledWith({ type: "TRADE", race: "zebras" });
  });
});
