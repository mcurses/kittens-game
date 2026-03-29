# Epic: 21

**Status:** Complete
**Started:** 2026-03-20
**Legacy refs:** legacy/js/village.js, legacy/js/buildings.js, legacy/js/resources.js, legacy/game.js, legacy/test/game.test.js

---

## Story: kittensPerTickBase base value

**As a** player
**I want** kittens to arrive after building huts
**So that** I can grow my village

### Acceptance Criteria
- [x] Given a hut is built (maxKittens=2), when ticks pass, then kittenProgress increases at 0.01 per tick
- [x] Given kittenProgress >= 1 and kittens < maxKittens, then kittens increment
- [x] Given a kittenGrowthRatio effect in effectCache, then kittensPerTick = 0.01 * (1 + kittenGrowthRatio)

### Legacy Reference
- `legacy/js/village.js` line 7: `kittensPerTickBase: 0.01` (hardcoded constant)
- `legacy/js/village.js` line 319: `kittensPerTick = this.kittensPerTickBase * (1 + this.game.getEffect("kittenGrowthRatio"))`

### Status: [x] Tests | [x] Impl | [x] Rated

---

## Story: Building unlock system (unlockRatio + requiredTech)

**As a** player
**I want** buildings to appear only when I have enough resources
**So that** the early game isn't overwhelming with unaffordable options

### Acceptance Criteria
- [x] Given BuildingDef has unlockRatio:0.3, when player has ≥30% of all prices, then building.unlocked=true
- [x] Given a building has requiredTech:["agriculture"], when tech is not researched, then building.unlocked=false
- [x] Given field (catnip:10, unlockRatio:0.3), when catnip≥3, then field is unlocked
- [x] Given field is unlocked, when catnip drops below threshold, then field remains unlocked (one-way)
- [ ] BuildingsPanel shows only buildings where unlocked=true
- [ ] BuildingManager.update() checks unlock conditions every tick

### Legacy Reference
- `legacy/js/buildings.js` lines 2578–2601: `isUnlocked()` checks unlockRatio against current resource values
- `legacy/js/buildings.js` lines 2524–2533: buildings auto-unlock via `update()` when conditions met, never lock back
- `legacy/js/buildings.js` lines 283–287: `unlockRatio`, `requiredTech`, `defaultUnlockable` doc

### Status: [x] Tests | [x] Impl | [x] Rated

---

## Story: Happiness calculation updates each tick

**As a** player
**I want** happiness to decrease as kitten population grows beyond 5
**So that** I need to manage luxury resources and other happiness sources

### Acceptance Criteria
- [x] Given kittens ≤ 5, when tick runs, then happiness = 1.0 (100%)
- [x] Given kittens = 7, when tick runs, then happiness = 0.96 (2% penalty per kitten above 5)
- [x] Given kittens = 100, when tick runs, then happiness ≥ 0.25 (minimum 25%)
- [x] Given a happiness effect in effectCache, when tick runs, then happiness += that effect / 100

### Legacy Reference
- `legacy/js/village.js` lines 756–838: `updateHappines()` — starts at 100, subtracts per-kitten unhappiness, adds effect bonuses, clamps to min 25%
- `legacy/js/village.js` line 11: `happiness: 1` (initial value)

### Status: [x] Tests | [x] Impl | [x] Rated

---

## Story: Job production scales with happiness

**As a** player
**I want** woodcutter/farmer/etc production to scale with happiness
**So that** maintaining high happiness meaningfully improves resource production

### Acceptance Criteria
- [x] Given happiness = 0.5, when woodcutter produces 0.018/tick, then effective production = 0.009/tick
- [x] Given happiness = 1.0 (default), when any job produces, then production is unchanged (×1.0)
- [ ] Happiness scaling applies to positive job contributions only (consumption unchanged)

### Legacy Reference
- `legacy/js/village.js` line 538: `diff *= happiness` for positive resource production from jobs
- `legacy/js/village.js` line 506–507: `happiness = this.happiness + (this.happiness - 1) * happinessKittenProductionRatio`

### Status: [x] Tests | [x] Impl | [x] Rated

---

## Story: Cross-manager integration test for parity

**As a** developer
**I want** a full-tick integration test verifying early-game progression
**So that** kitten arrival, building unlock, and production all work together

### Acceptance Criteria
- [x] Given fresh state with 30 catnip, when tick runs, then field building is unlocked
- [x] Given fresh state with hut built (maxKittens=2), when 101 ticks run, then kittens=1
- [x] Given 1 woodcutter assigned, when tick runs, then wood increases

### Legacy Reference
- Integration behavior from game loop

### Status: [x] Tests | [x] Impl | [x] Rated

---

## Story: catnipDemandRatio applied to kitten catnip consumption

**As a** player
**I want** pasture buildings to actually reduce catnip consumption
**So that** building pastures has a meaningful impact on my catnip balance

### Acceptance Criteria
- [x] Given 1 pasture built (catnipDemandRatio = -0.005), when tick runs, then catnip consumption = -0.85 * kittens * (1 + -0.005)
- [x] Given catnipDemandRatio = 0 (no pastures), then consumption = -0.85 * kittens (unchanged)

### Legacy Reference
- `legacy/game.js` line 3722: `resConsumption *= 1 + this.getEffect(res.name + "DemandRatio")`
- Applied to the raw kitten consumption from `village.getResConsumption()`

### Status: [ ] Tests | [ ] Impl | [ ] Rated

---

## Story: unhappinessRatio effect scales happiness penalty

**As a** player
**I want** the unhappiness penalty per kitten to be modifiable by effects
**So that** late-game mechanics that adjust unhappinessRatio function correctly

### Acceptance Criteria
- [x] Given unhappinessRatio = 0 (default), when 10 kittens, then happiness penalty = 2% * 5 overpopulated = 10% (current behavior unchanged)
- [x] Given unhappinessRatio = 0.5 (50% more unhappy), when 10 kittens, then happiness penalty = 2 * 1.5 * 5 = 15%

### Legacy Reference
- `legacy/js/village.js` line 761: `( this.getKittens() - 5 ) * populationPenalty * (1 + this.game.getEffect("unhappinessRatio"))`

### Status: [ ] Tests | [ ] Impl | [ ] Rated
