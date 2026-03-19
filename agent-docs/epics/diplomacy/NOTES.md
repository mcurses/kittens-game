# Epic 14: Diplomacy / Trade — Implementation Notes

## Legacy Reference
- `legacy/js/diplomacy.js` — full DiplomacyManager

## Key Design Decisions

### Trade System Complexity
The legacy trade system has extensive RNG (binomial distribution, fuzzing), nonRandomTrades anti-exploit,
standing/bonus/failure mechanics. For our engine, we implement a DETERMINISTIC trade model using a
seeded random approach — the pure engine cannot use Math.random() directly. Instead, the trade action
accepts a `seed` parameter (or we use a deterministic formula based on tick + race).

**Simplification**: For Epic 14, trade uses a simplified deterministic model:
- Base resources are deterministic (no RNG in core trade)
- Chance-based items (spice, blueprint, titanium for zebras) use a simpler inclusion model
- This matches the "pure function" engine invariant — no side effects, no Math.random()
- Full RNG can be added when the server layer provides entropy (Epic 17)

### Race Definitions
8 races total:
- Visible by default: lizards, sharks, griffins
- Hidden (require conditions): nagas, zebras, spiders, dragons, leviathans

### Embassy System
- Each race has embassy prices (culture-based)
- Embassy level tracked per race
- Higher embassy level unlocks better trade items (minLevel gates)

### Trade Cost
- Base gold: 15, base manpower: 50
- Plus race.buys[0] resource
- tradeRatio effect from effectCache

### Deferred Features
- RNG-based trade outcomes (requires server entropy)
- Standing-based failure/bonus mechanics
- nonRandomTrades anti-exploit mechanism
- unlockRandomRace() based on year/perk conditions
- Leviathans duration mechanic
- tradeAll / tradeMultiple
- zebras titanium bonus formula
- spice bonus calculation
- blueprint chance
- BSK+IW special trade rules

## Race Inventory
lizards (minerals → wood/beam/scaffold)
sharks (iron → catnip/parchment/manuscript/compedium)
griffins (wood → iron/steel/gear)
nagas (ivory → minerals/slab/concrate/megalith)
zebras (slab → iron/plate/alloy)
spiders (scaffold → coal/oil)
dragons (titanium → uranium/thorium)
leviathans (unobtainium → starchart/timeCrystal/sorrow/relic)
