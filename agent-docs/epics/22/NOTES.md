# Epic: 22 — Notes

## Legacy Behavior Summary

There is no legacy code for multi-client. The original Kittens Game is entirely single-player,
running in a single browser tab. All multi-client infrastructure is new work for this rewrite.

## Current Architecture (as of 2026-03-29)

- `GameStateStore` holds one game state (the "default" slot).
- `db.ts` already supports multiple save slots via `loadSlot(slot)` / `saveSlot(slot, json)`.
- WebSocket connections already generate a `sessionId` UUID per connection.
- All WS clients share the single store's state broadcasts.
- HTTP routes always target `DEFAULT_SLOT = "default"`.

## Design Decisions

### SessionRegistry (new)
A `Map<string, GameStateStore>` managed at server level. When a client requests slot "abc",
the registry creates or returns the existing store. Each store has its own:
- auto-tick interval
- WS client set
- DB slot persistence

### Slot selection
- WS: `/ws?slot=<name>` — query param picked up in upgradeWebSocket handler
- HTTP: all `/api/game/*` routes accept `?slot=<name>`, default "default"
- Client: reads slot from URL search param `?slot=<name>`, falls back to "default"

### Optimistic UI
The client already gets state updates via WS (`STATE_DELTA`). The "optimistic" part is:
- WS action dispatch: client sends `{ type: "ACTION", payload: ... }` over WS
- Server processes immediately and broadcasts `STATE_DELTA` back on the same socket
- Client's WS handler updates the TanStack Query cache → UI reacts without HTTP round-trip
- The existing HTTP `/api/game/action` stays as fallback for non-WS clients

## Gotchas & Edge Cases

- Store cleanup: if all clients disconnect from a slot, we keep the store alive (in-memory cache).
  Idle stores are cheap (no auto-tick if paused). A future epic can add TTL cleanup.
- `DEFAULT_SLOT` constant in store.ts — needs to move to the app layer or be parameterised.
- Multiple stores each have their own setInterval for auto-tick — need to ensure they don't
  all try to write the same DB slot.

## Open Questions

- Q: Should each slot have its own auto-tick, or is there one global tick?
  A: Each slot = independent game = own auto-tick. This is correct for session isolation.
- Q: What happens if `slot` param contains path-traversal chars?
  A: Sanitize slot name (alphanumeric + dash + underscore only).
