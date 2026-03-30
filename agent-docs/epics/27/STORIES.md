# Epic 27 — Building Completeness

Implement the remaining ~24 gameplay buildings from legacy. Each building must wire both halves: the def (which produces effectCache keys) AND the manager code that consumes those keys. Update PARITY.md after each story.

Legacy reference: `legacy/js/buildings.js`, `legacy/js/village.js`, `legacy/test/`

---

## Story 27-01 — Fix catnipDemandRatio consumption

**Why it exists**: Pasture already produces `catnipDemandRatio` (-0.005/pasture) but kitten catnip consumption in VillageManager ignores it. This is a live bug that under-charges kittens for catnip.

**Legacy reference**: `legacy/js/village.js` — `resConsumption *= 1 + getEffect(res.name + "DemandRatio")`

**ACs**:
- [ ] VillageManager kitten consumption loop applies `(1 + effectCache[res + "DemandRatio"])` multiplier
- [ ] Same pattern covers fursDemandRatio, ivoryDemandRatio, spiceDemandRatio for future buildings
- [ ] Test: 3 pastures → catnipDemandRatio = -0.015 → per-kitten catnip consumption reduced by 1.5%
- [ ] PARITY.md `catnipDemandRatio` row updated to ✅

---

## Story 27-02 — Amphitheatre

**Effects produced**: `culturePerTickBase` (+0.01/level), `cultureMax` (+75/level), `unhappinessRatio` (-0.048/level)

**Legacy reference**: `legacy/js/buildings.js` → `amphitheatre` def

**ACs**:
- [ ] Building def with correct prices (400 minerals, 1200 wood, 2 parchment)
- [ ] `culturePerTickBase` consumed in resource tick calc (culture resource gets base production)
- [ ] `cultureMax` consumed in resource storage calc
- [ ] `unhappinessRatio` already consumed in VillageManager (wired 2026-03-30) — verify it works end-to-end
- [ ] Test: 1 amphitheatre → culture production > 0, storage > 0, unhappiness penalty reduced
- [ ] PARITY.md updated

---

## Story 27-03 — Lumber Mill

**Effects produced**: `woodRatio` (+0.1/level — global wood production multiplier)

**Legacy reference**: `legacy/js/buildings.js` → `lumberMill`

**ACs**:
- [ ] Building def with correct prices (100 wood, 50 minerals)
- [ ] `woodRatio` consumer exists (formula: `calcResourcePerTick` reads `${name}Ratio` — verify wood is wired)
- [ ] Test: 1 lumberMill → woodRatio = 0.1 → wood per tick increases by 10%
- [ ] PARITY.md updated

---

## Story 27-04 — Smelter

**Effects produced**: `ironRatio` (+0.5/level), `steelRatio` (+0.15/level), `coalRatio` (+0.1/level)

**Legacy reference**: `legacy/js/buildings.js` → `smelter`

**ACs**:
- [ ] Building def with correct prices (200 minerals)
- [ ] Ratio consumers exist for iron, steel, coal
- [ ] Test: 1 smelter → iron/steel/coal production ratios increase
- [ ] PARITY.md updated

---

## Story 27-05 — Observatory

**Effects produced**: `scienceRatio` (+0.25/level — global science multiplier)

**Legacy reference**: `legacy/js/buildings.js` → `observatory`

**ACs**:
- [ ] Building def with correct prices (50 wood, 25 minerals, 10 iron)
- [ ] `scienceRatio` consumer exists (verify `calcResourcePerTick` wires it for science)
- [ ] Test: 1 observatory → science per tick increases by 25%
- [ ] PARITY.md updated

---

## Story 27-06 — Brewery

**Effects produced**: `happiness` (+0.01/level)

**Legacy reference**: `legacy/js/buildings.js` → `brewery`

**ACs**:
- [ ] Building def with correct prices (50 wood, 75 minerals, 75 catnip)
- [ ] `happiness` consumer exists in VillageManager happiness calc (read path already wired — verify)
- [ ] Test: 1 brewery → happiness increases
- [ ] PARITY.md updated

---

## Story 27-07 — Mint

**Effects produced**: `goldRatio` (+0.02/level)

**Legacy reference**: `legacy/js/buildings.js` → `mint`

