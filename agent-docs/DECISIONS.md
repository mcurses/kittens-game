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

## ADR-003: Manager Interface Design
**Date:** 2026-03-16
**Status:** Accepted

### Context
Legacy managers (TabManager subclasses) hold a `this.game` reference and mutate shared state. Need a pattern for the new engine that is both testable and composition-friendly.

### Decision
Each manager implements a pure `Manager` interface: `update(state) => state`, `updateEffects(state) => Record<string,number>`, `save/load/resetState`. No `this.game` pointers — state flows in and out. The engine calls managers in registration order; each sees the previous manager's output.

### Consequences
- Managers are trivially unit-testable (no game instance needed)
- Update order is explicit and deterministic (registration order = call order)
- Effect cache is rebuilt from scratch each tick (simple, correct; can optimize later)
- Divergence from legacy: DR is applied to the *summed* total across managers, not per-manager. This matches the *intended* legacy behavior per game.js comment line 140–146.

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

---

## ADR-003: Challenge noStack semantics
**Date:** 2026-03-19
**Status:** Accepted

### Context
Legacy challenges.js `getEffect()` (lines 14–16) shows that when `stackOptions.noStack` is true, the function immediately returns the base amount with NO further modifications — LDRLimit is NOT applied even if specified alongside noStack.

### Decision
`getChallengeEffectValue()` in challenges.ts mirrors this exactly: if `noStack` is set, return `baseAmount` directly. The `LDRLimit` field in stackOptions is only meaningful alongside noStack as documentation of the intended cap for the separate stacked path (e.g., `kittenLaziness` has `{ LDRLimit: 0.25, noStack: true }` but the LDR is applied dynamically in the active-effects special case, not via the generic stacking function).

### Consequences
- Faithful parity with legacy: `noStack` really means "use the value as-is"
- The anarchy `kittenLaziness` active computation is a one-off special case (not governed by the generic noStack path)

---

## ADR-004: One-tick effect lag is accepted for now

**Date:** 2026-03-19
**Status:** Accepted

The effectCache is rebuilt after all manager updates complete. This means manager update() calls read last tick's effectCache. In the legacy, effects were computed in manager order within the same tick, so a later manager could see a fresh effect from an earlier one.

**Why accepted:** The lag is invisible for static effects (buildings, upgrades don't change tick-to-tick). It only matters for cross-system dynamic effects, whose full dependency graph is not yet known. Fixing this requires explicit dependency ordering between managers — better done at Epic 22 (Feature Parity Audit) when the full graph is visible.

**Risk:** Subtle one-tick divergence in cross-system effect chains. Watch for this in Space/Time/Diplomacy epics.
