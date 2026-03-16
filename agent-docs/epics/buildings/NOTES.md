# Epic 05: Buildings — Notes

## Key Design Decisions

### Static effects only
Only buildings with fully static effects (no `calculateEffects` dependent on workshop upgrades or runtime state) are implemented in this epic. Buildings with complex `calculateEffects` (mine, smelter, steamworks, etc.) will be added in later epics.

For barn: use the calculated values (5000/200/250/60/50/2/10) directly as static effects since the base values are stable for early game.

For mine: use mineralsRatio: 0.2 as static effect (base without deepMining upgrade).

### Effect scaling rules
From legacy BuildingsManager constructor:
- Effects ending in 'Max': `effectValue * bld.val`
- All other effects: `effectValue * bld.on`

### Price scaling
`getBuildingPrice(def, count)` where count = current val (before buying):
`price.val * priceRatio^count`

### BUY_BUILDING atomicity
The action handler for BUY_BUILDING must:
1. Look up the building def
2. Calculate the current price (using current building.val as count)
3. Check if all resources are sufficient (canAfford)
4. If affordable: deduct all prices from resources AND increment val/on
5. If not affordable: return state unchanged

### Staged buildings
For pasture, aqueduct, library: implement stage 0 only. Stage stored in BuildingEntry but defaults to 0.

## Buildings Implemented (Stage 0 static effects only)

| Building | Prices (base) | priceRatio | Static Effects |
|----------|---------------|------------|----------------|
| field | catnip:10 | 1.12 | catnipPerTickBase:0.125 |
| pasture | catnip:100, wood:10 | 1.15 | catnipDemandRatio:-0.005 |
| aqueduct | minerals:75 | 1.12 | catnipRatio:0.03 |
| hut | wood:5 | 2.5 | manpowerMax:75, maxKittens:2 |
| logHouse | wood:200, minerals:250 | 1.15 | manpowerMax:50, maxKittens:1 |
| mansion | titanium:25, slab:185, steel:75 | 1.15 | manpowerMax:50, maxKittens:1 |
| library | wood:25 | 1.15 | scienceRatio:0.1, scienceMax:250, cultureMax:10 |
| academy | wood:50, minerals:70, science:100 | 1.15 | scienceRatio:0.2, scienceMax:500, cultureMax:25 |
| mine | wood:100 | 1.15 | mineralsRatio:0.2 |
| barn | wood:50 | 1.75 | catnipMax:5000, woodMax:200, mineralsMax:250, coalMax:60, ironMax:50, titaniumMax:2, goldMax:10 |
| warehouse | beam:1.5, slab:2 | 1.15 | woodMax:150, mineralsMax:200, coalMax:30, ironMax:25, titaniumMax:10, goldMax:5 |
