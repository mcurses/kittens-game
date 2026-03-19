# Epic 17: Server — Stories

**Status:** In Progress
**Started:** 2026-03-19
**Prerequisites:** Epics 02 ✅, 03 ✅

---

## Story 1: Health endpoint

**As a** client or monitoring service
**I want** a GET /api/health endpoint
**So that** I can verify the server is running

### Acceptance Criteria
- [x] Given the server is running, when GET /api/health is called, then it returns `{ status: "ok", version: "0.1.0" }` with 200
- [x] Given the response, it matches the `HealthResponse` Zod schema from api-spec

### Legacy Reference
No legacy equivalent — new infrastructure.

---

## Story 2: Game state endpoint

**As a** client
**I want** GET /api/game/state to return the full serialized game state
**So that** I can render the current game on initial load

### Acceptance Criteria
- [x] Given the server holds a GameState, when GET /api/game/state is called, then it returns the serialized state with 200
- [x] Given the state is freshly initialized, when the endpoint is called, then `tick` is 0 and `version` is 1
- [x] The response matches `GameStateResponse` schema

### Legacy Reference
New infrastructure, no legacy equivalent.

---

## Story 3: Action endpoint

**As a** client
**I want** POST /api/game/action to apply a typed action to the game
**So that** players can interact with the game

### Acceptance Criteria
- [x] Given a valid action body `{ type: "TICK" }`, when POST /api/game/action is called, then the game state tick advances by 1 and `ok: true` is returned
- [x] Given an invalid body (wrong shape), when POST /api/game/action is called, then `ok: false` and a 400 status with error message is returned
- [x] Given a valid action, the response includes the new state snapshot

### Legacy Reference
New infrastructure.

---

## Story 4: Tick endpoint

**As a** test automation tool
**I want** POST /api/game/tick to manually advance one tick
**So that** integration tests can drive time forward deterministically

### Acceptance Criteria
- [x] Given the server is running, when POST /api/game/tick is called, then the tick counter increments by 1
- [x] The response matches `GameStateResponse` schema

---

## Story 5: Save/load/reset endpoints

**As a** player
**I want** GET /api/game/save, POST /api/game/load, POST /api/game/reset
**So that** I can export, import, and reset my game

### Acceptance Criteria
- [x] GET /api/game/save returns `{ saveVersion: 1, data: <serialized state> }` matching `SaveExportResponse`
- [x] POST /api/game/load with valid JSON replaces the server game state and returns the new state snapshot
- [x] POST /api/game/load with invalid JSON returns 400 with an error message
- [x] POST /api/game/reset resets to initial state and returns the new state
- [x] POST /api/game/reset with `{ hard: false }` performs a soft reset (preserves prestige)

---

## Story 6: SQLite persistence via Drizzle ORM

**As a** server operator
**I want** game state persisted to SQLite
**So that** state survives server restarts

### Acceptance Criteria
- [x] Given the server starts, the SQLite database is initialized (tables created if not exist)
- [x] Given the server processes a tick or action, the state is persisted to the `saves` table
- [x] Given the server restarts (cold start), the persisted state is loaded from SQLite on startup
- [x] The schema stores: id (PK), slot (text), state_json (text), updated_at (integer)

---

## Story 7: Session management

**As a** client
**I want** a session token issued on first connect
**So that** multiple clients can connect independently (future multi-client)

### Acceptance Criteria
- [x] Given no session cookie, when any API endpoint is hit, then a session cookie is set in the response
- [x] Given an existing session cookie, the server recognizes and reuses the session
- [x] Session ID is a random UUID stored in an in-memory map

---

## Story 8: WebSocket endpoint

**As a** client
**I want** to connect to WS /ws and receive state updates
**So that** the UI auto-updates without polling

### Acceptance Criteria
- [x] Given a client connects to WS /ws, then a `CONNECTED` envelope is sent with the session ID
- [x] Given a tick occurs (via POST /api/game/tick or auto-tick), then a `STATE_DELTA` envelope is broadcast to all connected WS clients
- [x] Given a client disconnects, the server removes it from the broadcast set
- [x] WS messages follow the envelope `{ type, payload, ts }` from api-spec

---

## Story 9: Auto-tick loop

**As a** player
**I want** the game to advance automatically every 200ms
**So that** I don't need to manually trigger ticks

### Acceptance Criteria
- [x] Given the server starts, an auto-tick loop fires every 200ms
- [x] Given each auto-tick, the game state is updated and all WS clients receive a STATE_DELTA
- [x] Given the server shuts down, the auto-tick loop is stopped cleanly

---

## Story 10: CORS middleware

**As a** web client running on a different port
**I want** CORS headers on all API responses
**So that** the browser doesn't block requests

### Acceptance Criteria
- [x] Given a request from any origin in development, CORS headers are set
- [x] `Access-Control-Allow-Origin: *` (or configured origin) is present on all /api/* responses

---

## Story 11: Integration test — full server round-trip

**As a** developer
**I want** an integration test that hits all endpoints end-to-end
**So that** regressions in the HTTP layer are caught

### Acceptance Criteria
- [x] Given a fresh server instance, the test: calls /api/health, /api/game/state, dispatches an action, calls /api/game/tick, exports save, imports save, resets — all assertions pass
- [x] Test uses in-memory SQLite (no file on disk)
