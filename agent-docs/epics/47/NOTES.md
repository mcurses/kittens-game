# Epic: 47 — Notes

## Legacy Behavior Summary

### Craft Output Preview
Legacy `WCraftShortcut` (left.jsx.js:290-327) shows expected output on each craft button:
- Button title: `"+" + getDisplayValueExt(craftRowAmt * (1 + craftRatio))`
- For non-"all" buttons: also shows the output inline when `usePercentageConsumptionValues` is off
- Formula: `output = amount × (1 + craftRatio)` where craftRatio is the total craft bonus

### Craft Cost Tooltips
Legacy (left.jsx.js:340-370) uses dojo tooltips on craft buttons showing:
- Per-ingredient cost: `price.val × craftRowAmt`
- Each ingredient on its own row with name + formatted value

### Mechanization Progress
Legacy (workshop.js:2870-2880) shows `[XX%]` when mechanization is researched AND craft.value > 0:
- Zero-padded: `[05%]`
- Capped at 99%
- Only visible when engineers are assigned (craft.value > 0)

### Engineer Assignment
Legacy (workshop.js:2958-3009) shows assignment links only after mechanization:
- `[+]` `[-]` always
- `[+5]` `[-5]`, `[+25]` `[-25]`, `[+100]` `[-100]` when enough total engineers
- Free engineers calculated: `village.getFreeEngineers()` = total engineer job kittens - assigned craft engineers
- CSS class `craftEngineer` when effect is active

### Engineer Effect Calculation
Legacy (workshop.js:2536-2552):
- Base rate: 1 craft per engineer per 10 minutes (600 × ticksPerSecond ticks)
- `effectPerTick = kittenResProduction × tierCraftRatio / (600 × ticksPerSecond × progressHandicap)`
- `kittenResProduction = craft.value × 2` (if neuralNetworks researched) × HG scaling

### Workshop Flavor Text
Legacy has `flavor` field on upgrade defs but it's i18n-localized. Not prominently displayed in the craft area — upgrade tooltips only.

## Key Decisions

- Craft output preview → show as button title attribute (tooltip on hover)
- Cost tooltips → show in inspector panel when craft button is hovered (our pattern)
- Engineer assignment → use existing engine actions ASSIGN_CRAFT_ENGINEER / UNASSIGN_CRAFT_ENGINEER
- Mechanization progress → engine doesn't currently track `progress` per craft; need to add it or compute from state
- Flavor text → already have UPGRADE_FLAVOR pattern, extend to crafts

## Gotchas & Edge Cases

- `ignoreBonuses` flag on some crafts means craftRatio should not apply to output preview
- Progress tracking requires per-tick accumulation in the engine (not yet implemented)
- Engineer display needs `mechanization` tech check — verify science state
- Free engineers = total engineer job kittens - sum of all craft.engineers assignments

## Open Questions

- Engine doesn't have progress tracking for engineer auto-craft yet. Need to implement tick-based progress accumulation.
