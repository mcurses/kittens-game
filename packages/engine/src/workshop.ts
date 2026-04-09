import type { Serializable } from "@kittens/shared";
import { produce } from "immer";
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
  /** Short human-readable description shown in the inspector panel */
  readonly description?: string;
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
  /** Engineer auto-craft speed divisor. Higher = slower. Default 1. */
  readonly progressHandicap: number;
}

export interface CraftEntry {
  readonly unlocked: boolean;
  readonly engineers?: number;
  readonly progress?: number;
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
    description: "Mineral-tipped hoes boost farmer productivity by 50%.",
    effects: { catnipJobRatio: 0.5 },
    prices: [
      { name: "minerals", val: 275 },
      { name: "science", val: 100 },
    ],
    unlocks: { upgrades: ["ironHoes"] },
  },
  {
    name: "ironHoes",
    description: "Iron hoes further improve catnip harvest efficiency.",
    effects: { catnipJobRatio: 0.3 },
    prices: [
      { name: "iron", val: 25 },
      { name: "science", val: 200 },
    ],
  },
  // ─── wood upgrades ───
  {
    name: "mineralAxes",
    description: "Mineral-headed axes dramatically improve woodcutter yield.",
    effects: { woodJobRatio: 0.7 },
    prices: [
      { name: "minerals", val: 500 },
      { name: "science", val: 100 },
    ],
    unlocks: { upgrades: ["ironAxes"] },
  },
  {
    name: "ironAxes",
    description: "Iron axes cut more wood per trip through the forest.",
    effects: { woodJobRatio: 0.5 },
    prices: [
      { name: "iron", val: 50 },
      { name: "science", val: 200 },
    ],
  },
  {
    name: "steelAxe",
    description: "High-carbon steel axe heads for advanced lumber operations.",
    effects: { woodJobRatio: 0.5 },
    prices: [
      { name: "science", val: 20000 },
      { name: "steel", val: 75 },
    ],
  },
  {
    name: "reinforcedSaw",
    description: "Reinforced blades increase lumber mill output.",
    effects: { lumberMillRatio: 0.2 },
    prices: [
      { name: "iron", val: 1000 },
      { name: "science", val: 2500 },
    ],
  },
  {
    name: "steelSaw",
    description: "Steel saw blades for sustained high-volume lumber production.",
    effects: { lumberMillRatio: 0.2 },
    prices: [
      { name: "science", val: 52000 },
      { name: "steel", val: 750 },
    ],
    unlocks: { upgrades: ["titaniumSaw"] },
  },
  {
    name: "titaniumSaw",
    description: "Titanium saw blades cut through timber at remarkable speed.",
    effects: { lumberMillRatio: 0.15 },
    prices: [
      { name: "titanium", val: 500 },
      { name: "science", val: 70000 },
    ],
    unlocks: { upgrades: ["alloySaw"] },
  },
  {
    name: "alloySaw",
    description: "Alloy-composite saws push lumber mill efficiency further.",
    effects: { lumberMillRatio: 0.15 },
    prices: [
      { name: "science", val: 85000 },
      { name: "alloy", val: 75 },
    ],
  },
  {
    name: "titaniumAxe",
    description: "Lightweight titanium axes allow woodcutters to work faster.",
    effects: { woodJobRatio: 0.5 },
    prices: [
      { name: "titanium", val: 10 },
      { name: "science", val: 38000 },
    ],
  },
  {
    name: "alloyAxe",
    description: "Advanced alloy axes for professional-grade wood production.",
    effects: { woodJobRatio: 0.5 },
    prices: [
      { name: "science", val: 70000 },
      { name: "alloy", val: 25 },
    ],
  },
  // ─── unobtainium ───
  {
    name: "unobtainiumAxe",
    description: "Exotic unobtainium axes of almost supernatural sharpness.",
    effects: { woodJobRatio: 0.5 },
    prices: [
      { name: "unobtainium", val: 75 },
      { name: "science", val: 125000 },
    ],
  },
  {
    name: "unobtainiumSaw",
    description: "Unobtainium saw blades for extraordinary lumber mill performance.",
    effects: { lumberMillRatio: 0.25 },
    prices: [
      { name: "unobtainium", val: 125 },
      { name: "science", val: 145000 },
    ],
  },
  // ─── storage upgrades ───
  {
    name: "stoneBarns",
    description: "Stone-reinforced barn walls significantly expand storage.",
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
    description: "Iron and beam reinforcements dramatically expand barn volume.",
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
    description: "Steel-plate walls add substantial warehouse capacity.",
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
    description: "Titanium-framed barns with massive storage gains.",
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
    description: "Alloy-composite barns for another major storage upgrade.",
    effects: { barnRatio: 1 },
    prices: [
      { name: "science", val: 75000 },
      { name: "plate", val: 750 },
      { name: "alloy", val: 20 },
    ],
  },
  {
    name: "concreteBarns",
    description: "Concrete bunker barns for late-game resource stockpiling.",
    effects: { barnRatio: 0.75 },
    prices: [
      { name: "titanium", val: 2000 },
      { name: "science", val: 100000 },
      { name: "concrate", val: 45 },
    ],
  },
  {
    name: "titaniumWarehouses",
    description: "Titanium-reinforced warehouses expand mid-game storage.",
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
    description: "Alloy warehouse construction for late-game stockpiling.",
    effects: { warehouseRatio: 0.45 },
    prices: [
      { name: "titanium", val: 750 },
      { name: "science", val: 90000 },
      { name: "alloy", val: 50 },
    ],
  },
  {
    name: "concreteWarehouses",
    description: "Concrete warehouse modules for dense resource storage.",
    effects: { warehouseRatio: 0.35 },
    prices: [
      { name: "titanium", val: 1250 },
      { name: "science", val: 100000 },
      { name: "concrate", val: 35 },
    ],
  },
  {
    name: "storageBunkers",
    description: "Underground unobtainium bunkers for endgame storage.",
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
    description: "Stabilised energy rifts tap exotic power for the accelerator.",
    effects: {},
    prices: [
      { name: "titanium", val: 7500 },
      { name: "uranium", val: 250 },
      { name: "science", val: 200000 },
    ],
  },
  {
    name: "stasisChambers",
    description: "Temporal stasis chambers nearly double accelerator output.",
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
    description: "Void-sourced energy brings accelerator near its theoretical limit.",
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
    description: "Dark energy powering the accelerator at 250% efficiency.",
    effects: { acceleratorRatio: 2.5 },
    prices: [
      { name: "science", val: 350000 },
      { name: "timeCrystal", val: 3 },
      { name: "eludium", val: 75 },
    ],
  },
  {
    name: "chronoforge",
    description: "Ancient time-forging relic anchoring Chronoforge mechanics.",
    effects: {},
    prices: [
      { name: "science", val: 500000 },
      { name: "timeCrystal", val: 10 },
      { name: "relic", val: 5 },
    ],
  },
  {
    name: "tachyonModerator",
    description: "Tachyon modulator stabilises high-speed accelerator operation.",
    effects: {},
    prices: [
      { name: "science", val: 16000 },
      { name: "gear", val: 500 },
      { name: "titanium", val: 250 },
    ],
  },
  {
    name: "tachyonAccelerators",
    description: "Tachyon-driven beams for extreme acceleration rates.",
    effects: { acceleratorRatio: 5 },
    prices: [
      { name: "science", val: 500000 },
      { name: "timeCrystal", val: 10 },
      { name: "eludium", val: 125 },
    ],
  },
  {
    name: "fluxCondensator",
    description: "Temporal flux condensator for advanced Chronoforge operations.",
    effects: {},
    prices: [
      { name: "unobtainium", val: 5000 },
      { name: "timeCrystal", val: 5 },
      { name: "alloy", val: 250 },
    ],
  },
  {
    name: "lhc",
    description: "Large hadron collider providing extraordinary science boosts.",
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
    description: "Photovoltaic panels dramatically boost solar farm output.",
    effects: { solarFarmRatio: 0.5 },
    prices: [
      { name: "titanium", val: 5000 },
      { name: "science", val: 75000 },
    ],
  },
  {
    name: "thinFilm",
    description: "Thin-film cells reduce seasonal variation in solar production.",
    effects: { solarFarmSeasonRatio: 1 },
    prices: [
      { name: "uranium", val: 1000 },
      { name: "unobtainium", val: 200 },
      { name: "science", val: 125000 },
    ],
  },
  {
    name: "qdot",
    description: "Quantum-dot coatings maximize solar farm year-round efficiency.",
    effects: { solarFarmSeasonRatio: 1 },
    prices: [
      { name: "science", val: 175000 },
      { name: "eludium", val: 200 },
      { name: "thorium", val: 1000 },
    ],
  },
  {
    name: "solarSatellites",
    description: "Orbital solar collectors boosting planetary energy generation.",
    effects: {},
    prices: [
      { name: "science", val: 225000 },
      { name: "alloy", val: 750 },
    ],
  },
  // ─── harbour stuff ───
  {
    name: "cargoShips",
    description: "Cargo ships increase harbour trade throughput.",
    effects: { harborRatio: 0.01 },
    prices: [
      { name: "science", val: 55000 },
      { name: "blueprint", val: 15 },
    ],
  },
  {
    name: "barges",
    description: "Coal barges specialised for harbour-based coal transport.",
    effects: { harborCoalRatio: 0.5 },
    prices: [
      { name: "titanium", val: 1500 },
      { name: "science", val: 100000 },
      { name: "blueprint", val: 30 },
    ],
  },
  {
    name: "reactorVessel",
    description: "Nuclear reactor vessels expand the ship fleet limit.",
    effects: { shipLimit: 0.05 },
    prices: [
      { name: "titanium", val: 5000 },
      { name: "uranium", val: 125 },
      { name: "science", val: 135000 },
    ],
  },
  {
    name: "ironwood",
    description: "Ironwood composites halve the cost of building new huts.",
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
    description: "Concrete construction further reduces hut build costs.",
    effects: { hutPriceRatio: -0.3 },
    prices: [
      { name: "titanium", val: 3000 },
      { name: "science", val: 125000 },
      { name: "concrate", val: 45 },
    ],
  },
  {
    name: "unobtainiumHuts",
    description: "Unobtainium framework cuts hut costs dramatically.",
    effects: { hutPriceRatio: -0.25 },
    prices: [
      { name: "titanium", val: 15000 },
      { name: "unobtainium", val: 350 },
      { name: "science", val: 200000 },
    ],
  },
  {
    name: "eludiumHuts",
    description: "Eludium-enhanced construction — huts nearly build themselves.",
    effects: { hutPriceRatio: -0.1 },
    prices: [
      { name: "science", val: 275000 },
      { name: "eludium", val: 125 },
    ],
  },
  {
    name: "silos",
    description: "Grain silos integrated with warehouses, unlocking titanium upgrades.",
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
    description: "Industrial refrigeration dramatically expands catnip storage.",
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
    description: "Composite bows allow hunters to gather significantly more catpower.",
    effects: { catpowerJobRatio: 0.5 },
    prices: [
      { name: "wood", val: 200 },
      { name: "iron", val: 100 },
      { name: "science", val: 500 },
    ],
  },
  {
    name: "crossbow",
    description: "Crossbows let hunters operate more efficiently.",
    effects: { catpowerJobRatio: 0.25 },
    prices: [
      { name: "iron", val: 1500 },
      { name: "science", val: 12000 },
    ],
  },
  {
    name: "railgun",
    description: "Electromagnetic railguns for high-yield hunting expeditions.",
    effects: { catpowerJobRatio: 0.25 },
    prices: [
      { name: "titanium", val: 5000 },
      { name: "science", val: 150000 },
      { name: "blueprint", val: 25 },
    ],
  },
  {
    name: "bolas",
    description: "Bolas ensnare prey, doubling hunter catch rate.",
    effects: { hunterRatio: 1 },
    prices: [
      { name: "wood", val: 50 },
      { name: "minerals", val: 250 },
      { name: "science", val: 1000 },
    ],
  },
  {
    name: "huntingArmor",
    description: "Full hunting armor doubles hunter productivity.",
    effects: { hunterRatio: 2 },
    prices: [
      { name: "iron", val: 750 },
      { name: "science", val: 2000 },
    ],
  },
  {
    name: "steelArmor",
    description: "Steel armor protects hunters and improves output.",
    effects: { hunterRatio: 0.5 },
    prices: [
      { name: "science", val: 10000 },
      { name: "steel", val: 50 },
    ],
  },
  {
    name: "alloyArmor",
    description: "Alloy armor for enhanced hunter performance.",
    effects: { hunterRatio: 0.5 },
    prices: [
      { name: "science", val: 50000 },
      { name: "alloy", val: 25 },
    ],
  },
  {
    name: "nanosuits",
    description: "Nanosuit technology maximises hunter effectiveness.",
    effects: { hunterRatio: 0.5 },
    prices: [
      { name: "science", val: 185000 },
      { name: "alloy", val: 250 },
    ],
  },
  {
    name: "caravanserai",
    description: "Caravanserai trade post enabling deeper diplomatic commerce.",
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
    description: "Advanced refining techniques unlock higher-tier smelting.",
    effects: {},
    prices: [
      { name: "catnip", val: 5000 },
      { name: "science", val: 500 },
    ],
  },
  {
    name: "goldOre",
    description: "Gold ore processing enabling currency and trade systems.",
    effects: {},
    prices: [
      { name: "minerals", val: 800 },
      { name: "iron", val: 100 },
      { name: "science", val: 1000 },
    ],
  },
  {
    name: "geodesy",
    description: "Geological survey techniques improving mineral location.",
    effects: {},
    prices: [
      { name: "titanium", val: 250 },
      { name: "science", val: 90000 },
      { name: "starchart", val: 500 },
    ],
  },
  {
    name: "register",
    description: "Trade register improving commerce efficiency.",
    effects: {},
    prices: [
      { name: "gold", val: 10 },
      { name: "science", val: 500 },
    ],
  },
  {
    name: "strenghtenBuild",
    description: "Structural reinforcement boosting barn and warehouse capacity.",
    effects: { barnRatio: 0.05, warehouseRatio: 0.05 },
    prices: [
      { name: "science", val: 100000 },
      { name: "concrate", val: 50 },
    ],
    unlocks: { upgrades: ["concreteWarehouses", "concreteBarns", "concreteHuts"] },
  },
  {
    name: "miningDrill",
    description: "Industrial drilling equipment for deep mineral extraction.",
    effects: {},
    prices: [
      { name: "titanium", val: 1750 },
      { name: "science", val: 100000 },
      { name: "steel", val: 750 },
    ],
  },
  {
    name: "unobtainiumDrill",
    description: "Unobtainium drill bits for exotic deep-earth resource extraction.",
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
    description: "High-temperature coal furnaces enabling steel production.",
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
    description: "Deep-shaft mining unlocking underground coal seams.",
    effects: {},
    prices: [
      { name: "iron", val: 1200 },
      { name: "science", val: 5000 },
      { name: "beam", val: 50 },
    ],
  },
  {
    name: "pyrolysis",
    description: "Pyrolytic coal processing increases super-coal conversion.",
    effects: { coalSuperRatio: 0.2 },
    prices: [
      { name: "science", val: 35000 },
      { name: "compedium", val: 5 },
    ],
  },
  {
    name: "electrolyticSmelting",
    description: "Electrolytic smelting nearly doubles smelter throughput.",
    effects: { smelterRatio: 0.95 },
    prices: [
      { name: "titanium", val: 2000 },
      { name: "science", val: 100000 },
    ],
  },
  {
    name: "oxidation",
    description: "Oxidation chambers dramatically boost calciner output.",
    effects: { calcinerRatio: 0.95 },
    prices: [
      { name: "science", val: 100000 },
      { name: "steel", val: 5000 },
    ],
  },
  {
    name: "steelPlants",
    description: "Automated steel plants improve calciner steel production.",
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
    description: "Fully automated plants boost steel craft ratios.",
    effects: { calcinerSteelCraftRatio: 0.25 },
    prices: [
      { name: "science", val: 200000 },
      { name: "alloy", val: 750 },
    ],
    unlocks: { upgrades: ["nuclearPlants"] },
  },
  {
    name: "nuclearPlants",
    description: "Nuclear-powered plants provide per-reactor steel bonuses.",
    effects: { calcinerSteelReactorBonus: 0.02 },
    prices: [
      { name: "uranium", val: 10000 },
      { name: "science", val: 250000 },
    ],
  },
  {
    name: "rotaryKiln",
    description: "Rotary kilns substantially boost calciner efficiency.",
    effects: { calcinerRatio: 0.75 },
    prices: [
      { name: "titanium", val: 5000 },
      { name: "science", val: 145000 },
      { name: "gear", val: 500 },
    ],
  },
  {
    name: "fluidizedReactors",
    description: "Fluidized-bed reactors achieve peak calciner performance.",
    effects: { calcinerRatio: 1 },
    prices: [
      { name: "science", val: 175000 },
      { name: "alloy", val: 200 },
    ],
  },
  {
    name: "nuclearSmelters",
    description: "Nuclear smelters for exotic late-game metal processing.",
    effects: {},
    prices: [
      { name: "uranium", val: 250 },
      { name: "science", val: 165000 },
    ],
  },
  {
    name: "orbitalGeodesy",
    description: "Orbital geological surveys pinpoint surface resource deposits.",
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
    description: "Printing press enabling automated blueprint production.",
    effects: {},
    prices: [
      { name: "science", val: 7500 },
      { name: "gear", val: 45 },
    ],
  },
  {
    name: "offsetPress",
    description: "Offset press dramatically accelerates blueprint printing.",
    effects: {},
    prices: [
      { name: "oil", val: 15000 },
      { name: "science", val: 100000 },
      { name: "gear", val: 250 },
    ],
  },
  {
    name: "photolithography",
    description: "Photolithographic printing for advanced blueprint automation.",
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
    description: "Satellite uplink improving data center and lab efficiency.",
    effects: { uplinkDCRatio: 0.01, uplinkLabRatio: 0.01 },
    prices: [
      { name: "science", val: 75000 },
      { name: "alloy", val: 1750 },
    ],
  },
  {
    name: "starlink",
    description: "Starlink constellation for lab and uplink efficiency boost.",
    effects: { uplinkLabRatio: 0.01 },
    prices: [
      { name: "oil", val: 25000 },
      { name: "science", val: 175000 },
      { name: "alloy", val: 5000 },
    ],
  },
  {
    name: "cryocomputing",
    description: "Cryogenic computing unlocking advanced space research.",
    effects: {},
    prices: [
      { name: "science", val: 125000 },
      { name: "eludium", val: 15 },
    ],
  },
  {
    name: "machineLearning",
    description: "Machine learning improving AI-driven data center performance.",
    effects: { dataCenterAIRatio: 0.1 },
    prices: [
      { name: "antimatter", val: 125 },
      { name: "science", val: 175000 },
      { name: "eludium", val: 25 },
    ],
  },
  {
    name: "factoryAutomation",
    description: "Basic factory automation systems unlocking craft bonuses.",
    effects: {},
    prices: [
      { name: "science", val: 10000 },
      { name: "gear", val: 25 },
    ],
  },
  {
    name: "advancedAutomation",
    description: "Advanced robotics further improving factory throughput.",
    effects: {},
    prices: [
      { name: "science", val: 100000 },
      { name: "gear", val: 75 },
      { name: "blueprint", val: 25 },
    ],
  },
  {
    name: "pneumaticPress",
    description: "Pneumatic presses enabling mechanical blueprint production.",
    effects: {},
    prices: [
      { name: "science", val: 20000 },
      { name: "gear", val: 30 },
      { name: "blueprint", val: 5 },
    ],
  },
  {
    name: "combustionEngine",
    description: "Internal combustion engines reducing global coal consumption.",
    effects: { coalRatioGlobalReduction: 0.2 },
    prices: [
      { name: "science", val: 20000 },
      { name: "gear", val: 25 },
      { name: "blueprint", val: 5 },
    ],
  },
  {
    name: "fuelInjectors",
    description: "Fuel injectors further cutting coal consumption.",
    effects: { coalRatioGlobalReduction: 0.2 },
    prices: [
      { name: "oil", val: 20000 },
      { name: "science", val: 100000 },
      { name: "gear", val: 250 },
    ],
  },
  {
    name: "factoryLogistics",
    description: "Factory logistics management enabling advanced upgrades.",
    effects: {},
    prices: [
      { name: "titanium", val: 2000 },
      { name: "science", val: 100000 },
      { name: "gear", val: 250 },
    ],
  },
  {
    name: "carbonSequestration",
    description: "Carbon capture and storage for environmental sustainability.",
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
    description: "Optimised factory lines dramatically boosting craft rates.",
    effects: { t1CraftRatio: 10, t2CraftRatio: 2, queueCap: 1 },
    prices: [
      { name: "titanium", val: 1250 },
      { name: "science", val: 75000 },
      { name: "gear", val: 125 },
    ],
  },
  {
    name: "factoryRobotics",
    description: "Full robotic factory lines for maximum craft automation.",
    effects: { t1CraftRatio: 10, t2CraftRatio: 5, t3CraftRatio: 2, queueCap: 2 },
    prices: [
      { name: "titanium", val: 2500 },
      { name: "science", val: 100000 },
      { name: "gear", val: 250 },
    ],
  },
  {
    name: "spaceEngineers",
    description: "Space-grade engineering teams for tier 4+ craft bonuses.",
    effects: { t1CraftRatio: 10, t2CraftRatio: 5, t3CraftRatio: 2, t4CraftRatio: 2, queueCap: 2 },
    prices: [
      { name: "science", val: 225000 },
      { name: "alloy", val: 500 },
    ],
  },
  {
    name: "aiEngineers",
    description: "AI-enhanced engineering for peak craft and queue bonuses.",
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
    description: "Temporal engineers manipulating time for maximum factory output.",
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
    description: "Off-world manufacturing for exotic resource production.",
    effects: {},
    prices: [
      { name: "titanium", val: 125000 },
      { name: "science", val: 250000 },
    ],
  },
  // ─── science upgrades ───
  {
    name: "celestialMechanics",
    description: "Orbital calculations enabling advanced tech research.",
    effects: {},
    prices: [{ name: "science", val: 250 }],
  },
  {
    name: "astrolabe",
    description: "Navigation device improving starchart discovery efficiency.",
    effects: {},
    prices: [
      { name: "titanium", val: 5 },
      { name: "science", val: 25000 },
      { name: "starchart", val: 75 },
    ],
  },
  {
    name: "titaniumMirrors",
    description: "Reflective titanium arrays boosting library science output.",
    effects: { libraryRatio: 0.02 },
    prices: [
      { name: "titanium", val: 15 },
      { name: "science", val: 20000 },
      { name: "starchart", val: 20 },
    ],
  },
  {
    name: "unobtainiumReflectors",
    description: "Unobtainium reflectors for extreme library science bonuses.",
    effects: { libraryRatio: 0.02 },
    prices: [
      { name: "unobtainium", val: 75 },
      { name: "science", val: 250000 },
      { name: "starchart", val: 750 },
    ],
  },
  {
    name: "eludiumReflectors",
    description: "Eludium-lensed reflectors pushing library output to the limit.",
    effects: { libraryRatio: 0.02 },
    prices: [
      { name: "science", val: 250000 },
      { name: "eludium", val: 15 },
    ],
  },
  {
    name: "hydroPlantTurbines",
    description: "Upgraded turbines boosting hydroelectric plant output.",
    effects: { hydroPlantRatio: 0.15 },
    prices: [
      { name: "unobtainium", val: 125 },
      { name: "science", val: 250000 },
    ],
  },
  // ─── antimatter / space ───
  {
    name: "amBases",
    description: "Antimatter production bases enabling advanced space operations.",
    effects: {},
    prices: [
      { name: "antimatter", val: 250 },
      { name: "eludium", val: 15 },
    ],
    unlocks: { upgrades: ["aiBases"] },
  },
  {
    name: "aiBases",
    description: "AI-controlled antimatter bases for autonomous production.",
    effects: {},
    prices: [
      { name: "antimatter", val: 7500 },
      { name: "science", val: 750000 },
    ],
  },
  {
    name: "amFission",
    description: "Antimatter fission reactions boosting eludium automation.",
    effects: { eludiumAutomationBonus: 0.25 },
    prices: [
      { name: "antimatter", val: 175 },
      { name: "science", val: 525000 },
      { name: "thorium", val: 7500 },
    ],
  },
  {
    name: "amReactors",
    description: "Antimatter reactors providing a major space science boost.",
    effects: { spaceScienceRatio: 0.95 },
    prices: [
      { name: "antimatter", val: 750 },
      { name: "eludium", val: 35 },
    ],
    unlocks: { upgrades: ["amReactorsMK2"] },
  },
  {
    name: "amReactorsMK2",
    description: "Mark 2 antimatter reactors for even greater science output.",
    effects: { spaceScienceRatio: 1.5 },
    prices: [
      { name: "antimatter", val: 1750 },
      { name: "eludium", val: 70 },
    ],
    unlocks: { upgrades: ["voidReactors"] },
  },
  {
    name: "voidReactors",
    description: "Void-powered reactors for exceptional space science generation.",
    effects: { spaceScienceRatio: 4 },
    prices: [
      { name: "antimatter", val: 2500 },
      { name: "void", val: 250 },
    ],
  },
  {
    name: "relicStation",
    description: "Relic processing station earning relics from beacon operations.",
    effects: { beaconRelicsPerDay: 0.01 },
    prices: [
      { name: "antimatter", val: 5000 },
      { name: "eludium", val: 100 },
    ],
  },
  {
    name: "amDrive",
    description: "Antimatter drive greatly accelerating space ship route speed.",
    effects: { routeSpeed: 25 },
    prices: [
      { name: "antimatter", val: 125 },
      { name: "science", val: 450000 },
    ],
  },
  // ─── oil ───
  {
    name: "pumpjack",
    description: "Industrial pump jacks increasing oil well extraction rate.",
    effects: { oilWellRatio: 0.45 },
    prices: [
      { name: "titanium", val: 250 },
      { name: "science", val: 100000 },
      { name: "gear", val: 125 },
    ],
  },
  {
    name: "biofuel",
    description: "Biofuel refining reducing dependence on petroleum sources.",
    effects: {},
    prices: [
      { name: "titanium", val: 1250 },
      { name: "science", val: 150000 },
    ],
  },
  {
    name: "unicornSelection",
    description: "Selective unicorn breeding program improving global ratios.",
    effects: { unicornsGlobalRatio: 0.25, unicornsMaxRatio: 0 },
    prices: [
      { name: "titanium", val: 1500 },
      { name: "science", val: 175000 },
    ],
  },
  {
    name: "gmo",
    description: "Genetically modified crops improving biofuel yield.",
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
    description: "CAD software improving blueprint crafting efficiency slightly.",
    effects: { cadBlueprintCraftRatio: 0.01 },
    prices: [
      { name: "titanium", val: 750 },
      { name: "science", val: 125000 },
    ],
  },
  {
    name: "seti",
    description: "Search for extraterrestrial intelligence unlocking contact tech.",
    effects: {},
    prices: [
      { name: "titanium", val: 250 },
      { name: "science", val: 125000 },
    ],
  },
  {
    name: "logistics",
    description: "Logistics management improving worker skill multiplier.",
    effects: { skillMultiplier: 0.15 },
    prices: [
      { name: "science", val: 100000 },
      { name: "gear", val: 100 },
      { name: "scaffold", val: 1000 },
    ],
  },
  {
    name: "augumentation",
    description: "Kitten augmentation dramatically improving skill multipliers.",
    effects: { skillMultiplier: 1 },
    prices: [
      { name: "titanium", val: 5000 },
      { name: "uranium", val: 50 },
      { name: "science", val: 150000 },
    ],
  },
  {
    name: "internet",
    description: "Global network enabling advanced information technology.",
    effects: {},
    prices: [
      { name: "titanium", val: 5000 },
      { name: "uranium", val: 50 },
      { name: "science", val: 150000 },
    ],
  },
  {
    name: "neuralNetworks",
    description: "Neural network AI for advanced computational research.",
    effects: {},
    prices: [
      { name: "titanium", val: 7500 },
      { name: "science", val: 200000 },
    ],
  },
  {
    name: "assistance",
    description: "AI assistance reducing per-worker catnip demand.",
    effects: { catnipDemandWorkerRatioGlobal: -0.25 },
    prices: [
      { name: "science", val: 100000 },
      { name: "steel", val: 10000 },
      { name: "gear", val: 250 },
    ],
  },
  {
    name: "enrichedUranium",
    description: "Enriched uranium fuel improving reactor output rate.",
    effects: { uraniumRatio: 0.25 },
    prices: [
      { name: "titanium", val: 7500 },
      { name: "uranium", val: 150 },
      { name: "science", val: 175000 },
    ],
  },
  {
    name: "coldFusion",
    description: "Cold fusion reactor technology boosting energy production.",
    effects: { reactorEnergyRatio: 0.25 },
    prices: [
      { name: "science", val: 200000 },
      { name: "eludium", val: 25 },
    ],
  },
  {
    name: "thoriumReactors",
    description: "Thorium fission reactors with improved energy output.",
    effects: { reactorThoriumPerTick: -0.05, reactorEnergyRatio: 0.25 },
    prices: [
      { name: "science", val: 400000 },
      { name: "thorium", val: 10000 },
    ],
    unlocks: { upgrades: ["enrichedThorium"] },
  },
  {
    name: "enrichedThorium",
    description: "Enriched thorium fuel extending reactor burn duration.",
    effects: { reactorThoriumPerTick: 0.0125 },
    prices: [
      { name: "science", val: 500000 },
      { name: "thorium", val: 12500 },
    ],
  },
  // ─── starcharts / space ───
  {
    name: "hubbleTelescope",
    description: "Orbital telescope greatly boosting starchart generation.",
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
    description: "Satellite navigation improving starchart accumulation rate.",
    effects: { satnavRatio: 0.0125 },
    prices: [
      { name: "science", val: 200000 },
      { name: "alloy", val: 750 },
    ],
  },
  {
    name: "satelliteRadio",
    description: "Satellite radio arrays boosting broadcast tower output.",
    effects: { broadcastTowerRatio: 0.005 },
    prices: [
      { name: "science", val: 225000 },
      { name: "alloy", val: 5000 },
    ],
  },
  {
    name: "astrophysicists",
    description: "Astrophysicist kittens advancing deep space research.",
    effects: {},
    prices: [
      { name: "unobtainium", val: 350 },
      { name: "science", val: 250000 },
    ],
  },
  {
    name: "mWReactor",
    description: "Megawatt reactor powering lunar outpost operations.",
    effects: { lunarOutpostRatio: 0.75 },
    prices: [
      { name: "science", val: 150000 },
      { name: "eludium", val: 50 },
    ],
  },
  {
    name: "eludiumCracker",
    description: "Eludium cracker doubling exotic matter processing rate.",
    effects: { crackerRatio: 1.0 },
    prices: [
      { name: "science", val: 275000 },
      { name: "eludium", val: 250 },
    ],
  },
  {
    name: "thoriumEngine",
    description: "Thorium-powered engines increasing space route speed.",
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
    description: "Spice-guided navigation for deep space exploration.",
    effects: {},
    prices: [
      { name: "science", val: 350000 },
      { name: "starchart", val: 500000 },
    ],
  },
  {
    name: "longRangeSpaceships",
    description: "Extended-range ships enabling very long space routes.",
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
    description: "Advanced oil refinery substantially increasing extraction.",
    effects: { oilWellRatio: 0.35 },
    prices: [
      { name: "titanium", val: 1250 },
      { name: "science", val: 125000 },
      { name: "gear", val: 500 },
    ],
  },
  {
    name: "oilDistillation",
    description: "Fractional distillation improving oil field yield.",
    effects: { oilWellRatio: 0.75 },
    prices: [
      { name: "titanium", val: 5000 },
      { name: "science", val: 175000 },
    ],
  },
  {
    name: "factoryProcessing",
    description: "Factory-scale oil processing boosting refinery output.",
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
    description: "Aspiration towards void mastery unlocking temporal upgrades.",
    effects: {},
    prices: [
      { name: "antimatter", val: 2000 },
      { name: "timeCrystal", val: 15 },
    ],
  },
  {
    name: "distorsion",
    description: "Temporal distortion fields adding bonus paradox days.",
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
    description: "Smoothly turning temporal flux generators improve Chronosphere output.",
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
    description: "The invisible hand guiding temporal economics.",
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
  { name: "wood", prices: [{ name: "catnip", val: 100 }], ignoreBonuses: true, tier: 1, progressHandicap: 1 },
  { name: "beam", prices: [{ name: "wood", val: 175 }], ignoreBonuses: false, tier: 1, progressHandicap: 1 },
  { name: "slab", prices: [{ name: "minerals", val: 250 }], ignoreBonuses: false, tier: 1, progressHandicap: 1 },
  { name: "plate", prices: [{ name: "iron", val: 125 }], ignoreBonuses: false, tier: 1, progressHandicap: 4 },
  { name: "steel", prices: [{ name: "coal", val: 100 }, { name: "iron", val: 100 }], ignoreBonuses: false, tier: 2, progressHandicap: 4 },
  { name: "concrate", prices: [{ name: "slab", val: 2500 }, { name: "steel", val: 25 }], ignoreBonuses: false, tier: 4, progressHandicap: 9 },
  { name: "gear", prices: [{ name: "steel", val: 15 }], ignoreBonuses: false, tier: 3, progressHandicap: 5 },
  { name: "alloy", prices: [{ name: "titanium", val: 10 }, { name: "steel", val: 75 }], ignoreBonuses: false, tier: 4, progressHandicap: 7 },
  { name: "eludium", prices: [{ name: "unobtainium", val: 1000 }, { name: "alloy", val: 2500 }], ignoreBonuses: false, tier: 5, progressHandicap: 300 },
  { name: "scaffold", prices: [{ name: "beam", val: 50 }], ignoreBonuses: false, tier: 2, progressHandicap: 2 },
  { name: "ship", prices: [{ name: "starchart", val: 25 }, { name: "plate", val: 150 }, { name: "scaffold", val: 100 }], ignoreBonuses: false, tier: 3, progressHandicap: 20 },
  { name: "tanker", prices: [{ name: "alloy", val: 1250 }, { name: "ship", val: 200 }, { name: "blueprint", val: 5 }], ignoreBonuses: false, tier: 5, progressHandicap: 20 },
  { name: "kerosene", prices: [{ name: "oil", val: 7500 }], ignoreBonuses: false, tier: 2, progressHandicap: 5 },
  { name: "parchment", prices: [{ name: "furs", val: 175 }], ignoreBonuses: false, tier: 1, progressHandicap: 1 },
  { name: "manuscript", prices: [{ name: "culture", val: 400 }, { name: "parchment", val: 25 }], ignoreBonuses: false, tier: 2, progressHandicap: 2 },
  { name: "compedium", prices: [{ name: "science", val: 10000 }, { name: "manuscript", val: 50 }], ignoreBonuses: false, tier: 3, progressHandicap: 5 },
  { name: "blueprint", prices: [{ name: "science", val: 25000 }, { name: "compedium", val: 25 }], ignoreBonuses: false, tier: 3, progressHandicap: 10 },
  { name: "thorium", prices: [{ name: "uranium", val: 250 }], ignoreBonuses: false, tier: 3, progressHandicap: 5 },
  { name: "megalith", prices: [{ name: "beam", val: 25 }, { name: "slab", val: 50 }, { name: "plate", val: 5 }], ignoreBonuses: false, tier: 3, progressHandicap: 5 },
  { name: "bloodstone", prices: [{ name: "timeCrystal", val: 5000 }, { name: "relic", val: 10000 }], ignoreBonuses: false, tier: 5, progressHandicap: 7500 },
  { name: "tMythril", prices: [{ name: "bloodstone", val: 5 }, { name: "ivory", val: 1000 }, { name: "titanium", val: 500 }], ignoreBonuses: false, tier: 7, progressHandicap: 10000 },
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
      engineers: 0,
      progress: 0,
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

  return produce(state, (draft) => {
    // Deduct resources
    for (const price of def.prices) {
      const res = draft.resources[price.name];
      if (res) {
        res.value -= price.val;
      }
    }

    // Mark researched
    const upg = draft.workshop.upgrades[upgradeName] ?? { unlocked: false, researched: false };
    upg.unlocked = true;
    upg.researched = true;
    draft.workshop.upgrades[upgradeName] = upg;

    // Unlock downstream upgrades
    if (def.unlocks?.upgrades) {
      for (const name of def.unlocks.upgrades) {
        const existing = draft.workshop.upgrades[name];
        if (existing) {
          existing.unlocked = true;
        }
      }
    }
  });
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

  // Calculate output amount before producing.
  // Apply tier-specific craft ratio from effectCache (t1CraftRatio through t5CraftRatio).
  // Port of legacy workshop.js: "t" + craft.tier + "CraftRatio" effect lookup.
  let craftRatio = 0;
  if (!def.ignoreBonuses) {
    craftRatio += state.effectCache.craftRatio ?? 0;
    if (def.tier >= 1 && def.tier <= 5) {
      craftRatio += state.effectCache[`t${def.tier}CraftRatio`] ?? 0;
    }
  }
  const craftAmt = amt * (1 + craftRatio);

  return produce(state, (draft) => {
    // Deduct inputs
    for (const price of scaledPrices) {
      const res = draft.resources[price.name];
      if (res) {
        res.value -= price.val;
      }
    }

    // Add output resource (addRes semantics: maxValue=0 means uncapped)
    const outputRes = draft.resources[craftName] ?? { value: 0, maxValue: 0 };
    const newVal = outputRes.value + craftAmt;
    outputRes.value = outputRes.maxValue > 0 ? Math.min(newVal, outputRes.maxValue) : newVal;
    draft.resources[craftName] = outputRes;
  });
}

