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
- [x] Given the current `slot=new` progression state, when the live slot is inspected after full server load, then the workshop unlock surface includes the legacy-expected items implied by researched techs instead of only the initial upgrade set plus `titaniumBarns`
- [x] Given the same live slot, when the workshop panel renders, then the newly unlocked items are visible without requiring unrelated actions or a manual refresh workaround

### Legacy Reference
- `legacy/js/science.js` load/research unlock replay
- `legacy/game.js` `game.unlock()` multi-unlock behavior

### Status: [x] Tests | [x] Impl | [ ] Rated

**Rating: 4** — WorkshopPanel is a pure functional React component receiving state via TanStack Query props. Mutations and WebSocket STATE_DELTA events update the query cache, triggering automatic re-renders. No manual refresh needed.

## Story: Replay workshop unlock chains on save load and legacy import

**As a** player loading an existing save or importing a legacy save
**I want** researched tech and upgrade unlock chains to be replayed during deserialize/load
**So that** workshop visibility matches legacy after reload instead of drifting from the researched progression state

### Acceptance Criteria
- [x] Given a serialized rewrite save with researched techs that unlock workshop upgrades or crafts, when the store deserializes that save, then workshop unlock flags are restored or replayed consistently with legacy
- [x] Given a legacy-derived save import, when researched techs are loaded into the rewrite, then the workshop unlock surface matches the imported progression state without needing those techs to be re-bought
- [x] Given researched workshop upgrades that unlock downstream upgrades, when the save is loaded, then the downstream unlock chain is replayed the way legacy `workshop.load()` replays researched upgrade unlocks
- [x] Given a regression test around the full store load/import path, when parity assertions run, then missing workshop unlocks fail explicitly with field-level mismatch output

### Legacy Reference
- `legacy/js/science.js:2340-2366`
- `legacy/js/workshop.js:2401-2428`
- `legacy/game.js:5324-5358`

### Status: [x] Tests | [x] Impl | [ ] Rated

**Rating: 4** — Legacy import goes through `_fullDeserialize()` which runs `ScienceManager.load()` then `WorkshopManager.load()` with the merge fix. Workshop unlock chains are fully replayed for imported saves. Full-store regression test in `store.test.ts` covers the stale-save healing path.

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

## Reopen Findings — 2026-04-08

- Live `slot=new` still loads with only `mineralHoes`, `ironHoes`, `mineralAxes`, `ironAxes`, `stoneBarns`, `reinforcedBarns`, and `titaniumBarns` unlocked, plus only the initial craft set.
- The researched tech set in that same slot still includes `calendar`, `agriculture`, `archery`, `mining`, `metal`, `animal`, `civil`, `math`, `construction`, `engineering`, `currency`, `writing`, `philosophy`, and `steel`, so legacy-faithful load replay should unlock many more workshop entries.
- Root cause: `GameStateStore._fullDeserialize()` loads `ScienceManager` before `WorkshopManager`, so the workshop unlocks replayed by `ScienceManager.load()` are later overwritten by stale saved workshop flags from `WorkshopManager.load()`.
- Epic 46 was closed too early because the tests covered `ScienceManager.load()` in isolation, not the real store deserialize order used by existing saves.

## Fix Results — 2026-04-08

- `WorkshopManager.load()` now starts from `state.workshop`, preserving workshop unlocks replayed earlier in the deserialize pass.
- Saved workshop `unlocked` flags are merged with current replayed state instead of replacing it, so old saves heal on load.
- Researched workshop upgrades now replay their downstream `unlocks.upgrades` chain during load, matching legacy `workshop.load()`.
- A full `GameStateStore.init()` regression now proves the stale `slot=new` save shape heals correctly.
- A practical replay using the current exported `slot=new` payload now yields zero missing expected upgrades and zero missing expected crafts under the patched load path.
