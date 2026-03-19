import type { Serializable } from "@kittens/shared";
import { type Draft, produce } from "immer";
import type { Manager } from "./manager.js";
import type { GameState } from "./state.js";

// ── Price entry (shared with buildings) ───────────────────────────────────────

export interface SciencePriceEntry {
  readonly name: string;
  readonly val: number;
}

// ── Tech unlock shape ─────────────────────────────────────────────────────────

export interface TechUnlocks {
  readonly tech?: readonly string[];
  readonly policies?: readonly string[];
  /** Buildings unlocked by this tech (cross-domain, recorded but not processed yet). */
  readonly buildings?: readonly string[];
  /** Jobs unlocked by this tech (cross-domain, recorded but not processed yet). */
  readonly jobs?: readonly string[];
  /** Upgrades unlocked by this tech (cross-domain, recorded but not processed yet). */
  readonly upgrades?: readonly string[];
  /** Crafts unlocked by this tech (cross-domain, recorded but not processed yet). */
  readonly crafts?: readonly string[];
  /** Tabs unlocked by this tech (cross-domain, recorded but not processed yet). */
  readonly tabs?: readonly string[];
}

// ── TechDef ───────────────────────────────────────────────────────────────────

export interface TechDef {
  readonly name: string;
  readonly prices: readonly SciencePriceEntry[];
  readonly effects?: Record<string, number>;
  readonly unlocks?: TechUnlocks;
}

// ── PolicyDef ─────────────────────────────────────────────────────────────────

export interface PolicyUnlocks {
  readonly policies?: readonly string[];
  /** Other cross-domain unlock lists — recorded but not processed in this epic. */
  readonly buildings?: readonly string[];
  readonly upgrades?: readonly string[];
}

export interface PolicyDef {
  readonly name: string;
  readonly prices: readonly SciencePriceEntry[];
  readonly effects?: Record<string, number>;
  readonly blocks: readonly string[];
  readonly unlocks?: PolicyUnlocks;
}

// ── State types ───────────────────────────────────────────────────────────────

export interface TechEntry {
  readonly unlocked: boolean;
  readonly researched: boolean;
}

export interface PolicyEntry {
  readonly unlocked: boolean;
  readonly blocked: boolean;
  readonly researched: boolean;
}

export interface ScienceState {
  readonly techs: Record<string, TechEntry>;
  readonly policies: Record<string, PolicyEntry>;
}

// ── Static tech definitions ───────────────────────────────────────────────────
// Port of legacy/js/science.js techs[] array.

