# Epic 31 — Missing Buildings (Round 2)

Implement the ~17 buildings that remain ❌ or ⚠️ in PARITY.md after Epic 27. As with Epic 27, every story must wire BOTH halves: the building def (effectCache producer) AND the manager code that consumes those keys. Update PARITY.md after each story.

Legacy reference: `legacy/js/buildings.js` (all defs), `legacy/js/village.js` (job/demand consumers), `legacy/js/resources.js` (perTick calc)

---

## Story 31-01 — Chapel

**Effects produced**: `culturePerTickBase` (+0.05/level), `faithPerTickBase` (+0.005/level), `cultureMax` (+200/level)

**Legacy reference**: `legacy/js/buildings.js` → `chapel`

**Confirmed in live save**: 182 chapels built. Zero culture production in rewrite because chapel is entirely absent.

**ACs**:
- [ ] Building def with correct prices (2000 minerals, 250 culture, 250 faith)
- [ ] `culturePerTickBase` consumed in resource tick calc — culture gets base production
- [ ] `faithPerTickBase` consumed in resource tick calc — faith gets base production from buildings
- [ ] `cultureMax` consumed in resource max calc
- [ ] Test: 1 chapel → culture production > 0, faith production > 0, culture max increases
- [ ] PARITY.md chapel row updated to ✅

---

## Story 31-02 — Workshop (building def)

**Why it exists**: The Workshop building def is missing from `buildings.ts` even though its craft ratio effects are already wired in the CRAFT action. The building itself provides `scienceMax` (+100/level), unlocking research capacity.

**Legacy reference**: `legacy/js/buildings.js` → `workshop`

**ACs**:
- [ ] Building def added with correct prices (100 wood, 400 minerals)
- [ ] `scienceMax` effect wired
- [ ] Test: 1 workshop → science max cap increases by 100
- [ ] PARITY.md workshop row updated from ⚠️ to ✅

---

## Story 31-03 — Steamworks

**Effects produced**: `coalPerTickBase` (base coal production), `steelPerTickBase` (base steel production). Also has auto-craft capability (future concern — skip auto-craft for now, just the production effects).

**Legacy reference**: `legacy/js/buildings.js` → `steamworks`

**ACs**:
- [ ] Building def with correct prices
- [ ] `coalPerTickBase` and `steelPerTickBase` consumed in resource tick calc
- [ ] Test: 1 steamworks → coal per tick > 0, steel per tick > 0
- [ ] PARITY.md steamworks row updated

---

## Story 31-04 — Magneto

**Effects produced**: `coalPower` (energy from coal), `magnetoRatio` (production bonus). Affects energy net calculation.

**Legacy reference**: `legacy/js/buildings.js` → `magneto`

**ACs**:
- [ ] Building def with correct prices
- [ ] `coalPower` consumed in energy calculation (adds to energy supply per magneto on)
- [ ] `magnetoRatio` consumed as a global production multiplier where applicable
- [ ] Test: 1 magneto → energy supply increases
- [ ] PARITY.md magneto row updated

---

## Story 31-05 — Trade Post

**Effects produced**: `goldPerTickBase` (base gold production), plus trade race capacity modifiers.

**Legacy reference**: `legacy/js/buildings.js` → `tradepost`

**ACs**:
- [ ] Building def with correct prices (50 wood, 70 minerals, 5 iron)
- [ ] `goldPerTickBase` consumed in resource tick calc — gold gets base production
- [ ] Test: 1 tradepost → gold per tick > 0
- [ ] PARITY.md tradepost row updated

---

## Story 31-06 — Harbor

**Effects produced**: `boatCapacity` (trade ship capacity), `tankerCapacity`, resource storage bonuses.

**Legacy reference**: `legacy/js/buildings.js` → `harbor`

**ACs**:
- [ ] Building def with correct prices
- [ ] `boatCapacity` and `tankerCapacity` effect keys produced
- [ ] Any storage bonus effects wired to resource max calc
- [ ] Test: 1 harbor → boatCapacity in effectCache > 0
- [ ] PARITY.md harbor row updated

---

## Story 31-07 — Calciner (consumption side)

**Why it exists**: Calciner is ⚠️ — it produces `ironPerTickBase` and `titaniumPerTickBase` but the consumption side (`mineralsPerTickCon: -1.5`, `oilPerTickCon: -0.024`) is not implemented.

**Legacy reference**: `legacy/js/buildings.js` → `calciner` effects

**ACs**:
- [ ] `mineralsPerTickCon` and `oilPerTickCon` effects added to calciner def
- [ ] Both consumed as negative contributions in resource tick calc (subtract from minerals/oil per tick)
- [ ] Test: 1 calciner on → minerals per tick reduced by 1.5, oil per tick reduced by 0.024
- [ ] PARITY.md calciner row updated from ⚠️ to ✅

---

## Story 31-08 — Quarry

**Effects produced**: `mineralsPerTickBase` (direct minerals), `titaniumPerTickBase` (direct titanium)

