import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { CalendarDisplay } from "./CalendarDisplay.js";

function makeState(calendar: { day: number; season: number; year: number }) {
  return {
    version: 1,
    tick: 0,
    calendar,
  } as unknown as import("@kittens/api-spec").GameStateResponse;
}

afterEach(() => {
  cleanup();
});

describe("CalendarDisplay", () => {
  it("shows loading placeholder when state is null", () => {
    render(<CalendarDisplay state={null} />);
    expect(screen.getByTestId("calendar-loading")).toBeTruthy();
  });

  it("shows loading placeholder when state is undefined", () => {
    render(<CalendarDisplay state={undefined} />);
    expect(screen.getByTestId("calendar-loading")).toBeTruthy();
  });

  it("renders season name for season 0 as Spring", () => {
    render(<CalendarDisplay state={makeState({ day: 5, season: 0, year: 1 })} />);
    expect(screen.getByText(/spring/i)).toBeTruthy();
  });

  it("renders season name for season 1 as Summer", () => {
    render(<CalendarDisplay state={makeState({ day: 0, season: 1, year: 2 })} />);
    expect(screen.getByText(/summer/i)).toBeTruthy();
  });

  it("renders season name for season 2 as Autumn", () => {
    render(<CalendarDisplay state={makeState({ day: 0, season: 2, year: 3 })} />);
    expect(screen.getByText(/autumn/i)).toBeTruthy();
  });

  it("renders season name for season 3 as Winter", () => {
    render(<CalendarDisplay state={makeState({ day: 0, season: 3, year: 4 })} />);
    expect(screen.getByText(/winter/i)).toBeTruthy();
  });

  it("renders the year number", () => {
    render(<CalendarDisplay state={makeState({ day: 10, season: 0, year: 42 })} />);
    expect(screen.getByText(/42/)).toBeTruthy();
  });

  it("renders the day number", () => {
    render(<CalendarDisplay state={makeState({ day: 73, season: 0, year: 1 })} />);
    expect(screen.getByText(/73/)).toBeTruthy();
  });

  it("renders all calendar parts together", () => {
    render(<CalendarDisplay state={makeState({ day: 15, season: 2, year: 7 })} />);
    const el = screen.getByTestId("calendar-display");
    expect(el.textContent).toMatch(/autumn/i);
    expect(el.textContent).toMatch(/7/);
    expect(el.textContent).toMatch(/15/);
  });
});
