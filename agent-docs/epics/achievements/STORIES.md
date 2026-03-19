# Epic: 16 Achievements

**Status:** In Progress
**Started:** 2026-03-19
**Legacy refs:** `legacy/js/achievements.js`

---

## Story 1: AchievementState shape and initial values

**As a** server
**I want** a typed `AchievementState` slice with all achievement and badge entries
**So that** the achievement system has a stable, serializable shape from the start

### Acceptance Criteria
- [ ] Given `createInitialAchievements()`, all 30 achievement entries have `unlocked: false` and `starUnlocked: false`
- [ ] Given `createInitialAchievements()`, all 20 badge entries have `unlocked: false`
- [ ] Given `createInitialAchievements()`, `badgesUnlocked` is `false`
- [ ] Each achievement entry has: `name`, `unlocked`, `starUnlocked`, `hidden?`, `unethical?`
- [ ] Each badge entry has: `name`, `unlocked`
- [ ] `AchievementState` is exported and added to `GameState` as `achievements: AchievementState`
- [ ] `createInitialState()` includes `achievements: createInitialAchievements()`

### Legacy Reference
- `legacy/js/achievements.js` lines 5–259 (achievements array)
- `legacy/js/achievements.js` lines 261–411 (badges array)

### Status: [ ] Tests | [ ] Impl | [ ] Rated

---

## Story 2: AchievementManager.update() — passive unlock on tick

**As a** game engine
**I want** achievements to unlock automatically each tick when their conditions are met
**So that** players are recognized for milestones without taking explicit actions

### Acceptance Criteria
- [ ] Given an achievement is not yet unlocked and its condition is met, when a tick runs, then `unlocked` becomes `true`
- [ ] Given an achievement is already unlocked and its condition is met, when a tick runs, then `unlocked` stays `true` (idempotent)
- [ ] Given an achievement has no condition (or always-false condition), when a tick runs, then `unlocked` stays `false`
- [ ] Given a star condition is met, when a tick runs, then `starUnlocked` becomes `true` independently of `unlocked`
- [ ] Given a star condition is not met, when a tick runs, then `starUnlocked` stays `false`
- [ ] Badges with conditions also auto-unlock; `badgesUnlocked` flag is set `true` when any badge unlocks
- [ ] Badges with no condition never auto-unlock

### Legacy Reference
- `legacy/js/achievements.js` lines 440–473 (`update()` function)

### Status: [ ] Tests | [ ] Impl | [ ] Rated

---

## Story 3: Resource-based achievement conditions

**As a** player
**I want** achievements to unlock when I accumulate specific resources
**So that** resource milestones are recognized

### Acceptance Criteria
- [ ] `unicornConspiracy` unlocks when `resources.unicorns.value > 0`
- [ ] `uniception` unlocks when `resources.tears.value > 0`
- [ ] `sinsOfEmpire` unlocks when `resources.alicorn.value > 0`
- [ ] `anachronox` unlocks when `resources.timeCrystal.value > 0`
- [ ] `deadSpace` unlocks when `resources.necrocorn.value > 0`
- [ ] `sadnessAbyss` unlocks when `resources.sorrow.value >= 100`
- [ ] `heartOfDarkness` unlocks when `resources.zebras.value > 1`
- [ ] `lotusMachine` unlocks when `resources.karma.value >= 1`

### Legacy Reference
- `legacy/js/achievements.js` lines 18–194

### Status: [ ] Tests | [ ] Impl | [ ] Rated

---

## Story 4: Religion-based achievement conditions

**As a** player
**I want** achievements to unlock when faith/worship reaches key thresholds
**So that** religion milestones are recognized

### Acceptance Criteria
- [ ] `sunGod` unlocks when `religion.worship >= 696342`
- [ ] `sunGod` does NOT unlock when `religion.worship < 696342`

### Legacy Reference
- `legacy/js/achievements.js` lines 137–143

### Status: [ ] Tests | [ ] Impl | [ ] Rated

---

## Story 5: Population-based achievement conditions

**As a** player
**I want** achievements to unlock for kitten population milestones
**So that** population goals are recognized

### Acceptance Criteria
- [ ] `serenity` unlocks when `village.kittens >= 50 && village.deadKittens == 0`
- [ ] `serenity` has star: unlocks when `village.kittens >= 1000 && village.deadKittens == 0`
- [ ] `utopiaProject` unlocks when `village.happiness >= 1.5 && resources.kittens.value > 35`
- [ ] `utopiaProject` has star: unlocks when `village.happiness >= 5.0 && resources.kittens.value > 35`
- [ ] `deadKittens` counter is tracked in `VillageState` (added as `deadKittens: number`)
- [ ] `happiness` is tracked in `VillageState` as a numeric field (static 1.0 base, not computed here)

### Legacy Reference
- `legacy/js/achievements.js` lines 196–216