export function getAssignedCraftEngineers(state: Pick<GameState, "workshop">): number {
  return Object.values(state.workshop.crafts).reduce((total, craft) => total + (craft.engineers ?? 0), 0);
}

export function applyAssignCraftEngineer(state: GameState, craftName: string): GameState {
  const craft = state.workshop.crafts[craftName];
  if (!craft?.unlocked) return state;

  const totalEngineers = state.village.jobs.engineer?.value ?? 0;
  const freeEngineers = totalEngineers - getAssignedCraftEngineers(state);
  if (freeEngineers <= 0) return state;

  return produce(state, (draft) => {
    const entry = draft.workshop.crafts[craftName];
    if (!entry?.unlocked) return;
    entry.engineers = (entry.engineers ?? 0) + 1;
  });
}

export function applyUnassignCraftEngineer(state: GameState, craftName: string): GameState {
  const craft = state.workshop.crafts[craftName];
  if (!craft || (craft.engineers ?? 0) <= 0) return state;

  return produce(state, (draft) => {
    const entry = draft.workshop.crafts[craftName];
    if (!entry) return;
    entry.engineers = Math.max(0, (entry.engineers ?? 0) - 1);
  });
}

// ── WorkshopManager ───────────────────────────────────────────────────────────

type Serializable_ = Serializable;

