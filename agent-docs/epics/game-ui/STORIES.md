# Epic 20: Game UI — Stories

This epic builds a real game UI that looks and feels like Kittens Game.
Reference: `legacy/index.html` — 3-column layout: leftColumn=resources, midColumn=tabs, rightColumn=log+calendar.

---

## Story 20-1: Resource filtering

**As a** player
**I want** only resources with value > 0 shown in the resource panel
**So that** the panel is not cluttered with 40 empty resources at game start

### Acceptance Criteria
- [x] ResourcePanel hides entries where `value === 0`
- [x] Resources with `value > 0` remain visible
- [x] Resources that drop back to 0 are hidden again
- [x] "No resources yet." shown when all resources are 0

### Legacy Reference
- `legacy/index.html` — resources show/hide based on `game.resPool.get(res).unlocked`

### Status: [x] Tests | [x] Impl | [ ] Rated

---

## Story 20-2: Buildings panel

**As a** player
**I want** a Buildings tab showing available buildings with buy buttons
**So that** I can construct buildings without a CLI

### Acceptance Criteria
- [x] `BuildingsPanel.tsx` renders a list of buildings with name, count, and "Buy" button
- [x] "Buy" button dispatches `BUY_BUILDING` action via `useGameAction`
- [x] Panel is accessible via a "Buildings" tab in navigation

### Legacy Reference
- `legacy/index.html` bldTab — each building row has a buy button

### Status: [x] Tests | [x] Impl | [ ] Rated

---

## Story 20-3: Jobs panel

**As a** player
**I want** a Jobs tab with +/- buttons to assign kittens to jobs
**So that** I can manage kitten assignments without a CLI

### Acceptance Criteria
- [x] `JobsPanel.tsx` renders a list of jobs with name, assigned count, and +/- buttons
- [x] "+" button dispatches `ASSIGN_JOB` action
- [x] "-" button dispatches `UNASSIGN_JOB` action

### Legacy Reference
- `legacy/index.html` villageTab — job rows with assignment controls

### Status: [x] Tests | [x] Impl | [ ] Rated

---

## Story 20-4: Calendar display

**As a** player
**I want** to see the current season, year, and day in the header
**So that** I have temporal context without looking at raw game state

### Acceptance Criteria
- [x] Header/top bar shows season name (Spring/Summer/Autumn/Winter)
- [x] Header shows current year number
- [x] Header shows current day within the season
- [x] Updates whenever game state changes (reactive)

### Legacy Reference
- `legacy/index.html` — calendar display in rightColumn header area

### Status: [x] Tests | [x] Impl | [ ] Rated

---

## Story 20-5: Log panel

**As a** player
**I want** a scrollable log panel showing recent game events
**So that** I know what is happening in the game

### Acceptance Criteria
- [x] `LogPanel.tsx` renders recent messages
- [x] `useLogMessages` hook subscribes to WS and appends LOG_MESSAGE events
- [x] Log scrolls to bottom on new messages (useEffect with ref)
- [x] Shows last 50 messages (older messages trimmed)

### Legacy Reference
- `legacy/index.html` — rightColumn log div

### Status: [x] Tests | [x] Impl | [ ] Rated

---

## Story 20-6: Science panel

**As a** player
**I want** a Science tab showing available technologies with research buttons
**So that** I can research technologies without a CLI

### Acceptance Criteria
- [x] `SciencePanel.tsx` renders available techs with name and "Research" button
- [x] "Research" button dispatches `RESEARCH` action
- [x] Researched techs show as "Done" (disabled button or badge)
- [x] Techs not yet unlocked are hidden

### Legacy Reference
- `legacy/index.html` libraryTab — tech rows with research controls

### Status: [x] Tests | [x] Impl | [ ] Rated

---

## Story 20-7: Workshop panel

**As a** player
**I want** a Workshop tab showing upgrades and craft buttons
**So that** I can purchase upgrades and craft resources without a CLI

### Acceptance Criteria
- [x] `WorkshopPanel.tsx` renders available upgrades with "Purchase" button
- [x] "Purchase" dispatches `PURCHASE_UPGRADE` action
- [x] Crafting section renders unlocked crafts with "Craft" button
- [x] "Craft" dispatches `CRAFT` action with amount: 1

### Legacy Reference
- `legacy/index.html` workshopTab — upgrades and crafting rows

### Status: [x] Tests | [x] Impl | [ ] Rated

---

## Story 20-8: Navigation tabs

**As a** player
**I want** tab navigation switching between Resources, Buildings, Jobs, Science, Workshop
**So that** I can access all panels from a single UI

### Acceptance Criteria
- [x] Tab bar renders: Resources, Buildings, Jobs, Science, Workshop
- [x] Clicking a tab shows the corresponding panel, hides others
- [x] Active tab is visually distinguished (data-active attribute)
- [x] Default tab is "Resources"

### Legacy Reference
- `legacy/index.html` — tabContainer with tab links

### Status: [x] Tests | [x] Impl | [ ] Rated

---

## Story: Building prices displayed in BuildingsPanel

**As a** player
**I want** to see what each building costs before buying
**So that** I can make informed purchase decisions

### Acceptance Criteria
- [x] BuildingsPanel shows price list for each building (imported from BUILDING_DEFS)
- [x] Unaffordable resources shown in red / Buy button disabled

### Legacy Reference
- `legacy/game.js` — building UI rendering showing costs

### Status: [ ] Tests | [x] Impl | [ ] Rated

---

## Story: Religion, Trade, Space, and Time tabs

**As a** player
**I want** Religion, Trade, Space, and Time tabs in the navigation
**So that** I can access all game systems from the UI

### Acceptance Criteria
- [ ] Religion tab shows worship, faith, ziggurat/religion/transcendence upgrade panels
- [ ] Trade tab shows race list with embassy levels and trade buttons
- [ ] Space tab shows mission list and space building counts
- [ ] Time tab shows CFU/VSU upgrades, heat meter, shatter button
- [ ] Tabs only appear when the relevant system is unlocked/accessible

### Legacy Reference
- `legacy/index.html` — tab structure
- `legacy/game.js` — tab visibility conditions

### Status: [ ] Tests | [ ] Impl | [ ] Rated
