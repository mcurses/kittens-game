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
      baseCatpowerCost: 100,
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
    expect(mockMutate).toHaveBeenCalledWith({ type: "SEND_EMBASSY", name: "zebras" });
  });

  it("dispatches TRADE when Trade button is clicked", () => {
    const state = makeState({
      races: { zebras: { unlocked: true, embassyLevel: 1 } },
    });
    render(<DiplomacyPanel state={state} />);
    fireEvent.click(screen.getByTestId("race-zebras-trade"));
    expect(mockMutate).toHaveBeenCalledWith({ type: "TRADE", name: "zebras" });
  });
});

// ── Epic 32 Story 32-05: Trade economics + relationship status ─────────────────

describe("Story 32-05: Trade economics and relationship display", () => {
  it("shows Friendly for lizards (standing 0.25 > 0)", () => {
    const state = makeState({ races: { lizards: { unlocked: true, embassyLevel: 0 } } });
    render(<DiplomacyPanel state={state} />);
    expect(screen.getByTestId("race-lizards-relation")).toBeTruthy();
    expect(screen.getByTestId("race-lizards-relation").textContent).toMatch(/friendly/i);
  });

  it("shows Neutral for nagas (standing 0)", () => {
    const state = makeState({ races: { nagas: { unlocked: true, embassyLevel: 0 } } });
    render(<DiplomacyPanel state={state} />);
    expect(screen.getByTestId("race-nagas-relation").textContent).toMatch(/neutral/i);
  });

  it("shows Hostile for griffins (standing -0.15 < 0)", () => {
    const state = makeState({ races: { griffins: { unlocked: true, embassyLevel: 0 } } });
    render(<DiplomacyPanel state={state} />);
    expect(screen.getByTestId("race-griffins-relation").textContent).toMatch(/hostile/i);
  });

  it("shows what resource the race buys", () => {
    const state = makeState({ races: { lizards: { unlocked: true, embassyLevel: 0 } } });
    render(<DiplomacyPanel state={state} />);
    // lizards buys minerals
    expect(screen.getByTestId("race-lizards-buys").textContent).toMatch(/minerals/i);
  });

  it("shows what resources the race sells", () => {
    const state = makeState({ races: { lizards: { unlocked: true, embassyLevel: 0 } } });
    render(<DiplomacyPanel state={state} />);
    // lizards sells wood, beam, scaffold
    const sells = screen.getByTestId("race-lizards-sells");
    expect(sells.textContent).toMatch(/wood/i);
  });
});

// ── Story 35-04: Trade multi-send shortcuts ───────────────────────────────────

describe("Story 35-04: Trade multi-send shortcuts", () => {
  it("shows trade ×5 button for each race", () => {
    const state = makeState({ races: { zebras: { unlocked: true, embassyLevel: 1 } } });
    render(<DiplomacyPanel state={state} />);
    expect(screen.getByTestId("race-zebras-trade5")).toBeTruthy();
  });

  it("shows trade ×25 button for each race", () => {
    const state = makeState({ races: { zebras: { unlocked: true, embassyLevel: 1 } } });
    render(<DiplomacyPanel state={state} />);
    expect(screen.getByTestId("race-zebras-trade25")).toBeTruthy();
  });

  it("dispatches TRADE with amount:5 when ×5 is clicked", () => {
    const state = makeState({ races: { zebras: { unlocked: true, embassyLevel: 1 } } });
    render(<DiplomacyPanel state={state} />);
    fireEvent.click(screen.getByTestId("race-zebras-trade5"));
    expect(mockMutate).toHaveBeenCalledWith({ type: "TRADE", name: "zebras", amount: 5 });
  });

  it("dispatches TRADE with amount:25 when ×25 is clicked", () => {
    const state = makeState({ races: { zebras: { unlocked: true, embassyLevel: 1 } } });
    render(<DiplomacyPanel state={state} />);
    fireEvent.click(screen.getByTestId("race-zebras-trade25"));
    expect(mockMutate).toHaveBeenCalledWith({ type: "TRADE", name: "zebras", amount: 25 });
  });
});
