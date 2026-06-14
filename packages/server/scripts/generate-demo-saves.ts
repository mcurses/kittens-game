/**
 * Generate 4 demo savestates at canonical game-loop stages, then write them to
 * packages/server/demo-saves/{early,mid,late,endgame}.json.
 *
 * Each save is built by starting from createInitialState(), seeding the slices
 * directly (immer-style), then ticking a few times so the effect cache,
 * resource caps, and per-tick rates settle. We do NOT simulate full gameplay
 * — that would take forever for endgame. The seeded state is what the player
 * sees on load; the engine handles consistency from there.
 *
 * Run with: bun packages/server/scripts/generate-demo-saves.ts
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  AchievementManager,
  BuildingManager,
  CalendarManager,
  ChallengeManager,
  DiplomacyManager,
  type GameState,
  type Manager,
  PrestigeManager,
  ReligionManager,
  ResourceManager,
  ScienceManager,
  type SerializedGameState,
  SpaceManager,
  TimeManager,
  VillageManager,
  WorkshopManager,
  createInitialState,
  serialize,
  tick,
} from "@kittens/engine";

// ── Manager pipeline (must mirror server/store.ts createManagers) ────────────

function createManagers(): readonly Manager[] {
  return [
    new ResourceManager(),
    new BuildingManager(),
    new VillageManager(),
    new CalendarManager(),
    new ScienceManager(),
    new WorkshopManager(),
    new ReligionManager(),
    new PrestigeManager(),
    new ChallengeManager(),
    new SpaceManager(),
    new DiplomacyManager(),
    new TimeManager(),
    new AchievementManager(),
  ];
}

// ── Tiny helpers ─────────────────────────────────────────────────────────────

function tickMany(state: GameState, managers: readonly Manager[], n: number): GameState {
  let cur = state;
  for (let i = 0; i < n; i++) cur = tick(cur, managers);
  return cur;
}

/** structuredClone + in-place mutation — script-only, doesn't need immer. */
function mutate(state: GameState, fn: (draft: GameState) => void): GameState {
  const next = structuredClone(state);
  fn(next);
  return next;
}

/** Mark a list of techs as researched + unlocked. */
function researchTechs(state: GameState, names: readonly string[]): GameState {
  return mutate(state, (draft) => {
    for (const name of names) {
      const t = draft.science.techs[name];
      if (t) {
        t.unlocked = true;
        t.researched = true;
      }
    }
  });
}

function researchPolicies(state: GameState, names: readonly string[]): GameState {
  return mutate(state, (draft) => {
    for (const name of names) {
      const p = draft.science.policies[name];
      if (p) {
        p.unlocked = true;
        p.researched = true;
      }
    }
  });
}

function purchaseUpgrades(state: GameState, names: readonly string[]): GameState {
  return mutate(state, (draft) => {
    for (const name of names) {
      const u = draft.workshop.upgrades[name];
      if (u) {
        u.unlocked = true;
        u.researched = true;
      }
    }
  });
}

/** Set building val + on (auto-mark unlocked + unlockable). */
function setBuildings(
  state: GameState,
  entries: Record<string, number>,
): GameState {
  return mutate(state, (draft) => {
    for (const [name, val] of Object.entries(entries)) {
      const cur = draft.buildings[name] ?? { val: 0, on: 0 };
      draft.buildings[name] = { ...cur, val, on: val, unlocked: true, unlockable: true };
    }
  });
}

function setResources(
  state: GameState,
  entries: Record<string, number>,
): GameState {
  return mutate(state, (draft) => {
    for (const [name, value] of Object.entries(entries)) {
      const cur = draft.resources[name] ?? { value: 0, maxValue: 0 };
      cur.value = value;
      // maxValue stays computed by the building manager via effect cache.
      draft.resources[name] = cur;
    }
  });
}

function setCalendar(state: GameState, year: number, season = 0, day = 0): GameState {
  return mutate(state, (draft) => {
    draft.calendar.year = year;
    draft.calendar.season = season;
    draft.calendar.day = day;
  });
}

