# Kittens Game Rewrite — Progress Tracker

Last updated: 2026-04-01

---

## Maintenance Updates

- 2026-04-01: Retroactively opened Epic 34 to capture post-Epic 33 production/control parity work. Recent fixes must not live only in commits and `PARITY.md` without an epic/story trail.
- 2026-03-30: Fixed the missing Web UI trigger for the `HUNT` action by adding a hunt control to `ActionPanel`.
- 2026-03-30: Fixed `ActionPanel` action dispatch to use the current slot context, so non-default saves no longer post actions to the default slot.
- 2026-03-31: Fixed slot-aware action dispatch across client panels (`BuildingsPanel`, `JobsPanel`, `SciencePanel`, `WorkshopPanel`, `ReligionPanel`, `SpacePanel`, `DiplomacyPanel`, `TimePanel`) so actions in `?slot=<name>` mutate the selected save instead of the default slot.

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

## Epic 26: UI Information Architecture
**Status:** Draft | **Started:** — | **Finished:** —
Stories: draft only, not started

- [ ] Legacy detail-surface audit
- [ ] Shared detail pattern decision
- [ ] Resource details surface
- [ ] Upgrade / building / tech explanation surface
- [ ] Shared interaction and accessibility rules
- [ ] Responsive presentation rules

Notes:
- Drafted only. Research still required.
- User product decisions still required before implementation.
- Epic docs: `agent-docs/epics/ui-information-architecture/`

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

## Epic 22: Multi-client
**Status:** Complete | **Started:** 2026-03-29 | **Finished:** 2026-03-29
Stories: 6/6 complete

- [x] Story 22-1: SessionRegistry — multi-slot store management
- [x] Story 22-2: HTTP routes accept slot query parameter
- [x] Story 22-3: WebSocket connects to specific slot
- [x] Story 22-4: WS action dispatch
- [x] Story 22-5: Client slot selection from URL
- [x] Story 22-6: Slot name validation

Engine tests: 729 passing | Server tests: 74 passing | Client tests: 212 passing
Server line coverage: 96.37% | Client line coverage: 99.64%

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

---

## Epic 26: UI Information Architecture
**Status:** Complete | **Started:** 2026-03-30 | **Finished:** 2026-03-30
Stories: 10 / 10 complete

- [x] Story 26-1: SlotContext — React context for slot name propagation
- [x] Story 26-2: description? field on engine defs (buildings, upgrades, techs, religion)
- [x] Story 26-3: InspectorContext — shared hover entity state
- [x] Story 26-4: InspectorPanel — right sidebar detail view
- [x] Story 26-5: ResourcePanel hover → inspector (replaces inline tooltip)
- [x] Story 26-6: BuildingsPanel hover → inspector
- [x] Story 26-7: WorkshopPanel hover → inspector
- [x] Story 26-8: SciencePanel hover → inspector
- [x] Story 26-9: Inspector + LogPanel share log-sidebar (inspector above, log below)
- [x] Story 26-10: Inspector CSS — styles for all entity kinds

Pre-epic action items executed:
- [x] Biome lint check in CI — already present as `pnpm run check`
- [x] SlotContext creation

Engine tests: 724 passing | Line coverage: 99.65%
Server tests: 48 passing | Line coverage: 96.35%
Client-web tests: 238 passing | Line coverage: 95.24%
Total: 1010 tests across all packages

Prerequisites: Epics 22, 25

---

## Epic 27: Building Completeness
**Status:** Complete | **Started:** 2026-03-30 | **Finished:** 2026-03-30
Stories: 12 / 12 complete

