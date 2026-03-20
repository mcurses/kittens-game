// CalendarDisplay — shows current season, year, and day
import type { GameStateResponse } from "@kittens/api-spec";
import React from "react";

const SEASON_NAMES = ["Spring", "Summer", "Autumn", "Winter"] as const;

interface Props {
  state: GameStateResponse | null | undefined;
}

export function CalendarDisplay({ state }: Props): React.ReactElement {
  if (!state) {
    return <div data-testid="calendar-loading">Loading calendar...</div>;
  }

  const raw = state as unknown as Record<string, unknown>;
  const cal = raw.calendar as Record<string, unknown> | undefined;
  const season = typeof cal?.season === "number" ? cal.season : 0;
  const year = typeof cal?.year === "number" ? cal.year : 0;
  const day = typeof cal?.day === "number" ? cal.day : 0;
  const seasonName = SEASON_NAMES[season] ?? "Spring";

  return (
    <div data-testid="calendar-display">
      <span className="calendar-season">{seasonName}</span>
      {", Year "}
      <span className="calendar-year">{year}</span>
      {", Day "}
      <span className="calendar-day">{Math.floor(day)}</span>
    </div>
  );
}
