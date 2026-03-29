# Epic: 22

**Status:** Complete
**Started:** 2026-03-29
**Finished:** 2026-03-29
**Legacy refs:** N/A (new infrastructure, no legacy equivalent)

---

## Story 1: SessionRegistry — multi-slot store management

**As a** server
**I want** to maintain independent GameStateStore instances per save slot
**So that** multiple players can run separate games on the same server without interference

### Acceptance Criteria
- [x] Given a `SessionRegistry` with a `SqliteAdapter`, when `getOrCreate("slot1")` is called twice, then the same `GameStateStore` instance is returned both times
- [x] Given two different slot names "a" and "b", when `getOrCreate` is called for each, then they return distinct store instances
- [x] Given a registry, when `listSlots()` is called, then it returns the names of all currently active slots
- [x] Given a `GameStateStore` constructed with a custom slot name, when it persists, then it writes to that named slot in the DB (not "default")
- [x] Given a `GameStateStore` with slot "custom", when `init()` is called and a save exists, then it loads from the correct slot

### Legacy Reference
- N/A — new feature

### Status: [x] Tests | [x] Impl | [x] Rated

---

## Story 2: HTTP routes accept slot query parameter

**As a** HTTP client
**I want** to pass `?slot=<name>` on any game API request
**So that** I can target a specific game session's state

### Acceptance Criteria
- [x] Given `GET /api/game/state?slot=test`, when the "test" slot has state X, then the response returns X
- [x] Given `GET /api/game/state` (no slot param), when called, then it defaults to slot "default"
- [x] Given `POST /api/game/action?slot=test`, when sent, then the action is applied to the "test" slot's store
- [x] Given `POST /api/game/tick?slot=test`, when called, then only the "test" slot advances
- [x] Given `POST /api/game/reset?slot=test`, when called, then only the "test" slot is reset
- [x] Given a slot name with invalid characters (e.g., `../../etc`), when sent, then the server returns 400

### Legacy Reference
- N/A — new feature

### Status: [x] Tests | [x] Impl | [x] Rated

---

## Story 3: WebSocket connects to specific slot

**As a** WebSocket client
**I want** to connect to `/ws?slot=<name>` and receive state updates for that slot only
**So that** two browser tabs on different slots don't interfere with each other

### Acceptance Criteria
- [x] Given a WS connection to `/ws?slot=abc`, when the "abc" slot's state changes, then this client receives the `STATE_DELTA`
- [x] Given a WS connection to `/ws?slot=abc`, when the "xyz" slot's state changes, then this client does NOT receive the broadcast
- [x] Given a WS connection with no slot param, when connected, then it is assigned to slot "default"
- [x] Given a WS connect to a slot, when `CONNECTED` is sent, then the payload includes the correct slot name
- [x] Given multiple WS clients on the same slot, when one triggers a state change, then all clients on that slot receive `STATE_DELTA`

### Legacy Reference
- N/A — new feature

### Status: [x] Tests | [x] Impl | [x] Rated

---

## Story 4: WS action dispatch

**As a** WebSocket client
**I want** to send game actions over the WebSocket connection
**So that** I get immediate state updates without an HTTP round-trip

### Acceptance Criteria
- [x] Given a WS client sends `{ type: "ACTION", payload: { type: "GATHER" } }`, then the server processes the action and broadcasts `STATE_DELTA` to all slot clients
- [x] Given a WS client sends an invalid action payload, then the server sends back `{ type: "ACTION_ERROR", payload: { error: "..." } }` to that client only
- [x] Given a WS client sends a valid action, then the action is applied to the same slot the WS is connected to
- [x] Given a WS `ACTION` message, when processed successfully, then `ACTION_RESULT` is sent back with `{ ok: true, state: ... }`

### Legacy Reference
- N/A — new feature

### Status: [x] Tests | [x] Impl | [x] Rated

---

## Story 5: Client slot selection from URL

**As a** player
**I want** my browser's game client to use a slot specified in the URL
**So that** I can bookmark different game sessions or share a specific save

### Acceptance Criteria
- [x] Given the URL is `/?slot=mysave`, when the client initializes, then it fetches state from `?slot=mysave` and connects WS to `/ws?slot=mysave`
- [x] Given the URL has no slot param, when the client initializes, then it uses slot "default"
- [x] Given the slot changes (URL param update), when hooks re-run, then the new slot's state is fetched
- [x] Given a WS action is dispatched via the hook, when the client has slot "mysave", then the action is sent over the WS for that slot

### Legacy Reference
- N/A — new feature

### Status: [x] Tests | [x] Impl | [x] Rated

---

## Story 6: Slot name validation

**As a** server
**I want** to reject invalid slot names early
**So that** I don't create stores with unsafe or ambiguous names

### Acceptance Criteria
- [x] Given a slot name matching `/^[a-zA-Z0-9_-]{1,64}$/`, it is accepted
- [x] Given a slot name with `/`, `.`, or spaces, it is rejected with a clear error
- [x] Given an empty slot name `""`, it is rejected
- [x] Given a slot name over 64 characters, it is rejected
- [x] Given the validation function `isValidSlot(name)`, it is a pure function with no side effects

### Legacy Reference
- N/A — new feature

### Status: [x] Tests | [x] Impl | [x] Rated
