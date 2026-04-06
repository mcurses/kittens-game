# Epic: 32 — Notes

## Legacy Behavior Summary

### Religion TU section
- Legacy `religion.js` has `transcendenceUpgrades` array with 10 TUs (blackObelisk, blackNexus, blackCore, etc.)
- Serialized as `religion.tu` in save format — already loaded in engine ReligionState
- `TRANSCENDENCE_UPGRADE_DEFS` already exported from engine
- Panel needs a "Cryptotheology" subsection listing TU entries with BUY_TRANSCENDENCE_UPGRADE button

### Trade economics display
- `RACE_DEFS` already has `buys[]` and `sells[]` per race
- Legacy shows: what resource race buys (with cost), what they sell (with ranges)
- `calculateTradeYield()` already exists in diplomacy.ts to compute sell amounts
- Relationship: derived from `race.standing` — Negative < 0 = Hostile, 0 = Neutral, > 0 = Friendly

### Space mission done-state
- Programs have `val` field: if val > 0, planet is reached → show "Reached" instead of "Launch"
- SpacePanel currently always shows "Launch" button regardless of `p.val`

### Space building on/off display
- SpaceBuildingEntry has `val` and `on` fields
- Currently shows only `val` count, not `on/val` ratio
- Should show "{on}/{val}" when `on !== val`; show just `val` when on === val

### Buildings on/off display + human-readable names
- BuildingEntry has `val` and `on` fields
- Currently shows only `val`; should show `on/val` when `on < val`
- Building names are camelCase keys — need `description` field or a name-prettifier
- Legacy uses i18n labels; rewrite can use a simple word-split of camelCase

### Village happiness % display
- VillagePanel already shows `happinessPct` — but PARITY says it's not in the Jobs tab
- Actually VillagePanel is in the header. Happiness is shown there.
- Jobs tab (JobsPanel) doesn't show happiness or festival duration
- Festival duration: `state.calendar.festivalDays` field exists in CalendarState

### Resource maxValue display
- ResourcePanel already renders `/{maxValue}` when maxValue > 0
- The root issue was missing buildings (now fixed in Epic 31) providing storage
- maxValue should now show correctly for resources with building-provided caps
- This story may already be resolved by Epic 31 adding harbor/barn/warehouse storage effects

## Key Decisions

- TU section goes in ReligionPanel below the Transcendence button
- Trade economics: show buys/sells inline in the race row (compact)
- Space mission done-state: check `p.val > 0` — if so show "Reached" badge, disable Launch button
- Space building on/off: show `{on}/{val}` format when on < val
- Buildings on/off: show `{on}/{val}` format when on < val
- Building name prettification: split camelCase at uppercase boundaries → "Lumber Mill", "Oil Well" etc.
- Village happiness display: add happiness % to JobsPanel (separate from VillagePanel header pill)
- Festival duration: read from `state.calendar.festivalDays` in CalendarState

## Gotchas & Edge Cases

- `p.val > 0` for mission done-state: `val` = how many times launched (usually 0 or 1 for one-time missions)
- Standing relationship: `standing < 0` = Hostile, `standing === 0` = Neutral, `standing > 0` = Friendly
- Building name prettification: "aiCore" → "Ai Core" (capital 'A' stays), "oilWell" → "Oil Well"
- `on/val` display: only show when val > 0 AND on < val; don't show when on === val

## Open Questions

- Should Trade economics show current season modifier? (seasonal trade bonuses exist in RACE_DEFS)
- Should TU be shown only when player has transcended at least once?
