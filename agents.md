# Kittens Game — Modern Rewrite: Agent Strategy Guide

> This document is the **operating manual for the rewrite agent**. Read it fully before starting any work. Update it as the project evolves.

---

## Vision

A faithful, feature-complete rewrite of [Kittens Game](https://kittensgame.com) using modern engineering practices:

- **TypeScript** everywhere
- **API-contract-first** — OpenAPI spec is the source of truth for the client/server boundary
- **Server/client architecture** — multiple browser/CLI clients can connect to the same running game state simultaneously
- **TDD** — no production code without a failing test first
- **Domain-driven** — each game system is an isolated, testable module
- **Event-driven** — game state changes broadcast via WebSocket to all connected clients
- **Fully documented** — agent-docs/ tracks every decision, epic, story, and self-rating

Legacy codebase lives in `legacy/` (~46k lines, Dojo/jQuery/ES5). Do not touch it.

---

## Repository Layout

```
kittens-mcp/
├── agents.md                   ← this file
├── agent-docs/                 ← all living agent documentation
│   ├── DECISIONS.md            ← architecture decisions log (ADR-style)
│   ├── PROGRESS.md             ← epic/story status tracker
│   ├── EPICS.md                ← epic backlog with priorities
│   ├── SELF_RATINGS.md         ← output of /self-rate runs
│   └── epics/
│       └── <epic-name>/
│           ├── STORIES.md      ← user stories + acceptance criteria
│           └── NOTES.md        ← implementation notes, gotchas, links to legacy
├── legacy/                     ← read-only reference (do not modify)
├── packages/
│   ├── api-spec/               ← OpenAPI 3.1 YAML + generated types
│   ├── engine/                 ← pure game logic (no I/O)
│   ├── server/                 ← HTTP + WebSocket server
│   ├── client-web/             ← React web client
│   └── shared/                 ← shared TypeScript types, constants, utils
├── .claude/
│   └── skills/
│       ├── self-rate/SKILL.md   ← /self-rate skill
│       ├── epic-start/SKILL.md  ← /epic-start skill
│       └── sync-docs/SKILL.md   ← /sync-docs skill
├── turbo.json                  ← Turborepo config
└── package.json                ← pnpm workspace root
```

---

## Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Language | TypeScript 5.x strict | Safety, inference, modern ergonomics |
| Runtime | Bun | Fast, built-in test runner, bundler, TS-native |
| HTTP server | Hono | Tiny, typed, edge-ready |
| WebSocket | Bun native WS | Real-time state push to all clients |
| Game state DB | SQLite via Drizzle ORM | Single-file, embedded, easy backup/export |
| Testing | Vitest (or Bun test) | Co-located, fast, ESM-native, coverage built-in |
| API spec | OpenAPI 3.1 + zod-openapi | Contract-first, generates TS types |
| Monorepo | Turborepo + pnpm workspaces | Incremental builds, isolated packages |
| Frontend | React 19 + TanStack Query | Live state sync, optimistic updates |
| Styling | Tailwind CSS | Low-overhead, theme-friendly |
| Linting | Biome | Unified lint + format, fast |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│  packages/engine                                    │
│  Pure TypeScript, zero I/O                          │
│  • Tick engine (deterministic)                      │
│  • All domain managers (resources, buildings, …)    │
│  • Effect system + diminishing returns              │
│  • Save/load serialization (plain objects)          │
│  • 100% unit-testable with Vitest                   │
└────────────────┬────────────────────────────────────┘
                 │ called by
┌────────────────▼────────────────────────────────────┐
│  packages/server                                    │
│  Hono + Bun WS                                      │
│  • POST /api/game/tick  (or auto-tick loop)         │
│  • GET/POST /api/game/state                         │
│  • POST /api/game/action  (buy building, assign job…│
│  • WS  /ws              (broadcasts state deltas)   │
│  • SQLite persistence via Drizzle                   │
│  • Multiple save slots / user sessions              │
└────────────────┬────────────────────────────────────┘
                 │ HTTP + WS
      ┌──────────┴──────────┐
      │                     │
┌─────▼──────┐       ┌──────▼──────┐
│ client-web │  …N   │  CLI client │  (future)
│ React SPA  │       │  automation │
└────────────┘       └─────────────┘
```

**Key invariant:** The engine has zero knowledge of HTTP, WebSockets, or the DOM. It is a pure function: `(state, action) => newState`. The server owns the event loop and persistence. Clients only send actions and render state diffs.

---

## API Contract Principles

1. **OpenAPI spec is written first** before any implementation.
2. All request/response shapes are defined as Zod schemas and exported as TypeScript types shared between server and client.
3. WebSocket messages follow the same envelope: `{ type: string, payload: unknown, ts: number }`.
4. Save data format is a versioned JSON schema — migration functions for every version bump.
5. The spec lives in `packages/api-spec/openapi.yaml` — never hand-edit generated files.

### Core Endpoints (initial)

```
GET  /api/health
GET  /api/game/state          → full GameState snapshot
POST /api/game/action         → { type, payload } → ActionResult
POST /api/game/tick           → advance one tick manually (testing)
GET  /api/game/save           → export save JSON
POST /api/game/load           → import save JSON
POST /api/game/reset          → soft reset (prestige)

WS   /ws                      → subscribe to state deltas
```

---

## Development Workflow

### TDD Loop (mandatory)

```
1. Read the relevant legacy code for the feature being ported
2. Write STORIES.md for the epic if not already done
3. Write failing Vitest tests (acceptance + unit)
4. Run tests → confirm red
5. Implement minimum code to make tests pass
6. Refactor
7. git commit (small, frequent, descriptive)
8. Repeat
```

Never write production code that has no test coverage. If you find yourself typing `// TODO: test this`, stop and write the test first.

### Commit Convention

```
<type>(<scope>): <summary>

Types: feat, fix, test, refactor, docs, chore
Scopes: engine, server, client, api-spec, agent-docs

Examples:
feat(engine): add catnip resource with per-tick production
test(engine): add building purchase price scaling tests
docs(agent-docs): complete epic-01 self-rating
```

Commit after every green test run. Small commits make bisecting easy.

### Self-Rating Cadence

Run `/self-rate` at the end of every epic and at any natural milestone. Results go in `agent-docs/SELF_RATINGS.md`. Use the rating to adjust approach for the next epic.

---

## Epic Backlog

Epics are ordered by dependency. Do not start an epic until its prerequisites are complete. Mark status in `agent-docs/EPICS.md`.

| # | Epic | Prerequisites | Priority |
|---|------|--------------|----------|
| 01 | **Foundation** — monorepo, tooling, CI, package skeletons | — | P0 |
| 02 | **API Spec** — OpenAPI schema, Zod types, WS envelope | 01 | P0 |
| 03 | **Core Engine** — tick loop, effect system, base managers | 01 | P0 |
| 04 | **Resources** — all resource types, storage, perTick calc | 03 | P0 |
| 05 | **Buildings** — all buildings, prices, effects, stages | 04 | P0 |
| 06 | **Village / Population / Jobs** — kittens, jobs, happiness | 04 | P0 |
| 07 | **Calendar & Seasons** — seasons, moon, year tick | 03 | P1 |
| 08 | **Science / Tech Tree** — 100+ techs, unlock chains | 05, 06 | P1 |
| 09 | **Workshop / Upgrades** — crafting recipes, upgrade effects | 05, 08 | P1 |
| 10 | **Religion & Faith** — faith, gods, praise mechanics | 08 | P1 |
| 11 | **Prestige / Reset** — paragon, perks, soft reset flow | 08 | P1 |
| 12 | **Challenges** — challenge types, LDR stacking, completions | 11 | P2 |
| 13 | **Space** — planets, space buildings, space upgrades | 09 | P2 |
| 14 | **Diplomacy / Trade** — races, trade missions, trade post | 09 | P2 |
| 15 | **Time Mechanics** — Chronoforge, queue, heat/flux | 10 | P2 |
| 16 | **Achievements** — 200+ achievements, badge unlock | 08 | P2 |
| 17 | **Server** — Hono server, SQLite, session mgmt, WS | 02, 03 | P1 |
| 18 | **Web Client** — React SPA, TanStack Query, WS live sync | 17 | P1 |
| 19 | **Multi-client** — concurrent clients, optimistic UI, conflict | 18 | P2 |
| 20 | **i18n** — translation system, port all 40+ locale files | 18 | P3 |
| 21 | **Themes & Assets** — CSS themes, image assets | 18 | P3 |
| 22 | **Feature Parity Audit** — systematic comparison to legacy | all | P1 |

---

## Starting a New Epic

Before writing a single line of code for an epic:

1. Run `/epic-start <epic-name>` — creates `agent-docs/epics/<name>/STORIES.md` scaffold
2. Read the corresponding legacy code thoroughly
3. Fill in all user stories with **Given/When/Then** acceptance criteria
4. Get story sign-off (re-read and confirm they cover legacy behavior)
5. Only then: start TDD loop

### Story Template

```markdown
## Story: <title>

**As a** <who>
**I want** <what>
**So that** <why>

### Acceptance Criteria
- [ ] Given <context>, when <action>, then <outcome>
- [ ] Given <context>, when <action>, then <outcome>

### Legacy Reference
- File: `legacy/js/<file>.js` lines <N>-<M>
- Key logic: <brief description>

### Notes
<any edge cases, known divergences from legacy>
```

---

## Self-Rating Rubric

When running `/self-rate`, evaluate against:

| Dimension | Questions |
|-----------|-----------|
| **Test coverage** | Is line coverage ≥ 90% for the epic? Are edge cases covered? |
| **Feature parity** | Does each story's AC map 1:1 to legacy behavior? |
| **API contract** | Are all new actions/endpoints in the OpenAPI spec? |
| **Code quality** | No `any` types, no skipped tests, no TODOs left in code |
| **Docs** | Is PROGRESS.md updated? Were decisions logged in DECISIONS.md? |
| **Commit hygiene** | Small commits? Meaningful messages? No "WIP" left in main? |

Score each dimension 1–5 and record in `agent-docs/SELF_RATINGS.md`. If any dimension scores ≤ 2, pause and fix before moving to the next epic.

---

## Legacy Reference Guide

When porting a system, always read the legacy code first. Key reference points:

| System | Legacy Files | Key Classes |
|--------|-------------|-------------|
| Game loop | `legacy/game.js:1891` | `Timer`, `GamePage.update()` |
| Effect system | `legacy/core.js` | `IGameAware`, `updateEffectCached()` |
| Resources | `legacy/js/resources.js` | `ResourceManager` |
| Buildings | `legacy/js/buildings.js` | `BuildingsManager`, `getBuildingExt()` |
| Jobs | `legacy/js/village.js` | `VillageManager.getJob()` |
| Science | `legacy/js/science.js` | `ScienceManager` |
| Workshop | `legacy/js/workshop.js` | `WorkshopManager` |
| Religion | `legacy/js/religion.js` | `ReligionManager` |
| Prestige | `legacy/js/prestige.js` | `PrestigeManager` |
| Challenges | `legacy/js/challenges.js` | `ChallengesManager`, LDR logic |
| Space | `legacy/js/space.js` | `SpaceManager` |
| Diplomacy | `legacy/js/diplomacy.js` | `DiplomacyManager` |
| Calendar | `legacy/js/calendar.js` | `Calendar`, `seasons` |
| Time | `legacy/js/time.js` | `TimeManager`, queue system |
| Achievements | `legacy/js/achievements.js` | `Achievements` |
| Save format | `legacy/test/res/save.js` | Top-level save keys |

The existing test suite in `legacy/test/` is a gold mine for expected behavior — read it before writing new tests.

---

## Multi-Client Design Notes

The server holds the authoritative game state. Clients are thin:

- On connect: server sends full `GameState` snapshot
- Every tick: server broadcasts `StateDelta` to all connected WS clients
- Client sends `Action` → server validates → applies to engine → broadcasts delta
- No client-side game logic — just rendering + input
- Optimistic UI optional (mark as experimental)
- Save slots are server-side; clients reference by `saveId`
- Auth is simple session token (no user accounts required initially)

---

## Custom Claude Code Skills

Three skills are defined in `.claude/skills/` to support the agent workflow:

### `/self-rate`
Runs the full test suite, checks coverage, audits open TODOs, compares against PROGRESS.md, and produces a structured rating report. Output is appended to `agent-docs/SELF_RATINGS.md`.

### `/epic-start <name>`
Creates the epic directory scaffold (`agent-docs/epics/<name>/`), pre-fills STORIES.md with the standard template, and adds the epic to PROGRESS.md as "In Progress".

### `/sync-docs`
Reads the current git log and test results, then updates `agent-docs/PROGRESS.md` with accurate story completion status and coverage metrics. Run this before any self-rating.

> Skill definitions live in `.claude/skills/<name>/SKILL.md`. Claude Code picks them up automatically as `/name` slash commands.

---

## Non-Negotiables

- No `any` types in production code
- No skipping tests (`it.skip`, `test.todo` must have a linked issue)
- No production code without a test
- OpenAPI spec updated before merging any new endpoint
- `agent-docs/PROGRESS.md` updated at the end of every work session
- Legacy code is **read-only reference** — never modify it

---

## Autonomous Mode (running 2–3 epics hands-off)

You don't need to babysit each epic. Give the agent a multi-epic prompt and check in after it finishes. The agent will self-direct using this document as its operating manual.

### Kick-off prompt template

```
You are working on the kittens-mcp rewrite. Read agents.md fully before starting.

Complete the following epics in order, following the workflow in agents.md exactly:
- Epic 01: Foundation
- Epic 02: API Spec
- Epic 03: Core Engine

For each epic:
1. Create the agent-docs scaffold (STORIES.md, NOTES.md)
2. Read the relevant legacy code and fill in stories with full AC
3. TDD loop: write failing tests → implement → green → commit
4. Run /self-rate and record results
5. Only move to the next epic if no dimension scored ≤ 2

Commit frequently (after every green test run). Keep commits small and descriptive.
When done, summarize what was completed, any deviations from the plan, and what's next.
```

### What the agent does autonomously

- Reads legacy code to extract stories
- Writes all tests before implementation
- Commits after each green run
- Runs `/self-rate` at epic boundaries
- Updates `agent-docs/PROGRESS.md` throughout
- Stops and flags blockers rather than pushing through them

### Your check-in checklist (every 2–3 epics)

- [ ] Read `agent-docs/PROGRESS.md` — stories complete as expected?
- [ ] Read `agent-docs/SELF_RATINGS.md` — any ≤ 2 scores that weren't fixed?
- [ ] Skim recent commits: `git log --oneline -20`
- [ ] Run the test suite yourself once: `pnpm test`
- [ ] Spot-check one completed story against its legacy behavior
- [ ] If happy: kick off the next batch with another multi-epic prompt

### When to intervene

- A self-rating score stays ≤ 2 across two runs
- Tests are passing but something feels wrong in behavior (run legacy side-by-side)
- An epic has been "In Progress" for a suspiciously long time with few commits

---

## Getting Started (Epic 01 checklist)

- [ ] Initialize pnpm workspace + turbo.json
- [ ] Create package skeletons: `engine`, `server`, `client-web`, `api-spec`, `shared`
- [ ] Configure TypeScript strict mode in each package
- [ ] Set up Vitest in `engine` and `server`
- [ ] Configure Biome for lint + format
- [ ] Add CI (GitHub Actions): lint → test → build
- [ ] Create `agent-docs/` directory with DECISIONS.md, PROGRESS.md, EPICS.md, SELF_RATINGS.md
- [ ] Create `.claude/skills/` with the three skill definitions
- [ ] Run `/self-rate` on the foundation and record baseline
