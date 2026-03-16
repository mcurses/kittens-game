# Epic 04: Resources

**Status:** In Progress
**Started:** 2026-03-16
**Legacy references:** `legacy/js/resources.js` (ResourceManager, 1135 lines), `legacy/game.js` (~line 3174, `calcResourcePerTick`)

---

## Story Index

1. [Resource state](#story-resource-state)
2. [ResourceManager update](#story-resourcemanager-update)
3. [Gather catnip action](#story-gather-catnip-action)
4. [Serialization](#story-serialization)

---

## Story: Resource State

**As a** engine developer
**I want** a `ResourceState` type in `GameState` that tracks each resource's value and maxValue
**So that** the game can read/write resource amounts without mutation

### Acceptance Criteria
- [x] Given `createInitialResources()`, then all resources start at value 0 and maxValue 0
- [x] Given `RESOURCE_NAMES`, then it contains all known resource names from legacy
- [x] Given `ResourceEntry`, then it has `value: number` and `maxValue: number`
- [x] Given `createInitialState()`, then `state.resources` is a Record with all RESOURCE_NAMES keys

### Legacy Reference
- `legacy/js/resources.js:*` — `resPool.resources` array

### Status
- [x] Tests written
- [x] Implementation complete

---

## Story: ResourceManager Update

**As a** engine developer
**I want** `ResourceManager.update(state)` to apply per-tick resource changes to the state
**So that** fields and other buildings correctly increase catnip each tick

### Acceptance Criteria
- [x] Given effectCache with `catnipPerTickBase: 0.125`, when `update()` is called, then `catnip.value` increases by 0.125
- [x] Given effectCache with `catnipRatio: 0.03`, the formula `base * (1 + ratio)` is applied
- [x] Given a resource at maxValue, when update is called, then value does not exceed maxValue
- [x] Given a resource near 0 and a negative perTick, when update is called, then value does not go below 0
- [x] Given `ResourceManager.updateEffects()`, when any resource has a positive value, no effects are produced (resources don't contribute effects by default)

### Legacy Reference
- `legacy/game.js:3174` — `calcResourcePerTick()` formula
- `legacy/js/resources.js` — `resPool.update()` applies perTick to each resource

### Status
- [x] Tests written
- [x] Implementation complete

---

## Story: Gather Catnip Action

**As a** engine developer
**I want** a `GATHER_CATNIP` action that increments catnip by 1
**So that** the player can manually gather catnip as in the original game

### Acceptance Criteria
- [x] Given `applyAction(state, { type: "GATHER_CATNIP" })`, then `state.resources.catnip.value` increases by 1
- [x] Given `applyAction` with `GATHER_CATNIP` when catnip is at maxValue, then value does not exceed maxValue
- [x] Given `applyAction` with `GATHER_CATNIP` when maxValue is 0, then value is clamped to 0

### Legacy Reference
- `legacy/js/resources.js` — `gatherCatnip()` does `catnip.value++`

### Status
- [x] Tests written
- [x] Implementation complete

---

## Story: Serialization

**As a** engine developer
**I want** `ResourceState` to be serialized and deserialized in `serialize()`/`deserialize()`
**So that** resource values persist across save/load cycles

### Acceptance Criteria
- [x] Given `serialize(state)`, then `serialized.resources` contains all resource values
- [x] Given `deserialize(serialize(state))`, then resource values match original state
- [x] Given `deserialize` with missing resources field, then it falls back to `createInitialResources()`

### Legacy Reference
- `legacy/game.js:2393` — `save()` serializes each resource pool

### Status
- [x] Tests written
- [x] Implementation complete
