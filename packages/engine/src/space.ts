import type { Serializable } from "@kittens/shared";
import { produce } from "immer";
import type { Manager } from "./manager.js";
import type { ResourceState } from "./resources.js";
import type { GameState } from "./state.js";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface PriceEntry {
  readonly name: string;
  readonly val: number;
}

/** Static definition for a space mission program */
export interface ProgramDef {
  readonly name: string;
  readonly prices: readonly PriceEntry[];
  /** What gets unlocked when this program is launched */
  readonly unlocks: {
    readonly planet?: readonly string[];
    readonly spaceMission?: readonly string[];
  };
}

/** Static definition for a space building */
export interface SpaceBuildingDef {
  readonly name: string;
  /** Planet this building belongs to */
  readonly planet: string;
  readonly prices: readonly PriceEntry[];
  readonly priceRatio: number;
  /** Static effects. Uses building.on for scaling (not val). */
  readonly effects: Readonly<Record<string, number>>;
  /** Tech names that must all be researched before this building can be built */
  readonly requiredTech?: readonly string[];
}

/** Static definition for a planet */
export interface PlanetDef {
  readonly name: string;
  /** Travel time in in-game days. 0 = immediately reached on unlock. */
  readonly routeDays: number;
}

// ── Program state ─────────────────────────────────────────────────────────────

export interface ProgramEntry {
  readonly val: number;
  readonly on: number;
  readonly unlocked: boolean;
}

// ── Planet state ──────────────────────────────────────────────────────────────

export interface PlanetEntry {
  readonly unlocked: boolean;
  readonly reached: boolean;
  readonly routeDays: number;
}

// ── Space building state ───────────────────────────────────────────────────────

export interface SpaceBuildingEntry {
  readonly val: number;
  readonly on: number;
  readonly unlocked: boolean;
}

// ── SpaceState ────────────────────────────────────────────────────────────────

export interface SpaceState {
  readonly programs: Record<string, ProgramEntry>;
  readonly planets: Record<string, PlanetEntry>;
  readonly spaceBuildings: Record<string, SpaceBuildingEntry>;
}

// ── Static Definitions ────────────────────────────────────────────────────────

/** Ticks per in-game day (matches CalendarManager) */
const TICKS_PER_DAY = 10;

