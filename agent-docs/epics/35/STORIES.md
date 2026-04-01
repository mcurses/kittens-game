# Epic 35 — UI QoL Parity

Close the remaining legacy UI quality-of-life gaps that still make the rewrite feel thinner than the original even when the underlying systems are present.

Legacy reference:
- `legacy/js/jsx/left.jsx.js`
- `legacy/js/workshop.js`
- `legacy/js/science.js`
- `legacy/js/space.js`
- `legacy/js/diplomacy.js`
- `legacy/js/village.js`

---

## Story 35-01 — Workshop craft shortcut parity

**Why it exists**: Legacy craft rows are not fixed-size buttons. They adapt to available source materials, support percentage mode, expose `All`, and show output/cost affordances that account for craft bonus and recipe inputs. The rewrite currently hardcodes `×1/×5/×25/×100`.

**ACs**:
- [x] Craft rows compute legacy shortcut counts: `max(1, 1%)`, `max(25, 5%)`, `max(100, 10%)`, and `All`
- [ ] Shortcut labels can present amount mode and percentage mode parity with legacy settings (deferred — legacy percentage mode requires settings flag; amount mode implemented)
- [ ] Craft affordances show actual output after craft bonus and actual source-material spend for the chosen shortcut (deferred — cost-per-shortcut display not in scope)
- [x] Workshop tab shows the global craft effectiveness summary (`craftRatio` displayed as `+N% effectiveness`)
- [x] PARITY.md UI QoL notes updated

---

## Story 35-02 — Workshop mechanization and engineer craft controls

**Why it exists**: Legacy mechanization adds per-craft engineer assignment, progress percentages, tier/craft bonus detail, and throughput/countdown information. The rewrite exposes none of that UI.

**Status**: Deferred — requires engineer-assignment engine state that does not exist in the rewrite. Mechanization craft controls are blocked until the engine tracks assigned engineers per craft.

**ACs**:
- [ ] Mechanization-gated craft progress and engineer counts are rendered when unlocked
- [ ] Per-craft engineer assignment/unassignment controls exist with legacy-faithful quantities
- [ ] Craft inspector/tooltip surfaces tier bonus, progress handicap, and crafts-per-second or countdown information
- [ ] PARITY.md Workshop / Science UI QoL gaps rows updated

---

## Story 35-03 — Hide-complete toggles across science, workshop, and space

**Why it exists**: Legacy gives the player control over list noise via `hideResearched` / `hide complete missions` toggles. The rewrite currently keeps completed content permanently visible.

**ACs**:
- [x] Science tab exposes a persistent hide-researched toggle
- [x] Workshop tab exposes a persistent hide-researched toggle
- [x] Space tab exposes a persistent hide-complete-missions toggle
- [x] Hidden items remain accessible when toggles are off and stay hidden across reloads when toggles are on (uses `usePersistentUiState` backed by localStorage)
- [x] PARITY.md relevant rows updated

---

## Story 35-04 — Resource and action-surface QoL parity

**Why it exists**: Legacy left-panel UX includes resource-table organization, per-resource visibility editing, and quantity shortcuts for repetitive actions like trade and hunting. The rewrite has only the minimal core controls.

**ACs**:
- [ ] Dual resources are displayed in the same table location as legacy after recipe unlocks (deferred)
- [ ] Player can hide/show resource rows similarly to legacy edit mode (deferred)
- [x] Trade panel exposes multi-send shortcuts (×5 and ×25 buttons added; note: legacy uses dynamic half/fifth rather than fixed counts — filed as gap below)
- [ ] Village panel exposes missing repetitive-action shortcuts such as send hunters quantities once their engine actions exist (deferred)
- [x] PARITY.md Trade UI gaps row updated

**Parity gap noted**: Legacy trade shortcuts are dynamic (`tradeHalf = floor(tradeMax / 2)` and `tradeFifth = floor(tradeMax / 5)`) not fixed ×5/×25. The rewrite's fixed shortcuts are functional but not strictly faithful. Filed for a future epic.
