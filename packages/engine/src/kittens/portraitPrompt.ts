// Compose a full Higgsfield prompt string for a kitten's unique portrait.
// Layered: breed → body → eyes → accessory → job-outfit → master style stack.
//
// The phrase tables are inline (instead of parsed from the markdown spec) so
// the engine can compose deterministically without runtime file I/O. The
// markdown spec at assets/higgsfield/prompts/character-kitten-composer.md is
// the human-readable mirror — keep both in sync when adding new options.

import type { Accessory, Appearance, Body, Breed, Eyes } from "./appearance.js";

const BREED_DETAIL: Record<Breed, string> = {
  "tabby": "warm-brown tabby with cream chest, classic mackerel striping on flanks and tail",
  "calico": "white base with asymmetric patches of warm orange and ink-brown",
  "heilige-birma": "silky cream coat with darker sealpoint markings on face, ears, paws and tail, deep sapphire-eyed",
  "maine-coon": "long-haired with mane ruff around neck, large tufted ears, sturdy build",
  "siamese": "pale cream body with chocolate-brown points on face, ears, paws and tail",
  "black-shorthair": "solid ink-black short coat with faint warmer-brown undertones in light",
  "white-fluffy": "pure cream-white long fur slightly tousled, blush-pink paws and nose",
  "tortoiseshell": "marbled black-and-orange coat with no distinct pattern lines",
  "ginger": "warm orange-tabby coat with faint cream belly stripes",
  "smoke-grey": "soft slate-grey coat with silver tips on the longest fur",
};

const BODY_DETAIL: Record<Body, string> = {
  "slim": "lean elegant silhouette, long legs, narrow waist",
  "plump": "rounded silhouette with chunky proportions and a soft belly",
  "athletic": "balanced muscular build with visible shoulder definition",
  "muscular": "broad chest and powerful hindquarters, scarred ear-tip suggesting a working life",
  "fluffy": "rounded silhouette emphasised by thick fur, paws look mitten-like",
};

const EYES_DETAIL: Record<Eyes, string> = {
  "large-amber": "large round amber eyes with a curious wide-open look",
  "narrow-green": "narrowed forest-green eyes giving an alert thoughtful expression",
  "wide-blue": "wide sky-blue eyes with a slightly innocent gaze",
  "mismatched": "heterochromia — one amber, one pale-green",
  "sleepy-golden": "half-lidded golden eyes, perpetually sleepy and content",
};

const ACCESSORY_DETAIL: Record<Exclude<Accessory, null>, string> = {
  "scarf": "wears a hand-knit wool scarf in muted sage-green, slightly frayed at the edge",
  "flower-behind-ear": "a small dried marigold blossom tucked behind the left ear",
  "tiny-hat": "wears a tiny conical felt cap in toasted-brown, perched between the ears",
  "bandana": "a small folded cotton bandana around the neck, pattern of faded paws",
  "leather-collar": "a worn leather collar with a single small brass bell",
  "feather-tucked-in-fur": "a single grey-blue feather tucked into the fur behind one ear",
};

const JOB_OUTFIT_DETAIL: Record<string, string> = {
  "farmer": "wears a wide straw hat and a simple linen apron with a single catnip leaf in the front pocket",
  "woodcutter": "wears a sleeveless leather vest over rolled-up linen sleeves, a small hand-axe at the hip",
  "scholar": "wears a tiny round-collar tunic and small round-rimmed reading spectacles, a feather quill behind one ear",
  "hunter": "wears a deep-green hooded cloak with fur trim, a quiver of small arrows across the back",
  "miner": "wears a soot-streaked padded jacket and a small candle-lantern clipped to the chest",
  "geologist": "wears a sand-coloured field vest with several small pockets, a magnifying glass on a leather cord",
  "priest": "wears a long sage-green robe with a simple cord belt, a small wooden charm around the neck",
  "engineer": "wears a cluttered tool-belt over a russet workshop apron, a pencil tucked behind one ear",
};

const STYLE_STACK =
  "Pixel art illustration in a hand-crafted low-resolution style, hard pixel edges with absolutely no anti-aliasing inside the artwork. EFFECTIVE NATIVE RESOLUTION IS EXACTLY 48 PIXELS along the longest visible dimension of the character — every pixel block is clearly distinguishable as a square, no sub-pixel detail anywhere, no smooth transitions, no half-pixels, no anti-aliased curves. Flat color blocks only — NO smooth gradient fills, NO soft airbrush shading, NO depth-of-field blur, NO bloom, NO painterly brush strokes. Cozy hyggelig atmosphere — warm parchment palette anchored in cream and toasted browns with sage and olive accents, never neon, never fluorescent. Soft golden-hour rim light from upper-left, gentle warm shadows in cool ink-tone. Wind-Waker-clarity of silhouette — readable chunky shapes. Consistent one-pixel ink-toned outline (#2B221A) where shapes meet background, never AI-generated noisy outlines. Texture variation through dithering and clustered pixels, not gradient ramps. Lived-in handcrafted feel, not pristine, not procedural.";

const FRAMING =
  "FULL-BODY chibi cat character — entire body visible from ear-tips at top to paw-pads at bottom. Standing upright facing forward-right in three-quarter view, paws together at sides, tail visible behind the body. Character occupies approximately 80% of canvas height, centered horizontally and vertically, with at least 8% margin to every canvas edge — NO CROPPING at any edge, no zoomed-in face, no half-body. Identical proportions across all characters: head ~30% of body height, torso ~50%, legs ~20%. Both feet planted flat on an invisible ground line at the lower third of the canvas.";

const BACKGROUND =
  "Background: flat warm-cream color (#F5E8D0) filling the entire canvas behind the character, with one single small subtle paw-print motif placed only in the upper-right corner (~10% from top, ~10% from right edge). No other background elements anywhere — no patterns, no scenery, no shadows under the cat, no vignette, no frame, no border, no decorative elements. The cream color is uniform across the remaining canvas area.";

export interface PortraitPromptInput {
  appearance: Appearance;
  job: string | null;
}

/** Compose the full Higgsfield prompt for a kitten portrait. */
export function composeKittenPrompt(input: PortraitPromptInput): string {
  const { appearance, job } = input;
  const breed = BREED_DETAIL[appearance.breed];
  const body = BODY_DETAIL[appearance.body];
  const eyes = EYES_DETAIL[appearance.eyes];
  const accessory = appearance.accessory
    ? ACCESSORY_DETAIL[appearance.accessory]
    : null;
  const outfit = job && JOB_OUTFIT_DETAIL[job]
    ? JOB_OUTFIT_DETAIL[job]
    : "wears simple village clothes — a plain off-white linen tunic";

  const subjectParts = [
    `A ${appearance.body} chibi cat character`,
    breed,
    body,
    eyes,
    accessory ?? "no accessories — only the natural fur",
    outfit,
  ];
  const subject = subjectParts.join(". ");

  return `${subject}.\n\n${FRAMING}\n\n${BACKGROUND}\n\n${STYLE_STACK}\n\nOutput: 1024×1024 square PNG.`;
}
