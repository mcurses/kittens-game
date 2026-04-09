# Epic: 49 — Notes

## Legacy Behavior Summary

### Stage System
5 buildings have stages (2 stages each):
- Pasture → Solar Farm
- Aqueduct → Hydro Plant
- Library → Data Center
- Warehouse → Spaceport
- Amphitheatre → Broadcast Tower

Each stage has its own label, prices, priceRatio, effects, and stageUnlocked flag.
Stage 1 must be unlocked (e.g., warehouse→spaceport requires 10 minimalist tech).
Upgrade/downgrade resets building count to 0 (sells all). Effects recalculate per stage.

### Building Filter Tabs
5 tabs: All, Available, Enabled, Togglable, IW (Iron Will)
- All: shows all unlocked buildings in category groups
- Available: not resource-limited (`!resourceIsLimited`)
- Enabled: buildings with `on > 0`
- Togglable: buildings with `togglable: true`
- IW: Iron Will mode only, hides population group

### Almost-Limited Warning
When `almostLimited: true`, building name wraps with `* name *`.
Flag exists in metadata but no buildings currently set it to true in legacy.

### Dynamic Stage Effects
Solar Farm: seasonal energy production modifiers
Broadcast Tower: energy ratio modifier, satellite culture bonus
Spaceport: energy scales with count
Data Center: biolab uplink, cryocomputing bonus

## Key Decisions
- Stage system is complex with sell-all-on-upgrade behavior — implement core stage state tracking and UI controls, defer dynamic stage effects to when specific buildings need them
- Almost-limited is unused in legacy — implement the display wrapper but don't add threshold logic since legacy doesn't use it either
- Filter tabs are a UI-only feature — engine doesn't need changes

## Gotchas & Edge Cases
- Stage upgrade/downgrade sells all buildings of that type and resets count to 0
- Stage 1 unlock conditions vary per building (tech count thresholds)
- Confirmation dialogs on upgrade/downgrade (legacy has noConfirm option)

## Open Questions
- Should we implement stage-specific price ratios now or defer?
- Should dynamic calculateEffects (seasonal solar farm) be part of this epic?
