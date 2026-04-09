# Epic 48 — Village Management Parity — Notes

## Context
UI_PARITY.md shows 11 ❌ items in Village/Jobs — the single largest gap. This epic covers the full census, government, leader, loadouts, and remaining management actions.

## Key legacy references
- `legacy/js/village.js` — census, government, kitten management, job loadouts
- `legacy/js/jsx/left.jsx.js` — village panel rendering

## Dependencies
- Epic 06 (Village/Population/Jobs) — ✅ Complete
- Epic 35 (UI QoL Parity) — ✅ Complete (bulk job ±5/±All already done)

## Scope notes
- Individual kitten simulation (traits, skills, XP) may need engine additions beyond current village state
- Leader system requires engine support — may need to split engine work into a prerequisite story