- [x] Story 27-01: Fix catnipDemandRatio consumption in VillageManager (+ furs/ivory/spice demand)
- [x] Story 27-02: Amphitheatre — culturePerTickBase, cultureMax, unhappinessRatio
- [x] Story 27-03: Lumber Mill — woodRatio
- [x] Story 27-04: Smelter — ironRatio, steelRatio, coalRatio
- [x] Story 27-05: Observatory — scienceRatio
- [x] Story 27-06: Brewery — happiness
- [x] Story 27-07: Mint — goldRatio, goldMax
- [x] Story 27-08: Temple — faithRatio, happiness
- [x] Story 27-09: Unicorn Pasture — unicornsPerTickBase
- [x] Story 27-10: Calciner — titaniumRatio, coalRatioGlobal
- [x] Story 27-11: Craft ratio wiring (T1–T5) — applyCraft reads tier ratios from effectCache
- [x] Story 27-12: catnipDemandWorkerRatioGlobal wiring in VillageManager worker consumption

Pre-epic action items executed:
- [x] manpower → catpower rename (engine, server, client — all packages)
- [x] Tab visibility gating in TabContainer (Science/Religion/Space/Time/Trade/Achievements unlock conditions)
- [x] Diplomacy tab renamed to Trade (per ADR-009: legacy i18n is source of truth)
- [x] ADR-009 added to DECISIONS.md (UI naming + tab visibility rules)
- [x] PARITY.md enforcement rules added to agents.md

Engine tests: 776 passing | Line coverage: 99.62%
Server tests: 48 passing | Line coverage: 96.35%
Client-web tests: 304 passing | Line coverage: ~95%
Total: 1128 tests across all packages

Prerequisites: Epics 20, 21, 26

---

## Epic 28: Legacy Save Import
**Status:** Complete | **Started:** 2026-03-31 | **Finished:** 2026-03-31
Stories: 3 / 3 complete

- [x] Story 28-1: Engine — `migrateLegacySave` pure function
- [x] Story 28-2: Server — `POST /api/game/import-legacy` endpoint with LZString decompression
- [x] Story 28-3: Client UI — Import Save panel (paste or file upload)

Engine tests: 802 passing | Line coverage: ~99%
Server tests: 86 passing
Client-web tests: 257 passing
Total: 1145 tests across all packages

Prerequisites: Epics 17, 18, 25

---

## Epic 29: Critical Bug Fixes
**Status:** Complete | **Started:** 2026-03-31 | **Finished:** 2026-03-31
Stories: 2 / 2 complete

- [x] Story 29-01: Fix VSU/CFU migration unlocked:false bug — `bool(item.unlocked) || num(item.val) > 0`
- [x] Story 29-02: Fix auto-tick not starting for runtime-created slots — `getOrCreate` now calls `startAutoTick()`

Engine tests: 805 passing
Server tests: 86 passing
Client-web tests: 260 passing
Total: 1151 tests across all packages

Prerequisites: Epic 28

---

## Epic 30: Happiness Formula Completeness
**Status:** Complete | **Started:** 2026-03-31 | **Finished:** 2026-03-31
Stories: 5 / 5 complete

- [x] Story 30-01: Temple dynamic happiness — BuildingManager computes `(0.4 + 0.1 × sunAltar.on) × temple.on` per tick
- [x] Story 30-02: Luxury resource happiness loop — +10 (+ `luxuryHappinessBonus`) per luxury resource with value > 0
- [x] Story 30-03: Karma happiness — +1% per karma point
- [x] Story 30-04: Festival bonus — +30 × (1 + festivalRatio) when festivalDays > 0
- [x] Story 30-05: Brewery consumption — per active brewery: -1 catnip/tick, -0.1 spice/tick, scaled by breweryConsumptionRatio
- [x] Story 30-06 (bonus): consumableLuxuryHappiness consumer — uncommon resources in luxury loop get additional bonus

Engine tests: 830 passing | Line coverage: 99.51% | Branch: 88.64%
Server tests: 86 passing | Line coverage: 95.12%
Client-web tests: ~260 passing | Line coverage: 96.5%
Total: ~1176 tests across all packages

---

## Epic 31: Missing Buildings (Round 2)
**Status:** Complete | **Started:** 2026-03-31 | **Finished:** 2026-03-31
Stories: 17 / 17 complete

