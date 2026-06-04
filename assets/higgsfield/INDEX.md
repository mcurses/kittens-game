# Higgsfield Asset Index

Status legend: `planned` (prompt written, no draft yet) · `generated` (raw output exists, picking final) · `approved` (final draft chosen, awaiting export) · `shipped` (WEBP in `exports/`, wired in code)

**Building tier convention:** every building has 3 tier variants — `s` (val 1–9, single cat + minimal setup), `m` (val 10–49, 2–3 cats + denser composition), `l` (val 50+, full operation with workers + props). Filename pattern: `<name>-<tier>.webp`. Tier mapping lives in `packages/client-web/src/buildingIconTier.ts`.

## Buildings (`building` variant, 1:1)

| Asset | Prompt | Loop beats | s | m | l |
|---|---|---|---|---|---|
| Catnip Field | [building-field.md](prompts/building-field.md) | solitude, first-growth → settlement | generated (v2) | generated (v2) | generated (v2) |
| Pasture | [building-pasture.md](prompts/building-pasture.md) | first-growth → settlement | generated (v1) | generated (v1) | generated (v1) |
| Aqueduct | [building-aqueduct.md](prompts/building-aqueduct.md) | first-growth → settlement | generated (v3) | generated (v3) | generated (v3) |
| Hut | [building-hut.md](prompts/building-hut.md) | settlement | planned | planned | planned |
| Log House | [building-logHouse.md](prompts/building-logHouse.md) | settlement → specialization | planned | planned | planned |
| Mansion | [building-mansion.md](prompts/building-mansion.md) | industry | planned | planned | planned |
| Library | [building-library.md](prompts/building-library.md) | curiosity → specialization | planned | planned | planned |
| Academy | [building-academy.md](prompts/building-academy.md) | curiosity | planned | planned | planned |
| Mine | [building-mine.md](prompts/building-mine.md) | specialization | planned | planned | planned |
| Barn | [building-barn.md](prompts/building-barn.md) | settlement → specialization | planned | planned | planned |
| Warehouse | [building-warehouse.md](prompts/building-warehouse.md) | industry | planned | planned | planned |

**Note on v1 field.webp:** The pre-tier `assets/exports/buildings/field.webp` from 2026-06-01 is retired — the new tier-aware UI loads `field-s.webp` / `field-m.webp` / `field-l.webp`. Old WEBP can be deleted once all three tiers are shipped.

## Tech Book Covers (`book` variant, 2:3)

| Asset | Prompt | Loop beats | Status |
|---|---|---|---|
| Calendar | [tech-calendar.md](prompts/tech-calendar.md) | curiosity | planned |
| Agriculture | [tech-agriculture.md](prompts/tech-agriculture.md) | first-growth, curiosity | planned |
| Archery | [tech-archery.md](prompts/tech-archery.md) | divergence | planned |
| Mining | [tech-mining.md](prompts/tech-mining.md) | specialization | planned |
| Animal Husbandry | [tech-animal.md](prompts/tech-animal.md) | settlement | planned |
| Metalworking | [tech-metal.md](prompts/tech-metal.md) | industry | planned |
| Theology | [tech-theology.md](prompts/tech-theology.md) | divergence | planned |
| Mathematics | [tech-math.md](prompts/tech-math.md) | curiosity | planned |

## Policies (`book` variant, 2:3)

| Asset | Prompt | Loop beats | Status |
|---|---|---|---|
| Liberty | [policy-liberty.md](prompts/policy-liberty.md) | divergence | planned |
| Tradition | [policy-tradition.md](prompts/policy-tradition.md) | divergence | planned |
| Autocracy | [policy-autocracy.md](prompts/policy-autocracy.md) | divergence | planned |
| Republic | [policy-republic.md](prompts/policy-republic.md) | divergence | planned |
| Monarchy | [policy-monarchy.md](prompts/policy-monarchy.md) | divergence | planned |

## Map (`map` variant, 16:9)

| Asset | Prompt | Loop beats | Status |
|---|---|---|---|
| Village Map | [village-map.md](prompts/village-map.md) | settlement → industry (evolves) | planned |

## Job Icons (`job` variant, 1:1 small)

| Asset | Prompt | Loop beats | Status |
|---|---|---|---|
| Woodcutter | [job-woodcutter.md](prompts/job-woodcutter.md) | specialization | planned |
| Farmer | [job-farmer.md](prompts/job-farmer.md) | specialization | planned |
| Hunter | [job-hunter.md](prompts/job-hunter.md) | divergence | planned |
| Scholar | [job-scholar.md](prompts/job-scholar.md) | curiosity | planned |
| Miner | [job-miner.md](prompts/job-miner.md) | specialization | planned |
| Priest | [job-priest.md](prompts/job-priest.md) | divergence | planned |
| Geologist | [job-geologist.md](prompts/job-geologist.md) | industry | planned |
| Engineer | [job-engineer.md](prompts/job-engineer.md) | industry | planned |

## Characters (`character` variant, 1:1)

| Asset | Prompt | Loop beats | Status |
|---|---|---|---|
| Kitten (base portrait) | [character-kitten-base.md](prompts/character-kitten-base.md) | settlement onwards | planned |

## See also

- `STYLE-DNA.md` — shared style anchors all prompts reference
- `../README.md` — folder layout and workflow
- `../style-guide.md` — pixel-art corridor rules
- `../../agent-docs/GAME_LOOP.md` — loop-beat definitions
