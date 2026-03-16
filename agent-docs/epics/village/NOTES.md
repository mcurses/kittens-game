# Epic 06: Village / Population / Jobs — Notes

## Key Design Decisions

### kittenProgress accumulator
Instead of spawning fractional kittens, we accumulate progress. When `kittenProgress >= 1`, spawn one kitten and decrement progress by 1 (not reset to 0, to preserve the fractional part).

### Job production goes into PerTickBase
Farmers contribute to `catnipPerTickBase`, woodcutters to `woodPerTickBase`, etc.
This means job production IS multiplied by building ratios (e.g., aqueduct ratio).
This matches legacy behavior.

### Kitten death
When `catnip.value + calcResourcePerTick(effectCache, 'catnip') < 0`, kill 1 kitten.
Legacy has a 5-second timeout between deaths. In our tick-based model, we kill at most
1 kitten per tick when catnip is negative-delta.

### Job assignment validation
- `ASSIGN_JOB`: can only assign if `kittens > totalAssigned`
- `UNASSIGN_JOB`: can only unassign if `job.value > 0`
- When a kitten dies, reduce the highest-valued job by 1 to free the slot.

### Job definitions (base values per kitten per tick)
| Job | Effect | Value |
|-----|--------|-------|
| woodcutter | woodPerTickBase | 0.018 |
| farmer | catnipPerTickBase | 1.0 |
| scholar | sciencePerTickBase | 0.035 |
| hunter | manpowerPerTickBase | 0.06 |
| miner | mineralsPerTickBase | 0.05 |
| geologist | coalPerTickBase | 0.015 |
| priest | faithPerTickBase | 0.0015 |

### maxKittens from effectCache
`maxKittens = effectCache['maxKittens']` (contributed by hut/logHouse/mansion buildings)
