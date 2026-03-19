# Epic 12: Challenges — Notes

## Legacy Behavior Summary

### ChallengeEntry fields
- `unlocked`: visible to player (gated on `adjustmentBureau` perk)
- `active`: currently running this challenge (one at a time)
- `researched`: completed at least once (boolean flag for "ever completed")
- `on`: completion count (stackable reward accumulator)
- `pending`: player has queued this challenge for next soft-reset

### Effect stacking model
The legacy `getEffect(challenge, effectName)` function in the constructor:
1. Get base `amt = challenge.effects[effectName] || 0`
2. If `noStack` → return amt directly (no multiplication)
3. Else `amt *= challenge.on`
4. If `LDRLimit` → `amt = getLimitedDR(amt, LDRLimit)`
5. If `capMagnitude` → clamp magnitude (sign preserved)

### Active vs passive effects
Most challenges have `calculateEffects(self, game)` that switches effects based on `self.active`.
When active, they apply **penalties**. When inactive (completed), they apply **rewards**.
In our engine we model this as two separate effect records in the ChallengeDef:
- `activeEffects`: used when `active == true` (no stacking by on)
- `passiveEffects`: used when `active == false` (stacked by on with optional LDR)

### Challenges that depend on future epics
- `winterIsComing` completion condition: `game.space.getPlanet("helios").reached` → Epic 13
- `anarchy` completion condition: `game.bld.get("aiCore").val > 0` → Epic 13
- `energy` completion condition: requires space buildings → Epic 13
- `atheism` completion condition: `game.time.getVSU("cryochambers").on > 0` → Epic 15
- `1000Years` completion: chronoforge/temporal press → Epic 15
- `blackSky` completion: space beacons → Epic 13
- `pacifism` completion: outerSpaceTreaty policy → Epic 14
- `unicornTears` completion: necrocorn resource → deferred
- `postApocalypse` completion: requires cathPollution system → deferred

**Conclusion**: All completion conditions are deferred. We model the challenge state and effect system. COMPLETE_CHALLENGE is an explicit action the server/client would fire when the completion condition is satisfied.

### ironWill
Not a normal challenge — it's a game mode flag. When active, game starts with IW constraints (no trade, etc.). In legacy it's `this.getChallenge("ironWill").active = this.game.ironWill`. We model it as a regular challenge entry with `active` flag; the IW gameplay effects are in other managers.

### Reserves (Chronosphere system)
`reserveMan` is deeply tied to Chronospheres (Epic 15 — Time Mechanics) and Space (Epic 13). It saves resources/kittens on reset and restores them. **Deferred to Epic 15.**

### Key formulas verified
- Stacking: `effect = base * on` → then optionally `getLimitedDR(effect, LDRLimit)`
- capMagnitude: `Math.max(-cap, Math.min(cap, effect))`
- kittenLaziness when active: `0.5 + getLimitedDR(0.05 * on, 0.25)` (NOT the standard stacking)

## Key Decisions
- Completion conditions are deferred; COMPLETE_CHALLENGE is an explicit action
- reserveMan is deferred to Epic 15
- ironWill is modeled as a regular challenge with active flag
- Active effects and passive effects stored separately in ChallengeDef
- updateEffects must handle both active and passive states

## Gotchas & Edge Cases
- Legacy saves: `researched=true` + `on=0` → set `on=1` on load
- Legacy saves: `currentChallenge` field (old format) → set that challenge's `active=true`
- `anarchy.kittenLaziness` when active is NOT simple stacking: `0.5 + getLimitedDR(0.05 * on, 0.25)`
- `blackSky.bskSattelitePenalty` when active: `0.1 * (game.ironWill ? 0 : (self.on || 0))` — depends on IW mode
- `defaultUnlocked` challenges: ironWill, winterIsComing, anarchy (energy, atheism, etc. are NOT defaultUnlocked)
- `unicornTears` has a feature flag `UNICORN_TEARS_CHALLENGE` — in our engine we include it normally

## Open Questions
- Should we include the challenge unlock mechanism (gated on adjustmentBureau perk)? → Yes, ChallengeManager.load() should apply unlock chains
