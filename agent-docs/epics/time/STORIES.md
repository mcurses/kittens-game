# Epic 15: Time Mechanics — Stories

## Story 1: TimeState shape and initial values

**As a** game engine
**I want** a TimeState with CFU, VSU, heat, and flux
**So that** time mechanics state can be serialized

### Acceptance Criteria
- [x] Given a fresh game, when `createInitialTime()` is called, then heat=0, flux=0
- [x] Given initial state, temporalBattery and blastFurnace are unlocked (and temporalAccelerator)
- [x] Given initial state, all 8 CFUs are present and all 6 VSUs are present
- [x] Given initial state, blastFurnace has heat=0

---

## Story 2: BUY_CFU action

**As a** player
**I want** to buy Chronoforge upgrades
**So that** I gain time-related effects

### Acceptance Criteria
- [x] Given sufficient timeCrystals, when BUY_CFU("temporalBattery") dispatched, then resources deducted and val/on incremented
- [x] Given insufficient resources, when BUY_CFU dispatched, then state unchanged
- [x] Given CFU not unlocked, when BUY_CFU dispatched, then state unchanged
- [x] Price scales by priceRatio^count

---

## Story 3: BUY_VSU action

**As a** player
**I want** to buy Voidspace upgrades
**So that** I gain void-related effects

### Acceptance Criteria
- [x] Given sufficient resources (void, karma, timeCrystal), when BUY_VSU dispatched, then resources deducted and val/on incremented
- [x] Given VSU not unlocked, when BUY_VSU dispatched, then state unchanged
- [x] Price scales by priceRatio^count

---

## Story 4: Heat mechanics (tick)

**As a** game engine
**I want** heat to accumulate in the blastFurnace
**So that** timeCrystal shattering is enabled

### Acceptance Criteria
- [x] Given heat > 0 in TimeState, when TimeManager.update() runs, then heat decreases by heatPerTick
- [x] Given heat transferred, blastFurnace.heat increases by transferred amount
- [x] Given heat reaches 0, isAccelerated becomes false

---

## Story 5: SHATTER_TC action

**As a** player
**I want** to shatter timeCrystals using blastFurnace heat
**So that** I can advance the game year and gain flux

### Acceptance Criteria
- [x] Given blastFurnace on >= 1 and heat >= 100, when SHATTER_TC dispatched, then heat reduced by 100
- [x] Given successful shatter, calendar year increments by 1
- [x] Given successful shatter, flux increments
- [x] Given blastFurnace.on = 0, when SHATTER_TC dispatched, then state unchanged
- [x] Given heat < 100, when SHATTER_TC dispatched, then state unchanged

---

## Story 6: TimeManager.updateEffects

**As a** game engine
**I want** CFU/VSU effects to contribute to the effect cache
**So that** time-related bonuses apply

### Acceptance Criteria
- [x] Given temporalBattery (val=1, on=1), when updateEffects(), then temporalFluxMax += 750
- [x] Given blastFurnace (val=1, on=1), when updateEffects(), then heatPerTick += 0.02, heatMax += 100
- [x] Given voidRift (val=1, on=1), when updateEffects(), then umbraBoostRatio += 0.1, globalResourceRatio += 0.02
- [x] Given CFU with on=0, contributions are 0

---

## Story 7: CFU unlock propagation

**As a** game engine
**I want** purchasing a CFU to unlock dependent CFUs
**So that** the upgrade tree progresses

### Acceptance Criteria
- [x] Given blastFurnace purchased (val>0), when unlock chain runs, then timeBoiler becomes unlocked
- [x] Given temporalAccelerator purchased (val>0), when unlock chain runs, then temporalImpedance becomes unlocked

---

## Story 8: Save / load / reset for time state

**As a** game engine
**I want** time state to persist across save/load cycles
**So that** heat, flux, and upgrade progress are preserved

### Acceptance Criteria
- [x] Given time state with CFU vals and heat, when serialized and deserialized, then values are restored
- [x] Given a soft reset, when TimeManager.resetState() is called, then heat=0, flux=0, all vals reset
- [x] Given a load with blastFurnace val>0, timeBoiler is re-unlocked

---

## Story 9: Cross-manager integration test

**As a** developer
**I want** a full tick loop test with TimeManager
**So that** time mechanics interact correctly with the engine

### Acceptance Criteria
- [x] Given heat=100 and blastFurnace.on=1, when SHATTER_TC dispatched, calendar year increments
- [x] Given full tick loop with all managers including TimeManager, when 5 ticks run, no errors
- [x] Given temporalBattery (on=1), when tick runs, effectCache includes temporalFluxMax