export const TECH_DEFS: readonly TechDef[] = [
  {
    name: "calendar",
    prices: [{ name: "science", val: 30 }],
    unlocks: { tech: ["agriculture"], tabs: ["time"] },
  },
  {
    name: "agriculture",
    prices: [{ name: "science", val: 100 }],
    unlocks: {
      buildings: ["barn"],
      jobs: ["farmer"],
      tech: ["mining", "archery"],
      tabs: ["queue"],
    },
  },
  {
    name: "archery",
    prices: [{ name: "science", val: 300 }],
    unlocks: {
      buildings: ["zebraOutpost", "zebraWorkshop", "zebraForge"],
      jobs: ["hunter"],
      tech: ["animal"],
    },
  },
  {
    name: "mining",
    prices: [{ name: "science", val: 500 }],
    unlocks: {
      buildings: ["mine", "workshop"],
      tech: ["metal"],
      upgrades: ["bolas"],
    },
  },
  {
    name: "metal",
    prices: [{ name: "science", val: 900 }],
    unlocks: { buildings: ["smelter"], upgrades: ["huntingArmor"] },
  },
  {
    name: "animal",
    prices: [{ name: "science", val: 500 }],
    unlocks: {
      buildings: ["pasture", "unicornPasture"],
      tech: ["civil", "math", "construction"],
    },
  },
  {
    name: "brewery",
    prices: [{ name: "science", val: 1200 }],
    // Not used anymore per legacy comment, but kept for data parity
  },
  {
    name: "civil",
    prices: [{ name: "science", val: 1500 }],
    unlocks: { tech: ["currency"] },
  },
  {
    name: "math",
    prices: [{ name: "science", val: 1000 }],
    unlocks: {
      tabs: ["stats"],
      buildings: ["academy"],
      upgrades: ["celestialMechanics"],
    },
  },
  {
    name: "construction",
    prices: [{ name: "science", val: 1300 }],
    effects: { queueCap: 1 },
    unlocks: {
      buildings: ["logHouse", "warehouse", "lumberMill", "ziggurat"],
      tech: ["engineering"],
      upgrades: ["compositeBow", "advancedRefinement", "reinforcedSaw"],
    },
  },
  {
    name: "engineering",
    prices: [{ name: "science", val: 1500 }],
    unlocks: {
      buildings: ["aqueduct"],
      tech: ["writing"],
      policies: ["stripMining", "clearCutting", "environmentalism"],
    },
  },
  {
    name: "currency",
    prices: [{ name: "science", val: 2200 }],
    unlocks: {
      buildings: ["tradepost"],
      policies: ["diplomacy", "isolationism"],
      upgrades: ["goldOre"],
    },
  },
  {
    name: "writing",
    prices: [{ name: "science", val: 3600 }],
    unlocks: {
      buildings: ["amphitheatre"],
      tech: ["philosophy", "machinery", "steel"],
      policies: ["liberty", "tradition"],
      upgrades: ["register"],
      crafts: ["parchment"],
    },
  },
  {
    name: "philosophy",
    prices: [{ name: "science", val: 9500 }],
    unlocks: {
      buildings: ["temple"],
      tech: ["theology"],
      policies: ["stoicism", "epicurianism"],
      crafts: ["compedium"],
    },
  },
  {
    name: "machinery",
    prices: [{ name: "science", val: 15000 }],
    unlocks: {
      buildings: ["steamworks"],
      upgrades: ["printingPress", "factoryAutomation", "crossbow"],
    },
  },
  {
    name: "steel",
    prices: [{ name: "science", val: 12000 }],
    unlocks: {
      upgrades: [
        "deepMining",
        "coalFurnace",
        "combustionEngine",
        "reinforcedWarehouses",
        "steelAxe",
        "steelArmor",
      ],
      crafts: ["steel"],
    },
  },
  {
    name: "theology",
    prices: [
      { name: "science", val: 20000 },
      { name: "manuscript", val: 35 },
    ],
    unlocks: { jobs: ["priest"], tech: ["astronomy", "cryptotheology"] },
  },
  {
    name: "astronomy",
    prices: [
      { name: "science", val: 28000 },
      { name: "manuscript", val: 65 },
    ],
    unlocks: {
      buildings: ["observatory"],
      tech: ["navigation"],
      policies: ["knowledgeSharing", "culturalExchange", "bigStickPolicy", "cityOnAHill"],
    },
  },
  {
    name: "navigation",
    prices: [
      { name: "science", val: 35000 },
      { name: "manuscript", val: 100 },
    ],
    unlocks: {
      buildings: ["harbor"],
      tech: ["physics", "archeology", "architecture"],
      upgrades: ["caravanserai", "cargoShips", "astrolabe", "titaniumMirrors", "titaniumAxe"],
      crafts: ["ship"],
    },
  },
  {
    name: "architecture",
    prices: [
      { name: "science", val: 42000 },
      { name: "compedium", val: 10 },
    ],
    unlocks: { buildings: ["mansion", "mint"], tech: ["acoustics"] },
  },
  {
    name: "physics",
    prices: [
      { name: "science", val: 50000 },
      { name: "compedium", val: 35 },
    ],
    unlocks: {
      tech: ["chemistry", "electricity", "metaphysics"],
      upgrades: ["pneumaticPress", "pyrolysis", "steelSaw"],
      crafts: ["blueprint"],
    },
  },
  {
    name: "metaphysics",
    prices: [
      { name: "unobtainium", val: 5 },
      { name: "science", val: 55000 },
    ],
  },
  {
    name: "chemistry",
    prices: [
      { name: "science", val: 60000 },
      { name: "compedium", val: 50 },
    ],
    unlocks: {
      buildings: ["calciner", "oilWell"],
      upgrades: ["alloyAxe", "alloyArmor", "alloyWarehouses", "alloyBarns"],
      crafts: ["alloy"],
    },
  },
  {
    name: "acoustics",
    prices: [
      { name: "science", val: 60000 },
      { name: "compedium", val: 60 },
    ],
    unlocks: { buildings: ["chapel"], tech: ["drama"] },
  },
  {
    name: "drama",
    prices: [
      { name: "science", val: 90000 },
      { name: "parchment", val: 5000 },
    ],
    unlocks: { buildings: ["brewery"] },
  },
  {
    name: "archeology",
    prices: [
      { name: "science", val: 65000 },
      { name: "compedium", val: 65 },
    ],
    unlocks: {
      buildings: ["quarry"],
      jobs: ["geologist"],
      tech: ["biology"],
      upgrades: ["geodesy"],
    },
  },
  {
    name: "electricity",
    prices: [
      { name: "science", val: 75000 },
      { name: "compedium", val: 85 },
    ],
    unlocks: { buildings: ["magneto"], tech: ["industrialization"] },
  },
  {
    name: "biology",
    prices: [
      { name: "science", val: 85000 },
      { name: "compedium", val: 100 },
    ],
    unlocks: { buildings: ["biolab"], tech: ["biochemistry"] },
  },
  {
    name: "biochemistry",
    prices: [
      { name: "science", val: 145000 },
      { name: "compedium", val: 500 },
    ],
    unlocks: { tech: ["genetics"], upgrades: ["biofuel"] },
  },
  {
    name: "genetics",
    prices: [
      { name: "science", val: 190000 },
      { name: "compedium", val: 1500 },
    ],
    unlocks: { upgrades: ["unicornSelection", "gmo"] },
  },
  {
    name: "industrialization",
    prices: [
      { name: "science", val: 100000 },
      { name: "blueprint", val: 25 },
    ],
    unlocks: {
      tech: ["mechanization", "metalurgy", "combustion"],
      upgrades: ["barges", "advancedAutomation", "logistics"],
      policies: ["sustainability", "fullIndustrialization"],
    },
  },
  {
    name: "mechanization",
    prices: [
      { name: "science", val: 115000 },
      { name: "blueprint", val: 45 },
    ],
    unlocks: {
      buildings: ["factory"],
      jobs: ["engineer"],
      tech: ["electronics"],
      upgrades: ["pumpjack", "strenghtenBuild"],
      crafts: ["concrate"],
    },
  },
  {
    name: "metalurgy",
    prices: [
      { name: "science", val: 125000 },
      { name: "blueprint", val: 60 },
    ],
    unlocks: { upgrades: ["electrolyticSmelting", "oxidation", "miningDrill"] },
  },
  {
    name: "combustion",
    prices: [
      { name: "science", val: 115000 },
      { name: "blueprint", val: 45 },
    ],
    unlocks: { tech: ["ecology"], upgrades: ["offsetPress", "fuelInjectors", "oilRefinery"] },
  },
  {
    name: "ecology",
    prices: [
      { name: "science", val: 125000 },
      { name: "blueprint", val: 55 },
    ],
    unlocks: { upgrades: ["carbonSequestration"], policies: ["conservation", "openWoodlands"] },
  },
  {
    name: "electronics",
    prices: [
      { name: "science", val: 135000 },
      { name: "blueprint", val: 70 },
    ],
    unlocks: {
      tech: ["nuclearFission", "rocketry", "robotics"],
      upgrades: [
        "cadSystems",
        "refrigeration",
        "seti",
        "factoryLogistics",
        "factoryOptimization",
        "internet",
      ],
    },
  },
  {
    name: "robotics",
    prices: [
      { name: "science", val: 140000 },
      { name: "blueprint", val: 80 },
    ],
    unlocks: {
      tech: ["ai"],
      upgrades: ["steelPlants", "rotaryKiln", "assistance", "factoryRobotics"],
      crafts: ["tanker"],
    },
  },
  {
    name: "ai",
    prices: [
      { name: "science", val: 250000 },
      { name: "blueprint", val: 150 },
    ],
    unlocks: {
      buildings: ["aiCore"],
      tech: ["quantumCryptography"],
      upgrades: ["neuralNetworks", "aiEngineers", "machineLearning"],
    },
  },
  {
    name: "quantumCryptography",
    prices: [
      { name: "science", val: 1250000 },
      { name: "relic", val: 1024 },
    ],
    unlocks: { tech: ["blackchain"] },
  },
  {
    name: "blackchain",
    prices: [
      { name: "science", val: 5000000 },
      { name: "relic", val: 4096 },
    ],
    unlocks: { upgrades: ["invisibleBlackHand"] },
  },
  {
    name: "nuclearFission",
    prices: [
      { name: "science", val: 150000 },
      { name: "blueprint", val: 100 },
    ],
    unlocks: {
      buildings: ["reactor"],
      tech: ["nanotechnology", "particlePhysics"],
      upgrades: ["reactorVessel", "nuclearSmelters"],
    },
  },
  {
    name: "rocketry",
    prices: [
      { name: "science", val: 175000 },
      { name: "blueprint", val: 125 },
    ],
    unlocks: {
      tabs: ["space"],
      tech: ["sattelites", "oilProcessing"],
      upgrades: ["oilDistillation"],
    },
  },
  {
    name: "oilProcessing",
    prices: [
      { name: "science", val: 215000 },
      { name: "blueprint", val: 150 },
    ],
    unlocks: { upgrades: ["factoryProcessing"], crafts: ["kerosene"] },
  },
  {
    name: "sattelites",
    prices: [
      { name: "science", val: 190000 },
      { name: "blueprint", val: 125 },
    ],
    unlocks: {
      tech: ["orbitalEngineering"],
      upgrades: ["photolithography", "orbitalGeodesy", "uplink", "thinFilm"],
      policies: ["outerSpaceTreaty", "militarizeSpace"],
    },
  },
  {
    name: "orbitalEngineering",
    prices: [
      { name: "science", val: 250000 },
      { name: "blueprint", val: 250 },
    ],
    unlocks: {
      tech: ["exogeology", "thorium"],
      upgrades: [
        "hubbleTelescope",
        "satelliteRadio",
        "astrophysicists",
        "solarSatellites",
        "spaceEngineers",
        "starlink",
      ],
    },
  },
  {
    name: "thorium",
    prices: [
      { name: "science", val: 375000 },
      { name: "blueprint", val: 375 },
    ],
    unlocks: { upgrades: ["thoriumReactors", "thoriumEngine", "qdot"], crafts: ["thorium"] },
  },
  {
    name: "exogeology",
    prices: [
      { name: "science", val: 275000 },
      { name: "blueprint", val: 250 },
    ],
    unlocks: {
      tech: ["advExogeology"],
      upgrades: [
        "unobtainiumReflectors",
        "unobtainiumHuts",
        "unobtainiumDrill",
        "hydroPlantTurbines",
        "storageBunkers",
      ],
    },
  },
  {
    name: "advExogeology",
    prices: [
      { name: "science", val: 325000 },
      { name: "blueprint", val: 350 },
    ],
    unlocks: {
      upgrades: ["eludiumCracker", "eludiumReflectors", "eludiumHuts", "mWReactor"],
      crafts: ["eludium"],
    },
  },
  {
    name: "nanotechnology",
    prices: [
      { name: "science", val: 200000 },
      { name: "blueprint", val: 150 },
    ],
    unlocks: {
      tech: ["superconductors"],
      upgrades: ["augumentation", "nanosuits", "photovoltaic", "fluidizedReactors"],
    },
  },
  {
    name: "superconductors",
    prices: [
      { name: "science", val: 225000 },
      { name: "blueprint", val: 175 },
    ],
    unlocks: {
      tech: ["antimatter"],
      upgrades: ["coldFusion", "spaceManufacturing", "cryocomputing"],
    },
  },
  {
    name: "antimatter",
    prices: [
      { name: "science", val: 500000 },
      { name: "relic", val: 1 },
    ],
    unlocks: {
      tech: ["terraformation"],
      upgrades: ["amReactors", "amBases", "amDrive", "amFission"],
    },
  },
  {
    name: "terraformation",
    prices: [
      { name: "science", val: 750000 },
      { name: "relic", val: 5 },
    ],
    unlocks: { tech: ["hydroponics"] },
  },
  {
    name: "hydroponics",
    prices: [
      { name: "science", val: 1000000 },
      { name: "relic", val: 25 },
    ],
    unlocks: { tech: ["exogeophysics"] },
  },
  {
    name: "exogeophysics",
    prices: [
      { name: "science", val: 25000000 },
      { name: "relic", val: 500 },
    ],
  },
  {
    name: "particlePhysics",
    prices: [
      { name: "science", val: 185000 },
      { name: "blueprint", val: 135 },
    ],
    unlocks: {
      buildings: ["accelerator"],
      tech: ["chronophysics", "dimensionalPhysics"],
      upgrades: ["enrichedUranium", "railgun"],
    },
  },
  {
    name: "dimensionalPhysics",
    prices: [{ name: "science", val: 235000 }],
    unlocks: { upgrades: ["energyRifts", "lhc"] },
  },
  {
    name: "artificialGravity",
    prices: [{ name: "science", val: 320000 }],
    unlocks: { upgrades: ["spiceNavigation", "longRangeSpaceships"] },
  },
  {
    name: "chronophysics",
    prices: [
      { name: "science", val: 250000 },
      { name: "timeCrystal", val: 5 },
    ],
    unlocks: {
      buildings: ["chronosphere"],
      tech: ["tachyonTheory"],
      upgrades: ["stasisChambers", "fluxCondensator"],
    },
  },
  {
    name: "tachyonTheory",
    prices: [
      { name: "science", val: 750000 },
      { name: "timeCrystal", val: 25 },
      { name: "relic", val: 1 },
    ],
    unlocks: {
      tech: ["voidSpace"],
      upgrades: ["tachyonAccelerators", "chronoforge", "chronoEngineers"],
    },
  },
  {
    name: "cryptotheology",
    prices: [
      { name: "science", val: 650000 },
      { name: "relic", val: 5 },
    ],
    unlocks: { upgrades: ["relicStation"] },
  },
  {
    name: "voidSpace",
    prices: [
      { name: "science", val: 800000 },
      { name: "timeCrystal", val: 30 },
      { name: "void", val: 100 },
    ],
    unlocks: { tech: ["paradoxalKnowledge"], upgrades: ["voidAspiration"] },
  },
  {
    name: "paradoxalKnowledge",
    prices: [
      { name: "science", val: 1000000 },
      { name: "timeCrystal", val: 40 },
      { name: "void", val: 250 },
    ],
    unlocks: { upgrades: ["distorsion"] },
  },
];

