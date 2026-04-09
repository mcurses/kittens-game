# UI Parity Tracker

Tracks UI-level feature parity between legacy Kittens Game and the rewrite. Companion to `PARITY.md` (which tracks engine/data parity). **This is the authoritative source of truth for what the player sees and can do.**

Last updated: 2026-04-08

---

## How to read this

- ✅ Present and functionally equivalent to legacy
- ⚠️ Present but incomplete or divergent
- ❌ Missing entirely
- N/A Not applicable (legacy artifact we intentionally skip)

---

## Resource Panel

Legacy: `legacy/js/jsx/left.jsx.js` (WResourceRow, WCraftRow)
Rewrite: `packages/client-web/src/ResourcePanel.tsx`

| Element | Legacy behavior | Rewrite status | Notes |
|---------|----------------|----------------|-------|
| Resource name | Color-coded by type (common/uncommon/rare/exotic) | ❌ | Plain text, no type coloring |
| Current value | Capacity warning colors at 75%/95% | ⚠️ | Has progress bar capped/low states but no value color coding |
| Max capacity | Shows `/ maxValue` | ✅ | |
| Production rate | Per-tick, toggleable per-second/per-day | ⚠️ | Per-tick/per-second toggle exists but no per-day option |
| Weather modifier | `[+/-X%]` seasonal effect on production | ❌ | |
| Craft shortcuts on resource rows | `+All`, `+25%`, `+50%`, `+75%` links directly on each craftable resource row | ✅ | Inline craft buttons with adaptive amounts (Story 35-06) |
| Craft shortcut tooltips | Shows craftable amount and cost breakdown per shortcut | ❌ | |
| Resource visibility toggle | Ctrl+click to hide/show resource rows | ❌ | |
| Per-tick tooltip | Breakdown showing *which buildings/jobs* produce each component | ✅ | Per-source attribution in inspector (Story 35-09) |
| Time to cap/zero | Shown in per-tick tooltip | ✅ | In inspector panel |
| Easter egg styling | Special classes for values 420, 666, 777, 1337 | ❌ | Intentionally skipped |
| Leader bonus indicator | Styling when leader boosts this resource | ❌ | No leader system |
| Temporal paradox display | Shows "???" during paradox | ❌ | |

---

## Buildings Panel

Legacy: `legacy/js/buildings.js` (render, getTooltip via ButtonModernHelper)
Rewrite: `packages/client-web/src/BuildingsPanel.tsx`

| Element | Legacy behavior | Rewrite status | Notes |
|---------|----------------|----------------|-------|
| Building name | Label with custom styling | ✅ | prettifyName() camelCase → Title Case |
| Build count | `on / val` display | ✅ | |
| Buy button | Highlighted if affordable | ✅ | Primary/secondary/limited styling |
| Category grouping | Tabs: Food, Population, Science, Storage, Resource, Industry, Culture, Other, Mega, Zebra | ✅ | Section headers instead of tabs |
| Filter tabs | All, Available, Enabled, Togglable, IW | ❌ | |
| Tooltip: description | Building description text | ⚠️ | In inspector, but many buildings have no description defined |
| Tooltip: effects list | Full effects breakdown per building | ⚠️ | Inspector shows effects but format differs from legacy |
| Tooltip: prices | Resource costs with grayed-out insufficient amounts | ✅ | Inspector shows prices with color coding |
| Tooltip: flavor text | Italicized lore/joke | ✅ | Flavor text in inspector (Story 35-07) |
| Tooltip: automation status | "Automation is ON/OFF" | ✅ | In inspector (Story 35-07) |
| Tooltip: pollution warning | Warning when building pollutes (Chemistry unlocked) | ✅ | In inspector (Story 35-07) |
| Tooltip: "almost limited" | Warning when near building cap | ❌ | |
| Stage controls | Up/down arrows for stageable buildings (amphitheatre→broadcastTower) | ❌ | Stage data exists in engine but no UI control |
| Building rename system | Late-game upgrades rename buildings (Solar Farm, Hydro Plant) | ❌ | |
| Enable/disable controls | Count-adjustable (-/+/±25/±All) and binary (On/Off) | ✅ | Story 37-01 |
| Automation toggle | Auto On/Off buttons | ✅ | |

---

## Workshop Panel

Legacy: `legacy/js/workshop.js` (render, getTooltip)
Rewrite: `packages/client-web/src/WorkshopPanel.tsx`

