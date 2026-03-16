# Epic 04: Resources — Notes

## Key Design Decisions

### ResourceState as Record
`ResourceState` is `Record<string, ResourceEntry>` not a typed union literal map. This avoids maintenance burden when new resources are added.

### Per-tick formula
```
perTick = effectCache[name + 'PerTickBase']
          * (1 + effectCache[name + 'Ratio'])
          + effectCache[name + 'PerTick']
          + effectCache[name + 'PerTickCon']
```
Note: `PerTickCon` is negative (consumption).

### maxValue
`maxValue = effectCache[name + 'Max']`

### No-resource-clamping
Resources cannot go below 0. They also cannot exceed maxValue.

### GATHER_CATNIP clamping
`gatherCatnip` in legacy does `catnip.value++` with no explicit check — but legacy also clamps in the update loop. For correctness, clamp in the action handler too.

## All Resource Names (from legacy)
catnip, wood, minerals, coal, iron, titanium, gold, oil, uranium, furs, ivory, spice, silk, unicorns, alicorns, bloodstone, blackcoin, necrocorn, tears, faith, manpower, science, culture, karma, paragon, burnedParagon, kittens, hashrates, antimatter, timeCrystals, sorrow, relic, void