- [x] Story 31-01: Chapel — culturePerTickBase: 0.05, faithPerTickBase: 0.005, cultureMax: 200
- [x] Story 31-02: Workshop building def — craftRatio: 0.06
- [x] Story 31-03: Steamworks — energyProduction: 1, magnetoBoostRatio: 0.15, coalRatioGlobal: -0.8
- [x] Story 31-04: Magneto — oilPerTick: -0.05, energyProduction: 5, magnetoRatio: 0.02
- [x] Story 31-05: Tradepost — fursDemandRatio: -0.04, ivoryDemandRatio: -0.04, spiceDemandRatio: -0.04, tradeRatio: 0.015
- [x] Story 31-06: Harbor — 7 resource storage boosts (catnipMax 2500, woodMax 700, etc.)
- [x] Story 31-07: Calciner consumption side — mineralsPerTickCon: -1.5, oilPerTickCon: -0.024
- [x] Story 31-08: Quarry — mineralsRatio: 0.35, coalPerTickBase: 0.015
- [x] Story 31-09: Oil Well — oilPerTickBase: 0.02, oilMax: 1500
- [x] Story 31-10: Factory — craftRatio: 0.05, energyConsumption: 2
- [x] Story 31-11: Ziggurat building — cultureMaxRatio: 0.08
- [x] Story 31-12: Spaceport — deferred (is warehouse stage 1, not standalone building)
- [x] Story 31-13: Chronosphere — temporalParadoxChance: 0.01, resStasisRatio: 0.015, energyConsumption: 20
- [x] Story 31-14: Reactor — uraniumPerTick: -0.001, productionRatio: 0.05, uraniumMax: 250, energyProduction: 10
- [x] Story 31-15: Biolab — scienceRatio: 0.35, refineRatio: 0.1, scienceMax: 1500
- [x] Story 31-16: AI Core — gflopsPerTickBase: 0.02, energyConsumption: 2
- [x] Story 31-17: Accelerator (titaniumPerTickCon: -0.015, uraniumPerTickAutoprod: 0.0025) + zebraOutpost/Workshop/Forge

Engine tests: 902 passing | Line coverage: ~99.5%

---

## Epic 32: UI Parity Pass
**Status:** Complete | **Started:** 2026-03-31 | **Finished:** 2026-04-01
Stories: 8 / 8 complete

- [x] Story 32-01: Religion TU (Cryptotheology) section in ReligionPanel
- [x] Story 32-02: Religion RU one-time upgrades show "Done" state
- [x] Story 32-03: Religion Praise/Adore multiplier display
- [x] Story 32-04: Buildings on/off display + human-readable names + label system
- [x] Story 32-05: Trade economics display + relationship status
- [x] Story 32-06: Space mission done-state + building on/off display
- [x] Story 32-07: Village happiness % + festival duration in JobsPanel
- [x] Story 32-08: Resource maxValue and demand display verification

Bug fix: SEND_EMBASSY and TRADE actions were dispatching `race:` field instead of `name:` per engine GameAction type.

Engine tests: 905 passing | Line coverage: 99.5%
Server tests: 86 passing | Line coverage: 95.12%
Client-web tests: 293 passing | Line coverage: 96.48%
Total: 1308 tests across all packages

---

## Epic 33: UI Unlock & Visibility Parity
**Status:** Complete | **Started:** 2026-04-01 | **Finished:** 2026-04-01
Stories: 8 / 8 complete

- [x] Story 33-01: Authoritative UI visibility contract in engine/API state
- [x] Story 33-02: Main tab unlock parity (Village, Workshop, Religion edge cases, Achievements, Stats, Challenges)
- [x] Story 33-03: Village shell parity (tab title, jobs panel, management, census, map)
- [x] Story 33-04: Job unlock parity (only unlocked jobs/actions visible and assignable)
- [x] Story 33-05: Science and Workshop section/item visibility parity
- [x] Story 33-06: Religion, Time, Space, and Trade conditional section/button visibility parity
- [x] Story 33-07: Resource and achievement visibility parity
- [x] Story 33-08: Legacy-save regression fixtures and client visibility test matrix

