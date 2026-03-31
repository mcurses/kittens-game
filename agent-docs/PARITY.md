# Parity Tracker

Tracks implementation coverage against legacy Kittens Game. **This is the authoritative source of truth for what is and isn't done.** Update it whenever items are added or wired. Do not mark an epic "complete" without updating this file.

Last updated: 2026-03-31 (Epic 31: all 18 missing buildings added — chapel, workshop, steamworks, magneto, tradepost, harbor, quarry, oilWell, factory, ziggurat, chronosphere, reactor, biolab, aiCore, accelerator, zebraOutpost/Workshop/Forge; calciner consumption side wired; buildings coverage 57% → 100%)

---

## How to read this

- ✅ Implemented and effect-wired (produces + consumes correct effectCache keys)
- ⚠️ Partially implemented or effect keys produced but not all consumed
- ❌ Not implemented
- N/A Not applicable to this rewrite (UI-only legacy artifacts, deprecated items)

---

## Buildings

Legacy has 35 gameplay buildings (confirmed via live save audit). We have 20 defined in `buildings.ts`.

| Building | Status | Missing effect wiring |
|----------|--------|-----------------------|
| field | ✅ | — |
| pasture | ✅ | — |
| aqueduct | ✅ | — |
| hut | ✅ | — |
| logHouse | ✅ | — |
| mansion | ✅ | — |
| library | ✅ | — |
| academy | ✅ | — |
| mine | ✅ | — |
| barn | ✅ | — |
| warehouse | ✅ | — |
| **amphitheatre** | ✅ | — |
| **lumberMill** | ✅ | — |
| **smelter** | ✅ | — |
| **calciner** | ✅ | produces `ironPerTickBase`/`titaniumPerTickBase`; consumes `mineralsPerTickCon` (-1.5), `oilPerTickCon` (-0.024) — Story 31-07, 2026-03-31 |
| **workshop** (building) | ✅ | building def added; `craftRatio: 0.06` per on — Story 31-02, 2026-03-31 |
| **observatory** | ✅ | — |
| **brewery** | ✅ | — |
| **mint** | ✅ | — |
| **steamworks** | ✅ | `energyProduction: 1`, `magnetoBoostRatio: 0.15`, `coalRatioGlobal: -0.8` — Story 31-03, 2026-03-31 |
| **magneto** | ✅ | `oilPerTick: -0.05`, `energyProduction: 5`, `magnetoRatio: 0.02` — Story 31-04, 2026-03-31 |
| **tradepost** | ✅ | `fursDemandRatio: -0.04`, `ivoryDemandRatio: -0.04`, `spiceDemandRatio: -0.04`, `tradeRatio: 0.015` — Story 31-05, 2026-03-31 |
| **harbor** | ✅ | 7 resource storage boosts (catnipMax 2500, woodMax 700, etc.) — Story 31-06, 2026-03-31 |
| **chapel** | ✅ | `culturePerTickBase: 0.05`, `faithPerTickBase: 0.005`, `cultureMax: 200` — Story 31-01, 2026-03-31 |
| **temple** | ✅ | dynamic happiness wired: `happiness = 0.4 + 0.1 × sunAltar.on` per temple.on (Story 30-01, 2026-03-31) |
| **spaceport** (bonfire) | ❌ | Stage 1 of warehouse building in legacy — complex staged upgrade, deferred |
| **ziggurat** (building) | ✅ | `cultureMaxRatio: 0.08` per on — Story 31-11, 2026-03-31 |
| **unicornPasture** | ✅ | — |
| **chronosphere** | ✅ | `temporalParadoxChance: 0.01`, `resStasisRatio: 0.015`, `energyConsumption: 20` — Story 31-13, 2026-03-31 |
| **reactor** | ✅ | `uraniumPerTick: -0.001`, `productionRatio: 0.05`, `uraniumMax: 250`, `energyProduction: 10` — Story 31-14, 2026-03-31 |
| **biolab** | ✅ | `scienceRatio: 0.35`, `refineRatio: 0.1`, `scienceMax: 1500` — Story 31-15, 2026-03-31 |
| **aiCore** | ✅ | `gflopsPerTickBase: 0.02`, `energyConsumption: 2` — Story 31-16, 2026-03-31 |
| **accelerator** | ✅ | `titaniumPerTickCon: -0.015`, `uraniumPerTickAutoprod: 0.0025`, `energyConsumption: 2` — Story 31-17, 2026-03-31 |
| **factory** | ✅ | `craftRatio: 0.05`, `energyConsumption: 2` — Story 31-10, 2026-03-31 |
| **quarry** | ✅ | `mineralsRatio: 0.35`, `coalPerTickBase: 0.015` — Story 31-08, 2026-03-31 |
| **oilWell** | ✅ | `oilPerTickBase: 0.02`, `oilMax: 1500` — Story 31-09, 2026-03-31 |
| **zebraForge/Outpost/Workshop** | ✅ | `hunterRatio`, `catpowerMax`, `tMythrilCraftRatio` — Story 31-17, 2026-03-31 |

