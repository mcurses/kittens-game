---
name: self-rate
description: Self-rating check for the kittens-mcp rewrite. Runs tests, checks coverage, audits TODOs and skipped tests, checks API spec coverage, and appends a structured score report to agent-docs/SELF_RATINGS.md.
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---

# Self-Rating Check

Run a structured self-evaluation of the current state of the kittens-mcp rewrite.

## Step 1 — Tests & coverage

Run `pnpm test --coverage` (or `bun test --coverage`) across all packages. Capture:
- Pass / fail / skip counts
- Line coverage % per package
- List any failing tests

If the test infrastructure doesn't exist yet, note that and rate coverage as 1.

## Step 2 — Code quality audit

Search `packages/` for:
- `any` TypeScript type usage
- `TODO`, `FIXME`, `HACK` comments
- `it.skip`, `test.todo`, `xit` in test files

List each finding with file:line.

## Step 3 — API spec coverage

Check that every route implemented in `packages/server/` has a corresponding entry in `packages/api-spec/openapi.yaml`. List gaps.

## Step 4 — Docs freshness

- Is `agent-docs/PROGRESS.md` up to date with story completion counts?
- Are new architectural decisions recorded in `agent-docs/DECISIONS.md`?
- Do completed stories have all ACs checked in their STORIES.md?

## Step 5 — Feature parity spot-check

Pick 3 recently completed stories. For each, find the corresponding legacy code and verify edge cases are handled. Note divergences.

## Step 6 — Score

Score 1–5 per dimension (5 = excellent, 1 = blocked/missing):

| Dimension | Score | Notes |
|-----------|-------|-------|
| Test coverage (≥90% target) | | |
| No skipped tests / no TODOs | | |
| Feature parity | | |
| API spec completeness | | |
| Code quality (no `any`) | | |
| Docs freshness | | |
| Commit hygiene | | |
| **Overall average** | | |

**Rule: any dimension ≤ 2 → stop and fix before next epic.**

## Step 7 — Record

Append to `agent-docs/SELF_RATINGS.md`:

```markdown
## <Epic Name> — <date>

<score table>

### What went well
<bullets>

### What to improve
<bullets>

### Action items for next epic
<bullets>
```
