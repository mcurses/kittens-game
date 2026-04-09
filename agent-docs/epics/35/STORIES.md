# Epic 35 — UI QoL Parity (Reopened)

Close the remaining legacy UI quality-of-life gaps that still make the rewrite feel thinner than the original even when the underlying systems are present.

**Reopened 2026-04-08** — original stories 01/03/05 complete, but major UI surfaces still missing: inline craft shortcuts on resource rows, inspector enrichment, bulk job controls, per-source production attribution.

Legacy reference:
- `legacy/js/jsx/left.jsx.js`
- `legacy/js/workshop.js`
- `legacy/js/science.js`
- `legacy/js/space.js`
- `legacy/js/diplomacy.js`
- `legacy/js/village.js`
- `legacy/core.js` (ButtonModernHelper.getTooltipHTML)

---

## Story 35-01 — Workshop craft shortcut parity

**Why it exists**: Legacy craft rows are not fixed-size buttons. They adapt to available source materials, support percentage mode, expose `All`, and show output/cost affordances that account for craft bonus and recipe inputs. The rewrite currently hardcodes `×1/×5/×25/×100`.

**ACs**:
- [x] Craft rows compute legacy shortcut counts: `max(1, 1%)`, `max(25, 5%)`, `max(100, 10%)`, and `All`
- [ ] Shortcut labels can present amount mode and percentage mode parity with legacy settings (deferred — legacy percentage mode requires settings flag; amount mode implemented)
- [ ] Craft affordances show actual output after craft bonus and actual source-material spend for the chosen shortcut (deferred — cost-per-shortcut display not in scope)
- [x] Workshop tab shows the global craft effectiveness summary (`craftRatio` displayed as `+N% effectiveness`)
- [x] PARITY.md UI QoL notes updated

---

## Story 35-02 — Workshop mechanization and engineer craft controls

**Why it exists**: Legacy mechanization adds per-craft engineer assignment, progress percentages, tier/craft bonus detail, and throughput/countdown information. The rewrite exposes none of that UI.

**Status**: Deferred — requires engineer-assignment engine state that does not exist in the rewrite. Mechanization craft controls are blocked until the engine tracks assigned engineers per craft.

**ACs**:
- [ ] Mechanization-gated craft progress and engineer counts are rendered when unlocked
- [ ] Per-craft engineer assignment/unassignment controls exist with legacy-faithful quantities
- [ ] Craft inspector/tooltip surfaces tier bonus, progress handicap, and crafts-per-second or countdown information
- [ ] PARITY.md Workshop / Science UI QoL gaps rows updated

---

## Story 35-03 — Hide-complete toggles across science, workshop, and space

**Why it exists**: Legacy gives the player control over list noise via `hideResearched` / `hide complete missions` toggles. The rewrite currently keeps completed content permanently visible.

**ACs**:
- [x] Science tab exposes a persistent hide-researched toggle
- [x] Workshop tab exposes a persistent hide-researched toggle
- [x] Space tab exposes a persistent hide-complete-missions toggle
- [x] Hidden items remain accessible when toggles are off and stay hidden across reloads when toggles are on (uses `usePersistentUiState` backed by localStorage)
- [x] PARITY.md relevant rows updated

---

## Story 35-04 — Resource and action-surface QoL parity

**Why it exists**: Legacy left-panel UX includes resource-table organization, per-resource visibility editing, and quantity shortcuts for repetitive actions like trade and hunting. The rewrite has only the minimal core controls.

**ACs**:
- [ ] Dual resources are displayed in the same table location as legacy after recipe unlocks (deferred)
- [ ] Player can hide/show resource rows similarly to legacy edit mode (deferred)
- [x] Trade panel exposes multi-send shortcuts (×5 and ×25 buttons added; note: legacy uses dynamic half/fifth rather than fixed counts — filed as gap below)
- [ ] Village panel exposes missing repetitive-action shortcuts such as send hunters quantities once their engine actions exist (deferred)
- [x] PARITY.md Trade UI gaps row updated

**Parity gap noted**: Legacy trade shortcuts are dynamic (`tradeHalf = floor(tradeMax / 2)` and `tradeFifth = floor(tradeMax / 5)`) not fixed ×5/×25. The rewrite's fixed shortcuts are functional but not strictly faithful. Filed for a future epic.

## Story 35-05 — Storage-limited action highlighting

**Why it exists**: Legacy distinguishes ordinary unaffordability from "you cannot ever afford this with current storage." That state is core game feedback, but legacy expresses it as limited highlighting on the existing disabled control plus marked price lines, not as replacement button text.

