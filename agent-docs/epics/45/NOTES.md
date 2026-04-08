# Epic: 45 — Notes

## 2026-04-07 Live Re-Verification

Chrome MCP re-ran the Run 8 comparison against both:

- Legacy runtime via `https://kittensgame.com/web/` using `gamePage.saveImportDropboxText(text)` to force the exact imported snapshot
- Rewrite runtime via `POST /api/game/import-legacy?slot=run8liveverify` plus follow-up reads from `GET /api/game/state?slot=run8liveverify`

This split exposed an important distinction that both Epic 45 closeouts overstated:

- The rewrite's immediate import response is only partially correct. It now preserves the legacy over-cap resource values and returns `effectCache.maxKittens = 579.784...`, but happiness is still wrong and sampled automation metadata is still missing.
- The live rewrite slot state is closer than before, but still not parity-correct. The old resource reclamp and `579 / 562` max-kitten bug are fixed, yet the live slot still diverges on happiness, imported automation metadata, and kitten-cap enforcement.

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
- Kittens: `579 / 579.784...`
- Resources preserve the same over-cap values as legacy
- Building counts, sampled workshop upgrades, sampled policies, and time state match the fixture
- Sampled automation flags are still `null` instead of legacy `oilWell=true`, `factory=true`, `reactor=false`

Rewrite live `GET /api/game/state` after import:

- Calendar advances normally in the running slot
- Happiness: still about `5.025189225345603` (`~503%`) instead of legacy `5.330126107867796` (`533%`)
- Kittens can overflow the cap: Chrome MCP showed `580 / 579.7848879788996 kittens`
- Over-cap resources are now preserved in the live slot instead of reclamping:
  - `catnip`: `837,318,383.192224 / 19,084,828.04614975`
  - `wood`: `112,353,055.47464252 / 38,246,257.09424791`
  - `minerals`: `138,836,389.37918627 / 47,051,845.259919405`
  - `science`: `276,057,022.7414399 / 2,993,500`
  - `faith`: `228,373.76341050008 / 16,400`
  - `antimatter`: `2075.36 / 1000`
  - `unobtainium`: `88,289.38720909761 / 55,950`
- Sampled automation state is only partially restored in live serialization: `factory=true`, `oilWell=null`, `reactor=null`

## Low-overhead audit path

To avoid repeating a full Chrome MCP parity pass for every Epic 45 check, the canonical legacy snapshot from this audit is now checked in at:

- `agent-docs/example-saves/run8-legacy-snapshot.json`

Local audit command:

- `pnpm --filter @kittens/server parity:run8`

What it does:

- loads the real Run 8 legacy save fixture
- imports it through the rewrite's normal migration/load path
- compares the immediate imported snapshot against the canonical legacy snapshot
- advances a fixed number of ticks and checks only the curated live invariants that matter for parity

Chrome MCP is still needed when the canonical legacy snapshot itself must be refreshed or when a mismatch suggests the fixture may be stale.

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

Epic 45 remains open until:

- immediate import happiness matches the canonical legacy snapshot, or the remaining gap is explicitly moved into a separate tracked epic
- imported automation metadata round-trips for sampled buildings (`oilWell`, `factory`, `reactor`)
- the live slot never exceeds `floor(maxKittens)` after import
- the local `parity:run8` command passes cleanly without needing Chrome MCP confirmation

---

## 2026-04-08 Happiness Gap Deep-Dive

**Current parity status** (as of last `pnpm --filter @kittens/server parity:run8` run):
- All fields pass **except one**: `village.happiness`
  - Expected (legacy): `5.330126107867796`
  - Got (rewrite): `5.211745652784964`
  - Gap: `+11.838 pct pts` (rewrite is too low)

### Confirmed rewrite breakdown (verified via debug script against Run 8 save)

```
effectCache.happiness         = 179.61
effectCache.unhappinessRatio  = -0.9990234375
effectCache.luxuryHappinessBonus = 1
effectCache.consumableLuxuryHappiness = 5

kittens       = 579
overPop       = kittens - 5 = 574
unhappiness   = 574 * 2 * (1 + (-0.9990234375)) = 1.12109375

luxury count  = 10 luxury resources with value > 0
  3 uncommon (furs, ivory, spice) × (10+1+5) = 16 each → 48
  7 exotic × (10+1) = 11 each → 77
  total luxury = 125

karma         = 117.68565902849635

happiness_pct = 100 - 1.121 + 179.61 + 125 + 117.686 = 521.175
happiness     = 521.175 / 100 = 5.21175  ✓ matches rewrite output
```

### Legacy formula (from `legacy/js/village.js:756–842`)

