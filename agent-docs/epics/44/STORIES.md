# Epic: 44 — Session Management

**Status:** Not Started
**Priority:** P1
**Prerequisites:** 17 (server), 22 (multi-client)
**Scope:** Full lifecycle management for named save slots — creation, pause/resume, archive, delete, export — exposed via a REST API, a CLI package, and an admin panel in the web client.

---

## Story: DB metadata layer

**As a** server operator
**I want** each save slot to carry status and timestamp metadata in the database
**So that** the server can track lifecycle state and surface it to management tools without loading full game state

### Acceptance Criteria
- [ ] `SqliteAdapter` interface gains four new methods:
  - `listSlotMeta()` → `SlotMeta[]` where `SlotMeta = { slot: string; status: 'active' | 'paused' | 'archived'; createdAt: number; updatedAt: number }`
  - `deleteSlot(slot)` — removes the row entirely
  - `updateSlotStatus(slot, status)` — sets status column without touching state_json
  - `getSlotMeta(slot)` → `SlotMeta | null`
- [ ] `createBunAdapter` migrates (via `ALTER TABLE IF NOT EXISTS` pattern or `CREATE TABLE` update) the `saves` table to include `status TEXT NOT NULL DEFAULT 'active'` and `created_at INTEGER NOT NULL DEFAULT 0`; existing rows get `created_at = updated_at` on first access
- [ ] `createMemoryAdapter` implements all four new methods correctly
- [ ] `saveSlot` sets `created_at` on first insert, leaves it unchanged on upsert
- [x] Unit tests cover: listSlotMeta returns all rows, deleteSlot removes row, updateSlotStatus changes only status, getSlotMeta returns null for unknown slot

### Status: [x] Tests | [x] Impl | [ ] Rated

---

## Story: Session lifecycle actions in SessionRegistry

**As a** server
**I want** the SessionRegistry to own pause, resume, archive, delete, and explicit-create operations
**So that** all lifecycle transitions go through one authoritative place and auto-tick is always consistent with stored status

### Acceptance Criteria
- [ ] `SessionRegistry.create(slot)` — validates slot name via `isValidSlot`, throws if slot already exists in DB, initializes a new store, starts auto-tick, persists with status `active`; returns the store
- [ ] `SessionRegistry.pause(slot)` — throws if slot not found; stops auto-tick on the store, calls `db.updateSlotStatus(slot, 'paused')`; store remains in-memory for reads
- [ ] `SessionRegistry.resume(slot)` — loads slot if not in memory, sets status `active`, restarts auto-tick
- [ ] `SessionRegistry.archive(slot)` — stops auto-tick, calls `db.updateSlotStatus(slot, 'archived')`; evicts store from in-memory map; archived slots cannot be opened via `getOrCreate`
- [ ] `SessionRegistry.delete(slot)` — stops auto-tick if running, calls `db.deleteSlot(slot)`, evicts from in-memory map
- [ ] `SessionRegistry.listAll()` → `SlotMeta[]` — delegates to `db.listSlotMeta()`, returns all slots regardless of in-memory state
- [ ] `SessionRegistry.export(slot)` → serialized state JSON string — loads slot (throws if archived or not found), calls `store.getSerialized()`, returns JSON without side effects
- [ ] Server startup: only loads `active` slots into memory (skip `paused` and `archived`)
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
- [ ] All new routes are added to `packages/api-spec/openapi.yaml` with correct schemas, status codes, and descriptions
- [x] Integration tests (using `createMemoryAdapter`) cover happy path and each error case for every endpoint

### Status: [x] Tests | [x] Impl | [ ] Rated

---

## Story: CLI package

**As a** server operator
**I want** a `kittens` CLI I can run from the terminal to manage sessions
**So that** I can operate the server without opening a browser

### Acceptance Criteria
- [ ] New package `packages/cli` with `bin/kittens.ts` entry point, registered in `package.json` `bin` field
- [ ] Runs via `bun packages/cli/bin/kittens.ts` or `bun run cli` from repo root
- [ ] Uses `commander` (or equivalent) for subcommand parsing; `--server <url>` flag (default `http://localhost:3000`) for all commands
- [ ] Commands and expected output:
  - `sessions list` — prints a table: slot | status (colored symbol) | created | updated | (active slots show ● green, paused ⏸ yellow, archived ▪ gray)
  - `sessions create <slot>` — creates session, prints confirmation or error
  - `sessions pause <slot>` — pauses, prints confirmation
  - `sessions resume <slot>` — resumes, prints confirmation
  - `sessions archive <slot>` — archives with `--confirm` flag required; prints confirmation
  - `sessions delete <slot>` — deletes with `--confirm` flag required; prints confirmation
  - `sessions export <slot> [--output <file>]` — writes state JSON to file (default `<slot>.json` in cwd); prints bytes written
- [ ] `--json` flag on `sessions list` outputs raw JSON array for scripting
- [ ] Exits with code 1 and prints error to stderr on any server error or validation failure
- [ ] Unit tests cover argument parsing and output formatting using a mock HTTP client

### Status: [ ] Tests | [ ] Impl | [ ] Rated

---

## Story: Admin sessions panel in web client

**As a** player/operator
**I want** a Sessions tab in the web client that lists all saves and lets me manage them
**So that** I can create, open, pause, archive, delete, and export sessions without leaving the browser

### Acceptance Criteria
- [ ] New `SessionsPanel` component rendered as a top-level tab (tab label: "Sessions") visible when no slot is loaded or accessible from the header
- [ ] Panel shows a table with columns: **Name** | **Status** | **Last Saved** | **Actions**
- [ ] Status column uses compact inline symbols: `●` active (green), `⏸` paused (amber), `▪` archived (gray) — no text labels (feedback: prefer color/symbol over text labels)
- [ ] **Actions** column per row:
  - Active: Open (navigates to `?slot=<name>`), Pause, Archive, Export, Delete
  - Paused: Open (read-only note), Resume, Archive, Export, Delete
  - Archived: Export, Delete (no open/pause/resume)
- [ ] **Create New** button opens an inline input; validates slot name client-side (`^[a-zA-Z0-9_-]{1,64}$`); calls `POST /api/sessions`; refreshes list on success
- [ ] Export action triggers a file download via `GET /api/sessions/:slot/export`
- [ ] Delete and Archive show an inline confirmation (not a browser dialog) before proceeding
- [ ] List auto-refreshes via TanStack Query (polling every 5s or on focus); no WebSocket needed for this panel
- [ ] Panel is accessible from the header when `?slot` is set (e.g., a "Manage Sessions" link)

### Status: [ ] Tests | [ ] Impl | [ ] Rated

---

## Story: Paused session read-only enforcement

**As a** server
**I want** paused sessions to block game actions but still serve reads
**So that** a paused game is frozen in time while still being inspectable

### Acceptance Criteria
- [ ] `POST /api/game/action` with a paused slot returns 409 `{ error: 'session is paused' }`
- [ ] `GET /api/game/state` with a paused slot returns 200 with current state (reads allowed)
- [ ] WebSocket clients connecting to a paused slot receive an initial `CONNECTED` message but no `STATE_DELTA` ticks
- [ ] Resuming via `POST /api/sessions/:slot/resume` restarts auto-tick; subsequent ticks broadcast normally
- [ ] Tests cover: action rejected when paused, state readable when paused, tick restarts after resume

### Status: [ ] Tests | [ ] Impl | [ ] Rated