function seedKittens(state: GameState, count: number, jobs: Record<string, number>): GameState {
  return mutate(state, (draft) => {
    draft.village.kittens = count;
    draft.village.happiness = 1.5;
    // Build a fresh sim of skeleton-shaped kittens; reanimateSkeletonKittens
    // in village.ts will give them deterministic names/traits/ages on load.
    const birthYear = draft.calendar.year - 10;
    const sim = Array.from({ length: count }, (_, i) => ({
      id: `k${i + 1}`,
      name: "Unknown",
      surname: "Unknown",
      age: 0,
      trait: "none" as const,
      job: null as string | null,
      skills: {},
      rank: 0,
      exp: 0,
      isFavorite: false,
      isLeader: false,
      birthYear,
      appearance: { breed: "tabby", body: "slim", eyes: "large-amber", accessory: null },
      originStory: "",
      traitFlavor: "",
      lifeEvents: [{ year: birthYear, kind: "spawn" as const, text: "Born in the village." }],
      portraitPath: null,
      motherId: null,
      fatherId: null,
      childIds: [],
    }));
    draft.village.sim = sim;
    // Job counter (kittens get bound to jobs by reanimateSkeletonKittens on load).
    draft.village.jobs = {};
    for (const [job, n] of Object.entries(jobs)) {
      draft.village.jobs[job] = { value: n };
    }
  });
}

// ── Stage generators ─────────────────────────────────────────────────────────

function generateEarly(): SerializedGameState {
  const managers = createManagers();
  let state = createInitialState();
  state = setCalendar(state, 1);
  state = setResources(state, {
    catnip: 500, wood: 200, minerals: 50,
  });
  state = setBuildings(state, { field: 8, hut: 2, library: 4 });
  state = researchTechs(state, ["calendar"]);
  state = seedKittens(state, 5, { farmer: 2, scholar: 1 });
  state = tickMany(state, managers, 5);
  return serialize(state);
}

function generateMid(): SerializedGameState {
  const managers = createManagers();
  let state = createInitialState();
  state = setCalendar(state, 15);
  state = setResources(state, {
    catnip: 5000, wood: 3000, minerals: 2000, iron: 500, gold: 50, coal: 100,
    science: 2000, culture: 200, faith: 50, catpower: 200, manpower: 100,
    furs: 100, ivory: 50, unicorns: 5,
  });
  state = setBuildings(state, {
    field: 40, pasture: 8, aqueduct: 4, hut: 20, logHouse: 5,
    library: 20, academy: 10, mine: 15, lumberMill: 10, barn: 12,
    warehouse: 6, amphitheatre: 4, brewery: 2, smelter: 5, workshop: 8,
    tradepost: 3, temple: 2, mint: 1,
  });
  state = researchTechs(state, [
    "calendar", "agriculture", "archery", "mining", "metal", "animal",
    "civil", "math", "construction", "engineering", "currency", "writing",
    "philosophy", "machinery", "steel",
  ]);
  state = researchPolicies(state, ["tradition", "diplomacy"]);
  state = purchaseUpgrades(state, [
    "mineralHoes", "ironHoes", "mineralAxes", "ironAxes", "stoneBarns",
    "reinforcedBarns", "reinforcedWarehouses", "compositeBow",
  ]);
  state = seedKittens(state, 30, {
    woodcutter: 5, farmer: 6, scholar: 5, hunter: 4, miner: 4, geologist: 2,
    priest: 2, engineer: 2,
  });
  state = mutate(state, (draft) => {
    if (draft.religion) {
      draft.religion.worship = 150;
      draft.religion.faithRatio = 0.5;
    }
  });
  state = tickMany(state, managers, 5);
  return serialize(state);
}

