# Epic: science — Notes

## Legacy Behavior Summary

Legacy files: `legacy/js/science.js`, `legacy/js/resPool.js` (for scienceMax effects)

### Data model
- **techs[]** — 50+ technology definitions, each with:
  - `name` — unique identifier
  - `prices[]` — array of `{name, val}` cost entries (usually science, sometimes manuscript/compedium/blueprint/relic/timeCrystal/void/unobtainium)
  - `unlocks` — object with optional `tech[]`, `buildings[]`, `jobs[]`, `upgrades[]`, `crafts[]`, `tabs[]`, `policies[]`, `stages[]` etc.
  - `effects` — optional plain effects object (e.g. `{queueCap: 1}`)
  - `calculateEffects` — optional function (dynamic effects; deferred to future epics)
  - `unlocked` — boolean (initially only "calendar" is unlocked)
  - `researched` — boolean (initially false for all)
- **policies[]** — ~60+ policy definitions, each with:
  - `name`, `prices[]`, `effects`, `unlocked`, `blocked`, `researched`
  - `blocks[]` — policy names that become blocked when this is researched
  - `calculateEffects` — optional (deferred)
  - `evaluateLocks` — optional (deferred)

### Key behaviors
1. **Initial state**: only tech "calendar" is unlocked (`tech.unlocked = tech.name == "calendar"`). No policies unlocked. Nothing researched.
2. **RESEARCH action**: deduct prices from resources, mark tech as `researched=true`, apply `unlocks` to unlock further techs/buildings/jobs/policies
3. **Effects**: researched techs with static `effects` contribute to effect cache via `updateEffects()`
4. **Tech unlock chain**: `unlocks.tech[]` lists tech names that become available when this tech is researched
5. **Policy blocking**: researching a policy marks its `blocks[]` items as `blocked=true`
6. **Policy effects**: same as tech effects — researched policies contribute to effect cache

### Scope decisions for Epic 08
- Implement all tech definitions as `TECH_DEFS` (static, like BUILDING_DEFS)
- Implement all policy definitions as `POLICY_DEFS` (static)
- `ScienceState` = `{ techs: Record<name, {unlocked, researched}>, policies: Record<name, {unlocked, blocked, researched}> }`
- `RESEARCH` action for techs
- `RESEARCH_POLICY` action for policies
- `updateEffects()` collects all researched tech + policy static effects
- `unlocks.tech[]` processed on research — unlocks further techs in state
- `unlocks.policies[]` processed on research — unlocks policies
- **Deferred**: `unlocks.buildings/jobs/upgrades/crafts/stages/tabs` — these cross domains not yet wired (buildings are already defined; the "unlock" mechanism for showing them to the player is a future epic). We record the unlock lists in tech defs but don't process cross-domain unlocks yet.
- **Deferred**: `calculateEffects` functions on specific techs/policies
- **Deferred**: `evaluateLocks` dynamic lock evaluation
- **Deferred**: policy `blocks[]` validation at purchase time (just mark blocked on purchase)

### Save/load
- Legacy saves: `techs: filterMetadata(techs, ["name","unlocked","researched"])` — only these 3 fields per tech
- Legacy saves: `policies: filterMetadata(policies, ["name","unlocked","blocked","researched"])`
- On load: re-apply all `unlocks` for researched items

### Effect cache integration
- Tech effects contribute via the same flat key pattern: `{scienceRatio: 0.1}` from library (already a building effect)
- Some techs have their own effects (e.g. `construction: {queueCap: 1}`)
- On each tick, ScienceManager.updateEffects() sums all `researched=true` tech+policy effects

### Tech count
Counting from the file: approximately 50 techs in the `techs` array (many late-game).

## Key Decisions

1. `ScienceState` holds `techs` and `policies` as flat Record maps (by name), matching our existing pattern (buildings, village.jobs, etc.)
2. `TECH_DEFS` is a static readonly array — same pattern as `BUILDING_DEFS`
3. `POLICY_DEFS` is a static readonly array
4. `canResearch(techName, state)` helper — checks unlocked, not yet researched, can afford
5. Only the "calendar" tech is unlocked at game start (matching legacy `resetState`)
6. `unlocks.tech[]` and `unlocks.policies[]` are processed on research; other unlock types (`buildings`, `jobs`, etc.) are recorded in defs but not cross-domain wired yet
7. `calculateEffects` functions are skipped for now (only static `effects` objects processed)

## Gotchas & Edge Cases

- Tech name "calendar" is the FIRST unlocked tech — don't confuse with the CalendarManager
- Some techs have `prices` with multiple resources (e.g. `theology` costs both science AND manuscript)
- `resetState` must restore `calendar` as the only unlocked tech
- Policy `blocks[]` must be applied when policy is purchased
- The `brewery` tech has a comment "NOT USED ANYMORE" but still exists in the array — include it
- `effects` key is optional on many techs (most just unlock things, have no direct effects)
- `construction` has `{queueCap: 1}` — one of the few early techs with direct effects

## Open Questions

- Should we scope `POLICY_DEFS` to a subset for Epic 08, or implement all? → Implement all as static defs, tests cover key behaviors
- What about dynamic `calculateEffects`? → Skip for Epic 08 (only static `effects` objects processed)
