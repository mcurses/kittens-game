import type { GameStateResponse } from "@kittens/api-spec";
import type { HappinessEntity } from "./InspectorContext.js";

const LUXURY_RESOURCE_NAMES = new Set([
  "furs",
  "ivory",
  "spice",
  "unicorns",
  "alicorn",
  "necrocorn",
  "tears",
  "karma",
  "relic",
  "void",
  "elderBox",
  "wrappingPaper",
  "blackcoin",
  "bloodstone",
  "tMythril",
]);

const UNCOMMON_RESOURCE_NAMES = new Set(["furs", "ivory", "spice"]);

function asObject(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

function getNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" ? value : fallback;
}

function getResourceValue(resources: Record<string, unknown> | null, name: string): number {
  if (!resources) return 0;
  const resource = asObject(resources[name]);
  return getNumber(resource?.value, 0);
}

function getLuxuryBonus(
  resources: Record<string, unknown> | null,
  effectCache: Record<string, unknown> | null,
): number {
  const happinessPerLuxury = 10 + getNumber(effectCache?.luxuryHappinessBonus, 0);
  const consumableLuxuryHappiness = getNumber(effectCache?.consumableLuxuryHappiness, 0);
  let total = 0;

  for (const name of LUXURY_RESOURCE_NAMES) {
    const value = getResourceValue(resources, name);
    if (value <= 0) continue;
    if (name === "elderBox" && getResourceValue(resources, "wrappingPaper") > 0) continue;
    total += happinessPerLuxury;
    if (UNCOMMON_RESOURCE_NAMES.has(name)) total += consumableLuxuryHappiness;
  }

  return total;
}

export function buildHappinessEntity(state: GameStateResponse): HappinessEntity {
  const raw = state as unknown as Record<string, unknown>;
  const village = asObject(raw.village);
  const calendar = asObject(raw.calendar);
  const resources = asObject(raw.resources);
  const effectCache = asObject(raw.effectCache);

  const totalPct = Math.round(getNumber(village?.happiness, 1) * 100);
  const base = 100;
  const buildings = getNumber(effectCache?.happiness, 0);
  const luxuries = getLuxuryBonus(resources, effectCache);
  const karma = getResourceValue(resources, "karma");
  const festival =
    getNumber(calendar?.festivalDays, 0) > 0
      ? 30 * (1 + getNumber(effectCache?.festivalRatio, 0))
      : 0;

  const kittens = getNumber(village?.kittens, 0);
  const overpopulation = Math.max(0, kittens - 5);
  const penaltyBase = overpopulation * 2;
  const unhappinessRatio = getNumber(effectCache?.unhappinessRatio, 0);
  const penaltyMitigation = -penaltyBase * unhappinessRatio;
  const penalty = penaltyBase * (1 + unhappinessRatio);

  return {
    kind: "happiness",
    totalPct,
    breakdown: {
      base,
      buildings,
      luxuries,
      karma,
      festival,
      penalty,
      penaltyBase,
      penaltyMitigation,
    },
  };
}
