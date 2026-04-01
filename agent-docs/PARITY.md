# Parity Tracker

Tracks implementation coverage against legacy Kittens Game. **This is the authoritative source of truth for what is and isn't done.** Update it whenever items are added or wired. Do not mark an epic "complete" without updating this file.

Last updated: 2026-04-01 (Post-Epic 33 production/control audit — added building enable/disable actions + UI controls, smelter autoproduction/consumption, and corrected overstated smelter/steamworks/factory parity claims)

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
| **smelter** | ⚠️ | Base autoproduction/consumption and client on/off controls added 2026-04-01. Remaining gaps: legacy stock-limited action scaling, iron-will autoshutdown, and exact conversion-side behavior are not fully ported. |
| **calciner** | ✅ | produces `ironPerTickBase`/`titaniumPerTickBase`; consumes `mineralsPerTickCon` (-1.5), `oilPerTickCon` (-0.024) — Story 31-07, 2026-03-31 |
| **workshop** (building) | ✅ | building def added; `craftRatio: 0.06` per on — Story 31-02, 2026-03-31 |
| **observatory** | ✅ | — |
| **brewery** | ✅ | — |
| **mint** | ✅ | — |
| **steamworks** | ⚠️ | Dynamic `coalRatioGlobal`, `magnetoBoostRatio`, and `manuscriptPerTickProd` now produce real resources. Remaining gaps: factory automation / jam logic / delayed batch crafting. |
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
| **factory** | ⚠️ | Base `craftRatio` / `energyConsumption` wired. Remaining gaps: carbon-sequestration automation mode, pollution mode switching, and automation state UI/controls. |
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
| `ironPerTickAutoprod` | smelter, calciner | resource per-tick calc via `calcResourcePerTick` | ✅ Consumer added 2026-04-01 |
| `coalPerTickAutoprod` | smelter | resource per-tick calc via `calcResourcePerTick` | ✅ Consumer added 2026-04-01 |
| `goldPerTickAutoprod` | smelter | resource per-tick calc via `calcResourcePerTick` | ✅ Consumer added 2026-04-01 |
| `titaniumPerTickAutoprod` | smelter, calciner, accelerator | resource per-tick calc via `calcResourcePerTick` | ✅ Consumer added 2026-04-01 |
| `manuscriptPerTickProd` | steamworks | resource per-tick calc | ✅ Consumer added 2026-04-01 |
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
| coal | ✅ | ⚠️ | geologist job produces it; smelter autoprod now exists, steamworks automation path still missing |
| iron | ✅ | ⚠️ | smelter autoprod now exists, but exact legacy conversion throttling is still partial |
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
| **Cryptotheology / TU section** | ✅ Fixed 2026-04-01 (Epic 32-01): TU section added below Transcendence button with BUY_TRANSCENDENCE_UPGRADE buttons and done state. |
| **Praise/Adore multipliers** | ✅ Fixed 2026-04-01 (Epic 32-03): faithRatio multiplier badge shown next to Praise button. |
| **One-time RU upgrades show "Buy"** | ✅ Fixed 2026-04-01 (Epic 32-02): RU upgrades with val ≥ 1 now show "Done" instead of "Buy". |
| **Marker fill % not shown** | Legacy shows "Marker [18%]" indicating partial fill. Rewrite shows "Marker ×27" with no fill indicator. ❌ Not yet implemented. |

---

## Trade UI gaps

| Gap | Detail |
|-----|--------|
| **Buy/sell economics** | ✅ Fixed 2026-04-01 (Epic 32-05): Per-race buys (resource + cost) and sells (resource names) displayed inline. |
| **Relationship status** | ✅ Fixed 2026-04-01 (Epic 32-05): Hostile/Neutral/Friendly badge derived from `race.standing`. |
| **SEND_EMBASSY/TRADE field name bug** | ✅ Fixed 2026-04-01: was dispatching `race:` field, now correctly dispatches `name:` per engine `GameAction` type. |
| **Caravan quantity buttons** | ×366 / ×916 / all send buttons ❌ Not implemented. |
| **Leviathan energy display** | Energy: 69/140, Time to leave: 47y 257d ❌ Not implemented. |

---

## Space UI gaps

