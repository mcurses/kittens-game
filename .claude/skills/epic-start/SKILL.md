---
name: epic-start
description: Bootstrap a new epic for the kittens-mcp rewrite. Creates agent-docs scaffold, reads legacy code, writes stories, then starts the TDD implementation loop.
argument-hint: [epic-name]
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, Bash
---

# Epic Start: $ARGUMENTS

You are bootstrapping epic "$ARGUMENTS" for the kittens-mcp rewrite. Follow agents.md strictly.

## Step 1 — Check prerequisites and fix outstanding action items

Read `agents.md` epic backlog. Find epic "$ARGUMENTS" and check its prerequisites are marked complete in `agent-docs/PROGRESS.md`. If not, stop and tell the user which epics need to finish first.

Read `agent-docs/SELF_RATINGS.md` and find the most recent "Action items for next epic" section. **Execute every unchecked item (`- [ ]`) before continuing.** These are mandatory fixes left over from the previous self-rate — do not skip them. Mark each item as `- [x]` once done. Only proceed to Step 2 after all action items are resolved.

## Step 2 — Create scaffold

Create `agent-docs/epics/$ARGUMENTS/STORIES.md`:

```markdown
# Epic: $ARGUMENTS

**Status:** In Progress
**Started:** <today>
**Legacy refs:** <list from agents.md>

---
<!-- Stories go here — see template below -->
```

Create `agent-docs/epics/$ARGUMENTS/NOTES.md`:

```markdown
# Epic: $ARGUMENTS — Notes

## Legacy Behavior Summary
<!-- fill in after reading legacy code -->

## Key Decisions

## Gotchas & Edge Cases

## Open Questions
```

## Step 3 — Read legacy code

Read all legacy files listed in agents.md for this epic. Summarize key behavior in NOTES.md. Note any cryptic or surprising logic.

Also read `legacy/test/` for any test files covering this domain. The existing test suite is the most reliable specification of expected behavior — use it to inform ACs rather than deriving expected values by hand from source.

## Step 4 — Write stories

For each meaningful unit of behavior found in legacy, write a story in STORIES.md using this format:

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

Be thorough — missed stories mean missed features.

## Step 5 — Register in PROGRESS.md

Add entry to `agent-docs/PROGRESS.md`:
```
## Epic: $ARGUMENTS
Status: In Progress | Started: <date>
Stories: 0/N complete
```

## Step 6 — Start TDD loop

For each story in order:
1. Write failing Vitest tests covering all ACs
2. Run tests — confirm red
3. Implement minimum code to pass
4. Run `pnpm turbo build` — confirm build passes
5. `git commit -m "feat(<scope>): <summary>"`
6. Mark story ACs as checked
7. Move to next story

If the story adds a new `GameAction` type, also add it to `packages/api-spec/openapi.yaml`'s `GameActionRequest` discriminated union in the same commit. The spec must stay in sync with the engine — do not defer to Epic 17.

After all stories pass, add a cross-manager integration test: one test that runs a full multi-tick loop with all registered managers and asserts correct aggregate state. Commit it separately.

Then run `/self-rate` and record results. Update PROGRESS.md to mark epic complete.
