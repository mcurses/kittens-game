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

