# Epic 13: Space — Implementation Notes

## Legacy Reference
- `legacy/js/space.js` — full SpaceManager

## Key Design Decisions

### Programs vs Planet Buildings
Space has two distinct structures:
- **Programs** (space missions): stackable one-time purchases that unlock planets/missions
  - `orbitalLaunch` is the only initially unlocked program
  - Programs have `val` (launched count) and `on` (active/complete)
- **Planet buildings**: non-stackable buildings on specific planets
  - Require planet to be `reached` before they unlock
  - Some require specific techs via `requiredTech`

### Flat SpaceState Design
Rather than nested planet→buildings hierarchy (hard to serialize), we use:
- `programs: Record<string, { val: number; on: number; unlocked: boolean }>`
- `planets: Record<string, { unlocked: boolean; reached: boolean; routeDays: number }>`
- `spaceBuildings: Record<string, { val: number; on: number; unlocked: boolean }>`

### Effect Computation
Space building effects use static defaults (same as buildings.ts approach).
Dynamic effects from `calculateEffects` (e.g. moonBase storage bonus) deferred to a future epic.

### Route Travel
When a planet is unlocked (via mission), `routeDays` counts down each tick.
When `routeDays <= 0`, planet becomes `reached = true` and its buildings unlock.

## Deferred Features
- `calculateEffects` dynamic effect computation (cross-manager dependencies)
- `action`/`updateEffects` per-building per-tick logic (e.g. moonOutpost uranium drain)
- `unlockScheme` threshold-based unlocking (sattelite→observatory, vessel, fluid, dune, arctic schemes)
- `breakIronWill` flag for spaceStation/terraformingStation
- Energy production/consumption system (needs energy manager)
- entangler hash rate mechanic
- `spaceManufacturing` workshop upgrade factory bonus
- `prodTransferBonus` from spaceElevator

## Planet/Building Inventory
Programs (15): orbitalLaunch, moonMission, duneMission, piscineMission, heliosMission,
  terminusMission, kairoMission, rorschachMission, yarnMission, umbraMission, charonMission,
  centaurusSystemMission, furthestRingMission

Planets (12): cath, moon, dune, piscine, helios, terminus, kairo, yarn, umbra, charon,
  centaurusSystem, furthestRing

Space Buildings (~27): spaceElevator, sattelite, spaceStation, moonOutpost, moonBase,
  planetCracker, hydrofracturer, spiceRefinery, researchVessel, orbitalArray, sunlifter,
  containmentChamber, heatsink, sunforge, cryostation, spaceBeacon, terraformingStation,
  hydroponics, hrHarvester, navigationRelay, spaceShuttle, entangler, tectonic, moltenCore
