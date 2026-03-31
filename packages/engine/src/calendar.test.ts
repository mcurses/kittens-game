import { describe, expect, it } from "vitest";
import {
  CalendarManager,
  DAYS_PER_SEASON,
  SEASONS_PER_YEAR,
  SEASON_DEFS,
  TICKS_PER_DAY,
  createInitialCalendar,
} from "./calendar.js";
import { createInitialState } from "./state.js";
import { tick } from "./tick.js";

// ── Story 1: CalendarState shape and initial values ───────────────────────────

describe("CalendarState initial values", () => {
  it("createInitialCalendar returns day=0, season=0, year=0", () => {
    const cal = createInitialCalendar();
    expect(cal.day).toBe(0);
    expect(cal.season).toBe(0);
    expect(cal.year).toBe(0);
  });

  it("TICKS_PER_DAY is 10", () => {
    expect(TICKS_PER_DAY).toBe(10);
  });

  it("DAYS_PER_SEASON is 100", () => {
    expect(DAYS_PER_SEASON).toBe(100);
  });

  it("SEASONS_PER_YEAR is 4", () => {
    expect(SEASONS_PER_YEAR).toBe(4);
  });

  it("SEASON_DEFS has 4 entries with correct names", () => {
    expect(SEASON_DEFS).toHaveLength(4);
    const names = SEASON_DEFS.map((d) => d.name);
    expect(names).toEqual(["spring", "summer", "autumn", "winter"]);
  });

  it("each SEASON_DEF has a catnipModifier number", () => {
    for (const def of SEASON_DEFS) {
      expect(typeof def.catnipModifier).toBe("number");
    }
  });
});

// ── Story 2: Day advances each tick ──────────────────────────────────────────

describe("day advancement", () => {
  it("after 1 tick day = 0.10", () => {
    const mgr = new CalendarManager();
    const s0 = { ...createInitialState(), calendar: createInitialCalendar() };
    const s1 = mgr.update(s0);
    expect(s1.calendar.day).toBe(0.1);
  });

  it("after 10 ticks day = 1.0 (no float drift)", () => {
    const mgr = new CalendarManager();
    let state = { ...createInitialState(), calendar: createInitialCalendar() };
    for (let i = 0; i < 10; i++) {
      state = mgr.update(state);
    }
    expect(state.calendar.day).toBe(1.0);
  });

  it("after 1000 ticks day = 100.0 would wrap — each 10 ticks advances 1 day", () => {
    const mgr = new CalendarManager();
    // After 10 ticks = 1 day, after 990 more ticks = 99 days (stays in same season since
    // at tick 1000 exactly we cross into the next season, so day resets)
    // Let's verify: 999 ticks → 9 ticks short of season boundary
    // day after 999 ticks: starts at 0, adds 0.1 each tick
    // but season wraps at day 100 so let's just check at 950 ticks (day=95)
    let state = { ...createInitialState(), calendar: createInitialCalendar() };
    for (let i = 0; i < 950; i++) {
      state = mgr.update(state);
    }
    // 950 ticks / 10 ticks per day = 95 days, still in season 0
    expect(state.calendar.day).toBe(95.0);
    expect(state.calendar.season).toBe(0);
  });

  it("day is rounded to 2 decimal places (centiday)", () => {
    const mgr = new CalendarManager();
    // After 3 ticks: 0.3 (exact in decimal but tricky in binary)
    let state = { ...createInitialState(), calendar: createInitialCalendar() };
    for (let i = 0; i < 3; i++) {
      state = mgr.update(state);
    }
    expect(state.calendar.day).toBe(0.3);
  });
});

// ── Story 3: Season advancement ───────────────────────────────────────────────

describe("season advancement", () => {
  it("season increments when day reaches DAYS_PER_SEASON (1000 ticks)", () => {
    const mgr = new CalendarManager();
    let state = { ...createInitialState(), calendar: createInitialCalendar() };
    for (let i = 0; i < 1000; i++) {
      state = mgr.update(state);
    }
    expect(state.calendar.season).toBe(1);
    expect(state.calendar.day).toBe(0.0);
  });

  it("day resets to day - DAYS_PER_SEASON (not zero) when season advances", () => {
    // Start at day=99.9 (one tick before boundary)
    const mgr = new CalendarManager();
    const s0 = {
      ...createInitialState(),
      calendar: { day: 99.9, season: 0, year: 0, festivalDays: 0 },
    };
    const s1 = mgr.update(s0);
    // 99.9 + 0.1 = 100.0 → season increments, day = 100.0 - 100 = 0.0
    expect(s1.calendar.season).toBe(1);
    expect(s1.calendar.day).toBe(0.0);
  });

  it("after 4000 ticks year=1 and season=0", () => {
    const mgr = new CalendarManager();
    let state = { ...createInitialState(), calendar: createInitialCalendar() };
    for (let i = 0; i < 4000; i++) {
      state = mgr.update(state);
    }
    expect(state.calendar.year).toBe(1);
    expect(state.calendar.season).toBe(0);
  });

  it("winter (season=3) wraps to spring (season=0) and increments year", () => {
    const mgr = new CalendarManager();
    // Place at last tick of winter
    const s0 = {
      ...createInitialState(),
      calendar: { day: 99.9, season: 3, year: 0, festivalDays: 0 },
    };
    const s1 = mgr.update(s0);
    expect(s1.calendar.season).toBe(0);
    expect(s1.calendar.year).toBe(1);
  });

  it("partial ticks do not advance season prematurely", () => {
    const mgr = new CalendarManager();
    let state = { ...createInitialState(), calendar: createInitialCalendar() };
    // 999 ticks = 99.9 days — still in season 0
    for (let i = 0; i < 999; i++) {
      state = mgr.update(state);
    }
    expect(state.calendar.season).toBe(0);
    expect(state.calendar.day).toBe(99.9);
  });
});

