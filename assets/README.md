# assets/

Canonical asset workstream for the Kittens Game rewrite. Lives outside `packages/` because assets are consumed by the client and (potentially) other surfaces; they're not engine- or client-specific.

## Folder layout

```
assets/
├── README.md                ← you are here
├── style-guide.md           ← pixel-art corridor, palette anchors, do/don't
├── higgsfield/
│   ├── prompts/             ← one markdown file per asset (prompt + log)
│   ├── raw/                 ← unedited Higgsfield outputs (≥ 1024 px)
│   └── processed/           ← downsampled / pixel-quantized intermediates
├── sprites/
│   ├── resources/           ← 16-32 px UI sprites (catnip, wood, …)
│   └── ui/                  ← buttons, markers, cursors
└── exports/                 ← final, shipped assets — referenced from code
    ├── buildings/           ← per-building hover hero-cards (WEBP)
    └── resources/
```

## Two visual lanes (hybrid strategy)

- **Higgsfield AI** — for **larger hero / hover cards** (≥ 128 px square). Higgsfield generates "pixel-art-style" illustration, not pixel-perfect sprites. Output goes through `raw/` → optional `processed/` → final `exports/`. Always keep the raw alongside the prompt for iteration.
- **Traditional pixel sprites** — for **small UI icons** (< 64 px). Either hand-made or sourced from open-source packs (e.g. Game-Icons.net, OpenGameArt). These live in `sprites/` and are copied / referenced from there into `exports/` when shipped.

Don't mix lanes within a single asset — a 16 px catnip icon should never come from Higgsfield, a 256 px Catnip-Field hero card should never come from a sprite pack.

## Naming conventions

- **Kebab-case + semantic**: `building-field-hero.webp`, not `img_001.png`.
- **Subfolder = type + subdomain**: `buildings/`, `resources/`, `ui/`.
- **Format**:
  - `.webp` for final shipped illustrations (good compression, supports pixel-art with `image-rendering: pixelated`).
  - `.png` for sprites with hard alpha edges where every byte counts.
  - Higgsfield raws stay as the original PNG.

## Workflow

1. **Designer** drafts a prompt in `higgsfield/prompts/<asset-name>.md` using the template below.
2. **Designer** runs the prompt in Higgsfield, drops the unedited output into `higgsfield/raw/<asset-name>-v1.png`.
3. **Designer** logs the iteration result in the prompt file (what worked, what didn't).
4. When happy: export to WEBP (e.g. via `cwebp` or an image editor) into `exports/buildings/<asset-name>.webp`.
5. **Engineer** wires the export path into the code (e.g. `BUILDING_DEFS[field].iconPath = "/assets/buildings/field.webp"`).

## Prompt template (Higgsfield)

```markdown
# <asset-name>

**Subject**: <what's in the picture, 1 sentence>
**Style anchors**: pixel art, <comparator e.g. Stardew-Valley-warmth>, soft natural light, no outline noise
**Palette anchors**: <CSS var name + hex>, e.g. --res-catnip #5E8B47 dominant, --bg #F2E6CF backdrop
**Negative**: photorealistic, 3D, anime, blurry, watermark, text, modern UI
**Aspect**: 1:1, 1024×1024 raw → downsampled to 256×256 export
**Iteration log**:
- v1 (YYYY-MM-DD): <what came out, what to change next>
- v2: …
```

## Related docs

- `agent-docs/GAME_LOOP.md` — conceptual model the visuals should support (the eight beats, what mood each calls for).
- `assets/style-guide.md` — the specific pixel-art corridor, palette references, composition rules.
- `kittens-game-design-system/project/README.md` — voice / tone guide (covers UI copy and brand tone, not assets directly).
