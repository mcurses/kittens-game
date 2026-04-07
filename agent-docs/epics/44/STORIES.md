# Epic: 44 — Session Management

**Status:** Complete
**Priority:** P1
**Prerequisites:** 17 (server), 22 (multi-client)
**Scope:** Full lifecycle management for named save slots — creation, pause/resume, archive, delete, export — exposed via a REST API, a CLI package, and an admin panel in the web client.

---

## Story: DB metadata layer

**As a** server operator
**I want** each save slot to carry status and timestamp metadata in the database
**So that** the server can track lifecycle state and surface it to management tools without loading full game state

### Acceptance Criteria
- [x] `SqliteAdapter` interface gains four new methods:
  - `listSlotMeta()` → `SlotMeta[]` where `SlotMeta = { slot: string; status: 'active' | 'paused' | 'archived'; createdAt: number; updatedAt: number }`
  - `deleteSlot(slot)` — removes the row entirely
  - `updateSlotStatus(slot, status)` — sets status column without touching state_json
  - `getSlotMeta(slot)` → `SlotMeta | null`
- [x] `createBunAdapter` migrates (via `ALTER TABLE IF NOT EXISTS` pattern or `CREATE TABLE` update) the `saves` table to include `status TEXT NOT NULL DEFAULT 'active'` and `created_at INTEGER NOT NULL DEFAULT 0`; existing rows get `created_at = updated_at` on first access
- [x] `createMemoryAdapter` implements all four new methods correctly
- [x] `saveSlot` sets `created_at` on first insert, leaves it unchanged on upsert
- [x] Unit tests cover: listSlotMeta returns all rows, deleteSlot removes row, updateSlotStatus changes only status, getSlotMeta returns null for unknown slot
- [x] Bun SQLite startup migrates legacy `saves` tables that predate Epic 44 by adding missing `status` and `created_at` columns and backfilling `created_at = updated_at`

### Status: [x] Tests | [x] Impl | [ ] Rated

---

## Story: Session lifecycle actions in SessionRegistry

**As a** server
**I want** the SessionRegistry to own pause, resume, archive, delete, and explicit-create operations
**So that** all lifecycle transitions go through one authoritative place and auto-tick is always consistent with stored status

### Acceptance Criteria
- [x] `SessionRegistry.create(slot)` — validates slot name via `isValidSlot`, throws if slot already exists in DB, initializes a new store, starts auto-tick, persists with status `active`; returns the store
- [x] `SessionRegistry.pause(slot)` — throws if slot not found; stops auto-tick on the store, calls `db.updateSlotStatus(slot, 'paused')`; store remains in-memory for reads
- [x] `SessionRegistry.resume(slot)` — loads slot if not in memory, sets status `active`, restarts auto-tick
- [x] `SessionRegistry.archive(slot)` — stops auto-tick, calls `db.updateSlotStatus(slot, 'archived')`; evicts store from in-memory map; archived slots cannot be opened via `getOrCreate`
- [x] `SessionRegistry.delete(slot)` — stops auto-tick if running, calls `db.deleteSlot(slot)`, evicts from in-memory map
- [x] `SessionRegistry.listAll()` → `SlotMeta[]` — delegates to `db.listSlotMeta()`, returns all slots regardless of in-memory state
- [x] `SessionRegistry.export(slot)` → serialized state JSON string — loads slot (throws if archived or not found), calls `store.getSerialized()`, returns JSON without side effects
- [x] Server startup: only loads `active` slots into memory (skip `paused` and `archived`)
- [x] Unit tests cover all lifecycle transitions and error cases

### Status: [x] Tests | [x] Impl | [ ] Rated

---

## Story: REST API surface for session management

**As a** CLI tool or external operator
**I want** a set of REST endpoints for session lifecycle operations
**So that** I can manage sessions programmatically without touching the database directly

### Acceptance Criteria
- [x] `GET /api/sessions` — returns `{ sessions: SlotMeta[] }` for all slots
- [x] `POST /api/sessions` body `{ slot: string }` — creates a new session; 400 if name invalid; 409 if slot exists; 201 on success with `{ slot, status, createdAt, updatedAt }`
- [x] `GET /api/sessions/:slot` — returns `SlotMeta`; 404 if unknown
- [x] `DELETE /api/sessions/:slot` — deletes slot; 404 if unknown; 204 on success
- [x] `POST /api/sessions/:slot/pause` — pauses slot; 404 if unknown; 409 if already paused or archived; 200 on success
- [x] `POST /api/sessions/:slot/resume` — resumes slot; 404 if unknown; 409 if already active; 200 on success
- [x] `POST /api/sessions/:slot/archive` — archives slot; 404 if unknown; 409 if already archived; 200 on success
- [x] `GET /api/sessions/:slot/export` — streams state JSON as `Content-Disposition: attachment; filename="<slot>.json"`; 404 if not found; 409 if archived
- [x] All new routes are added to `packages/api-spec/openapi.yaml` with correct schemas, status codes, and descriptions
- [x] Integration tests (using `createMemoryAdapter`) cover happy path and each error case for every endpoint

### Status: [x] Tests | [x] Impl | [ ] Rated

---

