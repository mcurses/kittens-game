# Parity Tracker

Tracks implementation coverage against legacy Kittens Game. **This is the authoritative source of truth for what is and isn't done.** Update it whenever items are added or wired. Do not mark an epic "complete" without updating this file.

Last updated: 2026-03-30 (Epic 27: amphitheatre, lumberMill, smelter, observatory, brewery, mint, temple, unicornPasture, calciner added; craft tier ratios wired; catnipDemandWorkerRatioGlobal wired)

---

## How to read this

- ✅ Implemented and effect-wired (produces + consumes correct effectCache keys)
- ⚠️ Partially implemented or effect keys produced but not all consumed
- ❌ Not implemented
- N/A Not applicable to this rewrite (UI-only legacy artifacts, deprecated items)

---

## Buildings

Legacy has ~35 gameplay buildings. We have 11.

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
| **temple** | ✅ | — |
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

## Summary counts

| Domain | Implemented | Total legacy | Coverage |
|--------|-------------|--------------|----------|
| Buildings | 20 | ~35 gameplay buildings | **57%** |
| Resources (declared) | 56 | 56 | 100% |
| Resources (have production) | ~14 | ~40 have natural production | **35%** |
| Upgrade defs | 137 | 137 | 100% |
| Upgrade effects wired | ~13 key types | ~25 key types | **~52%** |
| Tech defs | 61 | 61 | 100% |
| Tech effects wired | most `*Ratio` | most `*Ratio` | **~80%** |
| Craft ratios | 5 tiers | 5 tiers | **100%** |

---

## Enforcement rules

1. **Do not mark an epic complete without updating this file.** If a building is added, update its row. If an effect key is wired, update its row.
2. **Every new building/upgrade must wire both halves** — producer (def) AND consumer (manager code) — in the same commit. Check by running `grep -rn "effectCache\[" packages/engine/src/` before and after.
3. **`/self-rate` checks this file.** Step 4 of self-rate now includes: verify PARITY.md was updated, spot-check 2 rows against actual code.
4. **`/sanity-check` audits this file.** Step 4 cross-references PARITY.md against legacy to find newly-discovered gaps.
