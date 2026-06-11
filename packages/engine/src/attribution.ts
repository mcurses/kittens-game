/**
 * Per-source production attribution for resource inspector.
 *
 * Decomposes the effect cache contributions for a single resource by source
 * (buildings, jobs, kittens). Used by the UI to show which buildings/jobs
 * produce or consume a resource.
 *
 * Port of legacy `getTooltipHTML()` per-tick breakdown in ButtonModernHelper.
 */

import { BUILDING_DEFS } from "./buildings.js";
import type { GameState } from "./state.js";
import { JOB_DEFS, totalAssignedKittens } from "./village.js";

/** A single source's contribution to a resource's per-tick rate. */
export interface ProductionSource {
  /** Human-readable label, e.g. "Field ×10" */
  readonly label: string;
  /** Raw per-tick amount (negative for consumption, percentage for ratio) */
  readonly amount: number;
  /** Which effect channel this contributes to */
  readonly channel: "base" | "ratio" | "direct" | "prod" | "autoprod" | "consumption";
}

/** Effect key suffixes mapped to channels. */
const CHANNEL_SUFFIXES: ReadonlyArray<{ suffix: string; channel: ProductionSource["channel"] }> = [
  { suffix: "PerTickBase", channel: "base" },
  { suffix: "Ratio", channel: "ratio" },
  { suffix: "PerTick", channel: "direct" },
  { suffix: "PerTickProd", channel: "prod" },
  { suffix: "PerTickAutoprod", channel: "autoprod" },
  { suffix: "PerTickCon", channel: "consumption" },
];

/**
 * Return per-source production attribution for a given resource.
 *
 * This mirrors the effect computation in BuildingManager.updateEffects() and
 * VillageManager.updateEffects() but tracks contributions per-source rather
 * than aggregating them.
 */
export function getResourceAttribution(state: GameState, resourceName: string): ProductionSource[] {
  const sources: ProductionSource[] = [];

  // Build the set of effect keys we care about
  const relevantKeys = new Set(CHANNEL_SUFFIXES.map(({ suffix }) => `${resourceName}${suffix}`));

  // ── Static building effects ─────────────────────────────────────────────────
  for (const def of BUILDING_DEFS) {
    const entry = state.buildings[def.name];
    if (!entry || (entry.val === 0 && entry.on === 0)) continue;

    const stageEffects = def.stageEffects?.[entry.stage ?? 0] ?? def.effects;
    for (const [effectName, rawBaseValue] of Object.entries(stageEffects)) {
      if (!relevantKeys.has(effectName)) continue;

      const multiplier = effectName.endsWith("Max") ? entry.val : entry.on;
      if (multiplier === 0) continue;

      const channel = CHANNEL_SUFFIXES.find(
        (s) => effectName === `${resourceName}${s.suffix}`,
      )?.channel;
      if (!channel) continue;

      const amount = rawBaseValue * multiplier;
      sources.push({
        label: `${prettifyName(def.name)} ×${multiplier}`,
        amount,
        channel,
      });
    }
  }

  // ── Dynamic building effects ────────────────────────────────────────────────
  addSmelterAttribution(state, resourceName, sources);
  addBreweryAttribution(state, resourceName, sources);
  addSteamworksAttribution(state, resourceName, sources);
  addFactoryAttribution(state, resourceName, sources);
  addTempleAttribution(state, resourceName, sources);

  // ── Job production ──────────────────────────────────────────────────────────
  const happiness = state.village.happiness;
  for (const def of JOB_DEFS) {
    if (!def.effectKey || def.baseProduction === 0) continue;
    const jobResourceName = def.effectKey.replace("PerTickBase", "");
    if (jobResourceName !== resourceName) continue;

    const job = state.village.jobs[def.name];
    if (!job || job.value === 0) continue;

    const jobRatio = state.effectCache[`${resourceName}JobRatio`] ?? 0;
    const production = def.baseProduction * job.value * happiness * (1 + jobRatio);
    sources.push({
      label: `${prettifyName(def.name)} ×${job.value}`,
      amount: production,
      channel: "base",
    });
  }

  // ── Kitten consumption ──────────────────────────────────────────────────────
  addKittenConsumption(state, resourceName, sources);

  return sources;
}

// ── Dynamic effect helpers ──────────────────────────────────────────────────

