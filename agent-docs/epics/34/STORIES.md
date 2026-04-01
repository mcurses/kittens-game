# Epic 34 — Production & Control Parity Audit

Retroactively file and continue the live-save production/control fixes discovered immediately after Epic 33. This epic exists because production values, conversion buildings, and on/off controls were still drifting from legacy despite the UI visibility parity pass being complete.

**Status:** In Progress
**Started:** 2026-04-01
**Legacy refs:** `legacy/core.js`, `legacy/js/buildings.js`, `legacy/js/resources.js`, `legacy/js/workshop.js`

---

## Story: 34-01 — Building enable/disable action surface

**As a** player
**I want** legacy-toggleable buildings to expose real `On` / `Off` controls end-to-end
**So that** conversion and automation buildings can be managed like they are in legacy

### Acceptance Criteria
- [x] Given a legacy-toggleable building, when the player clicks `On` or `Off`, then the engine mutates its active `on` count without changing total `val`.
- [x] Given building toggles are added to the engine, when the API contract is updated, then the new `GameAction` types are present in `openapi.yaml` and generated schemas in the same implementation slice.
- [x] Given the client renders a toggleable building, when controls are shown, then the buttons dispatch the new action types rather than mutating local state.
- [x] Given a building is not legacy-toggleable, when the panel renders, then no `On` / `Off` controls are shown.

### Legacy Reference
- `legacy/core.js:334-356`
- `legacy/js/buildings.js:2354-2414`

### Status: [x] Tests | [x] Impl | [ ] Rated

## Story: 34-02 — Runtime consumers for autoproduction and production keys

**As a** maintainer
**I want** generic resource production effect keys to be consumed in one runtime path
**So that** adding a building effect in defs is not mistaken for completed production parity

### Acceptance Criteria
- [x] Given a building or upgrade produces `${name}PerTickAutoprod`, when a tick runs, then `calcResourcePerTick` applies it to the target resource.
- [x] Given a building or upgrade produces `${name}PerTickProd`, when a tick runs, then `calcResourcePerTick` applies it to the target resource.
- [x] Given a new resource-production key is wired, when tests run, then regression coverage proves the resource delta is real rather than inert effect-cache state.

### Legacy Reference
- `legacy/js/resources.js:211-323`
- `legacy/core.js:1606-1999`

### Status: [x] Tests | [x] Impl | [ ] Rated

## Story: 34-03 — Smelter and steamworks runtime production parity slice

**As a** player
**I want** smelter and steamworks to affect real production values instead of only exposing partial defs
**So that** building them in a live save changes resources in the expected direction

### Acceptance Criteria
- [x] Given smelter is active, when a tick runs, then its base autoproduction and consumption effects change runtime resource deltas.
- [x] Given steamworks is active, when a tick runs, then its dynamic coal/manuscript/magneto effects feed real production rather than inert cache keys.
- [x] Given the parity tracker is updated, when this story lands, then smelter, steamworks, and factory remain `⚠️` until the remaining automation and throttling behavior is proven.

### Legacy Reference
- `legacy/js/buildings.js:998-1059`
- `legacy/js/buildings.js:1208-1315`

### Status: [x] Tests | [x] Impl | [ ] Rated

## Story: 34-04 — Legacy building-toggle visibility rules in engine selectors

**As a** player
**I want** building toggle controls to appear only where legacy actually allows them
**So that** the web UI neither leaks fake controls nor hides real ones like smelter

### Acceptance Criteria
- [x] Given a building is toggleable because of explicit metadata, when the selector runs, then toggle controls are visible.
- [x] Given a building is toggleable because legacy auto-derives it from `lackResConvert`, when the selector runs, then toggle controls are still visible.
- [x] Given a building is gated by tech or special-case logic (`mine`, `quarry`, `oilWell`, `biolab`), when prerequisites are missing, then controls remain hidden.
- [x] Given smelter toggle parity regressed once, when regression tests run, then the selector keeps smelter toggleable.

### Legacy Reference
- `legacy/core.js:334-356`
- `legacy/js/buildings.js:998-1059`

### Status: [x] Tests | [x] Impl | [ ] Rated

## Story: 34-05 — Steamworks automation loop parity

**As a** player
**I want** steamworks automation to batch-craft with legacy timing and jam behavior
**So that** enabling steamworks affects production flow the same way as the original game

### Acceptance Criteria
- [x] Given steamworks automation is enabled and inputs are available, when ticks advance, then beam/slab/plate auto-crafting follows legacy batch rules.
- [x] Given a jam or delay condition is hit in legacy, when automation runs, then the rewrite reproduces the same blocked or delayed behavior.
- [x] Given automation state changes, when the UI renders, then the control surface matches the engine state instead of a client-only toggle.

### Legacy Reference
- `legacy/js/buildings.js:1208-1315`
- `legacy/js/workshop.js:1685-1828`

### Status: [x] Tests | [x] Impl | [ ] Rated

## Story: 34-06 — Factory automation mode parity

**As a** player
**I want** factory automation mode and carbon-sequestration behavior to match legacy
**So that** factory energy use, pollution behavior, and control state stop being static approximations

### Acceptance Criteria
- [ ] Given factory automation mode is toggled, when the engine updates effects, then energy and pollution behavior follow legacy mode rules.
- [ ] Given carbon sequestration is researched or activated, when factory state changes, then the correct automation mode becomes available and persists.
- [ ] Given the client renders factories, when controls are shown, then the player can see and change the same automation mode the engine uses.

### Legacy Reference
- `legacy/js/buildings.js:1316-1467`
- `legacy/js/workshop.js:1829-1918`

### Status: [ ] Tests | [ ] Impl | [ ] Rated
