# Epic 48 — Village Management Parity — Notes

## Legacy Behavior Summary

### Individual Kitten Simulation
Legacy tracks every kitten individually with: name, surname, age, trait, color, variety, rarity, job, engineerSpeciality, rank, exp, isLeader, favorite, isAdopted, skills (map of job→level). Kittens age each year, gain XP from assigned jobs, can be promoted (costs gold + exp), favorited, and assigned as leader.

### Census
- 10 kittens per page with pagination (<< < > >>)
- Each row: name, age, trait, rank, top 3 skills with levels, 4 action buttons (promote ^, favorite ★/☆, make leader, unassign)
- Filters: by job (dropdown), by trait
- Sort: by exp, by favorite, by color rarity, by coat variety

### Government/Leader
- Government types are policies (monarchy, authocracy, republic, theocracy) with mutual exclusions
- Leader: any kitten can be selected; bonuses depend on trait (engineer +5% craft, metallurgist +10% metal crafts, chemist +7.5% chemical crafts, merchant +3% trade, manager +50% hunt, scientist +5% science discount, wise +10% religion discount)
- Bonus scaling: `getLeaderBonus(rank) = rank == 0 ? 1.0 : (rank + 1) / 1.4`
- Promotion: requires `500 * 1.75^rank` exp + `25 * (rank + 1)` gold

### Job Loadouts
- Save/load/delete named presets
- State: title, isDefault, pinned, leader trait/job, job distribution, engineer specialties
- 8 default presets (Balanced, Farming, Gathering, etc.)

### Bulk Hunt
- huntAll/huntHalf/huntFifth shortcuts
- Cost: `100 - huntCatpowerDiscount` manpower per squad
- Results use irwinHall distribution (not uniform)
- Rewards: gold, furs, ivory (45% chance), unicorns (rare)

### Job Tooltips
- Description, flavor text, resource modifiers per kitten
- Dynamic modifiers for scholar (starchart), geologist (coal/gold), priest (atheism check)

## Key Decisions

1. **Individual kitten state is required** — census, management, leader, loadouts all depend on it. Current engine only has aggregate job counts.
2. **Scope for this epic:** Focus on job tooltips, shift+click, bulk hunt (UI-only/light engine), plus individual kitten foundation and census. Government/leader/loadouts are complex subsystems — implement foundation but may not reach full legacy parity.
3. **Kitten names:** Use the legacy name pool for familiarity.

## Gotchas & Edge Cases

- Leader is removed LAST when unassigning a job (not first)
- Favorite sort: by exp first, then favorites to end (secondary sort)
- Leader bonus at rank 0 is 1.0 (not 0.71 from formula)
- Theocracy auto-demotes leader if job changes to non-priest
- Autocracy housing scaling recalculates per tick
- Skill cap: 20,001 hard limit
- Hunt rewards cluster near mean (irwinHall, not uniform)
- Engineer removal priority: those NOT crafting are removed first

## Open Questions

- How much of government/leader system fits in this epic vs a future epic?
- Do we implement kitten aging/skill growth per-tick, or just static state for now?
