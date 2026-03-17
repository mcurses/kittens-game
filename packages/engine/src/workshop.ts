import type { Serializable } from "@kittens/shared";
import type { PriceEntry } from "./buildings.js";
import { canAfford } from "./buildings.js";
import type { Manager } from "./manager.js";
import type { GameState } from "./state.js";

// ── UpgradeDef ────────────────────────────────────────────────────────────────

export interface UpgradeUnlocks {
  readonly upgrades?: readonly string[];
}

export interface UpgradeDef {
  readonly name: string;
  readonly prices: readonly PriceEntry[];
  readonly effects?: Readonly<Record<string, number>>;
  readonly unlocks?: UpgradeUnlocks;
}

export interface UpgradeEntry {
  readonly unlocked: boolean;
  readonly researched: boolean;
}

// ── CraftDef ──────────────────────────────────────────────────────────────────

export interface CraftDef {
  readonly name: string;
  readonly prices: readonly PriceEntry[];
  readonly tier: number;
  readonly ignoreBonuses: boolean;
}

export interface CraftEntry {
  readonly unlocked: boolean;
}

// ── WorkshopState ─────────────────────────────────────────────────────────────

export interface WorkshopState {
  readonly upgrades: Record<string, UpgradeEntry>;
  readonly crafts: Record<string, CraftEntry>;
}

// ── UPGRADE_DEFS ──────────────────────────────────────────────────────────────