**Legacy reference**: `legacy/js/buildings.js` → `quarry`

**ACs**:
- [ ] Building def with correct prices
- [ ] `mineralsPerTickBase` and `titaniumPerTickBase` consumed in resource tick calc
- [ ] Test: 1 quarry → minerals per tick > 0, titanium per tick > 0
- [ ] PARITY.md quarry row updated

---

## Story 31-09 — Oil Well

**Effects produced**: `oilPerTickBase` (direct oil production)

**Legacy reference**: `legacy/js/buildings.js` → `oilWell`

**ACs**:
- [ ] Building def with correct prices
- [ ] `oilPerTickBase` consumed in resource tick calc
- [ ] Test: 1 oilWell → oil per tick > 0
- [ ] PARITY.md oilWell row updated

---

## Story 31-10 — Factory

**Effects produced**: Various production ratio modifiers (`woodJobRatio` bonus path, craft output ratios, etc.)

**Legacy reference**: `legacy/js/buildings.js` → `factory`; `legacy/js/village.js` → how factory output is calculated

**ACs**:
- [ ] Building def with correct prices and effect keys
- [ ] All produced effect keys consumed by appropriate managers
- [ ] Test: 1 factory → relevant production ratios in effectCache > 0
- [ ] PARITY.md factory row updated

---

## Story 31-11 — Ziggurat (building)

**Effects produced**: `unicornsPerTickBase` multiplier (each ziggurat increases unicorn production from unicornPasture)

**Legacy reference**: `legacy/js/buildings.js` → `ziggurat`

**ACs**:
- [ ] Building def with correct prices (100 unicorns, etc.)
- [ ] Effect wired so unicornPasture production scales with ziggurat count
- [ ] Test: 1 unicornPasture + 1 ziggurat → more unicorns per tick than 1 unicornPasture alone
- [ ] PARITY.md ziggurat row updated

---

## Story 31-12 — Spaceport (Bonfire building)

**Why it exists**: The spaceport is a bonfire-tab building (not a space building) that gates access to space programs. Live save shows val=22. Without it, space programs may not be launchable.

**Legacy reference**: `legacy/js/buildings.js` → `spaceport` in bonfire section

**ACs**:
- [ ] Building def added to bonfire buildings section
- [ ] Correct prices and any production effects wired
- [ ] Test: spaceport exists in building list and can be purchased
- [ ] PARITY.md spaceport row updated

---

## Story 31-13 — Chronosphere

**Effects produced**: `timeCrystalPerTickBase` (time crystal production)

**Legacy reference**: `legacy/js/buildings.js` → `chronosphere`

**ACs**:
- [ ] Building def with correct prices
- [ ] `timeCrystalPerTickBase` consumed in resource tick calc
- [ ] Test: 1 chronosphere → time crystal per tick > 0
- [ ] PARITY.md chronosphere row updated

---

## Story 31-14 — Reactor

**Effects produced**: `energyProduction` (energy supply), `antimatterPerTickBase`

**Legacy reference**: `legacy/js/buildings.js` → `reactor`

**ACs**:
- [ ] Building def with correct prices
- [ ] Energy production effect wired to energy supply calc
- [ ] `antimatterPerTickBase` consumed in resource tick calc
- [ ] Test: 1 reactor → energy supply and antimatter per tick increase
- [ ] PARITY.md reactor row updated

---

## Story 31-15 — Biolab

**Effects produced**: various bio/biomass effects (cross-reference legacy for exact keys)

**Legacy reference**: `legacy/js/buildings.js` → `biolab`

**ACs**:
- [ ] Building def with correct prices and all effect keys from legacy
- [ ] All produced effects wired end-to-end
- [ ] Test: 1 biolab → relevant effectCache keys > 0
- [ ] PARITY.md biolab row updated

---

## Story 31-16 — AI Core

**Effects produced**: `gflops` (compute power), `hashrate` — affect science production in late game

**Legacy reference**: `legacy/js/buildings.js` → `aiCore`

**ACs**:
- [ ] Building def with correct prices
- [ ] `gflops` and `hashrate` effects wired to science production path
- [ ] Test: 1 aiCore → science production increases
- [ ] PARITY.md aiCore row updated

---

## Story 31-17 — Accelerator, Zebra buildings

**Why grouped**: These are late-game buildings with narrower scope. Accelerator: `unobtainiumPerTickBase`, antimatter effects. Zebra buildings: trade/diplomacy modifiers.

**Legacy reference**: `legacy/js/buildings.js` → `accelerator`, `zebraForge`, `zebraOutpost`, `zebraWorkshop`

**ACs**:
- [ ] Accelerator def with correct prices and unobtainium/antimatter effects wired
- [ ] Zebra building defs with trade/diplomacy effect keys
- [ ] All produced effects have consumers (even if those consumers are stubs)
- [ ] Test: 1 accelerator → relevant resources per tick increase
- [ ] PARITY.md accelerator and zebra rows updated
