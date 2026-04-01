# Epic 33 — UI Unlock & Visibility Parity

Restore legacy-faithful unlock and visibility behavior across the web client. The rewrite currently renders several tabs, panels, jobs, and actions from incomplete serialized state plus hardcoded shortcuts in the client. This epic makes visibility an explicit, tested contract instead of a collection of local heuristics.

**Status:** Complete
**Started:** 2026-04-01
**Finished:** 2026-04-01
**Legacy refs:** `legacy/game.js`, `legacy/js/village.js`, `legacy/js/science.js`, `legacy/js/workshop.js`, `legacy/js/religion.js`, `legacy/js/space.js`, `legacy/js/time.js`, `legacy/js/diplomacy.js`, `legacy/js/achievements.js`, `legacy/js/ui.js`

---

## Story: 33-01 — Authoritative UI visibility contract

**As a** client and server
**I want** the state contract to expose the unlock and visibility data the UI actually needs
**So that** the client stops guessing from partial state and can mirror legacy behavior deterministically

### Acceptance Criteria
- [x] Given a freshly serialized `GameState`, when the client renders navigation and conditional sections, then it can read typed visibility/unlock metadata without local hardcoded fallbacks.
- [x] Given jobs, tabs, subpanels, and gated actions with non-trivial legacy conditions, when state is serialized, then the relevant unlocked/visible flags are preserved or derived server-side in one authoritative place.
- [x] Given a legacy behavior change in one manager, when visibility rules are updated, then client behavior changes through shared selectors or serialized flags rather than duplicated UI heuristics.
- [x] Given the current shortcuts in `TabContainer` and `JobsPanel`, when this story is complete, then those shortcuts are removed or reduced to thin consumers of the shared contract.

### Legacy Reference
- `legacy/game.js:2618-2635`
- `legacy/js/ui.js:1103-1109`
- `legacy/js/village.js:1-138`

### Status: [x] Tests | [x] Impl | [x] Rated

## Story: 33-02 — Main tab unlock parity

**As a** player
**I want** tabs to appear only when legacy would expose them
**So that** the overall UI progression matches the original game instead of leaking future systems early

### Acceptance Criteria
- [x] Given a fresh save with no huts, no kittens, no zebras, and no used cryochambers, when the UI renders, then the Village/Jobs tab is hidden.
- [x] Given no built workshop, when the UI renders, then the Workshop tab is hidden.
- [x] Given `faith.value === 0` and atheism is inactive, when the UI renders, then the Religion tab is hidden.
- [x] Given atheism is active and `ziggurat.val > 0`, when the UI renders, then the Religion tab is visible even with zero faith.
- [x] Given no unlocked achievements, when the UI renders, then the Achievements tab is hidden.
- [x] Given the unlock conditions for Stats or Challenges are met, when the UI renders, then those tabs are available rather than silently omitted from navigation.
- [x] Given the active tab becomes hidden because its unlock condition is no longer met, when the UI refreshes, then it falls back exactly as legacy does.

### Legacy Reference
- `legacy/game.js:2618-2635`
- `legacy/js/achievements.js:431-501`
- `legacy/js/ui.js:1103-1109`

### Status: [x] Tests | [x] Impl | [x] Rated

## Story: 33-03 — Village shell parity

**As a** player
**I want** the Village area to reveal its sections only when legacy would show them
**So that** jobs, management, census, and map progression feels correct

### Acceptance Criteria
- [x] Given Iron Will with zero kittens, when the Village area renders, then the jobs panel is hidden.
- [x] Given fewer than 5 kittens and zero zebras, when the Village area renders, then the management panel is hidden.
- [x] Given `civil` is not researched, when the Village area renders, then the census panel is hidden.
- [x] Given `archery` is not researched, when the Village area renders, then the map panel is hidden.
- [x] Given free kittens are available, when the Village tab label renders, then the warning count behavior matches legacy instead of staying a static "Jobs" label.
- [x] Given the modern header keeps a compact village summary, when this story is complete, then that summary does not replace or weaken the gated Village shell behavior.

### Legacy Reference
- `legacy/js/village.js:4808-5189`

### Status: [x] Tests | [x] Impl | [x] Rated

## Story: 33-04 — Job unlock parity

**As a** player
**I want** only unlocked jobs and valid job actions to appear
**So that** the rewrite does not expose farmers, priests, geologists, engineers, or related controls before legacy would

### Acceptance Criteria
- [x] Given a fresh save, when the Village jobs list renders, then only legacy-default jobs are shown.
- [x] Given a job unlock tech has not been researched, when the jobs list renders, then that job is absent rather than shown at `0`.
- [x] Given a job unlock tech is researched, when the jobs list renders, then the corresponding job appears and becomes assignable.
- [x] Given atheism is active, when the jobs list renders, then priest is hidden and any assigned priests are cleared per legacy behavior.
- [x] Given engineering-related controls depend on unlocked engineer/loadout systems, when the Village area renders, then those controls follow legacy gating instead of always being visible.

