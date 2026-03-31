# Epic 32 — UI Parity Pass

Close all UI gaps found in the Year 10527 live parity audit. These are presentation and interaction gaps — missing data display, wrong labels, missing sections — not engine gaps. Engine must be correct first (Epics 29–31) before final polish here, but most stories are independent.

Legacy reference: visual comparison via `legacy/js/ui/` and browser screenshots

---

## Story 32-01 — Religion tab: TU (Cryptotheology) section

**Why it exists**: The Religion tab ends at Transcendence Tier — no TU (Transcendence Upgrade) section is rendered. Legacy shows a "Cryptotheology" section with Black Obelisk, Black Nexus, Black Core, Event Horizon, Black Library. Live save has Black Obelisk val:1, entirely invisible.

**ACs**:
- [ ] Religion tab renders a TU section when any TU item is `unlocked:true` or `val > 0`
- [ ] Each TU item shows name, val, cost, buy button
- [ ] Black Obelisk (val:1 from imported save) is visible after import
- [ ] PARITY.md Religion UI gaps: TU section row updated

---

## Story 32-02 — Religion tab: one-time RU upgrades display "Done"

**Why it exists**: SolarRevolution (×1), Apocrypha (×1), Transcendence (×1) are one-time purchases. Once `val >= 1`, legacy shows them as "Done" rather than displaying a Buy button.

**ACs**:
- [ ] RU items with `maxVal: 1` (or `val >= 1`) show a "Done" state instead of a Buy button
- [ ] Visual distinction is clear (greyed out label or "✓ Done" text)
- [ ] PARITY.md Religion UI gaps: one-time RU row updated

---

## Story 32-03 — Religion tab: praise/adore multiplier display

**Why it exists**: Legacy shows "Praise the sun! [+254.178K%]" and "Adore the galaxy [×144]" with computed multipliers next to the action buttons. Rewrite buttons have no multiplier info.

**ACs**:
- [ ] Praise button shows computed worship gain multiplier (derived from faith ratio + transcendence tier)
- [ ] Adore button shows computed galaxy adoration multiplier when applicable
- [ ] Values update reactively with game state changes
- [ ] PARITY.md Religion UI gaps: praise/adore row updated

---

## Story 32-04 — Buildings tab: on/off state and label fixes

**Why it exists (on/off)**: Buildings have both `val` (built count) and `on` (active count). Rewrite shows only val. Legacy shows "9/12" when on≠val.

**Why it exists (labels)**: Buildings display as camelCase internal keys (`LumberMill`, `LogHouse`) instead of human-readable labels.

**Why it exists (rename system)**: Late-game upgrades rename buildings. Pasture → Solar Farm, Aqueduct → Hydro Plant, Library → Data Center, Amphitheatre → Broadcast Tower. Rewrite always shows base names.

**ACs**:
- [ ] Building rows show `on/val` format when `on !== val` (e.g., "9/12")
- [ ] Building rows show `val` when `on === val`
- [ ] All buildings have `label` strings in their defs (matching legacy display names)
- [ ] Buildings panel renders `label` not internal `name`
- [ ] Building rename system: upgrades that rename buildings update the displayed label when researched (cross-reference `legacy/js/buildings.js` `stages` system or upgrade effects that set `label`)
- [ ] PARITY.md Buildings UI gaps rows updated

---

## Story 32-05 — Trade tab: economics and race detail

**Why it exists**: Trade tab shows only race name + embassy level + two buttons. Legacy shows per-race economics: resources they buy (with cost), resources they sell (with quantity ranges), relationship status (Neutral/Friendly/Hostile), caravan ×N buttons.

**ACs**:
- [ ] Each race panel shows what resources they trade (buy cost, sell ranges) — sourced from `RACE_DEFS` in diplomacy engine
- [ ] Relationship status displayed per race (Neutral / Friendly / Hostile derived from `embassyLevel` or a `relation` field)
- [ ] Caravan quantity buttons (×1, ×N, max) present and functional
- [ ] Leviathan energy display when leviathan is unlocked (Energy: X/max, time to leave)
- [ ] PARITY.md Trade UI gaps rows updated

---

## Story 32-06 — Space tab: mission done state and building on/off

**Why it exists (missions)**: All mission buttons show "Launch" regardless of whether the planet is already reached. A planet that has been reached (and buildings built) should show a different state.

**Why it exists (on/off)**: Space building counts show only `val`, not `on/val`. ContainmentChamber shows "12" not "9/12".

**ACs**:
- [ ] Planets that are `reached:true` show a "Reached" or "Explore" state instead of "Launch"
- [ ] Space building rows show `on/val` when `on !== val`
- [ ] On/off toggle button present for space buildings (or at minimum the ratio is displayed)
- [ ] PARITY.md Space UI gaps rows updated

---

## Story 32-07 — Village tab: happiness display and management actions

**Why it exists**: Village/Jobs tab has no happiness percentage display. Legacy Dominion tab prominently shows "Happiness: 533%". Also missing: festival duration display, and key management actions (Hold Festival button).

**ACs**:
- [ ] Jobs/Village tab shows current happiness percentage (e.g., "Happiness: 533%")
- [ ] When `festivalDays > 0`, shows festival duration remaining (e.g., "Festival: 172d remaining")
- [ ] "Hold Festival" action button available when prerequisites are met (catpower cost)
- [ ] Kittens capacity shows correct max from housing (fixing the 579/562 over-capacity display requires buildings to provide correct storage — note as dependency on Epic 31)
- [ ] PARITY.md Village/Jobs UI gaps rows updated

---

## Story 32-08 — Resource sidebar: maxValue and per-tick display

**Why it exists**: All resources show `/0.00` for maxValue because storage caps are not computed. Root cause is partially missing buildings — barn and warehouse defs may not wire their `woodMax`/`mineralMax` effects correctly. Also: legacy shows catnip with `[-15%]` demand reduction suffix.

**ACs**:
- [ ] Verify barn and warehouse effect keys (`woodMax`, `mineralMax`, `ironMax`, etc.) are correctly wired in resource max calc — fix if not
- [ ] Resources that have non-zero max from implemented buildings show the correct cap
- [ ] Resources with no cap source still show a sensible display (e.g., `∞` or just the value)
- [ ] Catnip row shows demand reduction indicator when `catnipDemandRatio < 0` (e.g., suffix or tooltip)
- [ ] PARITY.md Resource sidebar gaps rows updated
