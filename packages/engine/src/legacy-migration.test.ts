import { describe, expect, it } from "vitest";
import { deserialize } from "./state.js";
import { migrateLegacySave } from "./legacy-migration.js";

// ── Fixtures ──────────────────────────────────────────────────────────────────

/** Minimal but structurally complete legacy save */
const minimalLegacySave = {
  saveVersion: 15,
  resources: [
    { name: "catnip", value: 500, maxValue: 5000 },
    { name: "wood", value: 100, maxValue: 1000 },
    { name: "manpower", value: 300, maxValue: 500 }, // should become catpower
  ],
  buildings: [
    { name: "field", val: 3, on: 3, unlocked: true, stage: 0, jammed: false, isAutomationEnabled: false },
    { name: "hut", val: 2, on: 2, unlocked: true },
  ],
  village: {
    kittens: [
      { name: "kitten_0", job: "farmer" },
      { name: "kitten_1", job: "woodcutter" },
    ],
    nextKittenProgress: 0.42,
    jobs: [
      { name: "farmer", value: 1, unlocked: true },
      { name: "woodcutter", value: 1, unlocked: true },
    ],
  },
  calendar: { day: 5, season: 1, year: 3 },
  science: {
    techs: [
      { name: "calendar", unlocked: true, researched: true },
      { name: "mining", unlocked: true, researched: false },
    ],
    policies: [
      { name: "authocracy", unlocked: true, blocked: false, researched: false },
    ],
  },
  workshop: {
    upgrades: [
      { name: "mineralHoes", unlocked: true, researched: true },
    ],
    crafts: [
      { name: "beam", unlocked: true, value: 5, progress: 0.3 },
    ],
    zebraUpgrades: [
      { name: "zebraUpgrade1", unlocked: false, researched: false },
    ],
  },
};

// ── Basic correctness ─────────────────────────────────────────────────────────