### Status: [ ] Tests | [ ] Impl | [ ] Rated

---

## Story 6: Building-based achievement conditions

**As a** player
**I want** achievements to unlock for building milestones
**So that** construction goals are recognized

### Acceptance Criteria
- [ ] `veryLargeArray` unlocks when `buildings.observatory.on >= 100 && !science.techs.seti.researched`
- [ ] `shadowOfTheColossus` unlocks when `buildings.ziggurat.val > 0` and `effectCache.maxKittens == 1` (or village.maxKittens == 1 — use effectCache)
- [ ] Badge `sequenceBreak` unlocks when `!space.planets.moon.reached && space.planets.dune.reached`

### Legacy Reference
- `legacy/js/achievements.js` lines 123–135, 344–350

### Status: [ ] Tests | [ ] Impl | [ ] Rated

---

## Story 7: Space-based achievement conditions

**As a** player
**I want** achievements to unlock for space exploration milestones
**So that** space goals are recognized

### Acceptance Criteria
- [ ] `deathStranding` unlocks when `space.planets.furthestRing.reached == true`
- [ ] `jupiterAscending` unlocks when `space.programs.orbitalLaunch.on > 0 && calendar.year <= 1`

### Legacy Reference
- `legacy/js/achievements.js` lines 101–127, 222–228

### Status: [ ] Tests | [ ] Impl | [ ] Rated

---

## Story 8: Challenge-based achievement conditions

**As a** player
**I want** achievements to unlock for challenge completion milestones
**So that** challenge goals are recognized

### Acceptance Criteria
- [ ] `challenger` unlocks when the count of uniquely completed challenges >= 5
- [ ] `challenger` has star: unlocks when total challenge completions >= 100
- [ ] The condition reads from `challenges.challenges` state to count completions

### Legacy Reference
- `legacy/js/achievements.js` lines 249–258

### Status: [ ] Tests | [ ] Impl | [ ] Rated

---

## Story 9: Time-based achievement conditions (badges)

**As a** player
**I want** badges to unlock for time mechanics milestones
**So that** Chronoforge actions are recognized

### Acceptance Criteria
- [ ] Badge `lostDates` unlocks when `time.flux <= -5`
- [ ] Badge `buffet` unlocks when `diplomacy.races.leviathans.energy >= 1000` — **Note:** leviathan energy not yet tracked; stub as `() => false`

### Legacy Reference
- `legacy/js/achievements.js` lines 377–394

### Status: [ ] Tests | [ ] Impl | [ ] Rated

---

## Story 10: Kitten population badges

**As a** player
**I want** badges to unlock for specific kitten/resource combinations
**So that** unique population milestones are recognized

### Acceptance Criteria
- [ ] Badge `deadSpace` unlocks when `resources.kittens.value >= 1000 && resources.kittens.maxValue == 0`
- [ ] Badge `reginaNoctis` unlocks when `resources.kittens.value >= 500 && resources.alicorn.value == 0`

### Legacy Reference
- `legacy/js/achievements.js` lines 316–329

### Status: [ ] Tests | [ ] Impl | [ ] Rated

---

## Story 11: Save / load / reset for achievements state

**As a** server
**I want** achievement state to persist across save/load cycles and reset on soft reset
**So that** achievements survive game restarts

### Acceptance Criteria
- [ ] `serialize()` includes `achievements: { badgesUnlocked, achievements: [{name, unlocked, starUnlocked}], badges: [{name, unlocked}] }`
- [ ] `deserialize()` + `AchievementManager.load()` restores unlocked/starUnlocked/badgesUnlocked by name match
- [ ] Unknown achievement/badge names in save data are ignored
- [ ] `AchievementManager.resetState()` sets all `unlocked=false`, `starUnlocked=false`, `badgesUnlocked=false`
- [ ] SOFT_RESET also resets achievement state (achievements are per-run, not persistent like prestige)

### Legacy Reference
- `legacy/js/achievements.js` lines 475–512

### Status: [ ] Tests | [ ] Impl | [ ] Rated

---

## Story 12: Cross-manager integration test

**As a** developer
**I want** a full multi-tick integration test with AchievementManager registered
**So that** achievement unlocking composes correctly with all other managers

### Acceptance Criteria
- [ ] Given all managers registered and a state with `resources.unicorns.value = 1`, when tick runs, then `achievements.achievements.unicornConspiracy.unlocked == true`
- [ ] Given a fresh state, when `village.kittens = 50` and `deadKittens = 0`, then `serenity` unlocks on the next tick
- [ ] Given `space.programs.orbitalLaunch.on = 1` and `calendar.year = 0`, then `jupiterAscending` unlocks on next tick
- [ ] AchievementManager integrates cleanly with `tick()` (registered in tick.ts)

### Legacy Reference
- Behavior emerges from combined manager composition

### Status: [ ] Tests | [ ] Impl | [ ] Rated
