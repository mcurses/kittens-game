# Kittens Game Rewrite — Agent Rules

Faithful rewrite of [Kittens Game](https://kittensgame.com) in TypeScript. Engine is pure `(state, action) => newState` with zero I/O. Server (Hono/Bun) owns persistence and WS broadcast. Clients are thin renderers. Legacy code in `legacy/` is read-only reference.

Key docs: `agent-docs/EPICS.md` (backlog + status), `agent-docs/PARITY.md` (coverage tracker), `agent-docs/LEGACY_REFERENCE.md` (legacy file map). Skills: `/epic-start`, `/self-rate`, `/queue-epics`, `/sanity-check`, `/sync-docs`.

---

## Epic-First Workflow (mandatory)

Every substantive change must belong to an epic with story-level acceptance criteria. Start work with `/epic-start <N>` or explicitly reopen an existing epic (update STORIES.md, EPICS.md, PROGRESS.md) before touching production code.

- No "I just fixed a small parity issue while I was there" without it being documented in an active epic first.
- Retroactive filing is a process failure. The only exceptions are trivial doc-only edits or non-gameplay housekeeping explicitly requested by the user.

## TDD (mandatory)

Write failing Vitest tests first → implement minimum code to pass → `pnpm turbo build` → commit. Never write production code without test coverage. Commits: `<type>(<scope>): <summary>` (types: feat/fix/test/refactor/docs/chore; scopes: engine/server/client/api-spec/agent-docs).

## Parity Verification Standard (mandatory)

A feature reaches `✅` parity only when ALL of these are true:

- **Legacy source identified** — exact `legacy/js/` or `legacy/test/` references recorded
- **Producer wired** — engine creates the effect/state/behavior
- **Consumer wired** — effect is actually consumed in runtime logic
- **Action surface wired** — legacy controls/actions exist in `GameAction`, API spec, server, client
- **UI surface wired** — player can see and operate the feature where legacy allows
- **Save/load wired** — state survives serialization, reset, and legacy import
- **Parity-tested** — at least one test proves the feature against legacy behavior

If any is missing, the tracker stays `⚠️` or `❌`. Never flatten a partial port into `✅`.

## Live Parity Audit Gate (mandatory)

Before marking any epic complete:

1. Audit against legacy code and a representative imported or synthetic save.
2. Check actual player-facing behavior, not just effect definitions.
3. Record every deferred behavior explicitly in `agent-docs/PARITY.md` and epic notes.
4. Block epic completion if any row still claims `✅` while significant legacy behavior is deferred.

## Production / Control Audit

Whenever porting a building, upgrade, job, automation, or UI control, answer in notes or tests:

1. What exact legacy outputs, consumption, and side effects does it have?
2. Where is each output consumed in the rewrite?
3. What controls does legacy expose (`on/off`, rename, quantity, automation, done-state)?
4. What fixture or regression test proves parity?

If any answer is missing, the feature is partial by default.

---

## Non-Negotiables

- No `any` types in production code
- No skipped tests without a linked issue
- No production code without a test
- `pnpm turbo build` must pass after every story
- `legacy/test/` must be read before writing stories for any domain it covers
- Each epic must include a cross-manager integration test for the full tick loop
- New `GameAction` types are added to `packages/api-spec/openapi.yaml` in the same epic — never deferred
- `agent-docs/PROGRESS.md` updated at end of every work session
- `agent-docs/EPICS.md` status updated when an epic completes
- `agent-docs/PARITY.md` updated whenever a building, effect key, or resource path is added
- Never mark a PARITY row `✅` unless producer, consumer, action/control surface, and a parity test all exist
- Every parity-sensitive epic needs at least one live-save or legacy-derived regression test
- If a legacy feature has controls, parity is not complete until those controls exist or PARITY says they are missing
- Every new building/upgrade must wire both halves in the same commit: the def that produces the effectCache key AND the manager code that consumes it
- Legacy code is **read-only** — never modify it
