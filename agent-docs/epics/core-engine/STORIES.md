# Epic 03: Core Engine

**Status:** In Progress
**Started:** 2026-03-16
**Legacy references:** `legacy/game.js` (Timer:10, update:3891, updateModel:3940, updateCaches:2248, getLimitedDR:2269, EffectsManager:462), `legacy/core.js` (TabManager:30, updateEffectCached:125)

---

## Story Index

1. [Manager interface](#story-manager-interface)
2. [Effect cache system](#story-effect-cache-system)
3. [Diminishing returns (getLimitedDR)](#story-diminishing-returns)
4. [Tick engine](#story-tick-engine)
5. [Save/load serialization](#story-saveload-serialization)
6. [Reset state](#story-reset-state)

---

## Story: Manager Interface

**As a** engine developer
**I want** a typed `Manager` interface that all domain managers implement
**So that** the tick loop can dispatch to managers in a uniform, type-safe way

### Acceptance Criteria
- [x] Given a `Manager` interface, then it declares `update(state: GameState): GameState`
- [x] Given a `Manager` interface, then it declares `updateEffects(state: GameState): Record<string, number>`
- [x] Given a `Manager` interface, then it declares `save(state: GameState): Serializable`
- [x] Given a `Manager` interface, then it declares `load(saved: Serializable, state: GameState): GameState`
- [x] Given a `Manager` interface, then it declares `resetState(state: GameState): GameState`
- [x] Given a `NullManager` (no-op implementation), when all methods are called, then they return valid values without error

### Legacy Reference
- `legacy/core.js:30` — `TabManager` base class with `update()`, `save()`, `load()`, `resetState()`, `updateEffectCached()`

### Status
- [x] Tests written
- [x] Implementation complete
- [x] Self-rating passed

---

## Story: Effect Cache System

**As a** engine developer
**I want** a global effect cache that aggregates contributions from all managers
**So that** `getEffect("catnipPerTickBase")` returns the correct summed value from all active managers

### Acceptance Criteria
- [x] Given `buildEffectCache(managers, state)`, when called, then it returns a `Record<string, number>` of all effects
- [x] Given two managers each contributing `{ catnipPerTickBase: 1 }`, when the cache is built, then `catnipPerTickBase` equals 2
- [x] Given `getEffect(cache, "unknownEffect")`, then it returns 0
- [x] Given a manager contributing `{ catnipDemandRatio: 0.9 }`, when the cache is built, then diminishing returns are applied
- [x] Given an empty managers array, when the cache is built, then all effects return 0

### Legacy Reference
- `legacy/game.js:2248` — `updateCaches()` calls each manager's `updateEffectCached()` then reads `globalEffectsCached`
- `legacy/game.js:2244` — `getEffect(name)` returns `globalEffectsCached[name] || 0`

### Status
- [x] Tests written
- [x] Implementation complete
- [x] Self-rating passed

---

## Story: Diminishing Returns

**As a** engine developer
**I want** the `getLimitedDR(effect, limit)` function ported faithfully from legacy
**So that** demand reduction effects cannot stack to more than the intended cap

### Acceptance Criteria
- [x] Given `getLimitedDR(0.5, 1)`, when the input is below 75% of limit, then it returns 0.5 (no diminishing)
- [x] Given `getLimitedDR(0.75, 1)`, then it returns exactly 0.75 (boundary — no diminishing yet)
- [x] Given `getLimitedDR(1.0, 1)`, then the result is greater than 0.75 but less than 1.0 (diminished)
- [x] Given `getLimitedDR(100, 1)`, then the result approaches but never exceeds 1.0
- [x] Given `getLimitedDR(-0.5, 1)`, then it returns -0.5 (sign is preserved)
- [x] Given `getLimitedDR(-1.0, 1)`, then the result is less than -0.75 but greater than -1.0 (diminished, negative)
- [x] Given `getLimitedDR(0, 1)`, then it returns 0

### Legacy Reference
- `legacy/game.js:2269` — exact formula: first 75% undiminished; `delta = 0.25 * limit`; `diminishedEffect = (1 - delta/(diminishedPortion + delta)) * delta`

### Status
- [x] Tests written
- [x] Implementation complete
- [x] Self-rating passed

---

## Story: Tick Engine

**As a** engine developer
**I want** a `tick(state, managers)` pure function that advances the game by one step
**So that** the server can drive the game loop deterministically

### Acceptance Criteria
- [x] Given `tick(state, managers)`, then it increments `state.tick` by 1
- [x] Given `tick(state, managers)`, then it calls `manager.update(state)` for every registered manager in order
- [x] Given `tick(state, managers)`, then it calls `buildEffectCache(managers, state)` and stores the result in state
- [x] Given two managers, when manager A modifies `catnip` and manager B reads it, then B sees A's output (ordered execution)
- [x] Given `tick(state, managers)`, then it does NOT mutate the input state

### Legacy Reference
- `legacy/game.js:3891` — `update()` → `updateModel()` calls managers in fixed order
- `legacy/game.js:10` — `Timer.update()` manages frequency-based events

### Status
- [x] Tests written
- [x] Implementation complete
- [x] Self-rating passed

---

## Story: Save/Load Serialization

**As a** engine developer
**I want** pure `serialize(state)` and `deserialize(data)` functions
**So that** the server can persist and restore game state as plain JSON

### Acceptance Criteria
- [x] Given `serialize(state)`, then it returns a plain object with no class instances, Dates, or circular refs
- [x] Given `deserialize(serialize(state))`, then it returns a state equal to the original
- [x] Given a state with tick=42, when serialized then deserialized, then tick is still 42
- [x] Given `deserialize` with unknown fields, then it ignores them safely (forward compatibility)
- [x] Given `serialize(state)`, then the output is `JSON.stringify`-safe

### Legacy Reference
- `legacy/game.js:2393` — `save()` collects per-manager `save(data)` calls into a plain object
- `legacy/game.js:2529` — `load()` calls `resetState()` then restores from saved object

### Status
- [x] Tests written
- [x] Implementation complete
- [x] Self-rating passed

---

## Story: Reset State

**As a** engine developer
**I want** a `resetState(managers)` function that returns a fresh initial `GameState`
**So that** the server can implement `POST /api/game/reset`

### Acceptance Criteria
- [x] Given `resetState(managers)`, then it returns `createInitialState()` with tick 0
- [x] Given `resetState(managers)`, then it calls `manager.resetState(state)` on every manager in registration order
- [x] Given a state with tick=1000, when `resetState` is called, then the returned state has tick=0
- [x] Given `resetState(managers)`, then it does NOT mutate the input state

### Legacy Reference
- `legacy/game.js:2317` — `resetState()` re-initializes all properties then calls `manager.resetState()` on each

### Status
- [x] Tests written
- [x] Implementation complete
- [x] Self-rating passed
