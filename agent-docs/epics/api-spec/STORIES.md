# Epic 02: API Spec

**Status:** Complete
**Started:** 2026-03-16
**Finished:** 2026-03-16
**Legacy references:** `legacy/game.js` (save/load, resetState, migrateSave, GamePage endpoints)

---

## Story Index

1. [OpenAPI YAML skeleton](#story-openapi-yaml-skeleton)
2. [Health endpoint schema](#story-health-endpoint-schema)
3. [Game state endpoint schemas](#story-game-state-endpoint-schemas)
4. [Action endpoint schema](#story-action-endpoint-schema)
5. [Save/load/reset schemas](#story-saveloadreset-schemas)
6. [WebSocket envelope schema](#story-websocket-envelope-schema)

---

## Story: OpenAPI YAML Skeleton

**As a** developer
**I want** a valid OpenAPI 3.1 YAML file at `packages/api-spec/openapi.yaml`
**So that** all server routes have a single source of truth that generates types

### Acceptance Criteria
- [x] Given `openapi.yaml`, when validated, then it is valid OpenAPI 3.1
- [x] Given `openapi.yaml`, then it declares `info.version: "0.1.0"`, `info.title: "Kittens Game API"`
- [x] Given `openapi.yaml`, then it lists all 7 endpoints (GET /api/health, GET/api/game/state, POST /api/game/action, POST /api/game/tick, GET /api/game/save, POST /api/game/load, POST /api/game/reset)
- [x] Given `openapi.yaml`, then all `$ref` components resolve without errors

### Legacy Reference
- N/A — new API surface; informed by `legacy/game.js:2317` (resetState), `2421` (save), `2529` (load)

### Status
- [x] Tests written
- [x] Implementation complete
- [x] Self-rating passed

---

## Story: Health Endpoint Schema

**As a** client
**I want** a typed health response
**So that** I can confirm the server is alive and check its version

### Acceptance Criteria
- [x] Given `GET /api/health`, then it returns `{ status: "ok", version: string }`
- [x] Given a Zod schema `HealthResponseSchema`, when parsed with `{ status: "ok", version: "0.1.0" }`, then it succeeds
- [x] Given the schema, when parsed with `{ status: "error" }`, then it fails validation

### Legacy Reference
- N/A — new endpoint

### Status
- [x] Tests written
- [x] Implementation complete
- [x] Self-rating passed

---

## Story: Game State Endpoint Schemas

**As a** client
**I want** typed request/response schemas for `GET /api/game/state`
**So that** clients always receive a well-typed snapshot of the full game state

### Acceptance Criteria
- [x] Given `GameStateResponseSchema`, when parsed with a valid state snapshot, then it succeeds
- [x] Given `GameStateResponseSchema`, then it includes `tick: number` and `version: number`
- [x] Given the schema, when `tick` is negative, then it fails validation

### Legacy Reference
- `legacy/game.js:2317` — `resetState()` initializes the canonical set of game properties

### Status
- [x] Tests written
- [x] Implementation complete
- [x] Self-rating passed

---

## Story: Action Endpoint Schema

**As a** client
**I want** a typed discriminated union for `POST /api/game/action`
**So that** all game mutations go through a single validated channel

### Acceptance Criteria
- [x] Given `GameActionRequestSchema`, then it validates `{ type: "TICK" }`
- [x] Given `ActionResultSchema`, then it includes `ok: boolean` and `state: GameStateResponse`
- [x] Given an unknown action type, when parsed, then it fails validation

### Legacy Reference
- `legacy/game.js:1866` — `GamePage` dispatches actions to managers via `update()`

### Status
- [x] Tests written
- [x] Implementation complete
- [x] Self-rating passed

---

## Story: Save/Load/Reset Schemas

**As a** developer
**I want** typed schemas for save export, save import, and game reset endpoints
**So that** save data round-trips are validated at the boundary

### Acceptance Criteria
- [x] Given `SaveExportResponseSchema`, then it includes `saveVersion: number` and `data: object`
- [x] Given `SaveImportRequestSchema`, when parsed with `{ data: {saveVersion: 1} }`, then it succeeds
- [x] Given `GameResetRequestSchema`, then it optionally accepts `{ hard: boolean }`
- [x] Given `SaveExportResponseSchema`, then `saveVersion` must be a positive integer ≥ 1

### Legacy Reference
- `legacy/game.js:2821` — `migrateSave()` uses `saveVersion` integer for migrations (legacy currently at v15)
- `legacy/game.js:2404` — `saveData.game` fields are the canonical save envelope

### Notes
- Legacy `saveVersion` is 15; our new format starts at 1 (different schema, not migrating legacy saves)

### Status
- [x] Tests written
- [x] Implementation complete
- [x] Self-rating passed

---

## Story: WebSocket Envelope Schema

**As a** client
**I want** a typed WebSocket message envelope
**So that** all real-time state pushes from the server are validated and typed

### Acceptance Criteria
- [x] Given `WsStateDeltaSchema`, then it validates `{ type: "STATE_DELTA", payload: unknown, ts: number }`
- [x] Given `WsStateDeltaSchema`, then it extends the envelope with `type: "STATE_DELTA"` and `payload: Partial<GameStateResponse>`
- [x] Given `WsConnectedSchema`, then it validates `{ type: "CONNECTED", payload: { sessionId: string }, ts: number }`
- [x] Given a message missing `ts`, when parsed, then it fails validation

### Legacy Reference
- N/A — new real-time layer (legacy has no WebSocket)

### Status
- [x] Tests written
- [x] Implementation complete
- [x] Self-rating passed
