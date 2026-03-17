# Epic: Science / Tech Tree

**Status:** Complete
**Started:** 2026-03-17
**Finished:** 2026-03-17
**Legacy refs:** `legacy/js/science.js`, `legacy/js/resPool.js`

---

## Story 1: TechDef and ScienceState shape

**As a** game engine
**I want** static technology definitions and a ScienceState type
**So that** the tech tree is fully defined and queryable

### Acceptance Criteria
- [x] Given `TECH_DEFS`, then it is a readonly array of `TechDef` objects
- [x] Given a `TechDef`, then it has `name: string`, `prices: PriceEntry[]`, and optional `effects: Record<string,number>` and `unlocks: TechUnlocks`
- [x] Given `TECH_DEFS`, then it contains the "calendar" tech with `prices: [{name:"science",val:30}]`
- [x] Given `TECH_DEFS`, then it contains "construction" with `effects: {queueCap: 1}`
- [x] Given `createInitialScience()`, then only tech "calendar" is `unlocked=true`; all others are `unlocked=false`
- [x] Given `createInitialScience()`, then no tech is `researched=true`
- [x] Given `ScienceState`, then it has `techs: Record<string, TechEntry>` where `TechEntry = {unlocked: boolean, researched: boolean}`

### Legacy Reference
- `legacy/js/science.js` lines 13–843 (techs array), lines 2313–2317 (resetState)

### Status: [x] Tests | [x] Impl | [x] Rated

---

## Story 2: POLICY_DEFS and policy state

**As a** game engine
**I want** static policy definitions and policy state in ScienceState
**So that** policies can be purchased and block each other

### Acceptance Criteria
- [x] Given `POLICY_DEFS`, then it is a readonly array of `PolicyDef` objects
- [x] Given a `PolicyDef`, then it has `name: string`, `prices: PriceEntry[]`, optional `effects: Record<string,number>`, and `blocks: string[]`
- [x] Given `POLICY_DEFS`, then it contains "liberty" with `blocks: ["tradition"]`
- [x] Given `createInitialScience()`, then all policies are `unlocked=false`, `blocked=false`, `researched=false`
- [x] Given `ScienceState`, then it has `policies: Record<string, PolicyEntry>` where `PolicyEntry = {unlocked: boolean, blocked: boolean, researched: boolean}`

### Legacy Reference
- `legacy/js/science.js` lines 850–2100 (policies array), lines 2319–2327 (resetState)

### Status: [x] Tests | [x] Impl | [x] Rated

---

## Story 3: RESEARCH action for technologies

**As a** player
**I want** to research a technology by paying its price
**So that** I can unlock further techs and gain their effects

### Acceptance Criteria
- [x] Given a tech is unlocked and affordable, when RESEARCH action fires, then science is deducted and `researched=true`
- [x] Given a tech is not unlocked, when RESEARCH action fires, then nothing changes
- [x] Given a tech is already researched, when RESEARCH action fires, then nothing changes
- [x] Given insufficient resources, when RESEARCH action fires, then nothing changes
- [x] Given RESEARCH "calendar", then `unlocks.tech: ["agriculture"]` causes "agriculture" to become `unlocked=true`
- [x] Given RESEARCH "calendar", then `unlocks.tech: ["agriculture"]` does NOT affect the "calendar" tech itself
- [x] Given a tech with multiple price resources, all prices are deducted on research
- [x] Given an unknown tech name in RESEARCH, then state is unchanged

### Legacy Reference
- `legacy/js/science.js` lines 2230–2244 (`get()`), lines 2330–2367 (`save/load` for researched tracking)
- Purchase flow implied from `BuildingNotStackableBtnController` / UI code lines 2528–2570

### Status: [x] Tests | [x] Impl | [x] Rated

---

## Story 4: RESEARCH_POLICY action

**As a** player
**I want** to research a policy by paying its price
**So that** I gain its effects and block competing policies

### Acceptance Criteria
- [x] Given a policy is unlocked and affordable, when RESEARCH_POLICY fires, then resources are deducted and `researched=true`
- [x] Given a policy is not unlocked, when RESEARCH_POLICY fires, then nothing changes
- [x] Given a policy is already researched, when RESEARCH_POLICY fires, then nothing changes
- [x] Given a policy is blocked, when RESEARCH_POLICY fires, then nothing changes
- [x] Given RESEARCH_POLICY "liberty", then "tradition" becomes `blocked=true`
- [x] Given RESEARCH_POLICY "tradition", then "liberty" becomes `blocked=true`
- [x] Given a policy with `unlocks.policies: [...]`, the listed policies become `unlocked=true`

### Legacy Reference
- `legacy/js/science.js` lines 2582–2594 (`onPurchase` — blocks competing policies)
- `legacy/js/science.js` lines 2528–2570 (`buyItem` — can't buy blocked/already-researched)

### Status: [x] Tests | [x] Impl | [x] Rated

---

## Story 5: updateEffects — tech and policy effects contribute to effectCache

**As a** resource manager
**I want** researched tech and policy static effects to appear in the effect cache
**So that** game systems are affected by what the player has researched

### Acceptance Criteria
- [x] Given no techs researched, when `updateEffects()` is called, then result is `{}`
- [x] Given "construction" is researched (effects: `{queueCap:1}`), when `updateEffects()`, then `{queueCap: 1}`
- [x] Given multiple techs with overlapping effect keys, then effects are **summed** (matching legacy `globalEffectsCached[name] += effect` pattern)
- [x] Given a researched policy with `effects`, then its effects are also included in the sum
- [x] Given a tick with ScienceManager registered and a researched tech, then effectCache contains that tech's effects

### Legacy Reference
- `legacy/js/science.js` lines 2385–2414 (commented-out `updateEffectCached` showing summing pattern)
- `legacy/js/science.js` lines 2209–2226 (`registerMeta` for both techs and policies)

### Status: [x] Tests | [x] Impl | [x] Rated

---

## Story 6: Tech unlock propagation on research

**As a** game engine
**I want** researching a tech to unlock the techs listed in its `unlocks.tech` array
**So that** the tech tree advances correctly

### Acceptance Criteria
- [x] Given "calendar" is researched, then "agriculture" becomes `unlocked=true`
- [x] Given "agriculture" is researched, then "mining" and "archery" become `unlocked=true`
- [x] Given "calendar" is researched, techs NOT in its unlock list remain `unlocked=false`
- [x] Given a tech with no `unlocks.tech`, researching it does not change any tech unlock state
- [x] Given a policy with `unlocks.policies`, researching it unlocks those policies

### Legacy Reference
- `legacy/js/science.js` lines 13–50 (calendar/agriculture unlock chain)
- `legacy/js/science.js` lines 2340–2366 (load — re-applies unlocks for researched items)

### Status: [x] Tests | [x] Impl | [x] Rated

---

## Story 7: Save / load / reset

**As a** game engine
**I want** ScienceState to serialize and restore correctly
**So that** save games preserve all research progress

### Acceptance Criteria
- [x] Given a science state with some techs researched, when `save()`+`load()` round-trips, the `researched` and `unlocked` flags are preserved
- [x] Given a science state with a policy researched and another blocked, the `blocked` flag survives round-trip
- [x] Given `resetState()`, then only "calendar" is unlocked, all else false
- [x] Given missing science save data, then defaults to initial state
- [x] Given `GameState`, then it has a `science: ScienceState` field
- [x] Given tick.test.ts MarkedState interface, then it includes `science` field

### Legacy Reference
- `legacy/js/science.js` lines 2313–2367 (`resetState`, `save`, `load`)

### Status: [x] Tests | [x] Impl | [x] Rated
