# Icon Style Anchor — shared prompt fragment for `icon` variant

This file is the single source of truth for the **tiny pixel-art icon** style
used in the Kittens-Game UI for resources, jobs, and craft outputs. Every
`icon-<name>.md` prompt in this folder pulls the following style block
verbatim and only customises the `Subject` + `Backdrop color` per icon.

The reason for centralising: a 30-icon set with drifting style values across
30 prompt files becomes uncontrollable in two iterations. This file is the
one place to tune — bump the version note at the bottom when changes ship.

---

## Shared style block (paste verbatim into every per-icon prompt)

```
Pixel art icon, tiny single-subject design intended to be read at 16–48
display pixels. A single chibi subject sits centered on a soft round
backdrop disc of <BACKDROP_COLOR>, with a clean one-pixel ink-toned outline
(#2B221A) around both the disc and the subject. Target effective resolution
of 24 to 32 native pixels nearest-neighbour upscaled, hard pixel edges with
absolutely no anti-aliasing inside the artwork, every transition is either
a hard pixel edge or a deliberate dither pattern. Flat color blocks only —
NO smooth gradient fills on any surface, NO soft airbrush shading, NO
depth-of-field blur, NO bloom, NO painterly brush strokes, NO
Stardew-Valley-style soft shading.

Composition rules:
- The circular backdrop fills the canvas edge to edge (no margin), the disc
  touches all four sides at its widest points.
- The subject occupies roughly the central 60% of the disc and is centred
  both horizontally and vertically.
- Exactly ONE subject; at most ONE small accent detail (e.g. a sparkle, a
  drop, a single highlight pixel).
- Subject silhouette must be clearly readable when the icon is rendered at
  16×16 CSS pixels — chunky, no thin lines.
- No text, no numbers, no emoji, no decorative frame, no inset matte, no
  parchment surround. The disc IS the frame.

Palette discipline:
- Backdrop: <BACKDROP_COLOR> (the resource-token hex).
- Subject body: warm-light variant of the resource hue, OR parchment cream
  #F2E6CF as a high-contrast alternative — chosen per-icon.
- Outline + subject shadows: ink #2B221A (consistent across the whole set).
- Accent (optional): warm gold #D9A441 for sparkles, parchment cream for
  highlights, ink for sub-shadows.

Negative anchors (universal):
photorealistic, 3D render, anime style, blurry, watermark, signature, text
overlays, numbers, modern UI elements, glassmorphism, frosted glass, bloom
on solid surfaces, lens flare, neon energy-drink colors, anti-aliased
outlines, emoji, smooth gradient fills, AI-style purple-blue gradients,
depth-of-field bokeh, lens vignette inside the artwork, photographic
lighting, painterly brush strokes, airbrush, framed pixel art, inset matte,
polaroid mounting.

Aspect ratio 1:1. Will be downsampled from 512² raw → 128² WEBP via the
sips + cwebp pipeline; the prompt should target the appearance of the
final 128² size at native ~32 pixels.
```

---

## Per-icon prompt pattern

Every `icon-<name>.md` file follows this exact shape so the batch tooling
can iterate uniformly:

```markdown
# icon-<name>
Pulls from [_icon-style.md](_icon-style.md).

**Backdrop color**: <CSS token name> (<hex>), <one-sentence colour rationale>.
**Subject**: <one sentence describing the chibi subject; specify chunky
proportions, count of pixel-clusters, any iconic shape (leaf, log, ore
chunk, hammer, etc.)>.
**Accent (optional)**: <one sentence or "none">.

**Aspect**: 1:1. Pipeline: 512² raw → `sips -Z 128` → `cwebp -lossless` →
exports/icons/<name>.webp.

**Belongs to**: <resource | job | craft> (`<engine-key>`).

## Iteration log
- _(awaiting v1 generation)_
```

---

## Version log

- **v1** (2026-06-04): Initial icon style — soft circular backdrop, 32-pixel
  native floor, one-subject minimal rule, ink-outline anchor #2B221A,
  per-resource backdrop hue from the `--res-*` design-system tokens.