| Gap | Detail |
|-----|--------|
| **Mission done state** | ✅ Fixed 2026-04-01 (Epic 32-06): Programs with `val > 0` show "Reached" badge instead of "Launch" button. |
| **Building on/off display** | ✅ Fixed 2026-04-01 (Epic 32-06): Space buildings now show `on/val` ratio when `on < val`. |

---

## Buildings UI gaps

| Gap | Detail |
|-----|--------|
| **Enable/disable controls** | ✅ Fixed 2026-04-01: BuildingsPanel now exposes `On` / `Off` controls only for legacy-toggleable buildings, backed by engine + API actions. |
| **on/off state not displayed** | ✅ Fixed 2026-04-01 (Epic 32-04): BuildingsPanel now shows `on/val` when `on < val`. |
| **Internal names in UI** | ✅ Fixed 2026-04-01 (Epic 32-04): `prettifyName()` splits camelCase → Title Case ("Lumber Mill", "Log House"). |
| **Building rename system missing** | Late-game upgrades rename buildings in legacy (Solar Farm, Hydro Plant, etc.). Rewrite shows prettified base names only. ❌ Not yet implemented. |

---

## Production / Automation Gaps

| Gap | Detail |
|-----|--------|
| **Smelter runtime parity** | Base autoproduction/consumption is now wired, but legacy scales output by available wood/minerals per active smelter and has iron-will auto-disable behavior. ❌ Not fully implemented. |
| **Steamworks automation** | Legacy `factoryAutomation` auto-crafts beam/slab/plate with jam/delay behavior. Rewrite has no equivalent action loop or automation state. ❌ Not implemented. |
| **Factory automation mode** | Legacy `carbonSequestration` changes factory automation state, doubles energy use when enabled, and changes pollution behavior. Rewrite only has static craft/energy effects. ❌ Not implemented. |

---

## Village / Jobs UI gaps

| Gap | Detail |
|-----|--------|
| **Happiness % not shown** | ✅ Fixed 2026-04-01 (Epic 32-07): JobsPanel now shows `Happiness: N%`. |
| **Festival duration not shown** | ✅ Fixed 2026-04-01 (Epic 32-07): JobsPanel shows `Festival: Nd remaining` when `festivalDays > 0`. |
| **Hold Festival action** | ✅ Fixed 2026-04-01 (Epic 32-07): Hold Festival button added to JobsPanel. |
| **Management actions missing** | Send hunters ×N, Manage Jobs, Promote kittens, Unwrap present box ❌ Not implemented. |
| **Individual kitten census missing** | Legacy has full census (579 kittens by name, age, job, skills, rank). ❌ Not in rewrite. |
| **Loadouts system missing** | Legacy has named job loadout presets. ❌ Not in rewrite. |
| **Kittens capacity wrong** | All buildings are now implemented (Epic 31) so housing caps should be correct. ✅ Resolved. |

---

## Resource sidebar gaps

| Gap | Detail |
|-----|--------|
| **maxValue = 0 for all resources** | ✅ Fixed 2026-04-01 (Epic 32-08): Resources with `maxValue = 0` no longer show `/0.00`. Storage caps from buildings (barn, warehouse, harbor) now display correctly since all buildings were added in Epic 31. |
| **catnipDemandRatio display** | ✅ Fixed 2026-04-01 (Epic 32-08): Catnip row shows demand reduction percentage badge when `catnipDemandRatio < 0`. |

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
| Religion UI sections | 3 of 3 (ZU, RU, TU) | 3 (ZU, RU, TU) | **100%** |
| Trade UI detail | name + embassy + economics + relationship | full economics | **~60%** |

---

## Enforcement rules

1. **Do not mark an epic complete without updating this file.** If a building is added, update its row. If an effect key is wired, update its row.
2. **Every new building/upgrade must wire both halves** — producer (def) AND consumer (manager code) — in the same commit. Check by running `grep -rn "effectCache\[" packages/engine/src/` before and after.
3. **`/self-rate` checks this file.** Step 4 of self-rate now includes: verify PARITY.md was updated, spot-check 2 rows against actual code.
4. **`/sanity-check` audits this file.** Step 4 cross-references PARITY.md against legacy to find newly-discovered gaps.
