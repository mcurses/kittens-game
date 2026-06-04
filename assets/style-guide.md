# Style Guide — Kittens Game Assets

A one-page brief for everything that ships out of `assets/`. Read this before generating or sourcing any new artwork.

## The corridor

**Effective resolution**: ~256 native pixels exported as 512×512 WEBPs. Larger raws (e.g. Higgsfield's 1024×1024) get downsampled through the post-process pixelation pass (see `higgsfield/LOCKED-STACK.md`) — don't ship anything where every pixel isn't doing work.

**Pixel cleanliness**: Hard edges. No anti-aliasing inside the artwork. CSS uses `image-rendering: pixelated`; if your asset has soft edges, they'll fight the renderer and look wrong.

**Palette**: Warm and saturation-reduced. Greens lean olive (think `--res-catnip #5E8B47`), browns lean toast (`--res-wood #8B5A2B`), backgrounds are parchment (`--bg #F2E6CF`). Avoid neon, fluorescent, or "energy drink" colors except where the loop beat explicitly calls for it (the `cosmos` beat may use `--cyber #14F0D8`).

**Authoritative palette**: `kittens-game-design-system/project/colors_and_type.css`. Pull color references from there using the variable names; never hand-pick hexes.

## Composition

- **Subject centered.** Hover cards are square; off-center subjects look unbalanced when scaled.
- **Mild top-down perspective.** Think Stardew Valley tilt, not pure top-down (which feels schematic) and not full isometric (which feels game-asset-y).
- **At least one cat visible.** Where it makes sense — a Field card without a cat farming it is just a field. A Library card without a cat reading is just shelves. Cats are the through-line.
- **Cats are chibi-proportioned.** Big head, small body. Personality-forward.

## What doesn't belong

- ❌ Text or numbers in the artwork. UI labels handle that.
- ❌ Photorealistic lighting (volumetric god rays, depth-of-field blur). Always feels off in pixel-art.
- ❌ Glassmorphism, frosted panels, bloom effects baked into the asset.
- ❌ UI elements drawn into the artwork (buttons, progress bars, cursors).
- ❌ Outlines if they're noisy / aliased. A consistent 1-pixel outline is fine; AI-generated outlines often aren't.
- ❌ Emoji, modern app-icon aesthetics, sticker outlines.

## Per-asset-type guidance

### Building hover cards (Higgsfield lane)
- 512×512 final export (Retina-ready for the `large` card size).
- Show the building doing what it does — a Field with a cat tending it, a Library with a cat reading.
- Background should feel like the appropriate **loop beat** (see `agent-docs/GAME_LOOP.md`). A starter building like the Field belongs to the `solitude`/`first-growth` beats — sparse, parchment-toned.

### Resource UI icons (sprite lane)
- 16×16 or 32×32, PNG with alpha.
- Iconic, not illustrative — a single recognizable object (catnip = leaf; wood = log; minerals = stone chunk).
- Use the `--res-*` color from `colors_and_type.css` as the dominant hue, white/black for highlights/shadows only.

### Hero buttons (e.g. Gather Catnip)
- 320×320 minimum, can be Higgsfield-generated.
- Subject must be visually anchored regardless of background blend mode — the button might sit on light or dark surfaces.

## Iteration discipline

Every Higgsfield-generated asset must keep its prompt file in `higgsfield/prompts/` with the **iteration log** filled in. We learn what works for our style by accumulating those notes — don't skip the log.
