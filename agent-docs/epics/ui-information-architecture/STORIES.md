# Epic 26: UI Information Architecture

**Status:** Complete
**Started:** 2026-03-30
**Legacy refs:** None — rewrite UX decision informed by legacy content (hover tooltips)

---

## User Decisions (Recorded 2026-03-30)

- **Inspector placement**: Right sidebar, shared with log — inspector on top, log below
- **Inspector trigger**: Hover changes inspector content
- **First-pass scope**: Resources panel, Buildings panel, Workshop panel
- **Description strings**: Added to engine defs (BuildingDef, UpgradeDef, TechDef, etc.)

---

## Pre-Epic Action Items (from Epic 22)

- [x] Add biome lint check to CI — already present as `pnpm run check` in ci.yml
- [x] Create SlotContext — React context for current slot across all panels/hooks

---

## Story 26-1: SlotContext

**As a** developer
**I want** a React Context carrying the current slot name
**So that** panels and hooks can read it without prop-drilling

### Acceptance Criteria
- [x] `SlotContext` provides `slot: string` defaulting to `"default"`
- [x] `SlotProvider` accepts a `slot` prop and wraps children
- [x] `useSlot()` hook returns the current slot from context
- [x] `GameView` in `App.tsx` wraps its tree in `SlotProvider`

### Status: [x] Tests | [x] Impl | [ ] Rated

---

## Story 26-2: Add description to engine defs

**As a** player
**I want** entities to have human-readable descriptions
**So that** the inspector can explain what a building, upgrade, or tech does

### Acceptance Criteria
- [x] `BuildingDef` has optional `description?: string` field
- [x] All 12 entries in `BUILDING_DEFS` have a description
- [x] `UpgradeDef` has optional `description?: string` field
- [x] All entries in `UPGRADE_DEFS` have a description
- [x] `TechDef` has optional `description?: string` field
- [x] Key techs in `TECH_DEFS` have descriptions
- [x] `ZigguratUpgradeDef`, `ReligionUpgradeDef` have optional `description?: string`
- [x] Engine build passes with no type errors

### Status: [x] Tests | [x] Impl | [ ] Rated

---

## Story 26-3: InspectorContext

**As a** developer
**I want** a shared context for the currently inspected entity
**So that** any panel can publish hover state and the inspector panel can read it

### Acceptance Criteria
- [x] `InspectorEntity` discriminated union covers: `resource`, `building`, `upgrade`, `tech`, `zigguratUpgrade`, `religionUpgrade`
- [x] `InspectorContext` provides `{ inspected: InspectorEntity | null, setInspected, clearInspected }`
- [x] `InspectorProvider` manages state internally
- [x] `useInspector()` hook returns context value
- [x] Setting the same entity twice does not cause extra re-renders

### Status: [x] Tests | [x] Impl | [ ] Rated

---

## Story 26-4: InspectorPanel component

**As a** player
**I want** an inspector panel that shows detail about whatever I'm hovering
**So that** I can understand entities without hunting for tooltips

### Acceptance Criteria
- [x] `InspectorPanel` renders `data-testid="inspector-panel"`
- [x] Shows placeholder text when nothing is inspected
- [x] Shows entity name and description when inspected
- [x] Shows effects as a formatted list (key: value)
- [x] Shows prices when entity has prices
- [x] Responds to InspectorContext changes without page navigation
- [x] Works for all entity kinds (resource, building, upgrade, tech)

### Status: [x] Tests | [x] Impl | [ ] Rated

---

## Story 26-5: Right sidebar layout — inspector above log

**As a** player
**I want** the inspector to appear above the log in the right sidebar
**So that** detail is always visible when I hover, without covering content

### Acceptance Criteria
- [x] `App.tsx` wraps the tree in `InspectorProvider`
- [x] Right sidebar (`log-sidebar`) contains `InspectorPanel` above `LogPanel`
- [x] Inspector has sufficient height to show meaningful content
- [x] Log remains visible and scrollable below inspector
- [x] Layout is stable (no CLS when inspector content changes)

### Status: [x] Tests | [x] Impl | [ ] Rated

---

## Story 26-6: Wire hover — ResourcePanel

**As a** player
**I want** hovering a resource row to show its breakdown in the inspector
**So that** I can understand production without a tooltip overlay

### Acceptance Criteria
- [x] Hovering a resource row calls `setInspected({ kind: 'resource', name, perTick, breakdown })`
- [x] Mouse leave calls `clearInspected()`
- [x] Inspector shows resource name, net income, and production breakdown
- [x] Existing hover tooltip is removed (replaced by inspector)
- [x] Keyboard focus also triggers inspector

### Status: [x] Tests | [x] Impl | [ ] Rated

---

## Story 26-7: Wire hover — BuildingsPanel

**As a** player
**I want** hovering a building card to show its description and effects in the inspector
**So that** I can evaluate a purchase before clicking Buy

