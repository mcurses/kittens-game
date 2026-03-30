# Autonomous Rewrite Case Study: Kittens Game Modernization

## Executive Summary

This repository is a case study in using an autonomous coding agent to rewrite and modernize a large legacy browser game into a typed, test-driven, contract-first, multi-package product.

The starting point was the original Kittens Game codebase in [`legacy/`](../legacy): a mature ES5 application built around Dojo, jQuery, global mutable state, and tightly coupled UI/game logic. The ending point is a new product in [`packages/`](../packages) with:

- a pure TypeScript engine
- a typed HTTP/WebSocket server
- a React client
- an OpenAPI-first boundary between client and server
- persistent multi-slot game sessions
- broad automated test coverage and epic-level documentation

The rewrite was not purely transliteration. It was a modernization exercise with explicit architectural constraints:

- preserve gameplay behavior where practical
- separate domain logic from delivery mechanisms
- make state transitions deterministic and testable
- replace ad hoc contracts with explicit schemas
- use documentation as an operational control surface for autonomous execution

The result is a functioning modern product and a useful record of where autonomous rewrite workflows perform well, where they drift, and what process guardrails were required to keep the work coherent.

---

## 1. Problem Statement

The legacy codebase is substantial and historically evolved:

- `legacy/`: 113 source-style files, about 80.7k lines by repository count
- legacy JavaScript alone: about 46.2k lines
- architecture centered on browser-era patterns: Dojo classes, jQuery helpers, shared mutable state, UI and simulation logic interleaved

This made the legacy game feature-rich but difficult to reason about mechanically:

- domain behavior was spread across manager objects and UI code
- tests existed, but the runtime model was not isolated from presentation concerns
- extending the game into server/client or multi-client scenarios would have required structural change, not incremental cleanup

The rewrite therefore had two goals at once:

1. Produce a modern, maintainable implementation.
2. Evaluate whether an autonomous agent could drive a multi-epic modernization effort with bounded human supervision.

---

## 2. Rewrite Strategy

The repository encoded the rewrite method explicitly in [`agents.md`](../agents.md) and `agent-docs/`.

### Operating model

The agent was instructed to work epic-by-epic:

1. read legacy code first
2. write stories and acceptance criteria
3. write failing tests first
4. implement the minimum code to pass
5. document decisions, progress, and self-ratings
6. repeat

This matters because the documentation was not passive project paperwork. It was part of the control system:

- [`agent-docs/PROGRESS.md`](./PROGRESS.md) tracked execution status
- [`agent-docs/EPICS.md`](./EPICS.md) defined sequencing
- [`agent-docs/DECISIONS.md`](./DECISIONS.md) captured architectural commitments
- [`agent-docs/SELF_RATINGS.md`](./SELF_RATINGS.md) enforced milestone reviews
- [`agent-docs/epics/*`](./epics) held story-level legacy references and notes

The rewrite was therefore autonomous in implementation, but highly scaffolded in process.

### Why this worked

Large rewrites usually fail from hidden scope expansion and loss of behavioral intent. The repository countered that with three mechanisms:

- story-first decomposition
- tests as the admission ticket for code
- legacy code used as a parity oracle instead of a direct implementation base

That combination reduced ambiguity enough for autonomous execution to stay productive across many epics.

---

## 3. Architecture of the New Product

The new system is organized into explicit boundaries.

### Engine

[`packages/engine`](../packages/engine) is the rewrite’s core architectural success. It treats the game as a pure state machine:

- no DOM knowledge
- no HTTP knowledge
- no persistence code
- deterministic `(state, action) => newState` semantics

The engine now contains distinct modules for:

- resources
- buildings
- village/jobs
- calendar
- science
- workshop
- religion
- prestige
- challenges
- diplomacy
- space
- time
- achievements

Repository count for `packages/engine/src`:

- 37 files
- about 18.5k lines

That engine is backed by a large test suite and integration tests across manager interactions, which is exactly the form a legacy browser game usually lacks.

### API contract layer

[`packages/api-spec`](../packages/api-spec) moved the project away from implicit object shapes toward a formal boundary:

- OpenAPI 3.1 in [`packages/api-spec/openapi.yaml`](../packages/api-spec/openapi.yaml)
- Zod-backed request/response validation
- shared types consumed by both server and client

This is one of the most meaningful modernization steps in the whole rewrite. It converted game operations from “whatever the frontend happens to send” into explicit contracts.

### Server

[`packages/server`](../packages/server) owns:

- HTTP endpoints
- WebSocket state broadcast
- persistence
- session and slot isolation
- the authoritative game loop

The server reflects the rewrite’s central architectural inversion: the browser is no longer the home of the game state. The server is authoritative, which unlocks:

- multiple simultaneous clients
- persistence independent of a browser tab
- future CLI or automation clients

