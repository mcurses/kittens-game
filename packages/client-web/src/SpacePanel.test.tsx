import { cleanup, fireEvent, render, screen } from "@testing-library/react";
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
  resources: Record<string, { value: number; maxValue?: number }> = {},
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
      Object.entries(resources).map(([k, v]) => [
        k,
        { value: v.value, maxValue: v.maxValue ?? 0, perTick: 0 },
      ]),
    ),
  } as unknown as import("@kittens/api-spec").GameStateResponse;
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  window.localStorage.clear();
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

  it("keeps Launch button and marks it storage-limited when mission cost exceeds current storage", () => {
    const state = makeState(
      { programs: { moonMission: { val: 0, on: 0, unlocked: true } } },
      {
        titanium: { value: 0, maxValue: 4000 },
        oil: { value: 0, maxValue: 50000 },
        science: { value: 0, maxValue: 200000 },
        starchart: { value: 0, maxValue: 1000 },
      },
    );
    render(<SpacePanel state={state} />);
    const btn = screen.getByTestId("program-moonMission-launch");
    expect(btn.textContent).toBe("Launch");
    expect(btn.className).toMatch(/btn--limited/);
    expect(btn.hasAttribute("disabled")).toBe(true);
  });

  it("renders panel when state has no space key", () => {
    render(<SpacePanel state={{} as never} />);
    expect(screen.getByTestId("space-panel")).toBeTruthy();
  });

  it("renders panel when space has no programs or spaceBuildings keys", () => {
    render(<SpacePanel state={{ space: { planets: {} } } as never} />);
    expect(screen.getByTestId("space-panel")).toBeTruthy();
  });

  it("skips null program and spaceBuilding entries gracefully", () => {
    const state = {
      space: { programs: { bad: null }, spaceBuildings: { bad: null } },
    } as never;
    render(<SpacePanel state={state} />);
    expect(screen.getByTestId("space-panel")).toBeTruthy();
  });
});

// ── Epic 32 Story 32-06: Space mission done state + building on/off ────────────

describe("Story 32-06: Space mission done state and building on/off", () => {
  it("shows 'Reached' badge when mission val > 0", () => {
    const state = makeState({
      programs: { moonMission: { val: 1, on: 0, unlocked: true } },
    });
    render(<SpacePanel state={state} />);
    expect(screen.getByText(/reached/i)).toBeTruthy();
  });

  it("hides Launch button when mission val > 0 (already reached)", () => {
    const state = makeState({
      programs: { moonMission: { val: 1, on: 0, unlocked: true } },
    });
    render(<SpacePanel state={state} />);
    expect(screen.queryByTestId("program-moonMission-launch")).toBeNull();
  });

  it("still shows Launch button when mission val === 0 (not yet reached)", () => {
    const state = makeState({
      programs: { moonMission: { val: 0, on: 0, unlocked: true } },
    });
    render(<SpacePanel state={state} />);
    expect(screen.getByTestId("program-moonMission-launch")).toBeTruthy();
  });

  it("shows on/val for space building when on < val", () => {
    const state = makeState({
      spaceBuildings: { moonBase: { val: 12, on: 9, unlocked: true } },
    });
    render(<SpacePanel state={state} />);
    expect(screen.getByText(/9\/12|9 \/ 12/)).toBeTruthy();
  });

  it("shows just val when space building on === val", () => {
    const state = makeState({
      spaceBuildings: { moonBase: { val: 5, on: 5, unlocked: true } },
    });
    render(<SpacePanel state={state} />);
    const countEl = screen.getByTestId("sb-moonBase").querySelector(".item-count");
    expect(countEl?.textContent).toBe("5");
  });
});

describe("Story 35-03: Space hide-complete toggle", () => {
  it("restores hide-complete from localStorage on reload", () => {
    window.localStorage.setItem("space:hideComplete", "true");
    const state = makeState({
      programs: {
        moonMission: { val: 1, on: 0, unlocked: true },
        duneMission: { val: 0, on: 0, unlocked: true },
      },
    });
    render(<SpacePanel state={state} />);
    expect(screen.getByTestId("space-hide-complete")).toBeTruthy();
    expect((screen.getByTestId("space-hide-complete") as HTMLInputElement).checked).toBe(true);
    expect(screen.queryByTestId("program-moonMission")).toBeNull();
    expect(screen.getByTestId("program-duneMission")).toBeTruthy();
  });
});
