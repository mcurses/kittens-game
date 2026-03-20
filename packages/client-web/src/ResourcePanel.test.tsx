import { cleanup, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { ResourcePanel } from "./ResourcePanel.js";

// Minimal mock state with resources
function makeState(
  resources: Record<
    string,
    { value: number; maxValue?: number; perTick?: number }
  >,
) {
  return {
    version: 1,
    tick: 0,
    resources,
  } as unknown as import("@kittens/api-spec").GameStateResponse;
}

afterEach(() => {
  cleanup();
});

describe("ResourcePanel", () => {
  it("shows loading placeholder when state is null", () => {
    render(<ResourcePanel state={null} />);
    expect(screen.getByTestId("resource-panel-loading")).toBeTruthy();
    expect(screen.getByText("Loading resources...")).toBeTruthy();
  });

  it("shows loading placeholder when state is undefined", () => {
    render(<ResourcePanel state={undefined} />);
    expect(screen.getByTestId("resource-panel-loading")).toBeTruthy();
  });

  it("renders resource name and value", () => {
    const state = makeState({ catnip: { value: 42.5, maxValue: 5000 } });
    render(<ResourcePanel state={state} />);
    expect(screen.getByTestId("resource-catnip")).toBeTruthy();
    expect(screen.getByText(/catnip/)).toBeTruthy();
    expect(screen.getByText(/42\.50/)).toBeTruthy();
  });

  it("shows max value when present", () => {
    const state = makeState({ catnip: { value: 10, maxValue: 5000 } });
    render(<ResourcePanel state={state} />);
    expect(screen.getByText(/5000/)).toBeTruthy();
  });

  it("shows positive perTick rate", () => {
    const state = makeState({ catnip: { value: 10, perTick: 1.234 } });
    render(<ResourcePanel state={state} />);
    expect(screen.getByText(/\+1\.234\/tick/)).toBeTruthy();
  });

  it("shows negative perTick rate", () => {
    const state = makeState({ catnip: { value: 10, perTick: -0.5 } });
    render(<ResourcePanel state={state} />);
    expect(screen.getByText(/-0\.500\/tick/)).toBeTruthy();
  });

  it("does not show rate when perTick is 0", () => {
    const state = makeState({ catnip: { value: 10, perTick: 0 } });
    render(<ResourcePanel state={state} />);
    expect(screen.queryByText(/\/tick/)).toBeNull();
  });

  it("shows no resources message when resources object is empty", () => {
    const state = makeState({});
    render(<ResourcePanel state={state} />);
    expect(screen.getByText("No resources yet.")).toBeTruthy();
  });

  it("renders multiple resources", () => {
    const state = makeState({
      catnip: { value: 10, perTick: 1 },
      wood: { value: 50, perTick: 0.5 },
    });
    render(<ResourcePanel state={state} />);
    expect(screen.getByTestId("resource-catnip")).toBeTruthy();
    expect(screen.getByTestId("resource-wood")).toBeTruthy();
  });

  // Story 20-1: Resource filtering
  it("hides resources with value 0", () => {
    const state = makeState({
      catnip: { value: 0, perTick: 0.5 },
      wood: { value: 50 },
    });
    render(<ResourcePanel state={state} />);
    expect(screen.queryByTestId("resource-catnip")).toBeNull();
    expect(screen.getByTestId("resource-wood")).toBeTruthy();
  });

  it("shows no resources message when all resources have value 0", () => {
    const state = makeState({
      catnip: { value: 0 },
      wood: { value: 0 },
    });
    render(<ResourcePanel state={state} />);
    expect(screen.getByText("No resources yet.")).toBeTruthy();
    expect(screen.queryByTestId("resource-catnip")).toBeNull();
    expect(screen.queryByTestId("resource-wood")).toBeNull();
  });

  it("shows resources with positive value and hides those with 0", () => {
    const state = makeState({
      catnip: { value: 100 },
      wood: { value: 0 },
      minerals: { value: 0.01 },
    });
    render(<ResourcePanel state={state} />);
    expect(screen.getByTestId("resource-catnip")).toBeTruthy();
    expect(screen.queryByTestId("resource-wood")).toBeNull();
    expect(screen.getByTestId("resource-minerals")).toBeTruthy();
  });
});
