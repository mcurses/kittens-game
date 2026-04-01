# Epic 33 — UI Unlock & Visibility Parity — Notes

## Legacy Behavior Summary

This audit was triggered by concrete parity bugs already visible in the rewrite:

- `packages/client-web/src/TabContainer.tsx` hardcodes `buildings`, `jobs`, and `workshop` as always visible.
- `packages/client-web/src/JobsPanel.tsx` renders every serialized job entry and does not check unlock state.
- `packages/client-web/src/ResourcePanel.tsx` currently uses `value > 0` as the visibility heuristic, while legacy tracks resource `unlocked` separately.
- The current client has no Stats or Challenges tabs at all, even though legacy tab visibility is part of the standard progression model.

Legacy visibility is not a single rule. It is split across:

- top-level tab gating in `legacy/game.js:updateTabVisibility()`
- per-tab fallback when the active tab disappears in `legacy/js/ui.js`
- job and village panel gating in `legacy/js/village.js`
- button-level `model.visible` conditions in Village, Religion, Time, Space, and Trade code
- item-level `meta.unlocked` / `evaluateLocks()` checks in Science, Workshop, Religion, Time, and Space

## Audit Findings

### 1. Main tab gating is still simplified in the rewrite

Legacy:
- Village visibility: `hut.on > 0 || kittens.unlocked || zebras.unlocked || usedCryochambers.val > 0`
- Workshop visibility: `workshop.on > 0`
- Religion visibility: `faith.value > 0 || (atheism active && ziggurat.val > 0)`
- Time visibility: `calendar researched || usedCryochambers.val > 0`
- Achievements visibility: any unlocked achievement
- Stats visibility: `karmaKittens > 0 || math researched`
- Challenges visibility: `adjustmentBureau` researched or reserved

Current rewrite:
- `jobs` and `workshop` are always visible
- religion misses the atheism + ziggurat edge case
- stats/challenges are omitted entirely from client navigation

Primary refs:
- `legacy/game.js:2618-2635`
- `packages/client-web/src/TabContainer.tsx`

### 2. Village progression is much richer than the current "Jobs" panel

Legacy Village tab:
- hides jobs in Iron Will before kittens exist
- hides management before 5 kittens / zebras
- hides census before `civil`
- hides map before `archery`
- gates Hold Festival behind `drama`
- gates Manage Jobs / Promote behind leader prerequisites
- changes the tab title as civilisation grows

Current rewrite:
- has a single `JobsPanel`
- always shows Hold Festival
- does not model panel visibility or tab-title progression

Primary refs:
- `legacy/js/village.js:4808-5189`
- `packages/client-web/src/JobsPanel.tsx`
- `packages/client-web/src/VillagePanel.tsx`

### 3. Job unlock state is not preserved strongly enough for the client

Legacy job metadata includes `unlocked`, `defaultUnlocked`, and in some cases `evaluateLocks()`.

Examples:
- `woodcutter` starts unlocked
- `farmer`, `hunter`, `scholar`, `miner`, `priest`, `geologist`, `engineer` are gated
- `priest` is forcibly hidden during atheism

Current rewrite state serializes village jobs as counts only:
- `packages/engine/src/state.ts` stores `jobs: Record<string, { value: number }>`

That leaves the client unable to distinguish:
- locked-at-zero
- unlocked-at-zero
- temporarily hidden by challenge state

Primary refs:
- `legacy/js/village.js:1-138`
- `packages/engine/src/state.ts:86,166,355`
- `packages/client-web/src/JobsPanel.tsx`

### 4. Several advanced tabs still need section-level visibility parity

Notable examples from the audit:

- Village Hold Festival should be hidden until `drama` is researched.
- Religion has panel-level visibility for Apocrypha, Transcendence, Cryptotheology, and pact sections.
- Time has separate visibility for shatter, Chronoforge, and Void Space sections.
- Space and Trade use `model.visible` and unlock checks for deeper sections beyond the tab itself.

Primary refs:
- `legacy/js/village.js:4705-4773`
- `legacy/js/religion.js:1795-1876`
- `legacy/js/religion.js:2828-3033`
- `legacy/js/time.js:1424-2009`
- `legacy/js/space.js:1324-1596`
- `legacy/js/diplomacy.js:1261-1606`

### 5. Resource visibility is currently wrong by construction

Legacy resources carry `unlocked` state independently of current value.

Current rewrite:
- `ResourcePanel` filters to `value > 0`

That means zero-valued but discovered resources disappear, which breaks parity and can hide newly unlocked systems until the first positive tick lands.

Primary refs:
- `legacy/game.js:2389`
- `packages/client-web/src/ResourcePanel.tsx`

## Key Decisions

- This epic should treat unlock/visibility as a contract problem, not just a CSS/rendering problem.
- Prefer shared selectors or serialized UI metadata over ad hoc client heuristics.
- Add fixture-driven tests for early, mid, late, and imported-save unlock states.
- Fold Stats and Challenges into the audit explicitly so they are not silently forgotten again.
- Implement the contract in `packages/engine/src/ui-visibility.ts` so both the engine and client can share one source of truth for tab, village, job, resource, action, and time-control visibility.
- Keep the client panels thin: `TabContainer`, `JobsPanel`, `ResourcePanel`, `ActionPanel`, and `TimePanel` now consume selector output instead of duplicating gate logic locally.
- Add minimal `StatsPanel` and `ChallengesPanel` parity shells so their unlock conditions exist in navigation even before those tabs gain richer content.

## Gotchas & Edge Cases

- Religion tab remains visible in atheism if ziggurat exists even with zero faith.
- Village tab can unlock through cryochamber history, not just huts or living kittens.
- A resource can be visible while currently at zero.
- A job can exist in state with `value: 0` but still be intentionally hidden.
- Some legacy sections become visible because of reserve/perk state, not only `researched`.

## Open Questions

- Resolved: use a shared selector module first; only promote fields into serialized save data if a future server/client split needs materialized UI metadata.
- Resolved: a minimal Stats/Challenges shell is the right parity step for Epic 33; richer tab content remains future UI work.