export const UPGRADE_DEFS: readonly UpgradeDef[] = [
  // ─── food upgrades ───
  {
    name: "mineralHoes",
    effects: { catnipJobRatio: 0.5 },
    prices: [
      { name: "minerals", val: 275 },
      { name: "science", val: 100 },
    ],
    unlocks: { upgrades: ["ironHoes"] },
  },
  {
    name: "ironHoes",
    effects: { catnipJobRatio: 0.3 },
    prices: [
      { name: "iron", val: 25 },
      { name: "science", val: 200 },
    ],
  },
  // ─── wood upgrades ───
  {
    name: "mineralAxes",
    effects: { woodJobRatio: 0.7 },
    prices: [
      { name: "minerals", val: 500 },
      { name: "science", val: 100 },
    ],
    unlocks: { upgrades: ["ironAxes"] },
  },
  {
    name: "ironAxes",
    effects: { woodJobRatio: 0.5 },
    prices: [
      { name: "iron", val: 50 },
      { name: "science", val: 200 },
    ],
  },
  {
    name: "steelAxe",
    effects: { woodJobRatio: 0.5 },
    prices: [
      { name: "science", val: 20000 },
      { name: "steel", val: 75 },
    ],
  },
  {
    name: "reinforcedSaw",
    effects: { lumberMillRatio: 0.2 },
    prices: [
      { name: "iron", val: 1000 },
      { name: "science", val: 2500 },
    ],
  },
  {
    name: "steelSaw",
    effects: { lumberMillRatio: 0.2 },
    prices: [
      { name: "science", val: 52000 },
      { name: "steel", val: 750 },
    ],
    unlocks: { upgrades: ["titaniumSaw"] },
  },
  {
    name: "titaniumSaw",
    effects: { lumberMillRatio: 0.15 },
    prices: [
      { name: "titanium", val: 500 },
      { name: "science", val: 70000 },
    ],
    unlocks: { upgrades: ["alloySaw"] },
  },
  {
    name: "alloySaw",
    effects: { lumberMillRatio: 0.15 },
    prices: [
      { name: "science", val: 85000 },
      { name: "alloy", val: 75 },
    ],
  },
  {
    name: "titaniumAxe",
    effects: { woodJobRatio: 0.5 },
    prices: [
      { name: "titanium", val: 10 },
      { name: "science", val: 38000 },
    ],
  },
  {
    name: "alloyAxe",
    effects: { woodJobRatio: 0.5 },
    prices: [
      { name: "science", val: 70000 },
      { name: "alloy", val: 25 },
    ],
  },
  // ─── unobtainium ───
  {
    name: "unobtainiumAxe",
    effects: { woodJobRatio: 0.5 },
    prices: [
      { name: "unobtainium", val: 75 },
      { name: "science", val: 125000 },
    ],
  },
  {
    name: "unobtainiumSaw",
    effects: { lumberMillRatio: 0.25 },
    prices: [
      { name: "unobtainium", val: 125 },
      { name: "science", val: 145000 },
    ],
  },
  // ─── storage upgrades ───
  {
    name: "stoneBarns",
    effects: { barnRatio: 0.75 },
    prices: [
      { name: "wood", val: 1000 },
      { name: "minerals", val: 750 },
      { name: "iron", val: 50 },
      { name: "science", val: 500 },
    ],
  },
  {
    name: "reinforcedBarns",
    effects: { barnRatio: 0.8 },
    prices: [
      { name: "iron", val: 100 },
      { name: "science", val: 800 },
      { name: "beam", val: 25 },
      { name: "slab", val: 10 },
    ],
    unlocks: { upgrades: ["titaniumBarns"] },
  },
  {
    name: "reinforcedWarehouses",
    effects: { warehouseRatio: 0.25 },
    prices: [
      { name: "science", val: 15000 },
      { name: "plate", val: 50 },
      { name: "steel", val: 50 },
      { name: "scaffold", val: 25 },
    ],
    unlocks: { upgrades: ["ironwood"] },
  },
  {
    name: "titaniumBarns",
    effects: { barnRatio: 1 },
    prices: [
      { name: "titanium", val: 25 },
      { name: "science", val: 60000 },
      { name: "steel", val: 200 },
      { name: "scaffold", val: 250 },
    ],
  },
  {
    name: "alloyBarns",
    effects: { barnRatio: 1 },
    prices: [
      { name: "science", val: 75000 },
      { name: "plate", val: 750 },
      { name: "alloy", val: 20 },
    ],
  },
  {
    name: "concreteBarns",
    effects: { barnRatio: 0.75 },
    prices: [
      { name: "titanium", val: 2000 },
      { name: "science", val: 100000 },
      { name: "concrate", val: 45 },
    ],
  },
  {
    name: "titaniumWarehouses",
    effects: { warehouseRatio: 0.5 },
    prices: [
      { name: "titanium", val: 50 },
      { name: "science", val: 70000 },
      { name: "steel", val: 500 },
      { name: "scaffold", val: 500 },
    ],
  },
  {
    name: "alloyWarehouses",
    effects: { warehouseRatio: 0.45 },
    prices: [
      { name: "titanium", val: 750 },
      { name: "science", val: 90000 },
      { name: "alloy", val: 50 },
    ],
  },
  {
    name: "concreteWarehouses",
    effects: { warehouseRatio: 0.35 },
    prices: [
      { name: "titanium", val: 1250 },
      { name: "science", val: 100000 },
      { name: "concrate", val: 35 },
    ],
  },
  {
    name: "storageBunkers",
    effects: { warehouseRatio: 0.2 },
    prices: [
      { name: "unobtainium", val: 500 },
      { name: "science", val: 25000 },
      { name: "concrate", val: 1250 },
    ],
  },
  // ─── accelerators ───
  {
    name: "energyRifts",
    effects: {},
    prices: [
      { name: "titanium", val: 7500 },
      { name: "uranium", val: 250 },
      { name: "science", val: 200000 },
    ],
  },
  {
    name: "stasisChambers",
    effects: { acceleratorRatio: 0.95 },
    prices: [
      { name: "uranium", val: 2000 },
      { name: "science", val: 235000 },
      { name: "timeCrystal", val: 1 },
      { name: "alloy", val: 200 },
    ],
    unlocks: { upgrades: ["voidEnergy"] },
  },
  {
    name: "voidEnergy",
    effects: { acceleratorRatio: 0.75 },
    prices: [
      { name: "uranium", val: 2500 },
      { name: "science", val: 275000 },
      { name: "timeCrystal", val: 2 },
      { name: "alloy", val: 250 },
    ],
    unlocks: { upgrades: ["darkEnergy"] },
  },
  {
    name: "darkEnergy",
    effects: { acceleratorRatio: 2.5 },
    prices: [
      { name: "science", val: 350000 },
      { name: "timeCrystal", val: 3 },
      { name: "eludium", val: 75 },
    ],
  },
  {
    name: "chronoforge",
    effects: {},
    prices: [
      { name: "science", val: 500000 },
      { name: "timeCrystal", val: 10 },
      { name: "relic", val: 5 },
    ],
  },
  {
    name: "tachyonModerator",
    effects: {},
    prices: [
      { name: "science", val: 16000 },
      { name: "gear", val: 500 },
      { name: "titanium", val: 250 },
    ],
  },
  {
    name: "tachyonAccelerators",
    effects: { acceleratorRatio: 5 },
    prices: [
      { name: "science", val: 500000 },
      { name: "timeCrystal", val: 10 },
      { name: "eludium", val: 125 },
    ],
  },
  {
    name: "fluxCondensator",
    effects: {},
    prices: [
      { name: "unobtainium", val: 5000 },
      { name: "timeCrystal", val: 5 },
      { name: "alloy", val: 250 },
    ],
  },
  {
    name: "lhc",
    effects: {},
    prices: [
      { name: "unobtainium", val: 100 },
      { name: "science", val: 250000 },
      { name: "alloy", val: 150 },
    ],
  },
  // ─── energy stuff ───
  {
    name: "photovoltaic",
    effects: { solarFarmRatio: 0.5 },
    prices: [
      { name: "titanium", val: 5000 },
      { name: "science", val: 75000 },
    ],
  },
  {
    name: "thinFilm",
    effects: { solarFarmSeasonRatio: 1 },
    prices: [
      { name: "uranium", val: 1000 },
      { name: "unobtainium", val: 200 },
      { name: "science", val: 125000 },
    ],
  },
  {
    name: "qdot",
    effects: { solarFarmSeasonRatio: 1 },
    prices: [
      { name: "science", val: 175000 },
      { name: "eludium", val: 200 },
      { name: "thorium", val: 1000 },
    ],
  },
  {
    name: "solarSatellites",
    effects: {},
    prices: [
      { name: "science", val: 225000 },
      { name: "alloy", val: 750 },
    ],
  },
  // ─── harbour stuff ───
  {
    name: "cargoShips",
    effects: { harborRatio: 0.01 },
    prices: [
      { name: "science", val: 55000 },
      { name: "blueprint", val: 15 },
    ],
  },
  {
    name: "barges",
    effects: { harborCoalRatio: 0.5 },
    prices: [
      { name: "titanium", val: 1500 },
      { name: "science", val: 100000 },
      { name: "blueprint", val: 30 },
    ],
  },
  {
    name: "reactorVessel",
    effects: { shipLimit: 0.05 },
    prices: [
      { name: "titanium", val: 5000 },
      { name: "uranium", val: 125 },
      { name: "science", val: 135000 },
    ],
  },
  {
    name: "ironwood",
    effects: { hutPriceRatio: -0.5 },
    prices: [
      { name: "wood", val: 15000 },
      { name: "iron", val: 3000 },
      { name: "science", val: 30000 },
    ],
    unlocks: { upgrades: ["silos"] },
  },
  {
    name: "concreteHuts",
    effects: { hutPriceRatio: -0.3 },
    prices: [
      { name: "titanium", val: 3000 },
      { name: "science", val: 125000 },
      { name: "concrate", val: 45 },
    ],
  },
  {
    name: "unobtainiumHuts",
    effects: { hutPriceRatio: -0.25 },
    prices: [
      { name: "titanium", val: 15000 },
      { name: "unobtainium", val: 350 },
      { name: "science", val: 200000 },
    ],
  },
  {
    name: "eludiumHuts",
    effects: { hutPriceRatio: -0.1 },
    prices: [
      { name: "science", val: 275000 },
      { name: "eludium", val: 125 },
    ],
  },
  {
    name: "silos",
    effects: {},
    prices: [
      { name: "science", val: 50000 },
      { name: "steel", val: 125 },
      { name: "blueprint", val: 5 },
    ],
    unlocks: { upgrades: ["titaniumWarehouses"] },
  },
  {
    name: "refrigeration",
    effects: { catnipMaxRatio: 0.75 },
    prices: [
      { name: "titanium", val: 2500 },
      { name: "science", val: 125000 },
      { name: "blueprint", val: 15 },
    ],
  },
  // ─── hunt upgrades ───
  {
    name: "compositeBow",
    effects: { manpowerJobRatio: 0.5 },
    prices: [
      { name: "wood", val: 200 },
      { name: "iron", val: 100 },
      { name: "science", val: 500 },
    ],
  },
  {
    name: "crossbow",
    effects: { manpowerJobRatio: 0.25 },
    prices: [
      { name: "iron", val: 1500 },
      { name: "science", val: 12000 },
    ],
  },
  {
    name: "railgun",
    effects: { manpowerJobRatio: 0.25 },
    prices: [
      { name: "titanium", val: 5000 },
      { name: "science", val: 150000 },
      { name: "blueprint", val: 25 },
    ],
  },
  {
    name: "bolas",
    effects: { hunterRatio: 1 },
    prices: [
      { name: "wood", val: 50 },
      { name: "minerals", val: 250 },
      { name: "science", val: 1000 },
    ],
  },
  {
    name: "huntingArmor",
    effects: { hunterRatio: 2 },
    prices: [
      { name: "iron", val: 750 },
      { name: "science", val: 2000 },
    ],
  },
  {
    name: "steelArmor",
    effects: { hunterRatio: 0.5 },
    prices: [
      { name: "science", val: 10000 },
      { name: "steel", val: 50 },
    ],
  },
  {
    name: "alloyArmor",
    effects: { hunterRatio: 0.5 },
    prices: [
      { name: "science", val: 50000 },
      { name: "alloy", val: 25 },
    ],
  },
  {
    name: "nanosuits",
    effects: { hunterRatio: 0.5 },
    prices: [
      { name: "science", val: 185000 },
      { name: "alloy", val: 250 },
    ],
  },
  {
    name: "caravanserai",
    effects: {},
    prices: [
      { name: "gold", val: 250 },
      { name: "science", val: 25000 },
      { name: "ivory", val: 10000 },
    ],
  },
  // ─── misc ───
  {
    name: "advancedRefinement",
    effects: {},
    prices: [
      { name: "catnip", val: 5000 },
      { name: "science", val: 500 },
    ],
  },
  {
    name: "goldOre",
    effects: {},
    prices: [
      { name: "minerals", val: 800 },
      { name: "iron", val: 100 },
      { name: "science", val: 1000 },
    ],
  },
  {
    name: "geodesy",
    effects: {},
    prices: [
      { name: "titanium", val: 250 },
      { name: "science", val: 90000 },
      { name: "starchart", val: 500 },
    ],
  },
  {
    name: "register",
    effects: {},
    prices: [
      { name: "gold", val: 10 },
      { name: "science", val: 500 },
    ],
  },
  {
    name: "strenghtenBuild",
    effects: { barnRatio: 0.05, warehouseRatio: 0.05 },
    prices: [
      { name: "science", val: 100000 },
      { name: "concrate", val: 50 },
    ],
    unlocks: { upgrades: ["concreteWarehouses", "concreteBarns", "concreteHuts"] },
  },
  {
    name: "miningDrill",
    effects: {},
    prices: [
      { name: "titanium", val: 1750 },
      { name: "science", val: 100000 },
      { name: "steel", val: 750 },
    ],
  },
  {
    name: "unobtainiumDrill",
    effects: {},
    prices: [
      { name: "unobtainium", val: 250 },
      { name: "science", val: 250000 },
      { name: "alloy", val: 1250 },
    ],
  },
  // ─── coal upgrades ───
  {
    name: "coalFurnace",
    effects: {},
    prices: [
      { name: "minerals", val: 5000 },
      { name: "iron", val: 2000 },
      { name: "science", val: 5000 },
      { name: "beam", val: 35 },
    ],
  },
  {
    name: "deepMining",
    effects: {},
    prices: [
      { name: "iron", val: 1200 },
      { name: "science", val: 5000 },
      { name: "beam", val: 50 },
    ],
  },
  {
    name: "pyrolysis",
    effects: { coalSuperRatio: 0.2 },
    prices: [
      { name: "science", val: 35000 },
      { name: "compedium", val: 5 },
    ],
  },
  {
    name: "electrolyticSmelting",
    effects: { smelterRatio: 0.95 },
    prices: [
      { name: "titanium", val: 2000 },
      { name: "science", val: 100000 },
    ],
  },
  {
    name: "oxidation",
    effects: { calcinerRatio: 0.95 },
    prices: [
      { name: "science", val: 100000 },
      { name: "steel", val: 5000 },
    ],
  },
  {
    name: "steelPlants",
    effects: { calcinerSteelRatio: 0.1 },
    prices: [
      { name: "titanium", val: 3500 },
      { name: "science", val: 140000 },
      { name: "gear", val: 750 },
    ],
    unlocks: { upgrades: ["automatedPlants"] },
  },
  {
    name: "automatedPlants",
    effects: { calcinerSteelCraftRatio: 0.25 },
    prices: [
      { name: "science", val: 200000 },
      { name: "alloy", val: 750 },
    ],
    unlocks: { upgrades: ["nuclearPlants"] },
  },
  {
    name: "nuclearPlants",
    effects: { calcinerSteelReactorBonus: 0.02 },
    prices: [
      { name: "uranium", val: 10000 },
      { name: "science", val: 250000 },
    ],
  },
  {
    name: "rotaryKiln",
    effects: { calcinerRatio: 0.75 },
    prices: [
      { name: "titanium", val: 5000 },
      { name: "science", val: 145000 },
      { name: "gear", val: 500 },
    ],
  },
  {
    name: "fluidizedReactors",
    effects: { calcinerRatio: 1 },
    prices: [
      { name: "science", val: 175000 },
      { name: "alloy", val: 200 },
    ],
  },
  {
    name: "nuclearSmelters",
    effects: {},
    prices: [
      { name: "uranium", val: 250 },
      { name: "science", val: 165000 },
    ],
  },
  {
    name: "orbitalGeodesy",
    effects: {},
    prices: [
      { name: "oil", val: 35000 },
      { name: "science", val: 150000 },
      { name: "alloy", val: 1000 },
    ],
  },
  // ─── automation upgrades ───
  {
    name: "printingPress",
    effects: {},
    prices: [
      { name: "science", val: 7500 },
      { name: "gear", val: 45 },
    ],
  },
  {
    name: "offsetPress",
    effects: {},
    prices: [
      { name: "oil", val: 15000 },
      { name: "science", val: 100000 },
      { name: "gear", val: 250 },
    ],
  },
  {
    name: "photolithography",
    effects: {},
    prices: [
      { name: "oil", val: 50000 },
      { name: "uranium", val: 250 },
      { name: "science", val: 250000 },
      { name: "alloy", val: 1250 },
    ],
  },
  {
    name: "uplink",
    effects: { uplinkDCRatio: 0.01, uplinkLabRatio: 0.01 },
    prices: [
      { name: "science", val: 75000 },
      { name: "alloy", val: 1750 },
    ],
  },
  {
    name: "starlink",
    effects: { uplinkLabRatio: 0.01 },
    prices: [
      { name: "oil", val: 25000 },
      { name: "science", val: 175000 },
      { name: "alloy", val: 5000 },
    ],
  },
  {
    name: "cryocomputing",
    effects: {},
    prices: [
      { name: "science", val: 125000 },
      { name: "eludium", val: 15 },
    ],
  },
  {
    name: "machineLearning",
    effects: { dataCenterAIRatio: 0.1 },
    prices: [
      { name: "antimatter", val: 125 },
      { name: "science", val: 175000 },
      { name: "eludium", val: 25 },
    ],
  },
  {
    name: "factoryAutomation",
    effects: {},
    prices: [
      { name: "science", val: 10000 },
      { name: "gear", val: 25 },
    ],
  },
  {
    name: "advancedAutomation",
    effects: {},
    prices: [
      { name: "science", val: 100000 },
      { name: "gear", val: 75 },
      { name: "blueprint", val: 25 },
    ],
  },
  {
    name: "pneumaticPress",
    effects: {},
    prices: [
      { name: "science", val: 20000 },
      { name: "gear", val: 30 },
      { name: "blueprint", val: 5 },
    ],
  },
  {
    name: "combustionEngine",
    effects: { coalRatioGlobalReduction: 0.2 },
    prices: [
      { name: "science", val: 20000 },
      { name: "gear", val: 25 },
      { name: "blueprint", val: 5 },
    ],
  },
  {
    name: "fuelInjectors",
    effects: { coalRatioGlobalReduction: 0.2 },
    prices: [
      { name: "oil", val: 20000 },
      { name: "science", val: 100000 },
      { name: "gear", val: 250 },
    ],
  },
  {
    name: "factoryLogistics",
    effects: {},
    prices: [
      { name: "titanium", val: 2000 },
      { name: "science", val: 100000 },
      { name: "gear", val: 250 },
    ],
  },
  {
    name: "carbonSequestration",
    effects: {},
    prices: [
      { name: "titanium", val: 1250 },
      { name: "science", val: 75000 },
      { name: "gear", val: 125 },
      { name: "steel", val: 4000 },
      { name: "alloy", val: 1000 },
    ],
  },
  {
    name: "factoryOptimization",
    effects: { t1CraftRatio: 10, t2CraftRatio: 2, queueCap: 1 },
    prices: [
      { name: "titanium", val: 1250 },
      { name: "science", val: 75000 },
      { name: "gear", val: 125 },
    ],
  },
  {
    name: "factoryRobotics",
    effects: { t1CraftRatio: 10, t2CraftRatio: 5, t3CraftRatio: 2, queueCap: 2 },
    prices: [
      { name: "titanium", val: 2500 },
      { name: "science", val: 100000 },
      { name: "gear", val: 250 },
    ],
  },
  {
    name: "spaceEngineers",
    effects: { t1CraftRatio: 10, t2CraftRatio: 5, t3CraftRatio: 2, t4CraftRatio: 2, queueCap: 2 },
    prices: [
      { name: "science", val: 225000 },
      { name: "alloy", val: 500 },
    ],
  },
  {
    name: "aiEngineers",
    effects: {
      t1CraftRatio: 10,
      t2CraftRatio: 5,
      t3CraftRatio: 5,
      t4CraftRatio: 2,
      t5CraftRatio: 2,
      queueCap: 3,
    },
    prices: [
      { name: "antimatter", val: 500 },
      { name: "science", val: 35000 },
      { name: "eludium", val: 50 },
    ],
  },
  {
    name: "chronoEngineers",
    effects: {
      t1CraftRatio: 10,
      t2CraftRatio: 5,
      t3CraftRatio: 2,
      t4CraftRatio: 2,
      t5CraftRatio: 2,
      queueCap: 3,
    },
    prices: [
      { name: "science", val: 500000 },
      { name: "timeCrystal", val: 5 },
      { name: "eludium", val: 100 },
    ],
  },
  {
    name: "spaceManufacturing",
    effects: {},
    prices: [
      { name: "titanium", val: 125000 },
      { name: "science", val: 250000 },
    ],
  },
  // ─── science upgrades ───
  {
    name: "celestialMechanics",
    effects: {},
    prices: [{ name: "science", val: 250 }],
  },
  {
    name: "astrolabe",
    effects: {},
    prices: [
      { name: "titanium", val: 5 },
      { name: "science", val: 25000 },
      { name: "starchart", val: 75 },
    ],
  },
  {
    name: "titaniumMirrors",
    effects: { libraryRatio: 0.02 },
    prices: [
      { name: "titanium", val: 15 },
      { name: "science", val: 20000 },
      { name: "starchart", val: 20 },
    ],
  },
  {
    name: "unobtainiumReflectors",
    effects: { libraryRatio: 0.02 },
    prices: [
      { name: "unobtainium", val: 75 },
      { name: "science", val: 250000 },
      { name: "starchart", val: 750 },
    ],
  },
  {
    name: "eludiumReflectors",
    effects: { libraryRatio: 0.02 },
    prices: [
      { name: "science", val: 250000 },
      { name: "eludium", val: 15 },
    ],
  },
  {
    name: "hydroPlantTurbines",
    effects: { hydroPlantRatio: 0.15 },
    prices: [
      { name: "unobtainium", val: 125 },
      { name: "science", val: 250000 },
    ],
  },
  // ─── antimatter / space ───
  {
    name: "amBases",
    effects: {},
    prices: [
      { name: "antimatter", val: 250 },
      { name: "eludium", val: 15 },
    ],
    unlocks: { upgrades: ["aiBases"] },
  },
  {
    name: "aiBases",
    effects: {},
    prices: [
      { name: "antimatter", val: 7500 },
      { name: "science", val: 750000 },
    ],
  },
  {
    name: "amFission",
    effects: { eludiumAutomationBonus: 0.25 },
    prices: [
      { name: "antimatter", val: 175 },
      { name: "science", val: 525000 },
      { name: "thorium", val: 7500 },
    ],
  },
  {
    name: "amReactors",
    effects: { spaceScienceRatio: 0.95 },
    prices: [
      { name: "antimatter", val: 750 },
      { name: "eludium", val: 35 },
    ],
    unlocks: { upgrades: ["amReactorsMK2"] },
  },
  {
    name: "amReactorsMK2",
    effects: { spaceScienceRatio: 1.5 },
    prices: [
      { name: "antimatter", val: 1750 },
      { name: "eludium", val: 70 },
    ],
    unlocks: { upgrades: ["voidReactors"] },
  },
  {
    name: "voidReactors",
    effects: { spaceScienceRatio: 4 },
    prices: [
      { name: "antimatter", val: 2500 },
      { name: "void", val: 250 },
    ],
  },
  {
    name: "relicStation",
    effects: { beaconRelicsPerDay: 0.01 },
    prices: [
      { name: "antimatter", val: 5000 },
      { name: "eludium", val: 100 },
    ],
  },
  {
    name: "amDrive",
    effects: { routeSpeed: 25 },
    prices: [
      { name: "antimatter", val: 125 },
      { name: "science", val: 450000 },
    ],
  },
  // ─── oil ───
  {
    name: "pumpjack",
    effects: { oilWellRatio: 0.45 },
    prices: [
      { name: "titanium", val: 250 },
      { name: "science", val: 100000 },
      { name: "gear", val: 125 },
    ],
  },
  {
    name: "biofuel",
    effects: {},
    prices: [
      { name: "titanium", val: 1250 },
      { name: "science", val: 150000 },
    ],
  },
  {
    name: "unicornSelection",
    effects: { unicornsGlobalRatio: 0.25, unicornsMaxRatio: 0 },
    prices: [
      { name: "titanium", val: 1500 },
      { name: "science", val: 175000 },
    ],
  },
  {
    name: "gmo",
    effects: { biofuelRatio: 0.6 },
    prices: [
      { name: "catnip", val: 1000000 },
      { name: "titanium", val: 1500 },
      { name: "science", val: 175000 },
    ],
  },
  // ─── blueprints ───
  {
    name: "cadSystems",
    effects: { cadBlueprintCraftRatio: 0.01 },
    prices: [
      { name: "titanium", val: 750 },
      { name: "science", val: 125000 },
    ],
  },
  {
    name: "seti",
    effects: {},
    prices: [
      { name: "titanium", val: 250 },
      { name: "science", val: 125000 },
    ],
  },
  {
    name: "logistics",
    effects: { skillMultiplier: 0.15 },
    prices: [
      { name: "science", val: 100000 },
      { name: "gear", val: 100 },
      { name: "scaffold", val: 1000 },
    ],
  },
  {
    name: "augumentation",
    effects: { skillMultiplier: 1 },
    prices: [
      { name: "titanium", val: 5000 },
      { name: "uranium", val: 50 },
      { name: "science", val: 150000 },
    ],
  },
  {
    name: "internet",
    effects: {},
    prices: [
      { name: "titanium", val: 5000 },
      { name: "uranium", val: 50 },
      { name: "science", val: 150000 },
    ],
  },
  {
    name: "neuralNetworks",
    effects: {},
    prices: [
      { name: "titanium", val: 7500 },
      { name: "science", val: 200000 },
    ],
  },
  {
    name: "assistance",
    effects: { catnipDemandWorkerRatioGlobal: -0.25 },
    prices: [
      { name: "science", val: 100000 },
      { name: "steel", val: 10000 },
      { name: "gear", val: 250 },
    ],
  },
  {
    name: "enrichedUranium",
    effects: { uraniumRatio: 0.25 },
    prices: [
      { name: "titanium", val: 7500 },
      { name: "uranium", val: 150 },
      { name: "science", val: 175000 },
    ],
  },
  {
    name: "coldFusion",
    effects: { reactorEnergyRatio: 0.25 },
    prices: [
      { name: "science", val: 200000 },
      { name: "eludium", val: 25 },
    ],
  },
  {
    name: "thoriumReactors",
    effects: { reactorThoriumPerTick: -0.05, reactorEnergyRatio: 0.25 },
    prices: [
      { name: "science", val: 400000 },
      { name: "thorium", val: 10000 },
    ],
    unlocks: { upgrades: ["enrichedThorium"] },
  },
  {
    name: "enrichedThorium",
    effects: { reactorThoriumPerTick: 0.0125 },
    prices: [
      { name: "science", val: 500000 },
      { name: "thorium", val: 12500 },
    ],
  },
  // ─── starcharts / space ───
  {
    name: "hubbleTelescope",
    effects: { starchartGlobalRatio: 0.3 },
    prices: [
      { name: "oil", val: 50000 },
      { name: "science", val: 250000 },
      { name: "alloy", val: 1250 },
    ],
    unlocks: { upgrades: ["satnav"] },
  },
  {
    name: "satnav",
    effects: { satnavRatio: 0.0125 },
    prices: [
      { name: "science", val: 200000 },
      { name: "alloy", val: 750 },
    ],
  },
  {
    name: "satelliteRadio",
    effects: { broadcastTowerRatio: 0.005 },
    prices: [
      { name: "science", val: 225000 },
      { name: "alloy", val: 5000 },
    ],
  },
  {
    name: "astrophysicists",
    effects: {},
    prices: [
      { name: "unobtainium", val: 350 },
      { name: "science", val: 250000 },
    ],
  },
  {
    name: "mWReactor",
    effects: { lunarOutpostRatio: 0.75 },
    prices: [
      { name: "science", val: 150000 },
      { name: "eludium", val: 50 },
    ],
  },
  {
    name: "eludiumCracker",
    effects: { crackerRatio: 1.0 },
    prices: [
      { name: "science", val: 275000 },
      { name: "eludium", val: 250 },
    ],
  },
  {
    name: "thoriumEngine",
    effects: { routeSpeed: 50 },
    prices: [
      { name: "science", val: 400000 },
      { name: "gear", val: 40000 },
      { name: "alloy", val: 2000 },
      { name: "ship", val: 10000 },
      { name: "thorium", val: 100000 },
    ],
  },
  {
    name: "spiceNavigation",
    effects: {},
    prices: [
      { name: "science", val: 350000 },
      { name: "starchart", val: 500000 },
    ],
  },
  {
    name: "longRangeSpaceships",
    effects: {},
    prices: [
      { name: "science", val: 440000 },
      { name: "gear", val: 90000 },
      { name: "alloy", val: 3500 },
      { name: "tanker", val: 500 },
    ],
  },
  // ─── oil refinery ───
  {
    name: "oilRefinery",
    effects: { oilWellRatio: 0.35 },
    prices: [
      { name: "titanium", val: 1250 },
      { name: "science", val: 125000 },
      { name: "gear", val: 500 },
    ],
  },
  {
    name: "oilDistillation",
    effects: { oilWellRatio: 0.75 },
    prices: [
      { name: "titanium", val: 5000 },
      { name: "science", val: 175000 },
    ],
  },
  {
    name: "factoryProcessing",
    effects: { factoryRefineRatio: 0.05 },
    prices: [
      { name: "titanium", val: 7500 },
      { name: "science", val: 195000 },
      { name: "concrate", val: 125 },
    ],
  },
  // ─── void space ───
  {
    name: "voidAspiration",
    effects: {},
    prices: [
      { name: "antimatter", val: 2000 },
      { name: "timeCrystal", val: 15 },
    ],
  },
  {
    name: "distorsion",
    effects: { temporalParadoxDayBonus: 2 },
    prices: [
      { name: "antimatter", val: 2000 },
      { name: "science", val: 300000 },
      { name: "timeCrystal", val: 25 },
      { name: "void", val: 1000 },
    ],
  },
  {
    name: "turnSmoothly",
    effects: { temporalFluxProductionChronosphere: 1 },
    prices: [
      { name: "unobtainium", val: 100000 },
      { name: "temporalFlux", val: 6500 },
      { name: "timeCrystal", val: 25 },
      { name: "void", val: 750 },
    ],
  },
  {
    name: "invisibleBlackHand",
    effects: {},
    prices: [
      { name: "temporalFlux", val: 4096 },
      { name: "timeCrystal", val: 128 },
      { name: "void", val: 32 },
      { name: "blackcoin", val: 64 },
    ],
  },
];

