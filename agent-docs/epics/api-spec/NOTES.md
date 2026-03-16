# Epic 02: API Spec — Implementation Notes

## Legacy Behavior Summary

The legacy game has no HTTP API — it runs entirely in the browser with localStorage persistence. Key patterns relevant to the new API:

- **Save format**: `game.save()` (game.js:2393) returns a plain object with per-manager `save()` data. Top-level keys: `game`, `village`, `resPool`, `calendar`, `bld`, `science`, `workshop`, `religion`, `prestige`, `challenges`, `space`, `diplomacy`, `time`, `achievements`, `stats`, `telemetry`. The `saveVersion` integer (currently at version 13+) drives migration.
- **Reset**: `game.resetState()` (game.js:2317) re-initializes all manager state. The new `POST /api/game/reset` maps directly to this.
- **Actions**: The legacy `GamePage.update()` tick loop calls manager `update()` methods. Our `POST /api/game/action` generalizes this to a typed discriminated union.
- **No versioned API in legacy** — we are designing the contract from scratch, informed by legacy data shapes.

## Key Decisions

- **Zod-first**: all schemas defined as Zod validators; OpenAPI YAML is generated/annotated from them, not hand-authored
- **Envelope pattern for WS**: `{ type, payload, ts }` — type is a string literal, ts is Unix ms. This is consistent with legacy's dojo pub/sub pattern but typed.
- **`saveVersion` starts at 1** in our new format; legacy's version is unrelated (different schema)
- **Partial GameState deltas**: WS `STATE_DELTA` sends only changed fields, not the full state, to keep WS messages small

## Gotchas & Edge Cases

- Legacy `save()` uses `JSONreplacer` to handle Infinity values in resources — our save schema must handle `null | number` for resource amounts
- `saveVersion` in legacy starts from `undefined` → 1 for oldest saves; our new format always requires it
- The `POST /api/game/tick` endpoint is test-only — must be guarded in production or omitted from the prod OpenAPI spec

## Open Questions

- Should `POST /api/game/action` be a generic envelope or should each action type get its own endpoint? (Decision: generic envelope for now — simplest for the engine reducer pattern)
- Should the OpenAPI spec be generated from Zod (via `zod-to-openapi`) or hand-authored YAML? (Decision: hand-authored YAML for clarity, Zod schemas as the runtime validators)
