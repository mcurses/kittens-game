# Epic: 42

**Status:** In Progress
**Started:** 2026-04-06
**Legacy refs:** `legacy/js/workshop.js`, `legacy/js/resources.js`, `legacy/js/buildings.js`

---

## Story: Workshop storage ratios affect storage caps

**As a** player
**I want** storage upgrades like `stoneBarns` to change the actual storage caps they target
**So that** buying those upgrades immediately improves my capacity the same way it does in legacy

### Acceptance Criteria
- [x] Given a researched `stoneBarns` upgrade and one barn, when the effect cache is rebuilt, then `woodMax`, `mineralsMax`, and `ironMax` include the legacy `barnRatio` multiplier
- [x] Given a researched `stoneBarns` upgrade and one warehouse, when the effect cache is rebuilt, then warehouse storage outputs also include the legacy `barnRatio` multiplier on `woodMax`, `mineralsMax`, and `ironMax`
- [x] Given a researched `stoneBarns` upgrade and one harbor, when the effect cache is rebuilt, then harbor storage outputs also include the legacy `barnRatio` multiplier on `woodMax`, `mineralsMax`, and `ironMax`
- [x] Given `barnRatio` or `warehouseRatio` effects, when a storage building contributes `coalMax`, `titaniumMax`, or `goldMax`, then only the legacy `warehouseRatio` multiplier is applied
- [x] Given researched `silos` and researched `stoneBarns`, when a barn/warehouse/harbor contributes `catnipMax`, then the legacy partial `barnRatio * 0.25` multiplier is applied

### Legacy Reference
- `legacy/js/workshop.js` lines 187-200
- `legacy/js/resources.js` lines 853-874
- `legacy/js/buildings.js` lines 747-923

### Status: [x] Tests | [x] Impl | [x] Rated

## Story: Resource caps refresh immediately after state-changing actions

**As a** player
**I want** storage cap changes to appear immediately after buying the relevant upgrade or building
**So that** the resource panel and affordability checks reflect the new capacity without waiting for a later load path

### Acceptance Criteria
- [x] Given a store action that changes storage effects, when the action succeeds, then serialized `resources[*].maxValue` values are recomputed from the new effect cache before the response is returned
- [x] Given a successful `PURCHASE_UPGRADE` of `stoneBarns`, when the action response is serialized, then `wood.maxValue` reflects the new legacy-faithful cap immediately
- [x] Given a successful `BUY_BUILDING` of a storage building, when the action response is serialized, then the returned `resources[*].maxValue` values reflect the newly built storage immediately

### Legacy Reference
- `legacy/js/resources.js` lines 853-890
- `legacy/js/workshop.js` lines 187-200
- `legacy/js/buildings.js` lines 747-923

### Status: [x] Tests | [x] Impl | [x] Rated
