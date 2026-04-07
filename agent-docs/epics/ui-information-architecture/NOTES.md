# Epic 26: UI Information Architecture — Draft Notes

Status: Draft only. Research has not been completed. No implementation should start from this document alone.

## Why This Epic Exists

The rewrite has started porting useful legacy informational affordances such as resource income breakdowns, but the old pattern relies heavily on hover tooltips. That preserves information depth, but it does not yet provide a modern, consistent interaction model.

This epic exists to answer a product and architecture question before more panel-specific UI work accumulates:

"How should the rewrite expose rich game information in a way that keeps legacy depth without inheriting legacy awkwardness?"

## Initial Direction

Current likely direction:
- keep high-signal decision information inline
- use one shared details surface for deeper explanation
- keep hover as optional desktop enhancement, not the only path

This is not yet approved. It is only a starting hypothesis.

## Research Required

1. Legacy audit
- Find every tooltip, hover card, expanded details block, and title/help affordance in `legacy/`.
- Record what information each one exposes and how often players likely need it.

2. Current rewrite audit
- Identify which panels already show only IDs / costs without explanation.
- Identify where the current serialized game state lacks enough descriptive metadata.

3. UX pattern evaluation
- Compare inspector panel vs inline expansion vs hybrid approach.
- Evaluate against desktop density, touch support, keyboard support, and implementation cost.

4. Content model audit
- Determine where user-facing descriptions should live:
- engine defs
- shared UI metadata
- API spec / client-only metadata
- future i18n strings

## User Decisions Needed

- Which overall detail pattern should be the default?
- Which surfaces should stay hover-capable as a convenience?
- Should the first implementation cover only resources + workshop/buildings, or all tabbed panels?
- Should a right-side inspector replace the current log column in some contexts, share space with it, or live under the center panel?
- Is mobile/touch support required in the first implementation or only “non-broken” behavior?

## Likely Risks

- Metadata gap: some entities may not have enough human-readable description data yet.
- Scope creep: this can turn into a general UI redesign if not bounded.
- Layout churn: a new inspector surface may force changes to the existing 3-column shell.
- Inconsistency risk: partial adoption across panels could feel worse than the current state.

## Reopen Notes — 2026-04-03

- Inspector ETA text had been computed only from the hover snapshot, so `~Ns`, `Time to zero`, and `Time to cap` froze until the next hover or state refresh.
- The clean fix was an inspector-owned elapsed-time hook that counts down locally from the inspected snapshot, rather than pushing timer state into every panel that publishes `setInspected(...)`.

## Reopen Notes — 2026-04-07

- Legacy `ToolbarHappiness.getTooltip()` already exposes a rich term-by-term breakdown for happiness, but the rewrite currently renders only the aggregate percentage in `VillagePanel` and `JobsPanel`.
- The missing piece is not another tooltip. It belongs in the existing inspector model, likely as a dedicated inspector entity populated from the serialized state on hover/focus of the happiness display.
- Implementation landed via a shared client-side `buildHappinessEntity()` helper so both the village header and jobs summary publish the same breakdown rows into the inspector.

## Suggested Sequencing

1. Audit legacy detail surfaces
2. Make product decisions
3. Record ADR for chosen interaction model
4. Prototype one vertical slice:
- resources
- workshop upgrades
- buildings
5. Validate before expanding to other tabs
