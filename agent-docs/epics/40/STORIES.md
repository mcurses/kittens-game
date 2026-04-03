# Epic: Population/Resource Decoupling

**Status:** Not Started
**Filed:** 2026-04-03
**Legacy refs:** `legacy/game.js`, `legacy/js/resources.js`, `legacy/js/village.js`, `legacy/js/achievements.js`, `legacy/js/jsx/left.jsx.js`

---

## Story: Remove `kittens` from generic resource simulation

**As a** player
**I want** village population to be simulated only once
**So that** kitten count cannot drift into a fake stockpile unrelated to actual population

### Acceptance Criteria
- [ ] Given the engine tick loop runs, when kitten arrival rate effects are applied, then they advance village population growth without independently increasing `resources.kittens`
- [ ] Given a saved game is loaded, when the state is reconstructed, then no stale generic `kittens` resource simulation survives alongside village population

### Legacy Reference
- `legacy/game.js` lines 3972-3974
- `legacy/js/village.js` lines 319-334, 2545-2563

### Status: [ ] Tests | [ ] Impl | [ ] Rated

## Story: Remove the phantom kittens row from the resource tab

**As a** player
**I want** the resources tab to only show actual resources
**So that** population is not presented as a separate accumulating inventory row

### Acceptance Criteria
- [ ] Given a save with living kittens, when the resources tab renders, then it does not show a `kittens` row
- [ ] Given village population exists, when UI visibility is derived, then that population still unlocks the relevant village/jobs affordances without depending on a visible resource-table row

### Legacy Reference
- `legacy/js/jsx/left.jsx.js` lines 251-262
- `legacy/js/village.js` lines 5129-5189

### Status: [ ] Tests | [ ] Impl | [ ] Rated

## Story: Re-anchor kitten-dependent gameplay checks on village state

**As a** maintainer
**I want** gameplay rules to read population from the village domain
**So that** achievements and other systems do not depend on a duplicated UI artifact

### Acceptance Criteria
- [ ] Given a rule depends on kitten count, when it is evaluated, then it uses authoritative village population or a dedicated helper rather than a drifting generic resource entry
- [ ] Given badge and achievement parity checks run, when kitten-count thresholds are evaluated, then they still match legacy outcomes after the resource alias is removed

### Legacy Reference
- `legacy/js/achievements.js` lines 212-326
- `legacy/game.js` lines 3972-3974

### Status: [ ] Tests | [ ] Impl | [ ] Rated

## Story: Preserve only parity-relevant kitten detail displays

**As a** player
**I want** any remaining kitten ETA/progress information to stay accurate
**So that** removing the fake resource row does not regress useful population feedback

### Acceptance Criteria
- [ ] Given kitten growth is in progress, when the UI needs next-kitten timing or progress, then it derives that from village state and current effects rather than a mutable `resources.kittens` pool
- [ ] Given no resource-table kitten row is shown, when population detail is displayed elsewhere, then it remains internally consistent with actual village count and cap

### Legacy Reference
- `legacy/game.js` lines 4073-4146
- `legacy/js/village.js` lines 2528-2563

### Status: [ ] Tests | [ ] Impl | [ ] Rated
