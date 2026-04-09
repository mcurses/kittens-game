# Epic 49 — Buildings Advanced Parity

Close remaining buildings ❌ items: stage controls, rename system, filter tabs, cap warnings.

## Stories

### 49-01 Building Stage Controls
**Goal:** Add UI controls for stageable buildings (amphitheatre → broadcastTower).

**ACs:**
- [ ] Stage up/down arrows on stageable buildings
- [ ] Building display updates to show current stage name
- [ ] Stage transition dispatches engine action
- [ ] Test: verify amphitheatre can stage up to broadcastTower

### 49-02 Building Rename System
**Goal:** Show late-game upgraded building names matching legacy rename behavior.

**ACs:**
- [ ] When upgrade unlocks a building rename, display renamed label (Solar Farm, Hydro Plant, etc.)
- [ ] Tooltip/inspector still shows original name as subtitle
- [ ] Rename map driven by engine state (researched upgrades)
- [ ] Test: verify renamed buildings display correctly after relevant research

### 49-03 Building Filter Tabs
**Goal:** Add filter tabs matching legacy's All/Available/Enabled/Togglable/IW filters.

**ACs:**
- [ ] Filter bar above building groups: All, Available, Enabled, Togglable
- [ ] IW (Iron Will) filter shows only IW-relevant buildings
- [ ] Active filter persists during session
- [ ] Building counts shown per filter
- [ ] Test: verify each filter shows correct subset

### 49-04 Almost-Limited Cap Warning
**Goal:** Show warning when near a building cap, matching legacy "almost limited" tooltip.

**ACs:**
- [ ] Inspector shows warning text when building is near its max constructible count
- [ ] Warning appears at ≥80% of cap (or within 1 of cap)
- [ ] Test: verify warning appears at threshold
