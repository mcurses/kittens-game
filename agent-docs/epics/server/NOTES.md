# Epic 17: Server — Implementation Notes

## Tech choices

- **Runtime**: Bun (native WS, fast SQLite, TS-native)
- **HTTP**: Hono v4 — `upgradeWebSocket`/`websocket` from `hono/bun`
- **DB**: Drizzle ORM with `drizzle-orm/bun-sqlite` + `bun:sqlite`
- **Testing**: Vitest with in-memory SQLite (no disk file created during tests)

## Key design decisions

### State ownership
A single `GameStateStore` class owns the authoritative `GameState`. All HTTP and WS handlers read/write through it. No direct state mutations outside the store.

### Persistence strategy
After every tick and action, the store calls `db.update(...).set({ stateJson, updatedAt })`. The save slot is `"default"`. On cold start, the store loads from SQLite; if no row exists, it calls `createInitialState()`.

### WS broadcast
The store maintains a `Set<WSContext>` of connected clients. After each state mutation, `broadcastDelta()` sends `{ type: "STATE_DELTA", payload: serialized, ts: Date.now() }` to all clients in the set.

### Session management
Simple: a crypto.randomUUID() per connection stored in memory. Cookie name: `kittens-session`. Not persisted to DB (out of scope for Epic 17 single-client).

### Auto-tick interval
200ms via `setInterval`. Stored as a module-level reference so it can be cleaned up in tests. The server entry point (`index.ts`) starts the loop; tests instantiate the app without starting the loop.

### GameStateResponse vs SerializedGameState
The api-spec `GameStateResponse` is minimal (`{ version, tick }`). The full serialized state returned by the engine is a `SerializedGameState`. For now, we return the full serialized state object from the engine's `serialize()` and validate it passes as `Record<string, unknown>`. The client will receive the full state, not just the sparse schema. The spec is updated to reflect this.

### Test approach
- Use Hono's `.request()` method for HTTP integration tests (no network, pure in-process)
- Pass `new Database(":memory:")` to the store in tests
- Disable auto-tick in tests (pass `{ autoTick: false }` to app factory)

## Known deferred features

- Multi-save slots (Epic 19)
- Per-user auth beyond session cookie (Epic 19)
- RNG seeding per session (Diplomacy trade uses deterministic model for now)
- WS action dispatch from client (clients can also send actions over WS — deferred to Epic 19)