function addSmelterAttribution(
  state: GameState,
  resourceName: string,
  sources: ProductionSource[],
): void {
  const smelter = state.buildings.smelter;
  if (!smelter || smelter.on <= 0) return;
  const smelterRatio = 1 + (state.effectCache.smelterRatio ?? 0);

  const contributions: Record<string, { amount: number; channel: ProductionSource["channel"] }> = {
    iron: { amount: 0.02 * smelterRatio * smelter.on, channel: "autoprod" },
    wood: { amount: -0.05 * smelter.on, channel: "consumption" },
    minerals: { amount: -0.1 * smelter.on, channel: "consumption" },
  };

  if (isUpgradeResearched(state, "coalFurnace")) {
    contributions.coal = { amount: 0.005 * smelterRatio * smelter.on, channel: "autoprod" };
  }
  if (isUpgradeResearched(state, "goldOre")) {
    contributions.gold = { amount: 0.001 * smelter.on, channel: "autoprod" };
  }
  if (isUpgradeResearched(state, "nuclearSmelters")) {
    contributions.titanium = { amount: 0.0015 * smelter.on, channel: "autoprod" };
  }

  const c = contributions[resourceName];
  if (c) {
    sources.push({ label: `Smelter ×${smelter.on}`, amount: c.amount, channel: c.channel });
  }
}

function addBreweryAttribution(
  state: GameState,
  resourceName: string,
  sources: ProductionSource[],
): void {
  const brewery = state.buildings.brewery;
  if (!brewery || brewery.on <= 0) return;
  const brewRatio = state.effectCache.breweryConsumptionRatio ?? 0;

  const contributions: Record<string, number> = {
    catnip: -1 * brewery.on * (1 + brewRatio),
    spice: -0.1 * brewery.on * (1 + brewRatio),
  };

  const amount = contributions[resourceName];
  if (amount !== undefined) {
    sources.push({ label: `Brewery ×${brewery.on}`, amount, channel: "consumption" });
  }
}

function addSteamworksAttribution(
  state: GameState,
  resourceName: string,
  sources: ProductionSource[],
): void {
  const steamworks = state.buildings.steamworks;
  if (!steamworks || steamworks.on <= 0) return;

  if (resourceName === "manuscript") {
    let manuscriptPerTickProd = 0;
    if (isUpgradeResearched(state, "printingPress")) {
      manuscriptPerTickProd = 0.0005;
      if (isUpgradeResearched(state, "offsetPress")) manuscriptPerTickProd *= 4;
      if (isUpgradeResearched(state, "photolithography")) manuscriptPerTickProd *= 4;
    }
    if (manuscriptPerTickProd > 0) {
      sources.push({
        label: `Steamworks ×${steamworks.on}`,
        amount: manuscriptPerTickProd * steamworks.on,
        channel: "prod",
      });
    }
  }
}

function addFactoryAttribution(
  state: GameState,
  resourceName: string,
  _sources: ProductionSource[],
): void {
  const factory = state.buildings.factory;
  if (!factory || factory.on <= 0) return;

  if (resourceName === "craft") return; // craftRatio handled via static effects

  // Factory with factoryLogistics adds extra craftRatio — already in static effects
}

function addTempleAttribution(
  _state: GameState,
  _resourceName: string,
  _sources: ProductionSource[],
): void {
  // Temple dynamic happiness is not a per-resource effect, skip
}

function addKittenConsumption(
  state: GameState,
  resourceName: string,
  sources: ProductionSource[],
): void {
  const kittens = state.village.kittens;
  if (kittens <= 0) return;

  const demandRatios: Record<string, { base: number; ratioKey: string }> = {
    catnip: { base: -0.85, ratioKey: "catnipDemandRatio" },
    furs: { base: -0.01, ratioKey: "fursDemandRatio" },
    ivory: { base: -0.007, ratioKey: "ivoryDemandRatio" },
    spice: { base: -0.001, ratioKey: "spiceDemandRatio" },
  };

  const demand = demandRatios[resourceName];
  if (!demand) return;

  const demandRatio = state.effectCache[demand.ratioKey] ?? 0;

  if (resourceName === "catnip") {
    // Special handling: worker kittens get catnipDemandWorkerRatioGlobal discount
    const workerRatio = state.effectCache.catnipDemandWorkerRatioGlobal ?? 0;
    const assigned = Math.min(totalAssignedKittens(state.village), kittens);
    const unassigned = kittens - assigned;
    const workerBase = demand.base * (1 + demandRatio);
    const amount = unassigned * workerBase + assigned * workerBase * (1 + workerRatio);
    sources.push({ label: `Kittens ×${kittens}`, amount, channel: "consumption" });
  } else {
    const amount = demand.base * kittens * (1 + demandRatio);
    sources.push({ label: `Kittens ×${kittens}`, amount, channel: "consumption" });
  }
}

// ── Utilities ───────────────────────────────────────────────────────────────

function isUpgradeResearched(state: GameState, name: string): boolean {
  return state.workshop?.upgrades?.[name]?.researched === true;
}

function prettifyName(name: string): string {
  return name.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
}