---

## Effect key wiring status

Keys that exist in effectCache from implemented defs but are not fully consumed:

| Key | Set by | Should be consumed in | Status |
|-----|--------|-----------------------|--------|
| `catnipDemandRatio` | pasture building | kitten catnip consumption in VillageManager | ✅ Fixed 2026-03-30 |
| `fursDemandRatio` | (future buildings) | kitten furs consumption | ⚠️ Consumer wired 2026-03-30, no producer yet |
| `ivoryDemandRatio` | (future buildings) | kitten ivory consumption | ⚠️ Consumer wired 2026-03-30, no producer yet |
| `spiceDemandRatio` | (future buildings) | kitten spice consumption | ⚠️ Consumer wired 2026-03-30, no producer yet |
| `happiness` | brewery, temple buildings | village happiness calc | ✅ Producer and consumer wired 2026-03-30 |
| `luxuryDemandRatio` | science tech | luxury consumption | ❌ Not consumed |
| `consumableLuxuryHappiness` | science tech | happiness bonus for uncommon resources | ✅ Consumed in VillageManager luxury loop (Story 30-06, 2026-03-31) |
| `breweryConsumptionRatio` | science tech | brewery tick consumption | ✅ Consumed in BuildingManager brewery block (Story 30-05, 2026-03-31) |
| `kittenGrowthRatio` | (future upgrades) | kittens per tick (consumer wired in VillageManager:update) | ⚠️ Consumer wired, no producer |
| `*PriceRatio` (per-building) | future buildings/upgrades | getBuildingPrice | ✅ Consumer wired |
| `priceRatio` | prestige perks | getBuildingPrice | ✅ Fixed 2026-03-30 |
| `woodJobRatio` | workshop upgrades | VillageManager job production | ✅ Fixed 2026-03-30 |
| `catnipJobRatio` | workshop upgrades | VillageManager job production | ✅ Fixed 2026-03-30 |
| `catpowerJobRatio` | workshop upgrades | VillageManager job production | ✅ Fixed 2026-03-30 |
| `unhappinessRatio` | amphitheatre building | village happiness penalty | ✅ Producer and consumer wired 2026-03-30 |
| `woodRatio` | lumberMill building | wood per-tick calc via `calcResourcePerTick` | ✅ Producer and consumer wired 2026-03-30 |
| `scienceRatio` | library, academy, observatory buildings | science per-tick calc | ✅ Producer and consumer wired 2026-03-30 |
| `ironRatio` | smelter building | iron per-tick calc via `calcResourcePerTick` | ✅ Producer and consumer wired 2026-03-30 |
| `unicornsPerTickBase` | unicornPasture building | unicorn per-tick base production | ✅ Producer and consumer wired 2026-03-30 |
| `catnipDemandWorkerRatioGlobal` | "assistance" upgrade | per-worker catnip demand reduction in VillageManager | ✅ Consumer wired 2026-03-30 |

