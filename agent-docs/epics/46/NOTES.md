# Epic: 46 — Notes

## Legacy Behavior Summary

Legacy treats a tech's `unlocks` object as a general signal and routes it through `game.unlock()`, not a science-only subset.

- `legacy/js/science.js:2349-2357` replays `this.game.unlock(tech.unlocks)` for every researched tech during load.
- `legacy/js/workshop.js:2413-2421` replays `this.game.unlock(upgrade.unlocks)` for every researched workshop upgrade during load.
- `legacy/game.js:5324-5358` applies the unlock by type:
  - `tabs` become visible
  - `buildings` become `unlockable`
  - most other types, including workshop upgrades and crafts, become `unlocked`

That means researched techs such as `mining`, `metal`, `math`, `construction`, `currency`, `writing`, and `steel` must unlock workshop entries immediately and again on load.

## Live Symptom That Filed This Epic

The reported live save is `slot=new`.

Observed rewrite state from `GET /api/game/state?slot=new` on 2026-04-07:

- researched techs include:
  - `calendar`
  - `agriculture`
  - `archery`
  - `mining`
  - `metal`
  - `animal`
  - `civil`
  - `math`
  - `construction`
  - `engineering`
  - `currency`
  - `writing`
  - `philosophy`
  - `steel`
- unlocked workshop upgrades were only:
  - `mineralHoes`
  - `ironHoes`
  - `mineralAxes`
  - `ironAxes`
  - `stoneBarns`
  - `reinforcedBarns`
  - `titaniumBarns`

Expected additional unlocks implied by those researched techs:

- upgrades:
  - `advancedRefinement`
  - `bolas`
  - `celestialMechanics`
  - `coalFurnace`
  - `combustionEngine`
  - `compositeBow`
  - `deepMining`
  - `goldOre`
  - `huntingArmor`
  - `register`
  - `reinforcedSaw`
  - `reinforcedWarehouses`
  - `steelArmor`
  - `steelAxe`
- crafts:
  - `compedium`
  - `parchment`
  - `steel`

## Current Rewrite Root-Cause Hypothesis

`packages/engine/src/science.ts` currently propagates only:

- `unlocks.tech`
- `unlocks.policies`
- `unlocks.buildings`

It does not propagate:

- `unlocks.upgrades`
- `unlocks.crafts`

So live research under-unlocks workshop state, and plain save-load/import can only be correct if some other path replays those unlocks. Right now that replay appears incomplete as well.

## Key Decisions

- Track this as a separate epic from Epic 45. The reported bug affects a normal live save (`slot=new`), not just imported legacy saves.
- Treat this as both a science parity bug and a workshop parity bug. The user-visible symptom is in the workshop panel, but the likely first fix point is science unlock propagation.
- Prefer a small, explicit regression over a broad state diff. The highest-signal assertion is the exact missing upgrade/craft names for a researched-tech set.

## Gotchas & Edge Cases

- Legacy `buildings` unlocks use `unlockable`, not direct visibility. Workshop unlocks should not be forced through that same path.
- Some workshop upgrades unlock downstream upgrades. Load-time replay must preserve those chains too.
- The save/load fix should not accidentally unlock items whose legacy `evaluateLocks()` conditions are still unsatisfied.

## Open Questions

- Is the missing live `slot=new` state caused entirely by `applyResearch()` omissions, or does `ScienceManager.load()` also need explicit replay of tech unlocks into workshop state?
- Do any policy unlocks also need the same generalized replay path for workshop surfaces?

## Reopen Findings — 2026-04-08

The live `slot=new` report was re-checked after Epic 46 had been marked complete. The save still loads with the old under-unlocked workshop state:

- unlocked upgrades:
  - `mineralHoes`
  - `ironHoes`
  - `mineralAxes`
  - `ironAxes`
  - `stoneBarns`
  - `reinforcedBarns`
  - `titaniumBarns`
- unlocked crafts:
  - `wood`
  - `beam`
  - `slab`
  - `plate`
  - `gear`
  - `scaffold`
  - `manuscript`
  - `megalith`

This is not just stale UI. `GET /api/game/state?slot=new` shows the researched tech set and the under-unlocked workshop data together.

The concrete failure mode is the real server deserialize sequence:

- `packages/server/src/store.ts` loads managers in this order: `ScienceManager`, then `WorkshopManager`
- `packages/server/src/store.ts` `_fullDeserialize()` calls each manager's `load()` in that order
- `packages/engine/src/science.ts` `ScienceManager.load()` correctly replays tech-driven workshop unlocks into `state.workshop`
- `packages/engine/src/workshop.ts` `WorkshopManager.load()` then reconstructs workshop state from the saved workshop slice and overwrites those repaired unlocks

Reproduction via an isolated Bun check confirmed the overwrite:

- after `ScienceManager.load()`, the expected Epic 46 upgrades/crafts are unlocked
- after `WorkshopManager.load()` with the stale saved workshop slice from `slot=new`, the unlock set collapses back to the old seven upgrades and eight initial crafts

Conclusion: Epic 46 is not complete for existing saves or the true server load path. The missing coverage is a full `GameStateStore._fullDeserialize()` regression, not just isolated manager tests.

## Fix Results — 2026-04-08

The reopened load-path bug is now fixed in code.

- `packages/engine/src/workshop.ts` `WorkshopManager.load()` now starts from `state.workshop` instead of `createInitialWorkshop()`, so workshop unlocks replayed earlier in deserialize are preserved.
- Saved workshop booleans now merge with current replayed state rather than replacing it, which heals stale existing saves.
- `WorkshopManager.load()` now replays downstream researched-upgrade unlock chains (`upgrade.unlocks.upgrades`) after metadata restore, matching `legacy/js/workshop.js:2411-2419`.
- `packages/server/src/store.test.ts` now includes a full `GameStateStore.init()` regression for the stale `slot=new` shape.
- `packages/engine/src/workshop.test.ts` now includes a regression proving researched workshop upgrades replay downstream unlocks during load.
- A practical Bun replay of the current exported `GET /api/game/save?slot=new` payload through the patched `GameStateStore` now yields no missing expected workshop upgrades or crafts.

Remaining work before the epic can be closed cleanly:

- Re-verify the player-facing workshop panel for the healed `slot=new` state after the running server/client picks up the patch.
- Reconfirm the legacy-import path at the same full-store level instead of only via isolated manager tests.
