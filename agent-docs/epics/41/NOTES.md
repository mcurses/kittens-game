# Epic 41: Resource Cost Highlighting — Notes

## Summary

This is a **pure client-side UI epic** — no engine changes, no new API routes, no OpenAPI spec changes needed. All required data (prices, current resource values, per-tick rates) is already present in the game state and InspectorContext.

## Legacy Behavior Summary

No direct legacy equivalent. The legacy Kittens Game shows affordability only in the item list itself (greyed-out text, price color). Resources are displayed in a left sidebar with no contextual highlighting. This epic introduces a new UX pattern that is strictly additive and superior to legacy.

## Architecture

### Data flow

```
Hover building/upgrade/tech
  → setInspected({ prices: [{name, val}, ...], ... })  [InspectorContext]
  → ResourcePanel reads useInspector()
  → derives: requiredAmounts = Map<resourceName, number>
  → each ResourceItem receives: requiredAmount: number | undefined
  → if requiredAmount defined → highlighted; else dimmed (when anything inspected)
```

### Key files

| File | Role |
|------|------|
| `packages/client-web/src/InspectorContext.tsx` | Source of `inspected` entity with prices |
| `packages/client-web/src/ResourcePanel.tsx` | Consumes inspector; renders resource rows |
| `packages/client-web/src/utils.ts` | `formatDuration()`, `canAfford()`, `isStorageLimited()` |

### ETA calculation

```typescript
// time in seconds to reach needed amount
function timeToReach(current: number, needed: number, perTickPerSec: number): number | null {
  if (current >= needed) return 0;            // already met
  if (perTickPerSec <= 0) return null;        // impossible / draining
  return (needed - current) / perTickPerSec;
}
// perTickPerSec = resource.perTick * TICKS_PER_SECOND (5)
```

### Storage-limited case

When `needed > maxValue`: the bar is already at cap but storage is too low. Show the target marker pinned to 100% in warning/amber color. No text label — color alone is the signal.

### Live ETA updates

Reuse the `useElapsedInspectorSeconds()` pattern already in `InspectorPanel.tsx` — 1-second interval that forces a re-render so the countdown stays live.

## CSS approach

- `resource-item--highlighted`: full opacity, slight left border accent or subtle glow
- `resource-item--dimmed`: `opacity: 0.35`, `transition: opacity 150ms ease`
- `.resource-bar-target`: absolute-positioned thin vertical line inside the bar at `left: clamp(0%, needed/max * 100%, 100%)`
  - Color: `var(--color-accent)` when not yet met, `var(--color-success)` when met
  - Storage-limited: `var(--color-warning)`, pinned at 100%
- ETA label: small muted text below the bar, only when highlighted and deficit exists (not shown for storage-limited case)
- Secondary highlight: `resource-item--highlighted-secondary` — softer accent, annotation "↳ for [ParentName]"
- Tertiary highlight: `resource-item--highlighted-tertiary` — softest accent, same annotation pattern

## Recursive Craft Expansion

### `expandCraftCosts` algorithm

```typescript
function expandCraftCosts(
  prices: { name: string; val: number }[],
  craftDefs: CraftDef[],
  resources: ResourceMap,
  maxDepth = 3
): Map<string, { amount: number; depth: number; parentName: string }> {
  const result = new Map();

  function visit(name: string, amountNeeded: number, depth: number, parentName: string) {
    if (depth > maxDepth) return;
    const current = resources[name]?.value ?? 0;
    if (current >= amountNeeded) return;  // requirement met, stop recursion
    if (result.has(name)) return;         // diamond: shallowest depth wins (visited first)
    result.set(name, { amount: amountNeeded, depth, parentName });
    const recipe = craftDefs.find(c => c.name === name);
    if (!recipe) return;                  // base resource, no recipe
    for (const ingredient of recipe.prices) {
      // scale ingredient need by how many crafts are needed
      const craftsNeeded = Math.ceil((amountNeeded - current) / recipe.yields);
      visit(ingredient.name, ingredient.val * craftsNeeded, depth + 1, name);
    }
  }

  for (const price of prices) {
    visit(price.name, price.val, 1, '');
  }
  return result;
}
```

### ETA for secondary/tertiary rows

Use the same `perTick`-based formula as primary rows — how long to accumulate the raw ingredient amount. Do NOT attempt to compute a "time to craft" estimate (depends on kitten automation, assignment, etc.).

## Key Decisions

- **No new context needed**: `useInspector()` is already called in `ResourcePanel`. Derive required + ingredient amounts inline.
- **No engine changes**: All data available client-side. Craft defs are already in game state for WorkshopPanel.
- **Highlight behavior scoped to action items**: Only trigger when inspected entity has `prices`. Resource hover (ResourceEntity) has no prices → no highlighting.
- **Live ETA in resource row, not inspector**: Per-resource accumulation cue; inspector already shows total cost ETA.
- **Storage-limited**: marker color only, no text label.
- **Diamond dependency**: shallowest depth wins — first-visited via BFS-like traversal of prices array order.

## Gotchas & Edge Cases

- Resource hover must NOT dim others — check for `prices` field on `inspected`.
- `perTick` may be 0 or negative → show `—` for ETA.
- `maxValue === Infinity` or very large → no storage limit case applies.
- Multiple prices: all required resources highlighted simultaneously.
- Fast tick rate (5/sec): 1s re-render interval is sufficient.
- Craft `yields` field (how many you get per craft) must be factored in when scaling ingredient amounts — don't assume 1:1.
- If `craftDefs` not yet exposed in game state shape, check WorkshopPanel for how it reads them; may need a selector/derived field.
- The target marker position must use `Math.min(needed / maxValue, 1)` to clamp at 100% for storage-limited case.

## Open Questions

- Should the ETA label replace the rate badge during highlighting, or appear below it? Decision: appear below the progress bar as a separate small line, to avoid disrupting the existing layout.
