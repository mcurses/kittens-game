# Epic 48 — Village Management Parity

Close the village/jobs ❌ items in UI_PARITY.md. The largest UI gap area (11 missing elements).

## Stories

### 48-01 Individual Kitten Census
**Goal:** Implement the kitten census panel showing all kittens with name, age, job, skills, and rank.

**ACs:**
- [ ] Census panel accessible from village section
- [ ] Each kitten row shows: name, age, current job, skill levels, rank
- [ ] Pagination for large populations (50+ kittens per page)
- [ ] Test: verify census renders correct kitten count and fields

### 48-02 Census Filters and Sorting
**Goal:** Add filtering and sorting to the kitten census.

**ACs:**
- [ ] Filter by job (dropdown or chip toggles)
- [ ] Filter by trait
- [ ] Sort by: name, age, rank, specific skill level
- [ ] Filter/sort state persists during session
- [ ] Test: verify filters reduce displayed kittens correctly

### 48-03 Kitten Management Actions
**Goal:** Add individual kitten management controls.

**ACs:**
- [ ] Promote button (if kitten has rank-up available)
- [ ] Favorite toggle
- [ ] Unassign from job button
- [ ] Test: verify promote action dispatches and kitten rank updates

### 48-04 Government and Leader
**Goal:** Display government type and leader information.

**ACs:**
- [ ] Government section shows current government type
- [ ] Leader display: name, trait, rank, XP, job bonus
- [ ] Make Leader action on census kitten rows
- [ ] Test: verify government type renders, leader info displays

### 48-05 Job Loadouts
**Goal:** Implement named job preset system matching legacy loadout functionality.

**ACs:**
- [ ] Save current job distribution as a named loadout
- [ ] Load a saved loadout (redistributes kittens)
- [ ] Delete saved loadouts
- [ ] Engine action support for loadout save/load
- [ ] Test: verify save → load round-trip preserves assignments

### 48-06 Job Tooltips and Shift+Click
**Goal:** Add job hover information and shift+click assign-all shortcut.

**ACs:**
- [ ] Hovering a job row shows: description, modifiers per kitten, flavor text
- [ ] Shift+click on a job assigns all free kittens
- [ ] Inspector shows job details when hovered
- [ ] Test: verify tooltip content and shift+click behavior

### 48-07 Send Hunters Bulk Action
**Goal:** Add bulk hunt action with ×N shortcuts.

**ACs:**
- [ ] Send hunters ×1, ×5, ×All shortcuts in village panel
- [ ] Action triggers multiple hunt iterations
- [ ] Results aggregated in game log
- [ ] Test: verify bulk hunt dispatches correct action count
