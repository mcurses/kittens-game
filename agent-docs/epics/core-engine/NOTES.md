# Epic 03: Core Engine — Implementation Notes

## Legacy Behavior Summary

The legacy engine (game.js + core.js) is a single-threaded, timer-driven game loop running at 5 ticks/second. Key architecture:

1. **Tick loop** (`game.js:3891` `update()`): decrements `ticksBeforeSave`, calls `timer.update()` (which fires registered frequency-based events), then calls `updateModel()`. `updateModel` calls each manager's `update()` in a fixed order: resPool → bld → village → workshop → diplomacy → religion → space → challenges.

2. **Effect system** (`core.js:125` `updateEffectCached()`): every 5 ticks, `updateCaches()` clears `globalEffectsCached` and rebuilds it by calling `updateEffectCached()` on each manager. Each manager sums its own effects into `effectsCachedExisting` then accumulates them into `globalEffectsCached`. `getEffect(name)` is just `globalEffectsCached[name] || 0`.

3. **Diminishing returns** (`game.js:2269` `getLimitedDR(effect, limit)`): A hyperbolic function. First 75% of `limit` is undiminished. The remaining portion uses `delta = 0.25 * limit`; the formula is `diminishedEffect = (1 - delta/(diminishedPortion + delta)) * delta`. Applied to demand-reduction effects only: `catnipDemandRatio`, `fursDemandRatio`, `ivoryDemandRatio`, `spiceDemandRatio`, `unhappinessRatio`.

4. **Base manager** (`core.js:30` `TabManager`): Every manager has `meta` (array of registrations), `effectsCachedExisting` (effect name → accumulated value), `effectsBase` (static baseline effects), `updateEffectCached()`, `update()`, `save()`, `load()`, `resetState()`.

5. **Timer** (`game.js:10`): A simple frequency counter — each event has a `frequency` (in ticks) and `phase` (decremented each tick; fires when reaches 0, then resets to `frequency`).

## Key Decisions

- **Managers are registered at construction time** — the engine holds an ordered array of `Manager` instances; tick dispatches to all of them in registration order
- **Effect cache is a flat `Record<string, number>`** — mirrors legacy `globalEffectsCached`; rebuilt by `updateCaches()` every tick (we skip the 5-tick frequency optimization for correctness; can add later)
- **No `this.game` pointers in managers** — managers receive `GameState` and return updated state; no circular references
- **`getLimitedDR` is a pure function** — easy to test in isolation; matches legacy formula exactly

## Gotchas & Edge Cases

- Legacy `getLimitedDR` has a subtle sign-handling: `return effect < 0 ? -totalEffect : totalEffect` — it mirrors the sign of the input. Test with negative effects.
- Legacy `effectsBase` can be modified by `addBarnWarehouseRatio` before caching — we handle this in the buildings epic, not here
- Legacy `updateModel` calls `updateModel()` twice when time is accelerated — we don't implement time acceleration in this epic
- `ticksBeforeSave` in legacy counts down from 400 (80 seconds); we move autosave responsibility to the server, not the engine
- `timer.addEvent` frequency events (every 5 ticks for caches, every 10 for village production) — in our implementation, we call `updateCaches` every tick for simplicity; optimize later

## Open Questions

- Should each Manager be a class or an object with a typed interface? (Decision: interface `Manager<S>` where `S` is the manager's slice of state)
- How do managers register effects? (Decision: each manager has an `updateEffects(state) => Record<string, number>` method that returns its contribution to the global cache)
