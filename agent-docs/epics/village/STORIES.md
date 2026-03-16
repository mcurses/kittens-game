# Epic 06: Village / Population / Jobs

**Status:** In Progress
**Started:** 2026-03-16
**Legacy references:** `legacy/js/village.js` (VillageManager, 5284 lines)

---

## Story Index

1. [Village state](#story-village-state)
2. [Kitten growth](#story-kitten-growth)
3. [Kitten death](#story-kitten-death)
4. [Job definitions and production](#story-job-definitions-and-production)
5. [Job assignment actions](#story-job-assignment-actions)
6. [Serialization](#story-serialization)

---

## Story: Village State

**As a** engine developer
**I want** a `VillageState` type in `GameState` that tracks kittens, jobs, and kitten growth progress
**So that** the population system has a home in the game state

### Acceptance Criteria
- [x] Given `createInitialVillage()`, then kittens=0, kittenProgress=0, jobs all value=0
- [x] Given `JOB_DEFS`, then it contains woodcutter, farmer, scholar, hunter, miner, geologist, priest
- [x] Given `createInitialState()`, then `state.village` is a VillageState with all jobs at 0

### Legacy Reference
- `legacy/js/village.js` — VillageManager with jobs array

### Status
- [x] Tests written
- [x] Implementation complete

---

## Story: Kitten Growth

**As a** engine developer
**I want** `VillageManager.update()` to accumulate kitten progress and add new kittens
**So that** the village population grows over time

### Acceptance Criteria
- [x] Given `kittensPerTickBase: 0.01` in effectCache, when update() is called, then kittenProgress increases by 0.01
- [x] Given kittenProgress >= 1 and kittens < maxKittens, when update() is called, then kittens increases by 1 and progress resets by -1
- [x] Given kittens >= maxKittens, when update() is called, then no new kittens are added
- [x] Given maxKittens = 0 (no housing), then kittens do not grow even if progress >= 1

### Legacy Reference
- `legacy/js/village.js` — `addKitten()` / kitten growth accumulator

### Status
- [x] Tests written
- [x] Implementation complete

---

## Story: Kitten Death

**As a** engine developer
**I want** kittens to die when catnip is exhausted
**So that** resource starvation has consequences

### Acceptance Criteria
- [x] Given catnip.value + catnipPerTick < 0, when update() is called, then one kitten is killed
- [x] Given catnip is sufficient, then no kittens die
- [x] When a kitten dies, its job slot is freed (assigned jobs reduced)

### Legacy Reference
- `legacy/js/village.js` — kitten death logic when catnip < 0

### Status
- [x] Tests written
- [x] Implementation complete

---

## Story: Job Definitions and Production

**As a** engine developer
**I want** `VillageManager.updateEffects()` to contribute job production to the effect cache
**So that** farmers increase catnipPerTickBase and woodcutters increase woodPerTickBase

### Acceptance Criteria
- [x] Given 1 farmer, then `catnipPerTickBase` contribution = 1.0
- [x] Given 1 woodcutter, then `woodPerTickBase` contribution = 0.018
- [x] Given N kittens, then `catnipPerTickCon` = -0.85 * N
- [x] Given N kittens, then `fursPerTickCon` = -0.01 * N
- [x] Given N kittens, then `ivoryPerTickCon` = -0.007 * N
- [x] Given N kittens, then `spicePerTickCon` = -0.001 * N

### Legacy Reference
- `legacy/js/village.js` — job base production values

### Status
- [x] Tests written
- [x] Implementation complete

---

## Story: Job Assignment Actions

**As a** engine developer
**I want** `ASSIGN_JOB` and `UNASSIGN_JOB` actions to modify job worker counts
**So that** the player can direct kittens to different jobs

### Acceptance Criteria
- [x] Given `ASSIGN_JOB { job: "woodcutter" }` when idle kittens exist, then woodcutter.value increases by 1
- [x] Given `ASSIGN_JOB` when no idle kittens (all assigned), then state is unchanged
- [x] Given `UNASSIGN_JOB { job: "woodcutter" }` when woodcutter.value > 0, then woodcutter.value decreases by 1
- [x] Given `UNASSIGN_JOB` when job.value = 0, then state is unchanged
- [x] Given `ASSIGN_JOB` for unknown job, then state is unchanged

### Legacy Reference
- `legacy/js/village.js` — `assignJob()` / `unassignJob()`

### Status
- [x] Tests written
- [x] Implementation complete

---

## Story: Serialization

**As a** engine developer
**I want** VillageState to be serialized and deserialized
**So that** kitten counts and job assignments persist across save/load cycles

### Acceptance Criteria
- [x] Given `serialize(state)`, then `serialized.village` contains kittens, jobs, progress
- [x] Given `deserialize(serialize(state))`, then village values match original state
- [x] Given `deserialize` with missing village field, then it falls back to `createInitialVillage()`

### Status
- [x] Tests written
- [x] Implementation complete
