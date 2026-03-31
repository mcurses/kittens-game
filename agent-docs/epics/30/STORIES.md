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
- [ ] `BuildingManager.updateEffects` computes temple happiness contribution as `(0.4 + 0.1 × sunAltar.on) × temple.on` and adds it to effects
- [ ] Reading `sunAltar.on` from `state.religion.zu.sunAltar.on` (or 0 if absent)
- [ ] Test: 2 temples, sunAltar.on=3 → effectCache.happiness includes `2 × (0.4 + 0.3) = 1.4`
- [ ] Test: 0 temples → no temple happiness contribution
- [ ] PARITY.md temple row updated from ⚠️ to ✅

---

## Story 30-02 — Luxury resource happiness bonus

**Why it exists**: Legacy `updateHappines()` adds `+happinessPerLuxury` for each non-common resource that has `value > 0`. `happinessPerLuxury = 10 + getEffect("luxuryHappinessBonus")`. With 15+ luxury resources in the Year 10527 save, this contributes ~150-200 happiness points.

**Legacy reference**: `legacy/js/village.js` → `updateHappines()` luxury loop; `legacy/js/resources.js` → which resources are non-common (fur, ivory, spice, unicorns, alicorn, antimatter, oil, coal, titanium, gold, culture, faith, science, etc.)

**Non-common resources** (produce happiness when > 0): The full list must be cross-referenced with legacy `resource.isLuxury` or `resource.type !== "common"`. Check `legacy/js/resources.js`.

**ACs**:
- [ ] `village.ts:updateHappines()` iterates all resources with `value > 0`; for each luxury resource adds `happinessPerLuxury` to happiness percentage
- [ ] `happinessPerLuxury` = `10 + (state.effectCache.luxuryHappinessBonus ?? 0)`
- [ ] Luxury resource list is defined as a constant (not inline guesswork) and matches legacy
- [ ] Test: save with fur=100 (1 luxury resource) → happiness +10
- [ ] Test: save with 5 luxury resources > 0 → happiness +50 (with no luxuryHappinessBonus)
- [ ] PARITY.md luxury happiness row updated from ❌ to ✅

---

## Story 30-03 — Karma happiness bonus

**Why it exists**: Legacy `getHappinessFromKarma()` returns `+1% per karma point`. Karma comes from resetting (prestige). The Year 10527 save has 117 karma → +117 happiness points, entirely absent from rewrite.

**Legacy reference**: `legacy/js/village.js` → `getHappinessFromKarma()`; `legacy/js/prestige.js` → how karma is stored

**ACs**:
- [ ] `village.ts:updateHappines()` adds `state.prestige.karma ?? 0` to happiness percentage
- [ ] `SerializedGameState` prestige slice gains optional `karma: number` field
- [ ] `legacy-migration.ts` maps `save.prestige.karmaKittens` (legacy field) to `prestige.karma`
- [ ] Test: karma=50 → +50 happiness
- [ ] Test: no karma field → no bonus (safe default)
- [ ] PARITY.md karma happiness row updated from ❌ to ✅

---

## Story 30-04 — Festival happiness bonus

**Why it exists**: Legacy `updateHappines()` adds `+30 × (1 + festivalRatio)` when `festivalDays > 0`. The calendar slice discards `festivalDays` during migration — it's not preserved. This story adds `festivalDays` to the calendar state so a held festival persists across ticks.

**Legacy reference**: `legacy/js/village.js` → `updateHappines()` festival term; `legacy/js/calendar.js` → how festivalDays decrements per tick

**ACs**:
- [ ] `SerializedGameState.calendar` gains optional `festivalDays: number` field
- [ ] `CalendarManager.update()` decrements `festivalDays` by 1 per tick (when > 0)
- [ ] `village.ts:updateHappines()` adds `30 × (1 + (state.effectCache.festivalRatio ?? 0))` when `state.calendar.festivalDays > 0`
- [ ] `legacy-migration.ts` maps `calendar.festivalDays` if present (may be 0 or absent in most saves)
- [ ] Test: festivalDays=5, no festivalRatio → +30 happiness
- [ ] Test: festivalDays=0 → no bonus
- [ ] Test: CalendarManager tick with festivalDays=3 → festivalDays becomes 2
- [ ] PARITY.md festival bonus row updated from ❌ to ✅

---

## Story 30-05 — Wire breweryConsumptionRatio and consumableLuxuryHappiness

**Why it exists**: Two effect keys produced by upgrades/techs have no consumers. `breweryConsumptionRatio` should reduce brewery catnip consumption per tick. `consumableLuxuryHappiness` is a modifier to the luxury bonus loop (from Story 30-02) that allows upgrades to increase happiness-per-luxury.

**Legacy reference**: `legacy/js/village.js` → brewery consumption code; `updateHappines()` luxury loop

**ACs**:
- [ ] `breweryConsumptionRatio` applied to brewery catnip consumption in `ResourceManager` (or wherever brewery consumes catnip per tick)
- [ ] `consumableLuxuryHappiness` read in the luxury happiness loop: `happinessPerLuxury = 10 + (effectCache.luxuryHappinessBonus ?? 0) + (effectCache.consumableLuxuryHappiness ?? 0)`
- [ ] Test: breweryConsumptionRatio=0.5 → brewery consumes 50% less catnip
- [ ] Test: consumableLuxuryHappiness=5 → luxury resources give 15 happiness each (base 10 + 5)
- [ ] PARITY.md rows for both keys updated to ✅
