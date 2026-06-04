# icon-catnip
Pulls from [_icon-style.md](_icon-style.md).

**Backdrop color**: `--res-catnip` (#5E8B47), the canonical catnip green —
this is *the* resource of the game's earliest minutes, so the icon needs to
be instantly recognisable.

**Subject**: a single chunky chibi catnip leaf — three rounded lobes
arranged in a fan, pointed tip, slightly serrated edges drawn as tiny
pixel-clusters along the outline, a stem ending in a one-pixel bud at the
bottom. Subject takes up the central 60% of the disc, oriented so the leaf
tip points to the upper-right.

**Accent**: one warm-cream (#F2E6CF) highlight pixel on the upper-left lobe
to suggest sunlit volume.

**Aspect**: 1:1. Pipeline: 512² raw → `sips -Z 128` → `cwebp -lossless` →
`exports/icons/catnip.webp`.

**Belongs to**: resource (`catnip`).

## Iteration log
- _(awaiting v1 generation)_