export const PROGRAM_DEFS: readonly ProgramDef[] = [
  {
    name: "orbitalLaunch",
    prices: [
      { name: "oil", val: 15000 },
      { name: "manpower", val: 5000 },
      { name: "science", val: 100000 },
      { name: "starchart", val: 250 },
    ],
    unlocks: {
      planet: ["cath"],
      spaceMission: ["moonMission"],
    },
  },
  {
    name: "moonMission",
    prices: [
      { name: "titanium", val: 5000 },
      { name: "oil", val: 45000 },
      { name: "science", val: 125000 },
      { name: "starchart", val: 500 },
    ],
    unlocks: {
      planet: ["moon"],
      spaceMission: ["duneMission", "piscineMission"],
    },
  },
  {
    name: "duneMission",
    prices: [
      { name: "titanium", val: 7000 },
      { name: "science", val: 175000 },
      { name: "starchart", val: 1000 },
      { name: "kerosene", val: 75 },
    ],
    unlocks: {
      planet: ["dune"],
      spaceMission: ["heliosMission"],
    },
  },
  {
    name: "piscineMission",
    prices: [
      { name: "titanium", val: 9000 },
      { name: "science", val: 200000 },
      { name: "starchart", val: 1500 },
      { name: "kerosene", val: 250 },
    ],
    unlocks: {
      planet: ["piscine"],
      spaceMission: ["terminusMission"],
    },
  },
  {
    name: "heliosMission",
    prices: [
      { name: "titanium", val: 15000 },
      { name: "science", val: 250000 },
      { name: "starchart", val: 3000 },
      { name: "kerosene", val: 1250 },
    ],
    unlocks: {
      planet: ["helios"],
      spaceMission: ["yarnMission"],
    },
  },
  {
    name: "terminusMission",
    prices: [
      { name: "titanium", val: 12000 },
      { name: "science", val: 225000 },
      { name: "starchart", val: 2500 },
      { name: "kerosene", val: 750 },
    ],
    unlocks: {
      planet: ["terminus"],
      spaceMission: ["heliosMission", "kairoMission"],
    },
  },
  {
    name: "kairoMission",
    prices: [
      { name: "titanium", val: 20000 },
      { name: "science", val: 300000 },
      { name: "starchart", val: 5000 },
      { name: "kerosene", val: 7500 },
    ],
    unlocks: {
      planet: ["kairo"],
      spaceMission: ["rorschachMission"],
    },
  },
  {
    name: "rorschachMission",
    prices: [
      { name: "titanium", val: 80000 },
      { name: "science", val: 500000 },
      { name: "starchart", val: 15000 },
      { name: "kerosene", val: 25000 },
    ],
    unlocks: {
      spaceMission: ["centaurusSystemMission"],
    },
  },
  {
    name: "yarnMission",
    prices: [
      { name: "titanium", val: 35000 },
      { name: "science", val: 350000 },
      { name: "starchart", val: 7500 },
      { name: "kerosene", val: 12000 },
    ],
    unlocks: {
      planet: ["yarn"],
      spaceMission: ["umbraMission"],
    },
  },
  {
    name: "umbraMission",
    prices: [
      { name: "science", val: 500000 },
      { name: "starchart", val: 25000 },
      { name: "kerosene", val: 25000 },
      { name: "thorium", val: 15000 },
    ],
    unlocks: {
      planet: ["umbra"],
      spaceMission: ["charonMission"],
    },
  },
  {
    name: "charonMission",
    prices: [
      { name: "science", val: 750000 },
      { name: "starchart", val: 75000 },
      { name: "kerosene", val: 35000 },
      { name: "thorium", val: 35000 },
    ],
    unlocks: {
      planet: ["charon"],
    },
  },
  {
    name: "centaurusSystemMission",
    prices: [
      { name: "titanium", val: 40000 },
      { name: "science", val: 800000 },
      { name: "starchart", val: 100000 },
      { name: "kerosene", val: 50000 },
      { name: "thorium", val: 50000 },
    ],
    unlocks: {
      planet: ["centaurusSystem"],
      spaceMission: ["furthestRingMission"],
    },
  },
  {
    name: "furthestRingMission",
    prices: [
      { name: "science", val: 1250000 },
      { name: "starchart", val: 500000 },
      { name: "kerosene", val: 75000 },
      { name: "thorium", val: 75000 },
    ],
    unlocks: {
      planet: ["furthestRing"],
    },
  },
];

export const PLANET_DEFS: readonly PlanetDef[] = [
  { name: "cath", routeDays: 0 },
  { name: "moon", routeDays: 30 },
  { name: "dune", routeDays: 356 },
  { name: "piscine", routeDays: 256 },
  { name: "helios", routeDays: 1200 },
  { name: "terminus", routeDays: 2500 },
  { name: "kairo", routeDays: 5000 },
  { name: "yarn", routeDays: 3800 },
  { name: "umbra", routeDays: 7500 },
  { name: "charon", routeDays: 25000 },
  { name: "centaurusSystem", routeDays: 120000 },
  { name: "furthestRing", routeDays: 725000000 },
];

