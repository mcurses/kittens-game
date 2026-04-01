# Epic 30 — Happiness Formula Completeness

**Status:** In Progress
**Started:** 2026-03-31
**Legacy refs:** legacy/js/village.js (updateHappines, getHappinessFromKarma), legacy/js/buildings.js (temple calculateEffects), legacy/js/resources.js (resource luxury flags)

The happiness formula in `village.ts:updateHappines()` is missing four of six terms from legacy. Because happiness is a multiplier on ALL job production (`production = base × count × happiness × (1 + jobRatio)`), wrong happiness cascades directly to wrong production for every worker-based resource. This epic implements all missing terms.

Legacy reference: `legacy/js/village.js` → `updateHappines()`, `getHappinessFromKarma()`, `calcBonus()`; `legacy/js/buildings.js` → temple `calculateEffects()`

Confirmed impact (Year 10527 save): legacy happiness 533% vs rewrite ~80%. The gap is almost entirely these four missing terms.

---

## Story 30-01 — Temple happiness effect

**Why it exists**: The temple building def in `buildings.ts` has `effects: { culturePerTickBase: 0.1, faithMax: 100 }` — no `happiness` effect. Legacy computes it dynamically in `calculateEffects`: `effects["happiness"] = 0.4 + 0.1 * sunAltar.on`. With `sunAltar.on = 7` (Year 10527 save), each temple contributes `1.1` happiness. With 163 temples, that's ~179 happiness points contributed to `effectCache.happiness`.

**Legacy reference**: `legacy/js/buildings.js` → `temple.calculateEffects`

**Fix**: Add a static `happiness` effect to the temple def (or make it dynamic based on `sunAltar.on` in `BuildingManager.updateEffects`). For correctness, it must be dynamic — the value depends on the ZU `sunAltar.on` state.

**ACs**:
- [x] `BuildingManager.updateEffects` computes temple happiness contribution as `(0.4 + 0.1 × sunAltar.on) × temple.on` and adds it to effects
- [x] Reading `sunAltar.on` from `state.religion.zu.sunAltar.on` (or 0 if absent)
- [x] Test: 2 temples, sunAltar.on=3 → effectCache.happiness includes `2 × (0.4 + 0.3) = 1.4`
- [x] Test: 0 temples → no temple happiness contribution
- [x] PARITY.md temple row updated from ⚠️ to ✅

---

## Story 30-02 — Luxury resource happiness bonus

**Why it exists**: Legacy `updateHappines()` adds `+happinessPerLuxury` for each non-common resource that has `value > 0`. `happinessPerLuxury = 10 + getEffect("luxuryHappinessBonus")`. With 15+ luxury resources in the Year 10527 save, this contributes ~150-200 happiness points.

**Legacy reference**: `legacy/js/village.js` → `updateHappines()` luxury loop; `legacy/js/resources.js` → which resources are non-common (fur, ivory, spice, unicorns, alicorn, antimatter, oil, coal, titanium, gold, culture, faith, science, etc.)

**Non-common resources** (produce happiness when > 0): The full list must be cross-referenced with legacy `resource.isLuxury` or `resource.type !== "common"`. Check `legacy/js/resources.js`.

**ACs**:
- [x] `village.ts:updateHappines()` iterates all resources with `value > 0`; for each luxury resource adds `happinessPerLuxury` to happiness percentage
- [x] `happinessPerLuxury` = `10 + (state.effectCache.luxuryHappinessBonus ?? 0)`
- [x] Luxury resource list is defined as a constant (not inline guesswork) and matches legacy
- [x] Test: save with fur=100 (1 luxury resource) → happiness +10
- [x] Test: save with 5 luxury resources > 0 → happiness +50 (with no luxuryHappinessBonus)
- [x] PARITY.md luxury happiness row updated from ❌ to ✅

---

## Story 30-03 — Karma happiness bonus

**Why it exists**: Legacy `getHappinessFromKarma()` returns `+1% per karma point`. Karma comes from resetting (prestige). The Year 10527 save has 117 karma → +117 happiness points, entirely absent from rewrite.

**Legacy reference**: `legacy/js/village.js` → `getHappinessFromKarma()`; `legacy/js/prestige.js` → how karma is stored

**ACs**:
- [x] `village.ts:updateHappines()` adds karma resource value to happiness percentage
- [x] Test: karma=50 → +60 happiness (50 karma bonus + 10 luxury bonus since karma is rare)
- [x] Test: no karma field → no bonus (safe default)
- [x] PARITY.md karma happiness row updated from ❌ to ✅

---

## Story 30-04 — Festival happiness bonus

**Why it exists**: Legacy `updateHappines()` adds `+30 × (1 + festivalRatio)` when `festivalDays > 0`. The calendar slice discards `festivalDays` during migration — it's not preserved. This story adds `festivalDays` to the calendar state so a held festival persists across ticks.

**Legacy reference**: `legacy/js/village.js` → `updateHappines()` festival term; `legacy/js/calendar.js` → how festivalDays decrements per tick

**ACs**:
- [x] `SerializedGameState.calendar` gains optional `festivalDays: number` field
- [x] `CalendarManager.update()` decrements `festivalDays` by 1 per in-game day (when > 0)
- [x] `village.ts:updateHappines()` adds `30 × (1 + (state.effectCache.festivalRatio ?? 0))` when `state.calendar.festivalDays > 0`
- [x] `CalendarState` includes `festivalDays` as required field, persisted through save/load
- [x] Test: festivalDays=5, no festivalRatio → +30 happiness
- [x] Test: festivalDays=0 → no bonus
- [x] Test: CalendarManager tick with festivalDays=5 → festivalDays becomes 4 after 1 day
- [x] PARITY.md festival bonus row updated from ❌ to ✅

---

## Story 30-05 — Wire breweryConsumptionRatio and consumableLuxuryHappiness

**Why it exists**: Two effect keys produced by upgrades/techs have no consumers. `breweryConsumptionRatio` should reduce brewery catnip consumption per tick. `consumableLuxuryHappiness` is a modifier to the luxury bonus loop (from Story 30-02) that allows upgrades to increase happiness-per-luxury.

**Legacy reference**: `legacy/js/village.js` → brewery consumption code; `updateHappines()` luxury loop

**ACs**:
- [x] `breweryConsumptionRatio` applied to brewery catnip/spice consumption in `BuildingManager.updateEffects`
- [x] `consumableLuxuryHappiness` read in the luxury happiness loop for uncommon resources
- [x] Test: breweryConsumptionRatio=0.5 → brewery consumes 50% more catnip (ratio scales consumption)
- [x] Test: consumableLuxuryHappiness=5 → uncommon luxury resources give 15 happiness each (base 10 + 5)
- [x] PARITY.md rows for both keys updated to ✅
