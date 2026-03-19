---
name: sanity-check
description: Qualitative review of recently completed epics. Reads actual source code, compares against legacy, spots architectural risks, and files any missing features as stories. Run at batch boundaries, not per-epic.
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---

# Sanity Check

A qualitative review complementing `/self-rate`. Where self-rate does mechanical checks (build, tests, coverage, linting), this skill reads the actual code and forms an opinion. Run after a `/queue-epics` batch completes.

## Step 1 — Identify scope

Read `agent-docs/SELF_RATINGS.md` and identify which epics were completed in the most recent batch. Read their corresponding source files in `packages/engine/src/`.

## Step 2 — Code quality opinion

For each epic in the batch, read the implementation file fully. Evaluate honestly:

- Is it idiomatic modern TypeScript? (proper types, no excessive casts, no `any`)
- Is the architecture clean? (pure functions, clear separation of concerns, no hidden I/O)
- Does it smell like slop? (overly verbose, redundant, weird structure, copy-paste patterns)
- Are data structures sensible for a game engine?
- Are the effect contributions to `effectCache` correct and complete?

## Step 3 — Test quality opinion

For each epic, read the test file. Evaluate:

- Are tests verifying actual game behavior, or just asserting code runs?
- Are edge cases covered (locked items, insufficient resources, unknown names)?
- Are cross-manager integration tests present and meaningful?
- Any obvious behavioral gaps?

## Step 4 — Feature parity comparison

For each epic, read the corresponding legacy file(s) from `legacy/js/`. Also check `legacy/test/` for the domain. Compare against the new implementation:

- Are all named items (buildings, upgrades, techs, perks, challenges) present?
- Are formulas faithful? Spot-check 3–5 non-trivial calculations.
- What is intentionally missing vs. accidentally missing?
- File any accidentally missing features as new stories in the epic's `agent-docs/epics/<name>/STORIES.md`.

## Step 5 — Architectural risks

Identify any patterns that will cause pain as the codebase grows:

- State update patterns that won't scale
- Effect dependencies that assume ordering
- Missing validation at system boundaries
- Cross-system interactions not yet modeled

For each risk: is it worth fixing now or documenting for later? If documenting, add an ADR to `agent-docs/DECISIONS.md`.

## Step 6 — Output

Write a structured report directly to the conversation (do not append to SELF_RATINGS.md — that's for self-rate). Format:

```
## Sanity Check — Epics <X–Y> — <date>

### Code quality: <PASS|WARN|FAIL>
<bullets — be specific, cite file:line for any issues>

### Test quality: <PASS|WARN|FAIL>
<bullets>

### Feature parity gaps found
<bullets — each gap should already be filed as a story by Step 4>

### Architectural risks
<bullets — each risk should either be fixed or have an ADR>

### Overall verdict
<one paragraph — honest assessment of where the rewrite stands>
```

If any category is FAIL, stop and fix before the next queue-epics batch.
