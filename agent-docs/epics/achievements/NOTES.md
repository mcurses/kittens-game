# Epic: 16 Achievements — Notes

## Legacy Behavior Summary

### achievements.js overview (838 lines)

The `classes.managers.Achievements` class manages two parallel collections:

**Achievements** (~30 items, lines 5–259):
- Each has: `name`, `title`, `description`, `condition()` (optional), optional `starCondition()`, optional `hidden`, optional `unethical`
- `update()` iterates all achievements each tick; if `!ach.unlocked && ach.condition.call(this)` → set `unlocked = true`
- If `!ach.starUnlocked && ach.starCondition.call(this)` → set `starUnlocked = true`
- Achievements are passive — unlocked by the game tick, no player action required

**Badges** (~20 items, lines 261–411):
- Similar structure: `name`, `title`, `description`, `difficulty`, optional `condition()`
- `badgesUnlocked` flag set to `true` when any badge unlocks
- Some badges have no `condition` (manually unlocked externally, e.g. `ivoryTower`, `ghostInTheMachine`)

### Achievement List (30 items)

| Name | Condition |
|------|-----------|
| theElderLegacy | date is January 2017 (time-locked, always false now) |
| unicornConspiracy | unicorns resource > 0 |
| uniception | tears resource > 0 |
| sinsOfEmpire | alicorn resource > 0 |
| anachronox | timeCrystal resource > 0 |
| deadSpace | necrocorn resource > 0 |
| sadnessAbyss | sorrow resource >= 100 |
| ironWill | ironWill flag && kittens=0 && mine.val > 0 |
| uberkatzhen | ironWill && kittens=0 && warehouse.val > 0 |
| hundredYearsSolitude | ironWill && kittens=0 && steamworks.val > 0 |
| soilUptuned | ironWill && kittens=0 && pasture.val >= 45 |
| atlasUnmeowed | ironWill && kittens=0 && magneto.val > 0 |
| meowMeowRevolution | ironWill && kittens=0 && factory.val > 0 |
| spaceOddity | ironWill && moonMission.on (star: + paragon < 10) |
| jupiterAscending | orbitalLaunch.on && calendar.year <= 1 (star: + startedWithoutChronospheres) |
| veryLargeArray | observatory.on >= 100 && !seti researched |
| shadowOfTheColossus | ziggurat.val > 0 && village.maxKittens == 1 |
| sunGod | religion.faith >= 696342 |
| heartOfDarkness | zebras resource > 1 |
| winterIsComing | deadKittens >= 10 (unethical) |
| youMonster | deadKittens >= 100 (unethical, star: >= 666666) |
| superUnethicalClimax | cheatMode flag (unethical) |
| systemShock | systemShockMode flag (unethical) |
| lotusMachine | karma resource >= 1 |
| serenity | kittens >= 50 && deadKittens == 0 (star: kittens >= 1000) |
| utopiaProject | happiness >= 1.5 && kittens > 35 (star: happiness >= 5) |
| deathStranding | space furthestRing planet reached |
| cathammer | stats.totalYears >= calendar.darkFutureBeginning (star: trueYear >= darkFutureBeginning) |
| eternalBacchanalia | festivalDays >= 100 * daysPerSeason * seasonsPerYear |
| challenger | uniqueCompletions >= 5 (star: totalCompletions >= 100) |

### Badge List (~20 items)

| Name | Condition |
|------|-----------|
| lotus | totalResets >= 50 (uses stats) |
| ivoryTower | no condition (external unlock) |
| useless | leader.trait.name == "none" (village leader system, not yet implemented) |
| beta | browser URL contains "beta" (browser-only, always false in engine) |
| silentHill | server.motdContent == "" (server-only, always false in engine) |
| evergreen | no condition |
| deadSpace | kittens.value >= 1000 && kittens.maxValue == 0 |
| reginaNoctis | kittens.value >= 500 && alicorn.value == 0 |
| ghostInTheMachine | no condition |
| abOwo | no condition |
| cleanPaws | no condition |
| sequenceBreak | !moon.reached && dune.reached |
| fantasticFurColor | leader != null && leader.color != 0 (village leader, not implemented) |
| whatYearIsIt | no condition |
| tardis | no condition |
| wheredThisComeFrom | no condition |
| lostDates | time.flux <= -5 |
| buffet | diplomacy.leviathans.energy >= 1000 |
| newHome | terraformingStation yarnHousing > cathHousing (space effect) |
| betterSafeThanSorry | no condition |

### Reset/save semantics
- `resetState()`: sets `unlocked=false`, `starUnlocked=false` for all achievements; `badgesUnlocked=false`, `unlocked=false` for all badges
- `save()`: filters to `[name, unlocked, starUnlocked]` for achievements; `ach = {badgesUnlocked, badges:[name,unlocked]}`
- `load()`: `loadMetadata` restores by name match; `badgesUnlocked` restored from `ach.badgesUnlocked || false`

### State fields NOT yet in engine (deferred)
- `ironWill` flag — gameplay flag, not yet tracked
- `deadKittens` count — not tracked in current VillageState
- `cheatMode`/`systemShockMode` — developer flags, engine omits
- `startedWithoutChronospheres` — prestige/time interaction
- `stats.totalResets` — stats subsystem not yet implemented
- `calendar.darkFutureBeginning`/`trueYear()` — time mechanics extension
- `calendar.festivalDays` — calendar extension
- `village.happiness` — happiness not yet in VillageState
- `village.maxKittens` — partially in effectCache, not direct on VillageState
- Village leader system — not yet implemented

## Key Decisions

1. **Conditions as data, not closures**: Each achievement def has a typed `ConditionContext` parameter instead of `this`-bound closures. This makes the engine pure and testable.
2. **Subset of achievable conditions**: Many achievements reference state not yet tracked (ironWill, deadKittens, cheatMode, stats). These conditions will be implemented as `() => false` stubs with a note, unlockable only once those slices land.
3. **AchievementManager.update()** scans all achievements each tick — `O(n)` where n ≈ 50. Acceptable for the game's tick rate.
4. **No new GameAction** — achievements unlock passively via tick; the player takes no direct achievement action.
5. **`deadKittens` counter**: Need to add to VillageState (currently not tracked). Death logic in VillageManager increments a death counter but never saves it.
6. **`ironWill` flag**: Simple boolean on GameState root or VillageState. IronWill = game started without any kittens.

## Gotchas & Edge Cases

- `theElderLegacy` condition uses wall clock time (January 2017) — always false now. Keep the def but condition always returns false.
- `badgesUnlocked` is a top-level flag that flips true when ANY badge unlocks — needed for UI tab visibility.
- Some badges have no condition at all (ivoryTower, ghostInTheMachine, etc.) — these are externally unlocked. In the engine they stay locked forever (no condition = never auto-unlocks).
- Star achievements: a separate `starUnlocked` flag, checked independently each tick.
- `hidden` achievements: only show in UI after unlocking; engine still tracks them normally.
- `unethical` tag: cosmetic classification only — engine behavior is identical.

## Open Questions

- Should `deadKittens` live on `VillageState` or at game root? → VillageState makes the most sense (parallel to `kittens`).
- How to represent `ironWill` flag? → Add as `ironWill: boolean` to VillageState (toggled by game config or reset type).
- Do we need `happiness` in VillageState for utopiaProject? → Yes, add a basic `happiness` field (static 1.0 base for now, can be refined later).
