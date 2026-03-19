# Epic 12: Challenges — Stories

## Status: In Progress
## Started: 2026-03-19
## Legacy refs: `legacy/js/challenges.js`, `legacy/test/challenges.test.js`

---

## Story 1: ChallengeState shape and initial values

**As a** game engine
**I want** a `ChallengeState` slice with a challenges collection
**So that** challenge progress persists across sessions

### Acceptance Criteria
- [ ] Given a fresh game, `createInitialChallenges()` returns `{ challenges: Record<string, ChallengeEntry> }`
- [ ] `ChallengeEntry` has fields: `unlocked: boolean`, `active: boolean`, `researched: boolean`, `on: number`, `pending: boolean`
- [ ] `defaultUnlocked=true` challenges (`ironWill`, `winterIsComing`, `anarchy`) start with `unlocked: true`, all others `false`
- [ ] All challenges start with `active: false`, `researched: false`, `on: 0`, `pending: false`
- [ ] `GameState` gains a `challenges: ChallengeState` field

### Legacy Reference
- `legacy/js/challenges.js` lines 488–509 (`resetStateStackable`)
- Key logic: `unlocked = defaultUnlocked || false`, `active=false`, `researched=false`, `on=0`, `pending=false`

### Status: [ ] Tests | [ ] Impl | [ ] Rated

---

## Story 2: START_CHALLENGE action — begin a challenge run

**As a** player
**I want** to start a challenge
**So that** I can earn permanent bonuses on completion

### Acceptance Criteria
- [ ] Given challenge is unlocked and not active, `START_CHALLENGE` sets `active: true`
- [ ] Given challenge is not unlocked, action returns state unchanged
- [ ] Given challenge already active, action returns state unchanged
- [ ] Only one challenge can be active at a time (starting a second fails if another is already active)
- [ ] `ironWill` is a special case: it behaves as an always-active flag (it mirrors `game.ironWill`); `START_CHALLENGE` for ironWill immediately triggers a SOFT_RESET

### Legacy Reference
- `legacy/js/challenges.js` lines 867–881 (`buyItem` / `togglePending` / `applyPending`)
- Key logic: toggle pending → applyPending → resetAutomatic

### Status: [ ] Tests | [ ] Impl | [ ] Rated

---

## Story 3: COMPLETE_CHALLENGE action — mark a challenge as completed

**As a** game engine
**I want** to complete the active challenge
**So that** the player earns the permanent reward

### Acceptance Criteria
- [ ] Given challenge is active, `COMPLETE_CHALLENGE` sets `researched: true`, increments `on` by 1, sets `active: false`
- [ ] Given challenge is not active, action returns state unchanged
- [ ] Given `on` was 0 before completion, legacy compatibility: `on` becomes 1 (never stays 0 for a completed challenge)
- [ ] `getCountCompletions(state)` returns sum of all `on` values
- [ ] `getCountUniqueCompletions(state)` returns count of challenges where `researched: true`

### Legacy Reference
- `legacy/js/challenges.js` lines 638–655 (`researchChallenge`)
- Key logic: `researched=true`, `on += 1`, `active=false`

### Status: [ ] Tests | [ ] Impl | [ ] Rated

---

## Story 4: ChallengeManager.updateEffects — contribute challenge effects to effectCache

**As a** game engine
**I want** `ChallengeManager.updateEffects()` to sum all active/completed challenge effects into effectCache
**So that** challenge bonuses affect the game

### Acceptance Criteria
- [ ] Given a challenge with no effects defined, `updateEffects` contributes 0 for that challenge
- [ ] Given a stackable effect (no `noStack`), effect value is `baseEffect * on`, optionally with LDRLimit applied
- [ ] Given `noStack: true`, effect value is the base value directly (not multiplied by `on`)
- [ ] Given `LDRLimit`, after `baseEffect * on` is computed, `getLimitedDR(amount, LDRLimit)` is applied
- [ ] Given `capMagnitude`, the magnitude of the effect is clamped to `capMagnitude` (sign preserved)
- [ ] When challenge is active, effects use the active values (set in calculateEffects for active=true case)
- [ ] When challenge is not active (completed or pending), effects use the passive/reward values

### Legacy Reference
- `legacy/js/challenges.js` lines 6–29 (constructor / getEffect logic)
- Key logic: `amt = effects[effectName] || 0; amt *= challenge.on; getLimitedDR(amt, stackOptions.LDRLimit)`

### Status: [ ] Tests | [ ] Impl | [ ] Rated

---

## Story 5: Per-challenge effect definitions

