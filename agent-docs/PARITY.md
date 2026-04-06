# Parity Tracker

Tracks implementation coverage against legacy Kittens Game. **This is the authoritative source of truth for what is and isn't done.** Update it whenever items are added or wired. Do not mark an epic "complete" without updating this file.

Last updated: 2026-04-06 (Epic 43 closed — harbor cargoShips/barges, oil well pumpjack, reactor coldFusion, and mint frugality modifiers now consume workshop effects to scale runtime behavior dynamically)

---

## How to read this

- ✅ Implemented and effect-wired (produces + consumes correct effectCache keys)
- ⚠️ Partially implemented or effect keys produced but not all consumed
- ❌ Not implemented
- N/A Not applicable to this rewrite (UI-only legacy artifacts, deprecated items)

---

## Buildings

Legacy has 35+ gameplay buildings (confirmed via live save audit). We have 39 defined in `buildings.ts` (covers all legacy buildings; ivoryTemple base-mode only, spaceport deferred as staged upgrade).

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
| **smelter** | ⚠️ | Story 34-03/34-04: base autoproduction/consumption and legacy toggle controls are wired. Remaining gaps: stock-limited action scaling, iron-will autoshutdown, and exact conversion-side behavior are not fully ported. |
| **calciner** | ✅ | produces `ironPerTickBase`/`titaniumPerTickBase`; consumes `mineralsPerTickCon` (-1.5), `oilPerTickCon` (-0.024) — Story 31-07, 2026-03-31 |
| **workshop** (building) | ✅ | building def added; `craftRatio: 0.06` per on — Story 31-02, 2026-03-31 |
| **observatory** | ✅ | — |
| **brewery** | ✅ | — |
| **mint** | ✅ | dynamic `mintRatio` now consumes `frugality` upgrade, `mintIvoryRatio` producer wired but consumer deferred — Story 43-04, 2026-04-06 |
| **steamworks** | ⚠️ | Story 34-03/34-05: dynamic `coalRatioGlobal`, `magnetoBoostRatio`, `manuscriptPerTickProd`, persisted automation state, yearly automation batching, autumn `advancedAutomation` cadence, jam state, and web controls are now wired. Remaining gaps: offline catch-up `daysOffset` parity and any factory-coupled automation nuances still deferred under Epic 34. |
| **magneto** | ✅ | `oilPerTick: -0.05`, `energyProduction: 5`, `magnetoRatio: 0.02` — Story 31-04, 2026-03-31 |
| **tradepost** | ✅ | `fursDemandRatio: -0.04`, `ivoryDemandRatio: -0.04`, `spiceDemandRatio: -0.04`, `tradeRatio: 0.015` — Story 31-05, 2026-03-31 |
| **harbor** | ✅ | 7 resource storage boosts (catnipMax 2500, woodMax 700, etc.) wired statically (Story 31-06), plus dynamic `cargoShips` and `barges` multipliers now consuming `harborRatio` and `harborCoalRatio` workshop effects with limited DR support (Story 43-01, 2026-04-06) |
| **chapel** | ✅ | `culturePerTickBase: 0.05`, `faithPerTickBase: 0.005`, `cultureMax: 200` — Story 31-01, 2026-03-31 |
| **temple** | ✅ | dynamic happiness wired: `happiness = 0.4 + 0.1 × sunAltar.on` per temple.on (Story 30-01, 2026-03-31) |
| **spaceport** (bonfire) | ❌ | Stage 1 of warehouse building in legacy — complex staged upgrade, deferred |
| **ziggurat** (building) | ✅ | `cultureMaxRatio: 0.08` per on — Story 31-11, 2026-03-31 |
| **unicornPasture** | ✅ | — |
| **chronosphere** | ✅ | `temporalParadoxChance: 0.01`, `resStasisRatio: 0.015`, `energyConsumption: 20` — Story 31-13, 2026-03-31 |
| **reactor** | ✅ | base effects: `uraniumPerTick: -0.001`, `productionRatio: 0.05`, `uraniumMax: 250`, `energyProduction: 10` (Story 31-14, 2026-03-31), plus dynamic `coldFusion` energy multiplier consuming `reactorEnergyRatio` workshop effect, and partial `thoriumReactors` behavior (Story 43-03, 2026-04-06) |
| **biolab** | ✅ | `scienceRatio: 0.35`, `refineRatio: 0.1`, `scienceMax: 1500` — Story 31-15, 2026-03-31 |
| **aiCore** | ✅ | `gflopsPerTickBase: 0.02`, `energyConsumption: 2` — Story 31-16, 2026-03-31 |
| **accelerator** | ✅ | `titaniumPerTickCon: -0.015`, `uraniumPerTickAutoprod: 0.0025`, `energyConsumption: 2` — Story 31-17, 2026-03-31 |
| **factory** | ✅ | Story 34-06: legacy carbon-sequestration mode is wired end-to-end. Factory now defaults into the high-energy / low-pollution path when researched, falls back to capped-pollution mode when disabled, persists automation state, exposes engine-backed UI controls, and applies the `factoryLogistics` `craftRatio` bump. |
| **quarry** | ✅ | `mineralsRatio: 0.35`, `coalPerTickBase: 0.015` — Story 31-08, 2026-03-31 |
| **oilWell** | ✅ | base production: `oilPerTickBase: 0.02`, `oilMax: 1500` (Story 31-09, 2026-03-31), plus dynamic `pumpjack` production multiplier and automation state consuming `oilWellRatio` workshop effect (Story 43-02, 2026-04-06) |
| **zebraForge/Outpost/Workshop** | ⚠️ | Effects correct but unlock chain broken: legacy requires zebraUpgrade prerequisites (`darkRevolution`→zebraOutpost, `bloodstoneInstitute`→zebraWorkshop, `whispers`→ivoryTemple); our rewrite uses `unlockRatio: 0.01` only. Also missing `zebraPreparations` effect key and `bloodstoneRatio` dynamic effect on zebraWorkshop. |
| **ivoryTemple** | ⚠️ | Building added 2026-04-01 with base-mode effects (ivoryPerTickCon: -100, mineralsPerTickProd: 1, manpowerMax: 10). Dynamic `whispers`-enhanced mode (double rates + titaniumPerTickCon + alicornPerTickCon + tMythrilPerTick) not yet implemented — deferred as it requires zebraUpgrade subsystem. |

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
| `barnRatio` | workshop upgrades | storage-building `catnipMax` / `woodMax` / `mineralsMax` / `ironMax` calculation in BuildingManager | ✅ Fixed 2026-04-06 |
| `warehouseRatio` | workshop upgrades | storage-building `woodMax` / `mineralsMax` / `ironMax` / `coalMax` / `titaniumMax` / `goldMax` calculation in BuildingManager | ✅ Fixed 2026-04-06 |
| `harborRatio` | workshop upgrade `cargoShips` | harbor storage cap scaling with limited DR in BuildingManager | ✅ Wired 2026-04-06 (Story 43-01) |
| `harborCoalRatio` | workshop upgrade `barges` | harbor `coalMax` additional multiplier in BuildingManager | ✅ Wired 2026-04-06 (Story 43-01) |
| `harborLimitRatioPolicy` | science tech (policy) | ship-count DR limit calculation for `harborRatio` scaling | ✅ Wired 2026-04-06 (Story 43-01) |
| `shipLimit` | science tech | ship-count DR limit base effect | ✅ Wired 2026-04-06 (Story 43-01) |
| `oilWellRatio` | workshop upgrade `pumpjack` | oil well production scaling via `oilPerTickBase` in BuildingManager | ✅ Wired 2026-04-06 (Story 43-02) |
| `reactorEnergyRatio` | workshop upgrade `coldFusion` | reactor energy production scaling via `energyProduction` in BuildingManager | ✅ Wired 2026-04-06 (Story 43-03) |
| `reactorThoriumPerTick` | workshop upgrade `thoriumReactors` | thorium consumption rate in reactor behavior (deferred: manpower scaling not yet implemented) | ⚠️ Producer wired 2026-04-06, consumer partial (Story 43-03) |
| `mintRatio` | science tech `frugality` | mint output scaling via `goldMax` production multiplier in BuildingManager | ✅ Wired 2026-04-06 (Story 43-04) |
| `mintIvoryRatio` | science tech (spider ivory bonus) | ivory output scaling in mint behavior (deferred: consumer not yet implemented) | ⚠️ Producer exists, consumer missing (Story 43-04) |
| `unhappinessRatio` | amphitheatre building | village happiness penalty | ✅ Producer and consumer wired 2026-03-30 |
| `woodRatio` | lumberMill building | wood per-tick calc via `calcResourcePerTick` | ✅ Producer and consumer wired 2026-03-30 |
| `scienceRatio` | library, academy, observatory buildings | science per-tick calc | ✅ Producer and consumer wired 2026-03-30 |
| `ironRatio` | smelter building | iron per-tick calc via `calcResourcePerTick` | ✅ Producer and consumer wired 2026-03-30 |
| `ironPerTickAutoprod` | smelter, calciner | resource per-tick calc via `calcResourcePerTick` | ✅ Story 34-02 consumer added 2026-04-01 |
| `coalPerTickAutoprod` | smelter | resource per-tick calc via `calcResourcePerTick` | ✅ Story 34-02 consumer added 2026-04-01 |
| `goldPerTickAutoprod` | smelter | resource per-tick calc via `calcResourcePerTick` | ✅ Story 34-02 consumer added 2026-04-01 |
| `titaniumPerTickAutoprod` | smelter, calciner, accelerator | resource per-tick calc via `calcResourcePerTick` | ✅ Story 34-02 consumer added 2026-04-01 |
| `manuscriptPerTickProd` | steamworks | resource per-tick calc | ✅ Story 34-02 consumer added 2026-04-01 |
| `unicornsPerTickBase` | unicornPasture building | unicorn per-tick base production | ✅ Producer and consumer wired 2026-03-30 |
| `catnipDemandWorkerRatioGlobal` | "assistance" upgrade | per-worker catnip demand reduction in VillageManager | ✅ Consumer wired 2026-03-30 |

