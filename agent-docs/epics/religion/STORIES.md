# Epic 10: Religion & Faith — Stories

## Status: In Progress

---

## Story 1: ReligionState shape and initial values

**As a** game engine
**I want** a `ReligionState` slice with faith, worship, faithRatio, transcendenceTier, and upgrade collections
**So that** the religion system has a stable, serializable home in GameState

### Acceptance Criteria
- [x] Given a fresh game, `createInitialReligion()` returns `{ faith: 0, worship: 0, faithRatio: 0, transcendenceTier: 0, zigguratUpgrades: {}, religionUpgrades: {}, transcendenceUpgrades: {} }`
- [x] Given initial state, all ziggurat upgrades have `val: 0, on: 0, unlocked: false` except `unicornTomb` which has `unlocked: true`
- [x] Given initial state, all religion upgrades have `val: 0, on: 0, unlocked: true` (all visible from start)
- [x] Given initial state, all transcendence upgrades have `val: 0, on: 0, unlocked: false`
- [x] `GameState` gains a `religion: ReligionState` field

### Legacy Reference
- File: `legacy/js/religion.js` lines 59–83 (resetState)
- Key logic: faith=0, corruption=0, faithRatio=0, transcendenceTier=0; zigguratUpgrades reset with unlocked=defaultUnlocked

---

## Story 2: Ziggurat upgrades — definitions and BUY_ZIGGURAT_UPGRADE action

**As a** player
**I want** to buy ziggurat upgrades (unicornTomb → ivoryTower → ivoryCitadel → skyPalace → marker → etc.)
**So that** I gain religion effects powered by unicorns/tears

### Acceptance Criteria
- [x] Given `ZIGGURAT_UPGRADE_DEFS` exists with 11 entries (unicornTomb, ivoryTower, ivoryCitadel, skyPalace, unicornUtopia, sunspire, marker, unicornGraveyard, unicornNecropolis, blackPyramid)
- [x] Given the player has enough resources, `BUY_ZIGGURAT_UPGRADE` increments val and on by 1 and deducts prices
- [x] Given insufficient resources, `BUY_ZIGGURAT_UPGRADE` returns state unchanged
- [x] Given buying unicornTomb, `ivoryTower` becomes unlocked
- [x] Given a definition with `priceRatio`, price scales as `base * priceRatio^count`

### Legacy Reference
- File: `legacy/js/religion.js` lines 596–980 (zigguratUpgrades array)
- Key logic: stackable buildings, priceRatio=1.15 for all

---

## Story 3: Religion upgrades — definitions and BUY_RELIGION_UPGRADE action

**As a** player
**I want** to buy religion upgrades (solarchant, scholasticism, etc.) using faith
**So that** I gain faith bonuses and unlock transcendence

### Acceptance Criteria
- [x] Given `RELIGION_UPGRADE_DEFS` exists with 10 entries (solarchant through transcendence)
- [x] Given the player has enough faith (and other resources), `BUY_RELIGION_UPGRADE` deducts price and increments val/on
- [x] Given insufficient faith, action returns state unchanged
- [x] Given buying `transcendence`, `solarchant`, `scholasticism`, `goldenSpire`, `sunAltar`, `stainedGlass`, `basilica`, `templars` all get val+1 bonus (upgrade effect)

### Legacy Reference
- File: `legacy/js/religion.js` lines 982–1163 (religionUpgrades array)
- Key logic: faith-based prices (priceRatio=2.5), unlock chains

---

## Story 4: Transcendence upgrades — definitions and BUY_TRANSCENDENCE_UPGRADE action

**As a** player
**I want** to buy transcendence upgrades using relics
**So that** I gain powerful effects based on my transcendence tier

### Acceptance Criteria
- [x] Given `TRANSCENDENCE_UPGRADE_DEFS` exists with 10 entries (blackObelisk, blackNexus, blackCore, singularity, blackLibrary, blackRadiance, blazar, darkNova, mausoleum, holyGenocide)
- [x] Given transcendenceTier >= def.tier and player has relics, `BUY_TRANSCENDENCE_UPGRADE` deducts relics and increments val/on
- [x] Given transcendenceTier < def.tier, action returns state unchanged (locked)

### Legacy Reference
- File: `legacy/js/religion.js` lines 1165–1364 (transcendenceUpgrades array)
- Key logic: each TU has a tier requirement; relic-based prices

---

## Story 5: PRAISE action — convert faith resource to worship

**As a** player
**I want** to Praise the Sun, converting accumulated faith into worship
**So that** worship powers solar revolution and transcendence

### Acceptance Criteria
- [x] Given faith resource > 0, `PRAISE` adds `faith.value * (1 + apocryphaBonus)` to `religion.worship`
- [x] Given no apocrypha purchased, apocryphaBonus = 0 (no extra)
- [x] Given praise, faith resource is reset to 0.0001
- [x] Given worship > 0 and `solarRevolution` purchased (val > 0), effectCache gains `solarRevolutionRatio` effect

