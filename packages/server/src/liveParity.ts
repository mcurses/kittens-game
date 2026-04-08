import { readFileSync } from "node:fs";
import { migrateLegacySave, type SerializedGameState } from "@kittens/engine";
import LZString from "lz-string";
import { createMemoryAdapter } from "./db.js";
import { GameStateStore } from "./store.js";

const RESOURCE_NAMES = [
  "catnip",
  "wood",
  "minerals",
  "science",
  "faith",
  "antimatter",
  "unobtainium",
] as const;

const BUILDING_NAMES = [
  "hut",
  "logHouse",
  "mansion",
  "barn",
  "warehouse",
  "harbor",
  "oilWell",
  "factory",
  "reactor",
  "biolab",
  "aiCore",
  "accelerator",
  "chronosphere",
] as const;

const AUTOMATION_BUILDINGS = ["oilWell", "factory", "reactor"] as const;
const WORKSHOP_NAMES = ["silos", "stoneBarns", "concreteBarns", "reinforcedBarns", "ironwood"] as const;
const POLICY_NAMES = ["liberty", "tradition", "fascism", "communism", "fullIndustrialization"] as const;

export interface LegacyParityFixture {
  fixture: string;
  capturedAt: string;
  source: string;
  snapshot: AuditSnapshot;
}

export interface AuditSnapshot {
  calendar: {
    year: number;
    season: number;
    day: number;
  };
  village: {
    kittens: number;
    maxKittens: number | null;
    happiness: number | null;
  };
  resources: Record<(typeof RESOURCE_NAMES)[number], { value: number; maxValue: number | null }>;
  buildings: Record<(typeof BUILDING_NAMES)[number], { val: number; on: number | null }>;
  automation: Record<(typeof AUTOMATION_BUILDINGS)[number], boolean | null>;
  workshop: Record<(typeof WORKSHOP_NAMES)[number], boolean | null>;
  policies: Record<(typeof POLICY_NAMES)[number], boolean | null>;
  time: {
    flux: number | null;
    heat: number | null;
  };
}

export interface LiveParityAuditResult {
  fixture: LegacyParityFixture;
  imported: AuditSnapshot;
  live: AuditSnapshot;
  importMismatches: string[];
  liveMismatches: string[];
  ticks: number;
}

function getRepoRelativeUrl(path: string): URL {
  return new URL(path, import.meta.url);
}

export function loadRun8LegacyFixture(): LegacyParityFixture {
  const raw = readFileSync(
    getRepoRelativeUrl("../../../agent-docs/example-saves/run8-legacy-snapshot.json"),
    "utf8",
  );
  return JSON.parse(raw) as LegacyParityFixture;
}

export function loadRun8LegacySaveJson(): unknown {
  const compressed = readFileSync(
    getRepoRelativeUrl("../../../agent-docs/example-saves/Kittens Game - Run 8 - Year 10527 - Autumn, day 48.txt"),
    "utf8",
  );
  const migrated = migrateLegacySave(JSON.parse(readLegacySaveString(compressed)));
  return migrated;
}

function readLegacySaveString(compressed: string): string {
  const decompressed = LZString.decompressFromBase64(compressed);
  if (!decompressed) {
    throw new Error("Failed to decompress Run 8 legacy save fixture");
  }
  return decompressed;
}

function numberOrNull(value: number | undefined): number | null {
  return typeof value === "number" ? value : null;
}

function resourceValue(state: SerializedGameState, name: (typeof RESOURCE_NAMES)[number]): {
  value: number;
  maxValue: number | null;
} {
  const resource = state.resources[name];
  return {
    value: resource?.value ?? 0,
    maxValue: numberOrNull(resource?.maxValue),
  };
}

function buildingValue(state: SerializedGameState, name: (typeof BUILDING_NAMES)[number]): {
  val: number;
  on: number | null;
} {
  const building = state.buildings[name];
  return {
    val: building?.val ?? 0,
    on: numberOrNull(building?.on),
  };
}

function workshopResearched(state: SerializedGameState, name: (typeof WORKSHOP_NAMES)[number]): boolean | null {
  return state.workshop?.upgrades[name]?.researched ?? null;
}

function policyResearched(state: SerializedGameState, name: (typeof POLICY_NAMES)[number]): boolean | null {
  return state.science?.policies[name]?.researched ?? null;
}

