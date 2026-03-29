import { cleanup, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it } from "vitest";
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
});