// ── Story 4: Season catnip modifier via effect cache ─────────────────────────

describe("CalendarManager.updateEffects — season catnip modifier", () => {
  it("Spring (season=0) contributes catnipRatio = 0.5", () => {
    const mgr = new CalendarManager();
    const state = { ...createInitialState(), calendar: { day: 0, season: 0, year: 0, festivalDays: 0 } };
    const effects = mgr.updateEffects(state);
    expect(effects.catnipRatio).toBeCloseTo(0.5);
  });

  it("Summer (season=1) contributes catnipRatio = 0.0", () => {
    const mgr = new CalendarManager();
    const state = { ...createInitialState(), calendar: { day: 0, season: 1, year: 0, festivalDays: 0 } };
    const effects = mgr.updateEffects(state);
    expect(effects.catnipRatio).toBeCloseTo(0.0);
  });

  it("Autumn (season=2) contributes catnipRatio = 0.0", () => {
    const mgr = new CalendarManager();
    const state = { ...createInitialState(), calendar: { day: 0, season: 2, year: 0, festivalDays: 0 } };
    const effects = mgr.updateEffects(state);
    expect(effects.catnipRatio).toBeCloseTo(0.0);
  });

  it("Winter (season=3) contributes catnipRatio = -0.75", () => {
    const mgr = new CalendarManager();
    const state = { ...createInitialState(), calendar: { day: 0, season: 3, year: 0, festivalDays: 0 } };
    const effects = mgr.updateEffects(state);
    expect(effects.catnipRatio).toBeCloseTo(-0.75);
  });

  it("out-of-bounds season index falls back to catnipRatio = 0.0", () => {
    const mgr = new CalendarManager();
    const state = { ...createInitialState(), calendar: { day: 0, season: 99, year: 0, festivalDays: 0 } };
    const effects = mgr.updateEffects(state);
    expect(effects.catnipRatio).toBeCloseTo(0.0);
  });

  it("effectCache has catnipRatio=0.5 after full tick in Spring", () => {
    const mgr = new CalendarManager();
    const s0 = { ...createInitialState(), calendar: createInitialCalendar() };
    const result = tick(s0, [mgr]);
    expect(result.effectCache.catnipRatio).toBeCloseTo(0.5);
  });
});

// ── Story 5: Integration with GameState and tick loop ────────────────────────

describe("GameState.calendar field", () => {
  it("createInitialState includes calendar field", () => {
    const s = createInitialState();
    expect(s.calendar).toBeDefined();
    expect(s.calendar.day).toBe(0);
    expect(s.calendar.season).toBe(0);
    expect(s.calendar.year).toBe(0);
  });

  it("CalendarManager.update does not mutate input state", () => {
    const mgr = new CalendarManager();
    const s0 = { ...createInitialState(), calendar: createInitialCalendar() };
    mgr.update(s0);
    expect(s0.calendar.day).toBe(0);
  });
});

// ── Story 6: Save / load / reset ─────────────────────────────────────────────

describe("CalendarManager save/load/reset", () => {
  it("save returns the calendar state", () => {
    const mgr = new CalendarManager();
    const state = {
      ...createInitialState(),
      calendar: { day: 42.5, season: 2, year: 7, festivalDays: 0 },
    };
    const saved = mgr.save(state);
    expect(saved).toEqual({ day: 42.5, season: 2, year: 7, festivalDays: 0 });
  });

  it("load restores calendar from save data", () => {
    const mgr = new CalendarManager();
    const saved = { day: 42.5, season: 2, year: 7, festivalDays: 0 };
    const baseState = { ...createInitialState(), calendar: createInitialCalendar() };
    const restored = mgr.load(saved, baseState);
    expect(restored.calendar.day).toBe(42.5);
    expect(restored.calendar.season).toBe(2);
    expect(restored.calendar.year).toBe(7);
  });

  it("load with missing data defaults to initial calendar", () => {
    const mgr = new CalendarManager();
    const baseState = { ...createInitialState(), calendar: createInitialCalendar() };
    const restored = mgr.load(null, baseState);
    expect(restored.calendar).toEqual(createInitialCalendar());
  });

  it("load with non-number fields defaults each to 0", () => {
    const mgr = new CalendarManager();
    const baseState = { ...createInitialState(), calendar: createInitialCalendar() };
    // Pass an object with invalid (non-number) field values
    const restored = mgr.load(
      { day: "bad", season: null, year: undefined, festivalDays: 0 } as unknown as Parameters<typeof mgr.load>[0],
      baseState,
    );
    expect(restored.calendar.day).toBe(0);
    expect(restored.calendar.season).toBe(0);
    expect(restored.calendar.year).toBe(0);
  });

  it("resetState returns day=0, season=0, year=0", () => {
    const mgr = new CalendarManager();
    const state = {
      ...createInitialState(),
      calendar: { day: 42.5, season: 2, year: 7, festivalDays: 0 },
    };
    const reset = mgr.resetState(state);
    expect(reset.calendar).toEqual(createInitialCalendar());
  });
});
