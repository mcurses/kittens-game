# Epic 36 — Building Unlock Architecture

Separate the two concepts that legacy models as distinct steps:

- **unlockable**: research (or default) has granted permission for the building to exist
- **unlocked**: the player currently meets the resource-threshold reveal rule, so the building becomes visible

The rewrite collapses these into a single `unlocked` flag plus ad-hoc `requiredTech` patches, producing the whole class of unicornPasture-style misses where buildings never appear because neither mechanism fires correctly.

Legacy references:
- `legacy/js/buildings.js:2578` — reveal logic (unlockRatio resource-threshold check)
- `legacy/game.js:5348` — science sets building unlockable when tech resolves

---

## Story 36-01 — Add `unlockable` to building state and seed defaults

**Why it exists**: The engine needs a stable field to record "research has granted permission." Without it, every fix is a patch on the wrong abstraction.

**ACs**:
- [x] `BuildingState` gains `unlockable?: boolean`
- [x] `BuildingManager` initialises `unlockable = true` for every building def that has `defaultUnlockable: true`
- [x] Buildings without `defaultUnlockable` start with `unlockable` absent/false
- [x] Existing buildings that already have `unlocked: true` in state are unaffected (no migration needed — in-dev saves are disposable)
- [x] Unit tests: defaultUnlockable buildings start with `unlockable: true`; non-default buildings start without it

---

## Story 36-02 — Wire science.ts to set `unlockable` on research completion

**Why it exists**: When a tech is researched, legacy sets the building to unlockable (`legacy/game.js:5348`). The rewrite currently sets `unlocked = true` directly, skipping the resource-threshold gate.

**ACs**:
- [x] `applyResearch` (and `applyResearchPolicy` where relevant) sets `building.unlockable = true` for every entry in `def.unlocks.buildings`, matching legacy
- [x] `applyResearch` no longer sets `building.unlocked = true` directly for any building
- [x] Unit tests:
  - researching `animal` sets `unicornPasture.unlockable = true` (not `unlocked`)
  - researching `construction` sets `ziggurat.unlockable = true`
  - researching `brewing` sets `brewery.unlockable = true`

---

## Story 36-03 — Update reveal logic to use the two-step check

**Why it exists**: `BuildingManager.updateBuildings()` (buildings.ts ~line 880) must apply the unlockRatio resource-threshold rule only to buildings that are unlockable, and flip `unlocked = true` when the threshold is met — matching `legacy/js/buildings.js:2578`.

**ACs**:
- [x] Reveal condition: `(def.defaultUnlockable || entry.unlockable) && resourceThresholdMet` → set `unlocked = true`
- [x] Buildings that are not unlockable are never revealed regardless of resources
- [x] `unlocked` is never reset to `false` once set (legacy behaviour — buildings don't hide after you spend resources)
- [x] Unit tests:
  - building with `defaultUnlockable: true` and sufficient resources → `unlocked = true`
  - building with `unlockable: true` (set by research) and sufficient resources → `unlocked = true`
  - building with `unlockable: false/absent` and sufficient resources → stays `unlocked: false`
  - building with `unlockable: true` but insufficient resources → stays `unlocked: false`

---

## Story 36-04 — Retire duplicated `requiredTech` gates

**Why it exists**: Several building defs carry `requiredTech` as a workaround for the collapsed unlock model. Now that science.ts owns the unlockable step, those duplicates should be removed. Only buildings whose defs truly own their own gate (not covered by any tech's `unlocks.buildings`) should keep `requiredTech`.

**ACs**:
- [x] Audit every `requiredTech` field in `buildings.ts` against the `unlocks.buildings` entries in `science.ts`
- [x] Remove `requiredTech` from any building def where a tech's `unlocks.buildings` already covers it
- [x] Keep `requiredTech` only for buildings with no corresponding science unlock entry
- [x] All previously-passing unlock tests still pass after removal
- [x] No regressions in building visibility for buildings that had `requiredTech` removed

---

## Story 36-05 — Regression tests for representative cases

**Why it exists**: The two-step model needs end-to-end fixture tests that will catch any future regression to the collapsed single-flag approach.

**ACs**:
- [x] Test: `animal` tech → `unicornPasture` appears once resources meet threshold
- [x] Test: `construction` tech → `ziggurat` appears once resources meet threshold
- [x] Test: `brewing` tech → `brewery` appears once resources meet threshold
- [x] Test: `catnipField` (defaultUnlockable) → visible from game start once resources met, no research required
- [x] Test: building not yet unlockable → stays hidden even with all resources
- [x] Tests live in `packages/engine/src/buildings.test.ts`

---

## Story 36-06 — Replay building unlockable state on save load

**Why it exists**: Legacy does not save `unlockable`; it reconstructs building permission from researched tech unlocks on load. Existing rewrite saves can therefore drift stale and keep buildings hidden even when the research grant and reveal threshold are already satisfied.

**ACs**:
- [x] Given a serialized save where `construction` is researched and current `beam`/`slab` already satisfy the warehouse reveal threshold, when the store loads that save, then `warehouse` is immediately visible without re-researching `construction`
- [x] Given any researched tech with `unlocks.buildings`, when `ScienceManager.load()` runs, then the corresponding buildings regain `unlockable = true` in loaded state
- [x] Given the full server deserialize path, when a stale save is loaded, then replayed building unlockability is not lost and threshold-based reveal runs against the replayed permission
- [x] Regression tests cover the real `GameStateStore.init()` path and name the missing building keys explicitly on failure

### Legacy Reference
- `legacy/js/science.js:2349-2357`
- `legacy/game.js:5336-5352`
- `legacy/js/buildings.js:2578-2606`

### Status: [x] Tests | [x] Impl | [ ] Rated

## Fix Results — 2026-04-08

- `ScienceManager.load()` now replays `tech.unlocks.buildings` into `building.unlockable`, matching legacy `game.unlock()` behavior on load.
- `GameStateStore._fullDeserialize()` now runs the building reveal pass once after manager load replay so buildings whose resource thresholds are already met become visible immediately in loaded saves.
- New regressions cover both the isolated replay (`construction -> warehouse.unlockable`) and the full stale-save load path (`warehouse` visible when `beam`/`slab` thresholds are already met).
- A practical replay of the current exported `slot=new` payload now restores `warehouse` as `{ unlocked: true, unlockable: true }`.