**As a** game engine
**I want** `CHALLENGE_DEFS` to encode each challenge's base effects and stack options
**So that** the engine can compute effects without hardcoded logic

### Acceptance Criteria
- [ ] `CHALLENGE_DEFS` contains all 10 challenges with correct effect definitions
- [ ] `winterIsComing`: effects `springCatnipRatio: 0.05`, `summerSolarFarmRatio: 0.05`, `coldChance: 0`, `coldHarshness: 0`; stackOptions with LDRLimit 2, 2, 0.825, 1 respectively; active effects: `springCatnipRatio: 0`, `summerSolarFarmRatio: 0`, `coldChance: 0.05`, `coldHarshness: -0.02`
- [ ] `anarchy`: effects `masterSkillMultiplier: 0.2`, `kittenLaziness: 0`; stackOptions LDRLimit 4, 0.25; active effects: `masterSkillMultiplier: 0`, `kittenLaziness` is dynamic LDR
- [ ] `energy`: effects `energyConsumptionRatio: -0.02`, `energyConsumptionIncrease: 0`; stackOptions LDRLimit 1; active effects: `energyConsumptionRatio: 0`, `energyConsumptionIncrease: 0.1`
- [ ] `atheism`: effects `faithSolarRevolutionBoost: 0.1` with LDRLimit 4; active effects penalize culture/science/manpower/happiness caps
- [ ] `1000Years`, `blackSky`, `pacifism`, `unicornTears`, `postApocalypse` encoded (effects deferred to their respective epics but defs present)
- [ ] `ironWill` has no effects (unlocks IW mode on game start, no stackable reward)

### Legacy Reference
- `legacy/js/challenges.js` lines 43–484 (challenge definitions array)

### Status: [ ] Tests | [ ] Impl | [ ] Rated

---

## Story 6: SOFT_RESET integration — challenges reset on soft reset

**As a** game engine
**I want** challenges to reset on SOFT_RESET (active→false, pending→false) but preserve completions
**So that** challenge rewards persist but active challenges are cancelled

### Acceptance Criteria
- [ ] Given SOFT_RESET, all challenges have `active: false`, `pending: false`
- [ ] Given SOFT_RESET, `on` and `researched` are preserved (completions persist across resets)
- [ ] Given SOFT_RESET, `unlocked` follows `defaultUnlocked || prevUnlocked` (unlocked state preserved if already unlocked)
- [ ] ChallengeManager.resetState() is called by resetState() and only resets active/pending, NOT on/researched

### Legacy Reference
- `legacy/js/challenges.js` lines 488–494 (resetState)
- Key logic: `resetStateStackable` sets `active=false`, `pending=false`, but NOT `on` (that persists)

### Status: [ ] Tests | [ ] Impl | [ ] Rated

---

## Story 7: Save / load / reset for challenges state

**As a** game engine
**I want** challenges state to be serialized, deserialized, and reset correctly
**So that** save/load/reset works reliably

### Acceptance Criteria
- [ ] Given any challenges state, `serialize()` includes challenges field with name/researched/on/unlocked/active
- [ ] Given a serialized state, `deserialize()` + `ChallengeManager.load()` restores all challenge states
- [ ] Given `resetState()`, all challenge fields reset: `unlocked=defaultUnlocked`, `active=false`, `pending=false`, `researched=false`, `on=0`
- [ ] Given load with missing challenges field, challenges initialize to defaults
- [ ] Given legacy save with `researched=true` and `on=0`, load sets `on=1` (legacy compatibility)
- [ ] Given load with `currentChallenge` legacy field, that challenge's `active` is set to true

### Legacy Reference
- `legacy/js/challenges.js` lines 511–566 (save/load)
- Key logic: saves name/researched/on/unlocked/active; load replays legacy currentChallenge; researched+on=0 → on=1

### Status: [ ] Tests | [ ] Impl | [ ] Rated

---

## Story 8: Cross-manager integration — full tick with ChallengeManager

**As a** game engine
**I want** a cross-manager integration test covering the full tick loop with ChallengeManager
**So that** we verify manager interaction is correct

### Acceptance Criteria
- [ ] Given all managers registered including ChallengeManager, `tick()` advances without error
- [ ] Given `anarchy` challenge active, effectCache contains `kittenLaziness` effect
- [ ] Given `winterIsComing` completed 5 times, effectCache contains `springCatnipRatio` from stacked completions
- [ ] Given SOFT_RESET applied with active challenge, active becomes false but `on` count is preserved

### Legacy Reference
- `legacy/js/challenges.js` lines 568–587 (`update`)

### Status: [ ] Tests | [ ] Impl | [ ] Rated