```
updateHappines():
  happiness = 100
  happiness -= getUnhappiness()            // (kittens-5)*2*(1+unhappinessRatio), 0 if fascism
  happiness += getEffect("happiness")      // happinessBonus from buildings/upgrades
  happiness += getEnvironmentEffect()      // environmentHappinessBonus + environmentUnhappiness + pollutionEffects["pollutionHappines"]
  happiness += getEffect("challengeHappiness")
  happiness += <luxury loop>               // +10+luxuryHappinessBonus per non-common resource with value > 0
                                           // elderBox skipped if wrappingPaper > 0
                                           // +consumableLuxuryHappiness for uncommon type
  if festivalDays: happiness += 30*(1+festivalRatio)
  happiness += getHappinessFromKarma()     // karma.value directly (modified by upfrontPayment policy)
  if kittens > maxKittens:
    happiness -= (kittens - maxKittens) * 2   // SEPARATE overpopulation penalty
  if happiness < 25: happiness = 25
  this.happiness = happiness / 100
```

### What the rewrite's `computeHappiness` is missing

1. **`getEnvironmentEffect()`** — not implemented at all in rewrite:
   - `environmentHappinessBonus` (from policies like environmentalism/sustainability/conservation)
   - `environmentUnhappiness` (from clearCutting policy: `-2`)
   - `pollutionEffects["pollutionHappines"]` (dynamic based on `cathPollution` value)

2. **`challengeHappiness` effect** — not added to happiness

3. **Separate overpopulation penalty** — the rewrite only has `kittens - 5` penalty (unhappiness), but legacy ALSO has a distinct `kittens - maxKittens` penalty when kittens exceed the housing cap. The rewrite conflates these two into one.

### Environmental effect calculation for Run 8

```
cathPollution = 1807238370.1666284  (from top-level save key, NOT bld.cathPollution)

Pollution level = Math.floor(Math.log10(cathPollution * 10 / 10000000))
               = Math.floor(Math.log10(1807238370))
               = Math.floor(9.257) = ... wait
               = Math.floor(Math.log10(1807238370 * 10 / 10000000))
               = Math.floor(Math.log10(1807.238))
               = Math.floor(3.257) = 3

pollutionHappines = -Math.log(1807238370) * 1.18 ≈ -25.152

Run 8 policies relevant to environmentEffect:
  clearCutting:     researched → environmentUnhappiness: -2
  environmentalism: BLOCKED (clearCutting blocks it) → environmentHappinessBonus: 0
  sustainability:   BLOCKED → 0
  conservation:     not researched → 0

enviromentalEffect = 0 + (-2) + (-25.152) = -27.152
```

### Contradiction / unsolved question

If `enviromentalEffect = -27.152`, then to hit legacy's `533.013%`:
```
100 - 1.121 + happinessBonus + (-27.152) + 0 + 125 + 117.686 = 533.013
happinessBonus = 218.6
```

But known `happiness` effect sources (temple + brewery) only total `179.61`:
- Temple: `(0.4 + 0.1 * sunAltar.on) * temple.on = (0.4 + 0.1*7) * 163 = 1.1 * 163 = 179.3`
- Brewery: `0.01 * 31 = 0.31`
- **Total: 179.61** — can't reach 218.6 (gap of ~39 units)

Chapel does NOT have a `happiness` effect (confirmed in `legacy/js/buildings.js:1832–1860` — only `culturePerTickBase`, `faithPerTickBase`, `cultureMax`).

