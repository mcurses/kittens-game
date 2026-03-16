# Architecture Decision Records

---

## ADR-001: Tech Stack Selection
**Date:** 2026-03-16
**Status:** Accepted

### Context
Need to choose a modern stack for a faithful rewrite of Kittens Game (legacy: ES5, Dojo, jQuery, no modules).

### Decision
| Layer | Choice | Rationale |
|-------|--------|-----------|
| Language | TypeScript 5.x strict | Safety, inference, modern ergonomics |
| Runtime | Bun | Fast, built-in TS execution, native SQLite |
| HTTP server | Hono | Tiny, typed, edge-ready |
| WebSocket | Bun native WS | Real-time state push |
| Game state DB | SQLite via Drizzle ORM | Embedded, easy backup/export |
| Testing | Vitest | Fast, ESM-native, Jest-compatible, coverage built-in |
| API spec | OpenAPI 3.1 + zod-openapi | Contract-first, generates TS types |
| Monorepo | Turborepo + pnpm | Incremental builds, isolated packages |
| Frontend | React 19 + TanStack Query | Live state sync |
| Styling | Tailwind CSS | Low-overhead |
| Linting | Biome | Unified lint + format, fast |

### Consequences
- Bun is the runtime for server; Vitest (not Bun test) for testing DX
- client-web uses Vite for bundling (Bun bundler not mature enough for React SPA)

---

## ADR-002: Engine Purity Invariant
**Date:** 2026-03-16
**Status:** Accepted

### Context
The legacy codebase mixes game logic with DOM manipulation and global state, making it untestable.

### Decision
`packages/engine` is a pure function: `(state, action) => newState`. Zero I/O, zero side effects, zero knowledge of HTTP or DOM. The server owns the event loop and persistence.

### Consequences
- Engine is 100% unit-testable without mocks
- All side effects (persistence, WebSocket broadcast) live in the server layer
- Clients are thin renderers — no game logic on the client