---

## Resources

The rewrite declares the gameplay resource pools it actually simulates in `RESOURCE_NAMES`. Legacy's transient `kittens` display alias is intentionally excluded and modeled through `village` instead. Many declared resources still have 0 production because the buildings that generate them are not all implemented yet.

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

### Population/resource modeling

Legacy still has a transient `kittens` entry in `resPool`, but `game.update()` immediately overwrites it from village population every tick (`value = village.getKittens()`, `maxValue = village.sim.maxKittens`). It behaves as a display alias, not an independently simulated stockpile.

✅ Fixed in Epic 40: the rewrite now keeps kitten population authoritative in `village`, excludes `"kittens"` from generic resource ticking/storage semantics, drops stale serialized `resources.kittens` payloads during load, and prevents the web resource table from rendering a `kittens` row. Population-dependent gameplay checks now read village population instead of a drifting resource alias.

### Resource cap baseline gap

Legacy starts with non-zero base storage from `buildings.js` `effectsBase`, even before any storage buildings are bought:
- `catnipMax: 5000`
- `woodMax: 200`
- `mineralsMax: 250`
- `coalMax: 60`
- `ironMax: 50`
- `titaniumMax: 2`
- `goldMax: 10`
- `oilMax: 1500`
- `uraniumMax: 250`
- `unobtainiumMax: 150`
- `antimatterMax: 100`
- `manpowerMax: 100`
- `scienceMax: 250`
- `cultureMax: 100`
- `faithMax: 100`

