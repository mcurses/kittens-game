# Epic: 43

**Status:** In Progress
**Started:** 2026-04-06
**Legacy refs:** `legacy/js/buildings.js`, `legacy/js/workshop.js`, `legacy/js/science.js`

---

## Story: Harbor dynamic storage modifiers consume workshop effects

**As a** player
**I want** harbor upgrades like `cargoShips` and `barges` to affect actual harbor storage
**So that** ship count and coal-storage upgrades change caps the way legacy does

### Acceptance Criteria
- [ ] Given researched `cargoShips` and owned ships, when harbor effects are rebuilt, then harbor storage caps scale by the legacy `harborRatio` formula with limited diminishing returns
- [ ] Given researched `barges`, when harbor effects are rebuilt, then harbor `coalMax` includes the legacy `harborCoalRatio` multiplier
- [ ] Given reactor count and `harborLimitRatioPolicy`, when harbor effects are rebuilt, then the cargo-ship storage cap limit matches the legacy limit formula
- [ ] Given the above runtime behavior exists, then `agent-docs/PARITY.md` no longer overstates harbor parity

### Legacy Reference
- `legacy/js/buildings.js` lines 887-917
- `legacy/js/workshop.js` lines 548-563
- `legacy/js/science.js` line 1706

### Status: [ ] Tests | [ ] Impl | [ ] Rated

## Story: Oil well runtime modifiers consume workshop effects

**As a** player
**I want** `pumpjack` and later oil upgrades to affect oil well output and controls
**So that** the oil well behaves like the legacy building instead of staying static

### Acceptance Criteria
- [ ] Given researched `pumpjack`, when oil well effects are rebuilt, then `oilPerTickBase` scales by `oilWellRatio`
- [ ] Given `pumpjack`, when oil well controls are exposed, then oil well runtime state follows legacy binary automation behavior instead of static always-on production
- [ ] Given oil well automation is disabled, when effects are rebuilt, then the `pumpjack` bonus is removed as in legacy
- [ ] Given automation state changes, when effects are rebuilt, then energy and pollution side effects match the legacy oil well behavior

### Legacy Reference
- `legacy/js/buildings.js` lines 1386-1432
- `legacy/js/workshop.js` lines 1556, 1890, 1905

### Status: [ ] Tests | [ ] Impl | [ ] Rated

## Story: Reactor runtime modifiers consume workshop effects

**As a** player
**I want** `coldFusion` and `thoriumReactors` to affect reactor runtime behavior
**So that** reactor energy output and thorium mode are not stuck at static base values

### Acceptance Criteria
- [ ] Given researched `coldFusion`, when reactor effects are rebuilt, then `energyProduction` scales by `reactorEnergyRatio`
- [ ] Given researched `thoriumReactors`, when reactor effects are rebuilt, then thorium automation state and `reactorThoriumPerTick` behave like legacy
- [ ] Given reactor automation is disabled or thorium is unavailable, when reactor effects are rebuilt, then the legacy fallback energy output and automation shutdown behavior occur
- [ ] Given uranium would run out, when the reactor action/update path runs, then the legacy auto-disable behavior is represented or explicitly tracked if deferred

### Legacy Reference
- `legacy/js/buildings.js` lines 1520-1565
- `legacy/js/workshop.js` lines 1719-1734
- `legacy/js/science.js` line 1706

### Status: [ ] Tests | [ ] Impl | [ ] Rated

## Story: Mint runtime modifiers consume policy effects

**As a** player
**I want** mint policies like `frugality` and spider ivory bonuses to affect mint output
**So that** mint production responds to policy choices the way it does in legacy

### Acceptance Criteria
- [ ] Given researched `frugality`, when mint effects are rebuilt, then mint output uses `mintRatio`
- [ ] Given researched `spiderRelationsPaleontologists`, when mint effects are rebuilt, then ivory output uses `mintIvoryRatio`
- [ ] Given mint runtime output depends on manpower stock in legacy, when the rewrite parity is evaluated, then either that runtime dependency is implemented or the epic notes/PARITY tracker keep mint as partial
- [ ] Given the runtime behavior is audited, then `agent-docs/PARITY.md` no longer marks mint `✅` unless producer, consumer, and parity tests all exist

### Legacy Reference
- `legacy/js/buildings.js` lines 1658-1703
- `legacy/js/science.js` lines 1852, 2020-2024

### Status: [ ] Tests | [ ] Impl | [ ] Rated