// ── Static policy definitions ─────────────────────────────────────────────────
// Port of legacy/js/science.js policies[] array (static effects only).

export const POLICY_DEFS: readonly PolicyDef[] = [
  {
    name: "liberty",
    prices: [{ name: "culture", val: 150 }],
    effects: { maxKittens: 1, happinessKittenProductionRatio: 0.1 },
    blocks: ["tradition"],
    unlocks: { policies: ["authocracy", "republic"] },
  },
  {
    name: "tradition",
    prices: [{ name: "culture", val: 150 }],
    effects: {
      cultureFromManuscripts: 1,
      manuscriptParchmentCost: -5,
      manuscriptCultureCost: -100,
    },
    blocks: ["liberty"],
    unlocks: { policies: ["authocracy", "monarchy"] },
  },
  {
    name: "monarchy",
    prices: [{ name: "culture", val: 1500 }],
    effects: { goldPolicyRatio: -0.1 },
    blocks: ["authocracy", "republic", "communism"],
    unlocks: { policies: ["liberalism", "fascism"] },
  },
  {
    name: "authocracy",
    prices: [{ name: "culture", val: 1500 }],
    effects: { rankLeaderBonusConversion: 0 },
    blocks: ["monarchy", "republic", "liberalism"],
    unlocks: { policies: ["communism", "fascism", "socialism"] },
  },
  {
    name: "republic",
    prices: [{ name: "culture", val: 1500 }],
    effects: { boostFromLeader: 0.01 },
    blocks: ["monarchy", "authocracy", "fascism"],
    unlocks: { policies: ["liberalism", "communism", "socialism"] },
  },
  {
    name: "socialism",
    prices: [{ name: "culture", val: 7500 }],
    effects: {},
    blocks: [],
    unlocks: { policies: ["scientificCommunism"] },
  },
  {
    name: "scientificCommunism",
    prices: [{ name: "culture", val: 8500 }],
    effects: {},
    blocks: [],
  },
  {
    name: "liberalism",
    prices: [{ name: "culture", val: 15000 }],
    effects: { goldCostReduction: 0.2, globalRelationsBonus: 10 },
    blocks: ["communism", "fascism"],
  },
  {
    name: "communism",
    prices: [{ name: "culture", val: 15000 }],
    effects: {
      factoryCostReduction: 0.3,
      coalPolicyRatio: 0.25,
      ironPolicyRatio: 0.25,
      titaniumPolicyRatio: 0.25,
    },
    blocks: ["liberalism", "fascism"],
  },
  {
    name: "fascism",
    prices: [{ name: "culture", val: 15000 }],
    effects: { logHouseCostReduction: 0.5 },
    blocks: ["liberalism", "communism"],
  },
  {
    name: "technocracy",
    prices: [{ name: "culture", val: 150000 }],
    effects: { technocracyScienceCap: 0.2, antimatterPolicyRatio: 0.0625, queueCap: 2 },
    blocks: ["theocracy", "expansionism"],
  },
  {
    name: "theocracy",
    prices: [{ name: "culture", val: 150000 }],
    effects: { faithPolicyRatio: 0.2 },
    blocks: ["technocracy", "expansionism"],
  },
  {
    name: "expansionism",
    prices: [{ name: "culture", val: 150000 }],
    effects: { unobtainiumPolicyRatio: 0.15 },
    blocks: ["technocracy", "theocracy"],
  },
  {
    name: "transkittenism",
    prices: [{ name: "culture", val: 1500000 }],
    effects: { aiCoreProductivness: 1, aiCoreUpgradeBonus: 0.1 },
    blocks: ["necrocracy", "radicalXenophobia"],
  },
  {
    name: "necrocracy",
    prices: [{ name: "culture", val: 1500000 }],
    effects: { blsProductionBonus: 0.001, leviathansEnergyModifier: 0.05 },
    blocks: ["transkittenism", "radicalXenophobia"],
  },
  {
    name: "radicalXenophobia",
    prices: [{ name: "culture", val: 1500000 }],
    effects: { mausoleumBonus: 1, pactsAvailable: 5 },
    blocks: ["transkittenism", "necrocracy"],
    unlocks: { policies: ["feedingFrenzy"] },
  },
  {
    name: "diplomacy",
    prices: [{ name: "culture", val: 1600 }],
    effects: { tradeCatpowerDiscount: 5 },
    blocks: ["isolationism"],
    unlocks: { policies: ["knowledgeSharing", "culturalExchange"] },
  },
  {
    name: "isolationism",
    prices: [{ name: "culture", val: 1600 }],
    effects: { tradeGoldDiscount: 1 },
    blocks: ["diplomacy"],
    unlocks: { policies: ["bigStickPolicy", "cityOnAHill"] },
  },
  {
    name: "zebraRelationsAppeasement",
    prices: [{ name: "culture", val: 5000 }],
    effects: { goldPolicyRatio: -0.05, zebraRelationModifier: 15 },
    blocks: ["zebraRelationsBellicosity"],
  },
  {
    name: "zebraRelationsBellicosity",
    prices: [{ name: "culture", val: 5000 }],
    effects: { nonZebraRelationModifier: 5, zebraRelationModifier: -10 },
    blocks: ["zebraRelationsAppeasement"],
  },
  {
    name: "knowledgeSharing",
    prices: [{ name: "culture", val: 4000 }],
    effects: { sciencePolicyRatio: 0.05 },
    blocks: ["culturalExchange"],
  },
  {
    name: "culturalExchange",
    prices: [{ name: "culture", val: 4000 }],
    effects: { culturePolicyRatio: 0.05 },
    blocks: ["knowledgeSharing"],
  },
  {
    name: "bigStickPolicy",
    prices: [{ name: "culture", val: 4000 }],
    effects: { embassyCostReduction: 0.15 },
    blocks: ["cityOnAHill"],
  },
  {
    name: "cityOnAHill",
    prices: [{ name: "culture", val: 4000 }],
    effects: { onAHillCultureCap: 0.05 },
    blocks: ["bigStickPolicy"],
  },
  {
    name: "outerSpaceTreaty",
    prices: [{ name: "culture", val: 10000 }],
    effects: {},
    blocks: ["militarizeSpace"],
  },
  {
    name: "militarizeSpace",
    prices: [{ name: "culture", val: 10000 }],
    effects: {},
    blocks: ["outerSpaceTreaty"],
  },
  {
    name: "stoicism",
    prices: [{ name: "culture", val: 2500 }],
    effects: { luxuryDemandRatio: -0.5, breweryConsumptionRatio: -0.25 },
    blocks: ["epicurianism"],
    unlocks: { policies: ["rationality", "mysticism", "rationing", "frugality"] },
  },
  {
    name: "epicurianism",
    prices: [{ name: "culture", val: 2500 }],
    effects: { luxuryHappinessBonus: 1 },
    blocks: ["stoicism"],
    unlocks: { policies: ["rationality", "mysticism", "carnivale", "extravagance"] },
  },
  {
    name: "carnivale",
    prices: [{ name: "culture", val: 3500 }],
    effects: { festivalArrivalRatio: 0.3, festivalLuxuryConsumptionRatio: 0.3 },
    blocks: ["extravagance"],
  },
  {
    name: "extravagance",
    prices: [{ name: "culture", val: 3500 }],
    effects: { luxuryDemandRatio: 2, consumableLuxuryHappiness: 5 },
    blocks: ["carnivale"],
  },
  {
    name: "rationing",
    prices: [{ name: "culture", val: 3500 }],
    effects: { hapinnessConsumptionRatio: -0.1, hunterRatio: 0.1 },
    blocks: ["frugality"],
  },
  {
    name: "frugality",
    prices: [{ name: "culture", val: 3500 }],
    effects: { mintRatio: 0.1 },
    blocks: ["rationing"],
  },
  {
    name: "rationality",
    prices: [{ name: "culture", val: 3000 }],
    effects: { sciencePolicyRatio: 0.05, ironPolicyRatio: 0.05 },
    blocks: ["mysticism"],
  },
  {
    name: "mysticism",
    prices: [{ name: "culture", val: 3000 }],
    effects: { culturePolicyRatio: 0.05, faithPolicyRatio: 0.05 },
    blocks: ["rationality"],
  },
  {
    name: "stripMining",
    prices: [{ name: "science", val: 2000 }],
    effects: { environmentUnhappiness: -2, mineralsPolicyRatio: 0.3 },
    blocks: ["environmentalism"],
  },
  {
    name: "clearCutting",
    prices: [{ name: "science", val: 2000 }],
    effects: { woodPolicyRatio: 0.2, environmentUnhappiness: -2 },
    blocks: ["environmentalism"],
  },
  {
    name: "environmentalism",
    prices: [{ name: "science", val: 2000 }],
    effects: { catnipRatio: 0.05 },
    blocks: ["stripMining", "clearCutting"],
  },
  {
    name: "conservation",
    prices: [{ name: "science", val: 5000 }],
    effects: { catnipRatio: 0.1 },
    blocks: ["openWoodlands"],
  },
  {
    name: "openWoodlands",
    prices: [{ name: "science", val: 5000 }],
    effects: { woodPolicyRatio: 0.1 },
    blocks: ["conservation"],
  },
  {
    name: "sustainability",
    prices: [{ name: "culture", val: 25000 }],
    effects: { oilPolicyRatio: 0.1 },
    blocks: ["fullIndustrialization"],
  },
  {
    name: "fullIndustrialization",
    prices: [{ name: "culture", val: 25000 }],
    effects: { coalPolicyRatio: 0.2, oilPolicyRatio: 0.1 },
    blocks: ["sustainability"],
  },
  // Diplomatic relations policies (isRelation) — effects may be dynamic (calculateEffects)
  // Included with static effects or empty for those that are fully dynamic
  {
    name: "dragonRelationsAstrologers",
    prices: [{ name: "culture", val: 30000 }],
    effects: { starEventChance: 0.004, starchartPolicyRatio: 0.03 },
    blocks: ["dragonRelationsPhysicists", "dragonRelationsDynamicists"],
  },
  {
    name: "dragonRelationsPhysicists",
    prices: [{ name: "culture", val: 30000 }],
    effects: { reactorEnergyRatio: 0.25, harborLimitRatioPolicy: 0.05 },
    blocks: ["dragonRelationsAstrologers", "dragonRelationsDynamicists"],
  },
  {
    name: "dragonRelationsDynamicists",
    prices: [{ name: "culture", val: 30000 }],
    effects: { tradeCatpowerDiscount: 5, huntCatpowerDiscount: 10, catpowerReductionRatio: 0.5 },
    blocks: ["dragonRelationsPhysicists", "dragonRelationsAstrologers"],
  },
  {
    name: "lizardRelationsEcologists",
    prices: [{ name: "culture", val: 10000 }],
    effects: {},
    blocks: ["lizardRelationsGeologists", "lizardRelationsEngineeers"],
  },
  {
    name: "lizardRelationsGeologists",
    prices: [{ name: "culture", val: 10000 }],
    effects: {},
    blocks: ["lizardRelationsEcologists", "lizardRelationsEngineeers"],
  },
  {
    name: "lizardRelationsEngineeers",
    prices: [{ name: "culture", val: 10000 }],
    effects: {},
    blocks: ["lizardRelationsEcologists", "lizardRelationsGeologists"],
  },
  {
    name: "sharkRelationsRaiders",
    prices: [{ name: "culture", val: 12000 }],
    effects: {},
    blocks: ["sharkRelationsScientists", "sharkRelationsSmugglers"],
  },
  {
    name: "sharkRelationsScientists",
    prices: [{ name: "culture", val: 12000 }],
    effects: {},
    blocks: ["sharkRelationsRaiders", "sharkRelationsSmugglers"],
  },
  {
    name: "sharkRelationsSmugglers",
    prices: [{ name: "culture", val: 12000 }],
    effects: {},
    blocks: ["sharkRelationsRaiders", "sharkRelationsScientists"],
  },
  {
    name: "griffinRelationsMetallurgists",
    prices: [{ name: "culture", val: 16000 }],
    effects: { calcinerSteelRatioBonus: 0.15 },
    blocks: ["griffinRelationsMachinists", "griffinRelationsScouts"],
  },
  {
    name: "griffinRelationsScouts",
    prices: [{ name: "culture", val: 16000 }],
    effects: { hunterRatio: 0.5 },
    blocks: ["griffinRelationsMachinists", "griffinRelationsMetallurgists"],
  },
  {
    name: "griffinRelationsMachinists",
    prices: [{ name: "culture", val: 16000 }],
    effects: { magnetoBoostBonusPolicy: 0.005 },
    blocks: ["griffinRelationsMetallurgists", "griffinRelationsScouts"],
  },
  {
    name: "nagaRelationsMasons",
    prices: [{ name: "culture", val: 8000 }],
    effects: { quarrySlabCraftBonus: 0.025 },
    blocks: ["nagaRelationsCultists", "nagaRelationsArchitects"],
  },
  {
    name: "nagaRelationsCultists",
    prices: [{ name: "culture", val: 8000 }],
    effects: { zigguratTempleEffectPolicy: 0.1 },
    blocks: ["nagaRelationsMasons", "nagaRelationsArchitects"],
  },
  {
    name: "nagaRelationsArchitects",
    prices: [{ name: "culture", val: 8000 }],
    effects: { nagaBlueprintTradeChance: 0, blueprintCraftRatio: 0 },
    blocks: ["nagaRelationsMasons", "nagaRelationsCultists"],
  },
  {
    name: "spiderRelationsGeologists",
    prices: [{ name: "culture", val: 20000 }],
    effects: { mineralsPolicyRatio: 0, coalPolicyRatio: 0, goldPolicyRatio: 0 },
    blocks: ["spiderRelationsChemists", "spiderRelationsPaleontologists"],
  },
  {
    name: "spiderRelationsChemists",
    prices: [{ name: "culture", val: 20000 }],
    effects: {},
    blocks: ["spiderRelationsGeologists", "spiderRelationsPaleontologists"],
  },
  {
    name: "spiderRelationsPaleontologists",
    prices: [{ name: "culture", val: 20000 }],
    effects: { mintIvoryRatio: 0.15, oilPolicyRatio: 0.1 },
    blocks: ["spiderRelationsChemists", "spiderRelationsGeologists"],
  },
  // Placeholder for feedingFrenzy (referenced by radicalXenophobia unlocks)
  {
    name: "feedingFrenzy",
    prices: [{ name: "culture", val: 500000 }],
    effects: {},
    blocks: [],
  },
];

