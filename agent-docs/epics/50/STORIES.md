# Epic 50 — Resource Display Parity

Close resource panel ❌ items: type coloring, weather modifier, visibility toggle, craft tooltips.

## Stories

### 50-01 Resource Type Color Coding
**Goal:** Color-code resource names by type (common/uncommon/rare/exotic) matching legacy.

**ACs:**
- [ ] Resource type metadata available (from engine defs or mapping)
- [ ] Resource name styled with type-specific color: common (default), uncommon (green), rare (blue), exotic (purple)
- [ ] Colors work in both light and dark themes
- [ ] Test: verify correct CSS class applied per resource type

### 50-02 Weather Production Modifier
**Goal:** Show `[+/-X%]` seasonal weather effect on catnip production.

**ACs:**
- [ ] Weather modifier badge shown next to catnip production rate
- [ ] Positive modifiers green, negative red
- [ ] Updates when season changes
- [ ] Test: verify modifier reflects current season's weather effect

### 50-03 Resource Visibility Toggle
**Goal:** Allow hiding/showing individual resource rows.

**ACs:**
- [ ] Ctrl+click (or dedicated toggle) hides a resource row
- [ ] Hidden resources remembered during session
- [ ] "Show hidden" toggle to reveal all
- [ ] Test: verify hide/show toggle works

### 50-04 Capacity Warning Colors
**Goal:** Color resource values at 75%/95% thresholds matching legacy behavior.

**ACs:**
- [ ] Value text turns yellow/orange at ≥75% capacity
- [ ] Value text turns red at ≥95% capacity
- [ ] Only applies to resources with a max capacity
- [ ] Test: verify color classes applied at correct thresholds

### 50-05 Craft Shortcut Tooltips on Resource Rows
**Goal:** Show craftable amount and cost breakdown in tooltips for inline craft buttons.

**ACs:**
- [ ] Hovering inline craft button shows: output amount, input costs
- [ ] Cost values color-coded by affordability
- [ ] Test: verify tooltip content for a craftable resource
