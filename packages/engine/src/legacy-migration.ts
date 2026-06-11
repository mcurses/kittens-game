/**
 * Legacy save migration — converts a parsed legacy Kittens Game save object
 * (from `game.save()` / LZString export) to a SerializedGameState for the new engine.
 *
 * This function is pure — no I/O, no compression. The caller (server) handles
 * LZString decompression before passing the parsed JSON here.
 *
 * Port reference: legacy/js/game.js save(), load(), migrateSave()
 */

import { BUILDING_DEFS } from "./buildings.js";
import { TECH_DEFS } from "./science.js";
import type { SerializedGameState } from "./state.js";

// ── Internal helpers ──────────────────────────────────────────────────────────

type Rec = Record<string, unknown>;

function isRec(v: unknown): v is Rec {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function isArr(v: unknown): v is unknown[] {
  return Array.isArray(v);
}

function num(v: unknown, fallback = 0): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

function bool(v: unknown, fallback = false): boolean {
  return typeof v === "boolean" ? v : fallback;
}

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

/**
 * Convert a legacy array of `{name, ...}` items to a Record keyed by name.
 * Items without a string `name` field are dropped.
 */
function arrayToRecord<T>(arr: unknown[], pick: (item: Rec) => T | null): Record<string, T> {
  const result: Record<string, T> = {};
  for (const item of arr) {
    if (!isRec(item)) continue;
    const name = str(item.name);
    if (!name) continue;
    const mapped = pick(item);
    if (mapped !== null) result[name] = mapped;
  }
  return result;
}

/**
 * Convert a legacy numeric-indexed building array to a Record keyed by building name.
 * Legacy saves store buildings as a numeric-indexed array where index N corresponds
 * to BUILDING_DEFS[N].name. Items at each index have {val, on, unlocked?, jammed?, isAutomationEnabled?}.
 */
function buildingsArrayToRecord(
  arr: unknown[],
): Record<
  string,
  { val: number; on: number; unlocked?: boolean; automationEnabled?: boolean; stage?: number }
> {
  const result: Record<
    string,
    { val: number; on: number; unlocked?: boolean; automationEnabled?: boolean; stage?: number }
  > = {};
  for (let i = 0; i < arr.length; i++) {
    const item = arr[i];
    if (!isRec(item)) continue;

    // Get building name from BUILDING_DEFS at this index
    const def = BUILDING_DEFS[i];
    if (!def) continue; // Index out of bounds

    result[def.name] = {
      val: num(item.val),
      on: num(item.on),
      unlocked: bool(item.unlocked, false),
      // jammed dropped; isAutomationEnabled mapped to new name; stage preserved
      ...(typeof item.isAutomationEnabled === "boolean"
        ? { automationEnabled: item.isAutomationEnabled }
        : {}),
      ...(typeof item.stage === "number" && item.stage > 0 ? { stage: item.stage } : {}),
    };
  }
  return result;
}

// ── Domain migrators ──────────────────────────────────────────────────────────

function migrateResources(
  raw: unknown,
): Record<string, { value: number; maxValue: number; perTick: number }> {
  if (!isArr(raw)) return {};
  return arrayToRecord(raw, (item) => {
    // Rename legacy manpower → catpower
    return { value: num(item.value), maxValue: num(item.maxValue), perTick: 0 };
  });
}

function migrateBuildings(
  raw: unknown,
): Record<
  string,
  { val: number; on: number; unlocked?: boolean; automationEnabled?: boolean; stage?: number }
> {
  if (!isArr(raw)) return {};

  // Check if this is a named array (legacy test format) or numeric-indexed (actual legacy saves)
  // Named array: items have { name: "field", val: 3, ... }
  // Numeric-indexed: items have { val: 3, ... } at specific indices
  if (raw.length > 0 && isRec(raw[0]) && "name" in raw[0]) {
    // Named array format (legacy test/export format)
    return arrayToRecord(raw, (item) => ({
      val: num(item.val),
      on: num(item.on),
      unlocked: bool(item.unlocked, false),
      // jammed dropped; isAutomationEnabled mapped to new name; stage preserved
      ...(typeof item.isAutomationEnabled === "boolean"
        ? { automationEnabled: item.isAutomationEnabled }
        : {}),
      ...(typeof item.stage === "number" && (item.stage as number) > 0
        ? { stage: item.stage as number }
        : {}),
    }));
  }

  // Numeric-indexed format (actual legacy saves from kittensgame.com)
  return buildingsArrayToRecord(raw);
}

function migrateVillage(raw: unknown): SerializedGameState["village"] {
  const v = isRec(raw) ? raw : {};

  // Legacy kittens is an array of kitten objects
  const kittensArr = isArr(v.kittens) ? v.kittens : [];
  const kittens = kittensArr.length;

  // kittenProgress renamed from nextKittenProgress
  const kittenProgress = num(isRec(v) && "nextKittenProgress" in v ? v.nextKittenProgress : 0);

  const jobs = isArr(v.jobs) ? arrayToRecord(v.jobs, (item) => ({ value: num(item.value) })) : {};

  // Migrate individual kittens from legacy array
  const sim = kittensArr.map((k, i) => {
    const kr = isRec(k) ? k : {};
    return {
      id: `k${i + 1}`,
      name: typeof kr.name === "string" ? kr.name : "Unknown",
      surname: typeof kr.surname === "string" ? kr.surname : "Unknown",
      age: num(kr.age),
      trait:
        typeof kr.trait === "object" && kr.trait !== null
          ? str((kr.trait as Record<string, unknown>).name)
          : "none",
      job: typeof kr.job === "string" ? kr.job : null,
      skills: isRec(kr.skills)
        ? Object.fromEntries(
            Object.entries(kr.skills as Record<string, unknown>).map(([k, v]) => [k, num(v)]),
          )
        : {},
      rank: num(kr.rank),
      exp: num(kr.exp),
      isFavorite: kr.favorite === true,
      isLeader: kr.isLeader === true,
    };
  });

  return {
    kittens,
    kittenProgress,
    jobs,
    sim,
    deadKittens: 0,
    happiness: 1.0,
    // biomes, loadouts, map discarded
  };
}

function migrateCalendar(raw: unknown): SerializedGameState["calendar"] {
  const c = isRec(raw) ? raw : {};
  return {
    day: num(c.day),
    season: num(c.season),
    year: num(c.year),
    festivalDays: num(c.festivalDays),
    // weather, cycle, cycleYear discarded
  };
}

function migrateScience(raw: unknown): SerializedGameState["science"] {
  const s = isRec(raw) ? raw : {};
  return {
    techs: isArr(s.techs)
      ? arrayToRecord(s.techs, (item) => ({
          unlocked: bool(item.unlocked),
          researched: bool(item.researched),
        }))
      : {},
    policies: isArr(s.policies)
      ? arrayToRecord(s.policies, (item) => ({
          unlocked: bool(item.unlocked),
          blocked: bool(item.blocked),
          researched: bool(item.researched),
        }))
      : {},
  };
}

function migrateWorkshop(raw: unknown): SerializedGameState["workshop"] {
  const w = isRec(raw) ? raw : {};
  return {
    upgrades: isArr(w.upgrades)
      ? arrayToRecord(w.upgrades, (item) => ({
          unlocked: bool(item.unlocked),
          researched: bool(item.researched),
        }))
      : {},
    crafts: isArr(w.crafts)
      ? arrayToRecord(w.crafts, (item) => ({
          unlocked: bool(item.unlocked),
          // value, progress discarded
        }))
      : {},
    // zebraUpgrades discarded
  };
}

function migrateReligion(raw: unknown): NonNullable<SerializedGameState["religion"]> {
  if (!isRec(raw))
    return { worship: 0, faithRatio: 0, transcendenceTier: 0, zu: {}, ru: {}, tu: {} };
  return {
    worship: num(raw.faith), // faith → worship
    faithRatio: num(raw.faithRatio),
    transcendenceTier: num(raw.transcendenceTier),
    zu: isArr(raw.zu)
      ? arrayToRecord(raw.zu, (item) => ({
          val: num(item.val),
          on: num(item.on),
          unlocked: bool(item.unlocked),
        }))
      : {},
    ru: isArr(raw.ru)
      ? arrayToRecord(raw.ru, (item) => ({
          val: num(item.val),
          on: num(item.on),
        }))
      : {},
    tu: isArr(raw.tu)
      ? arrayToRecord(raw.tu, (item) => ({
          val: num(item.val),
          on: num(item.on),
          unlocked: bool(item.unlocked),
        }))
      : {},
    // pact, corruption, activeHolyGenocide, necrocornDeficit discarded
  };
}

function migratePrestige(raw: unknown): NonNullable<SerializedGameState["prestige"]> {
  if (!isRec(raw)) return { perks: {} };
  return {
    perks: isArr(raw.perks)
      ? arrayToRecord(raw.perks, (item) => ({
          unlocked: bool(item.unlocked),
          researched: bool(item.researched),
        }))
      : {},
  };
}

function migrateChallenges(raw: unknown): NonNullable<SerializedGameState["challenges"]> {
  if (!isRec(raw)) return { challenges: {} };
  return {
    challenges: isArr(raw.challenges)
      ? arrayToRecord(raw.challenges, (item) => ({
          unlocked: bool(item.unlocked),
          active: bool(item.active),
          researched: bool(item.researched),
          on: num(item.on),
          pending: false, // new field, not in legacy
        }))
      : {},
    // reserves discarded
  };
}

function migrateSpace(raw: unknown): NonNullable<SerializedGameState["space"]> {
  if (!isRec(raw)) return { programs: {}, planets: {}, spaceBuildings: {} };

  const spaceBuildings: Record<string, { val: number; on: number; unlocked: boolean }> = {};

  // Extract nested planet buildings into the flat spaceBuildings Record
  if (isArr(raw.planets)) {
    for (const planet of raw.planets) {
      if (!isRec(planet)) continue;
      if (isArr(planet.buildings)) {
        for (const bld of planet.buildings) {
          if (!isRec(bld)) continue;
          const name = str(bld.name);
          if (!name) continue;
          spaceBuildings[name] = {
            val: num(bld.val),
            on: num(bld.on),
            unlocked: bool(bld.unlocked),
          };
        }
      }
    }
  }

  return {
    programs: isArr(raw.programs)
      ? arrayToRecord(raw.programs, (item) => ({
          val: num(item.val),
          on: num(item.on),
          unlocked: bool(item.unlocked),
        }))
      : {},
    planets: isArr(raw.planets)
      ? arrayToRecord(raw.planets, (item) => ({
          unlocked: bool(item.unlocked),
          reached: bool(item.reached),
          routeDays: num(item.routeDays),
        }))
      : {},
    spaceBuildings,
    // hideResearched discarded
  };
}

function migrateDiplomacy(raw: unknown): NonNullable<SerializedGameState["diplomacy"]> {
  if (!isRec(raw)) return { races: {}, baseGoldCost: 0, baseCatpowerCost: 0 };
  return {
    races: isArr(raw.races)
      ? arrayToRecord(raw.races, (item) => ({
          unlocked: bool(item.unlocked),
          embassyLevel: num(item.embassyLevel),
          // collapsed, energy, duration, pinned discarded
        }))
      : {},
    baseGoldCost: 0,
    baseCatpowerCost: 0,
  };
}

function migrateTime(raw: unknown): NonNullable<SerializedGameState["time"]> {
  if (!isRec(raw)) return { cfus: {}, vsus: {}, heat: 0, flux: 0, isAccelerated: false };
  return {
    // cfu → cfus, vsu → vsus
    cfus: isArr(raw.cfu)
      ? arrayToRecord(raw.cfu, (item) => ({
          val: num(item.val),
          on: num(item.on),
          unlocked: bool(item.unlocked) || num(item.val) > 0,
          heat: num(item.heat),
        }))
      : {},
    vsus: isArr(raw.vsu)
      ? arrayToRecord(raw.vsu, (item) => ({
          val: num(item.val),
          on: num(item.on),
          unlocked: bool(item.unlocked) || num(item.val) > 0,
        }))
      : {},
    heat: num(raw.heat),
    flux: num(raw.flux),
    isAccelerated: bool(raw.isAccelerated),
    // queueItems, queueSources, timestamp, testShatter discarded
  };
}

function migrateAchievements(
  rawAch: unknown,
  rawAchBadges: unknown,
): NonNullable<SerializedGameState["achievements"]> {
  const achievements: Array<{ name: string; unlocked: boolean; starUnlocked: boolean }> = [];
  const badges: Array<{ name: string; unlocked: boolean }> = [];
  let badgesUnlocked = false;

  if (isArr(rawAch)) {
    for (const a of rawAch) {
      if (!isRec(a)) continue;
      const name = str(a.name);
      if (!name) continue;
      achievements.push({ name, unlocked: bool(a.unlocked), starUnlocked: bool(a.starUnlocked) });
    }
  }

  if (isRec(rawAchBadges)) {
    badgesUnlocked = bool(rawAchBadges.badgesUnlocked);
    if (isArr(rawAchBadges.badges)) {
      for (const b of rawAchBadges.badges) {
        if (!isRec(b)) continue;
        const name = str(b.name);
        if (!name) continue;
        badges.push({ name, unlocked: bool(b.unlocked) });
      }
    }
  }

  return { badgesUnlocked, achievements, badges };
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Convert a parsed legacy Kittens Game save object to a SerializedGameState.
 *
 * - Never throws on partial or malformed input; missing sections produce safe defaults.
 * - Renames: manpower→catpower (resource key), nextKittenProgress→kittenProgress,
 *   religion.faith→worship, time.cfu→cfus, time.vsu→vsus.
 * - Discards unsupported fields: weather, biomes, loadouts, queue, corruption,
 *   building automation flags, UI preferences, etc.
 *
 * Port reference: legacy/js/game.js migrateSave() + per-domain save/load methods.
 */
export function migrateLegacySave(legacyJson: unknown): SerializedGameState {
  const save = isRec(legacyJson) ? legacyJson : {};

  // Rename manpower → catpower in resources array before converting
  const rawResources = isArr(save.resources)
    ? save.resources.map((r) => {
        if (isRec(r) && r.name === "manpower") return { ...r, name: "catpower" };
        return r;
      })
    : [];

  // Preserve legacy maxKittens for import parity validation (Story 45-02)
  const legacyMaxKittens = num(
    isRec(save.village) ? (save.village as Record<string, unknown>).maxKittens : 0,
  );

  // Preserve legacy cathPollution for pollution happiness calculation (Epic 45)
  const legacyCathPollution = num(save.cathPollution);

  const importedEffects: Record<string, number> = {};
  if (legacyMaxKittens > 0) importedEffects._legacyMaxKittensImported = legacyMaxKittens;
  if (legacyCathPollution > 0) importedEffects._cathPollution = legacyCathPollution;

  const out: SerializedGameState = {
    version: 1,
    tick: 0,
    effectCache: importedEffects,
    resources: migrateResources(rawResources),
    buildings: migrateBuildings(save.buildings),
    village: migrateVillage(save.village),
    calendar: migrateCalendar(save.calendar),
    science: migrateScience(save.science),
    workshop: migrateWorkshop(save.workshop),
  };

  // Derive unlockable for buildings from researched tech chains.
  // Legacy saved unlockable as runtime-only; the rewrite persists it in state.
  // Port of legacy game.js:5348–5352 (research sets building.unlockable = true).
  for (const techDef of TECH_DEFS) {
    const techEntry = out.science?.techs?.[techDef.name];
    if (!techEntry?.researched) continue;
    for (const bldName of techDef.unlocks?.buildings ?? []) {
      const bldEntry = out.buildings[bldName];
      if (bldEntry && !bldEntry.unlockable) {
        out.buildings[bldName] = { ...bldEntry, unlockable: true };
      }
    }
  }

  // Always include all optional sections so every Manager.load() receives a valid slice
  out.religion = migrateReligion(save.religion);
  out.prestige = migratePrestige(save.prestige);
  out.challenges = migrateChallenges(save.challenges);
  out.space = migrateSpace(save.space);
  out.diplomacy = migrateDiplomacy(save.diplomacy);
  out.time = migrateTime(save.time);
  out.achievements = migrateAchievements(save.achievements, save.ach);

  return out;
}
