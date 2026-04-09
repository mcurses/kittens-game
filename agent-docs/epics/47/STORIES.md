# Epic: 47

**Status:** In Progress
**Started:** 2026-04-09
**Legacy refs:** `legacy/js/jsx/left.jsx.js` (WCraftShortcut, WCraftRow), `legacy/js/workshop.js` (engineer calc, progress)

---

## Story: 47-01 Craft Output Preview

**As a** player
**I want** to see the expected output quantity on each craft button
**So that** I know how much I'll receive after craft bonuses

### Acceptance Criteria
- [ ] Each craft shortcut button shows output in title attribute: `+N` where N = amount × (1 + craftRatio + tierCraftRatio)
- [ ] `ignoreBonuses` crafts show output without craft ratio (raw amount)
- [ ] Output updates reactively when craftRatio changes
- [ ] Test: verify title attributes on craft buttons contain expected output values

### Legacy Reference
- `legacy/js/jsx/left.jsx.js` lines 295-327 — WCraftShortcut title computation

### Status: [ ] Tests | [ ] Impl | [ ] Rated

---

## Story: 47-02 Craft Cost Tooltips in Inspector

**As a** player
**I want** to see the ingredient costs for each craft shortcut amount
**So that** I can evaluate which shortcut fits my current resources

### Acceptance Criteria
- [ ] Hovering a craft shortcut button updates the inspector with that shortcut's cost breakdown
- [ ] Inspector shows: craft name, amount, each ingredient with required quantity
- [ ] Ingredients color-coded: affordable (green) vs insufficient (red)
- [ ] Inspector also shows expected output after bonus
- [ ] Test: verify inspector updates on craft button hover with correct cost values

### Legacy Reference
- `legacy/js/jsx/left.jsx.js` lines 340-370 — dojo tooltip cost breakdown

### Status: [ ] Tests | [ ] Impl | [ ] Rated

---

## Story: 47-03 Engineer Auto-Craft Engine

**As a** player
**I want** assigned engineers to automatically produce crafted resources over time
**So that** mechanized production works without manual crafting

### Acceptance Criteria
- [ ] `WorkshopManager.update()` accumulates progress per craft based on assigned engineers
- [ ] Progress rate: `engineers / (600 × ticksPerSecond × progressHandicap)` per tick
- [ ] When progress ≥ 1, craft one unit (with bonus), deduct inputs, reset progress
- [ ] `progressHandicap` defaults to 1 for tier 0-1 crafts; higher for complex crafts
- [ ] CraftEntry gains a `progress` field (0..1 float) in state
- [ ] Auto-craft respects resource availability — stalls if inputs insufficient
- [ ] Test: verify progress accumulation, auto-craft trigger, input deduction

### Legacy Reference
- `legacy/js/workshop.js` lines 2536-2552 — getEffectEngineer calculation
- `legacy/js/workshop.js` craft tick loop

### Status: [ ] Tests | [ ] Impl | [ ] Rated

---

## Story: 47-04 Mechanization Progress UI

**As a** player
**I want** to see `[XX%]` progress for each craft with engineers assigned
**So that** I know how close each craft is to producing the next unit

### Acceptance Criteria
- [ ] When mechanization is researched and craft has engineers > 0, show `[XX%]` next to craft name
- [ ] Percentage is zero-padded: `[05%]`, capped at `[99%]`
- [ ] Progress updates on each tick
- [ ] Not shown when no engineers assigned or mechanization not researched
- [ ] Test: verify progress display format and visibility conditions

### Legacy Reference
- `legacy/js/workshop.js` lines 2870-2880 — progress display logic

### Status: [ ] Tests | [ ] Impl | [ ] Rated

---

## Story: 47-05 Engineer Assignment UI

**As a** player
**I want** to assign and unassign engineers to crafts
**So that** I can control which resources are auto-produced

### Acceptance Criteria
- [ ] When mechanization is researched, each craft row shows engineer count and +/- controls
- [ ] Free engineer count displayed at top of crafting section
- [ ] + button dispatches ASSIGN_CRAFT_ENGINEER action
- [ ] - button dispatches UNASSIGN_CRAFT_ENGINEER action
- [ ] + disabled when no free engineers; - disabled when 0 assigned
- [ ] Test: verify engineer controls render, dispatch actions, and respect limits

### Legacy Reference
- `legacy/js/workshop.js` lines 2958-3009 — engineer assignment links

### Status: [ ] Tests | [ ] Impl | [ ] Rated

---

## Story: 47-06 Workshop Flavor Text

**As a** player
**I want** workshop upgrades to show flavor text in the inspector
**So that** I get lore/humor context when browsing upgrades

### Acceptance Criteria
- [ ] CRAFT_FLAVOR map defined with flavor text for crafts (parallel to UPGRADE_FLAVOR)
- [ ] Inspector shows flavor text when hovering a craft row
- [ ] At least 5 crafts have flavor text
- [ ] Test: verify flavor text renders in inspector for a craft with defined flavor

### Legacy Reference
- Legacy upgrade defs have `flavor` i18n keys but display is minimal

### Status: [ ] Tests | [ ] Impl | [ ] Rated
