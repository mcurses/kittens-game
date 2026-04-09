# Epic: 49

**Status:** Complete
**Started:** 2026-04-09
**Legacy refs:** `legacy/js/buildings.js` (stage controls, stageEffects, deltagrade), `legacy/js/buildings.js:3287–3424` (building filter tabs)

---

## Story 49-01: Building stage upgrade/downgrade actions

**As a** player
**I want** to upgrade and downgrade staged buildings (pasture↔solarFarm, aqueduct↔hydroPlant, library↔dataCenter, warehouse↔spaceport, amphitheatre↔broadcastTower)
**So that** I can access late-game building variants

### Acceptance Criteria
- [x] `UPGRADE_BUILDING_STAGE` action increments `stage` from 0→1 when `stageUnlocked[1]` is true
- [x] `DOWNGRADE_BUILDING_STAGE` action decrements `stage` from 1→0
- [x] Both upgrade and downgrade reset `val` and `on` to 0 (sells all buildings)
- [x] Upgrade is rejected if next stage is not unlocked (`stageUnlocked` false)
- [x] Downgrade at stage 0 is a no-op
- [x] Stage persists through save/load round-trip

### Legacy Reference
- `legacy/js/buildings.js` lines 3203–3254 (`upgrade`, `downgrade`, `deltagrade`)
- `legacy/js/buildings.js` lines 3173–3200 (`getStageLinks`)

### Status: [x] Tests | [x] Impl | [ ] Rated

---

## Story 49-02: Stage-specific labels and display names

**As a** player
**I want** staged buildings to show their stage-appropriate name (e.g. "Solar Farm" when pasture is at stage 1)
**So that** the UI reflects what the building actually is

### Acceptance Criteria
- [x] Engine exports a `STAGE_LABELS` map: `{ pasture: ["Pasture", "Solar Farm"], aqueduct: ["Aqueduct", "Hydro Plant"], library: ["Library", "Data Center"], warehouse: ["Warehouse", "Spaceport"], amphitheatre: ["Amphitheatre", "Broadcast Tower"] }`
- [x] `getBuildingDisplayName(name, stage)` returns the correct label
- [x] BuildingsPanel renders the stage-specific label instead of prettified camelCase when a building has stages

### Legacy Reference
- `legacy/js/buildings.js` lines 341, 355, 403, 416, 527, 541, 783, 804, 1774, 1791 (stage labels)

### Status: [x] Tests | [x] Impl | [ ] Rated

---

## Story 49-03: Stage effects for remaining staged buildings

**As a** server
**I want** all 5 staged buildings to have `stageEffects` defined in their `BuildingDef`
**So that** effect contributions are correct per stage

### Acceptance Criteria
- [x] pasture has `stageEffects[0]` with `catnipDemandRatio: -0.005` and `stageEffects[1]` with `energyProduction: 2`
- [x] aqueduct has `stageEffects[0]` with `catnipRatio: 0.03` and `stageEffects[1]` with `energyProduction: 5`
- [x] library has `stageEffects[0]` with `scienceRatio: 0.1, scienceMax: 250, cultureMax: 10` and `stageEffects[1]` with `scienceMaxCompendia: 1000, cultureMax: 25, energyConsumption: 2`
- [x] warehouse has `stageEffects[0]` with `woodMax: 150, mineralsMax: 200, coalMax: 30, ironMax: 25, titaniumMax: 10, goldMax: 5` and `stageEffects[1]` with `moonBaseStorageBonus: 0.0085, planetCrackerStorageBonus: 0.0085, cryostationStorageBonus: 0.0085, energyConsumption: 5`
- [x] amphitheatre stageEffects already exist — verify correctness (stage 0: `culturePerTickBase: 0.005, cultureMax: 50, unhappinessRatio: -0.048`; stage 1: `culturePerTickBase: 1, cultureMax: 300, unhappinessRatio: -0.75`)
- [x] Effect cache uses correct stage effects when building is at stage 1

### Legacy Reference
- `legacy/js/buildings.js` lines 340–397 (pasture/solarFarm), 399–447 (aqueduct/hydroPlant), 523–580 (library/dataCenter), 779–855 (warehouse/spaceport), 1772–1829 (amphitheatre/broadcastTower)

### Status: [x] Tests | [x] Impl | [ ] Rated

---

## Story 49-04: Stage unlock state tracking

**As a** server
**I want** each staged building to track which stages are unlocked via a `stageUnlocked` array
**So that** the upgrade button only appears when the next stage has been unlocked

### Acceptance Criteria
- [x] `BuildingEntry` gains `stageUnlocked?: boolean[]` field (e.g. `[true, false]`)
- [x] `createInitialBuildings` sets stage 0 always unlocked and stage 1 per legacy defaults (warehouse: both true; others: stage 1 false)
- [x] Serialization round-trips `stageUnlocked` correctly
- [x] Tech research or other unlock mechanisms can set `stageUnlocked[1] = true`

### Legacy Reference
- `legacy/js/buildings.js` lines 2637–2648 (resetState clears stageUnlocked)
- `legacy/js/buildings.js` lines 352, 387, 413, 426, 538, 558, 800, 821, 1787, 1803 (stage defs)

### Status: [x] Tests | [x] Impl | [ ] Rated

---

## Story 49-05: Building filter tabs UI

**As a** player
**I want** filter tabs (All, Available, Enabled, Togglable) above the building list
**So that** I can quickly find buildings by status

### Acceptance Criteria
- [x] Filter tabs render above building groups: All | Available | Enabled | Togglable
- [x] "All" (default) shows all unlocked buildings grouped by category
- [x] "Available" shows buildings that can currently be purchased (affordable)
- [x] "Enabled" shows buildings with `on > 0`
- [x] "Togglable" shows buildings that have on/off controls (controlMode is "count" or "binary")
- [x] Active tab is visually highlighted
- [x] Changing tab re-filters the list

### Legacy Reference
- `legacy/js/buildings.js` lines 3297–3424 (`BuildingsModern.render`, filter groups)

### Status: [x] Tests | [x] Impl | [ ] Rated

---

## Story 49-06: Stage upgrade/downgrade UI controls

**As a** player
**I want** upgrade (^) and downgrade (v) buttons on staged buildings
**So that** I can switch between building stages

### Acceptance Criteria
- [x] Staged buildings show an upgrade button (^) when next stage is unlocked and current stage < max
- [x] Staged buildings show a downgrade button (v) when current stage > 0
- [x] Upgrade button dispatches `UPGRADE_BUILDING_STAGE` action
- [x] Downgrade button dispatches `DOWNGRADE_BUILDING_STAGE` action
- [x] Buttons are disabled while action is pending

### Legacy Reference
- `legacy/js/buildings.js` lines 3173–3200 (`getStageLinks`)

### Status: [x] Tests | [x] Impl | [ ] Rated
