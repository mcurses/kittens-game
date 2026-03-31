# Parity Tracker

Tracks implementation coverage against legacy Kittens Game. **This is the authoritative source of truth for what is and isn't done.** Update it whenever items are added or wired. Do not mark an epic "complete" without updating this file.

Last updated: 2026-03-31 (Live parity audit against Year 10527 save: happiness gaps, VSU migration bug, chapel missing, temple happiness effect missing, auto-tick bootstrap bug, UI gaps documented)

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
| **calciner** | ⚠️ | produces `ironPerTickBase`/`titaniumPerTickBase` ✅; missing consumption side: `mineralsPerTickCon` (-1.5), `oilPerTickCon` (-0.024) not implemented (Phase 1 scope) |
| **workshop** (building) | ⚠️ | building def not added; `t1CraftRatio`…`t5CraftRatio` now wired in CRAFT action |
| **observatory** | ✅ | — |
| **brewery** | ✅ | — |
| **mint** | ✅ | — |
| **steamworks** | ❌ | `coalPerTickBase`, `steelPerTickBase`, auto-craft triggers |
| **magneto** | ❌ | `coalPower`, energy net effects |
| **tradepost** | ❌ | `goldPerTickBase`, trade race modifiers |
| **harbor** | ❌ | `boatCapacity`, ship/tanker effects |
| **chapel** | ❌ | `culturePerTickBase` (+0.05), `faithPerTickBase` (+0.005), `cultureMax` (+200) — confirmed 182 built in live save |
| **temple** | ⚠️ | def exists but **missing `happiness` effect**: legacy computes `happiness = 0.4 + 0.1 × sunAltar.on` per temple (= 1.1 with sunAltar=7); 163 temples contributes ~179% happiness, entirely absent from rewrite |
| **spaceport** (bonfire) | ❌ | Bonfire building (val=22 in live save) that enables space programs; separate from space buildings |
| **ziggurat** (building) | ❌ | unicorn production, `unicornsPerTickBase` |
| **unicornPasture** | ✅ | — |
| **chronosphere** | ❌ | time crystal production |
| **reactor** | ❌ | energy, antimatter production |
| **biolab** | ❌ | various bio/biomass effects |
| **aiCore** | ❌ | gflops/hashrates effects |
| **accelerator** | ❌ | unobtainium, antimatter effects |
| **factory** | ❌ | production ratios for many resources |
| **quarry** | ❌ | minerals, titanium from quarrying |
| **oilWell** | ❌ | oilPerTickBase |
| **zebraForge/Outpost/Workshop** | ❌ | zebra trade/diplomacy effects |

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
| `consumableLuxuryHappiness` | science tech | happiness from consumables | ❌ Not consumed |
| `breweryConsumptionRatio` | science tech | brewery tick consumption | ❌ No producer/consumer |
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

## Happiness calculation gaps

Verified via live save audit (Year 10527, 533% legacy happiness vs ~80% rewrite). The formula in `village.ts:updateHappines()` is incomplete. Legacy `VillageManager.updateHappines()` adds four terms the rewrite omits:

| Missing term | Legacy code | Contribution (Year 10527 save) |
|---|---|---|
| **Luxury resource bonus** | `+happinessPerLuxury per non-common resource with value > 0`; base 10 + `luxuryHappinessBonus` effect | ~150–200% — save has 15+ luxury resources |
| **Temple happiness effect** | `happiness = 0.4 + 0.1 × sunAltar.on` per temple (dynamic, computed in `calculateEffects`) | ~179% — 163 temples × 1.1; **also missing from temple building def** |
| **Karma happiness** | `getHappinessFromKarma()` — +1% per karma point | ~117% — 117 karma |
| **Festival bonus** | `+30 × (1 + festivalRatio)` when `festivalDays > 0` | +30–50% when active |

Because happiness multiplies ALL job production (`production = base × count × happiness × (1+jobRatio)`), wrong happiness cascades to wrong production for every worker-based resource.

Additionally: `consumableLuxuryHappiness` (tracked above as ❌ not consumed) is a modifier to the luxury bonus loop, not a separate term.

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
| Buildings (engine defs) | 20 | 35 confirmed | **57%** |
| Resources (declared) | 56 | 56 | 100% |
| Resources (have production) | ~14 | ~40 have natural production | **35%** |
| Upgrade defs | 137 | 137 | 100% |
| Upgrade effects wired | ~13 key types | ~25 key types | **~52%** |
| Tech defs | 61 | 61 | 100% |
| Tech effects wired | most `*Ratio` | most `*Ratio` | **~80%** |
| Craft ratios | 5 tiers | 5 tiers | **100%** |
| Happiness formula terms | 2 of 6 (base + unhappiness) | 6 terms | **33%** |
| Religion UI sections | 2 of 3 (ZU, RU) | 3 (ZU, RU, TU) | **67%** |
| Trade UI detail | name + embassy only | full economics | **~15%** |

---

## Enforcement rules

1. **Do not mark an epic complete without updating this file.** If a building is added, update its row. If an effect key is wired, update its row.
2. **Every new building/upgrade must wire both halves** — producer (def) AND consumer (manager code) — in the same commit. Check by running `grep -rn "effectCache\[" packages/engine/src/` before and after.
3. **`/self-rate` checks this file.** Step 4 of self-rate now includes: verify PARITY.md was updated, spot-check 2 rows against actual code.
4. **`/sanity-check` audits this file.** Step 4 cross-references PARITY.md against legacy to find newly-discovered gaps.
