# Epic: 52

**Status:** In Progress
**Started:** 2026-04-09
**Legacy refs:** `legacy/js/jsx/toolbar.jsx.js` (WToolbarEnergy, WBLS), `legacy/js/resources.js` (energy calc, getEnergyDelta)

---

## Story 52-01: Energy display with production/consumption breakdown

**As a** player
**I want** to see my net energy production in a toolbar HUD
**So that** I can monitor whether my energy infrastructure is sufficient

### Acceptance Criteria
- [ ] ToolbarPanel component renders above main content area
- [ ] Energy display shows only when electricity tech is researched
- [ ] Shows net energy (prod - cons) with "W" unit suffix
- [ ] Green text when positive, red when negative
- [ ] Tooltip/title shows production and consumption breakdown
- [ ] When deficit, tooltip shows penalty percentage: `-X%`
- [ ] Penalty = floor((1 - delta) * 100) where delta = max(prod/cons, 0.25)
- [ ] Winter warning class when winter prod < cons but current prod >= cons

### Legacy Reference
- `legacy/js/jsx/toolbar.jsx.js` lines 104-143 (WToolbarEnergy)
- `legacy/js/resources.js` lines 739-751 (energy calc), 1055-1068 (getEnergyDelta)

### Status: [ ] Tests | [ ] Impl | [ ] Rated

---

## Story 52-02: Sorrow indicator

**As a** player
**I want** to see my sorrow level in the toolbar
**So that** I can track black liquid sorrow accumulation

### Acceptance Criteria
- [ ] Sorrow indicator shows only when sorrow resource value > 0
- [ ] Displays "BLS: X%" where X is sorrow value rounded
- [ ] "max" styling when sorrow is at maxValue
- [ ] Tooltip shows sorrow description text
- [ ] Hidden when sorrow is 0 or absent

### Legacy Reference
- `legacy/js/jsx/toolbar.jsx.js` lines 285-310 (WBLS)

### Status: [ ] Tests | [ ] Impl | [ ] Rated
