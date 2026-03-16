---
name: sync-docs
description: Sync agent-docs/PROGRESS.md with actual project state. Reads git log and test results, updates story completion counts and coverage metrics. Run before /self-rate.
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---

# Sync Docs

Sync `agent-docs/` with current project reality. Read, do not change production code.

## Step 1 — Collect state

- Run `git log --oneline -30` for recent commits
- Run tests and capture pass/fail counts + coverage (if available)
- Read all `agent-docs/epics/*/STORIES.md` — count checked vs unchecked ACs per epic
- Grep `packages/` for TODO/FIXME count

## Step 2 — Update PROGRESS.md

For each epic:
- Update `Stories: X/Y complete` counts
- Set status: Not Started / In Progress / Complete
- Add `Last synced: <date>`

## Step 3 — Flag blockers

List stories that appear stuck: in-progress for >5 commits with no AC checks.

## Step 4 — Output summary

```
Sync complete — <date>
Epics: X complete, Y in progress, Z not started
Stories: X/Y complete across all epics
Coverage: <per-package or "not yet available">
Open TODOs: N
Blockers: <list or "none">
```
