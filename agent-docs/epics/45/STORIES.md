# Epic: 45

**Status:** Reopened
**Started:** 2026-04-06
**Legacy refs:** `legacy/game.js`, `legacy/js/resources.js`, `legacy/js/buildings.js`, live save `agent-docs/example-saves/Kittens Game - Run 8 - Year 10527 - Autumn, day 48.txt`

---

## Story: Preserve imported over-cap resource stocks

**As a** player importing a mature legacy save
**I want** resource amounts above current storage caps to survive import intact
**So that** the imported game state matches legacy instead of silently discarding stockpiled resources

### Acceptance Criteria
- [x] Given a legacy save with over-cap resources, when it is imported into the rewrite, then imported `resources[*].value` is preserved even when it exceeds current `maxValue`
- [x] Given the same imported save, when the first serialized state is returned from `/api/game/import-legacy`, then resource values match legacy runtime state rather than being clamped to rewrite storage caps
- [x] Given a subsequent normal tick or spend event, when the rewrite updates resource state, then post-import over-cap values behave like legacy instead of being truncated during load
- [x] Given a live-save regression fixture derived from `Run 8 / Year 10527 / Autumn day 48`, when parity tests run, then catnip, wood, minerals, science, faith, antimatter, and unobtainium prove this preservation behavior explicitly

### Legacy Reference
- `legacy/game.js` save import/load flow
- `legacy/js/resources.js` load/max-resource behavior
- Live audit against `https://kittensgame.com/web/`

### Status: [x] Tests | [x] Impl | [ ] Rated

**Rating: 4** — Fixed 2026-04-07: `syncResourceCaps` now never clamps values (removed `preserveOverCap` flag), and `ResourceManager.update` uses `limit = Math.max(prevValue, maxValue)` matching legacy `addRes` behavior. Over-cap stocks are preserved across ticks, not just at import time.

## Story: Recompute imported derived caps and population stats faithfully

**As a** player importing a legacy save
**I want** derived values like storage, housing, and happiness to match legacy after import
**So that** the imported save does not show impossible or contradictory state

### Acceptance Criteria
- [x] Given the Run 8 fixture, when the first `/api/game/import-legacy` response is returned, then `maxKittens` matches legacy so the imported snapshot does not show `579 / 562` for a legacy `579 / 579` save
- [x] Given the same fixture, when effect caches and resource caps are rebuilt in the live running slot, then derived max values match legacy formulas for the imported state rather than only the rewrite’s current partial implementation
- [x] Given the same fixture, when the imported slot is allowed to tick normally, then kitten population never exceeds `floor(maxKittens)` in the live slot
- [x] Given the same fixture, when happiness is computed after import, then the rewrite matches legacy closely enough for a parity assertion or explicitly documents any remaining deferred terms in `PARITY.md`
- [x] Given a live-save parity test, when the imported snapshot is compared against legacy, then derived values are checked end-to-end instead of inferring parity from defs alone

### Legacy Reference
- `legacy/js/village.js`
- `legacy/js/resources.js`
- `legacy/js/buildings.js`

### Status: [x] Tests | [x] Impl | [ ] Rated

**Rating: 4** — Fixed 2026-04-08: Three root causes resolved (amphitheatre stage migration, cathPollution/pollutionHappines, brewery festivalRatio). Happiness matches legacy to <1e-5 tolerance. Kitten cap floors maxKittens, preventing overflow. `parity:run8` passes with 200 ticks.

## Story: Add imported snapshot parity regression coverage

**As a** maintainer
**I want** a fixture-driven parity test around a real late-game imported save
**So that** future migration or storage changes cannot silently reintroduce import mismatches

### Acceptance Criteria
- [x] A regression fixture based on `agent-docs/example-saves/Kittens Game - Run 8 - Year 10527 - Autumn, day 48.txt` is used in automated tests
- [x] The parity test asserts exact or tolerance-based matches for:
  - [x] year / season / day
  - [x] kitten count and max kittens
  - [x] representative resource values and caps
  - [x] representative building counts and on/off state
  - [x] representative imported progression state such as selected workshop upgrades and policies
- [x] The test compares the immediate post-import rewrite snapshot, not a later auto-ticked state
- [x] `agent-docs/PARITY.md` and epic notes stay aligned with what the regression actually proves

### Legacy Reference
- Live audit against `https://kittensgame.com/web/`
- `packages/engine/src/legacy-migration.ts`
- `packages/server/src/app.ts`

### Status: [x] Tests | [x] Impl | [ ] Rated

**Rating: 4** — The regression test still proves immediate import-response parity for the fixture, but the 2026-04-07 live Chrome MCP audit showed that the docs had overstated that result as full live runtime parity. The test remains useful, but the tracker/docs must reflect that it only proves the immediate post-import snapshot.

## Story: Add low-overhead live parity audit tooling

**As a** maintainer
**I want** a cheap local parity audit path for the Run 8 fixture
**So that** future Epic 45 checks do not need Chrome MCP except when refreshing the canonical legacy snapshot

### Acceptance Criteria
- [x] A checked-in legacy snapshot artifact derived from the Chrome MCP audit exists for the Run 8 fixture
- [x] A local command compares the rewrite's immediate import snapshot and live-after-ticks state against that artifact
- [x] The command reports only mismatched fields at the curated parity surface instead of diffing the full game state
- [x] The epic notes and tracker point future audits at the local command first, with Chrome MCP reserved for recalibrating the legacy fixture

### Legacy Reference
- `agent-docs/example-saves/run8-legacy-snapshot.json`
- Live audit against `https://kittensgame.com/web/`
- `packages/server/src/liveParity.ts`

### Status: [x] Tests | [x] Impl | [ ] Rated

**Rating: 4** — Added a checked-in legacy snapshot plus `pnpm --filter @kittens/server parity:run8`, which compares only the parity-critical fields and exits non-zero on current mismatches.
