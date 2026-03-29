import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TimePanel } from "./TimePanel.js";

const mockMutate = vi.fn();
vi.mock("./useGameAction.js", () => ({
  useGameAction: () => ({ mutate: mockMutate, isPending: false, error: null }),
}));

function makeState(
  time: {
    heat?: number;
    flux?: number;
    cfus?: Record<string, { val: number; on: number; unlocked: boolean; heat: number }>;
    vsus?: Record<string, { val: number; on: number; unlocked: boolean }>;
  },
  resources: Record<string, { value: number }> = {},
) {
  return {
    version: 1,
    tick: 0,
    time: {
      heat: time.heat ?? 0,
      flux: time.flux ?? 0,
      isAccelerated: false,
      cfus: time.cfus ?? {},
      vsus: time.vsus ?? {},
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

describe("TimePanel", () => {
  it("shows loading placeholder when state is null", () => {
    render(<TimePanel state={null} />);
    expect(screen.getByTestId("time-panel-loading")).toBeTruthy();
  });

  it("shows loading placeholder when state is undefined", () => {
    render(<TimePanel state={undefined} />);
    expect(screen.getByTestId("time-panel-loading")).toBeTruthy();
  });

  it("shows not unlocked message when time is empty", () => {
    const state = makeState({});
    render(<TimePanel state={state} />);
    expect(screen.getByTestId("time-panel")).toBeTruthy();
    expect(screen.getByText(/not.*unlocked/i)).toBeTruthy();
  });

  it("shows heat and flux when time has heat", () => {
    const state = makeState({ heat: 42.5, flux: 7.3 });
    render(<TimePanel state={state} />);
    expect(screen.getByText(/42\.5/)).toBeTruthy();
    expect(screen.getByText(/7\.3/)).toBeTruthy();
  });

  it("shows Shatter TC button when time is unlocked", () => {
    const state = makeState({ heat: 1 });
    render(<TimePanel state={state} />);
    const btn = screen.getByRole("button", { name: /shatter/i });
    expect(btn).toBeTruthy();
  });

  it("dispatches SHATTER_TC when button is clicked", () => {
    const state = makeState({ heat: 1 });
    render(<TimePanel state={state} />);
    fireEvent.click(screen.getByRole("button", { name: /shatter/i }));
    expect(mockMutate).toHaveBeenCalledWith({ type: "SHATTER_TC" });
  });

  it("shows unlocked CFUs with Buy button", () => {
    const state = makeState({
      heat: 1,
      cfus: {
        blastFurnace: { val: 0, on: 0, unlocked: true, heat: 0 },
        temporalBattery: { val: 0, on: 0, unlocked: false, heat: 0 },
      },
    });
    render(<TimePanel state={state} />);
    expect(screen.getByTestId("cfu-blastFurnace")).toBeTruthy();
    expect(screen.queryByTestId("cfu-temporalBattery")).toBeNull();
  });

  it("dispatches BUY_CFU when CFU buy is clicked", () => {
    // blastFurnace costs timeCrystal:25, relic:5
    const state = makeState(
      { heat: 1, cfus: { blastFurnace: { val: 0, on: 0, unlocked: true, heat: 0 } } },
      { timeCrystal: { value: 1000 }, relic: { value: 1000 } },
    );
    render(<TimePanel state={state} />);
    const btn = screen.getByTestId("cfu-blastFurnace-buy");
    fireEvent.click(btn);
    expect(mockMutate).toHaveBeenCalledWith({ type: "BUY_CFU", name: "blastFurnace" });
  });

  it("shows unlocked VSUs with Buy button", () => {
    const state = makeState({
      heat: 1,
      vsus: { usedCryochambers: { val: 0, on: 0, unlocked: true } },
    });
    render(<TimePanel state={state} />);
    expect(screen.getByTestId("vsu-usedCryochambers")).toBeTruthy();
  });

  it("dispatches BUY_VSU when VSU buy is clicked", () => {
    const state = makeState(
      { heat: 1, vsus: { usedCryochambers: { val: 0, on: 0, unlocked: true } } },
      { void: { value: 1000 } },
    );
    render(<TimePanel state={state} />);
    const btn = screen.getByTestId("vsu-usedCryochambers-buy");
    fireEvent.click(btn);
    expect(mockMutate).toHaveBeenCalledWith({ type: "BUY_VSU", name: "usedCryochambers" });
  });

  it("renders panel when state has no time key", () => {
    render(<TimePanel state={{} as never} />);
    expect(screen.getByTestId("time-panel")).toBeTruthy();
  });

  it("renders panel when time has no cfus or vsus keys", () => {
    render(<TimePanel state={{ time: { heat: 5, flux: 2 } } as never} />);
    expect(screen.getByTestId("time-panel")).toBeTruthy();
  });

  it("skips null cfu and vsu entries gracefully", () => {
    const state = {
      time: { heat: 1, flux: 0, cfus: { bad: null }, vsus: { bad: null } },
    } as never;
    render(<TimePanel state={state} />);
    expect(screen.getByTestId("time-panel")).toBeTruthy();
  });
});
