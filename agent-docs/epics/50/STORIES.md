# Epic: 50

**Status:** Complete
**Started:** 2026-04-09
**Legacy refs:** `legacy/js/jsx/left.jsx.js` (resource row rendering, color coding, weather badge, capacity warning, craft tooltips), `legacy/js/resources.js` (resource types/colors, visibility)

---

## Story 50-01: Resource type color coding

**As a** player
**I want** resource names colored by type (uncommon, rare) and per-resource custom colors
**So that** I can visually distinguish resource categories at a glance

### Acceptance Criteria
- [x] Engine exports `RESOURCE_DISPLAY` map with `type` and optional `color` per resource
- [x] Resource types: `common` (default), `uncommon`, `rare`, `exotic`
- [x] Uncommon resources render name in Coral
- [x] Rare resources render name in Orange with text-shadow `1px 0px 10px Coral`
- [x] Custom-color resources (uranium=#4EA24E, unobtainium=#A00000, antimatter=#5A0EDE, catpower=#DBA901, science=#01A9DB, culture=#DF01D7, faith=gray, necrocorn=#9A2EFE) use their specified color
- [x] Common resources with no custom color use default text color

### Legacy Reference
- `legacy/js/jsx/left.jsx.js` lines 101-122
- `legacy/js/resources.js` (resource color properties)

### Status: [x] Tests | [x] Impl | [ ] Rated

---

## Story 50-02: Capacity warning colors

**As a** player
**I want** resource amounts to change color when approaching storage cap
**So that** I can see at a glance which resources are about to overflow

### Acceptance Criteria
- [x] Resource value text turns orange when value > maxValue × 0.95 (critical)
- [x] Resource value text turns coral with opacity 0.75 when value > maxValue × 0.75 (warning)
- [x] No special styling when below 75% capacity or when maxValue is 0
- [x] CSS classes: `resource-value--notice` (orange), `resource-value--warn` (coral)

### Legacy Reference
- `legacy/js/jsx/left.jsx.js` lines 126-131
- `legacy/res/default.css` lines 423-430

### Status: [x] Tests | [x] Impl | [ ] Rated

---

## Story 50-03: Weather production modifier badge

**As a** player
**I want** a weather modifier badge on catnip showing the current season effect
**So that** I can see how the season is affecting my catnip production

### Acceptance Criteria
- [x] Catnip resource row shows `[+X%]` or `[-X%]` badge next to the rate
- [x] Badge value = `Math.round((seasonModifier - 1) * 100)`, clamped to min -99
- [x] If modifier is exactly 0, display `[-100%]`
- [x] Positive modifiers shown in green, negative in red
- [x] Badge only appears when catnip perTick !== 0
- [x] Badge only appears for resources that have season modifiers (currently only catnip)

### Legacy Reference
- `legacy/js/jsx/left.jsx.js` lines 134-156
- `legacy/js/calendar.js` lines 1100-1119

### Status: [x] Tests | [x] Impl | [ ] Rated

---

## Story 50-04: Resource visibility toggle

**As a** player
**I want** to hide/show individual resources from the resource panel
**So that** I can declutter the display and focus on resources I care about

### Acceptance Criteria
- [x] Engine state gains `hiddenResources: string[]` for serialization
- [x] `TOGGLE_RESOURCE_VISIBILITY` action toggles a resource's hidden state
- [x] Hidden resources are excluded from the resource panel display
- [x] Ctrl+Click on a resource name toggles its visibility
- [x] Hidden state persists through save/load
- [x] Action added to API spec

### Legacy Reference
- `legacy/js/jsx/left.jsx.js` lines 201-210, 238-240
- `legacy/js/resources.js` lines 1091-1125

### Status: [x] Tests | [x] Impl | [ ] Rated

---

## Story 50-05: Craft shortcut cost tooltips

**As a** player
**I want** to see a cost breakdown when hovering craft shortcut buttons
**So that** I can see exactly what ingredients are needed before crafting

### Acceptance Criteria
- [x] Hovering a craft shortcut button (1%, 5%, 10%) shows a tooltip with ingredient costs
- [x] Tooltip lists each ingredient name and total cost for the craft amount
- [x] "All" button has no cost tooltip (matches legacy)
- [x] Cost calculation accounts for craft ratio bonuses
- [x] Tooltip uses a title attribute or tooltip component

### Legacy Reference
- `legacy/js/jsx/left.jsx.js` lines 330-371

### Status: [x] Tests | [x] Impl | [ ] Rated