export const SPACE_BUILDING_DEFS: readonly SpaceBuildingDef[] = [
  // ── Cath ─────────────────────────────────────────────────────────────────────
  {
    name: "spaceElevator",
    planet: "cath",
    prices: [
      { name: "titanium", val: 6000 },
      { name: "unobtainium", val: 50 },
      { name: "science", val: 75000 },
    ],
    priceRatio: 1.15,
    effects: { oilReductionRatio: 0.05, spaceRatio: 0.01, prodTransferBonus: 0.001 },
    requiredTech: ["orbitalEngineering", "nanotechnology"],
  },
  {
    name: "sattelite",
    planet: "cath",
    prices: [
      { name: "titanium", val: 2500 },
      { name: "oil", val: 15000 },
      { name: "science", val: 100000 },
      { name: "starchart", val: 325 },
    ],
    priceRatio: 1.08,
    effects: { observatoryRatio: 0.05, starchartPerTickBaseSpace: 0.001, energyConsumption: 1 },
    requiredTech: ["sattelites"],
  },
  {
    name: "spaceStation",
    planet: "cath",
    prices: [
      { name: "oil", val: 35000 },
      { name: "science", val: 150000 },
      { name: "starchart", val: 425 },
      { name: "alloy", val: 750 },
    ],
    priceRatio: 1.12,
    effects: { scienceRatio: 0.5, maxKittens: 2, energyConsumption: 10 },
    requiredTech: ["orbitalEngineering"],
  },
  // ── Moon ─────────────────────────────────────────────────────────────────────
  {
    name: "moonOutpost",
    planet: "moon",
    prices: [
      { name: "oil", val: 55000 },
      { name: "uranium", val: 500 },
      { name: "science", val: 100000 },
      { name: "starchart", val: 650 },
      { name: "concrate", val: 150 },
      { name: "alloy", val: 750 },
    ],
    priceRatio: 1.12,
    effects: { uraniumPerTickCon: -0.35, unobtainiumPerTickSpace: 0.007, energyConsumption: 5 },
  },
  {
    name: "moonBase",
    planet: "moon",
    prices: [
      { name: "titanium", val: 9500 },
      { name: "oil", val: 70000 },
      { name: "unobtainium", val: 50 },
      { name: "science", val: 100000 },
      { name: "starchart", val: 700 },
      { name: "concrate", val: 250 },
    ],
    priceRatio: 1.12,
    effects: {
      catnipMax: 45000,
      woodMax: 25000,
      mineralsMax: 30000,
      coalMax: 3500,
      ironMax: 9000,
      titaniumMax: 1250,
      oilMax: 3500,
      unobtainiumMax: 150,
      energyConsumption: 10,
    },
  },
  // ── Dune ─────────────────────────────────────────────────────────────────────
  {
    name: "planetCracker",
    planet: "dune",
    prices: [
      { name: "science", val: 125000 },
      { name: "starchart", val: 2500 },
      { name: "alloy", val: 1750 },
      { name: "kerosene", val: 50 },
    ],
    priceRatio: 1.18,
    effects: { uraniumPerTickSpace: 0.3, uraniumMax: 1750 },
  },
  {
    name: "hydrofracturer",
    planet: "dune",
    prices: [
      { name: "science", val: 150000 },
      { name: "starchart", val: 750 },
      { name: "alloy", val: 1025 },
      { name: "kerosene", val: 100 },
    ],
    priceRatio: 1.18,
    effects: { oilPerTickAutoprodSpace: 0.5 },
  },
  {
    name: "spiceRefinery",
    planet: "dune",
    prices: [
      { name: "science", val: 75000 },
      { name: "starchart", val: 500 },
      { name: "alloy", val: 500 },
      { name: "kerosene", val: 125 },
    ],
    priceRatio: 1.15,
    effects: { spicePerTickAutoprodSpace: 0.025 },
  },
  // ── Piscine ───────────────────────────────────────────────────────────────────
  {
    name: "researchVessel",
    planet: "piscine",
    prices: [
      { name: "titanium", val: 12500 },
      { name: "starchart", val: 100 },
      { name: "alloy", val: 2500 },
      { name: "kerosene", val: 250 },
    ],
    priceRatio: 1.15,
    effects: { scienceMax: 10000, starchartPerTickBaseSpace: 0.01 },
  },
  {
    name: "orbitalArray",
    planet: "piscine",
    prices: [
      { name: "science", val: 250000 },
      { name: "starchart", val: 2000 },
      { name: "eludium", val: 100 },
      { name: "kerosene", val: 500 },
    ],
    priceRatio: 1.15,
    effects: { spaceRatio: 0.02, energyConsumption: 20 },
  },
  // ── Helios ────────────────────────────────────────────────────────────────────
  {
    name: "sunlifter",
    planet: "helios",
    prices: [
      { name: "science", val: 500000 },
      { name: "eludium", val: 225 },
      { name: "kerosene", val: 2500 },
    ],
    priceRatio: 1.15,
    effects: { antimatterProduction: 1, energyProduction: 30 },
  },
  {
    name: "containmentChamber",
    planet: "helios",
    prices: [
      { name: "science", val: 500000 },
      { name: "kerosene", val: 2500 },
    ],
    priceRatio: 1.125,
    effects: { antimatterMax: 100, energyConsumption: 50 },
  },
  {
    name: "heatsink",
    planet: "helios",
    prices: [
      { name: "science", val: 125000 },
      { name: "relic", val: 1 },
      { name: "kerosene", val: 5000 },
      { name: "thorium", val: 12500 },
    ],
    priceRatio: 1.12,
    effects: {},
  },
  {
    name: "sunforge",
    planet: "helios",
    prices: [
      { name: "antimatter", val: 250 },
      { name: "science", val: 100000 },
      { name: "relic", val: 1 },
      { name: "kerosene", val: 1250 },
    ],
    priceRatio: 1.12,
    effects: { baseMetalMaxRatio: 0.01 },
  },
  // ── Terminus ──────────────────────────────────────────────────────────────────
  {
    name: "cryostation",
    planet: "terminus",
    prices: [
      { name: "science", val: 200000 },
      { name: "concrate", val: 1500 },
      { name: "eludium", val: 25 },
      { name: "kerosene", val: 500 },
    ],
    priceRatio: 1.12,
    effects: {
      woodMax: 200000,
      mineralsMax: 200000,
      coalMax: 25000,
      ironMax: 50000,
      titaniumMax: 7500,
      oilMax: 7500,
      uraniumMax: 5000,
      unobtainiumMax: 750,
    },
  },
  // ── Kairo ─────────────────────────────────────────────────────────────────────
  {
    name: "spaceBeacon",
    planet: "kairo",
    prices: [
      { name: "antimatter", val: 50 },
      { name: "starchart", val: 25000 },
      { name: "alloy", val: 25000 },
      { name: "kerosene", val: 7500 },
    ],
    priceRatio: 1.15,
    effects: { scienceMax: 25000, starchartPerTickBaseSpace: 0.025 },
  },
  // ── Yarn ──────────────────────────────────────────────────────────────────────
  {
    name: "terraformingStation",
    planet: "yarn",
    prices: [
      { name: "uranium", val: 5000 },
      { name: "antimatter", val: 25 },
      { name: "kerosene", val: 5000 },
    ],
    priceRatio: 1.25,
    effects: { maxKittens: 1 },
    requiredTech: ["terraformation"],
  },
  {
    name: "hydroponics",
    planet: "yarn",
    prices: [
      { name: "unobtainium", val: 1 },
      { name: "kerosene", val: 500 },
    ],
    priceRatio: 1.15,
    effects: { catnipRatio: 0.025 },
    requiredTech: ["hydroponics"],
  },
  // ── Umbra ─────────────────────────────────────────────────────────────────────
  {
    name: "hrHarvester",
    planet: "umbra",
    prices: [
      { name: "antimatter", val: 1250 },
      { name: "relic", val: 25 },
    ],
    priceRatio: 1.15,
    effects: { energyProduction: 1 },
  },
  {
    name: "navigationRelay",
    planet: "umbra",
    prices: [
      { name: "titanium", val: 50000 },
      { name: "concrate", val: 5000 },
    ],
    priceRatio: 1.2,
    effects: {},
  },
  {
    name: "spaceShuttle",
    planet: "umbra",
    prices: [
      { name: "antimatter", val: 50 },
      { name: "eludium", val: 500 },
    ],
    priceRatio: 1.15,
    effects: {},
  },
  // ── Charon ────────────────────────────────────────────────────────────────────
  {
    name: "entangler",
    planet: "charon",
    prices: [
      { name: "antimatter", val: 5250 },
      { name: "relic", val: 1250 },
      { name: "eludium", val: 5000 },
    ],
    priceRatio: 1.15,
    effects: { energyConsumption: 25 },
    requiredTech: ["quantumCryptography"],
  },
  // ── Centaurus System ──────────────────────────────────────────────────────────
  {
    name: "tectonic",
    planet: "centaurusSystem",
    prices: [
      { name: "antimatter", val: 500 },
      { name: "thorium", val: 75000 },
    ],
    priceRatio: 1.25,
    effects: { energyProduction: 25 },
    requiredTech: ["terraformation"],
  },
  {
    name: "moltenCore",
    planet: "centaurusSystem",
    prices: [
      { name: "uranium", val: 5000000 },
      { name: "science", val: 25000000 },
    ],
    priceRatio: 1.25,
    effects: { tectonicBonus: 0.05 },
    requiredTech: ["exogeophysics"],
  },
];