function generateLate(): SerializedGameState {
  const managers = createManagers();
  let state = createInitialState();
  state = setCalendar(state, 80);
  state = setResources(state, {
    catnip: 500_000, wood: 300_000, minerals: 200_000, iron: 50_000,
    coal: 10_000, gold: 5_000, titanium: 2_000, oil: 1_000,
    science: 200_000, culture: 50_000, faith: 5_000, catpower: 5_000,
    manpower: 100, furs: 10_000, ivory: 5_000, spice: 200,
    unicorns: 2_000, alicorn: 10, tears: 5, karma: 20,
    beam: 50_000, slab: 30_000, plate: 20_000, steel: 15_000, gear: 5_000,
    concrate: 8_000, alloy: 500, scaffold: 10_000, parchment: 30_000,
    manuscript: 5_000, compedium: 2_000, blueprint: 500, kerosene: 500,
    ship: 200, starchart: 5_000, paragon: 20, timeCrystal: 5,
  });
  state = setBuildings(state, {
    field: 200, pasture: 60, aqueduct: 40, hut: 60, logHouse: 100, mansion: 30,
    library: 80, academy: 60, observatory: 30, mine: 100, lumberMill: 80,
    smelter: 80, calciner: 10, steamworks: 20, magneto: 8,
    barn: 25, warehouse: 20, amphitheatre: 40, brewery: 15,
    workshop: 80, tradepost: 50, harbor: 60, quarry: 60,
    factory: 20, accelerator: 8, temple: 50, chapel: 30, unicornPasture: 5,
    chronosphere: 2, reactor: 5, oilWell: 30, mint: 5, ziggurat: 10,
  });
  state = researchTechs(state, [
    "calendar", "agriculture", "archery", "mining", "metal", "animal",
    "civil", "math", "construction", "engineering", "currency", "writing",
    "philosophy", "machinery", "steel", "theology", "astronomy",
    "navigation", "architecture", "physics", "metaphysics", "chemistry",
    "acoustics", "drama", "archeology", "electricity", "biology",
    "biochemistry", "genetics", "industrialization", "mechanization",
    "metalurgy", "combustion", "ecology", "electronics", "robotics",
    "nuclearFission", "rocketry", "oilProcessing", "sattelites",
    "orbitalEngineering",
  ]);
  state = researchPolicies(state, [
    "tradition", "monarchy", "expansionism", "diplomacy", "culturalExchange",
    "epicurianism", "extravagance",
  ]);
  state = purchaseUpgrades(state, [
    "mineralHoes", "ironHoes", "mineralAxes", "ironAxes", "steelAxe",
    "reinforcedSaw", "steelSaw", "stoneBarns", "reinforcedBarns",
    "reinforcedWarehouses", "compositeBow", "crossbow", "huntingArmor",
    "steelArmor", "caravanserai", "advancedRefinement", "geodesy",
    "register", "strenghtenBuild", "miningDrill", "coalFurnace",
    "deepMining", "pyrolysis", "electrolyticSmelting", "oxidation",
    "steelPlants", "ironwood", "concreteHuts", "silos", "refrigeration",
    "printingPress", "offsetPress", "pneumaticPress", "combustionEngine",
    "cargoShips", "barges", "factoryAutomation", "advancedAutomation",
    "factoryLogistics", "pumpjack", "biofuel", "gmo", "cadSystems",
    "logistics", "internet",
  ]);
  state = seedKittens(state, 120, {
    woodcutter: 15, farmer: 15, scholar: 25, hunter: 20, miner: 15,
    geologist: 10, priest: 12, engineer: 8,
  });
  state = mutate(state, (draft) => {
    if (draft.religion) {
      draft.religion.worship = 100_000;
      draft.religion.faithRatio = 50;
      draft.religion.transcendenceTier = 3;
      for (const name of ["unicornTomb", "ivoryTower", "ivoryCitadel"]) {
        draft.religion.zigguratUpgrades[name] = { val: 5, on: 5, unlocked: true };
      }
      for (const name of ["solarchant", "scholasticism", "goldenSpire"]) {
        draft.religion.religionUpgrades[name] = { val: 3, on: 3 };
      }
    }
    if (draft.prestige) {
      draft.prestige.perks["engeneering"] = { unlocked: true, researched: true };
      draft.prestige.perks["codexVox"] = { unlocked: true, researched: true };
    }
    if (draft.space) {
      draft.space.programs["orbitalLaunch"] = { val: 1, on: 1, unlocked: true };
      draft.space.programs["moonMission"] = { val: 1, on: 1, unlocked: true };
      draft.space.planets["cath"] = { unlocked: true, reached: true, routeDays: 0 };
      draft.space.planets["moon"] = { unlocked: true, reached: true, routeDays: 0 };
      draft.space.spaceBuildings["spaceElevator"] = { val: 4, on: 4, unlocked: true };
      draft.space.spaceBuildings["sattelite"] = { val: 8, on: 8, unlocked: true };
      draft.space.spaceBuildings["moonOutpost"] = { val: 3, on: 3, unlocked: true };
    }
  });
  state = tickMany(state, managers, 5);
  return serialize(state);
}

