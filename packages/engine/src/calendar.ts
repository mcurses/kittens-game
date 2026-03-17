import type { Serializable } from "@kittens/shared";
import type { Manager } from "./manager.js";
import type { GameState } from "./state.js";

// ── Constants ─────────────────────────────────────────────────────────────────

/** Number of game ticks per in-game day. Legacy: calendar.ticksPerDay = 10 */
export const TICKS_PER_DAY = 10;

/** Number of in-game days per season. Legacy: calendar.daysPerSeason = 100 */
export const DAYS_PER_SEASON = 100;

/** Number of seasons per year. Legacy: calendar.seasonsPerYear = seasons.length = 4 */
export const SEASONS_PER_YEAR = 4;

// ── Season definitions ────────────────────────────────────────────────────────

export interface SeasonDef {
  readonly name: string;
  /**
   * Catnip production multiplier for this season.
   * Legacy: seasons[n].modifiers.catnip
   */
  readonly catnipModifier: number;
}

/**
 * The four seasons, in order (indices 0–3).
 * Port of `legacy/js/calendar.js` seasons array.
 */
export const SEASON_DEFS: readonly SeasonDef[] = [
  { name: "spring", catnipModifier: 1.5 },
  { name: "summer", catnipModifier: 1.0 },
  { name: "autumn", catnipModifier: 1.0 },
  { name: "winter", catnipModifier: 0.25 },
];

// ── State type ────────────────────────────────────────────────────────────────

export interface CalendarState {
  /** Fractional day within the current season (0 ≤ day < DAYS_PER_SEASON). */
  readonly day: number;
  /** Current season index (0=Spring, 1=Summer, 2=Autumn, 3=Winter). */
  readonly season: number;
  /** Current in-game year (starts at 0). */
  readonly year: number;
}

// ── Factory ───────────────────────────────────────────────────────────────────

export function createInitialCalendar(): CalendarState {
  return { day: 0, season: 0, year: 0 };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Round to centiday (2 decimal places) to minimize floating-point drift. */
function roundToCentiday(day: number): number {
  return Math.round(day * 100) / 100;
}

// ── CalendarManager ───────────────────────────────────────────────────────────

/**
 * Manages the in-game calendar: advances day each tick, wraps season/year.
 * Port of `legacy/js/calendar.js` Calendar class.
 */
export class CalendarManager implements Manager {
  update(state: GameState): GameState {
    const cal = state.calendar;
    const prevIntDay = Math.floor(cal.day);

    // Advance day by 1/TICKS_PER_DAY, then round to centiday
    let newDay = roundToCentiday(cal.day + 1 / TICKS_PER_DAY);
    let newSeason = cal.season;
    let newYear = cal.year;

    // Only process day/season/year events when the integer day changes
    if (Math.floor(newDay) !== prevIntDay) {
      if (newDay >= DAYS_PER_SEASON) {
        newDay = roundToCentiday(newDay - DAYS_PER_SEASON);
        newSeason = cal.season + 1;

        if (newSeason >= SEASONS_PER_YEAR) {
          newSeason = 0;
          newYear = cal.year + 1;
        }
      }
    }

    return {
      ...state,
      calendar: { day: newDay, season: newSeason, year: newYear },
    };
  }

  /**
   * Contribute a `catnipRatio` effect based on the current season.
   *
   * The legacy `getWeatherMod()` returns the raw multiplier (e.g. 1.5 for spring).
   * We translate to a ratio delta: `modifier - 1.0`, so it integrates correctly with
   * `calcResourcePerTick`: `base * (1 + ratio)`.
   *
   * Spring: 1.5 → +0.5, Summer: 1.0 → 0.0, Autumn: 1.0 → 0.0, Winter: 0.25 → -0.75
   */
  updateEffects(state: GameState): Record<string, number> {
    const def = SEASON_DEFS[state.calendar.season];
    const modifier = def?.catnipModifier ?? 1.0;
    return { catnipRatio: modifier - 1.0 };
  }

  save(state: GameState): Serializable {
    return state.calendar as unknown as Serializable;
  }

  load(saved: Serializable, state: GameState): GameState {
    if (!saved || typeof saved !== "object" || Array.isArray(saved)) {
      return { ...state, calendar: createInitialCalendar() };
    }
    const raw = saved as Record<string, unknown>;
    const day = typeof raw.day === "number" ? raw.day : 0;
    const season = typeof raw.season === "number" ? raw.season : 0;
    const year = typeof raw.year === "number" ? raw.year : 0;
    return { ...state, calendar: { day, season, year } };
  }

  resetState(state: GameState): GameState {
    return { ...state, calendar: createInitialCalendar() };
  }
}
