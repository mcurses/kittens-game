# Epic: 50 — Notes

## Legacy Behavior Summary

### Resource Type Color Coding
- Resources have a `type` property: `common`, `uncommon`, `rare`, `exotic`
- `uncommon` → Coral text color
- `rare` → Orange text + `1px 0px 10px Coral` text shadow
- Individual resources can override with `color` property (uranium=#4EA24E, unobtainium=#A00000, antimatter=#5A0EDE, manpower=#DBA901, science=#01A9DB, culture=#DF01D7, faith=gray, necrocorn=#9A2EFE)
- Source: `legacy/js/jsx/left.jsx.js` lines 101-122

### Weather Production Modifier Badge
- Shows `[±X%]` next to per-tick rate for catnip (only resource with season modifiers)
- Calculation: `Math.round((modifier - 1) * 100)`, clamped to min -99; if modifier===0, shows `[-100%]`
- Green text for positive, red for negative
- CSS classes: `positive-weather`, `negative-weather`
- Source: `legacy/js/jsx/left.jsx.js` lines 134-156

### Resource Visibility Toggle
- Each resource has `isHidden` boolean flag, default false
- Toggle via Ctrl+Click on resource name
- Hidden resources disappear from main table but show in edit mode with dotted underline
- Source: `legacy/js/jsx/left.jsx.js` lines 201-210, 238-240

### Capacity Warning Colors
- value > maxValue × 0.95 → `resLimitNotice` (orange)
- value > maxValue × 0.75 → `resLimitWarn` (coral, opacity 0.75)
- Below 0.75 → default styling
- Applied to resource amount cell only
- Source: `legacy/js/jsx/left.jsx.js` lines 126-131

### Craft Shortcut Tooltips
- Legacy shows cost breakdown tooltip on hover over craft shortcut buttons (1%, 5%, 10%)
- No tooltip for "All" button
- Shows ingredient name + total cost per ingredient
- Source: `legacy/js/jsx/left.jsx.js` lines 330-371

## Key Decisions
- Resource type/color is engine metadata — add to resource definitions, not just UI
- Weather badge only applies to catnip in current scope (only season-modified resource)
- Visibility toggle needs engine state (isHidden persisted in save) + UI surface

## Gotchas & Edge Cases
- Weather modifier can be exactly 0 (communism + winter + cold) → display as [-100%]
- Craft tooltip calculation must account for craft ratio bonuses
- Resource colors are per-resource overrides, not just per-type

## Open Questions
- Do we need edit mode for visibility toggle or is Ctrl+click sufficient?
