# Epic: 31 — Notes

## Legacy Behavior Summary

Buildings still missing from `buildings.ts` as of Epic 30 (see PARITY.md):

### Simple static-effect buildings

- **workshop** (building): `craftRatio: 0.06` per val. Prices: wood 100, minerals 400. priceRatio 1.15. defaultUnlockable, unlockRatio 0.0025. Unlocks workshop tab + time queue source "upgrades".
- **chapel**: `culturePerTickBase: 0.05`, `faithPerTickBase: 0.005`, `cultureMax: 200`. Non-atheism challenge only for faithPerTickBase. Prices: minerals 2000, culture 250, parchment 250. priceRatio 1.15.
- **tradepost**: `fursDemandRatio: -0.04`, `ivoryDemandRatio: -0.04`, `spiceDemandRatio: -0.04`, `tradeRatio: 0.015`. Prices: wood 500, minerals 200, gold 10. priceRatio 1.15. unlockRatio 0.3.
- **quarry**: `mineralsRatio: 0.35`, `coalPerTickBase: 0.015`, `uraniumPerTickBase: 0` (orbital geodesy), `cathPollutionPerTickProd: 0.25`. Prices: slab 1000, steel 125, scaffold 50. priceRatio 1.15. unlockRatio 0.3.
- **oilWell**: `oilPerTickBase: 0.02`, `oilMax: 1500`. Prices: steel 50, gear 25, scaffold 25. priceRatio 1.15.
- **ziggurat** (building): `cultureMaxRatio: 0.08`, `unicornsMax: 0` (unicorn tears challenge). Prices: scaffold 50, blueprint 1, megalith 50. priceRatio 1.25. unlockRatio 0.01.
- **zebraOutpost**: `hunterRatio: 0.05`, `catpowerMax: 5`. Prices: bloodstone 1. priceRatio 1.35. unlockRatio 0.01.
- **zebraWorkshop**: `catpowerMax: 25`. Prices: bloodstone 5. priceRatio 1.15. unlockRatio 0.01.
- **zebraForge**: `catpowerMax: 50`, `tMythrilCraftRatio: 0.01`. Prices: bloodstone 50. priceRatio 1.15. unlockRatio 0.01.

### Complex buildings (dynamic effects depend on workshop upgrades/toggle state)

- **steamworks**: Static: `energyProduction: 1`, `magnetoBoostRatio: 0.15`, `cathPollutionPerTickProd: 1`. Dynamic: `coalRatioGlobal` (depends on upgrade), `manuscriptPerTickProd` (depends on printingPress/offsetPress upgrades). Prices: steel 65, gear 20, blueprint 1. priceRatio 1.25.
- **magneto**: Static: `oilPerTick: -0.05`, `energyProduction: 5`, `magnetoRatio: 0.02`, `cathPollutionPerTickProd: 5`. Action: turns off one per tick when oil runs out. Prices: gear 5, alloy 10, blueprint 1. priceRatio 1.25.
- **harbor**: Dynamic: multiple storage caps scaled by `cargoShips` upgrade × ship count. Base: catnipMax 2500, woodMax 700, mineralsMax 950, coalMax 100, ironMax 150, titaniumMax 50, goldMax 25. Prices: slab 50, plate 75, scaffold 5. priceRatio 1.15.
- **factory**: `craftRatio: 0.05` (factoryLogistics: 0.06), energyConsumption 2. Prices: titanium 2000, plate 2500, concrate 15. priceRatio 1.15. complex factory automation side effects.
- **reactor**: Static: `uraniumPerTick: -0.001`, `productionRatio: 0.05`, `uraniumMax: 250`, `energyProduction: 10`. Prices: titanium 3500, plate 5000, concrate 50, blueprint 25. priceRatio 1.15.
- **accelerator**: Static: `titaniumPerTickCon: -0.015`, `uraniumPerTickAutoprod: 0.0025`, `energyConsumption: 2`. With energyRifts upgrade: adds large storage boosts. Prices: titanium 7500, uranium 25, concrate 125. priceRatio 1.15.
- **biolab**: `scienceRatio: 0.35`, `refineRatio: 0.1`, `scienceMax: 1500`. Prices: science 1500, slab 100, alloy 25. priceRatio 1.10. Complex: biofuel toggle for catnipCon/oilProd.
- **aiCore**: `gflopsPerTickBase: 0.02`, `energyConsumption: ~2` (complex formula). Prices: antimatter 125, science 500000. priceRatio 1.15. unlockRatio 0.01.
- **chronosphere**: `temporalParadoxChance: 0.01`, `resStasisRatio: 0.015`, `temporalFluxProduction: 0`, `energyConsumption: 20`. Prices: unobtainium 2500, science 250000, timeCrystal 1, blueprint 100. priceRatio 1.25.

### Scoping decision for Epic 31

Implement all buildings that have primarily **static effects** (no complex tick-level `action()` required for correctness, or where the action can be simplified/deferred). This covers:
- workshop, chapel, tradepost, quarry, oilWell, ziggurat, zebraOutpost, zebraWorkshop, zebraForge (pure static)
- steamworks (add static effects; defer factory automation to future)
- magneto (add static effects; defer oil shutdown action to future)
- harbor (add static base storage effects; defer cargoShips dynamic scaling to future)
- factory (add craftRatio static; defer pollution action)
- reactor (add static productionRatio/energyProduction; defer thorium action)
- accelerator (add static effects; defer cap upgrades)
- biolab (add static scienceRatio/scienceMax; defer biofuel toggle action)
- aiCore (add static gflopsPerTickBase + fixed energyConsumption)
- chronosphere (add static effects)

## Key Decisions

- Keep dynamic effects (toggling, workshop-upgrade-dependent calc) as deferred — just wire the static base values now.
- `catpowerMax` is the rewrite name for `manpowerMax` (already renamed in Epic 27).
- Factory `craftRatio` adds to effectCache; consumer already exists in applyCraft.
- Harbor storage effects are already consumed in `resources.ts` via the `*Max` pattern.
- All new buildings must also be added to `legacy-migration.ts` building migration.

## Gotchas & Edge Cases

- `magnetoRatio` is consumed by `calcResourcePerTick` as a global production multiplier. Verify the key name matches what's consumed.
- `cultureMaxRatio` for ziggurat: consumed in ResourceManager? Check resources.ts.
- `tradeRatio` / `standingRatio` for tradepost: may not have consumers yet — just add the def with the right effect key names.
- Legacy uses `manpowerMax` for catpower storage; rewrite renamed to `catpowerMax` in Epic 27.

## Open Questions

- Does `magnetoRatio` have a consumer in `calcResourcePerTick`?
- Does `cultureMaxRatio` compound with `cultureMax` in resource storage calc?
- Is `gflopsPerTickBase` produced anywhere or consumed anywhere outside the AI research path?
