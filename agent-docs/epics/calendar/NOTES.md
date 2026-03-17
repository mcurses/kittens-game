# Epic: calendar — Notes

## Legacy Behavior Summary

Legacy file: `legacy/js/calendar.js`

### Constants
- `ticksPerDay = 10` — each game tick advances the day by `1/ticksPerDay`
- `daysPerSeason = 100` — a season lasts 100 days
- `seasonsPerYear = 4` (derived from `seasons.length`)
- Tick formula: `day += (1 + timeAccelerationRatio) / ticksPerDay`
  - For our engine (no time acceleration): `day += 1/10 = 0.1` per tick
  - After 10 ticks = 1 day; after 1000 ticks = 1 season; after 4000 ticks = 1 year

### Season indices
- 0 = Spring, catnipModifier = 1.5
- 1 = Summer, catnipModifier = 1.0
- 2 = Autumn, catnipModifier = 1.0
- 3 = Winter, catnipModifier = 0.25

### Weather (deferred)
- Each new season rolls warm/cold/neutral weather (affects catnip ±0.15)
- Not implementing weather in this epic; store as `null` for now

### Day advancement logic (from `tick()`)
1. `day += 1/ticksPerDay` per tick (simplified: no time acceleration yet)
2. Round to centiday to minimize floating-point error
3. If `Math.floor(day)` didn't change → return (no day event)
4. If `day >= daysPerSeason`: subtract daysPerSeason, increment season, set newSeason=true
5. If `season >= seasonsPerYear`: reset season=0, increment year, set newYear=true
6. Fire `onNewDay()` → `onNewSeason()` → `onNewYear()` (in our engine: these are state transforms)

### Effect output
- `getWeatherMod()` returns the season's catnip modifier (simplified, no weather)
- This feeds into catnip production as a multiplier on the `catnipRatio` effect
- Legacy uses it in `resPool.update()` as a ratio modifier
- In our engine: CalendarManager.updateEffects() should output `"catnipRatio"` contribution from season

### How season modifier integrates with catnip production
- Legacy `getWeatherMod("catnip")` returns e.g. 1.5 for spring
- This is applied as: `catnipPerTick = base * weatherMod * (1 + otherRatios)`
- In our flat effect cache model: output `"catnipRatio"` = `(modifier - 1.0)` so it adds to the ratio
  - Spring: +0.5, Summer: 0.0, Autumn: 0.0, Winter: -0.75
  - This correctly uses the existing `calcResourcePerTick` formula: `base * (1 + ratio)`

### Save/load
- Saves: year, day, season, weather, festivalDays, cycle, cycleYear, futureSeasonTemporalParadox, cryptoPrice
- We save: year, day, season (weather/festivalDays/cycle/cycleYear for future epics)

### Deferred (not Epic 07)
- Weather (warm/cold) — requires challenge system
- Festival days — requires workshop
- Cycles — requires space
- Astronomical events / observe button — requires science/workshop
- Temporal paradox — requires time mechanics
- Crypto price — requires science antimatter

## Key Decisions

1. `CalendarState` is a new top-level field on `GameState`
2. Day advances as a float; season/year increment when integer day crosses daysPerSeason
3. Season modifier integrates into effect cache as `catnipRatio` delta
4. Float rounding: round to 2 decimal places (centiday) each tick to minimize drift
5. `ticksPerDay = 10`, `daysPerSeason = 100` — constants in calendar.ts

## Gotchas & Edge Cases

- Floating point: 0.1 cannot be represented exactly in binary; must round to centiday
- Day is a float but season/year are integers — only floor(day) crossing a boundary triggers events
- After 10 ticks the day should read 1.0 (not 0.9999...)
- Season wraps at 4 (not 3)
- Year increments only when season wraps (not at every daysPerSeason crossing)

## Open Questions

- Should weather be stubbed as `null` in this epic? YES — defer to challenges epic
- Does CalendarManager need to be a registered manager in tick.ts? YES