export function captureAuditSnapshot(state: SerializedGameState): AuditSnapshot {
  return {
    calendar: {
      year: state.calendar.year,
      season: state.calendar.season,
      day: state.calendar.day,
    },
    village: {
      kittens: state.village.kittens,
      maxKittens: numberOrNull(state.effectCache.maxKittens),
      happiness: numberOrNull(state.village.happiness),
    },
    resources: {
      catnip: resourceValue(state, "catnip"),
      wood: resourceValue(state, "wood"),
      minerals: resourceValue(state, "minerals"),
      science: resourceValue(state, "science"),
      faith: resourceValue(state, "faith"),
      antimatter: resourceValue(state, "antimatter"),
      unobtainium: resourceValue(state, "unobtainium"),
    },
    buildings: {
      hut: buildingValue(state, "hut"),
      logHouse: buildingValue(state, "logHouse"),
      mansion: buildingValue(state, "mansion"),
      barn: buildingValue(state, "barn"),
      warehouse: buildingValue(state, "warehouse"),
      harbor: buildingValue(state, "harbor"),
      oilWell: buildingValue(state, "oilWell"),
      factory: buildingValue(state, "factory"),
      reactor: buildingValue(state, "reactor"),
      biolab: buildingValue(state, "biolab"),
      aiCore: buildingValue(state, "aiCore"),
      accelerator: buildingValue(state, "accelerator"),
      chronosphere: buildingValue(state, "chronosphere"),
    },
    automation: {
      oilWell: state.buildings.oilWell?.automationEnabled ?? null,
      factory: state.buildings.factory?.automationEnabled ?? null,
      reactor: state.buildings.reactor?.automationEnabled ?? null,
    },
    workshop: {
      silos: workshopResearched(state, "silos"),
      stoneBarns: workshopResearched(state, "stoneBarns"),
      concreteBarns: workshopResearched(state, "concreteBarns"),
      reinforcedBarns: workshopResearched(state, "reinforcedBarns"),
      ironwood: workshopResearched(state, "ironwood"),
    },
    policies: {
      liberty: policyResearched(state, "liberty"),
      tradition: policyResearched(state, "tradition"),
      fascism: policyResearched(state, "fascism"),
      communism: policyResearched(state, "communism"),
      fullIndustrialization: policyResearched(state, "fullIndustrialization"),
    },
    time: {
      flux: numberOrNull(state.time?.flux),
      heat: numberOrNull(state.time?.heat),
    },
  };
}

function compareNumber(
  label: string,
  actual: number | null,
  expected: number | null,
  mismatches: string[],
  tolerance = 1e-9,
): void {
  if (actual === null || expected === null) {
    if (actual !== expected) {
      mismatches.push(`${label}: expected ${String(expected)}, got ${String(actual)}`);
    }
    return;
  }
  if (Math.abs(actual - expected) > tolerance) {
    mismatches.push(`${label}: expected ${expected}, got ${actual}`);
  }
}

export function compareImportSnapshot(actual: AuditSnapshot, expected: AuditSnapshot): string[] {
  const mismatches: string[] = [];
  compareNumber("calendar.year", actual.calendar.year, expected.calendar.year, mismatches);
  compareNumber("calendar.season", actual.calendar.season, expected.calendar.season, mismatches);
  compareNumber("calendar.day", actual.calendar.day, expected.calendar.day, mismatches);
  compareNumber("village.kittens", actual.village.kittens, expected.village.kittens, mismatches);

  const actualMaxKittens = actual.village.maxKittens === null ? null : Math.floor(actual.village.maxKittens);
  compareNumber("village.maxKittens.floor", actualMaxKittens, expected.village.maxKittens, mismatches);
  // Tolerance 1e-5: pollution happiness uses Math.log(cathPollution) which introduces
  // ~1.8e-6 floating-point drift vs the legacy snapshot captured from a different JS engine.
  compareNumber("village.happiness", actual.village.happiness, expected.village.happiness, mismatches, 1e-5);

  for (const name of RESOURCE_NAMES) {
    compareNumber(`resources.${name}.value`, actual.resources[name].value, expected.resources[name].value, mismatches, 1e-6);
  }
  for (const name of BUILDING_NAMES) {
    compareNumber(`buildings.${name}.val`, actual.buildings[name].val, expected.buildings[name].val, mismatches);
    compareNumber(`buildings.${name}.on`, actual.buildings[name].on, expected.buildings[name].on, mismatches);
  }
  for (const name of AUTOMATION_BUILDINGS) {
    if (actual.automation[name] !== expected.automation[name]) {
      mismatches.push(`automation.${name}: expected ${String(expected.automation[name])}, got ${String(actual.automation[name])}`);
    }
  }
  for (const name of WORKSHOP_NAMES) {
    if (actual.workshop[name] !== expected.workshop[name]) {
      mismatches.push(`workshop.${name}: expected ${String(expected.workshop[name])}, got ${String(actual.workshop[name])}`);
    }
  }
  for (const name of POLICY_NAMES) {
    if (actual.policies[name] !== expected.policies[name]) {
      mismatches.push(`policies.${name}: expected ${String(expected.policies[name])}, got ${String(actual.policies[name])}`);
    }
  }
  compareNumber("time.flux", actual.time.flux, expected.time.flux, mismatches, 1e-9);
  compareNumber("time.heat", actual.time.heat, expected.time.heat, mismatches, 1e-9);
  return mismatches;
}

