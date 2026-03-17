# Kittens Game Rewrite — Progress Tracker

Last updated: 2026-03-16

---

## Epic 01: Foundation
**Status:** Complete | **Started:** 2026-03-16 | **Finished:** 2026-03-16
Stories: 7 / 7 complete

- [x] Monorepo Initialization — pnpm workspace + Turborepo
- [x] Package Skeletons — engine, server, client-web, api-spec, shared
- [x] TypeScript Configuration — strict mode, project references
- [x] Test Runner Setup — Vitest + coverage in engine & server
- [x] Linting & Formatting — Biome configured and passing
- [x] CI Pipeline — GitHub Actions lint → test → build
- [x] Agent Docs Bootstrap — PROGRESS, EPICS, DECISIONS, SELF_RATINGS

---

## Epic 02: API Spec
**Status:** Complete | **Started:** 2026-03-16 | **Finished:** 2026-03-16
Stories: 6 / 6 complete

- [x] OpenAPI YAML skeleton — `packages/api-spec/openapi.yaml`
- [x] Health endpoint schema — `HealthResponseSchema`
- [x] Game state endpoint schemas — `GameStateResponseSchema`
- [x] Action endpoint schema — `GameActionRequestSchema`, `ActionResultSchema`
- [x] Save/load/reset schemas — `SaveExportResponseSchema`, `SaveImportRequestSchema`, `GameResetRequestSchema`
- [x] WebSocket envelope schema — `WsStateDeltaSchema`, `WsConnectedSchema`

---

## Epic 03: Core Engine
**Status:** Complete | **Started:** 2026-03-16 | **Finished:** 2026-03-16
Stories: 6 / 6 complete

- [x] Manager interface — `Manager` interface + `NullManager` implementation
- [x] Effect cache system — `buildEffectCache()`, `getEffect()`, DR-eligible effects
- [x] Diminishing returns — `getLimitedDR()` ported faithfully from legacy game.js:2269
- [x] Tick engine — `tick()` pure function, ordered manager dispatch
- [x] Save/load serialization — `serialize()`, `deserialize()`, JSON-safe
- [x] Reset state — `resetState()` calls all manager resets in order

---

## Epic 04: Resources
**Status:** Complete | **Started:** 2026-03-16 | **Finished:** 2026-03-16
Stories: 4 / 4 complete

- [x] Resource state — ResourceState, ResourceEntry, RESOURCE_NAMES, createInitialResources()
- [x] ResourceManager update — calcResourcePerTick(), clamp to [0, maxValue]
- [x] Gather catnip action — GATHER_CATNIP increments catnip by 1, clamped
- [x] Serialization — serialize/deserialize include resources field

Prerequisites: Epic 03

---

## Epic 05: Buildings
**Status:** Complete | **Started:** 2026-03-16 | **Finished:** 2026-03-16
Stories: 4 / 4 complete

- [x] Building definitions — BUILDING_DEFS with 11 buildings, BuildingDef, PriceEntry
- [x] BuildingManager effects — Max effects use val, others use on
- [x] Buy building action — BUY_BUILDING deducts resources, increments val/on, price scales by priceRatio^count
- [x] Serialization — buildings field in serialize/deserialize

Prerequisites: Epic 04

---

## Epic 06: Village / Population / Jobs
**Status:** Complete | **Started:** 2026-03-16 | **Finished:** 2026-03-16
Stories: 6 / 6 complete

- [x] Village state — VillageState, JOB_DEFS, createInitialVillage()
- [x] Kitten growth — progress accumulator, spawns when progress >= 1 and kittens < maxKittens
- [x] Kitten death — kills 1 kitten/tick when catnip + perTick < 0, frees job slot
- [x] Job production — updateEffects() outputs PerTickBase per job + consumption PerTickCon
- [x] Job assignment — ASSIGN_JOB / UNASSIGN_JOB actions with idle-kitten validation
- [x] Serialization — village field in serialize/deserialize

Prerequisites: Epic 04

---

## Epic 07: Calendar & Seasons
**Status:** Complete | **Started:** 2026-03-17 | **Finished:** 2026-03-17
Stories: 6/6 complete

- [x] Story 1: CalendarState shape and initial values
- [x] Story 2: Day advances each tick
- [x] Story 3: Season advancement
- [x] Story 4: Season catnip modifier via effect cache
- [x] Story 5: CalendarManager integrates with GameState and tick loop
- [x] Story 6: Save / load / reset

Prerequisites: Epic 03

---

## Epic 08: Science / Tech Tree
**Status:** Complete | **Started:** 2026-03-17 | **Finished:** 2026-03-17
Stories: 7/7 complete

- [x] Story 1: TechDef and ScienceState shape
- [x] Story 2: PolicyDef and policy state
- [x] Story 3: RESEARCH action for technologies
- [x] Story 4: RESEARCH_POLICY action
- [x] Story 5: updateEffects — tech and policy effects in effectCache
- [x] Story 6: Tech unlock propagation on research
- [x] Story 7: Save / load / reset

Prerequisites: Epics 05, 06

---

## Epic 09: Workshop / Upgrades
**Status:** In Progress | **Started:** 2026-03-17
Stories: 0/7 complete

- [ ] Story 1: UpgradeDef and WorkshopState shape
- [ ] Story 2: CraftDef and craft state
- [ ] Story 3: PURCHASE_UPGRADE action
- [ ] Story 4: Upgrade unlock chain propagation
- [ ] Story 5: WorkshopManager.updateEffects — upgrade effects in effectCache
- [ ] Story 6: CRAFT action
- [ ] Story 7: Save / load / reset

Prerequisites: Epics 05, 08

---

## Epic 10: Religion & Faith
**Status:** Not Started
Prerequisites: Epic 08

---

## Epic 11: Prestige / Reset
**Status:** Not Started
Prerequisites: Epic 08

---

## Epic 12: Challenges
**Status:** Not Started
Prerequisites: Epic 11

---

## Epic 13: Space
**Status:** Not Started
Prerequisites: Epic 09

---

## Epic 14: Diplomacy / Trade
**Status:** Not Started
Prerequisites: Epic 09

---

## Epic 15: Time Mechanics
**Status:** Not Started
Prerequisites: Epic 10

---

## Epic 16: Achievements
**Status:** Not Started
Prerequisites: Epic 08

---

## Epic 17: Server
**Status:** Not Started
Prerequisites: Epics 02, 03

---

## Epic 18: Web Client
**Status:** Not Started
Prerequisites: Epic 17

---

## Epic 19: Multi-client
**Status:** Not Started
Prerequisites: Epic 18

---

## Epic 20: i18n
**Status:** Not Started
Prerequisites: Epic 18

---

## Epic 21: Themes & Assets
**Status:** Not Started
Prerequisites: Epic 18

---

## Epic 22: Feature Parity Audit
**Status:** Not Started
Prerequisites: All epics
