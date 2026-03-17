# Epic: Calendar & Seasons

**Status:** In Progress
**Started:** 2026-03-17
**Legacy refs:** `legacy/js/calendar.js`

---

## Story 1: CalendarState shape and initial values

**As a** game engine
**I want** a `CalendarState` type with day, season, year, and season constants
**So that** time can be tracked deterministically across ticks

### Acceptance Criteria
- [ ] Given the engine initialises, when `createInitialCalendar()` is called, then state has `day=0`, `season=0`, `year=0`
- [ ] Given `CalendarState`, then it has `day: number`, `season: number` (0–3), `year: number`
- [ ] Given constants, then `TICKS_PER_DAY=10`, `DAYS_PER_SEASON=100`, `SEASONS_PER_YEAR=4`
- [ ] Given season definitions array, then seasons[0].name="spring", seasons[1].name="summer", seasons[2].name="autumn", seasons[3].name="winter"
- [ ] Given season definitions, then each has a `catnipModifier` number

### Legacy Reference
- `legacy/js/calendar.js` lines 1–44 (season definitions), 217–229 (constants)

### Status: [x] Tests | [x] Impl | [x] Rated

---

## Story 2: Day advances each tick

**As a** game engine
**I want** the calendar day to advance by `1/TICKS_PER_DAY` each tick
**So that** 10 ticks = 1 day, 1000 ticks = 1 season

### Acceptance Criteria
- [ ] Given initial state, when 1 tick passes, then `day = 0.10`
- [ ] Given initial state, when 10 ticks pass, then `day = 1.0` (exact, no float drift)
- [ ] Given initial state, when 1000 ticks pass, then `day = 100.0` (integer, exact)
- [ ] Day is rounded to centiday (2 decimal places) each tick to eliminate float drift

### Legacy Reference
- `legacy/js/calendar.js` lines 390–455 (`tick()` method, `_roundToCentiday()`)

### Status: [x] Tests | [x] Impl | [x] Rated

---

## Story 3: Season advancement

**As a** game engine
**I want** seasons to advance when day reaches `DAYS_PER_SEASON`
**So that** the four seasons cycle naturally

### Acceptance Criteria
- [ ] Given day=99.9 (1 tick before season boundary), when 1 tick passes, then `season` increments
- [ ] Given a new season, then `day` resets to `day - DAYS_PER_SEASON` (not zero)
- [ ] Given season=3 (Winter), when a new season begins, then `season=0` (Spring) and `year` increments
- [ ] Given 4000 ticks from initial state, then `year=1` and `season=0`

### Legacy Reference
- `legacy/js/calendar.js` lines 416–433 (season/year wrap logic)

### Status: [x] Tests | [x] Impl | [x] Rated

---

## Story 4: Season catnip modifier via effect cache

**As a** resource manager
**I want** the current season to contribute a `catnipRatio` effect
**So that** catnip production varies by season

### Acceptance Criteria
- [ ] Given Spring (season=0), when `updateEffects()` is called, then `catnipRatio = 0.5`
- [ ] Given Summer (season=1), when `updateEffects()` is called, then `catnipRatio = 0.0`
- [ ] Given Autumn (season=2), when `updateEffects()` is called, then `catnipRatio = 0.0`
- [ ] Given Winter (season=3), when `updateEffects()` is called, then `catnipRatio = -0.75`
- [ ] Given a full tick with Spring season, the effectCache has `catnipRatio = 0.5`

### Legacy Reference
- `legacy/js/calendar.js` lines 1095–1119 (`getWeatherMod()`)
- Season modifiers: spring=1.5, summer=1.0, autumn=1.0, winter=0.25 → ratios: 0.5, 0.0, 0.0, -0.75

### Notes
The legacy `getWeatherMod()` returns the raw multiplier (e.g. 1.5 for spring). In our flat
effect cache model, we translate this to a ratio delta: `modifier - 1.0`. This is combined
with other catnipRatio sources in `calcResourcePerTick`.

### Status: [x] Tests | [x] Impl | [x] Rated

---

## Story 5: CalendarManager integrates with GameState and tick loop

**As a** game engine
**I want** `CalendarManager` registered as a manager
**So that** the calendar advances automatically on every tick

### Acceptance Criteria
- [ ] Given `GameState`, then it has a `calendar: CalendarState` field
- [ ] Given a tick with CalendarManager registered, then `state.calendar.day` advances
- [ ] Given `tick.test.ts` MarkedState interface, then it includes `calendar` field

### Legacy Reference
- `legacy/js/calendar.js` line 314–316 (`update()` called from game loop)

### Status: [x] Tests | [x] Impl | [x] Rated

---

## Story 6: Save / load / reset

**As a** game engine
**I want** CalendarState to serialize and restore correctly
**So that** save games preserve the calendar state

### Acceptance Criteria
- [ ] Given any CalendarState, when `save()` + `load()` round-trip, then state is identical
- [ ] Given `resetState()`, then day=0, season=0, year=0
- [ ] Given missing calendar save data, then defaults to initial state (forward compatibility)

### Legacy Reference
- `legacy/js/calendar.js` lines 1153–1191 (`resetState()`, `save()`, `load()`)

### Status: [x] Tests | [x] Impl | [x] Rated