---

## Resources

All 56 resources from legacy are declared in `RESOURCE_NAMES`. However, most have 0 production because the buildings that generate them aren't implemented.

| Resource | Declared | Has production path | Notes |
|----------|----------|---------------------|-------|
| catnip | ✅ | ✅ | fields + farmer job |
| wood | ✅ | ✅ | woodcutter job |
| minerals | ✅ | ✅ | miner job |
| science | ✅ | ✅ | scholar job + library/academy |
| catpower | ✅ | ✅ | hunter job |
| faith | ✅ | ✅ | priest job + religion |
| coal | ✅ | ⚠️ | geologist job produces it; smelter/steamworks (missing) boost it |
| iron | ✅ | ⚠️ | crafted from minerals; smelter (missing) ratio |
| culture | ✅ | ✅ | amphitheatre + temple produce via culturePerTickBase |
| gold | ✅ | ⚠️ | goldMax from mint, but no goldPerTickBase producer yet |
| oil | ✅ | ❌ | no producer — oilWell (missing) |
| unicorns | ✅ | ✅ | unicornPasture produces via unicornsPerTickBase |
| iron | ✅ | ✅ | crafted + smelter ironRatio boost |
| titanium | ✅ | ⚠️ | calciner produces ironPerTickBase/titaniumPerTickBase; no ratio yet |
| (all others) | ✅ | ⚠️/❌ | see building gaps above |

---

## Upgrade effects (all in UPGRADE_DEFS)

All 137 upgrade definitions are implemented and their effects are put into effectCache by `WorkshopManager.updateEffects`. Whether those effects actually do anything depends on consumers existing.

| Effect category | Consumer exists | Notes |
|-----------------|-----------------|-------|
| `*JobRatio` (woodJobRatio, catnipJobRatio, etc.) | ✅ | Fixed 2026-03-30; VillageManager reads from effectCache |
| `*Ratio` for resources (woodRatio, scienceRatio, etc.) | ✅ | `calcResourcePerTick` reads `${name}Ratio`; just needs buildings that produce the ratio |
| crafting ratios (`t1CraftRatio`…`t5CraftRatio`) | ✅ | CRAFT action now reads tier ratio from effectCache (2026-03-30) |
| `catnipDemandWorkerRatioGlobal` | ✅ | VillageManager now applies discount to assigned worker kittens (2026-03-30) |
| `globalResourceRatio` | ❌ | Not consumed |
| `corruptionRatio` | ❌ | Not consumed (diplomacy corruption) |
| `pactsAvailable` | ❌ | Not consumed (religion pacts) |
| `mausoleumBonus` | ❌ | Not consumed |

---

## Tech effects (all in TECH_DEFS)

All 61 tech definitions are implemented. Most effects feed into the same `calcResourcePerTick` pattern and work automatically once the buildings that produce the base values exist.

---

## CRAFT action — missing craft ratio

The CRAFT action uses hardcoded 1:1 ratios. Legacy applies `t1CraftRatio` through `t5CraftRatio` to crafting output. Not implemented.

| Tier | Resources | Status |
|------|-----------|--------|
| T1 | beam, slab, plate, parchment | ✅ t1CraftRatio applied 2026-03-30 |
| T2 | steel, scaffold, kerosene, manuscript | ✅ t2CraftRatio applied 2026-03-30 |
| T3 | gear, ship, compedium, blueprint | ✅ t3CraftRatio applied 2026-03-30 |
| T4 | concrate, alloy | ✅ t4CraftRatio applied 2026-03-30 |
| T5 | eludium, tanker, bloodstone | ✅ t5CraftRatio applied 2026-03-30 |

---

