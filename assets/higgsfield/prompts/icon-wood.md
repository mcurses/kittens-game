# icon-wood
Pulls from [_icon-style.md](_icon-style.md).

**Backdrop color**: `--res-wood` (#8B5A2B), warm toast-brown disc. Wood is
the second resource the player unlocks and shows up in every Hut, Library,
Workshop cost — the icon needs to read at glance.

**Subject**: a single chunky chibi wood-log seen end-on at a slight 3/4
angle, so the camera shows both the round cross-section (with three concentric
tree-rings drawn as pixel circles) AND a sliver of the side bark texture
(two horizontal pixel-bands). The log is oriented horizontally, taking up
the central 60% of the disc.

**Accent**: one warm-gold (#D9A441) ring-highlight on the inner tree-ring
to suggest a freshly-cut surface.

**Aspect**: 1:1. Pipeline: 512² raw → `sips -Z 128` → `cwebp -lossless` →
`exports/icons/wood.webp`.

**Belongs to**: resource (`wood`).

## Iteration log
- _(awaiting v1 generation)_