### Client

[`packages/client-web`](../packages/client-web) is a React client that renders state and dispatches actions rather than embedding core game rules in the browser.

Repository count for `packages/client-web/src`:

- 51 files
- about 6.5k lines

This is a major simplification versus the legacy model. The client is still substantial, but its role is now presentation, interaction, and synchronization rather than simulation ownership.

---

## 4. Delivery Arc

The epic history in [`agent-docs/PROGRESS.md`](./PROGRESS.md) shows a clear progression.

### Phase 1: Foundation and architecture

Epics 01-03 established:

- pnpm workspace and Turborepo
- strict TypeScript
- Vitest and Biome
- package boundaries
- the engine purity invariant
- the manager interface and effect system

This phase was critical. It defined the system shape before feature porting accelerated.

### Phase 2: Domain porting

Epics 04-16 ported major game systems into the engine:

- resources
- buildings
- village/jobs
- seasons/calendar
- science
- workshop
- religion
- prestige
- challenges
- space
- diplomacy
- time
- achievements

This is where autonomous rewrite was strongest. The work decomposed naturally into domain modules with stable acceptance criteria and direct legacy references.

### Phase 3: Productization

Epics 17-18 turned the engine into a product:

- HTTP API
- WebSocket synchronization
- persistence
- React client

At this point the rewrite stopped being only a code translation exercise and became a new deployable architecture.

### Phase 4: Completeness and parity repair

Epics 19-21 and 25 closed major product gaps:

- engine completeness work
- game UI coverage
- parity audits
- multi-tab/gameplay affordances
- additional panels and craft-N workflows

Epic 22 then added multi-slot isolation, which materially demonstrated the benefit of the new architecture over the legacy one.

### Current status

Based on current docs:

- completed epics include 01-21, 22, and 25
- epic 26 is drafted but not implemented
- epics 23 and 24 are still not started

That means the rewrite is substantial and usable, but not literally “everything the original game ever had.” Remaining gaps are documented rather than hidden.

---

## 5. Measurable Outcomes

The repository contains enough data to judge the rewrite on output, not only intent.

### Scale of the new system

Repository counts for the new product source areas:

- `packages/engine/src`: about 18.5k lines
- `packages/server/src`: about 1.6k lines
- `packages/client-web/src`: about 6.5k lines
- `packages/api-spec/src`: about 322 lines

That is roughly 27k lines of source across the rewritten product packages, excluding generated artifacts and dependency output.

### Test volume

A repository grep over `packages/**/*test.*` finds about 1,056 test cases.

Documented milestone counts in `PROGRESS.md` show the system at various points reaching totals such as:

- Epic 21: 721 engine tests, 43 server tests
- Epic 22: 729 engine tests, 74 server tests, 212 client tests
- Epic 25: 724 engine tests, 48 server tests, 176 client tests, 972 total tests

The exact totals changed as implementation evolved, but the consistent pattern is clear: the rewrite invested heavily in executable verification.

### Self-rating discipline

`SELF_RATINGS.md` currently contains 24 recorded milestone ratings with:

- average overall score: 4.81 / 5
- minimum recorded average: 4.4 / 5
- maximum: 5.0 / 5

This does not prove correctness by itself, but it does show that the rewrite kept stopping to evaluate process quality instead of only accumulating code.

---

## 6. What Autonomous Execution Did Well

### 6.1 It handled modular domain extraction effectively

The biggest success was converting a broad legacy game into isolated managers and state slices. Systems like resources, buildings, jobs, science, religion, and time mechanics were ported into modules that can now be tested independently.

This is the kind of work autonomous agents are comparatively good at when:

- legacy behavior is discoverable
- module boundaries are explicit
- acceptance criteria are concrete

### 6.2 It created a better architecture than the source system

The rewrite did not merely preserve behavior. It improved the deployable shape of the application:

- server-authoritative state
- contract-first API
- browser-independent engine
- multi-client/session capability

That is a genuine modernization, not just a language migration.

### 6.3 It produced unusually strong project memory

The combination of ADRs, epic stories, notes, progress logs, and self-ratings meant the repo accumulated decision context alongside code. For autonomous work, this is important: without project memory, every new session risks re-litigating old choices or drifting from intent.

### 6.4 It converted legacy tests and behaviors into a parity workflow

The instructions repeatedly directed the agent back to `legacy/test/` and to specific legacy source files. That turned the old codebase into a reference implementation rather than a copy target. This is a more reliable pattern than trying to “rewrite from memory.”

---

## 7. Where Autonomy Needed Guardrails

This rewrite also shows what an autonomous workflow does not solve by itself.

### 7.1 Documentation drift still occurred