describe("migrateLegacySave", () => {
  it("returns a valid SerializedGameState that passes deserialize()", () => {
    const result = migrateLegacySave(minimalLegacySave);
    // deserialize should not throw
    expect(() => deserialize(result)).not.toThrow();
  });

  it("sets version=1, tick=0, empty effectCache", () => {
    const result = migrateLegacySave(minimalLegacySave);
    expect(result.version).toBe(1);
    expect(result.tick).toBe(0);
    expect(result.effectCache).toEqual({});
  });

  // ── Resources ──────────────────────────────────────────────────────────────

  it("converts resources array to Record", () => {
    const result = migrateLegacySave(minimalLegacySave);
    expect(result.resources.catnip).toEqual({ value: 500, maxValue: 5000, perTick: 0 });
    expect(result.resources.wood).toEqual({ value: 100, maxValue: 1000, perTick: 0 });
  });

  it("renames manpower → catpower", () => {
    const result = migrateLegacySave(minimalLegacySave);
    expect(result.resources.catpower).toBeDefined();
    expect(result.resources.catpower?.value).toBe(300);
    expect(result.resources.manpower).toBeUndefined();
  });

  // ── Buildings ─────────────────────────────────────────────────────────────

  it("converts buildings array to Record", () => {
    const result = migrateLegacySave(minimalLegacySave);
    expect(result.buildings.field).toEqual({ val: 3, on: 3, unlocked: true, automationEnabled: false });
    expect(result.buildings.hut).toEqual({ val: 2, on: 2, unlocked: true });
  });

  it("drops stage and jammed from buildings", () => {
    const result = migrateLegacySave(minimalLegacySave);
    const field = result.buildings.field as Record<string, unknown>;
    expect(field.stage).toBeUndefined();
    expect(field.jammed).toBeUndefined();
  });

  it("maps isAutomationEnabled → automationEnabled in buildings", () => {
    const result = migrateLegacySave(minimalLegacySave);
    // field has isAutomationEnabled: false in the fixture
    expect((result.buildings.field as Record<string, unknown>).automationEnabled).toBe(false);
    // hut has no isAutomationEnabled in the fixture — should be absent
    expect((result.buildings.hut as Record<string, unknown>).automationEnabled).toBeUndefined();
  });

  // ── Village ───────────────────────────────────────────────────────────────

  it("derives kitten count from kittens array length", () => {
    const result = migrateLegacySave(minimalLegacySave);
    expect(result.village.kittens).toBe(2);
  });

  it("renames nextKittenProgress → kittenProgress", () => {
    const result = migrateLegacySave(minimalLegacySave);
    expect(result.village.kittenProgress).toBeCloseTo(0.42);
  });

  it("converts jobs array to Record", () => {
    const result = migrateLegacySave(minimalLegacySave);
    expect(result.village.jobs.farmer).toEqual({ value: 1 });
    expect(result.village.jobs.woodcutter).toEqual({ value: 1 });
  });

  // ── Calendar ──────────────────────────────────────────────────────────────

  it("maps day/season/year directly", () => {
    const result = migrateLegacySave(minimalLegacySave);
    expect(result.calendar).toEqual({ day: 5, season: 1, year: 3, festivalDays: 0 });
  });

  // ── Science ───────────────────────────────────────────────────────────────

  it("converts techs to Record with unlocked/researched", () => {
    const result = migrateLegacySave(minimalLegacySave);
    expect(result.science.techs.calendar).toEqual({ unlocked: true, researched: true });
    expect(result.science.techs.mining).toEqual({ unlocked: true, researched: false });
  });

  it("converts policies to Record with unlocked/blocked/researched", () => {
    const result = migrateLegacySave(minimalLegacySave);
    expect(result.science.policies.authocracy).toEqual({
      unlocked: true,
      blocked: false,
      researched: false,
    });
  });

  // ── Workshop ──────────────────────────────────────────────────────────────

  it("converts upgrades to Record", () => {
    const result = migrateLegacySave(minimalLegacySave);
    expect(result.workshop.upgrades.mineralHoes).toEqual({ unlocked: true, researched: true });
  });

  it("converts crafts to Record with only unlocked (drops value/progress)", () => {
    const result = migrateLegacySave(minimalLegacySave);
    expect(result.workshop.crafts.beam).toEqual({ unlocked: true });
    const beam = result.workshop.crafts.beam as Record<string, unknown>;
    expect(beam.value).toBeUndefined();
    expect(beam.progress).toBeUndefined();
  });

  it("drops zebraUpgrades", () => {
    const result = migrateLegacySave(minimalLegacySave);
    const workshop = result.workshop as Record<string, unknown>;
    expect(workshop.zebraUpgrades).toBeUndefined();
  });

  // ── Religion ─────────────────────────────────────────────────────────────

  it("renames religion.faith → worship", () => {
    const save = {
      ...minimalLegacySave,
      religion: {
        faith: 42.5,
        faithRatio: 0.1,
        transcendenceTier: 2,
        zu: [{ name: "ziggurat", val: 1, on: 1, unlocked: true }],
        ru: [{ name: "solarchant", val: 0, on: 0 }],
        tu: [{ name: "sunAltar", val: 0, on: 0, unlocked: false }],
        corruption: 0.5,
        pact: [],
      },
    };
    const result = migrateLegacySave(save);
    expect(result.religion?.worship).toBeCloseTo(42.5);
    expect(result.religion?.faithRatio).toBe(0.1);
    expect(result.religion?.transcendenceTier).toBe(2);
    expect(result.religion?.zu.ziggurat).toEqual({ val: 1, on: 1, unlocked: true });
    // corruption discarded
    const religion = result.religion as Record<string, unknown> | undefined;
    expect(religion?.corruption).toBeUndefined();
  });

  // ── Prestige ──────────────────────────────────────────────────────────────

  it("converts prestige perks to Record", () => {
    const save = {
      ...minimalLegacySave,
      prestige: {
        perks: [{ name: "numerology", unlocked: true, researched: true }],
      },
    };
    const result = migrateLegacySave(save);
    expect(result.prestige?.perks.numerology).toEqual({ unlocked: true, researched: true });
  });

  // ── Challenges ───────────────────────────────────────────────────────────

  it("converts challenges and sets pending=false", () => {
    const save = {
      ...minimalLegacySave,
      challenges: {
        challenges: [
          { name: "winterIsComing", unlocked: true, active: false, researched: false, on: 0 },
        ],
        reserves: {},
      },
    };
    const result = migrateLegacySave(save);
    expect(result.challenges?.challenges.winterIsComing).toEqual({
      unlocked: true,
      active: false,
      researched: false,
      on: 0,
      pending: false,
    });
  });

  // ── Space ─────────────────────────────────────────────────────────────────

  it("extracts planet buildings into flat spaceBuildings Record", () => {
    const save = {
      ...minimalLegacySave,
      space: {
        programs: [{ name: "moonMission", val: 1, on: 1, unlocked: true }],
        planets: [
          {
            name: "moon",
            unlocked: true,
            reached: true,
            routeDays: 0,
            buildings: [
              { name: "moonBase", val: 2, on: 2, unlocked: true },
              { name: "moonOutpost", val: 0, on: 0, unlocked: false },
            ],
          },
        ],
        hideResearched: false,
      },
    };
    const result = migrateLegacySave(save);
    expect(result.space?.programs.moonMission).toEqual({ val: 1, on: 1, unlocked: true });
    expect(result.space?.planets.moon).toEqual({ unlocked: true, reached: true, routeDays: 0 });
    expect(result.space?.spaceBuildings.moonBase).toEqual({ val: 2, on: 2, unlocked: true });
    expect(result.space?.spaceBuildings.moonOutpost).toEqual({ val: 0, on: 0, unlocked: false });
  });

  // ── Diplomacy ─────────────────────────────────────────────────────────────

  it("converts races to Record, keeps only unlocked and embassyLevel", () => {
    const save = {
      ...minimalLegacySave,
      diplomacy: {
        races: [
          { name: "lizards", unlocked: true, embassyLevel: 3, collapsed: false, energy: 0, duration: 0, pinned: false },
        ],
      },
    };
    const result = migrateLegacySave(save);
    expect(result.diplomacy?.races.lizards).toEqual({ unlocked: true, embassyLevel: 3 });
    const lizards = result.diplomacy?.races.lizards as Record<string, unknown> | undefined;
    expect(lizards?.collapsed).toBeUndefined();
  });

  // ── Time ─────────────────────────────────────────────────────────────────

  it("renames cfu → cfus and vsu → vsus", () => {
    const save = {
      ...minimalLegacySave,
      time: {
        heat: 10,
        flux: 5,
        isAccelerated: false,
        cfu: [{ name: "blastFurnace", val: 1, on: 1, unlocked: true, heat: 2 }],
        vsu: [{ name: "usedCryochambers", val: 0, on: 0, unlocked: false }],
        queueItems: [],
        queueSources: [],
        timestamp: 12345,
      },
    };
    const result = migrateLegacySave(save);
    expect(result.time?.cfus.blastFurnace).toEqual({ val: 1, on: 1, unlocked: true, heat: 2 });
    expect(result.time?.vsus.usedCryochambers).toEqual({ val: 0, on: 0, unlocked: false });
    expect(result.time?.heat).toBe(10);
    expect(result.time?.flux).toBe(5);
    const time = result.time as Record<string, unknown> | undefined;
    expect(time?.queueItems).toBeUndefined();
    expect(time?.timestamp).toBeUndefined();
  });

  // ── Time: unlocked inference from val ────────────────────────────────────

  it("forces vsu unlocked:true when val > 0 even if explicit unlocked is missing", () => {
    const save = {
      ...minimalLegacySave,
      time: {
        heat: 0, flux: 0, isAccelerated: false,
        cfu: [],
        vsu: [
          { name: "voidHoover", val: 4, on: 4 },  // no unlocked field
          { name: "voidRift", val: 0, on: 0 },     // val:0 → still false
        ],
      },
    };
    const result = migrateLegacySave(save);
    expect(result.time?.vsus.voidHoover?.unlocked).toBe(true);
    expect(result.time?.vsus.voidRift?.unlocked).toBe(false);
  });

  it("forces cfu unlocked:true when val > 0 even if explicit unlocked is missing", () => {
    const save = {
      ...minimalLegacySave,
      time: {
        heat: 0, flux: 0, isAccelerated: false,
        cfu: [
          { name: "blastFurnace", val: 3, on: 2, heat: 1 }, // no unlocked field
          { name: "temporalAccelerator", val: 0, on: 0, heat: 0 },
        ],
        vsu: [],
      },
    };
    const result = migrateLegacySave(save);
    expect(result.time?.cfus.blastFurnace?.unlocked).toBe(true);
    expect(result.time?.cfus.temporalAccelerator?.unlocked).toBe(false);
  });

  it("preserves explicit unlocked:false when val is 0", () => {
    const save = {
      ...minimalLegacySave,
      time: {
        heat: 0, flux: 0, isAccelerated: false,
        cfu: [{ name: "blastFurnace", val: 0, on: 0, unlocked: false, heat: 0 }],
        vsu: [{ name: "voidHoover", val: 0, on: 0, unlocked: false }],
      },
    };
    const result = migrateLegacySave(save);
    expect(result.time?.cfus.blastFurnace?.unlocked).toBe(false);
    expect(result.time?.vsus.voidHoover?.unlocked).toBe(false);
  });

  // ── Achievements ─────────────────────────────────────────────────────────

  it("converts achievements and badges", () => {
    const save = {
      ...minimalLegacySave,
      achievements: [
        { name: "kittenMother", unlocked: true, starUnlocked: false },
      ],
      ach: {
        badgesUnlocked: true,
        badges: [{ name: "hoarder", unlocked: true }],
      },
    };
    const result = migrateLegacySave(save);
    expect(result.achievements?.achievements[0]).toEqual({
      name: "kittenMother",
      unlocked: true,
      starUnlocked: false,
    });
    expect(result.achievements?.badges[0]).toEqual({ name: "hoarder", unlocked: true });
    expect(result.achievements?.badgesUnlocked).toBe(true);
  });

  // ── Robustness ────────────────────────────────────────────────────────────

  it("handles completely empty input without throwing", () => {
    expect(() => migrateLegacySave({})).not.toThrow();
    expect(() => migrateLegacySave(null)).not.toThrow();
    expect(() => migrateLegacySave(undefined)).not.toThrow();
    expect(() => migrateLegacySave("not an object")).not.toThrow();
  });

  it("drops unknown building names gracefully", () => {
    const save = {
      ...minimalLegacySave,
      buildings: [
        { name: "field", val: 1, on: 1, unlocked: true },
        { name: "futureBuilding9999", val: 5, on: 5, unlocked: true },
      ],
    };
    const result = migrateLegacySave(save);
    // Both are stored — the engine's load() handles unknown names by ignoring them
    expect(result.buildings.field).toBeDefined();
    expect(result.buildings.futureBuilding9999).toBeDefined();
  });

  it("drops resources with no name field", () => {
    const save = {
      ...minimalLegacySave,
      resources: [
        { name: "catnip", value: 100, maxValue: 500 },
        { value: 50, maxValue: 100 }, // no name — should be dropped
      ],
    };
    const result = migrateLegacySave(save);
    expect(Object.keys(result.resources)).toHaveLength(1);
    expect(result.resources.catnip).toBeDefined();
  });

  it("missing optional sections produce safe empty defaults (not undefined)", () => {
    const result = migrateLegacySave({
      resources: [],
      buildings: [],
      village: { kittens: [], jobs: [] },
      calendar: { day: 0, season: 0, year: 0 },
      science: { techs: [], policies: [] },
      workshop: { upgrades: [], crafts: [] },
    });
    // All sections always present so Manager.load() never receives undefined
    expect(result.religion).toBeDefined();
    expect(result.prestige).toBeDefined();
    expect(result.challenges).toBeDefined();
    expect(result.space).toBeDefined();
    expect(result.diplomacy).toBeDefined();
    expect(result.time).toBeDefined();
    expect(result.achievements).toBeDefined();
  });
});
