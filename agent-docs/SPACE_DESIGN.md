# Space Tab Design — Prep Notes for Next Session

Drop-spec for the upcoming Space-tab iteration. Read this first, then jump
into `SpacePanel.tsx`, `InspectorContext.tsx`, and the engine `space.ts`.

## 1. Game-State Snapshot

12 planets reached via mission programs, 27 space buildings constructed
*on* those planets, all driven from `packages/engine/src/space.ts`.

### Planets (route days = travel time from cath)

| Planet | Route Days | Mission Program | Role |
|---|---:|---|---|
| `cath` | 0 | `orbitalLaunch` | Earth/home; satellites, space station |
| `moon` | 30 | `moonMission` | uranium → unobtainium conversion, storage hub |
| `dune` | 356 | `duneMission` | uranium/oil/spice autoprod |
| `piscine` | 256 | `piscineMission` | science boost (research vessel, orbital array) |
| `helios` | 1,200 | `heliosMission` | antimatter / energy peak |
| `terminus` | 2,500 | `terminusMission` | cryo storage |
| `kairo` | 5,000 | `kairoMission` | science beacon (relic mechanic deferred) |
| `yarn` | 3,800 | `yarnMission` | terraforming, hydroponics |
| `umbra` | 7,500 | `umbraMission` | energy harvesters |
| `charon` | 25,000 | `charonMission` | quantum entangler (hash-rate mechanic deferred) |
| `centaurusSystem` | 120,000 | `centaurusSystemMission` | tectonic / molten core |
| `furthestRing` | 725,000,000 | `furthestRingMission` | late-game sink |

### Space Buildings (27 total, grouped by planet)

- **cath (3)**: spaceElevator, satellite, spaceStation
- **moon (2)**: moonOutpost, moonBase
- **dune (3)**: planetCracker, hydrofracturer, spiceRefinery
- **piscine (2)**: researchVessel, orbitalArray
- **helios (4)**: sunlifter, containmentChamber, heatsink, sunforge
- **terminus (1)**: cryostation
- **kairo (1)**: spaceBeacon
- **yarn (2)**: terraformingStation, hydroponics
- **umbra (3)**: hrHarvester, navigationRelay, spaceShuttle
- **charon (1)**: entangler
- **centaurusSystem (2)**: tectonic, moltenCore

### Engine gaps (deferred from Epic 13)

- Dynamic effect chains: moonBase storage scaling, satellite↔observatory
  synergy, planetCracker ratio dynamics, hydroponics ratio chain
- spaceBeacon relic-per-day mechanic
- entangler hash-rate mechanic
- Route-time compression via time crystals
- `breakIronWill` behavior for spaceStation/terraformingStation
- Per-tick production logic for moonOutpost, spaceBeacon

These are the "still TODO" items in space.ts — the UI design should not
*depend* on them being there, but should leave room for them to land.

## 2. Design Principles (hypotheses, validate next session)

### 2.1 Planet-centric, not flat

Current `SpacePanel.tsx` shows two parallel lists: "Missions" and "Space
Buildings". The mental model players actually use is: *planets are
destinations; missions unlock them; buildings are built on them*.

Proposal: a planet-card grid is the primary layout. Each card shows
- planet name + tier-1 illustration
- route status: travelling (N days remaining) / reached / unreached
- visible-from-here buildings (those whose planet === this card)
- one-line role label (the "role" column above)

Clicking a planet opens the Inspector with the planet entity. The Inspector
then surfaces all buildings on that planet with current val/on counts and
next-cost.

### 2.2 Route-days as the primary UI driver

Route-days drive strategy ("do I push for Helios next or finish Dune?").
Surface them prominently:

- Active travels get a progress bar + remaining-days counter, persistent
  across the panel (not hidden inside a planet card)
- Unreached planets show "Launch (route: 1,200 days)" as the CTA
- After landing, the planet card pivots to building-management mode

### 2.3 Bottleneck-chain visualisation

For each planet that's reached, show the **next strategic target**:
- next building you can afford to start
- next building gated by a tech still locked
- next mission this planet unlocks (if any)

This makes the late-game less of a wiki-grind and the chain-of-bottlenecks
visible — matches the GAME_LOOP.md design philosophy.

### 2.4 Inspector entities for Space