// ── Helper: canAfford ──────────────────────────────────────────────────────────

function canAfford(prices: readonly PriceEntry[], resources: ResourceState): boolean {
  for (const price of prices) {
    const entry = resources[price.name];
    if (!entry || entry.value < price.val) return false;
  }
  return true;
}

// ── Helper: getSpaceBuildingPrice ─────────────────────────────────────────────

export function getSpaceBuildingPrice(
  def: SpaceBuildingDef,
  count: number,
): readonly PriceEntry[] {
  return def.prices.map((p) => ({
    name: p.name,
    val: p.val * Math.pow(def.priceRatio, count),
  }));
}

// ── Initial state ─────────────────────────────────────────────────────────────

export function createInitialSpace(): SpaceState {
  const programs: Record<string, ProgramEntry> = {};
  for (const def of PROGRAM_DEFS) {
    programs[def.name] = {
      val: 0,
      on: 0,
      unlocked: def.name === "orbitalLaunch",
    };
  }

  const planets: Record<string, PlanetEntry> = {};
  for (const def of PLANET_DEFS) {
    planets[def.name] = {
      unlocked: false,
      reached: false,
      routeDays: def.routeDays,
    };
  }

  const spaceBuildings: Record<string, SpaceBuildingEntry> = {};
  for (const def of SPACE_BUILDING_DEFS) {
    spaceBuildings[def.name] = {
      val: 0,
      on: 0,
      unlocked: false,
    };
  }

  return { programs, planets, spaceBuildings };
}