**Possible sources of the missing ~39 units** (not yet confirmed):
- Religion upgrades that produce a `happiness` effect (e.g., `stargaze`, apocrypha-related)
- Ziggurat upgrades with `happiness` effect
- Workshop upgrades with `happiness` effect
- Science/policy effects that add to `happiness` (e.g., `epicurianism` adds `luxuryHappinessBonus` but that's already counted)
- Possibly the `unhappinessRatio` DR is applied differently in legacy vs. rewrite (per-manager vs. total)

**Or**: The `enviromentalEffect` calculation is wrong, and the actual value is less negative, meaning `happinessBonus` can stay closer to `179.61`. This would require either pollution level ≠ 3 or an additional positive environmental term.

**Critical**: The `happiness` effect from `legacy/js/religion.js` (`religionUpgrades` registered as stackable) has NOT been checked for happiness contributions beyond sunAltar's indirect effect on temple `calculateEffects`. Ziggurat upgrades' effects also not fully audited for `happiness` key.

### DR application difference

Legacy applies diminishing returns (DR) to `unhappinessRatio` **per manager** before adding to `globalEffectsCached` (in `legacy/core.js:updateEffectCached`). The rewrite applies DR to the **total** across all managers. For `LIMITED_DR_EFFECTS` = {catnipDemandRatio, fursDemandRatio, ivoryDemandRatio, spiceDemandRatio, unhappinessRatio}, this difference means the rewrite's `unhappinessRatio` may be slightly off, but the `-0.9990234375` value already makes unhappiness near-zero so this likely isn't the main gap driver.

### 2026-04-08 Resolution: Three Root Causes Found

Investigation steps 1-7 from the prior section are now resolved. Grepped `"happiness"` as an effect key across `legacy/js/religion.js`, `legacy/js/space.js`, `legacy/js/workshop.js` — **zero matches**. The only source of `happiness` effect in legacy is temple (via sunAltar). So `happinessBonus ≈ 179.3` is correct, and the prior "missing ~39 units" contradiction was caused by the three errors below cancelling in misleading ways.

#### Root Cause 1: Amphitheatre stage=1 (broadcastTower) dropped during migration

Legacy save stores `amphitheatre.stage = 1` (broadcastTower). Migration in `legacy-migration.ts` line 79 explicitly drops `stage`. The rewrite defaults to stage 0 (amphitheatre: `unhappinessRatio: -0.048`), but broadcastTower gives `unhappinessRatio: -0.75`.

- Stage 0: raw = -0.048 * 86 = -4.128 → LDR(1) = -0.9828 → unhappiness = 19.78
- Stage 1: raw = -0.75 * 86 = -64.5 → LDR(1) = -0.9990 → unhappiness = 1.12

**Impact: +18.66 happiness points** (the dominant error)

#### Root Cause 2: cathPollution not migrated → missing pollutionHappines

Legacy stores `cathPollution` at save top level (NOT inside buildings). Run 8: `cathPollution = 1,807,238,370`.

```
pollutionLevel = floor(log10(1807238370 * 10 / 10000000)) = floor(3.257) = 3
pollutionHappines = -ln(1807238370) * 1.18 = -25.152
```

Legacy's `getEnvironmentEffect()` sums: `environmentHappinessBonus + environmentUnhappiness + pollutionHappines`

The rewrite only had the first two terms (`0 + (-2) = -2`). Correct value: `0 + (-2) + (-25.152) = -27.152`.

**Impact: -25.15 happiness points**

#### Root Cause 3: Brewery effects wrong

Legacy brewery effects: `festivalRatio: 0.01`, `festivalArrivalRatio: 0.001` — **no `happiness` key**.
Rewrite brewery effects: `happiness: 0.01` — **wrong key**, missing `festivalRatio`.

With 31 breweries:
- Rewrite adds 0.31 to `effectCache.happiness` (wrong, doesn't exist in legacy)
- Rewrite has `festivalRatio = 0` → festival bonus = 30 (wrong)
- Legacy has `festivalRatio = 0.31` (scaled by `amt`; resources abundant so `amt = 1.0`) → festival bonus = 39.3

**Impact: -0.31 (remove wrong happiness) + 9.3 (add festivalRatio) = +8.99 happiness points**

#### Verification: all three corrections close the gap

```
100 - 1.12 + 179.3 + (-27.15) + 0 + 125 + 39.3 + 117.686 - 0 = 533.013
Target: 533.013  ✓ (matches to <0.001)
```

#### Implementation plan

1. **Preserve amphitheatre stage in migration** — store stage in building state; use stage-appropriate effects
2. **Migrate cathPollution** — store in effectCache or new state field; compute pollutionHappines in computeHappiness
3. **Fix brewery effects** — remove `happiness: 0.01`, add `festivalRatio: 0.01` and `festivalArrivalRatio: 0.001`

### Key file references

| File | Lines | What |
|------|-------|------|
| `legacy/js/village.js` | 756–842 | Full `updateHappines()` formula |
| `legacy/js/buildings.js` | 1863–1940 | Temple `calculateEffects()` (sunAltar→happiness) |
| `legacy/js/buildings.js` | 1710–1763 | Brewery: festivalRatio/festivalArrivalRatio, action scaling |
| `legacy/js/buildings.js` | 1764–1800 | Amphitheatre stages: -0.048 (stage0) vs -0.75 (stage1) |
| `legacy/js/buildings.js` | 2458–2513 | `calculatePollutionEffects()` |
| `legacy/js/buildings.js` | 2687–2695 | `getPollutionLevel()` + `getPollutionLevelBase()` |
| `legacy/js/village.js` | 764–768 | `getEnvironmentEffect()` — 3 terms |
| `packages/engine/src/village.ts` | 136–180 | Rewrite `computeHappiness()` |
| `packages/engine/src/buildings.ts` | 256–270 | Brewery def (wrong effects) |
| `packages/engine/src/legacy-migration.ts` | 60–86 | `buildingsArrayToRecord` (drops stage) |
| `agent-docs/example-saves/run8-legacy-snapshot.json` | — | Canonical legacy snapshot for parity |
