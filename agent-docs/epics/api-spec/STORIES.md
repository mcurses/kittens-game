# Epic 02: API Spec

**Status:** In Progress
**Started:** 2026-03-16
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
- [ ] Given `openapi.yaml`, when validated, then it is valid OpenAPI 3.1
- [ ] Given `openapi.yaml`, then it declares `info.version: "0.1.0"`, `info.title: "Kittens Game API"`
- [ ] Given `openapi.yaml`, then it lists all 7 endpoints (GET /api/health, GET/api/game/state, POST /api/game/action, POST /api/game/tick, GET /api/game/save, POST /api/game/load, POST /api/game/reset)
- [ ] Given `openapi.yaml`, then all `$ref` components resolve without errors

### Legacy Reference
- N/A — new API surface; informed by `legacy/game.js:2317` (resetState), `2421` (save), `2529` (load)

### Status
- [ ] Tests written
- [ ] Implementation complete
- [ ] Self-rating passed

---

## Story: Health Endpoint Schema

**As a** client
**I want** a typed health response
**So that** I can confirm the server is alive and check its version

### Acceptance Criteria
- [ ] Given `GET /api/health`, then it returns `{ status: "ok", version: string }`
- [ ] Given a Zod schema `HealthResponseSchema`, when parsed with `{ status: "ok", version: "0.1.0" }`, then it succeeds
- [ ] Given the schema, when parsed with `{ status: "error" }`, then it fails validation

### Legacy Reference
- N/A — new endpoint

### Status
- [ ] Tests written
- [ ] Implementation complete
- [ ] Self-rating passed

---

## Story: Game State Endpoint Schemas

**As a** client
**I want** typed request/response schemas for `GET /api/game/state`
**So that** clients always receive a well-typed snapshot of the full game state

### Acceptance Criteria
- [ ] Given `GameStateResponseSchema`, when parsed with a valid state snapshot, then it succeeds
- [ ] Given `GameStateResponseSchema`, then it includes `tick: number` and `version: number`
- [ ] Given the schema, when `tick` is negative, then it fails validation

### Legacy Reference
- `legacy/game.js:2317` — `resetState()` initializes the canonical set of game properties

### Status
- [ ] Tests written
- [ ] Implementation complete
- [ ] Self-rating passed

---

## Story: Action Endpoint Schema

**As a** client
**I want** a typed discriminated union for `POST /api/game/action`
**So that** all game mutations go through a single validated channel

### Acceptance Criteria
- [ ] Given `GameActionRequestSchema`, then it validates `{ type: "TICK" }`
- [ ] Given `ActionResultSchema`, then it includes `ok: boolean` and `state: GameStateResponse`
- [ ] Given an unknown action type, when parsed, then it fails validation

### Legacy Reference
- `legacy/game.js:1866` — `GamePage` dispatches actions to managers via `update()`

### Status
- [ ] Tests written
- [ ] Implementation complete
- [ ] Self-rating passed

---

## Story: Save/Load/Reset Schemas

**As a** developer
**I want** typed schemas for save export, save import, and game reset endpoints
**So that** save data round-trips are validated at the boundary

### Acceptance Criteria
- [ ] Given `SaveExportResponseSchema`, then it includes `saveVersion: number` and `data: object`
- [ ] Given `SaveImportRequestSchema`, when parsed with `{ data: {saveVersion: 1} }`, then it succeeds
- [ ] Given `GameResetRequestSchema`, then it optionally accepts `{ hard: boolean }`
- [ ] Given `SaveExportResponseSchema`, then `saveVersion` must be a positive integer ≥ 1

### Legacy Reference
- `legacy/game.js:2821` — `migrateSave()` uses `saveVersion` integer for migrations
- `legacy/game.js:2404` — `saveData.game` fields are the canonical save envelope

### Status
- [ ] Tests written
- [ ] Implementation complete
- [ ] Self-rating passed

---

## Story: WebSocket Envelope Schema

**As a** client
**I want** a typed WebSocket message envelope
**So that** all real-time state pushes from the server are validated and typed

### Acceptance Criteria
- [ ] Given `WsMessageSchema`, then it validates `{ type: string, payload: unknown, ts: number }`
- [ ] Given `WsStateDeltaSchema`, then it extends the envelope with `type: "STATE_DELTA"` and `payload: Partial<GameStateResponse>`
- [ ] Given `WsConnectedSchema`, then it validates `{ type: "CONNECTED", payload: { sessionId: string }, ts: number }`
- [ ] Given a message missing `ts`, when parsed, then it fails validation

### Legacy Reference
- N/A — new real-time layer (legacy has no WebSocket)

### Status
- [ ] Tests written
- [ ] Implementation complete
- [ ] Self-rating passed
