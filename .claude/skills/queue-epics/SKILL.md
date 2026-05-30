---
name: queue-epics
description: Run one or more epics in order using the full epic-start → TDD → self-rate workflow. Accepts a range (10-12) or a list (10,12,14).
argument-hint: <range-or-list>  e.g. 10-12 or 10,12,14
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, Bash
---

# Queue Epics: $ARGUMENTS

Parse "$ARGUMENTS" as either a range (`10-12` → epics 10, 11, 12) or a comma-separated list (`10,12,14` → epics 10, 12, 14). Look up each epic number in `agent-docs/EPICS.md`.

For each epic in order:

1. Run `/epic-start <name>` — this checks prerequisites, executes outstanding action items, reads legacy code (including `legacy/test/`), and writes stories.
2. Execute the TDD loop from `epic-start` Step 6: failing tests → implement → build passes → commit → check off ACs. Repeat per story.
3. Run `/self-rate` — build + tests + coverage + audit + score.
4. If any dimension scored ≤ 2: stop, fix it, re-run `/self-rate`. Do not advance until all dimensions are ≥ 3.
5. If all dimensions ≥ 3: mark the epic ✅ Complete in `agent-docs/EPICS.md`, then proceed to the next epic in the queue.

When all epics in the queue are done, run `/sanity-check` across the completed batch. If any category is FAIL, fix it before reporting completion.

Then output a one-paragraph summary: epics completed, total tests, overall coverage, any dimensions that needed a fix cycle, and the sanity check verdict.
