---
name: epic-start
description: Bootstrap a new kittens-mcp epic. Use when the user asks to start an epic, scaffold its docs, read the matching legacy code, write stories, and begin the mandatory TDD loop.
---

# Epic Start

Use this skill when the user asks to start an epic or continue the standard epic bootstrap workflow for this repo.

Follow `AGENTS.md` / `agents.md` strictly. Keep behavior aligned with `.claude/skills/epic-start/SKILL.md`.

If the user provides an epic identifier or name, treat that as the target epic.

## Workflow

### 1. Check prerequisites and carry forward required action items

- Read the epic backlog in `AGENTS.md`.
- Find the target epic and verify its prerequisites are complete in `agent-docs/PROGRESS.md`.
- Read the most recent `Action items for next epic` section in `agent-docs/SELF_RATINGS.md`.
- Execute every unchecked `- [ ]` action item before starting the new epic.
- Mark each completed carry-forward item as `- [x]`.
- If prerequisites are not satisfied, stop and report exactly which epics or fixes block progress.

### 2. Create the epic scaffold

Create `agent-docs/epics/<epic-name>/STORIES.md` with:

```markdown
# Epic: <epic-name>

**Status:** In Progress
**Started:** <today>
**Legacy refs:** <list from AGENTS.md>

---
<!-- Stories go here — see template below -->
```

Create `agent-docs/epics/<epic-name>/NOTES.md` with:

```markdown
# Epic: <epic-name> — Notes

## Legacy Behavior Summary
<!-- fill in after reading legacy code -->

## Key Decisions

## Gotchas & Edge Cases

## Open Questions
```

### 3. Read legacy implementation and legacy tests

- Read the legacy files listed in `AGENTS.md` for the epic.
- Read any matching files in `legacy/test/` for that domain before writing new tests.
- Summarize key behavior, formulas, and edge cases in `NOTES.md`.

### 4. Write stories before implementation

Write stories in `STORIES.md` using:

```markdown
## Story: <title>

**As a** player/server/client
**I want** <what>
**So that** <why>

### Acceptance Criteria
- [ ] Given <context>, when <action>, then <outcome>

### Legacy Reference
- `legacy/js/<file>.js` lines <N>-<M>

### Status: [ ] Tests | [ ] Impl | [ ] Rated
```

Be thorough. Missed stories create parity gaps later.

### 5. Register the epic in progress tracking

Add or update the epic entry in `agent-docs/PROGRESS.md`:

```text
## Epic: <epic-name>
Status: In Progress | Started: <date>
Stories: 0/N complete
```

### 6. Start the TDD loop

For each story in order:

1. Write failing tests for every acceptance criterion.
2. Run tests and confirm they fail for the expected reason.
3. Implement the minimum code to pass.
4. Run `pnpm turbo build` and confirm it passes.
5. Commit with a small descriptive commit message.
6. Check off acceptance criteria and story status.

If the work adds a new `GameAction` type, update `packages/api-spec/openapi.yaml` in the same epic and the same implementation cycle. Do not defer API-spec changes.

After all stories pass:

1. Add a cross-manager integration test covering the full tick loop.
2. Commit it separately if appropriate.
3. Run the `self-rate` workflow.
4. Update `agent-docs/PROGRESS.md` and `agent-docs/EPICS.md` to mark the epic complete.
