# Epic: 52 — Notes

## Legacy Behavior Summary

### Energy Display (WToolbarEnergy)
- Shows only when `electricity` tech is researched
- Displays net energy: `energyProd - energyCons` in watts (e.g. "2.50W")
- CSS classes: `energy` (normal), `energy warning` (deficit), `energy warningWinter` (winter-only deficit)
- Tooltip shows: production amount, consumption amount, and deficit penalty %
- energyProd = getEffect("energyProduction") * (1 + getEffect("energyProductionRatio"))
- energyCons = getEffect("energyConsumption") * consRatio
- consRatio = (1 + getEffect("energyConsumptionRatio") + getEffect("energyConsumptionIncrease")) * (energy challenge active ? 2 : 1)
- Winter production: current prod minus loss from solar farms not operating at winter capacity
- Deficit penalty: max(energyProd/energyCons, 0.25), optionally halved if energy challenge completed

### Sorrow Indicator (WBLS)
- Shows only when sorrow resource > 0
- Displays "BLS: X%" where X = sorrow.value.toFixed()
- "max" class when sorrow == maxValue (17 + blsLimit effect)
- Tooltip: full sorrow description text

### MOTD (WToolbarMOTD)
- Commented out in legacy toolbar rendering — not active in game
- Skipping for our rewrite

## Key Decisions
- Create a ToolbarPanel component for the HUD strip above the main content
- Energy values computed from effectCache in the UI (already available in state)
- Sorrow read from resources in state
- MOTD skipped — not active in legacy
- Combine stories 52-01/02/03 into a single energy story since they're all one component

## Gotchas & Edge Cases
- Winter energy: need to account for solar farm seasonal variation
- Energy challenge doubles consumption
- Deficit penalty floor at 25% (delta min 0.25)
- Energy challenge completion halves the penalty magnitude

## Open Questions
- None
