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
**Status:** Complete | **Started:** 2026-03-17 | **Finished:** 2026-03-17
Stories: 7/7 complete

- [x] Story 1: UpgradeDef and WorkshopState shape
- [x] Story 2: CraftDef and craft state
- [x] Story 3: PURCHASE_UPGRADE action
- [x] Story 4: Upgrade unlock chain propagation
- [x] Story 5: WorkshopManager.updateEffects — upgrade effects in effectCache
- [x] Story 6: CRAFT action
- [x] Story 7: Save / load / reset

Prerequisites: Epics 05, 08

---

## Epic 10: Religion & Faith
**Status:** Complete | **Started:** 2026-03-19 | **Finished:** 2026-03-19
Stories: 11/11 complete

- [x] Story 1: ReligionState shape and initial values
- [x] Story 2: Ziggurat upgrades — BUY_ZIGGURAT_UPGRADE action
- [x] Story 3: Religion upgrades — BUY_RELIGION_UPGRADE action
- [x] Story 4: Transcendence upgrades — BUY_TRANSCENDENCE_UPGRADE action
- [x] Story 5: PRAISE action — convert faith to worship
- [x] Story 6: ADORE action — convert worship to faithRatio (epiphany)
- [x] Story 7: TRANSCEND action — spend faithRatio to increment transcendenceTier
- [x] Story 8: ReligionManager.updateEffects — contribute to effectCache
- [x] Story 9: Faith per tick — faith resource accumulates each tick
- [x] Story 10: Save / load / reset for religion state
- [x] Story 11: Cross-manager integration test — full tick with ReligionManager

Prerequisites: Epic 08

---

## Epic 11: Prestige / Reset
**Status:** Complete | **Started:** 2026-03-19 | **Finished:** 2026-03-19
Stories: 7/7 complete

- [x] Story 1: PrestigeState shape and initial values
- [x] Story 2: PURCHASE_PERK action — buy prestige perks with paragon
- [x] Story 3: PrestigeManager.updateEffects — contribute perk effects to effectCache
- [x] Story 4: SOFT_RESET action — reset game state while preserving prestige
- [x] Story 5: Paragon production ratio — paragon boosts global production
- [x] Story 6: Save / load / reset for prestige state
- [x] Story 7: Cross-manager integration — full tick with PrestigeManager

Prerequisites: Epic 08

---

## Epic 12: Challenges
**Status:** Complete | **Started:** 2026-03-19 | **Finished:** 2026-03-19
Stories: 8/8 complete

- [x] Story 1: ChallengeState shape and initial values
- [x] Story 2: START_CHALLENGE action — begin a challenge run
- [x] Story 3: COMPLETE_CHALLENGE action — mark a challenge as completed
- [x] Story 4: ChallengeManager.updateEffects — contribute challenge effects to effectCache
- [x] Story 5: Per-challenge effect definitions
- [x] Story 6: SOFT_RESET integration — challenges reset on soft reset
- [x] Story 7: Save / load / reset for challenges state
- [x] Story 8: Cross-manager integration — full tick with ChallengeManager

Prerequisites: Epic 11

---

## Epic 13: Space
**Status:** Complete | **Started:** 2026-03-19 | **Finished:** 2026-03-19
Stories: 8/8 complete

- [x] Story 1: SpaceState shape and initial values
- [x] Story 2: LAUNCH_MISSION action
- [x] Story 3: BUY_SPACE_BUILDING action
- [x] Story 4: Planet route travel (tick)
- [x] Story 5: SpaceManager.updateEffects
- [x] Story 6: Building unlock when planet reached
- [x] Story 7: Save / load / reset for space state
- [x] Story 8: Cross-manager integration test

Prerequisites: Epic 09

---

## Epic 14: Diplomacy / Trade
**Status:** Complete | **Started:** 2026-03-19 | **Finished:** 2026-03-19
Stories: 7/7 complete

- [x] Story 1: DiplomacyState shape and initial values
- [x] Story 2: SEND_EMBASSY action
- [x] Story 3: TRADE action (deterministic)
- [x] Story 4: Race unlock mechanics
- [x] Story 5: DiplomacyManager.updateEffects
- [x] Story 6: Save / load / reset for diplomacy state
- [x] Story 7: Cross-manager integration test

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