## ~~Happiness calculation gaps~~ ✅ Fixed 2026-03-31 (Epic 30)

All six happiness formula terms are now implemented in `village.ts:updateHappines()`:

| Term | Legacy code | Status |
|---|---|---|
| **Base (100) + unhappiness** | `100 - overPop * 2 * (1 + unhappinessRatio)` | ✅ Wired since Epic 21 |
| **Building happiness effect** | `getEffect("happiness")` | ✅ Wired (brewery, temple contribute) |
| **Luxury resource bonus** | `+happinessPerLuxury per non-common resource with value > 0` | ✅ Fixed Story 30-02 |
| **Temple dynamic happiness** | `happiness = 0.4 + 0.1 × sunAltar.on` per temple.on | ✅ Fixed Story 30-01 |
| **Karma happiness** | `getHappinessFromKarma()` — +1% per karma | ✅ Fixed Story 30-03 |
| **Festival bonus** | `+30 × (1 + festivalRatio)` when `festivalDays > 0` | ✅ Fixed Story 30-04 |

Additionally: `consumableLuxuryHappiness` (bonus for uncommon resources in luxury loop) and `breweryConsumptionRatio` are now consumed.

---

## ~~Engine bootstrap bug: auto-tick not starting after save import~~ ✅ Fixed 2026-03-31

Root cause: `SessionRegistry.getOrCreate()` called `init()` but not `startAutoTick()` for slots created at runtime. Any slot first accessed via an HTTP request (not present at server startup) never ticked.

**Fix (Epic 29-02)**: `getOrCreate()` now calls `startAutoTick()` immediately after `init()`. All slots begin ticking as soon as they are first accessed, regardless of whether the server was just started or the slot was created mid-session.

Note: effectCache is still recomputed from scratch on import. The first tick may use a partially stale effectCache (job ratios correct, but happiness may be 1.0 until after first tick completes). This corrects itself after the first tick cycle.

---

## ~~VSU migration bug: unlocked:false~~ ✅ Fixed 2026-03-31

Root cause: `legacy-migration.ts:migrateTime()` used `bool(item.unlocked)` which defaulted to `false` when legacy saves omit the `unlocked` field on built items.

**Fix (Epic 29-01)**: `migrateTime()` now uses `bool(item.unlocked) || num(item.val) > 0` for both CFU and VSU items. A built item (val > 0) is self-evidently unlocked.

---

## Religion UI gaps

| Gap | Detail |
|-----|--------|
| **Cryptotheology / TU section missing** | Legacy shows a "Cryptotheology" section with Black Obelisk, Black Nexus, Black Core, Event Horizon, Black Library. Rewrite Religion tab ends at Transcendence Tier — no TU rendering at all. Confirmed: save has Black Obelisk val:1. |
| **Marker fill % not shown** | Legacy shows "Marker [18%]" indicating partial fill. Rewrite shows "Marker ×27" with no fill indicator. |
| **Praise/Adore multipliers hidden** | Legacy shows "Praise the sun! [+254.178K%]" and "Adore the galaxy [×144]". Rewrite buttons have no multiplier info. |
| **One-time RU upgrades show "Buy"** | SolarRevolution(×1), Apocrypha(×1), Transcendence(×1) should show as "Done" not "Buy". |

---

## Trade UI gaps

The rewrite Trade tab shows race name + embassy level + two buttons only. Legacy shows:

| Missing | Detail |
|---------|--------|
| **Buy/sell economics** | Per-race: what resources they buy (with cost), what they sell (with quantity ranges) |
| **Relationship status** | Neutral / Friendly / Hostile shown per race |
| **Caravan quantity buttons** | ×366 / ×916 / all send buttons |
| **Leviathan energy display** | Energy: 69/140, Time to leave: 47y 257d |

---

## Space UI gaps