| Element | Legacy behavior | Rewrite status | Notes |
|---------|----------------|----------------|-------|
| Upgrade name | Label | ✅ | |
| Purchase button | Highlighted if affordable | ✅ | |
| Hide researched toggle | Checkbox | ✅ | Story 35-03 |
| Craft effectiveness banner | `+N% effectiveness` | ✅ | Story 35-01 |
| Craft shortcut buttons | Dynamic amounts (1%, 5%, 10%, All) | ✅ | In WorkshopPanel, Story 35-01 |
| Craft output with bonus | Button title shows output after craft bonus | ✅ | Story 47-01 |
| Craft tooltip costs | Per-shortcut cost breakdown in inspector | ✅ | Story 47-02 |
| Craft progress % | `[XX%]` progress indicator with mechanization | ✅ | Story 47-04 |
| Engineer assignment controls | Assign/unassign engineers per craft | ✅ | Story 47-05 |
| Engineer throughput/countdown | Time-to-complete and per-second rate | ⚠️ | Output in inspector kind line, no per-second countdown |
| Tooltip: description | Upgrade description | ⚠️ | Inspector shows it but many descriptions missing from defs |
| Tooltip: effects | Effect list | ✅ | In inspector |
| Tooltip: prices | Resource costs | ✅ | In inspector |
| Tooltip: flavor text | Lore/joke | ✅ | Story 47-06 (14 craft flavors) |
| Sell/destroy links | Remove purchased upgrades | ❌ | |

---

## Science Panel

Legacy: `legacy/js/science.js` (render, getTooltip)
Rewrite: `packages/client-web/src/SciencePanel.tsx`

| Element | Legacy behavior | Rewrite status | Notes |
|---------|----------------|----------------|-------|
| Tech name | Label | ✅ | |
| Research button | Highlighted if affordable | ✅ | |
| Hide researched toggle | Checkbox | ✅ | Story 35-03 |
| Done badge | Researched indicator | ✅ | |
| Tooltip: description | Tech description | ⚠️ | In inspector |
| Tooltip: effects | What the tech unlocks/provides | ✅ | In inspector |
| Tooltip: prices | Science cost | ✅ | In inspector |
| Tooltip: flavor text | Lore/joke | ❌ | |
| Policy panel | Separate panel for policies with adopt/block status | ❌ | Policies exist in engine but no dedicated panel |
| Metaphysics panel | Prestige perks panel (requires Metaphysics researched) | ❌ | Perks exist in engine but no panel |

---

## Village / Jobs Panel

Legacy: `legacy/js/village.js` (render, census, government)
Rewrite: `packages/client-web/src/VillagePanel.tsx`, `JobsPanel.tsx`

| Element | Legacy behavior | Rewrite status | Notes |
|---------|----------------|----------------|-------|
| Kittens count | `X / maxKittens` | ✅ | |
| Happiness display | `(:3) XX%` with tooltip breakdown | ✅ | Inspector-based breakdown |
| Hold Festival button | Button when affordable | ✅ | Story 32-07 |
| Festival duration | `Nd remaining` | ✅ | |
| Job assignment +1/-1 | Single kitten assign/unassign | ✅ | |
| Bulk job assignment | +5/+25/+100/+All and negative variants | ✅ | ±5, ±All buttons (Story 35-08) |
| Shift+click assign all | Assign all free kittens to job | ❌ | |
| Job tooltip | Description, modifiers per kitten, flavor text | ❌ | No job hover info |
| Government section | Government type display | ❌ | |
| Leader info | Name, trait, rank, XP, job bonus | ❌ | No leader system |
| Individual kitten census | Full census with name, age, job, skills, rank | ❌ | |
| Census filters | Job filter, trait filter, sort options, pagination | ❌ | |
| Kitten management | Promote, favorite, make leader, unassign | ❌ | |
| Job loadouts | Named job preset system | ❌ | |
| Send hunters ×N | Bulk hunt action | ❌ | |

---

## Toolbar / Top Bar

Legacy: `legacy/js/toolbar.jsx.js`
Rewrite: No dedicated toolbar component

| Element | Legacy behavior | Rewrite status | Notes |
|---------|----------------|----------------|-------|
| Happiness icon | `(:3) XX%` with full breakdown tooltip | ⚠️ | Happiness in VillagePanel, not toolbar |
| Energy display | `⚡ X W` with production/consumption/deficit details | ❌ | |
| Winter energy warning | Orange warning if winter prod < consumption | ❌ | |
| Energy deficit penalty | Shows `-X%` production penalty | ❌ | |
| Sorrow indicator | Sorrow % display | ❌ | |
| MOTD display | Message of the day with "fresh" highlight | ❌ | |

---

## Trade / Diplomacy Panel

Legacy: `legacy/js/diplomacy.js`
Rewrite: `packages/client-web/src/DiplomacyPanel.tsx`