// ── CRAFT_DEFS ────────────────────────────────────────────────────────────────

export const CRAFT_DEFS: readonly CraftDef[] = [
  {
    name: "wood",
    prices: [{ name: "catnip", val: 100 }],
    ignoreBonuses: true,
    tier: 1,
  },
  {
    name: "beam",
    prices: [{ name: "wood", val: 175 }],
    ignoreBonuses: false,
    tier: 1,
  },
  {
    name: "slab",
    prices: [{ name: "minerals", val: 250 }],
    ignoreBonuses: false,
    tier: 1,
  },
  {
    name: "plate",
    prices: [{ name: "iron", val: 125 }],
    ignoreBonuses: false,
    tier: 1,
  },
  {
    name: "steel",
    prices: [
      { name: "coal", val: 100 },
      { name: "iron", val: 100 },
    ],
    ignoreBonuses: false,
    tier: 2,
  },
  {
    name: "concrate",
    prices: [
      { name: "slab", val: 2500 },
      { name: "steel", val: 25 },
    ],
    ignoreBonuses: false,
    tier: 4,
  },
  {
    name: "gear",
    prices: [{ name: "steel", val: 15 }],
    ignoreBonuses: false,
    tier: 3,
  },
  {
    name: "alloy",
    prices: [
      { name: "titanium", val: 10 },
      { name: "steel", val: 75 },
    ],
    ignoreBonuses: false,
    tier: 4,
  },
  {
    name: "eludium",
    prices: [
      { name: "unobtainium", val: 1000 },
      { name: "alloy", val: 2500 },
    ],
    ignoreBonuses: false,
    tier: 5,
  },
  {
    name: "scaffold",
    prices: [{ name: "beam", val: 50 }],
    ignoreBonuses: false,
    tier: 2,
  },
  {
    name: "ship",
    prices: [
      { name: "starchart", val: 25 },
      { name: "plate", val: 150 },
      { name: "scaffold", val: 100 },
    ],
    ignoreBonuses: false,
    tier: 3,
  },
  {
    name: "tanker",
    prices: [
      { name: "alloy", val: 1250 },
      { name: "ship", val: 200 },
      { name: "blueprint", val: 5 },
    ],
    ignoreBonuses: false,
    tier: 5,
  },
  {
    name: "kerosene",
    prices: [{ name: "oil", val: 7500 }],
    ignoreBonuses: false,
    tier: 2,
  },
  {
    name: "parchment",
    prices: [{ name: "furs", val: 175 }],
    ignoreBonuses: false,
    tier: 1,
  },
  {
    name: "manuscript",
    prices: [
      { name: "culture", val: 400 },
      { name: "parchment", val: 25 },
    ],
    ignoreBonuses: false,
    tier: 2,
  },
  {
    name: "compedium",
    prices: [
      { name: "science", val: 10000 },
      { name: "manuscript", val: 50 },
    ],
    ignoreBonuses: false,
    tier: 3,
  },
  {
    name: "blueprint",
    prices: [
      { name: "science", val: 25000 },
      { name: "compedium", val: 25 },
    ],
    ignoreBonuses: false,
    tier: 3,
  },
  {
    name: "thorium",
    prices: [{ name: "uranium", val: 250 }],
    ignoreBonuses: false,
    tier: 3,
  },
  {
    name: "megalith",
    prices: [
      { name: "beam", val: 25 },
      { name: "slab", val: 50 },
      { name: "plate", val: 5 },
    ],
    ignoreBonuses: false,
    tier: 3,
  },
  {
    name: "bloodstone",
    prices: [
      { name: "timeCrystal", val: 5000 },
      { name: "relic", val: 10000 },
    ],
    ignoreBonuses: false,
    tier: 5,
  },
  {
    name: "tMythril",
    prices: [
      { name: "bloodstone", val: 5 },
      { name: "ivory", val: 1000 },
      { name: "titanium", val: 500 },
    ],
    ignoreBonuses: false,
    tier: 7,
  },
];

