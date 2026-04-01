/**
 * Epic 21: Feature Parity Integration Tests
 * Verifies early-game loop correctness across all managers working together.
 */
import { describe, expect, it } from "vitest";
import { AchievementManager } from "./achievements.js";
import { applyAction } from "./actions.js";
import { BuildingManager } from "./buildings.js";
import { CalendarManager, DAYS_PER_SEASON, SEASONS_PER_YEAR, TICKS_PER_DAY } from "./calendar.js";
import { ChallengeManager } from "./challenges.js";
import { DiplomacyManager } from "./diplomacy.js";
import { type Manager } from "./manager.js";
import { PrestigeManager } from "./prestige.js";
import { ReligionManager } from "./religion.js";
import { createInitialResources } from "./resources.js";
import { ScienceManager } from "./science.js";
import { SpaceManager } from "./space.js";
import { createInitialState } from "./state.js";
import { resetState, tick } from "./tick.js";
import { TimeManager } from "./time.js";
import { VillageManager } from "./village.js";
import { WorkshopManager } from "./workshop.js";
import { ResourceManager } from "./resources.js";

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

function tickMany(state: ReturnType<typeof createInitialState>, managers: readonly Manager[], count: number) {
  let next = state;
  for (let i = 0; i < count; i++) {
    next = tick(next, managers);
  }
  return next;
}

