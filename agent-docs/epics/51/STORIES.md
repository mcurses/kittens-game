# Epic: 51

**Status:** Complete
**Started:** 2026-04-09
**Legacy refs:** `legacy/js/science.js` (policy panel, policy buttons), `legacy/js/prestige.js` (prestige panel, perk buttons)

---

## Story 51-01: Policy panel with adopt/block controls

**As a** player
**I want** a policy panel showing available policies with adopt buttons and blocked state
**So that** I can adopt policies and see which are blocked by my choices

### Acceptance Criteria
- [x] SciencePanel renders a "Policies" section below technologies
- [x] Each unlocked policy shows name, cost, and adopt/blocked status
- [x] Adopted policies show a "✓ Done" badge
- [x] Blocked policies show "Blocked" label and disabled button
- [x] Clicking "Adopt" dispatches RESEARCH_POLICY action
- [x] "Hide researched" toggle filters adopted policies
- [x] "Hide blocked" toggle filters blocked policies
- [x] Policies section only visible when any policy is unlocked

### Legacy Reference
- `legacy/js/science.js` lines 2421-2677 (PolicyBtnController, PolicyPanel)

### Status: [x] Tests | [x] Impl | [ ] Rated

---

## Story 51-02: Prestige perks panel

**As a** player
**I want** a prestige/metaphysics panel showing available perks with purchase buttons
**So that** I can spend paragon on permanent upgrades

### Acceptance Criteria
- [x] SciencePanel renders a "Metaphysics" section when metaphysics tech is researched or any perk is owned
- [x] Each unlocked perk shows name, paragon cost, and purchased status
- [x] Purchased perks show a "✓ Done" badge
- [x] Clicking "Purchase" dispatches PURCHASE_PERK action
- [x] Button disabled when paragon insufficient
- [x] "Burn Paragon" button dispatches BURN_PARAGON action when paragon > 0

### Legacy Reference
- `legacy/js/prestige.js` lines 543-625 (PrestigeBtnController, PrestigePanel)

### Status: [x] Tests | [x] Impl | [ ] Rated

---

## Story 51-03: Policy and perk flavor text

**As a** player
**I want** to see flavor text for policies and perks in the inspector
**So that** I can enjoy the game's writing and understand each option

### Acceptance Criteria
- [x] POLICY_FLAVOR map added to flavorText.ts with entries for policies
- [x] PERK_FLAVOR map added to flavorText.ts with entries for perks
- [x] Inspector shows flavor text when hovering/focusing a policy
- [x] Inspector shows flavor text when hovering/focusing a perk
- [x] InspectorContext gains "policy" and "perk" entity types

### Legacy Reference
- `legacy/js/science.js` lines 850-1243 (policy descriptions)
- `legacy/js/prestige.js` lines 3-444 (perk descriptions)

### Status: [x] Tests | [x] Impl | [ ] Rated