// ── Initial sets ──────────────────────────────────────────────────────────────

const INITIAL_UNLOCKED_UPGRADES = new Set([
  "mineralHoes",
  "ironHoes",
  "mineralAxes",
  "ironAxes",
  "stoneBarns",
  "reinforcedBarns",
]);

const INITIAL_UNLOCKED_CRAFTS = new Set([
  "wood",
  "beam",
  "slab",
  "plate",
  "gear",
  "scaffold",
  "manuscript",
  "megalith",
]);

// ── createInitialWorkshop ─────────────────────────────────────────────────────

export function createInitialWorkshop(): WorkshopState {
  const upgrades: Record<string, UpgradeEntry> = {};
  for (const def of UPGRADE_DEFS) {
    upgrades[def.name] = {
      unlocked: INITIAL_UNLOCKED_UPGRADES.has(def.name),
      researched: false,
    };
  }

  const crafts: Record<string, CraftEntry> = {};
  for (const def of CRAFT_DEFS) {
    crafts[def.name] = {
      unlocked: INITIAL_UNLOCKED_CRAFTS.has(def.name),
    };
  }

  return { upgrades, crafts };
}

// ── applyPurchaseUpgrade ──────────────────────────────────────────────────────

/**
 * Pure reducer: purchase a workshop upgrade.
 * Deducts prices, marks as researched, unlocks downstream upgrades.
 * Port of legacy/js/workshop.js unlock() + game.unlock().
 */
