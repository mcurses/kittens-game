# Epic: 46

**Status:** In Progress
**Started:** 2026-04-07
**Legacy refs:** `legacy/js/science.js`, `legacy/js/workshop.js`, `legacy/game.js`, live slot `new`

---

## Story: Propagate tech workshop unlocks on research

**As a** player researching technologies in a normal live save
**I want** workshop upgrades and crafts from researched techs to unlock immediately
**So that** the workshop panel exposes the same options legacy does

### Acceptance Criteria
- [x] Given a tech whose `unlocks` include workshop `upgrades`, when that tech is researched in the rewrite, then those upgrades become `unlocked=true` in `state.workshop.upgrades`
- [x] Given a tech whose `unlocks` include workshop `crafts`, when that tech is researched in the rewrite, then those crafts become `unlocked=true` in `state.workshop.crafts`
- [x] Given the current `slot=new` progression state, when the live slot is inspected after load, then the workshop unlock surface includes the legacy-expected items implied by researched techs instead of only the initial upgrade set plus `titaniumBarns`
- [ ] Given the same live slot, when the workshop panel renders, then the newly unlocked items are visible without requiring unrelated actions or a manual refresh workaround

### Legacy Reference
- `legacy/js/science.js` load/research unlock replay
- `legacy/game.js` `game.unlock()` multi-unlock behavior

### Status: [x] Tests | [x] Impl | [ ] Rated

## Story: Replay workshop unlock chains on save load and legacy import

**As a** player loading an existing save or importing a legacy save
**I want** researched tech and upgrade unlock chains to be replayed during deserialize/load
**So that** workshop visibility matches legacy after reload instead of drifting from the researched progression state

### Acceptance Criteria
- [x] Given a serialized rewrite save with researched techs that unlock workshop upgrades or crafts, when the store deserializes that save, then workshop unlock flags are restored or replayed consistently with legacy
- [x] Given a legacy-derived save import, when researched techs are loaded into the rewrite, then the workshop unlock surface matches the imported progression state without needing those techs to be re-bought
- [ ] Given researched workshop upgrades that unlock downstream upgrades, when the save is loaded, then the downstream unlock chain is replayed the way legacy `workshop.load()` replays researched upgrade unlocks
- [x] Given a regression test around load/import, when parity assertions run, then missing workshop unlocks fail explicitly with field-level mismatch output

### Legacy Reference
- `legacy/js/science.js:2340-2366`
- `legacy/js/workshop.js:2401-2428`
- `legacy/game.js:5324-5358`

### Status: [x] Tests | [x] Impl | [ ] Rated

## Story: Add a live regression fixture for workshop unlock parity

**As a** maintainer
**I want** a cheap automated regression around the `slot=new` workshop symptom
**So that** future science/workshop work cannot silently reintroduce under-unlocked workshop state

### Acceptance Criteria
- [x] A regression test or fixture proves the researched-tech set from the reported `slot=new` state unlocks the expected workshop upgrades and crafts
- [x] The regression output names the missing upgrades/crafts directly, rather than failing with a generic count mismatch
- [x] `agent-docs/PARITY.md`, `PROGRESS.md`, and these stories document that this epic exists because live workshop unlock parity was broken in a normal non-imported save

### Legacy Reference
- Live audit of `slot=new`
- `packages/engine/src/science.ts`
- `packages/engine/src/workshop.ts`

### Status: [x] Tests | [x] Impl | [ ] Rated
