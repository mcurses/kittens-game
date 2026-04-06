# Epic 41: Resource Cost Highlighting

**Status:** In Progress
**Started:** 2026-04-06
**Prerequisites:** Epic 26 (UI Information Architecture — InspectorContext exists), Epic 33 (visibility parity)
**Legacy refs:** No direct legacy equivalent — new UX pattern

---

## Story 41-01: Highlight required resources on action hover

**As a** player hovering a building, upgrade, or technology to buy
**I want** the resources I need to pay highlighted in the resource panel
**So that** I can see at a glance which resources are relevant without looking at the inspector on the other side of the screen

### Acceptance Criteria
- [ ] Given a building/upgrade/tech is hovered, when its prices array is non-empty, then each required resource row receives a `resource-item--highlighted` CSS class
- [ ] Given a building/upgrade/tech is hovered, when its prices array is non-empty, then all other resource rows receive a `resource-item--dimmed` CSS class with reduced opacity (~35%)
- [ ] Given no item is hovered (inspected is null), then no rows are highlighted or dimmed — all rows render at full opacity
- [ ] Given a resource row is hovered (ResourceEntity inspected), then no dimming occurs — resource hover does not trigger the highlight mode (ResourceEntity has no prices)
- [ ] Highlighted and dimmed states transition smoothly via CSS (150ms opacity transition)

### Legacy Reference
- No direct legacy equivalent. Affordability in legacy: `legacy/js/ui.js` — price text color change only, no resource panel interaction.

### Notes
- Trigger condition: `inspected !== null && 'prices' in inspected && inspected.prices.length > 0`
- Highlight = full opacity + subtle left-border accent (CSS variable `--color-accent`)
- Dimmed = `opacity: 0.35`

### Status: [ ] Tests | [ ] Impl | [ ] Rated

---

## Story 41-02: Show cost target marker on resource progress bar

**As a** player hovering a purchasable item
**I want** a visual marker on each required resource's progress bar showing exactly how much I need
**So that** I can see at a glance how far each resource is from the required amount

### Acceptance Criteria
- [ ] Given a resource is highlighted (required by hovered item), when `needed <= maxValue`, then a thin vertical line (target marker) is rendered inside the progress bar at position `(needed / maxValue) * 100%`
- [ ] Given current resource value < needed, then the marker appears ahead of the bar fill, styled in the accent color (goal not yet reached)
- [ ] Given current resource value >= needed, then the marker appears at or behind the fill position, styled in success/green color (goal met)
- [ ] Given `needed > maxValue` (storage limited), then the marker is pinned at 100% of bar width and styled in warning/amber color — no text label; color alone communicates the state
- [ ] Given a resource is not highlighted (dimmed or no hover active), then no target marker is rendered
- [ ] The marker is visually distinct: a thin (2px) vertical line spanning the full bar height, with appropriate z-index to be visible over the bar fill

### Legacy Reference
- No legacy equivalent — new visual affordance.

### Notes
- Marker element: `<div class="resource-bar-target resource-bar-target--met|--unmet|--limited">` absolutely positioned inside the existing bar container
- Requires the bar container to have `position: relative`

### Status: [ ] Tests | [ ] Impl | [ ] Rated

---

## Story 41-03: Show live ETA to reach required amount

**As a** player hovering a purchasable item I cannot yet afford
**I want** to see a live countdown showing when each required resource will reach the needed amount
**So that** I know whether to wait or do something else (gather, trade, etc.)

### Acceptance Criteria
- [ ] Given a resource is highlighted and `current < needed` and `perTick > 0`, then an ETA label is shown below the progress bar: "in Xm Ys" (using existing `formatDuration()`)
- [ ] Given a resource is highlighted and `current >= needed`, then no ETA label is shown (requirement already met)
- [ ] Given a resource is highlighted and `perTick <= 0`, then the label shows "—" (not accumulating)
- [ ] Given `needed > maxValue` (storage limited), then no ETA label is shown — the warning-colored marker at 100% is the sole indicator
- [ ] The ETA label updates live (approximately every second) while the item remains hovered, counting down as resources accumulate
- [ ] The ETA label disappears immediately when the item is un-hovered

### Legacy Reference
- Live ETA pattern already exists in `InspectorPanel.tsx` via `useElapsedInspectorSeconds()`. Reuse same interval approach.
- `formatDuration()` in `packages/client-web/src/utils.ts` (or `InspectorPanel.tsx`) — reuse directly.

### Notes
- ETA = `(needed - current) / (perTick * TICKS_PER_SECOND)` where `TICKS_PER_SECOND = 5`
- Live update: 1-second `setInterval` inside a `useEffect`, or a shared ticker from the existing inspector elapsed hook
- The label is small and muted (`font-size: 0.75rem`, `color: var(--color-muted)`)
- Positioned directly below the progress bar, only visible in highlight mode

### Status: [ ] Tests | [ ] Impl | [ ] Rated

---

## Story 41-04: Highlight works across all action panels

**As a** player on any tab (Buildings, Workshop, Science, Religion, Space, Time)
**I want** the resource highlighting to activate regardless of which panel I hover
**So that** the feature works consistently everywhere I interact with purchasable items