### Legacy Reference
- File: `legacy/js/religion.js` lines 1443–1457 (praise function)
- Key logic: worshipGainedAmt = faith.value * (1 + getApocryphaBonus()); faith.value = 0.0001

---

## Story 6: ADORE action — convert worship to faithRatio (epiphany)

**As a** player
**I want** to Adore the Galaxy, converting worship into faithRatio
**So that** I can eventually transcend

### Acceptance Criteria
- [x] Given transcendence not purchased, `ADORE` returns state unchanged
- [x] Given transcendence purchased (val > 0), `ADORE` adds `worship / 1e6 * ttPlus1^2` to faithRatio, sets worship = 0.01
- [x] Given transcendenceTier = 0, ttPlus1 = 1 (so bonus = worship / 1e6)
- [x] Given transcendenceTier = 3 and transcendence purchased, ttPlus1 = 4

### Legacy Reference
- File: `legacy/js/religion.js` lines 1491–1496 (_resetFaithInternal)
- Key logic: faithRatio += faith / 1000000 * ttPlus1^2; faith = 0.01

---

## Story 7: TRANSCEND action — spend faithRatio to increment transcendenceTier

**As a** player
**I want** to Transcend, spending faithRatio to advance my transcendence tier
**So that** I unlock higher-tier transcendence upgrades

### Acceptance Criteria
- [x] Given transcendence upgrade not purchased, `TRANSCEND` returns state unchanged
- [x] Given faithRatio >= `_getTranscendNextPrice(tier)`, `TRANSCEND` decrements faithRatio and increments transcendenceTier by 1
- [x] Given faithRatio < price, `TRANSCEND` returns state unchanged
- [x] `_getTranscendNextPrice(tier)` = inverse_unlimited_DR(exp(tier+1)/10, 0.1) - inverse_unlimited_DR(exp(tier)/10, 0.1)

### Legacy Reference
- File: `legacy/js/religion.js` lines 1498–1535 (transcend, _getTranscendTotalPrice)
- Key logic: total price = getInverseUnlimitedDR(exp(tier)/10, 0.1)

---

## Story 8: ReligionManager.updateEffects — contribute to effectCache

**As a** game engine
**I want** `ReligionManager.updateEffects()` to sum all religion/ziggurat/transcendence upgrade effects into the effectCache
**So that** other managers can read religion effects

### Acceptance Criteria
- [x] Given unicornTomb with val=3, on=3, effectCache gains `unicornsRatioReligion: 3 * 0.05`
- [x] Given solarchant with val=2, on=2, effectCache gains `faithRatioReligion: 2 * 0.1`
- [x] Given blackObelisk with val=1, on=1, and transcendenceTier=5, effectCache gains `solarRevolutionLimit: 0.05 * 5`

### Legacy Reference
- File: `legacy/js/religion.js` constructor / registerMeta patterns
- Key logic: ziggurat upgrades use `on` for effects (not val), religion upgrades are stackable

---

## Story 9: Faith per tick — faith resource accumulates each tick

**As a** player
**I want** faith to accumulate each tick based on effectCache
**So that** temples and other sources of faith generate it automatically

### Acceptance Criteria
- [x] Given effectCache has `faithPerTick: 0.1`, each tick faith resource increases by 0.1 (up to maxValue)
- [x] Given `faithRatioReligion: 0.2` in effectCache, faith per tick is multiplied accordingly
- [x] `ReligionManager.update()` adds faith increment to the faith resource pool

### Legacy Reference
- File: `legacy/js/religion.js` update() + resources system
- Key logic: faith generated from temples via PerTickBase in effectCache

---

## Story 10: Save / load / reset for religion state

**As a** game engine
**I want** religion state to be serialized, deserialized, and reset correctly
**So that** save/load/reset works reliably

### Acceptance Criteria
- [x] Given any religion state, `serialize()` includes religion fields
- [x] Given a serialized state, `deserialize()` restores all religion values
- [x] Given `resetState()`, all religion state returns to initial values
- [x] Given load with missing religion field, religion initializes to defaults

### Legacy Reference
- File: `legacy/js/religion.js` lines 85–128 (save/load)
- Key logic: saves faith, faithRatio, transcendenceTier, zu/ru/tu arrays

---

## Story 11: Cross-manager integration — full tick with ReligionManager

**As a** game engine
**I want** a cross-manager integration test covering the full tick loop with ReligionManager registered
**So that** we verify manager interaction is correct

### Acceptance Criteria
- [x] Given all managers (Resource, Building, Village, Calendar, Science, Workshop, Religion) registered, `tick()` advances without error
- [x] Given temples built and faith effects active, tick produces faith
- [x] Given PRAISE action, worship increases and faith resets
