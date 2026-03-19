# Epic: 18 — Web Client

**Status:** Complete
**Started:** 2026-03-19
**Legacy refs:** None (greenfield SPA)

---

## Story 1: Vite + React 19 project scaffold

**As a** developer
**I want** a working Vite SPA entry point with React 19
**So that** the client-web package builds successfully

### Acceptance Criteria
- [x] `packages/client-web/index.html` exists with `<div id="root">` and module script entry
- [x] `packages/client-web/vite.config.ts` exists with `@vitejs/plugin-react` plugin
- [x] `packages/client-web/vitest.config.ts` exists with `happy-dom` environment
- [x] `pnpm turbo build --filter=@kittens/client-web` passes
- [x] `src/main.tsx` mounts an `<App />` component into `#root`

### Status: [x] Tests | [x] Impl | [x] Rated

---

## Story 2: API client module

**As a** client component
**I want** typed fetch functions for all server endpoints
**So that** hooks can call them without duplicating fetch logic

### Acceptance Criteria
- [x] Given `GET /api/health`, when called, then returns `{ status: "ok", version: string }`
- [x] Given `GET /api/game/state`, when called, then returns serialized game state
- [x] Given `POST /api/game/action` with action body, when called, then returns `ActionResult`
- [x] Given `GET /api/game/save`, when called, then returns save export
- [x] Given `POST /api/game/load` with save data, when called, then returns game state
- [x] Given `POST /api/game/reset` with optional `{ hard }`, when called, then returns game state
- [x] All functions are typed using `@kittens/api-spec` schemas
- [x] Tests mock `fetch` and verify correct URL, method, and body

### Status: [x] Tests | [x] Impl | [x] Rated

---

## Story 3: useGameState hook (TanStack Query)

**As a** React component
**I want** a `useGameState()` hook that fetches and caches game state
**So that** components can read the live game state without managing fetch lifecycle

### Acceptance Criteria
- [x] Given the hook is mounted, when the query succeeds, then `data` is the game state
- [x] Given the hook is mounted, when the query is pending, then `isPending` is true
- [x] Given the hook is mounted, when the query errors, then `error` is set
- [x] The hook uses `queryKey: ['gameState']`
- [x] `staleTime` is 0 (always refetch in background but serve cached immediately)
- [x] Tests use `renderHook` + mocked `fetch`

### Status: [x] Tests | [x] Impl | [x] Rated

---

## Story 4: useGameAction hook (useMutation)

**As a** React component
**I want** a `useGameAction()` hook that sends actions to the server
**So that** UI controls can trigger game actions with loading/error state

### Acceptance Criteria
- [x] Given `mutate({ type: "GATHER_CATNIP" })`, when called, then POST /api/game/action is called
- [x] Given action succeeds, when `onSuccess` fires, then `queryClient.setQueryData(['gameState'], result.state)` is called
- [x] Given action fails (ok: false), when mutation resolves, then `error` contains the message
- [x] Tests use `renderHook` + mocked fetch + wrapped in `QueryClientProvider`

### Status: [x] Tests | [x] Impl | [x] Rated

---

## Story 5: useWebSocket hook

**As a** React component
**I want** a `useWebSocket(url)` hook that connects to the server WS and updates query cache on STATE_DELTA
**So that** the UI updates in real-time without polling

### Acceptance Criteria
- [x] Given the hook is mounted, when WS sends CONNECTED envelope, then sessionId is stored in hook state
- [x] Given the hook is mounted, when WS sends STATE_DELTA envelope, then `queryClient.setQueryData(['gameState'], payload)` is called
- [x] Given WS connection closes, when `onclose` fires, then hook schedules reconnect after 2s
- [x] Given the hook unmounts, when cleanup runs, then the WebSocket is closed
- [x] Tests mock `WebSocket` globally and verify message dispatch and reconnect logic

### Status: [x] Tests | [x] Impl | [x] Rated

---

## Story 6: ResourcePanel component

**As a** player
**I want** to see all resources and their per-tick rates
**So that** I can monitor my economy

### Acceptance Criteria
- [x] Given game state with resources, when rendered, then each resource name and value is displayed
- [x] Given a resource has a non-zero perTick, when rendered, then the rate (e.g. "+1.23/tick") is shown
- [x] Given the component receives null/undefined state, when rendered, then it shows a loading placeholder
- [x] Tests render the component with mock state and assert text content

### Status: [x] Tests | [x] Impl | [x] Rated

---

## Story 7: ActionPanel component

**As a** player
**I want** to trigger game actions (gather catnip, buy buildings, etc.)
**So that** I can interact with the game

### Acceptance Criteria
- [x] Given the ActionPanel renders, when "Gather Catnip" button is clicked, then `mutate({ type: "GATHER_CATNIP" })` is called
- [x] Given a mutation is pending, when button is displayed, then it is disabled
- [x] Given a mutation error occurs, when displayed, then error message is shown
- [x] Tests render ActionPanel with mocked `useGameAction` and assert button behavior

### Status: [x] Tests | [x] Impl | [x] Rated

---

## Story 8: App root — wiring QueryClient + WebSocket

**As a** player
**I want** the app to boot with QueryClient and WS connected
**So that** all components have access to server state

### Acceptance Criteria
- [x] Given `<App />` renders, then `QueryClientProvider` wraps the tree
- [x] Given `<App />` renders, then `useWebSocket` is called with the correct WS URL
- [x] Given `<App />` renders, then `<ResourcePanel>` and `<ActionPanel>` are rendered
- [x] Tests render `<App />` with mocked `fetch` and mocked `WebSocket` and assert panels are present

### Status: [x] Tests | [x] Impl | [x] Rated