Today's `InspectorContext.tsx` has entities for Resource, Building, Tech,
Upgrade, Job, Policy, Perk, Kitten. No Space entities. Next session adds:

- `PlanetEntity`: name, routeDays, reached, role, building-list
- `SpaceProgramEntity` (mission): name, unlock chain, cost, what it
  reveals
- `SpaceBuildingEntity`: name, planet, val/on, prices, effects

Each gets a dedicated detail renderer in `InspectorPanel.tsx`, modelled on
the existing `BuildingDetail` / `TechDetail`.

## 3. Asset Wishlist

All assets follow ADR-020: 1024×1024 native via direct cwebp lossless
into `assets/exports/<category>/<asset>.webp`. No NN round-trip.

### Per planet (12 assets)

Hero illustration per planet, Cosmos stack (cool palette, see LOCKED-STACK
COSMOS section). Filename pattern: `assets/exports/planets/<planet>.webp`.

| Planet | Visual hook |
|---|---|
| `cath` | Earth-like home, orbiting satellites in foreground |
| `moon` | Crater outpost with kitten-built dome |
| `dune` | Desert with cracker drills and spice geysers |
| `piscine` | Aquatic planet with research vessel orbiting |
| `helios` | Sun-grazing platform, golden-cyan palette |
| `terminus` | Frozen edge-of-orbit, cryostation glow |
| `kairo` | Dark void with the beacon as one bright point |
| `yarn` | Pastoral terraformed greenhouses, hopeful |
| `umbra` | Shadow-side, hr-harvester silhouettes |
| `charon` | Pluto-like, entangler arc beam |
| `centaurusSystem` | Twin-star vista, tectonic platform |
| `furthestRing` | Edge-of-cosmos, unreachable feel |

### Per space building (27 assets)

Card hero in the Buildings style, scaled to the planet's visual palette.
Filename pattern: `assets/exports/buildings/<name>.webp` (same category as
existing land buildings — they all live together).

No tier expansion needed initially (space buildings don't have s/m/l in
the schema). Add tier suffixes only if a building gets visually distinct
stages later.

### Per mission (12 small icons)

48×48 mission badge. Filename pattern:
`assets/exports/missions/<name>.webp`. Same Cosmos stack but environment-
only variant (no chibi cat).

## 4. Engine Touch-Points the UI Needs

Minimum surface so the UI can express the design above without an engine
refactor:

- **Per-planet building grouping** is already implicit in the
  `SpaceBuildingDef.planet` field — just needs a derived view in the
  client.
- **Travel-progress percentage**: derive from `routeDays` countdown
  (already in state) — no new persisted field.
- **Next-cost target**: client computes from `getBuildingPrice(def, val)`
  similarly to BuildingsPanel.
- **Mission "what it unlocks"**: trace `SpaceMissionDef.unlocks` (planets,
  techs, buildings) — exists in engine, just needs surfacing.

What's NOT needed for the first iteration:
- Engine refactor for dynamic effect chains (those are out of scope; the
  UI shows static effects from effectCache)
- New action types (BUILD_SPACE_BUILDING and LAUNCH_MISSION already exist)
- Persistence changes

## 5. Next-Session Task List

In rough dependency order:

1. **Asset generation** (own `design-assets` PR) — 12 planet heroes,
   27 space buildings, 12 mission badges. Cosmos stack, 1024² direct
   cwebp.
2. **InspectorContext entities** — add 3 new types + factory helpers.
3. **InspectorPanel detail renderers** — Planet, SpaceProgram,
   SpaceBuilding views; reuse `PricesSection` / `EffectsSection` patterns
   from BuildingDetail.
4. **SpacePanel redesign** — planet-card grid; route progress strip;
   missions surface as "Launch" CTAs on un-reached planet cards.
5. **Tests** — SpacePanel snapshot test, new Inspector entity unit tests.
6. **Bottleneck-chain hint** — per-planet "next target" line. May land
   later if time runs short.

## Out of scope for this prep doc

- Concrete UI mock-ups / wireframes (sketch in next session)
- Specific prompt drafts for each planet (live in `local/prompts/` once
  the visual hooks above are validated)
- Engine work for deferred mechanics (relic production, hash-rate,
  time-crystal route compression)
