export type BuildingTier = "s" | "m" | "l" | "xl" | "xxl" | "mega" | "giant";

/**
 * Per-name tier override. Each row is [minVal, tierName] ordered descending
 * by `minVal` — the first row whose threshold is ≤ `val` wins.
 *
 * `field` has a granular 7-step schema so end-game megafields read
 * differently from early-game patches. All other buildings keep the
 * default 3-step schema.
 */
const TIER_OVERRIDES: Record<string, ReadonlyArray<readonly [number, BuildingTier]>> = {
  field: [
    [500, "giant"],
    [200, "mega"],
    [100, "xxl"],
    [75, "xl"],
    [50, "l"],
    [10, "m"],
    [1, "s"],
  ],
};

const DEFAULT_THRESHOLDS: ReadonlyArray<readonly [number, BuildingTier]> = [
  [50, "l"],
  [10, "m"],
  [1, "s"],
];

export function buildingTier(val: number, name?: string): BuildingTier {
  const thresholds = (name && TIER_OVERRIDES[name]) ?? DEFAULT_THRESHOLDS;
  for (const [min, tier] of thresholds) {
    if (val >= min) return tier;
  }
  return "s";
}

export function iconPathFor(name: string, val: number): string {
  return `/assets/buildings/${name}-${buildingTier(val, name)}.webp`;
}
