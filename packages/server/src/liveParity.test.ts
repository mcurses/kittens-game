import { describe, expect, it } from "vitest";
import {
  captureAuditSnapshot,
  compareImportSnapshot,
  compareLiveSnapshot,
  type AuditSnapshot,
  type SerializedGameState,
} from "./liveParity.js";

const baseSnapshot: AuditSnapshot = {
  calendar: { year: 10527, season: 2, day: 48 },
  village: { kittens: 579, maxKittens: 579, happiness: 5.330126107867796 },
  resources: {
    catnip: { value: 837318451.904724, maxValue: 4232100 },
    wood: { value: 112353055.47464252, maxValue: 16828432.5 },
    minerals: { value: 138836437.52918628, maxValue: 18054050.5 },
    science: { value: 276057022.7414399, maxValue: 2993500 },
    faith: { value: 228373.76341050008, maxValue: 16400 },
    antimatter: { value: 2075.36, maxValue: 1000 },
    unobtainium: { value: 88289.38720909761, maxValue: 55950 },
  },
  buildings: {
    hut: { val: 67, on: 67 },
    logHouse: { val: 216, on: 216 },
    mansion: { val: 192, on: 192 },
    barn: { val: 29, on: 29 },
    warehouse: { val: 22, on: 22 },
    harbor: { val: 297, on: 297 },
    oilWell: { val: 190, on: 190 },
    factory: { val: 126, on: 126 },
    reactor: { val: 112, on: 112 },
    biolab: { val: 751, on: 751 },
    aiCore: { val: 17, on: 17 },
    accelerator: { val: 99, on: 99 },
    chronosphere: { val: 18, on: 18 },
  },
  automation: {
    oilWell: true,
    factory: true,
    reactor: false,
  },
  workshop: {
    silos: true,
    stoneBarns: true,
    concreteBarns: true,
    reinforcedBarns: true,
    ironwood: true,
  },
  policies: {
    liberty: false,
    tradition: true,
    fascism: false,
    communism: true,
    fullIndustrialization: true,
  },
  time: {
    flux: 9414.981333344942,
    heat: 0,
  },
};