| Gap | Detail |
|-----|--------|
| **Mission done state** | All missions show "Launch" regardless of whether planet is reached. Redmoon (MoonOutpost:67, MoonBase:52 built) should show as reached, not launchable. |
| **Building on/off display** | ContainmentChamber shows "12" not "9/12" (9 active). No on/off toggle for any space building. |

---

## Buildings UI gaps

| Gap | Detail |
|-----|--------|
| **on/off state not displayed** | `on` field exists in state but not shown. Legacy shows "9/12" for buildings with on≠val, "A" marker for automatable, "on" for automation-active. |
| **Building rename system missing** | Late-game upgrades rename buildings in legacy. Rewrite always shows base names: Pasture (not Solar Farm), Aqueduct (not Hydro Plant), Library (not Data Center), Amphitheatre (not Broadcast Tower). |
| **Internal names in UI** | Buildings display as camelCase keys (`LumberMill`, `LogHouse`, `UnicornPasture`) instead of human-readable labels. |

---

## Village / Jobs UI gaps

| Gap | Detail |
|-----|--------|
| **Happiness % not shown** | Legacy Dominion tab shows "Happiness: 533%". Rewrite Jobs tab has no happiness display. |
| **Festival duration not shown** | Legacy shows "Festival duration 172d". Not in rewrite. |
| **Management actions missing** | Send hunters ×N, Hold Festival, Manage Jobs, Promote kittens, Unwrap present box — none in rewrite Jobs tab. |
| **Individual kitten census missing** | Legacy has full census (579 kittens by name, age, job, skills, rank). Not in rewrite. |
| **Loadouts system missing** | Legacy has named job loadout presets. Not in rewrite. |
| **Kittens capacity wrong** | Rewrite shows 579/562 (over capacity) vs legacy 579/579. Missing building housing contributions from unimplemented buildings cause lower maxKittens. |

---

## Resource sidebar gaps

| Gap | Detail |
|-----|--------|
| **maxValue = 0 for all resources** | Storage caps are not computed from buildings. All resources show `/0.00`. Root cause: missing buildings (barn, warehouse, harbour, etc. don't have complete storage effect wiring; some storage-providing buildings entirely absent). |
| **catnipDemandRatio display** | Legacy shows catnip with `[-15%]` suffix indicating demand reduction. Rewrite shows raw perTick only. |

---

## Summary counts

| Domain | Implemented | Total legacy | Coverage |
|--------|-------------|--------------|----------|
| Buildings (engine defs) | 35 | 35 confirmed | **100%** (spaceport deferred — is a warehouse stage) |
| Resources (declared) | 56 | 56 | 100% |
| Resources (have production) | ~14 | ~40 have natural production | **35%** |
| Upgrade defs | 137 | 137 | 100% |
| Upgrade effects wired | ~13 key types | ~25 key types | **~52%** |
| Tech defs | 61 | 61 | 100% |
| Tech effects wired | most `*Ratio` | most `*Ratio` | **~80%** |
| Craft ratios | 5 tiers | 5 tiers | **100%** |
| Happiness formula terms | 6 of 6 (base, unhappiness, building happiness, luxury loop, karma, festival) | 6 terms | **100%** |
| Religion UI sections | 2 of 3 (ZU, RU) | 3 (ZU, RU, TU) | **67%** |
| Trade UI detail | name + embassy only | full economics | **~15%** |

---

## Enforcement rules

1. **Do not mark an epic complete without updating this file.** If a building is added, update its row. If an effect key is wired, update its row.
2. **Every new building/upgrade must wire both halves** — producer (def) AND consumer (manager code) — in the same commit. Check by running `grep -rn "effectCache\[" packages/engine/src/` before and after.
3. **`/self-rate` checks this file.** Step 4 of self-rate now includes: verify PARITY.md was updated, spot-check 2 rows against actual code.
4. **`/sanity-check` audits this file.** Step 4 cross-references PARITY.md against legacy to find newly-discovered gaps.
