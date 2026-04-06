---
name: sync-docs
description: Sync agent-docs with actual repo state. Use when the user asks to refresh progress tracking, reconcile docs with commits and tests, or prepare for a self-rate.
---

# Sync Docs

Use this skill to update `agent-docs/` without changing production code. Keep behavior aligned with `.claude/skills/sync-docs/SKILL.md`.

## Workflow

### 1. Collect current state

- Run `git log --oneline -30`.
- Run the relevant tests and capture pass, fail, and coverage information if available.
- Read `agent-docs/epics/*/STORIES.md` and count checked versus unchecked acceptance criteria.
- Search `packages/` for `TODO` and `FIXME`.

### 2. Update `agent-docs/PROGRESS.md`

For each epic:

- Update `Stories: X/Y complete`
- Set status to `Not Started`, `In Progress`, or `Complete`
- Add or refresh `Last synced: <date>`

### 3. Flag blockers

Identify stories that appear stuck, especially epics that have had more than five commits without acceptance criteria moving.

### 4. Summarize

Report:

```text
Sync complete — <date>
Epics: X complete, Y in progress, Z not started
Stories: X/Y complete across all epics
Coverage: <per-package or "not yet available">
Open TODOs: N
Blockers: <list or "none">
```
