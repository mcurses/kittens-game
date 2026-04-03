# Epic: Population/Resource Decoupling — Notes

## Legacy Behavior Summary

- Legacy still declares a transient `kittens` resource in `legacy/js/resources.js`, but it is not treated as a normal stockpile resource.
- In `legacy/game.js`, every update overwrites that entry from village population:
  - `kittens.value = this.village.getKittens()`
  - `kittens.maxValue = this.village.sim.maxKittens`
- Kitten growth itself is simulated only in village code via `kittensPerTickBase`, `kittenGrowthRatio`, `nextKittenProgress`, and `maxKittens`.
- The resource-table row is a legacy UI artifact, not the authoritative source of population truth.

## Investigation Findings

- Live `slot=new` state exposed the bug directly:
  - `village.kittens = 12`
  - `resources.kittens.value = 6217.28...`
  - `resources.kittens.perTick = 0.01`
- The rewrite currently includes `"kittens"` in `RESOURCE_NAMES`, so `ResourceManager` treats it like any other resource.
- `VillageManager.updateEffects()` emits `kittensPerTickBase = 0.01`, which `ResourceManager` then consumes as if it were a stockpile production effect for `resources.kittens`.
- Result: the rewrite has two mutable kitten concepts:
  - real population in `state.village.kittens`
  - phantom stockpile in `state.resources.kittens`
- The web resource tab shows the phantom row because visibility logic treats `kittens` as a normal visible resource.

## Key Decision

Do not preserve the legacy implementation detail.

The rewrite should preserve gameplay, not the awkward internal shape:
- `village` remains the sole authoritative owner of population
- generic resource ticking/storage semantics should not apply to kittens
- the resources tab should not render a `kittens` row
- any UI that still needs kitten progress/ETA should derive it from village state directly

## Implementation Summary

- Removed `"kittens"` from `packages/engine/src/resources.ts` so the generic resource manager no longer simulates kitten population as a stockpile.
- Tightened `deserialize()` and `ResourceManager.load()` behavior so stale serialized `resources.kittens` payloads are dropped instead of surviving save-load.
- Re-anchored achievement and badge conditions to village population / `effectCache.maxKittens` instead of `resources.kittens`.
- Added a client-side `ResourcePanel` guard so even legacy-shaped serialized data cannot render a phantom `kittens` resource row.
- Kept village-facing displays authoritative: `VillagePanel` continues to read `village.kittens` and `effectCache.maxKittens`.

## Gotchas & Edge Cases

- Legacy achievements often read `resPool.get("kittens")`, but in legacy that value is synchronized from village each update. In the rewrite, any such checks should be re-anchored to village state or a dedicated helper.
- `jobsVisible` and similar UI unlock conditions currently allow population-derived visibility through the `kittens` resource path. That behavior should survive the cleanup without relying on a visible resource row.
- Save/load migration needs care so an old serialized `resources.kittens` payload cannot keep resurrecting the phantom state after the cleanup.

## Open Questions

- Whether zebra-related transient population mirrors should be handled with the same cleanup pattern in a follow-up.
