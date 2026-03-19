# Epic 15: Time Mechanics — Implementation Notes

## Legacy Reference
- `legacy/js/time.js` — full TimeManager

## Key Design Decisions

### Chronoforge (CFU) vs Voidspace (VSU)
Two sets of upgrades:
- **CFU** (Chronoforge upgrades): bought with timeCrystals/relics, contribute effectCache
  - temporalBattery, blastFurnace, timeBoiler, controlledDelay, temporalAccelerator,
    temporalImpedance, ressourceRetrieval, temporalPress
- **VSU** (Voidspace upgrades): bought with void/timeCrystals/karma
  - cryochambers, usedCryochambers, voidHoover, voidRift, chronocontrol, voidResonator

### Heat and Flux
- `heat`: accumulates from some sources, transfers to blastFurnace
- `flux`: years skipped by CF time jumps

### Shatter mechanic
When blastFurnace has enough heat (≥100), it shatters timeCrystals:
- Advances calendar year by 1
- Accumulates flux
- With ressourceRetrieval: produces resources proportional to shatterTCGain

### Static Effects Approach
For CFU/VSU effects, use static base effects (same as buildings/space approach).
Dynamic effects (calculateEffects with cross-dependencies like timeBoiler's heatMaxExpansion)
are handled with static defaults, deferring full dynamic calculation.

### BUY_CFU / BUY_VSU Actions
Both use priceRatio^count scaling like space buildings.

### SHATTER_TC Action
- Requires blastFurnace.on > 0 and blastFurnace.heat >= 100
- Advances calendar year, accumulates flux
- Deducts heat from blastFurnace

## Deferred Features
- Automatic shatter via blastFurnace.isAutomationEnabled (UI-driven)
- temporalPress automation and shatterYearBoost calculation
- controlledDelay delayTicks logic
- fastforward/redshift (UI-driven, requires timestamp)
- Queue system (complex, separate epic)
- gainTemporalFlux from real-time timestamp (server layer)
- voidspace cryochambers limitBuild (depends on chronosphere)

## Upgrade Inventories
CFU (8): temporalBattery, blastFurnace, timeBoiler, controlledDelay, temporalAccelerator,
  temporalImpedance, ressourceRetrieval, temporalPress

VSU (6): cryochambers, usedCryochambers, voidHoover, voidRift, chronocontrol, voidResonator
