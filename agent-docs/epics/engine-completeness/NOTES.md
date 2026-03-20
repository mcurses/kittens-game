# Epic 19: Engine Completeness — Notes

## Purpose

Close all gap stories filed during sanity-check in previously completed domain epics.
Stories pulled from:
- `agent-docs/epics/time/STORIES.md`
- `agent-docs/epics/religion/STORIES.md`
- `agent-docs/epics/prestige/STORIES.md`
- `agent-docs/epics/space/STORIES.md`
- `agent-docs/epics/diplomacy/STORIES.md`
- `agent-docs/epics/challenges/STORIES.md` (no incomplete stories)

## Key Implementation Notes

### Shatter produces resources (CRITICAL)
Legacy shatter.ts: for each resource, `addRes(res, getResourcePerTick(res.name, true) * remainingTicksInCurrentYear * shatterTCGain)`
- `shatterTCGain` comes from `effectCache.shatterTCGain` (default from ressourceRetrieval CFU: 0.01)
- `rrRatio` effect scales shatterTCGain: `shatterTCGain * (1 + rrRatio)`
- Each shatter is for "1 year" of ticks: `remainingTicks = daysPerSeason * seasonsPerYear * ticksPerDay`
- Resources are capped at their pre-shatter maxValue (so shatter doesn't burst caps)

### Heat efficiency
Legacy: `efficiency = 1 + game.getEffect("heatEfficiency")`; multiply heatPerTick by efficiency
- heatEfficiency defaults to 0 (no upgrades produce it currently)

### heatMax and temporalFluxMax base values
Legacy effectsBase: `{ heatPerTick: 0.01, heatMax: 100, temporalFluxMax: 3000 }` (3000 = 60*10*5)
- These are base contributions to effectCache regardless of upgrades
- blastFurnace CFU ALSO adds heatMax 100, so total with 1 blastFurnace = 200

### Unicorn sacrifice actions
- SACRIFICE_UNICORNS: costs 2500 unicorns, gains `ziggurat.on` tears
- SACRIFICE_ALICORNS: costs 25 alicorns, gains `1 + tcRefineRatio` timeCrystals, unlocks skyPalace/unicornUtopia/sunspire
- REFINE_TIME_CRYSTALS: costs 25 timeCrystals, gains relics scaled by blackPyramid

### Paragon production ratio into effectCache
- `getParagonProductionRatio()` returns a value to add to effectCache as `globalProductionModifier`
- Called each tick from `PrestigeManager.updateEffects()`
- darkFutureYears: treat as negative for now (dark future not yet implemented)

### BURN_PARAGON action
- Legacy: converts paragon to burnedParagon
- Rate: `getBurnedParagonRatio()` = `getUnlimitedDR(burnedParagon, 500)` (starts at 1:1)
- Spends 1 paragon, gains 1 * burnedRatio burnedParagon
  Actually legacy: it appears to just add the paragon value to burnedParagon and subtract paragon
  See prestige.js burnParagon button controller

### Seasonal trade modifiers
- lizards wood: spring -0.05, summer +0.35, autumn +0.15, winter +0.05
- Need to populate `seasons` fields in RACE_DEFS for lizards, sharks, griffins, nagas, zebras

### Mission unlocks policies/challenges
- duneMission.unlocks.policies = ["technocracy", "theocracy", "expansionism"]
- centaurusSystemMission.unlocks.challenges = ["energy"]

## Deferred (out of scope for Epic 19)
- blackPyramid/holyGenocide special effects (complex calculateEffects callbacks)
- Pacts system (large subsystem, separate epic)
- Necrocorn corruption (depends on pacts)
- Dynamic space building effects (moonBase, satellite, cracker)
- Leviathan timed visits
- Random year-gated race unlocks (requires RNG)
- Trade value fuzzing (requires RNG)
