---
name: self-rate
description: Self-rating check for the kittens-mcp rewrite. Runs tests, checks coverage, audits TODOs and skipped tests, checks API spec coverage, and appends a structured score report to agent-docs/SELF_RATINGS.md.
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---

# Self-Rating Check

Run a structured self-evaluation of the current state of the kittens-mcp rewrite.

## Step 1 — Build + Tests & coverage

First run `pnpm turbo build`. If the build fails, rate Test coverage as 1 and stop — a failing build blocks everything else.

Then run `pnpm turbo test` across all packages. Capture:
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

1. Check that every route implemented in `packages/server/` has a corresponding entry in `packages/api-spec/openapi.yaml`. List gaps.
2. Check that every `GameAction` type defined in `packages/engine/src/actions.ts` appears in the `GameActionRequest` discriminated union in `packages/api-spec/`. List any missing action types — these are failures, not deferrals.

## Step 4 — Parity tracker freshness

Read `agent-docs/PARITY.md`. This is the authoritative record of what is and isn't implemented.

- Were any buildings, effect keys, or features added this epic? If yes, verify their rows in PARITY.md are updated.
- Pick 2 rows marked ✅ and grep the codebase to confirm they are actually wired end-to-end. For recently touched parity work, verify both:
  - one production/consumption path
  - one action or UI control path
- If a row is wrong, fix it and flag it immediately.
- Check the Summary Counts table — do the numbers match reality? Run counts if uncertain.
- Flag any row where status is ✅ but producer, consumer, action surface, UI surface, save/load path, or regression test coverage looks incomplete.

**Rate Parity Tracker as FAIL if PARITY.md was not updated after changes that affect it.**

## Step 5 — Docs freshness

- Is `agent-docs/PROGRESS.md` up to date with story completion counts?
- Are new architectural decisions recorded in `agent-docs/DECISIONS.md`?
- Do completed stories have all ACs checked in their STORIES.md?
- Is `agent-docs/EPICS.md` up to date? Mark the just-completed epic as ✅ Complete if it isn't already. If any epic was previously "Not Started" but work has clearly begun, update it to "In Progress".

## Step 6 — Feature parity spot-check

Pick 3 recently completed stories. For each, find the corresponding legacy code and verify edge cases are handled. Note divergences.

For each selected story, explicitly answer:
- What exact legacy behavior exists?
- Where is the producer in the rewrite?
- Where is the consumer in the rewrite?
- What action or UI control exists for the player?
- What test proves parity?

If any answer is missing, lower Feature parity and record it as an action item instead of assuming completeness.

## Step 7 — Score

Score 1–5 per dimension (5 = excellent, 1 = blocked/missing):

| Dimension | Score | Notes |
|-----------|-------|-------|
| Test coverage (≥90% target) | | |
| No skipped tests / no TODOs | | |
| Feature parity | | |
| API spec completeness | | |
| Code quality (no `any`) | | |
| Docs freshness (PROGRESS, DECISIONS, PARITY) | | |
| Commit hygiene | | |
| **Overall average** | | |

**Rule: any dimension ≤ 2 → stop and fix before next epic.**

The "Feature parity" score must reflect PARITY.md coverage counts, not just story AC checkboxes.
A score of 5 requires PARITY.md to be current and the checked ✅ rows to have verified producer, consumer, control surface, and regression tests.

## Step 8 — Record

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
