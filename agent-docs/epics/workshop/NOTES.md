# Epic: workshop — Notes

## Legacy Behavior Summary

### Overview
`WorkshopManager` in `legacy/js/workshop.js` manages two distinct systems:
1. **Upgrades** — one-time purchasable upgrades that permanently modify effects (e.g., `catnipJobRatio`, `woodJobRatio`, `barnRatio`). ~100 upgrades plus ~4 zebra upgrades.
2. **Crafts** — player-triggered recipes that convert raw resources into refined resources (e.g., wood→beam, iron→plate, coal+iron→steel). ~20 crafts.

### Upgrade System
- Upgrade defs live in `upgrades[]` array (lines 7–1987).
- Each upgrade has: `name`, `prices[]`, optional `effects: Record<string,number>`, optional `unlocks: {upgrades: string[]}`.
- Some upgrades have `calculateEffects(self, game)` that compute dynamic effects — **deferred** (e.g., compositeBow depends on weaponEfficency from challenges).
- Some upgrades have `handler(game)` that run imperative side-effects on purchase — **deferred** (e.g., advancedRefinement changes craft prices, seti locks a console filter).
- Some upgrades have `upgrades: {buildings: [...], jobs: [...]}` — these mark that the building/job "gets upgraded" (UI only in legacy, not a state field we need). Deferred.
- **Initial unlocked upgrades** (from `resetState()` lines 2344–2357): `mineralHoes`, `ironHoes`, `mineralAxes`, `ironAxes`, `stoneBarns`, `reinforcedBarns`.
- Unlock chain: `mineralHoes → ironHoes`, `mineralAxes → ironAxes`, `steelSaw → titaniumSaw → alloySaw`, `reinforcedBarns → titaniumBarns`, `reinforcedWarehouses → ironwood`, etc.

### Craft System
- Craft defs live in `crafts[]` array (lines 1994–2207).
- Each craft has: `name`, `prices[]`, optional `tier` (1–5), `progressHandicap`, optional `ignoreBonuses` (only `wood`).
- **Craft output = `amt * (1 + craftRatio)`** where `craftRatio = getResCraftRatio(res)` (accounts for `craftRatio` effect from policies/upgrades and leader bonuses).
- Wood crafting is special: `ignoreBonuses: true` — uses only `refineRatio` and `refinePolicyRatio`, not the global `craftRatio`.
- CRAFT action deducts input prices and adds output resource.
- **Initial unlocked crafts** (from `resetState()` lines 2360–2378): `wood`, `beam`, `slab`, `plate`, `gear`, `scaffold`, `manuscript`, `megalith`.
- Engineer auto-crafting (`craftByEngineers`, `getConsumptionEngineers`) — **deferred** to future epic (requires village engineer job, tCraftRatio effects).

### Save/Load/Reset
- `save()` stores `upgrades`, `crafts`, `zebraUpgrades` with `name/unlocked/researched` (upgrades) and `name/unlocked/value/progress` (crafts).
- `load()` restores flags and re-runs `handler` and `unlock` for researched upgrades.
- `resetState()` sets specific upgrades and crafts as unlocked (6 upgrades, 8 crafts), clears craft `value`/`progress`, resets wood craft price to 100 catnip.

### Effect Integration
- `WorkshopManager` contributes to effect cache via `setEffectsCachedExisting()` / `registerMeta("research", ...)` pattern — all researched upgrade effects are summed and added to `globalEffectsCached`.
- `effectsBase` dict (`oilMax`, `scienceMax`, `cultureMax`, `faithMax`) has dynamic computation in `fastforward()` — **deferred** to later epics (depends on religion, prestige, space).

## Key Decisions

1. **Skip `calculateEffects` upgrades for now**: `compositeBow`, `crossbow`, `railgun` (depend on challenge weaponEfficency), `unicornSelection` (depends on challenge state), `chronoforge` (time mechanics). These are deferred. Store them but contribute only the static `effects` (which are set to 0 for those with `calculateEffects`).
2. **Skip `handler` upgrades for now**: `advancedRefinement`, `seti` — their side-effects require systems not yet implemented. Store them but skip handler on load.
3. **Skip engineer auto-crafting**: `craftByEngineers` requires the engineer job from village and `tCraftRatio` effects. Deferred to later.
4. **Skip zebraUpgrades**: Require diplomacy/zebra system. Deferred to Epic 14.
5. **Craft ratio for CRAFT action**: Use `craftRatio` from effectCache (`game.getEffect("craftRatio")`). Wood special case (`ignoreBonuses`) → use 0 craft ratio (no bonus).
6. **`WorkshopState` slice in `GameState`**: Add `workshop: WorkshopState` with `upgrades: Record<string, {unlocked: boolean, researched: boolean}>` and `crafts: Record<string, {unlocked: boolean}>`.

## Gotchas & Edge Cases

- Wood craft is tier 1 with `ignoreBonuses: true` — it ignores `craftRatio`. This means crafting 1 wood always yields exactly 1 wood (no bonus). The `advancedRefinement` upgrade changes wood prices at runtime — deferred.
- Some upgrade `effects` objects are empty `{}` but upgrades are still purchasable. Effects contribution to cache: `{}` means no cache contribution.
- `reinforcedBarns` and `reinforcedWarehouses` both need `beam` and `slab` (refined resources) — these are crafted resources, so craft system must work first.
- `stoneBarns` has prices including `iron:50`, `science:500` but also unlocks `reinforcedBarns` (it does NOT have `unlocks` — checked: reinforcedBarns IS in the initial unlocked set in resetState).
- The `getCraftPrice` method modifies ship price based on satellite count (satnav effect) and manuscript price based on tradition policy — **deferred** for this epic.
- `advancedRefinement` upgrade modifies `getCraft("wood").prices` at runtime — our pure state model cannot support this directly. Handled by tracking `advancedRefinement` researched flag and applying price override in CRAFT action. Deferred.

## Open Questions

- Should `WorkshopState.crafts` track craft `value` (engineer assignment) and `progress`? For now: no — engineer system is deferred. Only `unlocked`.
- Should we handle `upgrades: {buildings: [...]}` field at all? In legacy this triggers a UI "upgrade building" effect. For the engine, it's irrelevant since building effects come from buildings.ts directly.