describe("Epic 21 — Feature Parity Integration Tests", () => {
  const managers = createManagers();

  it("field unlocks after a tick when catnip >= 3", () => {
    let state = resetState(managers);
    // Seed enough catnip to meet unlockRatio threshold (30% of 10 = 3)
    state = {
      ...state,
      resources: { ...state.resources, catnip: { value: 5, maxValue: 0 } },
    };
    const next = tick(state, managers);
    expect(next.buildings.field?.unlocked).toBe(true);
  });

  it("kittens arrive after building a hut and waiting enough ticks", () => {
    // Start fresh, give enough wood to buy a hut
    let state = resetState(managers);
    state = {
      ...state,
      resources: {
        ...createInitialResources(),
        wood: { value: 5, maxValue: 0 },
        catnip: { value: 5, maxValue: 0 }, // seed for field unlock
      },
    };

    // Buy a hut (gives maxKittens=2)
    state = applyAction(state, { type: "BUY_BUILDING", name: "hut" }, managers);
    expect(state.buildings.hut?.val).toBe(1);

    // Tick 101 times — kittensPerTickBase=0.01, so after 100 ticks kittenProgress=1.0 → spawn
    for (let i = 0; i < 101; i++) {
      state = tick(state, managers);
    }
    expect(state.village.kittens).toBeGreaterThanOrEqual(1);
  });

  it("happiness is 1.0 with 0 kittens", () => {
    const state = resetState(managers);
    const next = tick(state, managers);
    expect(next.village.happiness).toBeCloseTo(1.0);
  });

  it("happiness decreases as kittens grow past 5", () => {
    let state = resetState(managers);
    // Manually inject kittens and high maxKittens
    state = {
      ...state,
      effectCache: { ...state.effectCache, maxKittens: 20 },
      village: { ...state.village, kittens: 10 },
    };
    const next = tick(state, managers);
    // Happiness should be 1.0 - 0.02*(10-5) = 0.90
    expect(next.village.happiness).toBeCloseTo(0.9);
  });

  it("woodcutter produces wood after 2 ticks (one-tick effect lag)", () => {
    // ADR-004: ResourceManager runs before VillageManager, so effectCache with
    // woodPerTickBase is built at end of tick 1 and consumed by ResourceManager in tick 2.
    let state = resetState(managers);
    state = {
      ...state,
      effectCache: { ...state.effectCache, maxKittens: 10 },
      village: {
        ...state.village,
        kittens: 1,
        jobs: { ...state.village.jobs, woodcutter: { value: 1 } },
        happiness: 1.0,
      },
    };
    // Tick 1: VillageManager emits woodPerTickBase into effectCache
    state = tick(state, managers);
    // Tick 2: ResourceManager uses woodPerTickBase to add wood
    const next = tick(state, managers);
    const wood = next.resources.wood?.value ?? 0;
    expect(wood).toBeGreaterThan(0);
  });

  it("craft output no longer silently zeroed when maxValue=0 (uncapped)", () => {
    let state = resetState(managers);
    // Give enough catnip for wood craft
    state = {
      ...state,
      resources: {
        ...createInitialResources(),
        catnip: { value: 1000, maxValue: 0 },
      },
      workshop: {
        ...state.workshop,
        crafts: { ...state.workshop.crafts, wood: { unlocked: true } },
      },
    };
    const next = applyAction(state, { type: "CRAFT", name: "wood", amount: 1 }, managers);
    expect(next.resources.wood?.value ?? 0).toBeGreaterThan(0);
  });

  it("steamworks printing upgrades produce manuscripts after the effect-cache lag", () => {
    let state = resetState(managers);
    state = {
      ...state,
      buildings: {
        ...state.buildings,
        steamworks: { val: 1, on: 1, unlocked: true },
      },
      workshop: {
        ...state.workshop,
        upgrades: {
          ...state.workshop.upgrades,
          printingPress: { unlocked: true, researched: true },
          offsetPress: { unlocked: true, researched: true },
          photolithography: { unlocked: true, researched: true },
        },
      },
      resources: {
        ...state.resources,
        manuscript: { value: 0, maxValue: 0 },
      },
    };

    state = tick(state, managers);
    const next = tick(state, managers);
    expect(next.resources.manuscript?.value ?? 0).toBeCloseTo(0.008);
  });

  it("steamworks automation crafts yearly batches and jams afterward", () => {
    const ticksPerYear = TICKS_PER_DAY * DAYS_PER_SEASON * SEASONS_PER_YEAR;
    let state = resetState(managers);
    state = {
      ...state,
      buildings: {
        ...state.buildings,
        steamworks: { val: 1, on: 1, unlocked: true },
      },
      workshop: {
        ...state.workshop,
        upgrades: {
          ...state.workshop.upgrades,
          factoryAutomation: { unlocked: true, researched: true },
          pneumaticPress: { unlocked: true, researched: true },
        },
      },
      resources: {
        ...state.resources,
        wood: { value: 10000, maxValue: 10000 },
        minerals: { value: 10000, maxValue: 10000 },
        iron: { value: 10000, maxValue: 10000 },
        beam: { value: 0, maxValue: 0 },
        slab: { value: 0, maxValue: 0 },
        plate: { value: 0, maxValue: 0 },
      },
    };

    const next = tickMany(state, managers, ticksPerYear);
    expect(next.resources.beam?.value ?? 0).toBeGreaterThan(0);
    expect(next.resources.slab?.value ?? 0).toBeGreaterThan(0);
    expect(next.resources.plate?.value ?? 0).toBeGreaterThan(0);
    expect(next.buildings.steamworks?.jammed).toBe(true);
  });

  it("disabled steamworks automation skips crafting but still jams for the cycle", () => {
    const ticksPerYear = TICKS_PER_DAY * DAYS_PER_SEASON * SEASONS_PER_YEAR;
    let state = resetState(managers);
    state = {
      ...state,
      buildings: {
        ...state.buildings,
        steamworks: {
          val: 1,
          on: 1,
          unlocked: true,
          automationEnabled: false,
        },
      },
      workshop: {
        ...state.workshop,
        upgrades: {
          ...state.workshop.upgrades,
          factoryAutomation: { unlocked: true, researched: true },
          pneumaticPress: { unlocked: true, researched: true },
        },
      },
      resources: {
        ...state.resources,
        wood: { value: 10000, maxValue: 10000 },
        minerals: { value: 10000, maxValue: 10000 },
        iron: { value: 10000, maxValue: 10000 },
        beam: { value: 0, maxValue: 0 },
        slab: { value: 0, maxValue: 0 },
        plate: { value: 0, maxValue: 0 },
      },
    };

    const next = tickMany(state, managers, ticksPerYear);
    expect(next.resources.beam?.value ?? 0).toBe(0);
    expect(next.resources.slab?.value ?? 0).toBe(0);
    expect(next.resources.plate?.value ?? 0).toBe(0);
    expect(next.buildings.steamworks?.jammed).toBe(true);
  });

  it("advanced automation triggers a second steamworks batch in autumn", () => {
    const ticksPerHalfYear = TICKS_PER_DAY * DAYS_PER_SEASON * 2;
    let state = resetState(managers);
    state = {
      ...state,
      buildings: {
        ...state.buildings,
        steamworks: { val: 1, on: 1, unlocked: true },
      },
      workshop: {
        ...state.workshop,
        upgrades: {
          ...state.workshop.upgrades,
          factoryAutomation: { unlocked: true, researched: true },
          advancedAutomation: { unlocked: true, researched: true },
          pneumaticPress: { unlocked: true, researched: true },
        },
      },
      resources: {
        ...state.resources,
        wood: { value: 10000, maxValue: 10000 },
        minerals: { value: 10000, maxValue: 10000 },
        iron: { value: 10000, maxValue: 10000 },
        beam: { value: 0, maxValue: 0 },
        slab: { value: 0, maxValue: 0 },
        plate: { value: 0, maxValue: 0 },
      },
    };

    const next = tickMany(state, managers, ticksPerHalfYear);
    expect(next.resources.beam?.value ?? 0).toBeGreaterThan(0);
    expect(next.resources.slab?.value ?? 0).toBeGreaterThan(0);
    expect(next.resources.plate?.value ?? 0).toBeGreaterThan(0);
    expect(next.buildings.steamworks?.jammed).toBe(true);
    expect(next.calendar.season).toBe(2);
  });
});