function generateEndgame(): SerializedGameState {
  const managers = createManagers();
  let state = createInitialState();
  state = setCalendar(state, 250);
  state = setResources(state, {
    catnip: 50_000_000, wood: 30_000_000, minerals: 20_000_000, iron: 2_000_000,
    coal: 1_000_000, gold: 200_000, titanium: 200_000, oil: 500_000,
    uranium: 50_000, unobtainium: 20_000, antimatter: 500,
    science: 100_000_000, culture: 5_000_000, faith: 50_000, catpower: 20_000,
    manpower: 100, furs: 50_000_000, ivory: 20_000_000, spice: 50_000,
    unicorns: 5_000_000, alicorn: 100, necrocorn: 5, tears: 30, karma: 80,
    paragon: 200, timeCrystal: 5_000, sorrow: 10, relic: 500, void: 5_000,
    beam: 5_000_000_000, slab: 5_000_000_000, plate: 5_000_000_000,
    steel: 5_000_000_000, gear: 1_000_000_000, concrate: 1_000_000_000,
    alloy: 100_000_000, eludium: 1_000_000, scaffold: 100_000_000_000,
    ship: 500_000, parchment: 50_000_000, manuscript: 20_000_000,
    compedium: 10_000_000, blueprint: 50_000_000, kerosene: 500_000_000,
    starchart: 1_000_000_000, gflops: 500_000, temporalFlux: 5_000,
  });
  state = setBuildings(state, {
    field: 350, pasture: 140, aqueduct: 100, hut: 60, logHouse: 200, mansion: 180,
    library: 200, academy: 220, observatory: 600, mine: 220, lumberMill: 200,
    smelter: 200, calciner: 120, steamworks: 120, magneto: 120,
    barn: 25, warehouse: 25, amphitheatre: 80, brewery: 30,
    workshop: 200, tradepost: 140, harbor: 300, quarry: 200,
    factory: 120, accelerator: 100, temple: 160, chapel: 180,
    unicornPasture: 35, chronosphere: 18, reactor: 100, oilWell: 180,
    mint: 10, ziggurat: 100, biolab: 700, aiCore: 15,
  });
  state = researchTechs(state, [
    "calendar", "agriculture", "archery", "mining", "metal", "animal",
    "civil", "math", "construction", "engineering", "currency", "writing",
    "philosophy", "machinery", "steel", "theology", "astronomy",
    "navigation", "architecture", "physics", "metaphysics", "chemistry",
    "acoustics", "drama", "archeology", "electricity", "biology",
    "biochemistry", "genetics", "industrialization", "mechanization",
    "metalurgy", "combustion", "ecology", "electronics", "robotics",
    "ai", "nuclearFission", "rocketry", "oilProcessing", "sattelites",
    "orbitalEngineering", "thorium", "exogeology", "advExogeology",
    "nanotechnology", "superconductors", "antimatter", "terraformation",
    "hydroponics", "exogeophysics", "particlePhysics", "dimensionalPhysics",
    "chronophysics", "tachyonTheory", "cryptotheology", "voidSpace",
    "paradoxalKnowledge",
  ]);
  state = researchPolicies(state, [
    "tradition", "authocracy", "communism", "expansionism", "diplomacy",
    "culturalExchange", "epicurianism", "extravagance", "mysticism",
    "clearCutting", "fullIndustrialization",
  ]);
  state = purchaseUpgrades(state, [
    "mineralHoes", "ironHoes", "mineralAxes", "ironAxes", "steelAxe",
    "reinforcedSaw", "steelSaw", "titaniumSaw", "alloySaw", "titaniumAxe",
    "alloyAxe", "stoneBarns", "reinforcedBarns", "reinforcedWarehouses",
    "titaniumBarns", "alloyBarns", "concreteBarns", "titaniumWarehouses",
    "alloyWarehouses", "concreteWarehouses", "storageBunkers", "energyRifts",
    "stasisChambers", "voidEnergy", "darkEnergy", "chronoforge",
    "tachyonModerator", "tachyonAccelerators", "fluxCondensator", "lhc",
    "photovoltaic", "thinFilm", "qdot", "solarSatellites", "cargoShips",
    "barges", "reactorVessel", "ironwood", "concreteHuts", "unobtainiumHuts",
    "eludiumHuts", "silos", "refrigeration", "compositeBow", "crossbow",
    "railgun", "bolas", "huntingArmor", "steelArmor", "alloyArmor",
    "nanosuits", "caravanserai", "advancedRefinement", "goldOre", "geodesy",
    "register", "strenghtenBuild", "miningDrill", "unobtainiumDrill",
    "coalFurnace", "deepMining", "pyrolysis", "electrolyticSmelting",
    "oxidation", "steelPlants", "automatedPlants", "nuclearPlants",
    "rotaryKiln", "fluidizedReactors", "nuclearSmelters", "orbitalGeodesy",
    "printingPress", "offsetPress", "photolithography", "uplink", "starlink",
    "cryocomputing", "machineLearning", "factoryAutomation",
    "advancedAutomation", "pneumaticPress", "combustionEngine",
    "fuelInjectors", "factoryLogistics", "carbonSequestration",
    "factoryOptimization", "factoryRobotics", "spaceEngineers",
    "chronoEngineers", "spaceManufacturing", "celestialMechanics",
    "astrolabe", "titaniumMirrors", "unobtainiumReflectors",
    "eludiumReflectors", "hydroPlantTurbines", "amBases", "amReactors",
    "amReactorsMK2", "amDrive", "pumpjack", "biofuel", "unicornSelection",
    "gmo", "cadSystems", "seti", "logistics", "augumentation", "internet",
    "neuralNetworks", "assistance", "enrichedUranium", "coldFusion",
    "thoriumReactors", "enrichedThorium", "hubbleTelescope", "satnav",
    "satelliteRadio", "astrophysicists", "mWReactor", "eludiumCracker",
    "thoriumEngine", "oilRefinery", "oilDistillation", "factoryProcessing",
    "voidAspiration", "distorsion", "turnSmoothly",
  ]);
  state = seedKittens(state, 350, {
    woodcutter: 30, farmer: 20, scholar: 80, hunter: 80, miner: 25,
    geologist: 30, priest: 30, engineer: 20,
  });
  state = mutate(state, (draft) => {
    if (draft.religion) {
      draft.religion.worship = 10_000_000_000;
      draft.religion.faithRatio = 5_000_000;
      draft.religion.transcendenceTier = 8;
      for (const name of [
        "unicornTomb", "ivoryTower", "ivoryCitadel", "skyPalace",
        "unicornUtopia", "sunspire", "marker", "blackPyramid",
      ]) {
        draft.religion.zigguratUpgrades[name] = { val: 30, on: 30, unlocked: true };
      }
      for (const name of [
        "solarchant", "scholasticism", "goldenSpire", "sunAltar",
        "stainedGlass", "solarRevolution", "basilica", "templars",
        "apocripha", "transcendence",
      ]) {
        draft.religion.religionUpgrades[name] = { val: 5, on: 5 };
      }
      draft.religion.transcendenceUpgrades["blackObelisk"] = { val: 1, on: 1, unlocked: true };
    }
    if (draft.prestige) {
      for (const name of [
        "engeneering", "codexVox", "megalomania", "goldenRatio",
        "divineProportion", "vitruvianFeline", "renaissance", "diplomacy",
        "chronomancy", "astromancy", "anachronomancy", "carnivals",
        "numerology", "numeromancy", "adjustmentBureau",
      ]) {
        draft.prestige.perks[name] = { unlocked: true, researched: true };
      }
    }
    if (draft.space) {
      for (const program of [
        "orbitalLaunch", "moonMission", "duneMission", "piscineMission",
        "heliosMission", "terminusMission", "kairoMission", "rorschachMission",
        "yarnMission", "umbraMission", "charonMission", "centaurusSystemMission",
      ]) {
        draft.space.programs[program] = { val: 1, on: 1, unlocked: true };
      }
      for (const planet of [
        "cath", "moon", "dune", "piscine", "helios", "terminus", "kairo",
        "yarn", "umbra", "charon", "centaurusSystem",
      ]) {
        draft.space.planets[planet] = { unlocked: true, reached: true, routeDays: 0 };
      }
      draft.space.planets["furthestRing"] = { unlocked: true, reached: false, routeDays: 50_000_000 };
      for (const [name, val] of Object.entries({
        spaceElevator: 40, sattelite: 80, moonOutpost: 50, moonBase: 40,
        planetCracker: 40, hydrofracturer: 20, spiceRefinery: 20,
        researchVessel: 30, orbitalArray: 50, sunlifter: 40,
        containmentChamber: 10, heatsink: 15, cryostation: 50,
        spaceBeacon: 20, terraformingStation: 15, hydroponics: 80,
        tectonic: 5,
      })) {
        draft.space.spaceBuildings[name] = { val, on: val, unlocked: true };
      }
    }
    if (draft.time) {
      draft.time.cfus["temporalBattery"] = { val: 5, on: 5, unlocked: true, heat: 0 };
      draft.time.cfus["blastFurnace"] = { val: 5, on: 5, unlocked: true, heat: 50_000 };
      draft.time.cfus["ressourceRetrieval"] = { val: 1, on: 1, unlocked: true, heat: 0 };
      draft.time.vsus["voidHoover"] = { val: 4, on: 4, unlocked: true };
      draft.time.vsus["voidRift"] = { val: 10, on: 10, unlocked: true };
      draft.time.vsus["chronocontrol"] = { val: 3, on: 3, unlocked: true };
      draft.time.flux = 5_000;
    }
    if (draft.diplomacy) {
      for (const race of ["lizards", "sharks", "griffins", "nagas", "zebras", "spiders", "dragons"]) {
        draft.diplomacy.races[race] = { unlocked: true, embassyLevel: 60 };
      }
    }
  });
  state = tickMany(state, managers, 5);
  return serialize(state);
}

// ── Entry ────────────────────────────────────────────────────────────────────

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(HERE, "..", "demo-saves");

function emit(name: string, save: SerializedGameState): void {
  const path = join(OUT_DIR, `${name}.json`);
  writeFileSync(path, JSON.stringify(save, null, 0));
  const sizeKb = (JSON.stringify(save).length / 1024).toFixed(1);
  console.log(`  ${name.padEnd(8)} → ${path} (${sizeKb} KB)`);
}

function main(): void {
  mkdirSync(OUT_DIR, { recursive: true });
  console.log("Generating demo saves:");
  emit("early", generateEarly());
  emit("mid", generateMid());
  emit("late", generateLate());
  emit("endgame", generateEndgame());
  console.log("Done.");
}

main();
