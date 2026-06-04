# building-field

Three tier variants: **s** (val 1–9), **m** (val 10–49), **l** (val 50+). Each tier scales density and activity; the building stays a catnip field throughout. Style anchors, palette, negative, and aspect are shared across tiers.

## Shared spec (applies to all three tiers)

**Style anchors**: pixel art, cozy hyggelig warmth, hard pixel edges, no aliased outlines, flat color blocks, no smooth shading (relies on [`LOCKED-STACK.md`](../LOCKED-STACK.md) Cozy Stack v2)

**Palette anchors**:
- dominant: `--res-catnip #5E8B47` (catnip green)
- secondary: `--res-wood #8B5A2B` (fence, tools, posts)
- background: `--bg #F2E6CF` (warm parchment sky)
- ink accent: `--ink #2B221A` (one-pixel outlines)
- warmth: `--accent #C97D5D` (golden-hour rim light only)

**Negative**: see `STYLE-DNA.md` universal negative + `LOCKED-STACK.md`

**Aspect**: 1:1, 1024×1024 raw → post-process pixelation pass → 256×256 final WEBP export per tier

**Belongs to loop beats**: `solitude` → `first-growth` (s), `first-growth` → `settlement` (m), `settlement` → `specialization` (l)

---

## Subject (s) — val 1–9, tier `s`

A tiny catnip field in early morning, a **single chibi cat** crouched in front of one small row of young catnip plants, gently watering the leaves with a tiny wooden watering can. A single short wooden fence post stands in the lower-left corner with one horizontal rail. **Sparse parchment sky** fills the upper half of the frame. A **tiny tea-cup sits on a small tree-stump** in the lower-right corner — the hyggelig charm-detail. Soft golden-hour rim light from the upper-left.

Mood: solitude, first-growth, optimistic. Empty space carries weight. This is the field's first day.

## Subject (m) — val 10–49, tier `m`

A small catnip farm at golden hour with **three chibi cats** scattered across the patch — one crouched tending the front row, one mid-step carrying a small wooden basket between rows, one curled up napping on a haystack in the back-left. Three rows of catnip plants, fully grown leaves, the **wooden fence corner anchors the lower-left** (two posts, two horizontal rails). A small clay flower-pot with a single bloom sits on the front-right corner-post. **A hanging lantern dangles from the upper-left fence post**, gently swaying. Parchment-toned sky beyond the field with a single faint cloud band along the upper third.

Mood: first-growth → settlement, lived-in. Multiple workers, props of daily life. Charm details: nap-cat, lantern, flower-pot.

## Subject (l) — val 50+, tier `l`

A sprawling catnip farm operation at warm late-afternoon, **5+ chibi cats** active across visible zones: two in the foreground tending dense rows with woven baskets, one in the midground hauling a small cart of harvested catnip leaves, one in the upper-right on a tiny wooden ladder reaching for the top leaves of a tall mature plant, one curled up sleeping on a stack of catnip bundles. **A small barn corner intrudes from the upper-right** (red-brown wood, slanted roof, one small window with a warm yellow glow inside). The wooden fence wraps around two sides now. **A path of pressed earth winds through the rows**. **Two clay flower-pots, a basket, a watering can, and a stack of harvest sacks** are visible as ambient set-dressing. Hanging lanterns on three fence posts. Golden-hour warm light, longer shadows than tier m.

Mood: settlement → specialization, full operation. Visible workflow, mature plants, infrastructure. The field has become a working farm.

---

## Per-tier iteration log

### Tier s

- **v1** (2026-06-02, nano_banana_pro / 2 credits, pixelated 128→256, 38KB): Single gray cat watering catnip + steaming tea-cup charm-detail. Worked but had a **parchment-cream frame around the artwork** (Banana Pro default). Subject/palette/composition all correct, just framed.
- **v2** (2026-06-02, nano_banana_pro / 2 credits, pixelated 128→256, 43KB): Re-gen with the v2.1 stack (no-frame rule). Brown-fur chibi cat with watering can sits atop a small grassy mound with a row of catnip in front, wooden fence post lower-left, large tree-stump lower-right. **NO frame — scene fills the canvas edge-to-edge ✓**. Slightly different cat (brown not gray) and the tea-cup got replaced by a more visible tree-stump — minor subject drift but cozy.

### Tier m

- **v1** (2026-06-02, nano_banana_pro / 2 credits, pixelated 128→256, 57KB): Three cats in triangle composition (orange tending, gray mid-step, tabby sleeping on haystack), 3 catnip rows, fence corner, lantern, flower-pot. Cozy and lived-in. **Had parchment-cream frame around artwork.**
- **v2** (2026-06-02, nano_banana_pro / 2 credits, pixelated 128→256, 53KB): Re-gen with v2.1 stack. Three cats: sleeping cat on haystack (back), orange cat mid-step between rows, ginger cat tending front row. Fence post lower-left with hanging lantern. **Frame gone — scene fills canvas ✓**. Composition slightly tighter than v1, no haystack-as-background, just rows of plants.

### Tier l

- **v1** (2026-06-02, nano_banana_pro / 4 credits incl. 1 fail, pixelated 128→256, 70KB): Four cats, barn corner with glowing window, cart, ladder-cat, sleeping-cat, lanterns, dense rows. **Had parchment-cream frame.** Calibration: 5 cats + 6 props returned `failed` → simplified to 4 cats + 4 props on retry → success.
- **v2** (2026-06-02, nano_banana_pro / 2 credits, pixelated 128→256, 75KB): Re-gen with v2.1 stack. Black cat on wooden ladder upper-right reaching for tall plants ✓, orange cart-hauler with small cart of catnip in the middle, calico tending plants with basket in foreground, tabby curled up sleeping lower-left. Red-brown barn corner upper-right with chimney and glowing window ✓. Wooden fence wrapping bottom + lower-left, hanging lanterns on posts, dense rows. **Frame gone — full edge-to-edge ✓**. Slightly cleaner and more legible than v1.

---

## Retired (pre-tier era)

- **v1** (2026-06-01, nano_banana_pro / 1024² / 2 credits, exported as `field.webp` — now retired): All three chibi cats present (orange, gray, calico) with varied poses, fence corner in lower-left, three rows of catnip plants visible. Style came out as Stardew-Valley-illustration with soft shading rather than hard-edged low-res pixel art — the "every pixel placed deliberately, no smooth gradients" directive in the v1 stack didn't override Banana Pro's painterly default. v2 stack hardens the anti-painterly block AND adds a post-process pixelation pass to lock the look. Subject + composition + palette were all correct; style was the only miss. Tier-aware re-generation supersedes this single-image v1.
