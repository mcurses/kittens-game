# Kittens Game Rewrite — Progress Tracker

Last updated: 2026-03-20

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
**Status:** Complete | **Started:** 2026-03-19 | **Finished:** 2026-03-19
Stories: 9/9 complete

- [x] Story 1: TimeState shape and initial values
- [x] Story 2: BUY_CFU action
- [x] Story 3: BUY_VSU action
- [x] Story 4: Heat mechanics (tick)
- [x] Story 5: SHATTER_TC action
- [x] Story 6: TimeManager.updateEffects
- [x] Story 7: CFU unlock propagation
- [x] Story 8: Save / load / reset for time state
- [x] Story 9: Cross-manager integration test

Prerequisites: Epic 10

---

## Epic 16: Achievements
**Status:** Complete | **Started:** 2026-03-19 | **Finished:** 2026-03-19
Stories: 12/12 complete

- [x] Story 1: AchievementState shape and initial values
- [x] Story 2: AchievementManager.update() — passive unlock on tick
- [x] Story 3: Resource-based achievement conditions
- [x] Story 4: Religion-based achievement conditions
- [x] Story 5: Population-based achievement conditions
- [x] Story 6: Building-based achievement conditions
- [x] Story 7: Space-based achievement conditions
- [x] Story 8: Challenge-based achievement conditions
- [x] Story 9: Time-based achievement conditions (badges)
- [x] Story 10: Kitten population badges
- [x] Story 11: Save / load / reset for achievements state
- [x] Story 12: Cross-manager integration test

Prerequisites: Epic 08

---

## Epic 17: Server
**Status:** Complete | **Started:** 2026-03-19 | **Finished:** 2026-03-19
Stories: 7 / 7 complete

- [x] Story 1: SqliteAdapter interface + in-memory adapter for testing
- [x] Story 2: GameStateStore — init, getSerialized, advanceTick, reset, loadFromSave
- [x] Story 3: HTTP endpoints — GET /api/health, GET /api/game/state, POST /api/game/action
- [x] Story 4: HTTP endpoints — POST /api/game/tick, GET /api/game/save, POST /api/game/load, POST /api/game/reset
- [x] Story 5: WS broadcast — addClient, removeClient, broadcastDelta on every state change
- [x] Story 6: Auto-tick loop at 200ms interval using Bun-native timers
- [x] Story 7: Integration — all managers wired, SQLite persistence via Drizzle ORM

Prerequisites: Epics 02, 03

---

## Epic 18: Web Client
**Status:** Complete | **Started:** 2026-03-19 | **Finished:** 2026-03-19
Stories: 8 / 8 complete

- [x] Story 1: Vite + React 19 scaffold — index.html, vite.config.ts, vitest.config.ts
- [x] Story 2: API client module — typed fetch functions for all 7 server endpoints
- [x] Story 3: useGameState hook — TanStack Query useQuery with queryKey ['gameState']
- [x] Story 4: useGameAction hook — useMutation, updates cache on success
- [x] Story 5: useWebSocket hook — CONNECTED/STATE_DELTA → setQueryData, 2s reconnect
- [x] Story 6: ResourcePanel component — resources + per-tick rates with loading state
- [x] Story 7: ActionPanel component — Gather Catnip button, pending/error state
- [x] Story 8: App root — QueryClientProvider + GameView wiring all panels

Prerequisites: Epic 17

---

## Epic 19: Engine Completeness
**Status:** Complete | **Started:** 2026-03-20 | **Finished:** 2026-03-20
Stories: 9 / 9 complete

- [x] Story 19-1: Shatter TC produces resources (shatterTCGain * perTick * TICKS_PER_YEAR)
- [x] Story 19-2: Heat efficiency multiplier (1 + heatEfficiency)
- [x] Story 19-3: heatMax=100, temporalFluxMax=3000, heatPerTick=0.01 base values
- [x] Story 19-4: Paragon production ratio into effectCache (globalProductionModifier)
- [x] Story 19-5: BURN_PARAGON action (1 paragon → 1 burnedParagon)
- [x] Story 19-6: SACRIFICE_UNICORNS, SACRIFICE_ALICORNS, REFINE_TIME_CRYSTALS actions
- [x] Story 19-7: Seasonal trade modifiers in RACE_DEFS for all 7 races
- [x] Story 19-8: Mission unlocks propagate to policies and challenges
- [x] Story 19-9: Cross-manager integration test

Engine tests: 695 passing | Line coverage: 99.65%

Prerequisites: Epic 18

---

## Epic 20: Game UI
**Status:** Complete | **Started:** 2026-03-20 | **Finished:** 2026-03-20
Stories: 8 / 8 complete

- [x] Story 20-1: Resource filtering — only show resources with value > 0
- [x] Story 20-2: BuildingsPanel with BUY_BUILDING controls
- [x] Story 20-3: JobsPanel with ASSIGN_JOB / UNASSIGN_JOB controls
- [x] Story 20-4: CalendarDisplay — season/year/day in header
- [x] Story 20-5: LogPanel + useLogMessages — WS LOG_MESSAGE accumulation (50 msg cap)
- [x] Story 20-6: SciencePanel with RESEARCH controls
- [x] Story 20-7: WorkshopPanel with PURCHASE_UPGRADE and CRAFT controls
- [x] Story 20-8: TabContainer — 5-tab navigation wired into App

Client-web tests: 113 passing | Line coverage: 96.51%

Prerequisites: Epic 19

---

## Epic 21: Feature Parity Audit
**Status:** Complete | **Started:** 2026-03-20 | **Finished:** 2026-03-20
Stories: 5/5 complete

- [x] Story 21-1: kittensPerTickBase base value
- [x] Story 21-2: Building unlock system (unlockRatio + requiredTech)
- [x] Story 21-3: Happiness calculation updates each tick
- [x] Story 21-4: Job production scales with happiness
- [x] Story 21-5: Cross-manager integration test for parity

Engine tests: 721 passing | Line coverage: 99.65% | Branch: 89.13%
Server tests: 43 passing (LOG_MESSAGE emission + requiredTech — post-epic action items)

---

## Epic 25: UI Completeness
**Status:** Complete | **Started:** 2026-03-29 | **Finished:** 2026-03-29
Stories: 9 / 9 complete

- [x] Story 25-1: Server auto-tick loop — startAutoTick/stopAutoTick on GameStateStore
- [x] Story 25-2: VillagePanel — kittens/maxKittens/happiness summary in header
- [x] Story 25-3: Per-tick rates in ResourcePanel — serialize perTick in engine state
- [x] Story 25-4: Tech and upgrade costs in Science/Workshop panels (TECH_DEFS/UPGRADE_DEFS)
- [x] Story 25-5: Religion tab — faith, Praise/Adore/Transcend, ziggurat/religion upgrades
- [x] Story 25-6: Space tab — missions with Launch, space buildings with Buy
- [x] Story 25-7: Time tab — heat/flux, Shatter TC, CFU/VSU buy buttons
- [x] Story 25-8: Diplomacy tab — races with Send Embassy + Trade buttons
- [x] Story 25-9: Craft-N UI — ×1/×5/×25/×100 buttons per craftable

Pre-epic action items executed:
- [x] _broadcast refactor (single helper vs duplicate _broadcastLog/_broadcastDelta)
- [x] Season change LOG_MESSAGE added to advanceTick

Engine tests: 724 passing | Line coverage: 99.65%
Server tests: 48 passing | Line coverage: 96.35%
Client-web tests: 176 passing | Line coverage: 98.44%
Total: 972 tests across all packages

Prerequisites: Epics 20, 21
