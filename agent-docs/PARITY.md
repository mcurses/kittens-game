# Parity Tracker

Tracks implementation coverage against legacy Kittens Game. **This is the authoritative source of truth for what is and isn't done.** Update it whenever items are added or wired. Do not mark an epic "complete" without updating this file.

Last updated: 2026-03-30 (catnipDemandRatio fixed; fursDemandRatio/ivoryDemandRatio/spiceDemandRatio consumers wired)

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
| **amphitheatre** | ❌ | `unhappinessRatio`, `culturePerTickBase`, `cultureMax` |
| **lumberMill** | ❌ | `woodRatio` (woodcutter yield multiplier beyond jobRatio) |
| **smelter** | ❌ | `ironRatio`, `steelRatio`, `coalRatio` |
| **calciner** | ❌ | `titaniumRatio`, `coalRatioGlobal` |
| **workshop** (building) | ❌ | crafting efficiency — `t1CraftRatio`…`t5CraftRatio` |
| **observatory** | ❌ | `scienceRatio` (global science multiplier) |
| **brewery** | ❌ | `happiness` bonus |
| **mint** | ❌ | `goldRatio` |
| **steamworks** | ❌ | `coalPerTickBase`, `steelPerTickBase`, auto-craft triggers |
| **magneto** | ❌ | `coalPower`, energy net effects |
| **tradepost** | ❌ | `goldPerTickBase`, trade race modifiers |
| **harbor** | ❌ | `boatCapacity`, ship/tanker effects |
| **temple** | ❌ | `faithRatio`, `happiness` |
| **ziggurat** (building) | ❌ | unicorn production, `unicornsPerTickBase` |
| **unicornPasture** | ❌ | `unicornsPerTickBase` |
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
| `happiness` | (future brewery/temple) | village happiness calc (read path exists, value always 0) | ⚠️ Consumer wired, no producer |
| `luxuryDemandRatio` | science tech | luxury consumption | ❌ Not consumed |
| `consumableLuxuryHappiness` | science tech | happiness from consumables | ❌ Not consumed |
| `breweryConsumptionRatio` | science tech | brewery tick consumption | ❌ No producer/consumer |
| `kittenGrowthRatio` | (future upgrades) | kittens per tick (consumer wired in VillageManager:update) | ⚠️ Consumer wired, no producer |
| `*PriceRatio` (per-building) | future buildings/upgrades | getBuildingPrice | ✅ Consumer wired |
| `priceRatio` | prestige perks | getBuildingPrice | ✅ Fixed 2026-03-30 |
| `woodJobRatio` | workshop upgrades | VillageManager job production | ✅ Fixed 2026-03-30 |
| `catnipJobRatio` | workshop upgrades | VillageManager job production | ✅ Fixed 2026-03-30 |
| `manpowerJobRatio` | workshop upgrades | VillageManager job production | ✅ Fixed 2026-03-30 |
| `unhappinessRatio` | (future amphitheatre) | village happiness penalty | ✅ Consumer wired 2026-03-30, no producer yet |
| `woodRatio` | (future lumberMill) | wood per-tick calc via `calcResourcePerTick` | ⚠️ Consumer wired via formula, no producer yet |
| `scienceRatio` | (future observatory) | science per-tick calc | ⚠️ Consumer wired via formula, no producer yet |

---

## Resources

All 56 resources from legacy are declared in `RESOURCE_NAMES`. However, most have 0 production because the buildings that generate them aren't implemented.

| Resource | Declared | Has production path | Notes |
|----------|----------|---------------------|-------|
| catnip | ✅ | ✅ | fields + farmer job |
| wood | ✅ | ✅ | woodcutter job |
| minerals | ✅ | ✅ | miner job |
| science | ✅ | ✅ | scholar job + library/academy |
| manpower | ✅ | ✅ | hunter job |
| faith | ✅ | ✅ | priest job + religion |
| coal | ✅ | ⚠️ | geologist job produces it; smelter/steamworks (missing) boost it |
| iron | ✅ | ⚠️ | crafted from minerals; smelter (missing) ratio |
| culture | ✅ | ❌ | no producer — amphitheatre (missing) |
| gold | ✅ | ❌ | no producer — tradepost/mint (missing) |
| oil | ✅ | ❌ | no producer — oilWell (missing) |
| unicorns | ✅ | ❌ | no producer — unicornPasture (missing) |
| (all others) | ✅ | ⚠️/❌ | see building gaps above |

---

## Upgrade effects (all in UPGRADE_DEFS)

All 137 upgrade definitions are implemented and their effects are put into effectCache by `WorkshopManager.updateEffects`. Whether those effects actually do anything depends on consumers existing.

| Effect category | Consumer exists | Notes |
|-----------------|-----------------|-------|
| `*JobRatio` (woodJobRatio, catnipJobRatio, etc.) | ✅ | Fixed 2026-03-30; VillageManager reads from effectCache |
| `*Ratio` for resources (woodRatio, scienceRatio, etc.) | ✅ | `calcResourcePerTick` reads `${name}Ratio`; just needs buildings that produce the ratio |
| crafting ratios (`t1CraftRatio`…`t5CraftRatio`) | ❌ | CRAFT action doesn't use effectCache yet |
| `catnipDemandWorkerRatioGlobal` | ❌ | Not consumed anywhere |
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
| T1 | beam, slab | ❌ ratio not applied |
| T2 | plate, steel, gear | ❌ ratio not applied |
| T3 | scaffold, ship | ❌ ratio not applied |
| T4 | alloy, eludium | ❌ ratio not applied |
| T5 | kerosene | ❌ ratio not applied |

---

## Summary counts

| Domain | Implemented | Total legacy | Coverage |
|--------|-------------|--------------|----------|
| Buildings | 11 | ~35 gameplay buildings | **31%** |
| Resources (declared) | 56 | 56 | 100% |
| Resources (have production) | ~10 | ~40 have natural production | **25%** |
| Upgrade defs | 137 | 137 | 100% |
| Upgrade effects wired | ~10 key types | ~25 key types | **~40%** |
| Tech defs | 61 | 61 | 100% |
| Tech effects wired | most `*Ratio` | most `*Ratio` | **~80%** |
| Craft ratios | 0 | 5 tiers | **0%** |

---

## Enforcement rules

1. **Do not mark an epic complete without updating this file.** If a building is added, update its row. If an effect key is wired, update its row.
2. **Every new building/upgrade must wire both halves** — producer (def) AND consumer (manager code) — in the same commit. Check by running `grep -rn "effectCache\[" packages/engine/src/` before and after.
3. **`/self-rate` checks this file.** Step 4 of self-rate now includes: verify PARITY.md was updated, spot-check 2 rows against actual code.
4. **`/sanity-check` audits this file.** Step 4 cross-references PARITY.md against legacy to find newly-discovered gaps.