### Legacy Reference
- `legacy/js/village.js:1-138`
- `legacy/js/village.js:3470-3486`
- `legacy/js/village.js:3835`
- `legacy/js/science.js` job unlock `evaluateLocks` definitions

### Status: [x] Tests | [x] Impl | [x] Rated

## Story: 33-05 — Science and Workshop section/item visibility parity

**As a** player
**I want** research, upgrades, and crafting sections to reveal only the items legacy would show
**So that** the tabs feel like progression, not full debug lists

### Acceptance Criteria
- [x] Given a tech, policy, upgrade, craft, or zebra upgrade is still locked in legacy, when the corresponding panel renders, then the item is hidden.
- [x] Given an item becomes unlocked through legacy prerequisites, when the panel renders, then the item appears without requiring client-only heuristics.
- [x] Given the workshop building is unbuilt, when the main nav renders, then the Workshop tab is hidden and its contents are inaccessible.
- [x] Given zebra workshop content is not yet unlocked, when the Workshop area renders, then zebra-only sections stay hidden.
- [x] Given the current client already filters some items by `unlocked`, when this story is complete, then that behavior is verified against legacy unlock chains rather than assumed to be sufficient.

### Legacy Reference
- `legacy/js/science.js:2459-2471`
- `legacy/js/science.js:2706-2709`
- `legacy/js/workshop.js:2830-2865`
- `legacy/js/workshop.js:3089-3232`

### Status: [x] Tests | [x] Impl | [x] Rated

## Story: 33-06 — Religion, Time, Space, and Trade conditional section/button parity

**As a** player
**I want** each advanced tab to hide or reveal sections and actions under the same conditions as legacy
**So that** seeing a tab does not automatically expose controls that should still be gated

### Acceptance Criteria
- [x] Given `drama` is not researched, when the Village area renders, then Hold Festival is hidden.
- [x] Given leadership-dependent actions are not available, when the Village area renders, then Manage Jobs and Promote Kittens stay hidden.
- [x] Given religion panels such as Apocrypha, Transcendence, Cryptotheology, or pacts are still locked, when Religion renders, then those sections stay hidden.
- [x] Given the player lacks unlocked time-crystal or chronoforge prerequisites, when Time renders, then shatter/CFU/VSU controls remain hidden per legacy.
- [x] Given a race or diplomacy subsection is still locked, when Trade renders, then only legacy-visible race controls and side sections appear.
- [x] Given a planet, mission, or space-building section is still locked, when Space renders, then only the reached/unlocked subset is visible.

### Legacy Reference
- `legacy/js/village.js:4705-4773`
- `legacy/js/religion.js:1795-1876`
- `legacy/js/religion.js:2828-3033`
- `legacy/js/time.js:1424-2009`
- `legacy/js/space.js:1324-1596`
- `legacy/js/diplomacy.js:259-359`
- `legacy/js/diplomacy.js:1261-1606`

### Status: [x] Tests | [x] Impl | [x] Rated

## Story: 33-07 — Resource and achievement visibility parity

**As a** player
**I want** sidebars and achievement views to show only resources and records legacy would expose
**So that** progression and discovery remain intact

### Acceptance Criteria
- [x] Given a resource is unlocked in legacy before it has a positive stored value, when the sidebar renders, then it is still visible.
- [x] Given a resource is hidden or not yet unlocked in legacy, when the sidebar renders, then it stays hidden even if the modern client can infer a placeholder row.
- [x] Given achievements or badges unlock, when the Achievements area renders, then the tab and panel behavior matches legacy rules for achievements vs badges.
- [x] Given the current client uses `value > 0` as the resource visibility heuristic, when this story is complete, then visibility follows explicit unlock/hidden state instead.

### Legacy Reference
- `legacy/game.js:2389`
- `legacy/core.js:1270-1362`
- `legacy/js/achievements.js:431-501`

### Status: [x] Tests | [x] Impl | [x] Rated

## Story: 33-08 — Legacy-save regression fixtures and visibility matrix

**As a** maintainer
**I want** regression coverage around imported saves and edge-case unlock states
**So that** UI visibility parity stays stable after future engine or client changes

### Acceptance Criteria
- [x] Given representative early-, mid-, and late-game fixtures, when client tests run, then each fixture asserts the expected visible tabs, subpanels, jobs, and gated actions.
- [x] Given at least one imported legacy save with known unlock edges (for example workshop built, atheism + ziggurat, cryochambers used, zero-value but unlocked resources), when the client renders, then visibility matches the audited expectations.
- [x] Given a visibility regression is introduced later, when tests run, then the failure points to the specific tab/panel/action contract that broke.
- [x] Given the epic is completed, when self-rating runs, then UI unlock/visibility parity is evaluated explicitly instead of being folded into generic UI notes.

### Legacy Reference
- `legacy/test/`
- imported save fixtures under `legacy/test/res/`

### Status: [x] Tests | [x] Impl | [x] Rated
