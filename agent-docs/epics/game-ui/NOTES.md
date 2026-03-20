# Epic 20: Game UI — Implementation Notes

## Overview

Build a functional game UI that mirrors the Kittens Game layout:
- Left column: Resources (always visible, scrollable)
- Center: Tab panels (Buildings, Jobs, Science, Workshop, etc.)
- Right column: Log + Calendar header

## Legacy Reference

`legacy/index.html` — The core layout uses a 3-column flexbox structure:
- `#leftColumn` — resource list (ul#resources)
- `#midColumn` — tab bar + tab panels
- `#rightColumn` — calendar, game log

## Architecture Decisions

### State Access
All panels receive the `GameStateResponse` from `useGameState()` hook in `GameView`.
No prop-drilling beyond `GameView` → panels. Each panel receives only what it needs.

### Action Dispatch
Use `useGameAction()` hook (already exists) for all player actions.
Pattern: `const { mutate } = useGameAction(); mutate({ type: "BUY_BUILDING", building: id })`

### Tab State
Local React `useState` in `GameView` or a new `TabContainer` component.
No server-side routing needed — purely client-side tab switching.

### Log Panel
WS messages of type `LOG_MESSAGE` need to be handled. Check `useWebSocket.ts` to see if
message routing already exists. If not, add a `onMessage` callback to the hook.

### Calendar
`GameStateResponse` includes `season`, `year`, `day` from the calendar module.
Check that these fields are present in the state serialization.

## Duck-Typing Pattern

The current `ResourcePanel` uses duck-typing (cast to `Record<string, unknown>`) due to
`GameStateResponse` being opaque. The same approach applies to all new panels.
Prefer typed access when fields are known to be in the spec.

## Test Approach

Each panel gets a `*.test.tsx` file with:
1. Loading state (null/undefined state)
2. Empty state (no items)
3. Items rendered correctly
4. Button click dispatches correct action (mock `useGameAction`)

Use `@testing-library/react` + `vitest` consistent with existing test files.

## Deferred

- Log panel WS integration (Story 20-5) may require server-side changes; scope carefully
- Rich CSS/Tailwind styling — functional first, style second
- Mobile responsive layout
