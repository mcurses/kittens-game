# Epic: Workshop / Upgrades

**Status:** In Progress
**Started:** 2026-03-17
**Legacy refs:** `legacy/js/workshop.js`, `legacy/game.js` (getResCraftRatio)

---

## Story 1: UpgradeDef and WorkshopState shape

**As a** game engine
**I want** static upgrade definitions and a WorkshopState type
**So that** upgrades are fully defined and queryable

### Acceptance Criteria
- [ ] Given `UPGRADE_DEFS`, then it is a readonly array of `UpgradeDef` objects
- [ ] Given an `UpgradeDef`, then it has `name: string`, `prices: PriceEntry[]`, optional `effects: Record<string,number>`, and optional `unlocks: {upgrades: string[]}`
- [ ] Given `UPGRADE_DEFS`, then it contains "mineralHoes" with `effects: {catnipJobRatio: 0.5}`
- [ ] Given `UPGRADE_DEFS`, then it contains "ironHoes" with `prices: [{name:"iron",val:25},{name:"science",val:200}]`
- [ ] Given `WorkshopState`, then it has `upgrades: Record<string, UpgradeEntry>` where `UpgradeEntry = {unlocked: boolean, researched: boolean}`
- [ ] Given `createInitialWorkshop()`, then exactly 6 upgrades are `unlocked=true`: mineralHoes, ironHoes, mineralAxes, ironAxes, stoneBarns, reinforcedBarns
- [ ] Given `createInitialWorkshop()`, then no upgrade is `researched=true`

### Legacy Reference
- `legacy/js/workshop.js` lines 7–1987 (upgrades array), lines 2344–2357 (resetState — initial unlocked set)

### Status: [ ] Tests | [ ] Impl | [ ] Rated

---

## Story 2: CraftDef and craft state

**As a** game engine
**I want** static craft definitions and craft state in WorkshopState
**So that** crafting recipes are fully defined

### Acceptance Criteria
- [ ] Given `CRAFT_DEFS`, then it is a readonly array of `CraftDef` objects
- [ ] Given a `CraftDef`, then it has `name: string`, `prices: PriceEntry[]`, `tier: number`, and `ignoreBonuses: boolean`
- [ ] Given `CRAFT_DEFS`, then it contains "wood" with `prices: [{name:"catnip",val:100}]`, `tier: 1`, `ignoreBonuses: true`
- [ ] Given `CRAFT_DEFS`, then it contains "steel" with `prices: [{name:"coal",val:100},{name:"iron",val:100}]`, `tier: 2`
- [ ] Given `WorkshopState`, then it has `crafts: Record<string, CraftEntry>` where `CraftEntry = {unlocked: boolean}`
- [ ] Given `createInitialWorkshop()`, then exactly 8 crafts are `unlocked=true`: wood, beam, slab, plate, gear, scaffold, manuscript, megalith
- [ ] Given `createInitialWorkshop()`, then all other crafts are `unlocked=false`

### Legacy Reference
- `legacy/js/workshop.js` lines 1994–2207 (crafts array), lines 2360–2378 (resetState — initial unlocked crafts)

### Status: [ ] Tests | [ ] Impl | [ ] Rated

---

## Story 3: PURCHASE_UPGRADE action

**As a** player
**I want** to purchase a workshop upgrade by paying its price
**So that** I gain its effects and unlock further upgrades

### Acceptance Criteria
- [ ] Given an upgrade is unlocked and affordable, when PURCHASE_UPGRADE fires, then resources are deducted and `researched=true`
- [ ] Given an upgrade is not unlocked, when PURCHASE_UPGRADE fires, then nothing changes
- [ ] Given an upgrade is already researched, when PURCHASE_UPGRADE fires, then nothing changes
- [ ] Given insufficient resources, when PURCHASE_UPGRADE fires, then nothing changes
- [ ] Given PURCHASE_UPGRADE "mineralHoes", then "ironHoes" (via `unlocks.upgrades`) becomes `unlocked=true` (it already was, but this tests the propagation path)
- [ ] Given PURCHASE_UPGRADE "mineralAxes", then `ironAxes` unlock is confirmed still `unlocked=true`
- [ ] Given a multi-price upgrade, all prices are deducted atomically
- [ ] Given an unknown upgrade name, then state is unchanged

### Legacy Reference
- `legacy/js/workshop.js` lines 2721–2736 (unlock function — marks researched, runs unlock propagation)
- `legacy/js/workshop.js` lines 2344–2357 (resetState — initial unlock set for upgrade chain)

### Status: [ ] Tests | [ ] Impl | [ ] Rated

---

## Story 4: Upgrade unlock chain propagation

**As a** game engine
**I want** purchasing an upgrade to unlock upgrades listed in its `unlocks.upgrades` array
**So that** the upgrade chain advances correctly