✅ Fixed in Epic 35 prerequisite: `BuildingManager.updateEffects()` now seeds `effectCache` with `effectsBase` values (catnipMax:5000, woodMax:200, mineralMax:400, cultureMax:100, etc.) before building contributions, matching legacy `buildings.js` `effectsBase`. Fresh-game storage now starts at legacy-faithful baseline values.

✅ Fixed in Epic 21-06: temporary challenge caps are no longer sticky saved state. `ResourceManager` now derives `maxValue` from the current effect cache instead of falling back to serialized `resource.maxValue`, and server save-load now sanitizes loaded resource caps immediately. This fixes live-save cases where unicorns stayed capped at `10` after `unicornTears` was no longer active.

✅ Fixed in Epic 42: action responses now sanitize loaded resource caps immediately too. After `BUY_BUILDING` and `PURCHASE_UPGRADE`, the store rebuilds `effectCache` and then resyncs `resources[*].maxValue`, so storage-cap changes are visible without waiting for a separate load path.

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

## Policy (isRelation) parity — lizard/shark names wrong

Deep audit found 5 of the 6 lizard/shark relation policies use invented names with empty effects. Correct legacy names and effects:

| Our name (wrong) | Legacy name (correct) | Effects |
|---|---|---|
| `lizardRelationsGeologists` | `lizardRelationsPriests` | `cultureFromManuscripts: -0.25`, `faithFromManuscripts: 1` |
| `lizardRelationsEngineeers` | `lizardRelationsDiplomats` | `neutralRaceEmbassyStanding: 0.001` |
| `sharkRelationsRaiders` | `sharkRelationsScribes` | `parchmentTradeChanceIncrease: 0.25`, `manuscriptTradeChanceIncrease: 0.15`, `ironBuyRatioIncrease: 0.5` |
| `sharkRelationsScientists` | `sharkRelationsMerchants` | `tradeRatio: 0` (dynamic) |
| `sharkRelationsSmugglers` | `sharkRelationsBotanists` | `refinePolicyRatio: 0.25`, `woodRatio: 0` (dynamic per ironWill) |
| `lizardRelationsEcologists` | `lizardRelationsEcologists` ✅ | effects `{}` in our code, should be `cathPollutionRatio: -0.05`, `hydroPlantRatio: 0`; blocks array also wrong |