export function applyPurchaseUpgrade(state: GameState, upgradeName: string): GameState {
  const def = UPGRADE_DEFS.find((d) => d.name === upgradeName);
  if (!def) return state;

  const entry = state.workshop.upgrades[upgradeName] ?? { unlocked: false, researched: false };
  if (!entry.unlocked || entry.researched) return state;
  if (!canAfford(def.prices, state.resources)) return state;

  // Deduct resources
  const newResources = { ...state.resources };
  for (const price of def.prices) {
    const res = newResources[price.name];
    if (res) {
      newResources[price.name] = { ...res, value: res.value - price.val };
    }
  }

  // Mark researched + unlock downstream
  const newUpgrades = {
    ...state.workshop.upgrades,
    [upgradeName]: { unlocked: true, researched: true },
  };

  if (def.unlocks?.upgrades) {
    for (const name of def.unlocks.upgrades) {
      const existing = newUpgrades[name];
      if (existing) {
        newUpgrades[name] = { ...existing, unlocked: true };
      }
    }
  }

  return {
    ...state,
    resources: newResources,
    workshop: { ...state.workshop, upgrades: newUpgrades },
  };
}

// ── applyCraft ────────────────────────────────────────────────────────────────

/**
 * Pure reducer: craft `amt` units of the given resource.
 * Output = floor(amt * (1 + craftRatio)) for normal crafts.
 * Wood (ignoreBonuses=true) uses craftRatio=0 regardless.
 * Port of legacy/js/workshop.js craft().
 */
