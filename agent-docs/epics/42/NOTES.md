# Epic: 42 — Notes

## Legacy Behavior Summary

- `stoneBarns` adds `barnRatio: 0.75` in `legacy/js/workshop.js`.
- Legacy does not treat `barnRatio` as a cosmetic effect. `resPool.addBarnWarehouseRatio()` in `legacy/js/resources.js` multiplies storage-building `*Max` effects before they are surfaced to the game.
- `woodMax`, `mineralsMax`, and `ironMax` are multiplied by both `1 + barnRatio` and `1 + warehouseRatio`.
- `coalMax`, `titaniumMax`, and `goldMax` are multiplied only by `1 + warehouseRatio`.
- `catnipMax` gets a partial `barnRatio * 0.25` multiplier only when `silos` is researched.
- Barn, warehouse, and harbor all call the ratio helper in legacy `calculateEffects`, so workshop storage upgrades affect all three building types.

## Key Decisions

- Treat this as a parity bug in the storage-cap consumer path, not as an upgrade-definition bug. `stoneBarns` already exists and already emits `barnRatio`.
- Keep the fix centralized so all storage buildings share the same ratio application rules instead of duplicating bespoke multipliers in each building definition.
- Fix the server action path in the same epic because stale serialized `resources[*].maxValue` values would otherwise hide the parity fix until a later sync path runs.

## Implementation Summary

- `BuildingManager.updateEffects()` now applies legacy `barnRatio` / `warehouseRatio` math to storage-building `*Max` outputs before they are added to the effect cache.
- Warehouse catnip storage now follows legacy `silos` gating instead of behaving like a permanently-zero path.
- `GameStateStore.applyGameAction()` now calls `syncResourceCaps()` after rebuilding the effect cache, so action responses serialize fresh caps immediately.
- Regression coverage was added in engine building tests, an engine cross-manager parity test, and server store tests.

## Gotchas & Edge Cases

- `stoneBarns` is not supposed to raise every storage cap. In legacy it affects wood, minerals, and iron directly; catnip only changes with `silos`.
- `buildEffectCache()` currently passes a single state snapshot to each manager, so storage-ratio consumption should not depend on a previously rebuilt cache inside the same call.
- The server already sanitizes caps on load, which means action responses and load responses currently behave differently.

## Open Questions

- None at epic start.
