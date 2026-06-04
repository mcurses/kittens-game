# Locked Pixel-Art Stack

Single source of truth for the texture-and-style block that closes every Higgsfield prompt produced for Kittens Game. Pull this verbatim into prompts; never paraphrase on the fly.

This file pairs with the `kittens-pixel-director` skill — the skill emits prompts, this file holds the locked stack the skill references.

**Important**: the prompt is **best-effort** (Banana Pro often leans painterly even when told not to). The **post-process pixelation pass** (Section "Pipeline pairing" below) is what *guarantees* the final image reads as low-res pixel art. Always run both — the prompt sets composition + palette + cozy mood, the pass locks the pixel look.

---

## COZY STACK (warm parchment lane — used for `solitude`, `first-growth`, `settlement`, `specialization`, `curiosity`, `divergence`, `industry`)

```
Pixel art illustration in a hand-crafted low-resolution style, hard pixel edges with absolutely no anti-aliasing inside the artwork, target effective resolution of 32 to 64 native pixels upscaled with nearest-neighbor look, every transition is either a hard pixel edge or a deliberate dither pattern. Flat color blocks only — NO smooth gradient fills on any surface, NO soft airbrush shading, NO depth-of-field blur, NO bloom, NO painterly brush strokes, NO Stardew-Valley-style soft shading. Cozy hyggelig atmosphere — warm lived-in moments with small charming details (a tiny tea-cup on a stump, a curled-up sleeping kitten in a corner, a hanging lantern, a wooden basket, a flower in a clay pot), soft golden-hour rim light coming from the upper-left, gentle warm shadows in cool ink-tone, slight handcraft imperfection that signals "made with love" not "rendered by algorithm". Warm sat-reduced palette anchored in parchment cream and toasted browns, sage and olive greens, terracotta accents, never neon, never fluorescent. Wind-Waker-clarity of silhouette — readable chunky shapes, immediate role recognition. Mild three-quarter perspective with subject centered, at least one chibi cat visible doing something charming. Consistent one-pixel ink-toned outline (#2B221A or #5A4A3A) where shapes meet background, never AI-generated noisy outlines. Texture variation through dithering and clustered pixels, not gradient ramps. The artwork extends edge-to-edge across the entire canvas, filling all four corners — no decorative parchment border, no inset matte frame, no polaroid mounting, no surrounding negative space outside the scene, no card-style background panel separating the artwork from the canvas edge. The scene IS the frame. Lived-in handcrafted feel, not pristine, not procedural.
```

---

## COSMOS STACK (cool palette lane — used only for the `cosmos` loop beat / Helios surfaces)

```
Pixel art illustration in a hand-crafted low-resolution style, hard pixel edges with absolutely no anti-aliasing inside the artwork, target effective resolution of 32 to 64 native pixels upscaled with nearest-neighbor look, every transition is either a hard pixel edge or a deliberate dither pattern. Flat color blocks only — NO smooth gradient fills on any surface, NO soft airbrush shading, NO depth-of-field blur, NO bloom on solid surfaces (only on a few small emissive dots), NO painterly brush strokes. Cool palette anchored in deep cobalt and cyber-cyan #14F0D8, parchment retained only as small accent on instrument labels or paper details, mechanical and starfield-tinged composition. Retro-CRT phosphor glow on emissive surfaces (1-2 pixel halo only — no soft blooming). Wind-Waker-clarity of silhouette — readable chunky shapes, immediate role recognition. Mild three-quarter perspective with subject centered, soft directional light from upper-left, hard rim light on metal edges. Consistent one-pixel ink-toned outline (#2B221A or #5A4A3A) where shapes meet background, never AI-generated noisy outlines. Texture variation through dithering and clustered pixels, not gradient ramps. Mechanical and crafted, not pristine, not procedural.
```

---

## ENVIRONMENT-ONLY VARIANT (no chibi cat in frame — used for some Village Map variants and Book Covers)

Use the same stack as above, but drop the phrase "at least one chibi cat visible doing something charming" — the composition is environment-led. Other lines stay verbatim.

---

## PIPELINE PAIRING — POST-PROCESS PIXELATION (NON-NEGOTIABLE)

The prompt above gets us 70% of the way to pixel art. The remaining 30% — *guaranteed* low-res look, *guaranteed* hard pixel edges — comes from the post-process pass. **Always run both.**

After Banana Pro returns the 1024² raw PNG:

