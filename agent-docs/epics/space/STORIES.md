# Epic 13: Space — Stories

## Story 1: SpaceState shape and initial values

**As a** game engine
**I want** a SpaceState with programs, planets, and space buildings
**So that** space exploration state can be serialized and managed

### Acceptance Criteria
- [x] Given a fresh game, when `createInitialSpace()` is called, then only `orbitalLaunch` program is unlocked
- [x] Given a fresh game, when `createInitialSpace()` is called, then all planets are unlocked=false, reached=false
- [x] Given a fresh game, when `createInitialSpace()` is called, then all space buildings are unlocked=false, val=0, on=0
- [x] Given the SpaceState, all 15 programs are present with correct names
- [x] Given the SpaceState, all 12 planets are present with correct routeDays
- [x] Given the SpaceState, all 24+ space buildings are present

### Legacy Reference
- File: `legacy/js/space.js` lines 22–205 (programs), 207–963 (planets)
- Key logic: `resetState()` sets only `orbitalLaunch` as unlocked; all planets start locked

---

## Story 2: LAUNCH_MISSION action

**As a** player
**I want** to launch a space mission (program)
**So that** I can unlock new planets and further missions

### Acceptance Criteria
- [x] Given resources sufficient for orbitalLaunch prices, when LAUNCH_MISSION("orbitalLaunch") is dispatched, then resources are deducted
- [x] Given a successful launch, when orbitalLaunch is launched, then cath planet becomes unlocked=true
- [x] Given a successful launch, when a mission unlocks further missions, those missions become unlocked=true
- [x] Given insufficient resources, when LAUNCH_MISSION is dispatched, then state is unchanged
- [x] Given an already-completed mission (on=1), when LAUNCH_MISSION is dispatched again, then state is unchanged
- [x] Given an unknown mission name, when LAUNCH_MISSION is dispatched, then state is unchanged

### Legacy Reference
- File: `legacy/js/space.js` lines 1010–1037 (resetState), 1039–1085 (load with unlock propagation)
- Key logic: Each program has `unlocks.planet[]` and `unlocks.spaceMission[]`

---

## Story 3: BUY_SPACE_BUILDING action

**As a** player
**I want** to buy space buildings on reached planets
**So that** I can gain their effects

### Acceptance Criteria
- [x] Given planet is reached and building is unlocked with sufficient resources, when BUY_SPACE_BUILDING is dispatched, then resources deducted and val/on incremented
- [x] Given planet not reached, when BUY_SPACE_BUILDING is dispatched, then state is unchanged
- [x] Given building not unlocked, when BUY_SPACE_BUILDING is dispatched, then state is unchanged
- [x] Given insufficient resources, when BUY_SPACE_BUILDING is dispatched, then state is unchanged
- [x] Given an unknown building name, when BUY_SPACE_BUILDING is dispatched, then state is unchanged
- [x] Given building bought multiple times, price scales by priceRatio^count

### Legacy Reference
- File: `legacy/js/space.js` lines 969–1008 (constructor, price ratio logic)
- Key logic: Each building has `priceRatio` for scaling, `val` tracks count

---

## Story 4: Planet route travel (tick)

**As a** game engine
**I want** unlocked planets to automatically progress toward being reached
**So that** travel time is simulated

### Acceptance Criteria
- [x] Given a planet is unlocked with routeDays > 0, when update() is called each tick, then routeDays decreases by 1/ticksPerDay
- [x] Given routeDays reaches 0, when update() is called, then planet becomes reached=true
- [x] Given a planet is already reached, when update() is called, then routeDays is unchanged
- [x] Given cath planet (routeDays=0), when planet is unlocked, then it is immediately reached

### Legacy Reference
- File: `legacy/js/space.js` lines 1087–1130 (update with routeDays countdown)
- Key logic: `planet.routeDays -= routeSpeed / ticksPerDay`; ticksPerDay=10

---

## Story 5: SpaceManager.updateEffects

**As a** game engine
**I want** space building effects to contribute to the effect cache
**So that** space buildings boost production/storage

### Acceptance Criteria
- [x] Given spaceStation (val=1, on=1) is active, when updateEffects() is called, then effectCache gains scienceRatio: +0.5, maxKittens: +2
- [x] Given moonBase (val=1, on=1) is active, when updateEffects() is called, then effectCache gains catnipMax: +45000, woodMax: +25000 (static defaults)
- [x] Given a space building with on=0, when updateEffects() is called, then it contributes no effects
- [x] Given planetCracker (val=1, on=1), when updateEffects() is called, then effectCache gains uraniumPerTickSpace: +0.3

### Legacy Reference
- File: `legacy/js/space.js` lines 968–992 (getEffect via registerMeta)
- Key logic: effect = effects[name] * building.on (for most effects)

---

## Story 6: Building unlock when planet reached

**As a** game engine
**I want** planet buildings to auto-unlock when their planet is reached
**So that** players can build on newly reached planets

### Acceptance Criteria
- [x] Given a planet becomes reached, when SpaceManager.update() runs, then buildings without requiredTech become unlocked=true
- [x] Given a building has requiredTech, when all required techs are researched and planet is reached, then building becomes unlocked=true
- [x] Given a building has requiredTech and techs are not all researched, then building stays unlocked=false

### Legacy Reference
- File: `legacy/js/space.js` lines 1104–1120 (requiredTech unlock logic in update())
- Key logic: `if (typeof(bld.requiredTech) == "undefined") unlocked = true; else check all techs`

---

## Story 7: Save / load / reset for space state

**As a** game engine
**I want** space state to persist across save/load cycles
**So that** player progress is not lost

### Acceptance Criteria
- [x] Given space state with launched missions and built space buildings, when serialized and deserialized, then all values are restored
- [x] Given a soft reset, when SpaceManager.resetState() is called, then all missions reset and only orbitalLaunch is unlocked
- [x] Given a load, when mission has val>0 and unlocks, then unlocked planets/missions are restored

### Legacy Reference
- File: `legacy/js/space.js` lines 1039–1085 (save/load)
- Key logic: Save includes program vals, planet reached/routeDays, building vals

---

## Story 8: Cross-manager integration test

**As a** developer
**I want** a full tick loop test with SpaceManager
**So that** space interacts correctly with the rest of the engine

### Acceptance Criteria
- [x] Given a game with orbitalLaunch launched (cath unlocked), when 10 ticks run, then cath is reached (routeDays=0)
- [x] Given spaceStation built on cath, when updateEffects runs, then effectCache reflects scienceRatio bonus
- [x] Given full tick loop with all managers, when SpaceManager is included, then no errors and state is valid