// ── Apply mission launch unlocks ──────────────────────────────────────────────

function applyMissionUnlocks(
  programs: Record<string, ProgramEntry>,
  planets: Record<string, PlanetEntry>,
  unlocks: ProgramDef["unlocks"],
): void {
  if (unlocks.planet) {
    for (const pName of unlocks.planet) {
      const planet = planets[pName];
      if (planet) {
        const def = PLANET_DEFS.find((d) => d.name === pName);
        planets[pName] = {
          ...planet,
          unlocked: true,
          // cath has routeDays=0, so it is immediately reached
          reached: planet.reached || (def?.routeDays === 0),
        };
      }
    }
  }
  if (unlocks.spaceMission) {
    for (const mName of unlocks.spaceMission) {
      const prog = programs[mName];
      if (prog) {
        programs[mName] = { ...prog, unlocked: true };
      }
    }
  }
}

// ── Action: LAUNCH_MISSION ────────────────────────────────────────────────────

export function applyLaunchMission(state: GameState, name: string): GameState {
  const def = PROGRAM_DEFS.find((p) => p.name === name);
  if (!def) return state;

  const program = state.space.programs[name];
  if (!program) return state;

  // Mission must be unlocked and not yet completed (on=1 means done)
  if (!program.unlocked || program.on >= 1) return state;

  const prices = def.prices;
  if (!canAfford(prices, state.resources)) return state;

  return produce(state, (draft) => {
    // Deduct resources
    for (const price of prices) {
      const entry = draft.resources[price.name];
      if (entry) {
        entry.value -= price.val;
      }
    }

    // Apply unlocks first (so we can check if planet is immediately reached)
    applyMissionUnlocks(draft.space.programs, draft.space.planets, def.unlocks);

    // Mark mission as launched
    const prog = draft.space.programs[name];
    if (prog) {
      prog.val = 1;
      // on=1 if: no planet to reach, OR the first planet it unlocks is already reached
      const firstPlanet =
        def.unlocks.planet && def.unlocks.planet.length > 0 ? def.unlocks.planet[0] : undefined;
      if (!firstPlanet) {
        prog.on = 1;
      } else {
        const planet = draft.space.planets[firstPlanet];
        if (planet?.reached) {
          prog.on = 1;
        }
      }
    }
  });
}

