# Epic 14: Diplomacy / Trade — Stories

## Story 1: DiplomacyState shape and initial values

**As a** game engine
**I want** a DiplomacyState with race entries
**So that** trade and embassy progress can be serialized

### Acceptance Criteria
- [x] Given a fresh game, when `createInitialDiplomacy()` is called, then lizards/sharks/griffins are present but locked
- [x] Given a fresh game, all races start with embassyLevel=0, unlocked=false
- [x] Given all 8 races, each is present in the state

---

## Story 2: SEND_EMBASSY action

**As a** player
**I want** to build embassies with races
**So that** I can unlock better trade items and improved relations

### Acceptance Criteria
- [x] Given race is unlocked and player has sufficient culture, when SEND_EMBASSY is dispatched, then culture is deducted and embassyLevel increments
- [x] Given race not unlocked, when SEND_EMBASSY dispatched, then state unchanged
- [x] Given insufficient resources, when SEND_EMBASSY dispatched, then state unchanged
- [x] Embassy cost: culture * 100 (lizards/sharks), scales with existing level

---

## Story 3: TRADE action (deterministic)

**As a** player
**I want** to trade with a race
**So that** I can exchange resources

### Acceptance Criteria
- [x] Given race is unlocked and player has gold + manpower + race buy resource, when TRADE dispatched, then costs deducted
- [x] Given a successful trade, resources from race.sells are added (base amounts, no RNG)
- [x] Given race not unlocked, when TRADE dispatched, then state unchanged
- [x] Given insufficient gold/manpower, when TRADE dispatched, then state unchanged
- [x] Given tradeRatio in effectCache, trade yield is multiplied by (1 + tradeRatio)

---

## Story 4: Race unlock mechanics

**As a** game engine
**I want** races to unlock based on game conditions
**So that** players discover new races over time

### Acceptance Criteria
- [x] Given culture >= 1500, when DiplomacyManager.update() runs, then nagas become unlocked
- [x] Given ship resource >= 1, when update() runs, then zebras become unlocked
- [x] Given nuclearFission researched, when update() runs, then dragons become unlocked
- [x] Given ship >= 100 and scienceMax > 125000, when update() runs, then spiders become unlocked

---

## Story 5: DiplomacyManager.updateEffects

**As a** game engine
**I want** race unlock and embassy effects to contribute to effectCache
**So that** policies from races are available

### Acceptance Criteria
- [x] updateEffects returns an empty effects map (diplomacy has no direct effect cache contributions by default)

---

## Story 6: Save / load / reset for diplomacy state

**As a** game engine
**I want** diplomacy state to persist across save/load cycles
**So that** embassy progress and race discovery are preserved

### Acceptance Criteria
- [x] Given diplomacy state with embassyLevels set, when serialized and deserialized, then values are restored
- [x] Given a soft reset, when DiplomacyManager.resetState() is called, then all embassy levels reset to 0
- [x] Given a load, race unlocked status is correctly restored

---

## Story 7: Cross-manager integration test

**As a** developer
**I want** a full tick loop test with DiplomacyManager
**So that** diplomacy interacts correctly with the rest of the engine

### Acceptance Criteria
- [x] Given full tick loop with all managers including DiplomacyManager, when 5 ticks run, no errors
- [x] Given enough culture in state, when DiplomacyManager.update() runs, nagas become unlocked
- [x] Given a TRADE action with sufficient resources, when applied, state is valid


---

## Story: Seasonal trade modifiers

**As a** player
**I want** trade yields to vary by season
**So that** the seasonal trade strategy matches the original game

### Acceptance Criteria
- [ ] Each sell entry in RACE_DEFS has a `seasons` object matching legacy (e.g. lizards wood: spring -0.05, summer +0.35, autumn +0.15, winter +0.05)
- [ ] calculateTradeYield applies the season modifier from CalendarState.season
- [ ] All 5 races with seasonal modifiers (lizards, sharks, griffins, nagas, zebras) populated correctly
- [ ] Tests verify seasonal variation at each season boundary

### Legacy Reference
- `legacy/js/diplomacy.js` — sell entry `seasons` objects per race

### Notes
SellEntry interface already has `seasons?` field and calculateTradeYield already reads it — this is purely a data population gap in RACE_DEFS.

### Status: [ ] Tests | [ ] Impl | [ ] Rated

---

## Story: Trade value fuzzing (width parameter)

**As a** player
**I want** trade yields to have slight randomness
**So that** trade feels organic as in the original game

### Acceptance Criteria
- [ ] SellEntry supports `width` field (range of randomization around base value)
- [ ] calculateTradeYield applies fuzzing within ±width when width is present
- [ ] Legacy width values populated for all applicable sell entries

### Legacy Reference
- `legacy/js/diplomacy.js` — `width` parameter on sell entries

### Status: [ ] Tests | [ ] Impl | [ ] Rated

---

## Story: Random year-gated race unlocks

**As a** player
**I want** non-hidden races to unlock gradually based on game year
**So that** early-game race discovery matches the original game

### Acceptance Criteria
- [ ] First 3 non-hidden races unlock randomly based on year thresholds
- [ ] Year thresholds match legacy unlockRandomRace() logic
- [ ] Perk bonuses that accelerate unlock apply correctly
- [ ] Only fires if race not already unlocked

### Legacy Reference
- `legacy/js/diplomacy.js` — unlockRandomRace(), year-gated logic

### Status: [ ] Tests | [ ] Impl | [ ] Rated

---

## Story: Leviathan timed visits and energy

**As a** player
**I want** Leviathan visits to be timed with energy tracking
**So that** the Leviathan mechanic matches the original game

### Acceptance Criteria
- [ ] DiplomacyState tracks Leviathan visit duration and energy fields
- [ ] Leviathan visit duration decrements each tick
- [ ] Energy accumulates during visits per legacy formula
- [ ] Embassy action blocked for Leviathans (already implemented)

### Legacy Reference
- `legacy/js/diplomacy.js` — leviathan energy, duration tracking

### Status: [ ] Tests | [ ] Impl | [ ] Rated
