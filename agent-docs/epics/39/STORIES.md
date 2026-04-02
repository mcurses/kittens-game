# Epic 39 — Workshop Engineer Assignment Engine

Add the missing engine state and action surface required for mechanization-era per-craft engineer controls. Epic 35 documented that mechanization UI parity is blocked until the engine can track engineer assignment per craft.

Legacy references:
- `legacy/js/workshop.js:2868-2920` — mechanization progress and engineer assignment behavior
- `legacy/js/workshop.js:3118-3143` — mechanization-related workshop UI and throughput details

---

## Story 39-01 — Per-craft engineer assignment state and actions

**Why it exists**: Mechanization UI parity cannot be implemented without engine-owned craft assignment state and actions.

**ACs**:
- [x] Workshop/craft state tracks assigned engineers per craft
- [x] Engine actions exist to assign and unassign engineers per craft
- [x] Assignment respects available engineer population and craft unlock state
- [x] Save/load preserves per-craft assignment state
- [x] Engine tests cover assignment bounds, reassignment, and persistence

### Legacy Reference
- `legacy/js/workshop.js:2868-2920`

### Status: [x] Tests | [x] Impl | [x] Rated