/**
 * Legacy: 1 craft per engineer per 600 real seconds × ticksPerSecond (5) = 3000 ticks.
 * Our engine uses the same abstract tick rate.
 */
const TICKS_PER_CRAFT_CYCLE = 3000;

export class WorkshopManager implements Manager {
  readonly sectionKey = "workshop";

  update(state: GameState): GameState {
    // Engineer auto-craft: accumulate progress per assigned craft
    let result = state;
    for (const def of CRAFT_DEFS) {
      const entry = result.workshop.crafts[def.name];
      if (!entry?.unlocked || (entry.engineers ?? 0) <= 0) continue;

      const engineers = entry.engineers ?? 0;
      const progressPerTick = engineers / (TICKS_PER_CRAFT_CYCLE * def.progressHandicap);
      let newProgress = (entry.progress ?? 0) + progressPerTick;

      // When progress >= 1, attempt to craft one unit
      if (newProgress >= 1) {
        // Check if we can afford 1 unit
        if (canAfford(def.prices, result.resources)) {
          // Compute output with bonus
          let craftRatio = 0;
          if (!def.ignoreBonuses) {
            craftRatio += result.effectCache.craftRatio ?? 0;
            if (def.tier >= 1 && def.tier <= 5) {
              craftRatio += result.effectCache[`t${def.tier}CraftRatio`] ?? 0;
            }
          }
          const output = 1 + craftRatio;

          result = produce(result, (draft) => {
            // Deduct inputs
            for (const price of def.prices) {
              const res = draft.resources[price.name];
              if (res) res.value -= price.val;
            }
            // Add output
            const outRes = draft.resources[def.name] ?? { value: 0, maxValue: 0 };
            const newVal = outRes.value + output;
            outRes.value = outRes.maxValue > 0 ? Math.min(newVal, outRes.maxValue) : newVal;
            draft.resources[def.name] = outRes;
            // Reset progress, keep fractional remainder
            const craftEntry = draft.workshop.crafts[def.name];
            if (craftEntry) craftEntry.progress = newProgress - 1;
          });
        } else {
          // Can't afford — stall at 0.999 (don't lose progress but don't craft)
          result = produce(result, (draft) => {
            const craftEntry = draft.workshop.crafts[def.name];
            if (craftEntry) craftEntry.progress = Math.min(newProgress, 0.999);
          });
        }
      } else {
        // Just accumulate progress
        result = produce(result, (draft) => {
          const craftEntry = draft.workshop.crafts[def.name];
          if (craftEntry) craftEntry.progress = newProgress;
        });
      }
    }
    return result;
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

    // Start from the current state so earlier manager load replay (for example
    // science tech unlocks) is not clobbered by stale saved workshop flags.
    const workshop = state.workshop;

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
              typeof su.unlocked === "boolean"
                ? su.unlocked || (upgrades[name]?.unlocked ?? false)
                : (upgrades[name]?.unlocked ?? false),
            researched:
              typeof su.researched === "boolean" ? su.researched : (upgrades[name]?.researched ?? false),
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
              typeof sc.unlocked === "boolean"
                ? sc.unlocked || (crafts[name]?.unlocked ?? false)
                : (crafts[name]?.unlocked ?? false),
            engineers: typeof sc.engineers === "number" ? Math.max(0, sc.engineers) : (crafts[name]?.engineers ?? 0),
            progress: typeof sc.progress === "number" ? Math.max(0, sc.progress) : 0,
          };
        }
      }
    }

    // Legacy workshop.load() replays unlock chains for researched upgrades
    // after metadata is restored.
    for (const [name, entry] of Object.entries(upgrades)) {
      if (!entry.researched) continue;
      const def = UPGRADE_DEFS.find((upgrade) => upgrade.name === name);
      if (!def?.unlocks?.upgrades) continue;
      for (const unlockName of def.unlocks.upgrades) {
        const unlockEntry = upgrades[unlockName];
        if (unlockEntry && !unlockEntry.unlocked) {
          upgrades[unlockName] = { ...unlockEntry, unlocked: true };
        }
      }
    }

    return { ...state, workshop: { upgrades, crafts } };
  }

  resetState(state: GameState): GameState {
    return { ...state, workshop: createInitialWorkshop() };
  }
}