## Story: CLI package

**As a** server operator
**I want** a `kittens` CLI I can run from the terminal to manage sessions
**So that** I can operate the server without opening a browser

### Acceptance Criteria
- [x] New package `packages/cli` with `bin/kittens.ts` entry point, registered in `package.json` `bin` field
- [x] Runs via `bun packages/cli/bin/kittens.ts` or `bun run cli` from repo root
- [x] Uses `commander` (or equivalent) for subcommand parsing; `--server <url>` flag (default `http://localhost:3000`) for all commands
- [x] Commands and expected output:
  - `sessions list` — prints a table: slot | status (colored symbol) | created | updated | (active slots show ● green, paused ⏸ yellow, archived ▪ gray)
  - `sessions create <slot>` — creates session, prints confirmation or error
  - `sessions pause <slot>` — pauses, prints confirmation
  - `sessions resume <slot>` — resumes, prints confirmation
  - `sessions archive <slot>` — archives with `--confirm` flag required; prints confirmation
  - `sessions delete <slot>` — deletes with `--confirm` flag required; prints confirmation
  - `sessions export <slot> [--output <file>]` — writes state JSON to file (default `<slot>.json` in cwd); prints bytes written
- [x] `--json` flag on `sessions list` outputs raw JSON array for scripting
- [x] Exits with code 1 and prints error to stderr on any server error or validation failure
- [x] Unit tests cover argument parsing and output formatting using a mock HTTP client

### Status: [x] Tests | [x] Impl | [ ] Rated

---

## Story: Admin sessions panel in web client

**As a** player/operator
**I want** a Sessions tab in the web client that lists all saves and lets me manage them
**So that** I can create, open, pause, archive, delete, and export sessions without leaving the browser

### Acceptance Criteria
- [x] New `SessionsPanel` component rendered as a top-level tab (tab label: "Sessions") visible when no slot is loaded or accessible from the header
- [x] Panel shows a table with columns: **Name** | **Status** | **Last Saved** | **Actions**
- [x] Status column uses compact inline symbols: `●` active (green), `⏸` paused (amber), `▪` archived (gray) — no text labels (feedback: prefer color/symbol over text labels)
- [x] **Actions** column per row:
  - Active: Open (navigates to `?slot=<name>`), Pause, Archive, Export, Delete
  - Paused: Open (read-only note), Resume, Archive, Export, Delete
  - Archived: Export, Delete (no open/pause/resume)
- [x] **Create New** button opens an inline input; validates slot name client-side (`^[a-zA-Z0-9_-]{1,64}$`); calls `POST /api/sessions`; refreshes list on success
- [x] Export action triggers a file download via `GET /api/sessions/:slot/export`
- [x] Delete and Archive show an inline confirmation (not a browser dialog) before proceeding
- [x] List auto-refreshes via TanStack Query (polling every 5s or on focus); no WebSocket needed for this panel
- [x] Panel is accessible from the header when `?slot` is set (e.g., a "Manage Sessions" link)
- [x] Direct navigation to `/sessions` renders the sessions panel without attempting to load game state or open a WebSocket
- [x] Sessions panel **Open** action navigates to `/?slot=<name>` so opening from `/sessions` returns to the game view
- [x] Status column shows both the legacy symbol and an explicit text label (`Active`, `Paused`, `Archived`) so state is understandable even if the symbol is visually subtle
- [x] Archive confirmation explains the behavior: the session is frozen, removed from openable sessions, and still deletable later
- [x] Sessions list defaults to status-priority sorting: `active` first, then `paused`, then `archived`; ties break by most-recent `updatedAt`
- [x] Archived sessions are hidden by default behind a `Show archived` checkbox in the panel

### Notes
- 2026-04-07: Reopened after Chrome verification showed live `/api/sessions` responses returning placeholder strings because the real `packages/server/kittens.db` still had the pre-Epic-44 schema with no `status` or `created_at` columns.
- 2026-04-07: Reopened after discovering the panel component shipped without any actual route or shell integration. The follow-up closes the route wiring gap by mounting the panel at `/sessions` and making the panel's open action return to the game root with a slot query.
- 2026-04-07: Reopened again after usability feedback that the status column looked empty and archive semantics were unclear in the browser UI.
- 2026-04-07: Reopened again for sessions table behavior so active work floats to the top and archived sessions are opt-in.

### Status: [x] Tests | [x] Impl | [ ] Rated

---

## Story: Paused session read-only enforcement

**As a** server
**I want** paused sessions to block game actions but still serve reads
**So that** a paused game is frozen in time while still being inspectable

### Acceptance Criteria
- [x] `POST /api/game/action` with a paused slot returns 409 `{ error: 'session is paused' }`
- [x] `GET /api/game/state` with a paused slot returns 200 with current state (reads allowed)
- [x] WebSocket clients connecting to a paused slot receive an initial `CONNECTED` message but no `STATE_DELTA` ticks
- [x] Resuming via `POST /api/sessions/:slot/resume` restarts auto-tick; subsequent ticks broadcast normally
- [x] Tests cover: action rejected when paused, state readable when paused, tick restarts after resume

### Status: [x] Tests | [x] Impl | [ ] Rated