// ── Factory ───────────────────────────────────────────────────────────────────

export function createInitialScience(): ScienceState {
  const techs: Record<string, TechEntry> = {};
  for (const def of TECH_DEFS) {
    techs[def.name] = { unlocked: def.name === "calendar", researched: false };
  }

  const policies: Record<string, PolicyEntry> = {};
  for (const def of POLICY_DEFS) {
    policies[def.name] = { unlocked: false, blocked: false, researched: false };
  }

  return { techs, policies };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Check if the player can afford the given prices from the current resource pool. */
function canAffordPrices(
  prices: readonly SciencePriceEntry[],
  resources: GameState["resources"],
): boolean {
  for (const price of prices) {
    const entry = resources[price.name];
    if (!entry || entry.value < price.val) return false;
  }
  return true;
}

/** Deduct prices from a draft resource map (for use inside produce). */
function deductPricesInDraft(
  prices: readonly SciencePriceEntry[],
  resources: Draft<GameState["resources"]>,
): void {
  for (const price of prices) {
    const entry = resources[price.name];
    if (entry) {
      entry.value -= price.val;
    }
  }
}

// ── Action helpers (used by actions.ts) ──────────────────────────────────────

/**
 * Apply a RESEARCH action: research a technology.
 * Port of legacy ScienceManager research purchase flow.
 */
export function applyResearch(state: GameState, techName: string): GameState {
  const def = TECH_DEFS.find((t) => t.name === techName);
  if (!def) return state;

  const entry = state.science.techs[techName];
  if (!entry || !entry.unlocked || entry.researched) return state;

  if (!canAffordPrices(def.prices, state.resources)) return state;

  return produce(state, (draft) => {
    deductPricesInDraft(def.prices, draft.resources);

    // Mark researched
    const tech = draft.science.techs[techName];
    if (tech) {
      tech.researched = true;
    }

    // Apply tech unlocks (unlock further techs and policies)
    if (def.unlocks?.tech) {
      for (const unlockName of def.unlocks.tech) {
        const unlockEntry = draft.science.techs[unlockName];
        if (unlockEntry && !unlockEntry.unlocked) {
          unlockEntry.unlocked = true;
        }
      }
    }
    if (def.unlocks?.policies) {
      for (const policyName of def.unlocks.policies) {
        const policyEntry = draft.science.policies[policyName];
        if (policyEntry && !policyEntry.unlocked) {
          policyEntry.unlocked = true;
        }
      }
    }
  });
}

/**
 * Apply a RESEARCH_POLICY action: research a policy.
 * Port of legacy PolicyBtnController.buyItem / onPurchase.
 */
export function applyResearchPolicy(state: GameState, policyName: string): GameState {
  const def = POLICY_DEFS.find((p) => p.name === policyName);
  if (!def) return state;

  const entry = state.science.policies[policyName];
  if (!entry || !entry.unlocked || entry.blocked || entry.researched) return state;

  if (!canAffordPrices(def.prices, state.resources)) return state;

  return produce(state, (draft) => {
    deductPricesInDraft(def.prices, draft.resources);

    // Mark researched
    const policy = draft.science.policies[policyName];
    if (policy) {
      policy.researched = true;
    }

    // Block competing policies
    for (const blockName of def.blocks) {
      const blockEntry = draft.science.policies[blockName];
      if (blockEntry && !blockEntry.blocked) {
        blockEntry.blocked = true;
      }
    }

    // Unlock downstream policies
    if (def.unlocks?.policies) {
      for (const unlockName of def.unlocks.policies) {
        const unlockEntry = draft.science.policies[unlockName];
        if (unlockEntry && !unlockEntry.unlocked) {
          unlockEntry.unlocked = true;
        }
      }
    }
  });
}

// ── ScienceManager ────────────────────────────────────────────────────────────

/**
 * Manages the science/tech tree state. No tick-driven update needed (techs
 * don't advance on their own). Effects of researched techs/policies are
 * contributed to the effectCache each tick via updateEffects().
 *
 * Port of legacy/js/science.js ScienceManager.
 */
export class ScienceManager implements Manager {
  update(state: GameState): GameState {
    // No autonomous tick-driven changes; research happens via actions
    return state;
  }

  /**
   * Sum all static effects from researched techs and researched policies.
   * Port of legacy updateEffectCached() summing pattern.
   */
  updateEffects(state: GameState): Record<string, number> {
    const effects: Record<string, number> = {};

    for (const def of TECH_DEFS) {
      const entry = state.science.techs[def.name];
      if (!entry?.researched || !def.effects) continue;
      for (const [key, val] of Object.entries(def.effects)) {
        effects[key] = (effects[key] ?? 0) + val;
      }
    }

    for (const def of POLICY_DEFS) {
      const entry = state.science.policies[def.name];
      if (!entry?.researched || !def.effects) continue;
      for (const [key, val] of Object.entries(def.effects)) {
        effects[key] = (effects[key] ?? 0) + val;
      }
    }

    return effects;
  }

  save(state: GameState): Serializable {
    return state.science as unknown as Serializable;
  }

  load(saved: Serializable, state: GameState): GameState {
    if (!saved || typeof saved !== "object" || Array.isArray(saved)) {
      return { ...state, science: createInitialScience() };
    }
    const raw = saved as Record<string, unknown>;

    // Start from initial state (ensures all defs are present)
    const science = createInitialScience();

    // Restore tech flags
    const techs = { ...science.techs };
    if (raw.techs && typeof raw.techs === "object" && !Array.isArray(raw.techs)) {
      const savedTechs = raw.techs as Record<string, unknown>;
      for (const name of Object.keys(techs)) {
        const saved = savedTechs[name];
        if (saved && typeof saved === "object" && !Array.isArray(saved)) {
          const s = saved as Record<string, unknown>;
          techs[name] = {
            unlocked:
              typeof s.unlocked === "boolean" ? s.unlocked : (techs[name]?.unlocked ?? false),
            researched: typeof s.researched === "boolean" ? s.researched : false,
          };
        }
      }
    }

    // Restore policy flags
    const policies = { ...science.policies };
    if (raw.policies && typeof raw.policies === "object" && !Array.isArray(raw.policies)) {
      const savedPolicies = raw.policies as Record<string, unknown>;
      for (const name of Object.keys(policies)) {
        const saved = savedPolicies[name];
        if (saved && typeof saved === "object" && !Array.isArray(saved)) {
          const s = saved as Record<string, unknown>;
          policies[name] = {
            unlocked: typeof s.unlocked === "boolean" ? s.unlocked : false,
            blocked: typeof s.blocked === "boolean" ? s.blocked : false,
            researched: typeof s.researched === "boolean" ? s.researched : false,
          };
        }
      }
    }

    return { ...state, science: { techs, policies } };
  }

  resetState(state: GameState): GameState {
    return { ...state, science: createInitialScience() };
  }
}
