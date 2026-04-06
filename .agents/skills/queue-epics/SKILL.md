---
name: queue-epics
description: Run one or more kittens-mcp epics in order using the shared epic-start, TDD, self-rate, and sanity-check workflow. Use when the user wants a multi-epic batch such as 10-12 or 10,12,14.
---

# Queue Epics

Use this skill when the user asks to run multiple epics end to end. Keep behavior aligned with `.claude/skills/queue-epics/SKILL.md`.

Parse the user input as either:

- A range like `10-12`
- A comma-separated list like `10,12,14`

Look up each requested epic in `AGENTS.md`.

## Workflow

For each epic in order:

1. Run the `epic-start` workflow for that epic.
2. Execute the full TDD loop from that skill: failing tests, minimum implementation, passing build, commit, acceptance criteria updates.
3. Run the `self-rate` workflow.
4. If any dimension scores `<= 2`, stop, fix the problems, and rerun `self-rate`.
5. Only continue when every dimension is `>= 3`.
6. Mark the epic `Complete` in `agent-docs/EPICS.md`.

After the queue is complete:

1. Run the `sanity-check` workflow across the completed batch.
2. If any category is `FAIL`, fix it before reporting completion.
3. Summarize completed epics, total tests, overall coverage, any self-rate fix cycles, and the sanity-check verdict.
