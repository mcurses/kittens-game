# icon-farmer
Pulls from [_icon-style.md](_icon-style.md).

**Backdrop color**: `--res-catnip` (#5E8B47) — the farmer's job is to grow
catnip, so the backdrop hue echoes the resource they produce.

**Subject**: a single chibi cat from the front-3/4 angle, head + torso only
(no full body — would lose detail at 16 px). The cat has chunky ears, a
warm-cream (#F2E6CF) belly bib, ginger-tabby (#C97D5D) head and ears, and
holds a tiny wooden hoe at a 45° angle resting against the right shoulder.
Eyes are two single ink pixels. The cat occupies the central 60% of the
disc, oriented to face slightly right.

**Accent**: one warm-gold (#D9A441) pixel-cluster on the metal head of the
hoe blade.

**Aspect**: 1:1. Pipeline: 512² raw → `sips -Z 128` → `cwebp -lossless` →
`exports/icons/farmer.webp`.

**Belongs to**: job (`farmer`).

## Iteration log
- _(awaiting v1 generation)_
