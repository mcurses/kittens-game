# Epic: 51 — Notes

## Legacy Behavior Summary

### Policy Panel
- Renders as a list of policy buttons from `game.science.policies`
- Two toggle checkboxes: "Hide researched" and "Hide blocked"
- Mutual exclusivity message displayed
- Policy adoption: confirm dialog, then sets `researched=true`, blocks conflicting policies (`blocks[]`)
- Blocked policies show "BLOCKED" label, are disabled
- `PolicyBtnController` manages visibility based on toggle states

### Prestige/Metaphysics Panel
- Renders perks from `game.prestige.perks` as buttons
- Visible when metaphysics tech is researched AND paragon > 0, OR any perk is researched
- "Burn Paragon" button visible when paragon > 0
- Perks purchased with paragon, unlock chains via `unlocks.perks[]`

### Science Flavor Text
- Tech flavor text already implemented via `TECH_FLAVOR` in flavorText.ts
- Policy and perk descriptions/flavor text not yet in the rewrite
- Legacy uses `$I("policy.{name}.desc")` and `$I("prestige.{name}.desc")` for descriptions

## Key Decisions
- Add policy panel as a section within SciencePanel (not separate tab)
- Add prestige panel as a section within SciencePanel or as a separate sub-tab
- RESEARCH_POLICY action already exists — just need UI wiring
- PURCHASE_PERK action already exists — just need UI wiring

## Gotchas & Edge Cases
- Policy blocks are bidirectional — when A blocks B, adopting A sets B.blocked=true
- Prestige panel visibility depends on metaphysics tech OR any perk researched
- "Burn Paragon" converts paragon to burnedParagon at a ratio

## Open Questions
- None