### Acceptance Criteria
- [x] Hovering a building card calls `setInspected({ kind: 'building', name, description, effects, prices })`
- [x] Mouse leave calls `clearInspected()`
- [x] Inspector shows building name, description, effects, and current price
- [x] Keyboard focus also triggers inspector

### Status: [x] Tests | [x] Impl | [ ] Rated

---

## Story 26-8: Wire hover — WorkshopPanel

**As a** player
**I want** hovering an upgrade row to show its description and effect in the inspector
**So that** I know what a purchase does before clicking Purchase

### Acceptance Criteria
- [x] Hovering an upgrade row calls `setInspected({ kind: 'upgrade', name, description, effects, prices })`
- [x] Mouse leave calls `clearInspected()`
- [x] Inspector shows upgrade name, description, effects, and prices
- [x] Keyboard focus also triggers inspector

### Status: [x] Tests | [x] Impl | [ ] Rated

---

## Story 26-9: Wire hover — SciencePanel

**As a** player
**I want** hovering a tech row to show its description in the inspector
**So that** I understand what researching it unlocks

### Acceptance Criteria
- [x] Hovering a tech row calls `setInspected({ kind: 'tech', name, description, effects, prices })`
- [x] Mouse leave calls `clearInspected()`
- [x] Inspector shows tech name, description, effects, and cost
- [x] Keyboard focus also triggers inspector

### Status: [x] Tests | [x] Impl | [ ] Rated

---

## Story 26-10: Cross-panel integration test

**As a** developer
**I want** an integration test covering the full inspector flow
**So that** regressions in the hover → context → panel pipeline are caught

### Acceptance Criteria
- [x] Test renders App with a state fixture containing buildings + resources
- [x] Simulates hover on a building row
- [x] Asserts InspectorPanel shows the building's name and description
- [x] Simulates hover on a resource row
- [x] Asserts InspectorPanel shows the resource details

### Status: [x] Tests | [x] Impl | [ ] Rated

---

## Story 26-11: Live inspector ETA countdown

**As a** player
**I want** remaining-time estimates in the inspector to keep counting down while I hover
**So that** the inspector feels live instead of showing stale values from the first hover frame

### Acceptance Criteria
- [x] Given a hovered priced entity with an affordable ETA derived from current resource income, when time passes and hover remains active, then the displayed `~Ns` countdown updates without requiring another hover event
- [x] Given a hovered resource with `Time to zero` or `Time to cap`, when time passes and hover remains active, then that displayed duration also counts down from the same snapshot
- [x] The timer logic lives inside the inspector surface and does not force panel-specific hover publishers to manage countdown state

### Status: [x] Tests | [x] Impl | [x] Rated

---

## Story 26-12: Happiness inspector breakdown

**As a** player
**I want** hovering the happiness display to populate the inspector with a happiness breakdown
**So that** I can see the same contributing terms that legacy exposed from the happiness hover

### Acceptance Criteria
- [ ] Given a game state with happiness contributors and penalties, when I hover or focus the happiness display in the village summary or jobs summary, then the inspector shows a dedicated happiness detail surface
- [ ] Given that detail surface, then it includes the current total happiness plus legacy-derived term rows for base happiness, building bonus, luxury bonus, karma bonus, festival bonus, and unhappiness penalty when those terms are non-zero
- [ ] Given `unhappinessRatio` mitigation is active, when the inspector renders the penalty section, then it separates the base penalty from the mitigated reduction instead of only showing the final combined penalty
- [ ] Given the pointer leaves or focus blurs from the happiness trigger, then the inspector clears back to the prior placeholder behavior

### Legacy Reference
- File: `legacy/js/toolbar.js` lines 133-182
- Key logic: `ToolbarHappiness.getTooltip()` renders base, building bonus, rare resource happiness, karma, festival, total penalty, mitigated penalty, environment, challenge, and overpopulation rows

### Notes
- Rewrite parity for this story is scoped to the currently implemented happiness formula terms. Environment and challenge rows should only be shown if the rewrite state actually carries non-zero values for them.

### Status: [x] Tests | [x] Impl | [ ] Rated

---

## Story 26-13: Buildings panel category grouping

**As a** player
**I want** the Buildings tab organized into clear building categories
**So that** I can scan the bonfire/buildings surface by function instead of reading one flat list

### Acceptance Criteria
- [x] BuildingsPanel renders visible unlocked buildings under category headings rather than a single flat `Structures` list
- [x] Categories follow the requested grouped layout shape: `Food Production`, `Population`, `Science`, `Storage`, `Resources`, `Industry`, `Culture`, `Other`, `Mega Structures`, and `Zebras`
- [x] Each visible building appears exactly once under its assigned category
- [x] Empty categories are hidden
- [x] Existing buy controls, on/off controls, automation controls, and inspector hover/focus behavior are preserved
- [x] Focused BuildingsPanel tests cover category rendering and representative building placement

### Notes
- This is a client-side information-architecture hotfix only. It should not change engine state, unlock logic, or visibility rules.

### Status: [x] Tests | [x] Impl | [ ] Rated