### Acceptance Criteria
- [ ] Given PURCHASE_UPGRADE "steelSaw" (unlocks: {upgrades:["titaniumSaw"]}), then "titaniumSaw" becomes `unlocked=true`
- [ ] Given PURCHASE_UPGRADE "titaniumSaw" (unlocks: {upgrades:["alloySaw"]}), then "alloySaw" becomes `unlocked=true`
- [ ] Given PURCHASE_UPGRADE "reinforcedBarns" (unlocks: {upgrades:["titaniumBarns"]}), then "titaniumBarns" becomes `unlocked=true`
- [ ] Given an upgrade with no `unlocks`, purchasing it does not change any other upgrade unlock state
- [ ] Given PURCHASE_UPGRADE "reinforcedWarehouses" (unlocks: {upgrades:["ironwood"]}), then "ironwood" becomes `unlocked=true`

### Legacy Reference
- `legacy/js/workshop.js` lines 2728–2730 (unlock() — calls game.unlock(upgrade.unlocks))
- `legacy/js/workshop.js` lines 96–103, 216–219, 237–239 (upgrade defs with unlocks)

### Status: [ ] Tests | [ ] Impl | [ ] Rated

---

## Story 5: WorkshopManager.updateEffects — upgrade effects in effectCache

**As a** resource manager
**I want** researched upgrade static effects to appear in the effect cache
**So that** game systems are enhanced by purchased upgrades

### Acceptance Criteria
- [ ] Given no upgrades researched, when `updateEffects()` is called, then result is `{}`
- [ ] Given "mineralHoes" is researched (effects: `{catnipJobRatio:0.5}`), when `updateEffects()`, then `{catnipJobRatio: 0.5}`
- [ ] Given "mineralHoes" and "ironHoes" both researched (catnipJobRatio 0.5 + 0.3), then `{catnipJobRatio: 0.8}`
- [ ] Given an upgrade with empty `effects: {}`, it contributes nothing to the cache
- [ ] Given a tick with WorkshopManager registered and "mineralHoes" researched, then effectCache contains `catnipJobRatio: 0.5`

### Legacy Reference
- `legacy/js/workshop.js` lines 2296–2302 (`constructor` — `registerMeta("research", this.upgrades, null)` which hooks into effect sum)
- Effect summing pattern same as ScienceManager

### Status: [ ] Tests | [ ] Impl | [ ] Rated

---

## Story 6: CRAFT action

**As a** player
**I want** to craft refined resources by consuming raw resources
**So that** I can unlock higher-tier materials

### Acceptance Criteria
- [ ] Given craft "beam" is unlocked and player has 175 wood, when CRAFT "beam" x1, then 175 wood is deducted and 1 beam is added (craftRatio=0 by default)
- [ ] Given craft "steel" is NOT unlocked, when CRAFT "steel", then nothing changes
- [ ] Given player cannot afford craft prices, when CRAFT, then nothing changes
- [ ] Given `craftRatio=0.5` in effectCache (e.g., from a policy), when CRAFT "beam" x1, then 1.5 beams are added (floor to 1 or keep fractional — use Math.floor)
- [ ] Given craft "wood" with `ignoreBonuses: true`, when CRAFT "wood" x1, then regardless of craftRatio in effectCache, exactly 1 wood is produced per 100 catnip
- [ ] Given CRAFT "beam" x3 with 525 wood available, then 525 wood is deducted and 3 beams are added
- [ ] Given an unknown craft name, then state is unchanged
- [ ] Given CRAFT amount <= 0, then state is unchanged

### Legacy Reference
- `legacy/js/workshop.js` lines 2458–2505 (`craft()` function — deducts prices, adds `amt * (1 + craftRatio)`)
- `legacy/game.js` lines 3854–3886 (`getResCraftRatio` — uses `craftRatio` from effectCache for most, wood is special)

### Status: [ ] Tests | [ ] Impl | [ ] Rated

---

## Story 7: Save / load / reset

**As a** game engine
**I want** WorkshopState to serialize and restore correctly
**So that** save games preserve all upgrade purchases and craft unlocks

### Acceptance Criteria
- [ ] Given upgrades purchased, when `save()`+`load()` round-trips, `researched` and `unlocked` flags are preserved
- [ ] Given crafts with custom unlocked state, when `save()`+`load()`, craft `unlocked` flags are preserved
- [ ] Given `resetState()`, then exactly 6 upgrades are `unlocked=true` and no upgrade is `researched=true`
- [ ] Given `resetState()`, then exactly 8 crafts are `unlocked=true`
- [ ] Given missing workshop save data, then defaults to initial state
- [ ] Given `GameState`, then it has a `workshop: WorkshopState` field
- [ ] Given `tick.test.ts` MarkedState interface, it includes `workshop` field

### Legacy Reference
- `legacy/js/workshop.js` lines 2392–2433 (`save`, `load`)
- `legacy/js/workshop.js` lines 2344–2389 (`resetState`)

### Status: [ ] Tests | [ ] Impl | [ ] Rated
