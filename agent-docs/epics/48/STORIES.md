# Epic: 48

**Status:** In Progress
**Started:** 2026-04-09
**Legacy refs:** `legacy/js/village.js` (census, government, kitten management, loadouts), `legacy/js/jsx/left.jsx.js` (WJobRow, village panel)

---

## Story: 48-01 Job Tooltips in Inspector

**As a** player
**I want** to see job descriptions, resource modifiers, and flavor text when hovering a job row
**So that** I understand what each job produces before assigning kittens

### Acceptance Criteria
- [x] Hovering a job row sets inspector to a JobEntity with: name, description, modifiers (resource amounts per kitten), flavor text
- [x] Inspector shows per-kitten production rates (e.g., "+0.018 wood/tick" for woodcutter)
- [ ] Dynamic modifiers shown (scholar starchart when astrophysicists researched, geologist gold when geodesy researched)
- [x] Flavor text displayed when defined
- [x] Test: verify inspector updates on job row hover with correct production values

### Legacy Reference
- `legacy/js/village.js` — job tooltip content and modifier display

### Status: [x] Tests | [x] Impl | [ ] Rated

---

## Story: 48-02 Shift+Click Assign All Free Kittens

**As a** player
**I want** to shift+click a job's + button to assign all free kittens at once
**So that** I can quickly fill a job without repeated clicks

### Acceptance Criteria
- [x] Shift+clicking the + button on a job dispatches ASSIGN_JOB with count = freeKittens
- [x] Normal click still assigns 1
- [x] Disabled when no free kittens (pre-existing +All button behavior)
- [x] Test: verify shift+click dispatches correct count

### Legacy Reference
- `legacy/js/village.js` — shift+click assign all behavior

### Status: [x] Tests | [x] Impl | [ ] Rated

---

## Story: 48-03 Bulk Hunt Shortcuts

**As a** player
**I want** ×All, ×Half, ×Fifth hunt shortcuts
**So that** I can efficiently spend manpower on hunts

### Acceptance Criteria
- [x] HUNT action accepts optional `amount` field for number of squads
- [x] Hunt cost per squad: `100` manpower (minus huntCatpowerDiscount effect)
- [x] ×All sends `floor(manpower / costPerSquad)` squads
- [x] ×Half sends `floor(maxSquads / 2)`, ×Fifth sends `floor(maxSquads / 5)`
- [x] Hunt results scale with squad count (furs, gold, ivory each multiplied)
- [x] UI shows ×All, ×½, ×⅕ buttons alongside existing Hunt button
- [x] API spec updated with optional `amount` on HUNT action
- [x] Test: verify bulk hunt deducts correct manpower and yields scaled rewards

### Legacy Reference
- `legacy/js/village.js` — huntAll, huntHalf, huntFifth, gainHuntRes

### Status: [x] Tests | [x] Impl | [ ] Rated

---

## Story: 48-04 Individual Kitten State Foundation

**As a** player
**I want** each kitten tracked individually with name, age, trait, job, skills, and rank
**So that** the census and management systems have per-kitten data to display

### Acceptance Criteria
- [x] `Kitten` interface: id, name, surname, age, trait, job (string|null), skills (Record<string,number>), rank, exp, isFavorite, isLeader
- [x] `VillageState` gains `kittens: Kitten[]` array
- [x] On new kitten arrival, generate a random kitten with name from legacy name pool, random trait, age 0
- [x] On kitten death, remove a specific kitten (non-favorite, non-leader preferred)
- [x] Job assignment assigns to specific kitten (updates kitten.job + aggregate count)
- [x] Job unassignment removes from specific kitten
- [ ] Kittens age by 1 each year (on year tick)
- [x] Skills grow per tick: assigned kittens gain XP in their job skill
- [x] Save/load serializes individual kittens array
- [x] Test: verify kitten creation, assignment, aging, skill growth, death removal order

### Legacy Reference
- `legacy/js/village.js` — sim object, kitten generation, aging, skills

### Status: [x] Tests | [x] Impl | [ ] Rated

---

## Story: 48-05 Census Panel

**As a** player
**I want** to see a full census of my kittens with their details
**So that** I can inspect my population and manage individuals

### Acceptance Criteria
- [x] Census section in VillagePanel shows all kittens in a scrollable list
- [x] Each kitten row: name, age, trait, current job (or "Free"), rank, top 3 skills with levels
- [x] Pagination: 10 kittens per page with page navigation
- [x] Census only visible when population > 0
- [x] Test: verify census renders correct kitten count, displays name/age/job fields

### Legacy Reference
- `legacy/js/village.js` — census block rendering

### Status: [x] Tests | [x] Impl | [ ] Rated

---

## Story: 48-06 Census Filters and Sorting

**As a** player
**I want** to filter and sort the kitten census
**So that** I can find specific kittens in a large population

### Acceptance Criteria
- [x] Filter by job: dropdown showing unlocked jobs + "Free"
- [x] Filter by trait: dropdown showing traits present in population
- [x] Sort options: by name, by age, by rank, by exp
- [x] Filters reduce displayed kittens; sort reorders them
- [x] Test: verify job filter shows only matching kittens, sort reorders correctly

### Legacy Reference
- `legacy/js/village.js` — census filter/sort controls

### Status: [x] Tests | [x] Impl | [ ] Rated

---

## Story: 48-07 Kitten Management Actions

**As a** player
**I want** to promote, favorite, and unassign individual kittens
**So that** I can manage my population effectively

### Acceptance Criteria
- [x] PROMOTE_KITTEN action: requires `500 * 1.75^rank` exp + `25 * (rank + 1)` gold; increments rank
- [x] TOGGLE_FAVORITE action: flips kitten.isFavorite
- [x] UNASSIGN_KITTEN action: removes kitten from current job, clears kitten.job
- [x] Promote button visible only when kitten can afford promotion
- [x] Favorite toggle shows ★ (favorited) or ☆ (not)
- [x] Unassign button visible only when kitten has a job
- [x] API spec updated with new action types
- [x] Test: verify promote cost deduction, favorite toggle, unassign clears job

### Legacy Reference
- `legacy/js/village.js` — promote, favorite, unassignJob per kitten

### Status: [x] Tests | [x] Impl | [ ] Rated

---

## Story: 48-08 Leader and Government Display

**As a** player
**I want** to see government type and leader information
**So that** I understand my civilization's governance bonuses

### Acceptance Criteria
- [x] `VillageState` gains `leader: string | null` (kitten ID) and leader bonus computation
- [x] SET_LEADER action: marks a kitten as leader (only one at a time)
- [x] REMOVE_LEADER action: demotes current leader
- [x] Leader traits provide bonuses: engineer +5% craft, merchant +3% trade, manager +50% hunt, scientist +5% science discount, wise +10% religion discount
- [x] Leader bonus scaling: `rank == 0 ? 1.0 : (rank + 1) / 1.4`
- [x] Government section in VillagePanel shows current government (from researched policy)
- [ ] Leader info display: name, trait, rank, exp, job bonus multiplier
- [x] "Make Leader" button in census kitten rows
- [x] API spec updated with SET_LEADER, REMOVE_LEADER actions
- [x] Test: verify leader selection, bonus calculation, display in census

### Legacy Reference
- `legacy/js/village.js` — makeLeader, removeLeader, getLeaderBonus, government display

### Status: [x] Tests | [x] Impl | [ ] Rated