```bash
# Step A — Resize raw to the 512² intermediate
sips -Z 512 raw.png --out /tmp/intermediate-512.png

# Step B — POST-PROCESS PIXELATION: down to 256px nearest-neighbor, then back up to 512px.
#          This forcibly collapses sub-pixel painterly detail into hard pixel blocks
#          while keeping enough native information for Retina (DPR 2) cards.
sips -Z 256 /tmp/intermediate-512.png --out /tmp/pixelated-256.png
sips -Z 512 /tmp/pixelated-256.png --out /tmp/pixelated-512.png

# Step C — Convert to lossless WEBP for the export folder
cwebp -lossless -q 100 /tmp/pixelated-512.png -o assets/exports/<category>/<asset>-<tier>.webp
```

**Why down-then-up instead of just down?** Cards in the client render up to 160 CSS-px on Retina (= 320 physical pixels) in the `large` size mode, and the Inspector pushes that even further. A native 256-pixel WEBP would be sub-optimal for upscaling. The down-then-up pass enforces the *appearance* of 256-native pixel art while keeping the file at 512² display resolution — the browser then applies `image-rendering: pixelated` for clean upscaling at any larger size.

**Why 256 and not 128?** Calibrated on `field-s/m/l` and `aqueduct-s/m/l` (2026-06-02): at 128 native, the Retina x large-card combination (320 phys-px) made the pixels visibly chunky, breaking the cozy feel. 256 native + 512 export gives ~1.6× upscaling instead of ~2.5× — pixels read as crisp pixel-art rather than as compression artifacts. If a future asset wants more chunky look, drop to 128 explicitly per-asset and note in the iteration log.

**Sips default scaling is "nearest-like" for downsampling**, which is what we want for pixelation. Do not use cwebp's `-resize` (it uses smooth scaling) — always resize with sips first, then encode with cwebp.

---

## UNIVERSAL NEGATIVE (carried inside each prompt's Style anchors, not the stack itself)

Repeat across all prompts. Lives in `STYLE-DNA.md` as the single source — restated here for cross-reference:

```
photorealistic, 3D render, anime style, blurry, watermark, signature, text overlays, numbers, modern UI elements, glassmorphism, frosted glass, bloom on solid surfaces, lens flare, neon energy-drink colors, anti-aliased outlines, emoji, smooth gradient fills, AI-style purple-blue gradients, depth-of-field bokeh, lens vignette inside the artwork, photographic lighting (volumetric god rays, subsurface scattering), procedural-tile look, Stardew-Valley-soft-shading, painterly brush strokes, airbrush
```

---

## WHY ONE FILE FOR THE STACK

Three reasons:

1. **Drift control.** 33 prompt files referencing "the pixel-art stack" by phrase will drift over months of editing. One canonical block means one place to evolve the look.
2. **Token efficiency.** The skill cites this file by reference inside its own SKILL.md — when conversations get long, the model can re-load the stack from one short file instead of carrying 33 copies in context.
3. **Designer ergonomics.** A non-engineer (or future-you, six months from now) can tweak this file once and every new generation benefits. No `find . -name '*.md' | xargs sed` operations needed.

When you change this stack, bump a version line below and note the date + what changed. Old prompt files don't need rewriting — their iteration log already has the old context.

## Version log

- **v1** (2026-06-01): Initial canonical stack — warm parchment lane + cosmos lane + environment variant + universal negative.
- **v2** (2026-06-02): Renamed "Default" → "Cozy", injected hyggelig vocabulary (tea-cups, curled-up cats, hanging lanterns), hardened the anti-painterly block (explicit NO-list of gradient/airbrush/blur/Stardew-soft-shading), documented the post-process pixelation pass as non-negotiable pipeline pairing. Cosmos stack received the same anti-painterly tightening.
- **v2.1** (2026-06-02): Added "no decorative frame / edge-to-edge canvas" rule to both Cozy and Cosmos stacks. Banana Pro had been defaulting to a parchment-mat "framed pixel art" look on field v1/m/l — the scene was surrounded by a cream-colored border like a polaroid. The new rule forces the artwork to fill the entire canvas. Calibrated pixelation to 128 (down from 64) for charm-detail preservation.
- **v2.2** (2026-06-03): Doubled the pipeline output to 512×512 with native 256 pixel-art floor (was 256×256 / native 128). Triggered by live-test feedback that cards looked "very pixelated" — measurement showed the client renders building cards at 138–320 physical pixels (Retina × compact-to-large card size), which 256-px WEBPs couldn't cover without obvious upscaling. New pipeline: `sips -Z 512 → -Z 256 → -Z 512 → cwebp`. Existing v2 raws re-exported in place; Aqueduct also re-generated as v3 with a new prompt (Roman-aqueduct profile, beat moved to `first-growth → settlement`).
