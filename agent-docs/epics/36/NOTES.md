# Epic 36 — Building Unlock Architecture Notes

## Legacy Behavior Summary

### Two-step unlock model (legacy/js/buildings.js + legacy/game.js)

Legacy has two separate concepts on every building meta object:

1. **`unlockable`** (runtime boolean, NOT saved): "research (or default) grants permission"
   - Set on init via: `bld.unlockable = bld.defaultUnlockable || false` (buildings.js:2642)
   - Set when research resolves: `newUnlock.unlockable = true` for `type == "buildings"` (game.js:5352)
   - `isUnlockable(bld)` returns: `bld.defaultUnlockable || bld.unlockable` (buildings.js:2605)

2. **`unlocked`** (saved): "resource threshold was met — building is visible"
   - Set in `update()` when `isUnlocked(bld)` returns true (buildings.js:2526)
   - `isUnlocked(bld)`: calls `isUnlockable()` first, then checks price * unlockRatio for all resources (buildings.js:2578–2601)
   - One-way: never locked back (except the "just in case patch" check at 2532)

### Save format
`unlockable` is NOT in the save fields (buildings.js:2609). Only `unlocked`, `val`, `on`, `stage`, `jammed`, `isAutomationEnabled` are saved. The rewrite must persist `unlockable` in state since we use event sourcing (actions applied to state diffs), but no migration is needed — in-dev saves are disposable.

### ivoryTemple
- Has `defaultUnlockable: true` in legacy (buildings.js:2185)
- Also listed in archery tech's `unlocks.buildings` in legacy science.js:246
- Rewrite has neither → permanently hidden (bug)

## Current Rewrite Bugs Found

### Root cause
`applyResearch` in science.ts never processes `def.unlocks?.buildings`. It only handles `unlocks.tech` and `unlocks.policies`. This means buildings in science unlock chains never receive the `unlockable` signal.

### Workaround (broken)
Building defs use `requiredTech: string[]` — `BuildingManager.update()` checks if all listed techs are researched to determine `isUnlockable`. This has two failure modes:
1. **Missing requiredTech**: `unicornPasture`, `ziggurat`, and all ~15 mid/late-game buildings have no `requiredTech` → permanently hidden
2. **Wrong tech name**: `brewery` (building) has `requiredTech: ["agriculture"]` but drama tech unlocks it; `smelter` has `["mining"]` but metal tech unlocks it; `mint` has `["currency"]` but architecture tech unlocks it; `calciner` has `["metallurgy"]` — tech doesn't exist

## Buildings with requiredTech → All should be removed

| Building | Current requiredTech | Actual science unlock | Status |
|----------|---------------------|----------------------|--------|
| pasture | animal | animal → pasture ✅ | DUPLICATE |
| aqueduct | engineering | engineering → aqueduct ✅ | DUPLICATE |
| logHouse | construction | construction → logHouse ✅ | DUPLICATE |
| mansion | architecture | architecture → mansion ✅ | DUPLICATE |
| academy | math | math → academy ✅ | DUPLICATE |
| mine | mining | mining → mine ✅ | DUPLICATE |
| barn | agriculture | agriculture → barn ✅ | DUPLICATE |
| warehouse | construction | construction → warehouse ✅ | DUPLICATE |
| amphitheatre | writing | writing → amphitheatre ✅ | DUPLICATE |
| brewery (bldg) | agriculture | drama → brewery | WRONG TECH |
| lumberMill | construction | construction → lumberMill ✅ | DUPLICATE |
| smelter | mining | metal → smelter | WRONG TECH |
| observatory | astronomy | astronomy → observatory ✅ | DUPLICATE |
| mint | currency | architecture → mint | WRONG TECH |
| temple | philosophy | philosophy → temple ✅ | DUPLICATE |
| calciner | metallurgy (nonexistent!) | chemistry → calciner | WRONG/MISSING |

## Buildings with no requiredTech, not defaultUnlockable, in science chains (currently broken)

unicornPasture, ziggurat, chapel, steamworks, magneto, tradepost, harbor, quarry, oilWell, factory, chronosphere, reactor, biolab, aiCore, accelerator, zebraOutpost, zebraWorkshop, zebraForge, workshop, smelter (also wrong requiredTech), mint (also wrong requiredTech)

## Implementation Plan

1. Add `readonly unlockable?: boolean` to `BuildingEntry` in buildings.ts
2. In `applyResearch` (science.ts:1186): add a `def.unlocks?.buildings` loop that sets `draft.buildings[name] = { ...existing, unlockable: true }`
3. In `BuildingManager.update()` (buildings.ts:898): replace the requiredTech check with `def.defaultUnlockable === true || entry.unlockable === true`
4. Remove ALL `requiredTech` fields from BUILDING_DEFS (all are covered by science chains)
5. Also remove `readonly requiredTech?: readonly string[]` from `BuildingDef` interface
6. Fix `ivoryTemple`: add `defaultUnlockable: true`

## Key Gotchas

- `BuildingManager.update()` initialises building state entries at line 695 with `{ val: 0, on: 0, unlocked: false }`. After the change, new entries correctly start with `unlockable` absent (not set) — only research will set it to true.
- The `unlocked` field is one-way (never reset). The check `if (!entry || entry.unlocked) continue` already handles this correctly.
- `applyResearch` must guard against missing building state entries (building might not exist in state.buildings if it was never touched).
- `applyResearchPolicy` also has `unlocks.buildings` possibly — check if any policy unlocks buildings. (From the code scan: policies use `unlocks.tech` and `unlocks.upgrades`, not buildings, so no change needed there.)