// ── Action: BUY_SPACE_BUILDING ────────────────────────────────────────────────

export function applyBuySpaceBuilding(state: GameState, name: string): GameState {
  const def = SPACE_BUILDING_DEFS.find((b) => b.name === name);
  if (!def) return state;

  const building = state.space.spaceBuildings[name];
  if (!building) return state;
  if (!building.unlocked) return state;

  // Planet must be reached
  const planet = state.space.planets[def.planet];
  if (!planet?.reached) return state;

  const prices = getSpaceBuildingPrice(def, building.val);
  if (!canAfford(prices, state.resources)) return state;

  return produce(state, (draft) => {
    // Deduct resources
    for (const price of prices) {
      const entry = draft.resources[price.name];
      if (entry) {
        entry.value -= price.val;
      }
    }

    // Increment building
    const b = draft.space.spaceBuildings[name];
    if (b) {
      b.val += 1;
      b.on += 1;
    }
  });
}

// ── SpaceManager ──────────────────────────────────────────────────────────────

export class SpaceManager implements Manager {
  update(state: GameState): GameState {
    return produce(state, (draft) => {
      // 1. Advance planet route travel
      for (const planetDef of PLANET_DEFS) {
        const planet = draft.space.planets[planetDef.name];
        if (!planet || !planet.unlocked || planet.reached) continue;

        if (planet.routeDays > 0) {
          planet.routeDays = Math.max(0, planet.routeDays - 1 / TICKS_PER_DAY);
        }

        if (planet.routeDays <= 0) {
          planet.routeDays = 0;
          planet.reached = true;

          // Mark any program that unlocks this planet as on=1
          for (const progDef of PROGRAM_DEFS) {
            if (progDef.unlocks.planet?.includes(planetDef.name)) {
              const prog = draft.space.programs[progDef.name];
              if (prog && prog.val > 0) {
                prog.on = 1;
              }
            }
          }
        }
      }

      // 2. Unlock buildings when planet is reached
      for (const bldDef of SPACE_BUILDING_DEFS) {
        const planet = draft.space.planets[bldDef.planet];
        if (!planet?.reached) continue;

        const bld = draft.space.spaceBuildings[bldDef.name];
        if (!bld || bld.unlocked) continue;

        if (!bldDef.requiredTech || bldDef.requiredTech.length === 0) {
          bld.unlocked = true;
        } else {
          // Check all required techs are researched
          const allResearched = bldDef.requiredTech.every((techName) => {
            const tech = draft.science.techs[techName];
            return tech?.researched === true;
          });
          if (allResearched) {
            bld.unlocked = true;
          }
        }
      }
    });
  }

