// Deterministic appearance generator for kittens.
// Given a stable seed derived from kitten.id, pick one option from each layer
// table. Used both by lore templates and the Higgsfield portrait-prompt composer.

// ── Seeded RNG (mulberry32) + string hash ────────────────────────────────────

export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  }
  return h >>> 0;
}

export function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)]!;
}

// ── Layer tables ──────────────────────────────────────────────────────────────

export const BREEDS = [
  "tabby",
  "calico",
  "heilige-birma",
  "maine-coon",
  "siamese",
  "black-shorthair",
  "white-fluffy",
  "tortoiseshell",
  "ginger",
  "smoke-grey",
] as const;

export const BODIES = ["slim", "plump", "athletic", "muscular", "fluffy"] as const;

export const EYES = [
  "large-amber",
  "narrow-green",
  "wide-blue",
  "mismatched",
  "sleepy-golden",
] as const;

// null entries weight the random pick toward "no accessory" — about 1/3 chance.
export const ACCESSORIES = [
  "scarf",
  "flower-behind-ear",
  "tiny-hat",
  "bandana",
  "leather-collar",
  "feather-tucked-in-fur",
  null,
  null,
  null,
] as const;

export type Breed = (typeof BREEDS)[number];
export type Body = (typeof BODIES)[number];
export type Eyes = (typeof EYES)[number];
export type Accessory = (typeof ACCESSORIES)[number];

export interface Appearance {
  readonly breed: Breed;
  readonly body: Body;
  readonly eyes: Eyes;
  readonly accessory: Accessory;
}

export function generateAppearance(kittenId: string): Appearance {
  const rng = mulberry32(hashString(`appearance:${kittenId}`));
  return {
    breed: pick(rng, BREEDS),
    body: pick(rng, BODIES),
    eyes: pick(rng, EYES),
    accessory: pick(rng, ACCESSORIES),
  };
}
