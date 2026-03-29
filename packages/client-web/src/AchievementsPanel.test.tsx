import { cleanup, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AchievementsPanel } from "./AchievementsPanel.js";

vi.mock("./useGameAction.js", () => ({
  useGameAction: () => ({ mutate: vi.fn(), isPending: false }),
}));

afterEach(cleanup);

describe("AchievementsPanel", () => {
  it("shows loading when state is null", () => {
    render(<AchievementsPanel state={null} />);
    expect(screen.getByTestId("achievements-panel-loading")).toBeDefined();
  });

  it("shows achievements panel when state provided", () => {
    render(<AchievementsPanel state={{} as never} />);
    expect(screen.getByTestId("achievements-panel")).toBeDefined();
  });

  it("shows unlocked achievements", () => {
    const state = {
      achievements: {
        achievements: [
          { name: "kittenKing", unlocked: true, starUnlocked: false },
          { name: "newKitten", unlocked: false, starUnlocked: false },
        ],
        badges: [],
        badgesUnlocked: false,
      },
    };
    render(<AchievementsPanel state={state as never} />);
    expect(screen.getByTestId("achievement-kittenKing")).toBeDefined();
    expect(screen.queryByTestId("achievement-newKitten")).toBeNull();
  });

  it("shows badge count", () => {
    const state = {
      achievements: {
        achievements: [],
        badges: [{ name: "badge1", unlocked: true }],
        badgesUnlocked: true,
      },
    };
    render(<AchievementsPanel state={state as never} />);
    expect(screen.getByText(/Badges \(1\)/i)).toBeDefined();
  });

  it("shows empty message when no achievements unlocked", () => {
    const state = {
      achievements: {
        achievements: [{ name: "a", unlocked: false, starUnlocked: false }],
        badges: [],
        badgesUnlocked: false,
      },
    };
    render(<AchievementsPanel state={state as never} />);
    expect(screen.getByText(/no achievements/i)).toBeDefined();
  });

  it("shows star badge for star-unlocked achievements", () => {
    const state = {
      achievements: {
        achievements: [{ name: "legend", unlocked: true, starUnlocked: true }],
        badges: [],
        badgesUnlocked: false,
      },
    };
    render(<AchievementsPanel state={state as never} />);
    const el = screen.getByTestId("achievement-legend");
    expect(el.textContent).toContain("★");
  });
});
