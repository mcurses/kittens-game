# Epic 29 — Critical Bug Fixes

**Status:** In Progress
**Started:** 2026-03-31
**Legacy refs:** packages/engine/src/legacy-migration.ts, packages/server/src/

Fix two confirmed bugs found in the Year 10527 live parity audit. Both block reliable save import testing and must be resolved before further parity work.

Legacy reference: `legacy/js/time.js`, `packages/engine/src/legacy-migration.ts`, `packages/server/src/`

---

## Story 29-01 — Fix VSU migration `unlocked:false` bug

**Why it exists**: `legacy-migration.ts:migrateTime()` calls `bool(item.unlocked)` which defaults to `false` when the legacy save omits an explicit `unlocked:true` field. Legacy saves only store `unlocked:true` when a building is manually unlocked — buildings that were constructed and are "obviously" unlocked are not stored with that flag. Result: all VSU (Void Space Upgrade) items with `val > 0` have `unlocked:false` in the migrated state, and the UI hides the entire Void Space section.

**Confirmed affected items** (Year 10527 save): `voidHoover(val:4, unlocked:false)`, `voidRift(val:7, unlocked:false)`, `chronocontrol(val:2, unlocked:false)`.

**Fix**: In `migrateTime()`, when `item.val > 0` force `unlocked: true` for VSU items. Same pattern should apply to CFU items for consistency.

**ACs**:
- [x] `migrateTime()` forces `unlocked: true` when `item.val > 0` for both `cfus` and `vsus`
- [x] Legacy save with VSU `val:4` and no explicit `unlocked` field produces `unlocked:true` in migrated state
- [x] Test: migrated state with vsu `val:3, no unlocked field` → `unlocked:true`
- [x] Test: migrated state with vsu `val:0, no unlocked field` → `unlocked:false` (not unlocked if never built)
- [ ] PARITY.md VSU migration bug section updated

---

## Story 29-02 — Fix auto-tick not starting after save import

**Why it exists**: When a legacy save is imported, the server writes the migrated `SerializedGameState` (with `tick:0`, `effectCache:{}`) to the slot's SQLite row. The tick loop for that slot must then be started (or restarted) so the game actually advances. Confirmed: after the Year 10527 import, the slot's calendar stayed frozen at Day 48, Autumn, Year 10527 across an extended session — `tick:0` was still in the persisted state.

**Root cause investigation needed**: Check the server's slot-management code to understand how tick loops are started. The import endpoint likely writes the new state but does not signal the tick scheduler to begin ticking the slot. Look at how a freshly-created slot gets its tick loop started and replicate that in the import code path.

**ACs**:
- [x] After a successful POST to `/api/game/import-legacy`, the slot's tick loop starts (or restarts) automatically
- [x] Within 1 second of import, `tick` in the persisted state is > 0 (confirming the loop fired)
- [ ] Calendar advances on subsequent WebSocket pushes — day increments are visible to the client (manual verification)
- [x] If the slot already had a running tick loop before import, it continues without duplicating (no double-tick)
- [x] Test: `getOrCreate` for new slot → advance timers 250ms → tick > 0
- [ ] PARITY.md engine bootstrap bug section updated
