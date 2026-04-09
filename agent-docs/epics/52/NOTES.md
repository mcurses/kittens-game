# Epic 52 — Toolbar / HUD Parity — Notes

## Context
UI_PARITY.md shows 5 ❌ and 1 ⚠️ items in Toolbar. Currently no dedicated toolbar component exists in the rewrite. This epic requires creating one.

## Key legacy references
- `legacy/js/toolbar.jsx.js` — full toolbar rendering
- `legacy/js/buildings.js` — energy production/consumption calculations

## Dependencies
- Epic 20 (Game UI) — ✅ Complete
- Epic 25 (UI Completeness) — ✅ Complete

## Scope notes
- Happiness display currently lives in VillagePanel — may want to duplicate/move to toolbar
- Energy system touches many buildings; verify effect cache has all energy keys
