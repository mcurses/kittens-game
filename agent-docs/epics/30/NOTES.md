# Epic 30 — Notes

## Legacy Behavior Summary

### `updateHappines()` full formula (village.js:795)
```
happiness = 100
- getUnhappiness()           // (kittens-5)*2*(1+unhappinessRatio), 0 if fascism policy
+ getEffect("happiness")     // brewery, temple contributions via effectCache
+ getEnvironmentEffect()     // pollution effects — SKIP (not implemented)
+ getEffect("challengeHappiness") // SKIP (not implemented)
+ luxuryLoop                 // per non-common resource with value>0
+ festivalBonus              // +30*(1+festivalRatio) if festivalDays>0
+ getHappinessFromKarma()    // +1 per karma point
- getOverpopulation()*2      // kittens above maxKittens — partial (needs all housing)
clamp to 25
```

### Luxury loop (village.js:808–822)
```javascript
happinessPerLuxury = 10 + getEffect("luxuryHappinessBonus")
for each resource where type != "common" and value > 0:
  happiness += happinessPerLuxury
  // special: elderBox + wrappingPaper don't stack
  if name == "elderBox" and wrappingPaper.value > 0:
    happiness -= happinessPerLuxury  // cancel elderBox if wrappingPaper present
  if type == "uncommon":
    happiness += getEffect("consumableLuxuryHappiness")
```

Non-common resource types (from resources.js):
- uncommon: furs, ivory, spice
- rare: unicorns, alicorn, necrocorn, tears, karma
- exotic: relic, void, elderBox, wrappingPaper, blackcoin, bloodstone, tMythril

Common (no happiness bonus): paragon, burnedParagon, timeCrystal, sorrow, plus all raw/craft resources

### Temple happiness (buildings.js:1915–1918)
```javascript
// Inside temple.calculateEffects():
var sunAltar = game.religion.getRU("sunAltar");
if (sunAltar.on) {
  effects["happiness"] = 0.4 + 0.1 * sunAltar.on;
  effects["faithMax"] += 50 * sunAltar.on;
}
```
Per-temple contribution, scales by `temple.on` (active count).
In new engine: `state.religion.religionUpgrades.sunAltar.on`.

### Karma happiness (village.js:778–792)
```javascript
// karma is a resource (resPool.get("karma").value)
// +1% happiness per karma point
// Modified by upfrontPayment policy * debtPenaltyRatio — SKIP (late-game)
return karma;
```
In new engine: `state.resources.karma?.value ?? 0`

### Festival bonus (village.js:824–826)
```javascript
if (this.game.calendar.festivalDays) {
  happiness += 30 * (1 + this.game.getEffect("festivalRatio"));
}
```
festivalDays decrements per tick in CalendarManager.

### Brewery consumption (buildings.js:1734–1735)
```javascript
// Per active brewery per tick:
catnipPerTickCon: -1 * (1 + getEffect("breweryConsumptionRatio"))
spicePerTickCon: -0.1 * (1 + getEffect("breweryConsumptionRatio"))
```

## Key Decisions

1. **Temple happiness computed in BuildingManager.updateEffects**, not as a static effect. Uses `state.religion.religionUpgrades.sunAltar.on` from previous tick effectCache round.

2. **Luxury loop in VillageManager.update()** (not updateEffects) since it reads resource values. `LUXURY_RESOURCE_NAMES` defined as a constant set.

3. **Karma read from `state.resources.karma?.value`** — no new state field needed. Karma is already a resource.

4. **festivalDays added to CalendarState** — new optional field. Legacy-migration preserves it if present.

5. **Brewery consumption in BuildingManager.updateEffects** after main loop — reads `breweryConsumptionRatio` from effectCache (one-tick-behind, acceptable).

## Gotchas & Edge Cases

- Temple happiness: `0.4 + 0.1 * sunAltarOn` is per-temple, multiplied by `temple.on`. If sunAltar.on = 0, base is 0.4 per temple.
- elderBox/wrappingPaper non-stacking: rare edge case but must implement correctly.
- Festival decrement: `festivalDays--` per tick (not per real-time second). CalendarManager.update handles it.
- `consumableLuxuryHappiness` is the extra bonus for "uncommon" resources only (furs, ivory, spice).

## Open Questions

- `getEnvironmentEffect()` (pollution) and `challengeHappiness` — skip for now, no producers implemented.
- `getOverpopulation()` penalty — needs maxKittens from all buildings; defer until buildings are complete.