export function applyCraft(state: GameState, craftName: string, amt: number): GameState {
  if (amt <= 0) return state;

  const def = CRAFT_DEFS.find((d) => d.name === craftName);
  if (!def) return state;

  const entry = state.workshop.crafts[craftName] ?? { unlocked: false };
  if (!entry.unlocked) return state;

  // Check affordability (prices × amt)
  const scaledPrices = def.prices.map((p) => ({ name: p.name, val: p.val * amt }));
  if (!canAfford(scaledPrices, state.resources)) return state;

  // Deduct inputs
  const newResources = { ...state.resources };
  for (const price of scaledPrices) {
    const res = newResources[price.name];
    if (res) {
      newResources[price.name] = { ...res, value: res.value - price.val };
    }
  }

  // Calculate output
  const craftRatio = def.ignoreBonuses ? 0 : (state.effectCache.craftRatio ?? 0);
  const craftAmt = amt * (1 + craftRatio);

  // Add output resource
  const outputRes = newResources[craftName] ?? { value: 0, maxValue: 0 };
  const newValue = Math.min(outputRes.value + craftAmt, outputRes.maxValue);
  newResources[craftName] = { ...outputRes, value: newValue };

  return { ...state, resources: newResources };
}

// ── WorkshopManager ───────────────────────────────────────────────────────────

