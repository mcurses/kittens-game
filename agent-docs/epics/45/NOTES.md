# Epic: 45 — Notes

## 2026-04-07 Live Re-Verification

Chrome MCP re-ran the Run 8 comparison against both:

- Legacy runtime via `https://kittensgame.com/web/` using `gamePage.saveImportDropboxText(text)` to force the exact imported snapshot
- Rewrite runtime via `POST /api/game/import-legacy?slot=run8liveverify` plus follow-up reads from `GET /api/game/state?slot=run8liveverify`

This split exposed an important distinction that the original Epic 45 closeout overstated:

- The rewrite's immediate import response is now partially correct. It preserves the legacy over-cap resource values and returns `effectCache.maxKittens = 579`.
- The live rewrite slot state is still not parity-correct. Once the imported save is running in the normal session loop, the over-cap resources are reclamped to current rewrite caps, `maxKittens` falls back below the imported `579`, happiness still diverges from legacy, and automation metadata for sampled buildings still does not match legacy.

### 2026-04-07 snapshot comparison

Legacy imported snapshot (`gamePage.saveImportDropboxText(text)`):

- Calendar: `year 10527`, `season 2`, `day 48`
- Happiness: `5.330126107867796` (`533%`)
- Kittens: `579 / 579`
- Resources:
  - `catnip`: `837,318,451.904724`
  - `wood`: `112,353,055.47464252`
  - `minerals`: `138,836,437.52918628`
  - `science`: `276,057,022.7414399`
  - `faith`: `228,373.76341050008`
  - `antimatter`: `2075.36`
  - `unobtainium`: `88,289.38720909761`
- Building automation sample:
  - `oilWell.isAutomationEnabled = true`
  - `factory.isAutomationEnabled = true`
  - `reactor.isAutomationEnabled = false`

Rewrite immediate `POST /api/game/import-legacy` response:

- Calendar: `year 10527`, `season 2`, `day 48`
- Happiness: `1`
- Kittens: `579 / 579`
- Resources preserve the same over-cap values as legacy
- Building counts, sampled workshop upgrades, sampled policies, and time state match the fixture

Rewrite live `GET /api/game/state` after import:

- Calendar had already advanced to `year 10527`, `season 2`, `day 70`
- Happiness: `5.025189225345603` (`~503%`)
- Kittens: `579 / 562.2117248568917`
- Resources reclamped to rewrite-side caps:
  - `catnip`: `4,542,021.932262143 / 19,084,828.04614975`
  - `wood`: `16,882,353.86306223 / 38,246,257.09424791`
  - `minerals`: `18,200,195.197271954 / 47,051,845.259919405`
  - `science`: `2,993,500 / 2,993,500`
  - `faith`: `16,400 / 16,400`
  - `antimatter`: `1000 / 1000`
  - `unobtainium`: `55,950 / 55,950`
- `_legacyMaxKittensImported` no longer exists in the live effect cache
- Sampled building automation flags are still absent (`null`) in the serialized rewrite state

## Why This Epic Exists

Live comparison against the provided save `agent-docs/example-saves/Kittens Game - Run 8 - Year 10527 - Autumn, day 48.txt` showed that the rewrite does not currently reproduce legacy runtime state after import.

The audit used:

- Legacy: `https://kittensgame.com/web/`, imported save, paused
- Rewrite: `http://localhost:5173/?slot=run8-fresh`, imported save into a fresh slot
- Comparison method: Chrome MCP UI snapshots plus runtime-state reads from browser console / fetch

## High-Signal Findings

### 1. Over-cap resources are being truncated on rewrite import

Legacy imported runtime preserved very large stocks:

- `catnip`: `837,318,451.90`
- `wood`: `112,353,055.47`
- `minerals`: `138,836,437.53`
- `science`: `276,057,022.74`
- `faith`: `228,373.76`
- `antimatter`: `2075.36`
- `unobtainium`: `88,289.39`

Rewrite immediate imported snapshot in `run8-fresh` clamped those same resources to current cap-sized values:

- `catnip`: `4,232,100`
- `wood`: `16,828,432.5`
- `minerals`: `18,054,050.5`
- `science`: `2,993,500`
- `faith`: `16,400`
- `antimatter`: `1000`
- `unobtainium`: `55,950`

This is not a small numeric drift. It is the dominant parity failure in the import path.

### 2. Population-derived state is inconsistent after import

Both sides imported `579` kittens, but:

- Legacy `maxKittens`: `579`
- Rewrite `maxKittens`: `562`

The rewrite header visibly showed `579 / 562`, which is not a valid legacy-equivalent imported snapshot.

### 3. Happiness diverges materially

- Legacy happiness: about `469.06%`
- Rewrite happiness: about `502.52%`

This suggests either missing or misapplied imported derived-state terms after migration/load.

### 4. Not everything is broken

The comparison also found several categories that line up well:

- Building counts matched across the sampled late-game set:
  - `barn 29`
  - `warehouse 22`
  - `harbor 297`
  - `oilWell 190`
  - `factory 126`
  - `reactor 112`
  - `biolab 751`
  - `aiCore 17`
  - `accelerator 99`
  - `chronosphere 18`
- Sampled workshop upgrade research state matched:
  - `stoneBarns`
  - `reinforcedBarns`
  - `reinforcedWarehouses`
  - `cargoShips`
  - `barges`
  - `pumpjack`
  - `coldFusion`
  - `thoriumReactors`
- Sampled policy state matched:
  - `tradition`
  - `authocracy`
  - `communism`
  - `expansionism`
  - `diplomacy`
  - `culturalExchange`
  - `epicurianism`
  - `extravagance`
  - `mysticism`
  - `clearCutting`
  - `fullIndustrialization`
- Time state partially matched:
  - `flux` matched exactly at `9414.981333344942`
  - `heat` matched at `0`

This narrows the problem. The migration is carrying a lot of structure correctly, but the imported snapshot is not preserving legacy resource/cap semantics end-to-end.

## Likely Root-Cause Area

Most likely failure points to inspect when implementation starts:

- `packages/engine/src/legacy-migration.ts`
- `packages/engine/src/state.ts`
- `packages/engine/src/resources.ts`
- `packages/server/src/app.ts`
- Any deserialize/load/import path that rebuilds caps and then clamps imported `resources[*].value`

The current behavior strongly suggests the rewrite is normalizing imported resource values against current `maxValue` too early, instead of preserving over-cap legacy stock the way legacy does after import.

## Live Audit Caveats

- The rewrite auto-ticks, so late reads from an already-open slot drift quickly. The most trustworthy rewrite comparison point is the immediate post-import state from a fresh slot.
- The legacy page remained paused after import, which made its runtime values stable and suitable for comparison.
- Because the rewrite is not paused via a public UI/API path today, future parity tests should assert against the immediate post-import server snapshot rather than a later UI state.

## Expected Follow-Up

Epic 45 should remain open until both the immediate import response and the live running slot state match legacy closely enough to pass a Chrome MCP live audit. Minimum remaining requirements:

- imported over-cap resources remain preserved after the imported slot enters normal runtime updates
- derived housing/storage stats remain legacy-faithful in the live slot, including `maxKittens`
- happiness matches legacy closely enough for live parity, or the remaining gap is explicitly filed and tracked
- automation/on-off metadata for imported buildings survives migration/load and matches legacy where applicable
