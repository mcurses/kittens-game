# Epic 05: Buildings

**Status:** In Progress
**Started:** 2026-03-16
**Legacy references:** `legacy/js/buildings.js` (BuildingsManager, 3511 lines), `legacy/game.js`

---

## Story Index

1. [Building definitions](#story-building-definitions)
2. [BuildingManager effects](#story-building-manager-effects)
3. [Buy building action](#story-buy-building-action)
4. [Serialization](#story-serialization)

---

## Story: Building Definitions

**As a** engine developer
**I want** a `BUILDING_DEFS` constant with static effects for all early-game buildings
**So that** the engine can compute per-tick effects without dynamic game context

### Acceptance Criteria
- [x] Given `BUILDING_DEFS`, then it contains field, pasture, aqueduct, hut, logHouse, mansion, library, academy, mine
- [x] Given a `BuildingDef`, then it has `name`, `prices`, `priceRatio`, and `effects` fields
- [x] Given `getBuildingPrice(def, count)`, when count=0, then it returns the base prices unchanged
- [x] Given `getBuildingPrice(def, count)`, when count=1, then each price is multiplied by `priceRatio^1`
- [x] Given `createInitialBuildings()`, then all buildings start at val:0, on:0

### Legacy Reference
- `legacy/js/buildings.js:315` — `buildingsData` array with all building definitions

### Status
- [x] Tests written
- [x] Implementation complete

---

## Story: BuildingManager Effects

**As a** engine developer
**I want** `BuildingManager.updateEffects()` to contribute building effects to the effect cache
**So that** fields correctly increase catnipPerTickBase and barns increase catnipMax

### Acceptance Criteria
- [x] Given 3 fields (val=3, on=3), when updateEffects() is called, then `catnipPerTickBase` = 0.125 * 3
- [x] Given 2 barns (val=2), when updateEffects() is called, then `catnipMax` = 5000 * 2
- [x] Given 1 aqueduct (val=1, on=1), when updateEffects() is called, then `catnipRatio` = 0.03
- [x] Given effects ending in 'Max': multiply by bld.val; all others: multiply by bld.on
- [x] Given a building with on=0 but val=1, then non-Max effects are 0 but Max effects are still val*base

### Legacy Reference
- `legacy/js/buildings.js:constructor` — `calculateEffects()` called in update loop
- Legacy rule: `Max` effects use `val`; all others use `on`

### Status
- [x] Tests written
- [x] Implementation complete

---

## Story: Buy Building Action

**As a** engine developer
**I want** a `BUY_BUILDING` action that deducts resources and increments a building
**So that** players can construct buildings

### Acceptance Criteria
- [x] Given `BUY_BUILDING { name: "field" }` when catnip >= 10, then catnip decreases by 10 and field.val/on increment
- [x] Given `BUY_BUILDING` when resources are insufficient, then state is unchanged (no partial deduction)
- [x] Given `BUY_BUILDING` for the 2nd field (count=1), then the price is catnip * priceRatio^1
- [x] Given `BUY_BUILDING` for an unknown building name, then state is unchanged
- [x] Given `canAfford(prices, resources)`, when all prices are met, then returns true

### Legacy Reference
- `legacy/js/buildings.js` — `construct(bld)` deducts prices and increments `bld.val`/`bld.on`

### Status
- [x] Tests written
- [x] Implementation complete

---

## Story: Serialization

**As a** engine developer
**I want** `BuildingState` to be serialized and deserialized
**So that** building counts persist across save/load cycles

### Acceptance Criteria
- [x] Given `serialize(state)`, then `serialized.buildings` contains all building val/on values
- [x] Given `deserialize(serialize(state))`, then building values match original state
- [x] Given `deserialize` with missing buildings field, then it falls back to `createInitialBuildings()`

### Status
- [x] Tests written
- [x] Implementation complete
