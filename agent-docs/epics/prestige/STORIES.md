# Epic 11: Prestige / Reset — Stories

## Status: In Progress

---

## Story 1: PrestigeState shape and initial values

**As a** game engine
**I want** a `PrestigeState` slice with perks collection (paragon-based upgrades)
**So that** prestige perks persist across resets

### Acceptance Criteria
- [x] Given a fresh game, `createInitialPrestige()` returns `{ perks: Record<string, PerkEntry> }`
- [x] `engeneering`, `diplomacy`, `chronomancy`, `carnivals`, `adjustmentBureau` start with `unlocked: true, researched: false` (defaultUnlocked=true)
- [x] All other perks start with `unlocked: false, researched: false`
- [x] `GameState` gains a `prestige: PrestigeState` field

### Legacy Reference
- File: `legacy/js/prestige.js` lines 454–460 (resetState)
- Key logic: perk.unlocked = perk.defaultUnlocked || false; perk.researched = false

---

## Story 2: PURCHASE_PERK action — buy prestige perks with paragon

**As a** player
**I want** to purchase prestige perks using paragon
**So that** I gain permanent bonuses across resets

### Acceptance Criteria
- [x] Given player has enough paragon, `PURCHASE_PERK` deducts paragon cost and marks perk as researched
- [x] Given perk already researched, action returns state unchanged
- [x] Given perk not unlocked, action returns state unchanged
- [x] Given insufficient paragon, action returns state unchanged
- [x] Given `engeneering` purchased, `megalomania`, `goldenRatio`, `codexVox` become unlocked

### Legacy Reference
- File: `legacy/js/prestige.js` lines 1–444 (perks array with unlocks chains)
- Key logic: NotStackable, researched=true + game.unlock(perk.unlocks)

---

## Story 3: PrestigeManager.updateEffects — contribute perk effects to effectCache

**As a** game engine
**I want** `PrestigeManager.updateEffects()` to sum all researched perk effects into effectCache
**So that** perk bonuses affect the game

### Acceptance Criteria
- [x] Given `engeneering` researched, effectCache gains `priceRatio: -0.01`
- [x] Given `goldenRatio` researched, effectCache gains `priceRatio: -(1+sqrt(5))/200` and `queueCap: 1`
- [x] Given `malkuth` researched, effectCache gains `paragonRatio: 0.05`
- [x] Given no perks researched, updateEffects returns empty record

### Legacy Reference
- File: `legacy/js/prestige.js` perks effects fields
- Key logic: effects summed from all researched perks (not stackable — each perk bought once)

---

## Story 4: SOFT_RESET action — reset game state while preserving prestige

**As a** player
**I want** to perform a soft reset (prestige) that resets most game state but preserves paragon and perk data
**So that** I can restart the game with permanent bonuses intact

### Acceptance Criteria
- [x] Given a SOFT_RESET action, resources reset to initial (except paragon, burnedParagon which persist)
- [x] Given a SOFT_RESET action, buildings reset to initial values
- [x] Given a SOFT_RESET action, village resets (kittens=0, jobs=0)
- [x] Given a SOFT_RESET action, calendar resets to initial
- [x] Given a SOFT_RESET action, science resets (techs=locked, policies=false)
- [x] Given a SOFT_RESET action, workshop resets (upgrades=initial, crafts=initial)
- [x] Given a SOFT_RESET action, religion resets (faith=0, worship=0, etc.)
- [x] Given a SOFT_RESET action, prestige state is preserved (perks remain researched, paragon resource persists)

### Legacy Reference
- File: `legacy/js/prestige.js` — paragon persists across resets
- Key logic: `game.resetAutomatic()` → managers reset but paragon resource is persistent

---

## Story 5: Paragon production ratio — paragon boosts global production

**As a** player
**I want** paragon to provide a global production bonus
**So that** each reset starts with a slight advantage

### Acceptance Criteria
- [x] `getParagonProductionRatio(paragon, paragonRatio)` returns `getLimitedDR(paragon * 0.01 * paragonRatio, 2 * paragonRatio)`
- [x] Given paragon=100, paragonRatio=1.0, production ratio is getLimitedDR(1.0, 2.0)
- [x] Given paragon=0, ratio is 0
- [x] `getParagonStorageRatio(paragon, paragonRatio)` returns `paragon / 1000 * paragonRatio`

### Legacy Reference
- File: `legacy/js/prestige.js` lines 510–532 (getParagonProductionRatio, getParagonStorageRatio)
- Key logic: paragon * 0.010 * paragonRatio, then getLimitedDR with limit 2 * paragonRatio

---

## Story 6: Save / load / reset for prestige state

**As a** game engine
**I want** prestige state to be serialized, deserialized, and reset correctly
**So that** save/load/reset works reliably

### Acceptance Criteria
- [x] Given any prestige state, `serialize()` includes prestige perks
- [x] Given a serialized state, `deserialize()` + `PrestigeManager.load()` restores all perk states
- [x] Given `resetState()`, all perks reset to initial values (defaultUnlocked perks unlock again, researched=false)
- [x] Given load with missing prestige field, prestige initializes to defaults
- [x] After load, researched perks unlock their `unlocks` chains

### Legacy Reference
- File: `legacy/js/prestige.js` lines 462–481 (save/load)
- Key logic: saves name/unlocked/researched; load replays unlock chains for researched perks

---

## Story 7: Cross-manager integration — full tick with PrestigeManager

**As a** game engine
**I want** a cross-manager integration test covering the full tick loop with PrestigeManager
**So that** we verify manager interaction is correct

### Acceptance Criteria
- [x] Given all managers registered including PrestigeManager, `tick()` advances without error
- [x] Given `engeneering` perk researched, effectCache contains `priceRatio` from perk
- [x] Given SOFT_RESET applied, game state (resources, buildings) is wiped but prestige perks remain