| Element | Legacy behavior | Rewrite status | Notes |
|---------|----------------|----------------|-------|
| Race name + relation | Hostile/Neutral/Friendly badge | ✅ | Story 32-05 |
| Embassy level | `Embassy Lv.X` | ✅ | |
| Buys/sells display | Per-race economics | ✅ | Story 32-05 |
| Trade button | Trade 1x | ✅ | |
| Dynamic trade shortcuts | ×half, ×fifth based on max affordable | ✅ | Story 38-01 |
| Leviathan energy | `Energy: X/Y, Time to leave: Xy Zd` | ❌ | |

---

## Space Panel

Legacy: `legacy/js/space.js`
Rewrite: `packages/client-web/src/SpacePanel.tsx`

| Element | Legacy behavior | Rewrite status | Notes |
|---------|----------------|----------------|-------|
| Mission launch/reached | Button or "Reached" badge | ✅ | Story 32-06 |
| Space building count | `on/val` | ✅ | Story 32-06 |
| Hide complete toggle | Checkbox | ✅ | Story 35-03 |
| Tooltip: effects | Space building effects | ✅ | Inspector |
| Tooltip: description | Building description | ⚠️ | |

---

## Religion Panel

Legacy: `legacy/js/religion.js`
Rewrite: `packages/client-web/src/ReligionPanel.tsx`

| Element | Legacy behavior | Rewrite status | Notes |
|---------|----------------|----------------|-------|
| ZU/RU/TU sections | All three sections | ✅ | Story 32-01 |
| Praise button + multiplier | `×X.XX` badge | ✅ | Story 32-03 |
| Adore/Transcend buttons | Functional | ✅ | |
| Marker fill % | `Marker [18%]` partial fill indicator | ❌ | Shows `×N` count only |
| Done badge for one-time RU | "Done" instead of "Buy" | ✅ | Story 32-02 |

---

## Time Panel

Legacy: `legacy/js/time.js`
Rewrite: `packages/client-web/src/TimePanel.tsx`

| Element | Legacy behavior | Rewrite status | Notes |
|---------|----------------|----------------|-------|
| Heat/Flux display | Stat cards | ✅ | |
| Shatter TC button | Functional | ✅ | |
| CFU/VSU buy buttons | With dynamic pricing | ✅ | |

---

## Inspector / Tooltip System

Legacy uses per-element tooltips via `ButtonModernHelper.getTooltipHTML()`.
Rewrite uses a shared `InspectorPanel` sidebar.

| Element | Legacy behavior | Rewrite status | Notes |
|---------|----------------|----------------|-------|
| Per-element tooltips | Hover tooltip on each button/row | N/A | Replaced by inspector panel (design decision) |
| Inspector: resource breakdown | Production sources with building/job attribution | ✅ | Per-source breakdown with building/job attribution (Story 35-09) |
| Inspector: building effects | Full effect list with values | ✅ | |
| Inspector: price ETAs | Time-to-afford with live countdown | ✅ | Story 41-01 |
| Inspector: storage-limited marker | `*` + warning for capped resources | ✅ | Story 35-05 |
| Inspector: craft cost tree | Recursive ingredient expansion with depth highlighting | ✅ | expandCraftCosts.ts |

---

## Summary Counts

| Panel | Elements tracked | ✅ | ⚠️ | ❌ |
|-------|-----------------|-----|-----|-----|
| Resource Panel | 13 | 4 | 2 | 7 |
| Buildings Panel | 16 | 6 | 3 | 7 |
| Workshop Panel | 14 | 11 | 2 | 1 |
| Science Panel | 10 | 6 | 2 | 2 |
| Village/Jobs | 15 | 4 | 0 | 11 |
| Toolbar | 6 | 0 | 1 | 5 |
| Trade | 6 | 5 | 0 | 1 |
| Space | 5 | 4 | 1 | 0 |
| Religion | 5 | 4 | 0 | 1 |
| Time | 3 | 3 | 0 | 0 |
| Inspector | 5 | 5 | 0 | 0 |
| **Total** | **98** | **52** | **12** | **34** |

**Overall UI parity: ~53%** (52 of 98 elements fully present)

---

## Automated audit

A Playwright-based accessibility-tree comparison is available:

```
pnpm --filter @kittens/client-web ui-parity
```

This extracts the accessibility tree from the running rewrite and compares against a checked-in legacy fixture. See `packages/client-web/playwright/` for the audit scripts and fixtures.

---

## Enforcement rules

1. **Do not mark a UI epic complete without updating this file.**
2. **`/sanity-check` audits this file** alongside PARITY.md.
3. **Automated audit catches regressions** — run before closing any UI-related epic.
