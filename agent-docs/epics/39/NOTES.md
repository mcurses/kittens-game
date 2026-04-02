# Epic 39 — Workshop Engineer Assignment Engine Notes

## Legacy Behavior Summary

Mechanization-era workshop behavior is not just presentation. Legacy tracks engineer work against individual craft recipes and uses that state to drive progress, craft throughput, and countdown text.

## Rewrite Gap

Epic 35 correctly deferred Story 35-02 because the engine currently has no per-craft engineer assignment model. This epic exists as that prerequisite so the later UI work can be done faithfully rather than inventing client-only state.
