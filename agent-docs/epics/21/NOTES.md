# Epic: 21 — Feature Parity Audit Notes

## Legacy Behavior Summary

Systematic comparison of each game subsystem against legacy/js/ to find and fix divergences.

## Key Decisions

## Gotchas & Edge Cases

- Resource caps in legacy are recomputed from the current effect cache every update; they are not sticky saved state.
- The rewrite had been falling back to persisted `resource.maxValue` whenever `${name}Max` was absent, which preserved temporary caps forever after the effect source disappeared.
- Save-load needed the same sanitization immediately after rebuilding `effectCache`, otherwise the stale cap survived until the next resource update.

## Open Questions