**ACs**:
- [ ] Building def with correct prices
- [ ] Gold production path exists or goldRatio produces base gold per tick
- [ ] Test: 1 mint → goldPerTick > 0
- [ ] PARITY.md updated

---

## Story 27-08 — Temple

**Effects produced**: `faithRatio` (+0.1/level), `happiness` (+0.005/level)

**Legacy reference**: `legacy/js/buildings.js` → `temple`

**ACs**:
- [ ] Building def with correct prices (25 slab, 15 plate, 25 scaffold)
- [ ] `faithRatio` consumed in religion faith per-tick calc
- [ ] `happiness` consumed in VillageManager (already wired)
- [ ] Test: 1 temple → faith per tick increases, happiness increases
- [ ] PARITY.md updated

---

## Story 27-09 — Unicorn Pasture

**Effects produced**: `unicornsPerTickBase` (+0.001/level)

**Legacy reference**: `legacy/js/buildings.js` → `unicornPasture`

**ACs**:
- [ ] Building def with correct price (2500 unicorns)
- [ ] Unicorn resource gets production from `unicornsPerTickBase` effectCache key
- [ ] Test: 1 unicorn pasture → unicorns per tick > 0
- [ ] PARITY.md updated

---

## Story 27-10 — Calciner

**Effects produced**: `titaniumRatio` (+0.35/level), `coalRatioGlobal` (+0.15/level)

**Legacy reference**: `legacy/js/buildings.js` → `calciner`

**ACs**:
- [ ] Building def with correct prices (100 steel, 100 titanium, 10 scaffold)
- [ ] Titanium and coal ratio consumers exist
- [ ] PARITY.md updated

---

## Story 27-11 — Craft ratio wiring (T1–T5)

**Why it exists**: The CRAFT action uses hardcoded 1:1 ratios. Workshop upgrades that set `t1CraftRatio`–`t5CraftRatio` have no effect on craft output.

**Legacy reference**: `legacy/js/workshop.js` → `getCraftRatio()`

**ACs**:
- [ ] CRAFT action reads `t1CraftRatio`–`t5CraftRatio` from effectCache and applies to output
- [ ] T1 (beam, slab), T2 (plate, steel, gear), T3 (scaffold, ship), T4 (alloy, eludium), T5 (kerosene)
- [ ] Test: upgrade that sets `t1CraftRatio: 0.5` → beams crafted increase by 50%
- [ ] PARITY.md craft tier rows updated to ✅

---

## Story 27-12 — catnipDemandWorkerRatioGlobal wiring

**Why it exists**: Upgrade `mineralHoes` sets `catnipDemandWorkerRatioGlobal: -0.5`. This should reduce catnip consumption per worker (farmer). Not yet consumed.

**Legacy reference**: `legacy/js/village.js` worker catnip calc

**ACs**:
- [ ] Worker/job catnip consumption reads `catnipDemandWorkerRatioGlobal` from effectCache
- [ ] Test: catnipDemandWorkerRatioGlobal = -0.5 → farmer catnip demand halved
- [ ] PARITY.md updated

---

## Future / deferred stories

The following buildings are mid-to-late-game and depend on resources/systems not yet fully implemented. File as separate stories when prerequisites are met:

- **Steamworks** (27-13): coalPerTickBase, steelPerTickBase, auto-craft triggers — requires coal/steel production pipeline
- **Magneto** (27-14): energy system, coalPower — requires energy net system
- **Tradepost** (27-15): goldPerTickBase, race trade modifiers — requires gold + diplomacy integration
- **Harbor** (27-16): boatCapacity, ship/tanker — requires late-game resource system
- **Ziggurat** (27-17): unicorn sacrifice mechanics, time crystals — requires religion advanced
- **Chronosphere** (27-18): time crystal production — requires time system advanced
- **Reactor** (27-19): energy, antimatter — requires energy system
- **Factory** (27-20): production ratio bonuses — mid-late game
- **Quarry** (27-21): minerals/titanium quarrying
- **Oil Well** (27-22): oilPerTickBase
- **AI Core** (27-23): gflops/hashrates — late game
- **Accelerator** (27-24): unobtainium/antimatter — late game
- **Biolab** (27-25): biomass effects — late game
- **Zebra buildings** (27-26): diplomacy effects — late game
