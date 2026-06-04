export type BuildingTier = "s" | "m" | "l";

export function buildingTier(val: number): BuildingTier {
  if (val >= 50) return "l";
  if (val >= 10) return "m";
  return "s";
}

export function iconPathFor(name: string, val: number): string {
  return `/assets/buildings/${name}-${buildingTier(val)}.webp`;
}
