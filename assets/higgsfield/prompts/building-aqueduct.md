# building-aqueduct

Three tier variants: **s** (val 1–9), **m** (val 10–49), **l** (val 50+). Each tier scales the aqueduct from a short stub of arched wall into a long roman-style span that finally terminates in a village fountain. The whole point of the asset family is: **water infrastructure that makes catnip fields more reliable**, not "industrial" engineering.

## Shared spec (applies to all three tiers)

**Style anchors**: pixel art, cozy hyggelig warmth, hard pixel edges, no aliased outlines, flat color blocks, mild three-quarter side-profile angle so the arch silhouettes read instantly. Pulls from [`LOCKED-STACK.md`](../LOCKED-STACK.md) Cozy Stack v2.1 (no frame). Pipeline: LOCKED-STACK v2.2 (1024² raw → 512² export, native ~256 pixel-art floor).

**Composition rule**: classical Roman-aqueduct silhouette — every tier must show **pillars + semicircular arches + a continuous water channel running along the top of the structure**, with visible water in or trickling over the channel. The arches are the readable shape; the cats and details decorate them.

**Palette anchors**:
- dominant: `--res-minerals #847266` (warm weathered stone for pillars and arches; subtle dither for block texture)
- secondary: `--res-science #7A9DC2` (water in the channel, soft blue — never neon)
- midground/background: `--accent-2 #7A9A6E` (sage grass slope at the base) + `--bg #F2E6CF` (parchment sky)
- highlight: `--res-gold #D9A441` (sunlit upper edges of arches and channel rim, warm rim light from upper-left)
- ink: `--ink #2B221A` (one-pixel outlines, shadow under each arch)

**Negative**: see `STYLE-DNA.md` universal, plus specifically — no Roman-empire grandeur or marble polish, no modern concrete viaducts, no industrial-scale highway aqueducts, no railway bridges, no fantasy ruined-temple vibe. Stay village-scale, lived-in.

**Aspect**: 1:1, 1024×1024 raw → post-process pixelation pass (sips -Z 512 → -Z 256 → -Z 512) → 512×512 final WEBP export per tier (`aqueduct-s.webp`, `aqueduct-m.webp`, `aqueduct-l.webp`).

**Belongs to loop beats**: `first-growth` → `settlement`. The aqueduct is a quiet infrastructural upgrade to the catnip-farming loop — water now reaches further than the village can hand-carry it. It is *not* `industry` (no machinery), *not* `specialization` (does not require dedicated jobs to operate).

---

## Subject (s) — val 1–9, tier `s`

**A short stub of stone aqueduct** seen from the side: **one chunky pillar on the left supporting a single semicircular arch** that ends abruptly at the right edge of the structure (it has just been started — the next pillar isn't built yet). The continuous water channel sits on top of the arch, **a thin ribbon of soft blue water visible inside it**, with a few hyggelig **water drops trickling from the unfinished right end down onto the grass**, forming a small puddle. **A single chibi cat sits at the base of the left pillar**, head tilted up watching the dripping water. A small wooden bucket placed under the drip (catching water — the charm-detail). Sage grass slope underneath, parchment sky behind, soft golden-hour rim light on the upper-left edge of the arch.

Mood: first-growth, "we just built our first water pipe". Compact silhouette, one arch, one cat, one bucket, a quiet drip.

## Subject (m) — val 10–49, tier `m`

**A continuous Roman-style aqueduct span of three to four semicircular arches** marching from left to right across the scene at golden hour, all carrying a single shared water channel along the top. **Water flows visibly through the channel**, faint blue with a couple of small ripples, and **one or two small overflow-trickles drip from joints** to the grass below. The pillars have stone-block texture and faint moss creeping at the joints. **Two chibi cats are visible**: one balancing on top of the channel between two arches (curious "inspector" pose), the other crouched on the grass beside a small clay water-jug catching a drip at the base of a pillar. A wildflower clump grows at one of the pillar bases. Sage grass rolls underneath, parchment sky upper third with one soft cloud band.

Mood: settlement, "this is part of daily life now". Repeating arch rhythm reads as recognisable infrastructure.

## Subject (l) — val 50+, tier `l`

**A long Roman-style aqueduct of five to six semicircular arches** marching across the scene at warm late-afternoon, the water channel running continuously along the top from left to right. **At the right end, the aqueduct connects to a small village fountain** — a stone basin where the channel pours into the basin in a steady stream, water spilling out the front. **Three chibi cats are active**: one walking confidently across the top of the channel like an inspector midspan, one filling a small wooden bucket at the fountain basin, one curled up napping in the shade under the second arch from the left. Stone blocks weathered, ivy creeping up the second-to-last pillar, **a small wooden shed nestled at the foot of the leftmost pillar** with a tiny chimney puffing once. A wildflower patch and two stacked buckets near the shed. Sage grass slope, parchment sky behind with two soft cloud bands.

Mood: settlement → quiet pride. Mature, lived-in water infrastructure terminating in a fountain that the whole village uses.

---

## Per-tier iteration log

### Tier s
- **v1** (2026-06-02, nano_banana_pro, pixelated 128→256, 48KB): Single chunky stone arch with cat on top peering down at water. **Retired 2026-06-03** — composition read as "low garden wall + cat", not as an aqueduct stub. User feedback: "ergibt noch wenig sinn".
- **v3** (2026-06-03, nano_banana_pro): Pillar + semi-circular arch on left with water channel on top, drip onto bucket on right, one cat at pillar base watching. Pixelation pipeline 256→512 (LOCKED-STACK v2.2), exported as 512² WEBP. _Awaiting generation._

### Tier m
- **v1** (2026-06-02, nano_banana_pro, pixelated 128→256, 40KB): Two connected arches, cats on top and at base, leaning ladder, slight border line around image. **Retired 2026-06-03** — composition didn't read as Roman aqueduct; only 2 arches felt like a wall section.
- **v3** (2026-06-03, nano_banana_pro): Three to four semicircular arches with shared water channel, two cats (inspector + bucket-filler), wildflowers. Pipeline LOCKED-STACK v2.2 (`sips -Z 512 → -Z 256 → -Z 512`), exported as 512² WEBP. **Generated 2026-06-03 ✓.**

### Tier l
- **v1** (2026-06-02, nano_banana_pro, pixelated 128→256, 57KB): Three connected arches, cat walking on top, cat checking joint, cat drinking, ivy, wooden shed, buckets. **Retired 2026-06-03** — visually solid but only 3 arches and no terminating fountain, so it didn't communicate the village-scale water-supply story.
- **v3** (2026-06-03, nano_banana_pro): Five to six arches terminating in a village fountain at the right, three cats (inspector, fountain-filler, napping), wooden shed at left pillar foot. Pipeline LOCKED-STACK v2.2 (`sips -Z 512 → -Z 256 → -Z 512`), exported as 512² WEBP. **Generated 2026-06-03 ✓.**