export function compareLiveSnapshot(actual: AuditSnapshot, expected: AuditSnapshot): string[] {
  const mismatches: string[] = [];
  compareNumber("calendar.year", actual.calendar.year, expected.calendar.year, mismatches);
  compareNumber("calendar.season", actual.calendar.season, expected.calendar.season, mismatches);
  if (actual.calendar.day < expected.calendar.day) {
    mismatches.push(`calendar.day regressed: expected >= ${expected.calendar.day}, got ${actual.calendar.day}`);
  }

  const actualMaxKittens = actual.village.maxKittens === null ? null : Math.floor(actual.village.maxKittens);
  compareNumber("live.maxKittens.floor", actualMaxKittens, expected.village.maxKittens, mismatches);
  if (actual.village.maxKittens !== null && actual.village.kittens > Math.floor(actual.village.maxKittens)) {
    mismatches.push(
      `live.kittens overflow: expected kittens <= floor(maxKittens), got ${actual.village.kittens} / ${actual.village.maxKittens}`,
    );
  }
  compareNumber("live.happiness", actual.village.happiness, expected.village.happiness, mismatches, 1e-5);

  for (const name of RESOURCE_NAMES) {
    const resource = actual.resources[name];
    if (resource.maxValue === null || resource.value <= resource.maxValue) {
      mismatches.push(
        `live.resources.${name}: expected over-cap preservation (> maxValue), got ${resource.value} / ${String(resource.maxValue)}`,
      );
    }
  }
  for (const name of BUILDING_NAMES) {
    compareNumber(`live.buildings.${name}.val`, actual.buildings[name].val, expected.buildings[name].val, mismatches);
    compareNumber(`live.buildings.${name}.on`, actual.buildings[name].on, expected.buildings[name].on, mismatches);
  }
  for (const name of AUTOMATION_BUILDINGS) {
    if (actual.automation[name] !== expected.automation[name]) {
      mismatches.push(
        `live.automation.${name}: expected ${String(expected.automation[name])}, got ${String(actual.automation[name])}`,
      );
    }
  }
  for (const name of WORKSHOP_NAMES) {
    if (actual.workshop[name] !== expected.workshop[name]) {
      mismatches.push(`live.workshop.${name}: expected ${String(expected.workshop[name])}, got ${String(actual.workshop[name])}`);
    }
  }
  for (const name of POLICY_NAMES) {
    if (actual.policies[name] !== expected.policies[name]) {
      mismatches.push(`live.policies.${name}: expected ${String(expected.policies[name])}, got ${String(actual.policies[name])}`);
    }
  }
  compareNumber("live.time.flux", actual.time.flux, expected.time.flux, mismatches, 1e-9);
  compareNumber("live.time.heat", actual.time.heat, expected.time.heat, mismatches, 1e-9);
  return mismatches;
}

export function runLiveImportParityAudit(ticks = 10): LiveParityAuditResult {
  const fixture = loadRun8LegacyFixture();
  const migrated = loadRun8LegacySaveJson() as SerializedGameState;
  const store = new GameStateStore(createMemoryAdapter(), "run8-parity-audit");
  store.init();
  const importedState = store.loadFromSave(migrated);
  for (let tick = 0; tick < ticks; tick++) {
    store.advanceTick();
  }
  const liveState = store.getSerialized();
  const imported = captureAuditSnapshot(importedState);
  const live = captureAuditSnapshot(liveState);

  return {
    fixture,
    imported,
    live,
    importMismatches: compareImportSnapshot(imported, fixture.snapshot),
    liveMismatches: compareLiveSnapshot(live, fixture.snapshot),
    ticks,
  };
}
