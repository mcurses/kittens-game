---
name: sanity-check
description: Perform a qualitative post-batch review of completed kittens-mcp epics. Use when the user asks for a sanity check, parity audit, or architectural review after one or more epics.
---

# Sanity Check

Use this skill after a `queue-epics` batch or when the user asks for a qualitative review. Keep behavior aligned with `.claude/skills/sanity-check/SKILL.md`.

This workflow complements `self-rate`: it reads the actual code and forms a judgment about quality, parity, and architectural risk.

## Workflow

### 1. Identify the review scope

- Read `agent-docs/SELF_RATINGS.md` to identify the most recently completed batch of epics.
- Read the matching implementation files in `packages/engine/src/` and any relevant package sources.

### 2. Evaluate code quality

For each epic in scope, inspect the implementation and assess:

- Type quality and absence of `any`
- Architectural cleanliness and separation of concerns
- Redundancy, copy-paste, or sloppy structure
- Sensible state and data structure choices
- Correct and complete effect-cache contributions

### 3. Evaluate test quality

Read the matching tests and assess:

- Whether tests verify game behavior instead of trivial execution
- Edge-case coverage
- Cross-manager integration coverage
- Obvious behavioral gaps

### 4. Audit `agent-docs/PARITY.md` directly

Treat `agent-docs/PARITY.md` as the baseline record and audit it.

Run the effect-key producer grep:

```bash
grep -o '"[a-zA-Z][a-zA-Z0-9]*":\s*[0-9.-]' packages/engine/src/workshop.ts packages/engine/src/science.ts packages/engine/src/religion.ts packages/engine/src/space.ts packages/engine/src/buildings.ts | grep -oE '"[a-zA-Z][a-zA-Z0-9]*"' | sort -u
```

Run the effect-cache consumer grep:

```bash
grep -rn "effectCache\[" packages/engine/src/ | grep -v "test"
```

Then:

- Find produced keys with no consumer.
- Compare PARITY building rows against both `packages/engine/src/buildings.ts` and `legacy/js/buildings.js`.
- Compare tracker claims against live runtime behavior, not just definitions.
- Verify summary counts if anything looks stale.
- Add newly discovered gaps to `agent-docs/PARITY.md` with `❌` status.
- File significant missing behavior as stories in the relevant epic.

Additional mandatory checks:

- If a row is marked `✅`, verify producer, consumer, action surface, UI surface, and at least one regression test.
- If a legacy feature exposes controls (`on/off`, rename, quantity buttons, automation toggles, done-state), verify those controls exist in the rewrite or downgrade the row.
- For production-sensitive systems, use a representative imported or synthetic save and inspect actual per-tick values and consumption.
- Treat live gameplay behavior as stronger evidence than tracker prose. If behavior and tracker disagree, fix the tracker first.

### 5. Deep-read legacy parity

- Read the corresponding `legacy/js/` files and matching `legacy/test/` coverage.
- Compare formulas, named items, unlock chains, and edge cases.
- Explicitly check player-visible control surfaces, not just effect-cache formulas.
- File any accidentally missing features as stories.

### 6. Identify architectural risks

Look for scaling risks such as:

- Fragile state update patterns
- Effect ordering assumptions
- Missing boundary validation
- Cross-system interactions not modeled yet

If a risk should be deferred, document it in `agent-docs/DECISIONS.md`.

### 7. Report in conversation

Output a structured report with these sections:

```markdown
## Sanity Check — Epics <X–Y> — <date>

### Code quality: <PASS|WARN|FAIL>

### Test quality: <PASS|WARN|FAIL>

### Parity tracker: <PASS|WARN|FAIL>

### Feature parity gaps found

### Architectural risks

### Overall verdict
```

If any category is `FAIL`, treat it as blocking for the next batch and fix or document it before moving on.