  updateEffects(state: GameState): Record<string, number> {
    const effects: Record<string, number> = {};

    for (const def of SPACE_BUILDING_DEFS) {
      const bld = state.space.spaceBuildings[def.name];
      if (!bld || bld.on === 0) continue;

      for (const [key, baseVal] of Object.entries(def.effects)) {
        effects[key] = (effects[key] ?? 0) + baseVal * bld.on;
      }
    }

    return effects;
  }

  resetState(state: GameState): GameState {
    return produce(state, (draft) => {
      draft.space = createInitialSpace();
    });
  }

  save(state: GameState): Serializable {
    const programs: Record<string, { val: number; on: number; unlocked: boolean }> = {};
    for (const [name, entry] of Object.entries(state.space.programs)) {
      programs[name] = { val: entry.val, on: entry.on, unlocked: entry.unlocked };
    }

    const planets: Record<string, { unlocked: boolean; reached: boolean; routeDays: number }> = {};
    for (const [name, entry] of Object.entries(state.space.planets)) {
      planets[name] = {
        unlocked: entry.unlocked,
        reached: entry.reached,
        routeDays: entry.routeDays,
      };
    }

    const spaceBuildings: Record<string, { val: number; on: number; unlocked: boolean }> = {};
    for (const [name, entry] of Object.entries(state.space.spaceBuildings)) {
      spaceBuildings[name] = { val: entry.val, on: entry.on, unlocked: entry.unlocked };
    }

    return { programs, planets, spaceBuildings };
  }

  load(saved: Serializable, state: GameState): GameState {
    const data = saved as {
      programs?: Record<string, { val?: number; on?: number; unlocked?: boolean }>;
      planets?: Record<string, { unlocked?: boolean; reached?: boolean; routeDays?: number }>;
      spaceBuildings?: Record<string, { val?: number; on?: number; unlocked?: boolean }>;
    };

    return produce(state, (draft) => {
      // Reset first
      draft.space = createInitialSpace();

      // Restore programs (raw values first, then replay unlock chains)
      const savedPrograms = data.programs ?? {};
      for (const [name, entry] of Object.entries(savedPrograms)) {
        const prog = draft.space.programs[name];
        if (prog && entry && typeof entry === "object") {
          if (typeof entry.val === "number") prog.val = entry.val;
          if (typeof entry.on === "number") prog.on = entry.on;
          if (typeof entry.unlocked === "boolean") prog.unlocked = entry.unlocked;
        }
      }

      // Replay unlock chains from all completed missions (val > 0)
      // This ensures missions unlocked by completed programs are correctly unlocked
      for (const [name, prog] of Object.entries(draft.space.programs)) {
        if (prog.val > 0) {
          const def = PROGRAM_DEFS.find((d) => d.name === name);
          if (def) {
            applyMissionUnlocks(draft.space.programs, draft.space.planets, def.unlocks);
          }
        }
      }

      // Restore planets (override unlocks that were just set, to get exact saved state)
      const savedPlanets = data.planets ?? {};
      for (const [name, entry] of Object.entries(savedPlanets)) {
        const planet = draft.space.planets[name];
        if (planet && entry && typeof entry === "object") {
          if (typeof entry.unlocked === "boolean") planet.unlocked = entry.unlocked;
          if (typeof entry.reached === "boolean") planet.reached = entry.reached;
          if (typeof entry.routeDays === "number") planet.routeDays = entry.routeDays;
        }
      }

      // Restore space buildings
      const savedBuildings = data.spaceBuildings ?? {};
      for (const [name, entry] of Object.entries(savedBuildings)) {
        const bld = draft.space.spaceBuildings[name];
        if (bld && entry && typeof entry === "object") {
          if (typeof entry.val === "number") bld.val = entry.val;
          if (typeof entry.on === "number") bld.on = entry.on;
          if (typeof entry.unlocked === "boolean") bld.unlocked = entry.unlocked;
        }
      }
    });
  }
}
