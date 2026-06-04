# Style DNA — Higgsfield Prompt Foundations

Shared style anchors that every asset prompt in `prompts/` references. Update once here, every prompt benefits.

## Visual idiom

**Pixel art**, hard edges, no anti-aliasing inside the artwork. Warmly lit, sat-reduced palette. Stardew-Valley-meets-Wind-Waker, never neon. Subjects centered, mild top-down or three-quarter perspective, at least one chibi cat visible where it makes sense.

## Authoritative palette

All references map to CSS custom properties in `kittens-game-design-system/project/colors_and_type.css`. Pull hex values from there; never invent.

| Token | Hex | Use |
|---|---|---|
| `--bg` | `#F2E6CF` | Parchment background, neutral fill |
| `--surface-1` | `#ECDDC0` | Panel, soft mid-tone |
| `--surface-2` | `#E2D0AC` | Card, deeper mid-tone |
| `--ink` | `#2B221A` | Warm near-black, outlines |
| `--ink-2` | `#5A4A3A` | Secondary outline / shading |
| `--accent` | `#C97D5D` | Terracotta — sparingly, for warmth highlights |
| `--accent-2` | `#7A9A6E` | Sage — secondary accent |
| `--res-catnip` | `#5E8B47` | Catnip green |
| `--res-wood` | `#8B5A2B` | Wood brown |
| `--res-minerals` | `#847266` | Stone gray-brown |
| `--res-iron` | `#6E6155` | Cool iron gray |
| `--res-gold` | `#D9A441` | Warm gold |
| `--res-faith` | `#C23574` | Sacred magenta |
| `--res-science` | `#7A9DC2` | Cool science blue |
| `--cyber` | `#14F0D8` | Electric cyan — Helios / late-game only |

## Negative (always)

photorealistic, 3D render, anime style, blurry, watermark, signature, text overlays, numbers, modern UI elements, glassmorphism, frosted glass, bloom, lens flare, neon energy-drink colors, anti-aliased outlines, emoji, smooth gradients on illustrations, AI-style purple-blue gradients

## Aspect ratios (per variant)

| Variant | Aspect | Used in |
|---|---|---|
| `building` | 1:1 (1024×1024 raw → 512×512 export) | Building cards (Catnip Field, Hut, Library, …). Three tiers per building: `<name>-s.webp` / `-m.webp` / `-l.webp` |
| `book` | 2:3 (768×1152 raw → 384×576 export) | Tech & Policy book covers |
| `character` | 1:1 (1024×1024 raw → 512×512 export) | Census kitten portraits |
| `job` | 1:1 (512×512 raw → 128×128 export) | Job icons (woodcutter, farmer, …), small |
| `map` | 16:9 (1792×1008 raw → 896×504 export) | Village map, top-down landscape |

**Export size rationale**: the client renders building cards at up to 160 CSS-px (= 320 physical pixels on Retina, `data-card-size="large"`) and the inspector pushes that even further. 512² covers all card sizes plus the inspector with comfortable Retina headroom, while the post-process pixelation pass (see `LOCKED-STACK.md`) keeps the look as native ~256-pixel art regardless of upscaling. If a future surface needs sharper pixel art above 512px (e.g., a hero splash), generate a separate `<name>-large.webp` variant — don't bump the default.

## Loop-beat tonality

See `agent-docs/GAME_LOOP.md` for the eight beats (solitude → cosmos). Each prompt file declares which beats the artwork belongs to — this informs lighting, density, and mood:

- **`solitude` / `first-growth`**: sparse, parchment-toned, single subject, soft natural light
- **`settlement` / `specialization`**: warmer, more inhabitants visible, lived-in feel
- **`curiosity` / `divergence`**: contemplative, more complex compositions, hint of mystery
- **`industry` / `cosmos`**: dense, mechanical or starfield-tinged

## Workflow

1. Read this DNA before generating.
2. Open the specific prompt file in `prompts/`.
3. Run in Higgsfield with the prompt's subject + style anchors + negative.
4. Drop raw output into `raw/<name>-v1.png`.
5. Log iteration in the prompt file's iteration log.
6. When happy: export as WEBP to `exports/<category>/<name>.webp`.
7. Update the status in `INDEX.md` from `planned` → `generated` → `approved` → `shipped`.
