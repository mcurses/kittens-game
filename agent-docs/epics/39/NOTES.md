# Epic 39 — Workshop Engineer Assignment Engine Notes

## Legacy Behavior Summary

Mechanization-era workshop behavior is not just presentation. Legacy tracks engineer work against individual craft recipes and uses that state to drive progress, craft throughput, and countdown text.

## Rewrite Gap

Epic 35 correctly deferred Story 35-02 because the engine currently has no per-craft engineer assignment model. This epic exists as that prerequisite so the later UI work can be done faithfully rather than inventing client-only state.

## Key Decisions

- The rewrite now models `engineer` as a real village job in engine state. Without that, "available engineers" is not a meaningful constraint.
- Per-craft assignment is stored directly on workshop craft entries as an engineer count, not as client-only UI state.
- The new action surface is intentionally narrow: assign or unassign one engineer per dispatch. Batch controls can be added later if the mechanization UI needs them.
