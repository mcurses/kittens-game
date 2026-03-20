import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { JobsPanel } from "./JobsPanel.js";

const mockMutate = vi.fn();
vi.mock("./useGameAction.js", () => ({
  useGameAction: () => ({ mutate: mockMutate, isPending: false, error: null }),
}));

function makeState(
  jobs: Record<string, { value: number }>,
  kittens = 5,
) {
  return {
    version: 1,
    tick: 0,
    village: { kittens, jobs },
  } as unknown as import("@kittens/api-spec").GameStateResponse;
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("JobsPanel", () => {
  it("shows loading placeholder when state is null", () => {
    render(<JobsPanel state={null} />);
    expect(screen.getByTestId("jobs-panel-loading")).toBeTruthy();
  });

  it("shows loading placeholder when state is undefined", () => {
    render(<JobsPanel state={undefined} />);
    expect(screen.getByTestId("jobs-panel-loading")).toBeTruthy();
  });

  it("shows no jobs message when jobs object is empty", () => {
    render(<JobsPanel state={makeState({})} />);
    expect(screen.getByText("No jobs available.")).toBeTruthy();
  });

  it("renders job name and assigned count", () => {
    const state = makeState({ farmer: { value: 3 } });
    render(<JobsPanel state={state} />);
    expect(screen.getByTestId("job-farmer")).toBeTruthy();
    expect(screen.getByText(/farmer/)).toBeTruthy();
    expect(screen.getByText(/3/)).toBeTruthy();
  });

  it("dispatches ASSIGN_JOB when + is clicked", () => {
    const state = makeState({ farmer: { value: 1 } });
    render(<JobsPanel state={state} />);
    fireEvent.click(screen.getByTestId("job-farmer-assign"));
    expect(mockMutate).toHaveBeenCalledWith({ type: "ASSIGN_JOB", job: "farmer" });
  });

  it("dispatches UNASSIGN_JOB when - is clicked", () => {
    const state = makeState({ farmer: { value: 2 } });
    render(<JobsPanel state={state} />);
    fireEvent.click(screen.getByTestId("job-farmer-unassign"));
    expect(mockMutate).toHaveBeenCalledWith({ type: "UNASSIGN_JOB", job: "farmer" });
  });

  it("renders multiple jobs", () => {
    const state = makeState({ farmer: { value: 2 }, scholar: { value: 1 } });
    render(<JobsPanel state={state} />);
    expect(screen.getByTestId("job-farmer")).toBeTruthy();
    expect(screen.getByTestId("job-scholar")).toBeTruthy();
  });
});
