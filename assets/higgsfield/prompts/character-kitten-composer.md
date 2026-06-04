# character-kitten-composer

**Status**: spec (composed at runtime by `packages/engine/src/kittens/portraitPrompt.ts`)
**Aspect**: 1:1, 1024×1024 raw → 512×512 export (standard NN-pixelation pass per `LOCKED-STACK.md`)
**Belongs to loop beats**: settlement, specialization, divergence, industry — wherever individual Villagers appear in the Census/Inspector.

This file mirrors the layer phrase library that the TypeScript composer uses to build per-kitten Higgsfield prompts. Keep them in sync — if you add a new breed/body/eyes/accessory option here, also add the matching `*_DETAIL` line in `portraitPrompt.ts` and the enum entry in `appearance.ts`. The composer joins layers in this order:

```
Subject → Breed detail → Body detail → Eyes detail → Accessory → Job outfit → Framing → Style stack → Output specs
```

The deterministic appearance fields (`breed`, `body`, `eyes`, `accessory`) are picked from these tables with a seeded RNG derived from `kitten.id`, so the same kitten always gets the same prompt across loads — and the same portrait once generated.

---

## Layer 1 — Breeds (10)

- **tabby**: warm-brown tabby with cream chest, classic mackerel striping on flanks and tail
- **calico**: white base with asymmetric patches of warm orange and ink-brown
- **heilige-birma**: silky cream coat with darker sealpoint markings on face/ears/paws/tail, sapphire-eyed
- **maine-coon**: long-haired with mane ruff around neck, large tufted ears, sturdy build
- **siamese**: pale cream body with chocolate-brown points on face/ears/paws/tail
- **black-shorthair**: solid ink-black short coat with faint warmer-brown undertones in light
- **white-fluffy**: pure cream-white long fur slightly tousled, blush-pink paws and nose
- **tortoiseshell**: marbled black-and-orange coat with no distinct pattern lines
- **ginger**: warm orange-tabby coat with faint cream belly stripes
- **smoke-grey**: soft slate-grey coat with silver tips on the longest fur

## Layer 2 — Body (5)

- **slim**: lean elegant silhouette, long legs, narrow waist
- **plump**: rounded silhouette with chunky proportions and a soft belly
- **athletic**: balanced muscular build with visible shoulder definition
- **muscular**: broad chest and powerful hindquarters, scarred ear-tip suggesting a working life
- **fluffy**: rounded silhouette emphasised by thick fur, paws look mitten-like

## Layer 3 — Eyes (5)

- **large-amber**: large round amber eyes with a curious wide-open look
- **narrow-green**: narrowed forest-green eyes giving an alert thoughtful expression
- **wide-blue**: wide sky-blue eyes with a slightly innocent gaze
- **mismatched**: heterochromia — one amber, one pale-green
- **sleepy-golden**: half-lidded golden eyes, perpetually sleepy and content

## Layer 4 — Accessory (6 + 3× null for ~33% no-accessory)

- **scarf**: wears a hand-knit wool scarf in muted sage-green, slightly frayed at the edge
- **flower-behind-ear**: a small dried marigold blossom tucked behind the left ear
- **tiny-hat**: wears a tiny conical felt cap in toasted-brown, perched between the ears
- **bandana**: a small folded cotton bandana around the neck, pattern of faded paws
- **leather-collar**: a worn leather collar with a single small brass bell
- **feather-tucked-in-fur**: a single grey-blue feather tucked into the fur behind one ear
- **null**: no accessories — only the natural fur

## Layer 5 — Job Outfit (8 + 1× fallback for unassigned)

- **farmer**: wears a wide straw hat and a simple linen apron with a single catnip leaf in the front pocket
- **woodcutter**: wears a sleeveless leather vest over rolled-up linen sleeves, a small hand-axe at the hip
- **scholar**: wears a tiny round-collar tunic and small round-rimmed reading spectacles, a feather quill behind one ear
- **hunter**: wears a deep-green hooded cloak with fur trim, a quiver of small arrows across the back
- **miner**: wears a soot-streaked padded jacket and a small candle-lantern clipped to the chest
- **geologist**: wears a sand-coloured field vest with several small pockets, a magnifying glass on a leather cord
- **priest**: wears a long sage-green robe with a simple cord belt, a small wooden charm around the neck
- **engineer**: wears a cluttered tool-belt over a russet workshop apron, a pencil tucked behind one ear
- **unassigned (fallback)**: wears simple village clothes — a plain off-white linen tunic

## Framing (constant)

> Single chibi cat character portrait, centered, three-quarter view, neutral friendly pose against a soft warm-cream background with subtle paw-print texture.

## Style Stack (constant — copy from LOCKED-STACK.md COZY)

> Pixel art illustration in a hand-crafted low-resolution style, hard pixel edges with absolutely no anti-aliasing inside the artwork, target effective resolution of 32 to 64 native pixels upscaled with nearest-neighbor look, every transition is either a hard pixel edge or a deliberate dither pattern. Flat color blocks only — NO smooth gradient fills, NO soft airbrush shading, NO depth-of-field blur, NO bloom, NO painterly brush strokes. Cozy hyggelig atmosphere — warm parchment palette anchored in cream and toasted browns with sage and olive accents, never neon, never fluorescent. Soft golden-hour rim light from upper-left, gentle warm shadows in cool ink-tone. Wind-Waker-clarity of silhouette — readable chunky shapes. Consistent one-pixel ink-toned outline (#2B221A) where shapes meet background, never AI-generated noisy outlines. Texture variation through dithering and clustered pixels, not gradient ramps. The artwork extends edge-to-edge across the entire canvas, filling all four corners. Lived-in handcrafted feel, not pristine, not procedural.

## Output Specs

- Higgsfield model: Banana Pro
- Raw resolution: **1024×1024 px square**
- Format: PNG
- Filename: `assets/higgsfield/raw/characters/k{kittenId}-v{n}.png` (one folder per kitten, append `-v2`, `-v3` for re-rolls)
- After generation: standard `sips -Z 512 → -Z 256 → -Z 512` pixelation pass + `cwebp -lossless`, output to `assets/exports/characters/k{kittenId}.webp`. The standard pass is OK here — Inspector slot is 240px so the chunky pixel-art look reads well.