### Acceptance Criteria
- [ ] Given a building is hovered in BuildingsPanel, then the resource highlight activates
- [ ] Given an upgrade is hovered in WorkshopPanel, then the resource highlight activates
- [ ] Given a technology is hovered in SciencePanel, then the resource highlight activates
- [ ] Given a ziggurat or religion upgrade is hovered in ReligionPanel, then the resource highlight activates
- [ ] Given a space structure is hovered in SpacePanel, then the resource highlight activates
- [ ] Given a chronoforge or vortex upgrade is hovered in TimePanel, then the resource highlight activates
- [ ] All of the above: the existing `setInspected()` call is sufficient — no per-panel changes needed if InspectorContext carries prices already

### Legacy Reference
- All panels already call `setInspected({ prices, ... })` on hover — `InspectorContext.tsx`, all panel files

### Notes
- This story is mostly a verification/regression story. The highlight logic is implemented in ResourcePanel and reads from InspectorContext — it automatically works for all panels that already set prices in inspected entity.
- TimePanel currently does NOT use InspectorContext for hover (it has no inspector integration). If that's still true, mark it as a known gap and file separately rather than blocking this epic.

### Status: [ ] Tests | [ ] Impl | [ ] Rated

---

## Story 41-06: Recursive ingredient highlighting for crafted cost resources

**As a** player hovering an item that costs craftable resources I'm short on
**I want** to also see the ingredients of those craftable resources highlighted in the panel
**So that** I know which raw/base resources I need to accumulate to unblock the craft chain, without having to mentally trace the recipe tree myself

### Acceptance Criteria
- [ ] Given an item requires Compendium and I lack it, and Compendium is craftable from Science + Manuscripts, then Science and Manuscripts are also highlighted (at secondary depth) if I don't have enough of them to cover the craft
- [ ] Given a secondary ingredient is itself craftable (e.g. Manuscripts from Parchment), and I'm short on it, then its ingredients are highlighted at tertiary depth, and so on recursively — max depth 3
- [ ] Recursion stops at any resource where the current amount satisfies the needed ingredient quantity (no need to highlight further — requirement is already met at that node)
- [ ] Recursion stops at base resources that have no craft recipe (catnip, wood, minerals, etc.)
- [ ] Secondary highlighted rows (depth 2) render with a visibly softer highlight than primary (depth 1) — distinct CSS class `resource-item--highlighted-secondary`
- [ ] Tertiary highlighted rows (depth 3) render softer still — CSS class `resource-item--highlighted-tertiary`
- [ ] Each secondary/tertiary row shows an annotation below its bar: "↳ for [ParentResourceName]" in muted small text — so the player knows *why* that resource is highlighted
- [ ] ETA label for secondary/tertiary rows uses the same perTick-based calculation (how long to accumulate the raw ingredient), not a "time to craft" estimate
- [ ] If the same resource appears as an ingredient at multiple depths (diamond dependency), it is highlighted at the shallowest depth found
- [ ] The `expandCraftCosts(prices, craftDefs, resources)` helper is a pure function, separately unit-tested with craft chain fixtures

### Legacy Reference
- Workshop crafting recipes: `legacy/js/workshop.js` — `craftManager.crafts` array, each with `prices: [{name, val}]` and `name`
- Legacy shows ingredient chains in its own tooltip/inspector panel — this epic moves that insight into the resource panel instead

### Notes
- `expandCraftCosts` signature:
  ```typescript
  type IngredientNode = { amount: number; depth: number; parentName: string };
  function expandCraftCosts(
    prices: { name: string; val: number }[],
    craftDefs: CraftDef[],          // from game state, already client-side
    resources: ResourceMap,
    maxDepth?: number               // default 3
  ): Map<string, IngredientNode>
  ```
- The returned map is merged with the direct `prices` map (depth=1 entries take precedence in case of overlap)
- `CraftDef` (the craft recipe type) must already be in game state for WorkshopPanel to render crafts — confirm the shape; no new API endpoint needed
- The annotation "↳ for X" uses `parentName` from the returned map

### Status: [ ] Tests | [ ] Impl | [ ] Rated

---

## Story 41-05: No visual regression on existing resource panel behavior

**As a** player not hovering any purchasable item
**I want** the resource panel to look and behave exactly as before
**So that** the new highlighting feature does not degrade the baseline experience

### Acceptance Criteria
- [ ] Given no item is hovered, all resource rows render at full opacity with no target markers or ETA labels
- [ ] Given a resource row itself is hovered (ResourceEntity), the existing resource inspector shows in InspectorPanel as before, and no dimming/highlighting occurs in the resource list
- [ ] The rate badge, value display, max value display, and progress bar fill all behave identically to pre-epic behavior when no highlighting is active
- [ ] The `pnpm turbo build` passes with no TypeScript errors

### Legacy Reference
- `packages/client-web/src/ResourcePanel.tsx` — existing behavior baseline

### Notes
- Primarily a regression guard. Covered implicitly by other tests but worth an explicit render snapshot or behavior test.

### Status: [ ] Tests | [ ] Impl | [ ] Rated
