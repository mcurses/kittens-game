# Epic 37 — Building Control Granularity Parity

Close the remaining bonfire control-surface gap where the rewrite currently flattens all toggleable buildings into a simple `On` / `Off` UI. Legacy distinguishes two different interaction models:

- `togglable`: adjust active count anywhere from `0..val`
- `togglableOnOff`: switch the whole building set between `0` and `val`

The rewrite already tracks `on` counts in state, but the web UI still presents smelter-style buildings as binary toggles and does not expose legacy batch controls.

Legacy references:
- `legacy/core.js:340-350` — automatic `togglable` defaults via `lackResConvert`
- `legacy/core.js:1606-1632` — `togglableOnOff` link model
- `legacy/core.js:1894-1937` — `togglable` per-count controls (`-`, `-25`, `-All`, `+`, `+25`, `+All`)
- `legacy/core.js:2025-2029` — display `(on/val)` for partially-enabled togglable buildings
- `legacy/js/buildings.js:998-1079` — smelter definition (`lackResConvert`)

---

## Story 37-01 — Engine-owned building control-mode metadata

**Why it exists**: The client should not infer whether a building is count-adjustable or binary. Legacy semantics belong in engine-owned control metadata.

**ACs**:
- [x] `deriveUiVisibility()` (or successor contract) distinguishes at least:
  - count-adjustable controls for legacy `togglable`
  - binary controls for legacy `togglableOnOff`
  - automation controls where applicable
- [x] Smelter, calciner, mint, and accelerator resolve to count-adjustable controls
- [x] Steamworks resolves to binary controls plus automation controls
- [x] Buildings without player-facing toggles resolve to no toggle controls
- [x] Unit tests cover mixed examples so future UI work cannot flatten them back together

### Legacy Reference
- `legacy/core.js:340-350`
- `legacy/core.js:1606-1632`
- `legacy/core.js:1894-1937`

### Status: [x] Tests | [x] Impl | [ ] Rated

## Story 37-02 — Building count-adjust action surface

**Why it exists**: Legacy count-adjustable buildings are not merely "enable one" / "disable one"; the UI exposes batch quantity affordances and the engine/API should model that cleanly.

**ACs**:
- [x] Engine action surface supports count-adjust semantics needed by legacy UI:
  - increment by 1
  - decrement by 1
  - increment by 25
  - decrement by 25
  - enable all remaining
  - disable all active
- [x] `packages/api-spec/openapi.yaml` and generated schemas are updated in the same story
- [x] Actions clamp safely at `0..val`
- [x] Existing single-step enable/disable behavior remains correct for clients or tests that still use it
- [x] Unit tests cover clamping, partial counts, and no-op cases

### Legacy Reference
- `legacy/core.js:1894-1937`
- `legacy/core.js:2263-2267`

### Status: [x] Tests | [x] Impl | [ ] Rated

## Story 37-03 — Web UI quantity controls for count-adjustable buildings

**Why it exists**: Smelter-style buildings need the legacy count-adjust interaction model in the web client, not a binary `On` / `Off` pair.

**ACs**:
- [ ] Count-adjustable buildings render `-`, `-25`, `-All`, `+`, `+25`, `+All` controls
- [ ] Building count display shows `(on/val)` when partially enabled and a compact single count when fully enabled
- [ ] Smelter row specifically matches legacy expectations for partial enablement
- [ ] Controls disable correctly at bounds (`on = 0`, `on = val`, fewer than 25 active/inactive, etc.)
- [ ] Client tests cover smelter and at least one other count-adjustable building

### Legacy Reference
- `legacy/core.js:1894-1937`
- `legacy/core.js:2025-2029`
- `legacy/js/buildings.js:998-1079`

### Status: [ ] Tests | [ ] Impl | [ ] Rated

## Story 37-04 — Binary toggle parity for on/off-only buildings

**Why it exists**: Once count-adjustable controls are restored, the rewrite still needs to preserve true binary controls only for the buildings that legacy treats as `togglableOnOff`.

**ACs**:
- [ ] Binary `On/Off` controls remain only on legacy on/off buildings
- [ ] Steamworks keeps binary on/off controls and automation controls
- [ ] Count-adjustable buildings no longer render binary `On/Off`
- [ ] Regression tests cover at least one count-adjustable building and one binary-toggle building in the same matrix
- [ ] `PARITY.md` notes the distinction explicitly so future passes do not collapse the two models again

### Legacy Reference
- `legacy/core.js:1606-1632`
- `legacy/core.js:1944-1996`
- `legacy/core.js:2025-2029`

### Status: [ ] Tests | [ ] Impl | [ ] Rated
