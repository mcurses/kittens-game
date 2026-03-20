# Epic 19: Engine Completeness — Stories

This epic closes gap stories from prior domain epics. Stories are implemented here and
status is tracked both here and updated in the originating STORIES.md files.

---

## Story 19-1: Shatter produces resources (CRITICAL)

**As a** player
**I want** shattering a time crystal to produce resources proportional to my per-tick production
**So that** the Chronoforge time-skip mechanic functions as in the original game

### Acceptance Criteria
- [x] SHATTER_TC applies shatterTCGain * resourcePerTick * ticksPerYear for each resource
- [x] Resource production uses current effectCache per-tick values
- [x] shatterTCGain comes from effectCache (default 0, modified by ressourceRetrieval)
- [x] Resources are capped at maxValue after shattering (pre-shatter cap)
- [x] Tests verify resource amounts at known effectCache values

### Legacy Reference
- `legacy/js/time.js` shatter() lines 663–717

### Status: [x] Tests | [x] Impl | [x] Rated

---

## Story 19-2: Heat efficiency multiplier

**As a** player
**I want** heat transfer to be modified by the heatEfficiency effect
**So that** heat management upgrades function correctly

### Acceptance Criteria
- [x] TimeManager.update() multiplies heat transfer by (1 + heatEfficiency) from effectCache
- [x] heatEfficiency defaults to 0 when no upgrades present
- [x] Tests verify heat transfer at heatEfficiency = 0 and heatEfficiency = 0.5

### Legacy Reference
- `legacy/js/time.js` line ~163 — heat transfer * (1 + heatEfficiency)

### Status: [x] Tests | [x] Impl | [x] Rated

---

## Story 19-3: heatMax and temporalFluxMax base values

**As a** player
**I want** heat and flux caps to have correct base values independent of upgrades
**So that** early-game time mechanics work before any CFUs are built

### Acceptance Criteria
- [x] heatMax has a base value of 100 contributed to effectCache even with zero upgrades
- [x] temporalFluxMax has a base value of 3000 contributed to effectCache even with zero upgrades
- [x] heatPerTick base value of 0.01 contributed to effectCache (base heat generation)
- [x] Tests verify caps with zero CFUs/VSUs

### Legacy Reference
- `legacy/js/time.js` effectsBase: { heatPerTick: 0.01, heatMax: 100, temporalFluxMax: 3000 }

### Status: [x] Tests | [x] Impl | [x] Rated

---

## Story 19-4: Paragon production ratio into effectCache

**As a** player
**I want** paragon to actually boost production via effectCache
**So that** prestige has the meaningful effect it does in the original game

### Acceptance Criteria
- [x] getParagonProductionRatio() result is contributed to effectCache each tick
- [x] Sephirot perk bonuses (malkuth through keter) correctly multiply the ratio via paragonRatio
- [x] burnedParagon reduces the ratio according to legacy formula (darkFutureYears < 0 branch)

### Legacy Reference
- `legacy/js/prestige.js` getParagonProductionRatio, lines 510–520

### Status: [x] Tests | [x] Impl | [x] Rated

---

## Story 19-5: BURN_PARAGON action

**As a** player
**I want** to burn paragon for burnedParagon
**So that** the prestige sacrifice mechanic is available

### Acceptance Criteria
- [x] BURN_PARAGON action converts 1 paragon to burnedParagon
- [x] burnedParagon gain = 1 (1:1 ratio, no diminishing returns on burn itself)
- [x] Returns unchanged state if paragon < 1
- [x] Action added to GameActionRequest in both openapi.yaml and schemas.ts

### Legacy Reference
- `legacy/js/prestige.js` burnParagon button controller

### Status: [x] Tests | [x] Impl | [x] Rated

---

## Story 19-6: Unicorn sacrifice actions

**As a** player
**I want** to sacrifice unicorns and alicorns for faith/tears
**So that** I can generate faith resources as in the original game

### Acceptance Criteria
- [x] SACRIFICE_UNICORNS: costs 2500 unicorns, gains ziggurat.on tears
- [x] SACRIFICE_ALICORNS: costs 25 alicorns, gains (1 + tcRefineRatio) timeCrystals, unlocks ziggurat upgrades
- [x] REFINE_TIME_CRYSTALS: costs 25 timeCrystals, gains relics (amount = 1 + relicRefineRatio * blackPyramid.getEffectiveValue — simplified to effectCache.relicRefineRatio)
- [x] All three actions added to GameActionRequest in openapi.yaml and schemas.ts

### Legacy Reference
- `legacy/js/religion.js` sacrifice buttons at lines 2800–2880

### Status: [x] Tests | [x] Impl | [x] Rated

---

## Story 19-7: Seasonal trade modifiers in RACE_DEFS

**As a** player
**I want** trade yields to vary by season
**So that** the seasonal trade strategy matches the original game

### Acceptance Criteria
- [x] lizards wood: spring -0.05, summer +0.35, autumn +0.15, winter +0.05
- [x] sharks catnip: summer +0.15, winter -0.25
- [x] griffins iron: winter +0.30
- [x] nagas minerals: summer -0.10
- [x] zebras iron: autumn +0.15
- [x] calculateTradeYield applies the season modifier correctly
- [x] Tests verify seasonal variation at each season boundary

### Legacy Reference
- `legacy/js/diplomacy.js` sell entry seasons objects

### Status: [x] Tests | [x] Impl | [x] Rated

---

## Story 19-8: Mission unlocks propagate to policies and challenges

**As a** player
**I want** completing missions to unlock policies and challenges
**So that** space progression gates work as in the original game

### Acceptance Criteria
- [x] duneMission completion unlocks policies: technocracy, theocracy, expansionism
- [x] centaurusSystemMission completion unlocks challenge: energy
- [x] Unlock mechanism triggers when planet is first reached in SpaceManager.update()

### Legacy Reference
- `legacy/js/space.js` mission.unlocks.policies, mission.unlocks.challenges

### Status: [x] Tests | [x] Impl | [x] Rated

---

## Story 19-9: Cross-manager integration test (engine completeness)

**As a** developer
**I want** an integration test covering all new mechanics
**So that** all new actions and effects interact correctly

### Acceptance Criteria
- [x] Full tick loop with all managers including new effects runs without error
- [x] SHATTER_TC with ressourceRetrieval active produces resources
- [x] SACRIFICE_UNICORNS with ziggurat built produces tears
- [x] Paragon with value > 0 contributes to effectCache globalProductionModifier

### Status: [x] Tests | [x] Impl | [x] Rated
