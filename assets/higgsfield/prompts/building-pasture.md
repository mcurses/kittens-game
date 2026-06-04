# building-pasture

Three tier variants: **s** (val 1–9), **m** (val 10–49), **l** (val 50+). Each tier scales density of grazing animals and pasture infrastructure.

## Shared spec (applies to all three tiers)

**Style anchors**: pixel art, cozy hyggelig warmth, hard pixel edges, no aliased outlines, flat color blocks. Pulls from [`LOCKED-STACK.md`](../LOCKED-STACK.md) Cozy Stack v2.1 (no frame).

**Palette anchors**:
- dominant: `--accent-2 #7A9A6E` (sage green meadow grass)
- secondary: `--res-wood #8B5A2B` (low wooden fence posts and rails)
- background: `--bg #F2E6CF` (parchment sky)
- highlight: `--res-gold #D9A441` (sunlit grass tops, warm cream on cats' fur)
- ink: `--ink #2B221A` (one-pixel outlines)

**Negative**: see `STYLE-DNA.md` universal. Specifically: no horses (use chibi unicorns or grazing cats), no modern farm equipment, no rolling industrial pastures.

**Aspect**: 1:1, 1024×1024 raw → post-process pixelation pass → 256×256 final WEBP export per tier (`pasture-s.webp`, `pasture-m.webp`, `pasture-l.webp`).

**Belongs to loop beats**: `first-growth` → `settlement` → `specialization`. Quiet expansion of the village into managed landscape.

---

## Subject (s) — val 1–9, tier `s`

A small grassy meadow at golden hour with a **single chibi gray cat lying contentedly in the grass** chewing on a stalk. A single low wooden fence post with one horizontal rail anchors the lower-left. A small wildflower clump (yellow + white) grows in the lower-right corner — the hyggelig charm-detail. The meadow rolls gently up to the upper third where the parchment sky begins, with one distant cloud band. Soft golden-hour rim light from the upper-left.

Mood: solitude, lazy afternoon. The pasture has just been claimed.

## Subject (m) — val 10–49, tier `m`

A small enclosed pasture at golden hour with **a low wooden fence wrapping the lower-left and bottom edge** (three posts with two horizontal rails). Inside the pasture: **two chibi cats and a tiny chibi unicorn** — one cat grazing on grass in the foreground, the unicorn standing in the midground with a flower in its mouth, one cat curled up napping in the back-right under a small wooden shelter with a slanted roof. A small wooden water trough sits beside the shelter. **A wildflower patch grows along the fence base** (charm-detail). Parchment sky in the upper third with two distant cloud bands.

Mood: settlement, lived-in domesticity. The animals have names but we don't say them.

## Subject (l) — val 50+, tier `l`

A spacious pasture at warm late-afternoon with **a wooden fence wrapping the lower-left and bottom edge** and **a small open wooden barn with red-brown slanted roof anchoring the upper-right**. Inside the pasture: **four chibi animals visible** — two chibi cats grazing in the foreground rows of grass, one chibi unicorn standing midground with mane catching warm light, one chibi cat napping on a haystack in the back-left. Two small wooden water troughs along the fence line. **A wildflower patch and a small clay milk-jug sit beside the foreground fence post** (charm details). The grass is taller in the back, shorter in the foreground where it's been grazed.

Mood: specialization, full husbandry operation. Multiple species, infrastructure, daily-life routine.

---

## Per-tier iteration log

### Tier s
- **v1** (2026-06-02, nano_banana_pro / 2 credits, pixelated 128→256, 45KB): TWO chibi cats playfully nuzzling in the grass (asked for one, got two — even more charming), low wooden fence post lower-left with horizontal rail, sage meadow rolling to horizon, parchment sky upper third, wildflowers with yellow + white blooms along the bottom. No-frame rule held — image fills canvas edge-to-edge. Cat color is gray, fur catching warm light. Mood lands as cozy + lazy.

### Tier m
- **v1** (2026-06-02, nano_banana_pro / 2 credits, pixelated 128→256, 52KB): Chibi unicorn (white with yellow mane) standing midground with a flower in its mouth ✓, orange tabby cat sleeping next to a wooden shelter (slanted roof) in the back-right, calico cat lying on the grass foreground. Low wooden fence wraps the lower-left and bottom. Wildflowers along base ✓. **No frame ✓**. Composition reads as a peaceful enclosed paddock at golden hour.

### Tier l
- **v1** (2026-06-02, nano_banana_pro / 2 credits, pixelated 128→256, 64KB): Spacious pasture with **large wooden barn anchoring upper-right (visible slanted roof)** ✓, central chibi unicorn standing on green grass, two cats playing in foreground (orange + tabby), sleeping cats on a tall haystack in the back-left, fence wraps the lower-left + bottom + right edge, wooden water trough + clay milk-jug lower-left ✓, wildflowers along fence base. **No frame ✓**. Full pasture operation — multiple species, infrastructure, daily-life detail.