The repo currently has at least one visible inconsistency: [`agent-docs/PROGRESS.md`](./PROGRESS.md) marks Epic 22 complete, while [`agent-docs/EPICS.md`](./EPICS.md) still marks Epic 22 as not started. That is small, but it is important.

It demonstrates that:

- autonomous agents can maintain docs well for long stretches
- they still need periodic reconciliation passes
- “living documentation” only stays living if it is itself audited

### 7.2 Architectural simplifications introduced known divergence

ADRs document some deliberate departures from the legacy runtime, such as:

- one-tick effect lag acceptance
- summed diminishing returns behavior
- optional `unlocked` building field for compatibility

These were reasonable engineering decisions, but they show that autonomous modernization is not pure parity work. The agent necessarily makes design choices. Those choices must be surfaced and recorded, not hidden behind a “faithful rewrite” label.

### 7.3 UX parity lagged engine parity

The engine and server matured faster than the client UX. That is common in autonomous rewrites:

- domain logic is easier to specify and test
- UI information architecture is more ambiguous
- interaction quality often requires more product judgment than code generation

The drafted but unfinished Epic 26 on UI information architecture is evidence of that boundary.

### 7.4 Completion signals can overstate true parity

Many epics are marked complete, and many tests are green, but some roadmap items remain open:

- i18n
- themes/assets
- additional UI architecture work

This is not failure. It is a reminder that an autonomous program can reach high local completeness while still leaving non-trivial product areas unfinished.

---

## 8. Why the Rewrite Was Credible

Several decisions made this more credible than a typical “AI rewrote my app” claim.

### Legacy-first behavior discovery

The workflow required reading legacy files before implementation. That kept the rewrite anchored to actual source behavior rather than inferred behavior.

### Test-first implementation

The engine and package tests gave the rewrite a mechanical brake. This reduced the risk of plausible-looking but behaviorally wrong code.

### Contract-first boundaries

The OpenAPI and Zod layer forced client/server integration into explicit, typed shapes. This sharply reduces a common rewrite risk: hidden divergence between frontend assumptions and backend reality.

### Separation of concerns

The new architecture made correctness easier to reason about:

- engine correctness can be tested without network or UI
- server correctness can be tested without browser rendering
- client correctness can focus on rendering and synchronization

This decomposition is precisely what legacy web apps often lack, and it is also what makes autonomous iteration safer.

---

## 9. Lessons for Future Autonomous Modernization Projects

### 9.1 The agent needs a strict operating manual

The most important asset here was not the model. It was the workflow encoded in `agents.md`. Without that:

- epics would have bled into each other
- docs would have become decorative
- parity claims would have been weaker

Autonomy improved because the process was explicit.

### 9.2 Rewrite around stable seams, not around screens

This project succeeded by starting with engine modules and contracts, not by rebuilding screens first. That allowed the rewrite to establish:

- deterministic state
- testable rules
- portable interfaces

UI could then evolve on top of a stable substrate.

### 9.3 Use the legacy system as an oracle, not as architecture

The legacy source was valuable for:

- formulas
- unlock conditions
- save semantics
- edge-case behavior

It was not valuable as a target architecture. The rewrite improved outcomes because it preserved behavior while discarding the old structural assumptions.

### 9.4 Self-evaluation is useful, but only when it is specific

The self-rating system helped because it asked concrete questions:

- coverage
- parity
- API completeness
- code quality
- docs freshness
- commit hygiene

Generic “how did I do?” retrospectives would not have been enough.

### 9.5 Product ambiguity remains the hardest part

The most tractable rewrite work was computational and structural. The least tractable areas were:

- information architecture
- UX detail surfaces
- theme and presentation completeness
- product-level polish decisions

That boundary matters for planning future autonomous rewrites. Autonomy is strongest in domains with crisp invariants and weakest where judgment is primarily experiential.

---

## 10. Final Assessment

As a case study, this rewrite is a strong demonstration of what autonomous modernization can accomplish when the problem is framed correctly.

It shows that an agent can:

- decompose a large legacy application into coherent epics
- port core behavior into isolated, testable modules
- introduce modern platform boundaries and contracts
- maintain a substantial amount of supporting documentation
- deliver a working product that materially improves on the source architecture

It also shows the limits clearly:

- doc synchronization can drift
- parity claims need continuous audit
- UX and product design still demand more human judgment
- “complete” in an epic tracker does not mean “all legacy value has been captured”

The most important conclusion is not that autonomous rewrite replaces engineering leadership. It is that, with a strong operating manual, explicit acceptance criteria, and rigorous verification, autonomous agents can do meaningful modernization work on a codebase large enough to be structurally difficult for manual one-shot rewrites.

In that sense, this repository is a credible case study not because it is perfect, but because it preserves the evidence of how the rewrite was managed, what was built, what changed architecturally, and where the remaining gaps still are.
