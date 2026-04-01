---
name: self-rate
description: Run the kittens-mcp self-rating workflow. Use when the user asks for a self-rate, milestone audit, or epic closeout that should score tests, parity, API coverage, code quality, and docs freshness.
---

# Self Rate

Use this skill for the repo's structured self-evaluation. Keep behavior aligned with `.claude/skills/self-rate/SKILL.md`.

## Workflow

### 1. Build, test, and collect coverage

1. Run `pnpm turbo build`.
2. If the build fails, rate test coverage as `1` and stop. A failing build blocks the rest.
3. Run `pnpm turbo test`.
4. Capture pass, fail, and skip counts plus line coverage by package when available.
5. If test infrastructure is missing, note that and score coverage as `1`.

### 2. Audit code quality issues

Search `packages/` for:

- `any` type usage
- `TODO`, `FIXME`, `HACK`
- `it.skip`, `test.todo`, `xit`

List each finding with file and line number.

### 3. Audit API-spec completeness

1. Check that every implemented route in `packages/server/` appears in `packages/api-spec/openapi.yaml`.
2. Check that every `GameAction` in `packages/engine/src/actions.ts` appears in the `GameActionRequest` union in the API spec.
3. Treat missing action types as failures, not future work.

### 4. Audit parity tracker freshness

Read `agent-docs/PARITY.md` and verify:

- New buildings, effect keys, or production paths added this epic are reflected there.
- At least two rows marked `✅` are actually wired end-to-end in code.
- For recently touched parity work, verify both categories:
  - one production/consumption path
  - one action or UI control path
- Summary counts still match reality.
- Any row marked `✅` but missing a producer, consumer, action surface, UI surface, save/load path, or parity test must be downgraded to `⚠️` immediately.

If PARITY should have changed and did not, rate this dimension as a failure.

### 5. Audit docs freshness

Verify:

- `agent-docs/PROGRESS.md` matches actual story completion
- `agent-docs/DECISIONS.md` includes new architectural decisions
- Completed stories have checked acceptance criteria
- `agent-docs/EPICS.md` reflects actual epic status

Update stale status markers while running this workflow.

### 6. Spot-check feature parity

Pick three recently completed stories and compare the implementation against legacy code and edge cases.

For each selected story, explicitly answer:

- What exact legacy behavior exists?
- Where is the producer in the rewrite?
- Where is the consumer in the rewrite?
- What action or UI control exists for the player?
- What test proves parity?

If any answer is missing, lower Feature parity and record it as an action item instead of assuming completeness.

### 7. Score the milestone

Score each dimension from `1` to `5`:

- Test coverage
- No skipped tests / no TODOs
- Feature parity
- API spec completeness
- Code quality
- Docs freshness
- Commit hygiene
- Overall average

Any dimension `<= 2` is blocking and must be fixed before the next epic.

Scoring rule for Feature parity:

- `5` requires current PARITY rows plus verified producer, consumer, control surface, and regression tests for the checked items.
- Do not award `5` to features that are only partially ported or intentionally deferred.

### 8. Record the report

Append a structured entry to `agent-docs/SELF_RATINGS.md`:

```markdown
## <Epic Name> — <date>

<score table>

### What went well

### What to improve

### Action items for next epic
```