Status: ❌ Not fixed — all `blocks:` arrays reference the wrong names, creating a broken mutual-exclusion graph.

---

## Zebra upgrade subsystem (zebraUpgrades)

Legacy `workshop.js` has a separate `zebraUpgrades[]` array with 5 entries that gate zebra building unlocks and festival modifiers. Not present in our rewrite at all.

| Upgrade | Prices | Unlocks | Status |
|---|---|---|---|
| `darkRevolution` | bloodstone×15, science×100 | zebraOutpost building | ❌ |
| `darkBrew` | bloodstone×1, parchment×3000, science×100 | festival modifier (doubles zebra arrivals) | ❌ |
| `whispers` | tMythril×5 | ivoryTemple building | ❌ |
| `minerologyDepartment` | science×75000, compedium×75 | academy building, unlocks bloodstoneInstitute | ❌ |
| `bloodstoneInstitute` | science×85000, blueprint×50, bloodstone×25, tMythril×10 | zebraWorkshop building | ❌ |

The zebraUpgrades panel is only shown when `zebraWorkshop.val > 0`. Entries gate via `zebraRequired` (zebra count) instead of standard affordability checks.

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
| **Caravan quantity buttons** | ✅ Fixed in Epic 38-01: trade shortcuts now compute from live `maxTradeAmt` like legacy, render dynamic `×floor(max/2)` and `×floor(max/5)` amounts, and stay hidden until the legacy `50` / `25` affordability thresholds are met. Residual divergence: the legacy `usePercentageConsumptionValues` label mode is not modeled because that global option does not exist in the rewrite. |
| **Leviathan energy display** | Energy: 69/140, Time to leave: 47y 257d ❌ Not implemented. |

---

## Space UI gaps

| Gap | Detail |
|-----|--------|
| **Mission done state** | ✅ Fixed 2026-04-01 (Epic 32-06): Programs with `val > 0` show "Reached" badge instead of "Launch" button. |
| **Building on/off display** | ✅ Fixed 2026-04-01 (Epic 32-06): Space buildings now show `on/val` ratio when `on < val`. |
| **Hide complete missions toggle** | ✅ Fixed in Epic 35-03: SpacePanel now exposes `usePersistentUiState("space:hideComplete")` toggle; programs with `val > 0` are filtered when enabled, and reload restoration is now covered by a dedicated regression test plus explicit boolean validation. |

---

## Buildings UI gaps

| Gap | Detail |
|-----|--------|
| **Enable/disable controls** | ✅ Story 37-01/37-04: building controls now distinguish legacy count-adjustable vs binary modes. Smelter-style buildings use `- / -25 / -All / + / +25 / +All`, while binary `On/Off` remains only on `togglableOnOff` buildings such as steamworks. |
| **on/off state not displayed** | ✅ Fixed 2026-04-01 (Epic 32-04): BuildingsPanel now shows `on/val` when `on < val`. |
| **Internal names in UI** | ✅ Fixed 2026-04-01 (Epic 32-04): `prettifyName()` splits camelCase → Title Case ("Lumber Mill", "Log House"). |
| **Building rename system missing** | Late-game upgrades rename buildings in legacy (Solar Farm, Hydro Plant, etc.). Rewrite shows prettified base names only. ❌ Not yet implemented. |

---

## Production / Automation Gaps