Engine tests: 918 passing | Line coverage: 99.48%
Server tests: 86 passing | Line coverage: 95.12%
Client-web tests: 301 passing | Line coverage: 95.83%
Total: 1329 tests across all packages

Highlights:
- Added engine-owned `deriveUiVisibility()` selector contract for tabs, village sections, jobs, resources, hunt visibility, and shatter visibility
- Removed hardcoded client visibility shortcuts from `TabContainer`, `JobsPanel`, `ResourcePanel`, `ActionPanel`, and `TimePanel`
- Added Stats and Challenges parity-shell tabs so legacy unlock conditions are represented in navigation

---

## Epic 34: Production & Control Parity Audit
**Status:** Complete | **Started:** 2026-04-01 | **Finished:** 2026-04-01
Stories: 6 / 6 complete

- [x] Story 34-01: Building enable/disable action surface — engine action, API contract, and web UI controls for legacy-toggleable buildings
- [x] Story 34-02: Resource production consumers — generic `*PerTickAutoprod` and `*PerTickProd` runtime consumers
- [x] Story 34-03: Smelter and steamworks runtime production parity slice
- [x] Story 34-04: Engine-owned building toggle visibility parity, including the legacy `lackResConvert` rule that re-enabled smelter controls
- [x] Story 34-05: Steamworks automation loop parity — batch auto-crafting, jam/delay behavior, automation save/load, and engine-backed web controls
- [x] Story 34-06: Factory automation mode parity — carbon sequestration mode, pollution/energy switching, persisted state, and matching UI controls

Retroactively captured commits:
- `154a5a9` docs(agent-docs): tighten parity verification workflow
- `05cafd1` fix(engine): start production parity audit slice 1
- `f76d835` fix(client-web): restrict building on-off controls to toggleable buildings

Current parity note:
- Smelter toggle parity briefly regressed because legacy toggleability is split across building defs and `legacy/core.js` controller defaults. Future control-surface audits must trace both.
- Steamworks automation now runs on legacy-faithful calendar boundaries: yearly by default, plus an autumn batch when `advancedAutomation` is researched.
- Factory carbon-sequestration mode now defaults on when researched, persists through save/load, uses engine-owned visibility rules, and matches legacy energy/pollution switching.

---

## Epic 35: UI QoL Parity
**Status:** Complete | **Started:** 2026-04-01 | **Finished:** 2026-04-01
Stories: 2 fully complete + 2 partially complete (1 deferred)

- [x] Story 35-01: Adaptive craft shortcuts — `max(1,1%)`, `max(25,5%)`, `max(100,10%)`, `All` buttons computed from live resources; global craft effectiveness `+N%` banner
- [ ] Story 35-02: Mechanization craft controls — deferred, requires engineer-assignment engine state not yet implemented
- [x] Story 35-03: Hide-researched/complete toggles — Science, Workshop, and Space panels each expose persistent localStorage-backed toggles
- [x] Story 35-04: Trade multi-send shortcuts — ×5 and ×25 buttons added to DiplomacyPanel; TRADE action extended with optional `amount`

Engine changes:
- `packages/engine/src/actions.ts`: TRADE action gains optional `amount` field; action handler loops `applyTrade` N times
- `packages/engine/src/buildings.ts`: `effectsBase` base storage caps (catnipMax:5000, woodMax:200, etc.) added to `BuildingManager.updateEffects()`
- Fixed 4 test regressions from effectsBase: harbor goldMax baseline, 3 steamworks parity tests requiring full-capacity resources

Client-web tests: 325 passing | Line coverage: 96.5%
Total: 1376 tests across all packages

Parity gaps noted:
- Legacy trade shortcuts are dynamic (50% / 20% of max affordable), not fixed ×5/×25 — filed for future epic
- Story 35-02 mechanization requires engineer-state engine work before UI can be implemented
