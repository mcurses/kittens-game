# Epic: 52

**Status:** Complete
**Started:** 2026-04-09
**Legacy refs:** `legacy/js/jsx/toolbar.jsx.js` (WToolbarEnergy, WBLS), `legacy/js/resources.js` (energy calc, getEnergyDelta)

---

## Story 52-01: Energy display with production/consumption breakdown

**As a** player
**I want** to see my net energy production in a toolbar HUD
**So that** I can monitor whether my energy infrastructure is sufficient

### Acceptance Criteria
- [x] ToolbarPanel component renders above main content area
- [x] Energy display shows only when electricity tech is researched
- [x] Shows net energy (prod - cons) with "W" unit suffix
- [x] Green text when positive, red when negative
- [x] Tooltip/title shows production and consumption breakdown
- [x] When deficit, tooltip shows penalty percentage: `-X%`
- [x] Penalty = floor((1 - delta) * 100) where delta = max(prod/cons, 0.25)
- [x] Winter warning class when winter prod < cons but current prod >= cons

### Legacy Reference
- `legacy/js/jsx/toolbar.jsx.js` lines 104-143 (WToolbarEnergy)
- `legacy/js/resources.js` lines 739-751 (energy calc), 1055-1068 (getEnergyDelta)

### Status: [x] Tests | [x] Impl | [ ] Rated

---

## Story 52-02: Sorrow indicator

**As a** player
**I want** to see my sorrow level in the toolbar
**So that** I can track black liquid sorrow accumulation

### Acceptance Criteria
- [x] Sorrow indicator shows only when sorrow resource value > 0
- [x] Displays "BLS: X%" where X is sorrow value rounded
- [x] "max" styling when sorrow is at maxValue
- [x] Tooltip shows sorrow description text
- [x] Hidden when sorrow is 0 or absent

### Legacy Reference
- `legacy/js/jsx/toolbar.jsx.js` lines 285-310 (WBLS)

### Status: [x] Tests | [x] Impl | [ ] Rated