| Gap | Detail |
|-----|--------|
| **Smelter runtime parity** | Story 34-03 wired base autoproduction/consumption, but legacy still scales output by available wood/minerals per active smelter and has iron-will auto-disable behavior. ❌ Not fully implemented. |
| **Steamworks automation** | Story 34-05 implemented the live tick loop: yearly automation by default, autumn extra batch with `advancedAutomation`, persisted `jammed` / `automationEnabled` state, and engine-backed controls. Remaining gap: legacy offline `daysOffset` batching is not modeled separately. ⚠️ Partial. |
| **Factory automation mode** | ✅ Fixed in Story 34-06. `carbonSequestration` now changes factory mode, doubles energy use when enabled, shifts pollution prod/con behavior, persists state, and is controllable from the web UI through engine-backed actions. |

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

## Workshop / Science UI QoL gaps

| Gap | Detail |
|-----|--------|
| **Craft shortcuts are not legacy-faithful** | ✅ Fixed in Epic 35-01: `computeCraftShortcuts` computes `[max(1,1%), max(25,5%), max(100,10%), All]` from live resources. Percentage-mode label toggle (legacy `usePercentageConsumptionValues` setting) is deferred. |
| **Craft bonus/source-material affordance missing** | Legacy craft controls show output after craft bonus in button title and compute tooltip costs per shortcut. ❌ Not implemented. |
| **Workshop craft effectiveness header missing** | ✅ Fixed in Epic 35-01: WorkshopPanel shows `+N% effectiveness` banner when `effectCache.craftRatio > 0`. |
| **Hide researched toggle missing in Workshop** | ✅ Fixed in Epic 35-03: WorkshopPanel exposes `usePersistentUiState("workshop:hideResearched")` checkbox; researched upgrades are filtered when enabled, and stored values now restore correctly after reload. |
| **Hide researched toggle missing in Science** | ✅ Fixed in Epic 35-03: SciencePanel exposes `usePersistentUiState("science:hideResearched")` checkbox; researched techs are filtered when enabled, and stored values now restore correctly after reload. |
| **Storage-limited priced actions were not distinguished from ordinary unaffordability** | ✅ Fixed in Epic 35-05: client resource extraction now preserves `maxValue`; shared `isStorageLimited()` logic marks storage-limited controls separately from normal disabled actions. Wired into Buildings, Science, Workshop, Space, Time, and Religion, with inspector price-line highlighting for the capped resource. |
| **Mechanization craft details missing** | Legacy mechanization UI exposes per-craft engineer allocation, progress percentage, tier bonus, and throughput/countdown. Epic 39-01 added the engine prerequisite: `engineer` village jobs plus per-craft assignment state/actions and persistence. The richer workshop UI is still missing. ⚠️ Partial. |

---

## Resource UI QoL gaps

| Gap | Detail |
|-----|--------|
| **maxValue = 0 for all resources** | ✅ Fixed 2026-04-01 (Epic 32-08): Resources with `maxValue = 0` no longer show `/0.00`. Storage caps from buildings (barn, warehouse, harbor) now display correctly since all buildings were added in Epic 31. |
| **catnipDemandRatio display** | ✅ Fixed 2026-04-01 (Epic 32-08): Catnip row shows demand reduction percentage badge when `catnipDemandRatio < 0`. |
| **Main resource table vs craft table split missing** | Legacy moves dual resources like blueprint into the lower craft table once their recipe unlocks. Rewrite uses one flat resource list in [ResourcePanel.tsx](/Users/max/code/kittens-mcp/packages/client-web/src/ResourcePanel.tsx#L97) and a separate workshop craft list with no migration logic. ❌ Not implemented. |
| **Resource visibility editing missing** | Legacy allows hiding/showing resource rows from the left panel; rewrite has no equivalent per-resource visibility control. ❌ Not implemented. |
| **Domain-specific resource tooltips replaced by generic inspector** | The inspector adds useful ETAs, but legacy resource tooltips are still richer in domain-specific contexts like crafting and dual-table placement. Rewrite has not reached parity there. ⚠️ Partial. |

---

## Summary counts

| Domain | Implemented | Total legacy | Coverage |
|--------|-------------|--------------|----------|
| Buildings (engine defs) | 36 | 36 (ivoryTemple base mode ⚠️) | **~97%** (ivoryTemple enhanced mode + spaceport deferred) |
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
