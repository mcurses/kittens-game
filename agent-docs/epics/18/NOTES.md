# Epic: 18 — Web Client Notes

## Legacy Behavior Summary

No legacy equivalent — the original Kittens Game was a single HTML file with jQuery/vanilla JS UI.
This is a fresh React 19 SPA that connects to the Epic 17 Hono server via REST + WebSocket.

## Architecture

- **No game logic in the client** — all state is owned by the server
- Client is purely: fetch state → render → send actions → re-render on STATE_DELTA
- WebSocket provides real-time push; REST provides initial load + action dispatch
- Session is implicit (no user accounts): WS CONNECTED envelope provides sessionId

## Tech Stack

- **Vite 6** — SPA build tool with @vitejs/plugin-react
- **React 19** — UI with hooks
- **TanStack Query v5** — server state caching (useQuery for GET /api/game/state, useMutation for POST /api/game/action)
- **Native WebSocket** — connect to ws://localhost:3000/ws on mount, update React state on STATE_DELTA

## API Contracts (from api-spec)

### HTTP
- GET  /api/health → { status: "ok", version: string }
- GET  /api/game/state → SerializedGameState
- POST /api/game/action → ActionResult { ok, error?, state }
- POST /api/game/tick → SerializedGameState
- GET  /api/game/save → { saveVersion, data }
- POST /api/game/load → SerializedGameState
- POST /api/game/reset → SerializedGameState

### WebSocket (ws://host/ws)
- On connect: server sends { type: "CONNECTED", payload: { sessionId, state }, ts }
- On tick/action: server broadcasts { type: "STATE_DELTA", payload: SerializedGameState, ts }

## Key Decisions

1. **WS as primary state update channel** — after initial query, STATE_DELTA updates replace polling
2. **TanStack Query used for initial load and action mutations** — WebSocket updates call `queryClient.setQueryData` directly to avoid refetch
3. **No Tailwind** — minimal inline styles / CSS modules to avoid adding a build dependency
4. **Vitest + happy-dom** — client tests run in happy-dom environment with mocked fetch and WebSocket
5. **No e2e tests** — unit-test hooks and components with mocked transport; e2e deferred

## Gotchas & Edge Cases

- `vite.config.ts` needs `@vitejs/plugin-react` for JSX transform
- `index.html` must exist at project root (not in src/) for Vite SPA
- WebSocket URL must be ws:// not http:// — derive from `window.location`
- `queryClient.setQueryData` from WS handler must be called with the exact same queryKey as `useQuery`
- On WS disconnect, client should attempt reconnect after delay (simple exponential backoff)
- Build for `pnpm turbo build` uses `vite build` (no typecheck in build script — typecheck is separate)
- Tests use `happy-dom` environment (set in vitest.config.ts) for DOM APIs

## Open Questions

- Should the WS reconnect be tested? Yes — mock WebSocket and verify reconnect behavior.
- Testing React components: use `@testing-library/react` or just test hooks with `renderHook`?
  → Use `renderHook` from `@testing-library/react` for hook tests; minimal component tests for rendering.
