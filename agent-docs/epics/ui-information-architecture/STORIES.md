# Epic 26: UI Information Architecture — Draft Stories

Status: Draft only. This epic outline is intentionally pre-research and pre-sign-off.

Goal: preserve the depth of legacy explanatory UI while replacing hover-only, desktop-centric tooltips with a more modern, touch-safe, and consistent information architecture.

This draft does not commit to a specific solution yet. Legacy research is still required, and user product decisions are still required before story implementation starts.

---

## Problem Statement

The legacy UI exposes important explanatory information through many hover tooltips:
- resource net income breakdowns
- building and workshop upgrade descriptions
- unlock and effect explanations
- prerequisite and disabled-state explanations

That information is useful, but the interaction model is weak for the rewrite because:
- hover-only detail is hard to discover
- it does not translate well to touch devices
- it creates inconsistent disclosure patterns across panels
- it makes core decision-making depend on transient overlays

The rewrite needs a coherent system for surfacing this information without copying the legacy UX wholesale.

---

## Draft Story 26-1: Audit Legacy Detail Surfaces

**As a** player
**I want** all legacy information surfaces identified
**So that** the rewrite does not regress on discoverability or feature depth

### Draft Acceptance Criteria
- [ ] Inventory all tooltip / hover / expanded-detail surfaces used in legacy UI
- [ ] Group each surface by domain: resources, buildings, workshop, science, religion, diplomacy, time, achievements
- [ ] For each surface, classify content as:
- [ ] core decision info that should likely be inline
- [ ] contextual detail that may belong in an inspector or expansion row
- [ ] low-frequency help text that may remain in a tooltip or info popover
- [ ] Record legacy file references and screenshots for each pattern

### Legacy Reference
- TBD after research

### Notes
- This is the discovery gate for the rest of the epic.
- No implementation should start until this inventory exists.

### Status: [ ] Research | [ ] Sign-off | [ ] Tests | [ ] Impl | [ ] Rated

---

## Draft Story 26-2: Choose Shared Detail Pattern

**As a** player
**I want** one consistent way to inspect rich game information
**So that** the UI feels coherent instead of panel-by-panel improvised

### Draft Acceptance Criteria
- [ ] Evaluate at least these candidate patterns:
- [ ] persistent inspector panel
- [ ] inline expandable rows
- [ ] hybrid model: inspector for primary entities, popovers for micro-help
- [ ] Decide the primary interaction model for desktop
- [ ] Decide the primary interaction model for touch / narrow screens
- [ ] Decide whether hover remains as enhancement only or a required path
- [ ] Capture rationale in `agent-docs/DECISIONS.md`

### Legacy Reference
- None; this is a rewrite UX decision informed by legacy content

### Notes
- This story requires user product decisions.
- The likely decision axis is “information density vs calmness”.

### Status: [ ] Research | [ ] Sign-off | [ ] Tests | [ ] Impl | [ ] Rated

---

## Draft Story 26-3: Resource Details Surface

**As a** player
**I want** to inspect resource production and consumption clearly
**So that** I can understand why net income changes

### Draft Acceptance Criteria
- [ ] Resource rows expose net gain in the default list presentation
- [ ] Detailed production / consumption breakdown is available without requiring hover
- [ ] The detail view supports current unit preference (`/tick` vs `/sec`)
- [ ] The detail view works with keyboard and touch
- [ ] The detail view does not obscure neighboring rows excessively

### Legacy Reference
- `legacy/game.js` — `attachResourceTooltip()`, `getDetailedResMap()`
- `legacy/js/jsx/left.jsx.js` — resource row attachment points

### Notes
- Need user decision on whether the target surface is inspector, inline expansion, or both.
- Need research on how much of legacy breakdown content is currently supported by the modern engine contract.

### Status: [ ] Research | [ ] Sign-off | [ ] Tests | [ ] Impl | [ ] Rated

---

## Draft Story 26-4: Upgrade / Building / Tech Explanation Surface

**As a** player
**I want** upgrade and entity details shown in a structured way
**So that** I can understand what a purchase does before I commit

### Draft Acceptance Criteria
- [ ] Buildings, workshop upgrades, techs, religion upgrades, and similar entities expose:
- [ ] short description
- [ ] key effect summary
- [ ] price / prerequisite summary
- [ ] disabled reason when unaffordable or locked
- [ ] Shared presentation rules are consistent across panels
- [ ] “What does this do?” content is not trapped in hover-only UI

### Legacy Reference
- TBD after research across legacy tab implementations

### Notes
- May need metadata additions where engine definitions currently have IDs and effects but no user-facing explanation strings.
- Need decision on whether descriptions live in domain defs, shared UI metadata, or localization resources.

### Status: [ ] Research | [ ] Sign-off | [ ] Tests | [ ] Impl | [ ] Rated

---

## Draft Story 26-5: Shared Interaction and Accessibility Rules

**As a** player
**I want** detail interactions to behave consistently
**So that** I can learn the UI once and reuse that knowledge everywhere

### Draft Acceptance Criteria
- [ ] One shared interaction contract exists for hover, click, focus, escape, and outside-click behavior
- [ ] Detail surfaces are accessible via keyboard
- [ ] Detail surfaces have a touch-safe interaction path
- [ ] The chosen pattern avoids layout instability where possible
- [ ] Screen reader semantics are defined for selected / expanded / described entities

### Legacy Reference
- None; rewrite-specific accessibility and interaction contract

### Notes
- Requires implementation decision from Story 26-2.

### Status: [ ] Research | [ ] Sign-off | [ ] Tests | [ ] Impl | [ ] Rated

---

## Draft Story 26-6: Responsive Presentation Rules

**As a** player
**I want** the detail system to adapt to viewport size
**So that** the same information remains usable on desktop and smaller screens

### Draft Acceptance Criteria
- [ ] Define desktop behavior for three-column layout
- [ ] Define tablet behavior
- [ ] Define narrow/mobile behavior
- [ ] Chosen detail surface does not depend on mouse hover for access
- [ ] Persisted UI state rules are defined for any selected/expanded entity

### Legacy Reference
- None; rewrite-specific responsive behavior

### Notes
- This likely overlaps with future themes/mobile work and needs sequencing decisions.

### Status: [ ] Research | [ ] Sign-off | [ ] Tests | [ ] Impl | [ ] Rated

---

## Decision Gates Before Implementation

- [ ] Legacy tooltip / detail audit completed
- [ ] User chooses primary detail pattern
- [ ] Scope boundary decided: which panels are included in the first pass
- [ ] Metadata source decided for human-readable descriptions
- [ ] Responsive behavior chosen
- [ ] Accessibility contract chosen