type Serializable_ = Serializable;

export class WorkshopManager implements Manager {
  update(state: GameState): GameState {
    return state;
  }

  updateEffects(state: GameState): Record<string, number> {
    const effects: Record<string, number> = {};
    for (const def of UPGRADE_DEFS) {
      const entry = state.workshop.upgrades[def.name];
      if (!entry?.researched || !def.effects) continue;
      for (const [key, val] of Object.entries(def.effects)) {
        effects[key] = (effects[key] ?? 0) + val;
      }
    }
    return effects;
  }

  save(state: GameState): Serializable_ {
    return state.workshop as unknown as Serializable_;
  }

  load(saved: Serializable_, state: GameState): GameState {
    if (!saved || typeof saved !== "object" || Array.isArray(saved)) {
      return { ...state, workshop: createInitialWorkshop() };
    }
    const raw = saved as Record<string, unknown>;

    const workshop = createInitialWorkshop();

    // Restore upgrade flags
    const upgrades = { ...workshop.upgrades };
    if (raw.upgrades && typeof raw.upgrades === "object" && !Array.isArray(raw.upgrades)) {
      const savedUpgrades = raw.upgrades as Record<string, unknown>;
      for (const name of Object.keys(upgrades)) {
        const s = savedUpgrades[name];
        if (s && typeof s === "object" && !Array.isArray(s)) {
          const su = s as Record<string, unknown>;
          upgrades[name] = {
            unlocked:
              typeof su.unlocked === "boolean" ? su.unlocked : (upgrades[name]?.unlocked ?? false),
            researched: typeof su.researched === "boolean" ? su.researched : false,
          };
        }
      }
    }

    // Restore craft flags
    const crafts = { ...workshop.crafts };
    if (raw.crafts && typeof raw.crafts === "object" && !Array.isArray(raw.crafts)) {
      const savedCrafts = raw.crafts as Record<string, unknown>;
      for (const name of Object.keys(crafts)) {
        const s = savedCrafts[name];
        if (s && typeof s === "object" && !Array.isArray(s)) {
          const sc = s as Record<string, unknown>;
          crafts[name] = {
            unlocked:
              typeof sc.unlocked === "boolean" ? sc.unlocked : (crafts[name]?.unlocked ?? false),
          };
        }
      }
    }

    return { ...state, workshop: { upgrades, crafts } };
  }

  resetState(state: GameState): GameState {
    return { ...state, workshop: createInitialWorkshop() };
  }
}