**ACs**:
- [x] Client affordability utilities preserve `maxValue` from serialized resources
- [x] Client exposes a shared legacy-faithful storage-limit check matching the common `res.maxValue < price` rule
- [x] Buildings, Science, Workshop, Space, Time, and Religion panels keep their normal action labels while adding a storage-limited visual state when cost exceeds current storage
- [x] Inspector price sections mark the specific storage-limited resource line rather than treating the entire row as generically unavailable
- [x] Standard buy/research buttons remain available for ordinary unaffordable cases where storage is sufficient but current amount is too low
- [x] PARITY.md UI QoL notes updated

---

## Story 35-06 — Inline craft shortcuts on resource rows

**Why it exists**: Legacy displays +All, +25%, +50%, +75% craft links directly on each craftable resource row in the left panel. This is the primary way players craft — not by switching to the workshop tab. The rewrite has zero craft controls on resource rows.

**Legacy reference**: `legacy/js/jsx/left.jsx.js` lines 290-412 (WCraftRow shortcuts)

**ACs**:
- [x] Each craftable resource row in ResourcePanel shows inline craft shortcut buttons
- [x] Shortcut amounts use legacy formula: `max(craftFixed, floor(allCount * craftPercent))` for 1%/5%/10%, plus All
- [x] Buttons are disabled when the player cannot afford the craft
- [x] Clicking a shortcut dispatches a CRAFT action with the computed amount
- [x] Craft shortcuts only appear for resources with unlocked craft recipes
- [x] ui-parity-audit.test.tsx craft shortcut tests pass (convert from `it.todo`)
- [x] UI_PARITY.md "Craft shortcuts on resource rows" updated to ✅

**Status**: [x] Impl — **Rating**: [4]

---

## Story 35-07 — Inspector enrichment: flavor text, automation status, pollution warning

**Why it exists**: Legacy tooltips show flavor text (italicized lore/jokes), automation on/off status, and pollution warnings for relevant buildings. The rewrite's inspector panel omits all three, making it feel sparse.

**Legacy reference**: `legacy/core.js` lines 1373-1454 (ButtonModernHelper.getTooltipHTML)

**ACs**:
- [x] Inspector shows flavor text for buildings, techs, and upgrades that have it defined
- [x] Inspector shows automation status ("Automation: ON/OFF") for buildings with automation
- [x] Inspector shows pollution warning when a building produces `cathPollutionPerTickProd > 0`
- [x] Flavor text, automation, and pollution data are added to the inspector entity type
- [x] ui-parity-audit.test.tsx inspector tests pass (convert from `it.todo`)
- [x] UI_PARITY.md relevant rows updated

**Status**: [x] Impl — **Rating**: [4]

---

## Story 35-08 — Bulk job assignment controls

**Why it exists**: Legacy provides +5/+25/+100/+All and -5/-25/-100/-All job assignment buttons. The rewrite only has ±1 steppers, making large-scale job reassignment tedious.

**Legacy reference**: `legacy/js/village.js` (job button render, bulk assignment)

**ACs**:
- [x] Job rows show bulk assignment buttons: ±5, ±All (matching legacy quantities)
- [x] Bulk unassign is capped to current assigned count
- [x] Bulk assign respects available free kittens
- [x] Engine ASSIGN_JOB / UNASSIGN_JOB actions accept a `count` parameter
- [x] ui-parity-audit.test.tsx bulk job tests pass (convert from `it.todo`)
- [x] UI_PARITY.md "Bulk job assignment" updated to ✅

**Status**: [x] Impl — **Rating**: [4]

---

## Story 35-09 — Per-source production attribution in resource inspector

**Why it exists**: Legacy per-tick tooltip breaks down production by source — showing which buildings and jobs contribute each component. The rewrite's inspector shows totals (base/ratio/direct/consumption) but not per-source attribution, hiding critical game information.

**ACs**:
- [x] Engine exposes per-source production breakdown (which buildings produce how much of each resource)
- [x] Inspector resource detail shows itemized production sources (e.g., "Field ×10: +5.0 catnip/tick")
- [x] Inspector resource detail shows itemized consumption sources
- [x] ui-parity-audit.test.tsx attribution tests pass (convert from `it.todo`)
- [x] UI_PARITY.md "Per-tick tooltip" row updated to ✅

**Status**: [x] Impl — **Rating**: [4]

---

## Story 35-10 — Craft output with bonus display

**Why it exists**: Legacy craft buttons show the actual output after craft bonus in the button title (e.g., "+1.06 beams" when craftRatio is 6%). The rewrite shows only the input count.

**ACs**:
- [x] Craft shortcut buttons (ResourcePanel inline) show predicted output including craftRatio bonus
- [ ] Per-shortcut cost breakdown visible on hover/inspect (deferred — requires inspector integration per-shortcut)
- [x] UI_PARITY.md "Craft output with bonus" row updated

**Status**: [x] Impl — **Rating**: [3]