describe("liveParity helpers", () => {
  it("accepts an exact import snapshot match", () => {
    expect(compareImportSnapshot(baseSnapshot, baseSnapshot)).toEqual([]);
  });

  it("accepts a live snapshot with over-cap resources and equal parity metadata", () => {
    const liveSnapshot: AuditSnapshot = {
      ...baseSnapshot,
      calendar: { ...baseSnapshot.calendar, day: 58 },
      village: { ...baseSnapshot.village, maxKittens: 579.7848879788996 },
      resources: {
        catnip: { value: 837318383.192224, maxValue: 19084828.04614975 },
        wood: { value: 112353055.47464252, maxValue: 38246257.09424791 },
        minerals: { value: 138836389.37918627, maxValue: 47051845.259919405 },
        science: { value: 276057022.7414399, maxValue: 2993500 },
        faith: { value: 228373.76341050008, maxValue: 16400 },
        antimatter: { value: 2075.36, maxValue: 1000 },
        unobtainium: { value: 88289.38720909761, maxValue: 55950 },
      },
    };

    expect(compareLiveSnapshot(liveSnapshot, baseSnapshot)).toEqual([]);
  });

  it("surfaces the key live parity failures", () => {
    const brokenLiveSnapshot: AuditSnapshot = {
      ...baseSnapshot,
      village: { kittens: 580, maxKittens: 579.7848879788996, happiness: 5.025189225345603 },
      resources: {
        catnip: { value: 19084828.04614975, maxValue: 19084828.04614975 },
        wood: { value: 38246257.09424791, maxValue: 38246257.09424791 },
        minerals: { value: 47051845.259919405, maxValue: 47051845.259919405 },
        science: { value: 2993500, maxValue: 2993500 },
        faith: { value: 16400, maxValue: 16400 },
        antimatter: { value: 1000, maxValue: 1000 },
        unobtainium: { value: 55950, maxValue: 55950 },
      },
      automation: {
        oilWell: null,
        factory: true,
        reactor: null,
      },
    };

    const mismatches = compareLiveSnapshot(brokenLiveSnapshot, baseSnapshot);
    expect(mismatches).toContain("live.kittens overflow: expected kittens <= floor(maxKittens), got 580 / 579.7848879788996");
    expect(mismatches).toContain("live.happiness: expected 5.330126107867796, got 5.025189225345603");
    expect(mismatches).toContain("live.resources.catnip: expected over-cap preservation (> maxValue), got 19084828.04614975 / 19084828.04614975");
    expect(mismatches).toContain("live.automation.oilWell: expected true, got null");
    expect(mismatches).toContain("live.automation.reactor: expected false, got null");
  });

  describe("captureAuditSnapshot", () => {
    it("captures a minimal state with undefined values", () => {
      const minimalState: SerializedGameState = {
        calendar: { year: 1, season: 0, day: 0 },
        village: { kittens: 10, happiness: undefined },
        resources: {},
        buildings: {},
        science: { policies: {} },
        workshop: { upgrades: {} },
        time: {},
        effectCache: { maxKittens: 10 },
      } as any;

      const snapshot = captureAuditSnapshot(minimalState);
      expect(snapshot.calendar).toEqual({ year: 1, season: 0, day: 0 });
      expect(snapshot.village.kittens).toBe(10);
      expect(snapshot.village.happiness).toBeNull();
      expect(snapshot.village.maxKittens).toBe(10);
    });

    it("handles missing resources gracefully", () => {
      const state: SerializedGameState = {
        calendar: { year: 100, season: 1, day: 15 },
        village: { kittens: 50, happiness: 2.5 },
        resources: { catnip: { value: 100, maxValue: 200 } },
        buildings: {},
        science: { policies: {} },
        workshop: { upgrades: {} },
        time: {},
        effectCache: { maxKittens: 50 },
      } as any;

      const snapshot = captureAuditSnapshot(state);
      expect(snapshot.resources.catnip.value).toBe(100);
      expect(snapshot.resources.catnip.maxValue).toBe(200);
      expect(snapshot.resources.wood.value).toBe(0);
      expect(snapshot.resources.wood.maxValue).toBeNull();
    });

    it("handles missing buildings gracefully", () => {
      const state: SerializedGameState = {
        calendar: { year: 100, season: 1, day: 15 },
        village: { kittens: 50, happiness: 2.5 },
        resources: {},
        buildings: { hut: { val: 5, on: 5 } },
        science: { policies: {} },
        workshop: { upgrades: {} },
        time: {},
        effectCache: { maxKittens: 50 },
      } as any;

      const snapshot = captureAuditSnapshot(state);
      expect(snapshot.buildings.hut.val).toBe(5);
      expect(snapshot.buildings.hut.on).toBe(5);
      expect(snapshot.buildings.logHouse.val).toBe(0);
      expect(snapshot.buildings.logHouse.on).toBeNull();
    });

    it("captures automation states", () => {
      const state: SerializedGameState = {
        calendar: { year: 100, season: 1, day: 15 },
        village: { kittens: 50, happiness: 2.5 },
        resources: {},
        buildings: {
          oilWell: { val: 10, on: 10, automationEnabled: true },
          factory: { val: 5, on: 5, automationEnabled: false },
        },
        science: { policies: {} },
        workshop: { upgrades: {} },
        time: {},
        effectCache: { maxKittens: 50 },
      } as any;

      const snapshot = captureAuditSnapshot(state);
      expect(snapshot.automation.oilWell).toBe(true);
      expect(snapshot.automation.factory).toBe(false);
      expect(snapshot.automation.reactor).toBeNull();
    });

    it("captures workshop and policy research states", () => {
      const state: SerializedGameState = {
        calendar: { year: 100, season: 1, day: 15 },
        village: { kittens: 50, happiness: 2.5 },
        resources: {},
        buildings: {},
        science: { policies: { liberty: { researched: true }, tradition: { researched: false } } },
        workshop: { upgrades: { silos: { researched: true }, ironwood: { researched: false } } },
        time: { flux: 100.5, heat: 50.25 },
        effectCache: { maxKittens: 50 },
      } as any;

      const snapshot = captureAuditSnapshot(state);
      expect(snapshot.workshop.silos).toBe(true);
      expect(snapshot.workshop.ironwood).toBe(false);
      expect(snapshot.policies.liberty).toBe(true);
      expect(snapshot.policies.tradition).toBe(false);
      expect(snapshot.time.flux).toBe(100.5);
      expect(snapshot.time.heat).toBe(50.25);
    });
  });

  describe("compareImportSnapshot", () => {
    it("detects calendar mismatches", () => {
      const actual: AuditSnapshot = { ...baseSnapshot, calendar: { year: 100, season: 1, day: 25 } };
      const expected: AuditSnapshot = { ...baseSnapshot, calendar: { year: 100, season: 2, day: 25 } };

      const mismatches = compareImportSnapshot(actual, expected);
      expect(mismatches).toContain("calendar.season: expected 2, got 1");
    });

    it("detects building mismatches", () => {
      const actual: AuditSnapshot = { ...baseSnapshot, buildings: { ...baseSnapshot.buildings, hut: { val: 100, on: 50 } } };
      const expected = baseSnapshot;

      const mismatches = compareImportSnapshot(actual, expected);
      expect(mismatches).toContain("buildings.hut.val: expected 67, got 100");
    });

    it("detects resource value mismatches with tolerance", () => {
      const actual: AuditSnapshot = { ...baseSnapshot, resources: { ...baseSnapshot.resources, catnip: { value: 837318451.904724000001, maxValue: 4232100 } } };
      const expected = baseSnapshot;

      const mismatches = compareImportSnapshot(actual, expected);
      expect(mismatches.length).toBe(0); // within 1e-6 tolerance
    });

    it("detects null mismatches", () => {
      const actual: AuditSnapshot = { ...baseSnapshot, village: { ...baseSnapshot.village, happiness: null } };
      const expected = baseSnapshot;

      const mismatches = compareImportSnapshot(actual, expected);
      expect(mismatches).toContain("village.happiness: expected 5.330126107867796, got null");
    });

    it("detects automation mismatches", () => {
      const actual: AuditSnapshot = { ...baseSnapshot, automation: { ...baseSnapshot.automation, oilWell: false } };
      const expected = baseSnapshot;

      const mismatches = compareImportSnapshot(actual, expected);
      expect(mismatches).toContain("automation.oilWell: expected true, got false");
    });

    it("detects policy mismatches", () => {
      const actual: AuditSnapshot = { ...baseSnapshot, policies: { ...baseSnapshot.policies, liberty: true } };
      const expected = baseSnapshot;

      const mismatches = compareImportSnapshot(actual, expected);
      expect(mismatches).toContain("policies.liberty: expected false, got true");
    });
  });

  describe("compareLiveSnapshot", () => {
    it("allows calendar day to advance", () => {
      const actual: AuditSnapshot = { ...baseSnapshot, calendar: { ...baseSnapshot.calendar, day: 100 } };
      const expected = baseSnapshot;

      const mismatches = compareLiveSnapshot(actual, expected);
      expect(mismatches.filter((m) => m.includes("calendar.day"))).toEqual([]);
    });

    it("detects calendar day regression", () => {
      const actual: AuditSnapshot = { ...baseSnapshot, calendar: { ...baseSnapshot.calendar, day: 20 } };
      const expected = baseSnapshot;

      const mismatches = compareLiveSnapshot(actual, expected);
      expect(mismatches).toContain("calendar.day regressed: expected >= 48, got 20");
    });

    it("detects kittens overflow", () => {
      const actual: AuditSnapshot = { ...baseSnapshot, village: { kittens: 600, maxKittens: 579 } };
      const expected = baseSnapshot;

      const mismatches = compareLiveSnapshot(actual, expected);
      expect(mismatches).toContain("live.kittens overflow: expected kittens <= floor(maxKittens), got 600 / 579");
    });

    it("allows resource values over maxValue in live mode", () => {
      const actual: AuditSnapshot = {
        ...baseSnapshot,
        resources: {
          ...baseSnapshot.resources,
          catnip: { value: 10000000, maxValue: 1000000 },
        },
      };
      const expected = baseSnapshot;

      const mismatches = compareLiveSnapshot(actual, expected);
      expect(mismatches.filter((m) => m.includes("catnip"))).toEqual([]);
    });

    it("detects resources not over-capped", () => {
      const actual: AuditSnapshot = {
        ...baseSnapshot,
        resources: {
          ...baseSnapshot.resources,
          catnip: { value: 500000, maxValue: 1000000 },
        },
      };
      const expected = baseSnapshot;

      const mismatches = compareLiveSnapshot(actual, expected);
      expect(mismatches).toContain(
        "live.resources.catnip: expected over-cap preservation (> maxValue), got 500000 / 1000000",
      );
    });

    it("detects time value mismatches", () => {
      const actual: AuditSnapshot = { ...baseSnapshot, time: { flux: 9414.98, heat: 1 } };
      const expected = baseSnapshot;

      const mismatches = compareLiveSnapshot(actual, expected);
      expect(mismatches.some((m) => m.includes("heat"))).toBe(true);
    });
  });
});
