import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SciencePanel } from "./SciencePanel.js";

const mockMutate = vi.fn();
vi.mock("./useGameAction.js", () => ({
  useGameAction: () => ({ mutate: mockMutate, isPending: false, error: null }),
}));

function makeState(
  techs: Record<string, { unlocked: boolean; researched: boolean }>,
) {
  return {
    version: 1,
    tick: 0,
    science: { techs, policies: {} },
  } as unknown as import("@kittens/api-spec").GameStateResponse;
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("SciencePanel", () => {
  it("shows loading placeholder when state is null", () => {
    render(<SciencePanel state={null} />);
    expect(screen.getByTestId("science-panel-loading")).toBeTruthy();
  });

  it("shows loading placeholder when state is undefined", () => {
    render(<SciencePanel state={undefined} />);
    expect(screen.getByTestId("science-panel-loading")).toBeTruthy();
  });

  it("shows no techs message when science is empty", () => {
    render(<SciencePanel state={makeState({})} />);
    expect(screen.getByText("No technologies available.")).toBeTruthy();
  });

  it("hides techs that are not unlocked", () => {
    const state = makeState({
      agriculture: { unlocked: false, researched: false },
      archery: { unlocked: true, researched: false },
    });
    render(<SciencePanel state={state} />);
    expect(screen.queryByTestId("tech-agriculture")).toBeNull();
    expect(screen.getByTestId("tech-archery")).toBeTruthy();
  });

  it("shows unlocked unresearched tech with Research button", () => {
    const state = makeState({ agriculture: { unlocked: true, researched: false } });
    render(<SciencePanel state={state} />);
    expect(screen.getByTestId("tech-agriculture")).toBeTruthy();
    expect(screen.getByRole("button", { name: /research/i })).toBeTruthy();
  });

  it("shows researched tech as Done (no button)", () => {
    const state = makeState({ agriculture: { unlocked: true, researched: true } });
    render(<SciencePanel state={state} />);
    expect(screen.getByTestId("tech-agriculture")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /research/i })).toBeNull();
    expect(screen.getByText(/done/i)).toBeTruthy();
  });

  it("dispatches RESEARCH action when Research is clicked", () => {
    const state = makeState({ archery: { unlocked: true, researched: false } });
    render(<SciencePanel state={state} />);
    fireEvent.click(screen.getByRole("button", { name: /research/i }));
    expect(mockMutate).toHaveBeenCalledWith({ type: "RESEARCH", name: "archery" });
  });

  it("renders multiple unlocked techs", () => {
    const state = makeState({
      agriculture: { unlocked: true, researched: false },
      archery: { unlocked: true, researched: true },
      calendar: { unlocked: false, researched: false },
    });
    render(<SciencePanel state={state} />);
    expect(screen.getByTestId("tech-agriculture")).toBeTruthy();
    expect(screen.getByTestId("tech-archery")).toBeTruthy();
    expect(screen.queryByTestId("tech-calendar")).toBeNull();
  });
});
