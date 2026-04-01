# Epic 35 — UI QoL Parity Notes

## Audit trigger

Triggered by a post-Epic-34 UI parity audit focused on "the nice QoL stuff" in the legacy client rather than missing engine features.

## Key legacy findings

- Craft shortcuts are adaptive, not fixed:
  - `legacy/js/jsx/left.jsx.js:299-323`
  - `legacy/js/jsx/left.jsx.js:494-497`
- Craft shortcut tooltips are computed from actual source-material spend:
  - `legacy/js/jsx/left.jsx.js:340-368`
- Workshop tab surfaces craft effectiveness and a hide-researched toggle:
  - `legacy/js/workshop.js:3118-3143`
- Mechanization adds craft progress, engineer allocation, and throughput text:
  - `legacy/js/workshop.js:2868-2920`
- Science tab supports `hideResearched`:
  - `legacy/js/science.js:2704-2739`
- Space tab supports "hide complete missions":
  - `legacy/js/space.js:1514-1529`
- Trade quantity shortcuts switch between amount and percentage labels:
  - `legacy/js/diplomacy.js:1150-1178`
- Hunting quantity shortcuts use the same amount/percentage convention:
  - `legacy/js/village.js:4689-4700`
- Resource rows have dual-table migration behavior for craftable resources:
  - `legacy/js/jsx/left.jsx.js:251-267`
- Storage-limited actions are a first-class legacy affordance:
  - `legacy/js/resources.js:1015-1031` (`isStorageLimited`)
  - `legacy/js/science.js:929-934` (building/policy logic consults storage-limited status)
  - `legacy/js/jsx/queue.jsx.js:49-54,98-105` (queue rows get explicit limited state)

## Rewrite gaps observed during audit

- [WorkshopPanel.tsx](/Users/max/code/kittens-mcp/packages/client-web/src/WorkshopPanel.tsx) hardcodes craft buttons and lacks craft-effectiveness summary, hide-researched, and mechanization surfaces.
- [SciencePanel.tsx](/Users/max/code/kittens-mcp/packages/client-web/src/SciencePanel.tsx) lacks hide-researched filtering.
- [SpacePanel.tsx](/Users/max/code/kittens-mcp/packages/client-web/src/SpacePanel.tsx) lacks hide-complete filtering.
- [DiplomacyPanel.tsx](/Users/max/code/kittens-mcp/packages/client-web/src/DiplomacyPanel.tsx) exposes only single-action trade/embassy buttons.
- [JobsPanel.tsx](/Users/max/code/kittens-mcp/packages/client-web/src/JobsPanel.tsx) still has placeholder management/census/map sections and no multi-action convenience controls.
- [ResourcePanel.tsx](/Users/max/code/kittens-mcp/packages/client-web/src/ResourcePanel.tsx) uses a single flat list with no legacy-style resource visibility editing or craft-table migration.
- Priced client actions originally only used `canAfford(prices, resources)` and discarded `maxValue`, so the rewrite had no way to distinguish "need more income" from "need more storage."

## Related engine gap discovered after the audit

This is not just presentation: legacy fresh-game storage comes from `legacy/js/buildings.js` `effectsBase`, not only from purchased barns/warehouses.

Expected baseline includes:
- `catnipMax: 5000`
- `woodMax: 200`
- `mineralsMax: 250`
- `coalMax: 60`
- `ironMax: 50`
- `titaniumMax: 2`
- `goldMax: 10`
- `oilMax: 1500`
- `uraniumMax: 250`
- `unobtainiumMax: 150`
- `antimatterMax: 100`
- `manpowerMax: 100`
- `scienceMax: 250`
- `cultureMax: 100`
- `faithMax: 100`

The rewrite currently initializes all resources with `maxValue: 0` in [resources.ts](/Users/max/code/kittens-mcp/packages/engine/src/resources.ts) and has no equivalent base-effects contribution in [buildings.ts](/Users/max/code/kittens-mcp/packages/engine/src/buildings.ts). Any UI parity work around storage should treat this as an engine prerequisite, not a styling issue.

## Scope caution

Several QoL surfaces depend on engine support that does not yet exist in the rewrite, especially hunting/trade quantity actions and mechanization engineer state. Epic 35 should keep UI-only work separate from any required engine/API follow-up and document those dependencies story by story.

## Story 35-05 implementation note

The rewrite does not yet port the full recursive craftable-resource branch from legacy `isStorageLimited()`; Story 35-05 implements the core storage-cap rule for direct priced actions:

- `price.val === Infinity` is always limited
- if `maxValue > 0` and `price.val > maxValue` and `price.val > value`, mark the control and matching price line as storage-limited

The first attempt rendered a row-level `Maxed` badge, which was too blunt. Legacy actually keeps the normal button label, leaves the button disabled, adds limited styling to that control, and marks the specific price line with an asterisk/highlight. The current implementation follows that narrower model for buildings, techs, upgrades, missions, CFUs/VSUs, and religion purchases.
