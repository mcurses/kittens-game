# Epic 01: Foundation

**Status:** In Progress
**Started:** 2026-03-16
**Legacy references:** N/A — this epic is infrastructure-only (no legacy game logic to port)

---

## Story Index

1. [Monorepo Initialization](#story-monorepo-initialization)
2. [Package Skeletons](#story-package-skeletons)
3. [TypeScript Configuration](#story-typescript-configuration)
4. [Test Runner Setup](#story-test-runner-setup)
5. [Linting & Formatting](#story-linting--formatting)
6. [CI Pipeline](#story-ci-pipeline)
7. [Agent Docs Bootstrap](#story-agent-docs-bootstrap)

---

## Story: Monorepo Initialization

**As a** developer
**I want** a pnpm workspace with Turborepo configured
**So that** all packages can be developed, built, and tested in a single repo with incremental caching

### Acceptance Criteria
- [ ] Given a fresh clone, when `pnpm install` is run, then all workspace packages resolve without errors
- [ ] Given the workspace, when `turbo build` is run, then it completes successfully and caches outputs
- [ ] Given the workspace, when `turbo test` is run, then it runs tests across all packages in dependency order
- [ ] Given the root `package.json`, then it declares `"packageManager": "pnpm@..."` and a `"workspaces"` field pointing to `packages/*`
- [ ] Given `turbo.json`, then it defines `build`, `test`, `lint` pipelines with correct `dependsOn` and `outputs`

### Legacy Reference
- N/A — pure infrastructure story

### Status
- [ ] Tests written
- [ ] Implementation complete
- [ ] Self-rating passed

---

## Story: Package Skeletons

**As a** developer
**I want** empty but valid package directories for engine, server, client-web, api-spec, and shared
**So that** each domain has a clear home and inter-package imports resolve correctly

### Acceptance Criteria
- [ ] Given `packages/engine`, then it has a `package.json` with name `@kittens/engine` and a `src/index.ts` exporting an empty object
- [ ] Given `packages/server`, then it has a `package.json` with name `@kittens/server` and a `src/index.ts`
- [ ] Given `packages/client-web`, then it has a `package.json` with name `@kittens/client-web` and a `src/main.tsx`
- [ ] Given `packages/api-spec`, then it has a `package.json` with name `@kittens/api-spec` and a `src/index.ts`
- [ ] Given `packages/shared`, then it has a `package.json` with name `@kittens/shared` and a `src/index.ts`
- [ ] Given `packages/engine` imports `@kittens/shared`, then TypeScript resolves the import without errors

### Legacy Reference
- N/A — pure infrastructure story

### Status
- [ ] Tests written
- [ ] Implementation complete
- [ ] Self-rating passed

---

## Story: TypeScript Configuration

**As a** developer
**I want** strict TypeScript configured in every package
**So that** type errors are caught at compile time and `any` usage is forbidden

### Acceptance Criteria
- [ ] Given any package, when `tsc --noEmit` is run, then it exits 0 with no errors on skeleton code
- [ ] Given a root `tsconfig.base.json`, then it enables `"strict": true`, `"noUncheckedIndexedAccess": true`, `"exactOptionalPropertyTypes": true`
- [ ] Given each package's `tsconfig.json`, then it extends the base config and sets correct `rootDir` and `outDir`
- [ ] Given a file that uses `any` explicitly, when `tsc` runs, then it produces a type error (via `@typescript-eslint/no-explicit-any` or Biome equivalent)
- [ ] Given `packages/shared` exports a type, when `packages/engine` imports it, then TypeScript resolves it correctly via project references or path aliases

### Legacy Reference
- N/A — pure infrastructure story

### Status
- [ ] Tests written
- [ ] Implementation complete
- [ ] Self-rating passed

---

## Story: Test Runner Setup

**As a** developer
**I want** Vitest configured in `engine` and `server` packages
**So that** I can run the TDD loop with fast feedback

### Acceptance Criteria
- [ ] Given `packages/engine`, when `pnpm test` is run, then Vitest discovers and runs all `*.test.ts` files
- [ ] Given `packages/server`, when `pnpm test` is run, then Vitest discovers and runs all `*.test.ts` files
- [ ] Given a trivial test `expect(1 + 1).toBe(2)`, when tests run, then it passes and reports green
- [ ] Given a failing test, when tests run, then Vitest reports the failure clearly with file and line number
- [ ] Given `turbo test`, then it runs tests in all packages that have a test script and caches results

### Legacy Reference
- Legacy test suite lives in `legacy/test/` — read these before writing game-logic tests in later epics

### Status
- [ ] Tests written
- [ ] Implementation complete
- [ ] Self-rating passed

---

## Story: Linting & Formatting

**As a** developer
**I want** Biome configured for unified lint and format across all packages
**So that** code style is consistent and common errors are caught automatically

### Acceptance Criteria
- [ ] Given the repo root, when `biome check .` is run, then it exits 0 on skeleton code
- [ ] Given a file with a lint error (e.g. unused variable), when `biome check` runs, then it reports the error
- [ ] Given a file with inconsistent formatting, when `biome format --write` is run, then it is corrected in place
- [ ] Given `turbo lint`, then it runs `biome check` across all packages
- [ ] Given the Biome config, then it enforces no `console.log` in `packages/engine` (pure domain logic)

### Legacy Reference
- N/A — pure infrastructure story

### Status
- [ ] Tests written
- [ ] Implementation complete
- [ ] Self-rating passed

---

## Story: CI Pipeline

**As a** developer
**I want** a GitHub Actions workflow that runs lint → test → build on every PR and push to main
**So that** regressions are caught before merge

### Acceptance Criteria
- [ ] Given a PR, when the workflow runs, then it installs dependencies with `pnpm install --frozen-lockfile`
- [ ] Given a PR, when lint fails, then the workflow reports failure and blocks merge
- [ ] Given a PR, when any test fails, then the workflow reports failure and blocks merge
- [ ] Given a PR where all checks pass, then the workflow reports success
- [ ] Given the workflow, then it uses Turborepo remote caching (or local cache) to skip unchanged packages
- [ ] Given the workflow file, then it pins action versions with SHA hashes for supply-chain security

### Legacy Reference
- N/A — pure infrastructure story

### Status
- [ ] Tests written
- [ ] Implementation complete
- [ ] Self-rating passed

---

## Story: Agent Docs Bootstrap

**As a** developer agent
**I want** the `agent-docs/` directory fully initialized
**So that** PROGRESS.md, DECISIONS.md, EPICS.md, and SELF_RATINGS.md exist and are ready for use

### Acceptance Criteria
- [ ] Given `agent-docs/PROGRESS.md`, then it exists and lists all 22 epics with status "Not Started" (except Foundation which is "In Progress")
- [ ] Given `agent-docs/DECISIONS.md`, then it exists with an ADR template and at least one entry documenting the tech stack choice
- [ ] Given `agent-docs/EPICS.md`, then it mirrors the epic backlog from `agents.md` and is the live status tracker
- [ ] Given `agent-docs/SELF_RATINGS.md`, then it exists with the rating rubric header and is ready to receive entries
- [ ] Given `agent-docs/epics/foundation/`, then STORIES.md and NOTES.md exist (this story completes that)

### Legacy Reference
- N/A — pure infrastructure story

### Status
- [ ] Tests written
- [ ] Implementation complete
- [ ] Self-rating passed
