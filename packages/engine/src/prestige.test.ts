import { describe, expect, it } from "vitest";
import { applyAction } from "./actions.js";
import { buildEffectCache } from "./effects.js";
import {
  BuildingManager,
  CalendarManager,
  ReligionManager,
  ResourceManager,
  ScienceManager,
  VillageManager,
  WorkshopManager,
} from "./index.js";
import {
  PERK_DEFS,
  PrestigeManager,
  applyBurnParagon,
  applyPurchasePerk,
  applySoftReset,
  createInitialPrestige,
  getParagonProductionRatio,
  getParagonStorageRatio,
} from "./prestige.js";
import { createInitialState } from "./state.js";
import { tick } from "./tick.js";

// ── Story 1: PrestigeState shape and initial values ──────────────────────────

describe("createInitialPrestige", () => {
  it("returns an object with a perks record", () => {
    const p = createInitialPrestige();
    expect(p).toHaveProperty("perks");
    expect(typeof p.perks).toBe("object");
  });

  it("defaultUnlocked perks start unlocked: true, researched: false", () => {
    const p = createInitialPrestige();
    const defaultUnlocked = [
      "engeneering",
      "diplomacy",
      "chronomancy",
      "carnivals",
      "adjustmentBureau",
    ];
    for (const name of defaultUnlocked) {
      expect(p.perks[name]).toEqual({ unlocked: true, researched: false });
    }
  });

  it("all other perks start unlocked: false, researched: false", () => {
    const p = createInitialPrestige();
    for (const def of PERK_DEFS) {
      if (!def.defaultUnlocked) {
        expect(p.perks[def.name]).toEqual({ unlocked: false, researched: false });
      }
    }
  });

  it("GameState has a prestige field", () => {
    const s = createInitialState();
    expect(s).toHaveProperty("prestige");
    expect(s.prestige).toHaveProperty("perks");
  });
});

// ── Story 2: PURCHASE_PERK action ─────────────────────────────────────────────

describe("applyPurchasePerk", () => {
  it("deducts paragon cost and marks perk as researched", () => {
    const s = createInitialState();
    // Give enough paragon
    const withParagon = {
      ...s,
      resources: { ...s.resources, paragon: { value: 100, maxValue: 1000 } },
    };
    const next = applyPurchasePerk(withParagon, "engeneering");
    expect(next.prestige.perks.engeneering?.researched).toBe(true);
    expect(next.resources.paragon?.value).toBe(95); // cost is 5
  });

  it("returns state unchanged if perk already researched", () => {
    const s = createInitialState();
    const withParagon = {
      ...s,
      prestige: {
        perks: {
          ...s.prestige.perks,
          engeneering: { unlocked: true, researched: true },
        },
      },
      resources: { ...s.resources, paragon: { value: 100, maxValue: 1000 } },
    };
    const next = applyPurchasePerk(withParagon, "engeneering");
    expect(next).toBe(withParagon);
  });

  it("returns state unchanged if perk not unlocked", () => {
    const s = createInitialState();
    const withParagon = {
      ...s,
      resources: { ...s.resources, paragon: { value: 100, maxValue: 1000 } },
    };
    // megalomania is not unlocked initially
    const next = applyPurchasePerk(withParagon, "megalomania");
    expect(next).toBe(withParagon);
  });

  it("returns state unchanged if insufficient paragon", () => {
    const s = createInitialState();
    const withLowParagon = {
      ...s,
      resources: { ...s.resources, paragon: { value: 2, maxValue: 1000 } },
    };
    const next = applyPurchasePerk(withLowParagon, "engeneering");
    expect(next).toBe(withLowParagon);
  });

  it("purchasing engeneering unlocks megalomania, goldenRatio, codexVox", () => {
    const s = createInitialState();
    const withParagon = {
      ...s,
      resources: { ...s.resources, paragon: { value: 100, maxValue: 1000 } },
    };
    const next = applyPurchasePerk(withParagon, "engeneering");
    expect(next.prestige.perks.megalomania?.unlocked).toBe(true);
    expect(next.prestige.perks.goldenRatio?.unlocked).toBe(true);
    expect(next.prestige.perks.codexVox?.unlocked).toBe(true);
  });

  it("works via applyAction PURCHASE_PERK", () => {
    const s = createInitialState();
    const withParagon = {
      ...s,
      resources: { ...s.resources, paragon: { value: 100, maxValue: 1000 } },
    };
    const next = applyAction(withParagon, { type: "PURCHASE_PERK", name: "engeneering" });
    expect(next.prestige.perks.engeneering?.researched).toBe(true);
  });

  it("purchasing megalomania unlocks zigguratUpgrades (marker, blackPyramid)", () => {
    const s = createInitialState();
    const withParagon = {
      ...s,
      prestige: {
        perks: {
          ...s.prestige.perks,
          megalomania: { unlocked: true, researched: false },
        },
      },
      resources: { ...s.resources, paragon: { value: 100, maxValue: 1000 } },
    };
    const next = applyPurchasePerk(withParagon, "megalomania");
    expect(next.prestige.perks.megalomania?.researched).toBe(true);
    // megalomania unlocks ziggurat upgrades: marker and blackPyramid
    expect(next.religion.zigguratUpgrades.marker?.unlocked).toBe(true);
    expect(next.religion.zigguratUpgrades.blackPyramid?.unlocked).toBe(true);
  });
});

// ── Story 3: PrestigeManager.updateEffects ───────────────────────────────────

describe("PrestigeManager.updateEffects", () => {
  const mgr = new PrestigeManager();

  it("returns empty record when no perks researched", () => {
    const s = createInitialState();
    const effects = mgr.updateEffects(s);
    expect(Object.keys(effects)).toHaveLength(0);
  });

  it("engeneering researched → effectCache gains priceRatio: -0.01", () => {
    const s = createInitialState();
    const withPerk = {
      ...s,
      prestige: {
        perks: {
          ...s.prestige.perks,
          engeneering: { unlocked: true, researched: true },
        },
      },
    };
    const effects = mgr.updateEffects(withPerk);
    expect(effects.priceRatio).toBeCloseTo(-0.01);
  });

  it("goldenRatio researched → effectCache gains priceRatio and queueCap: 1", () => {
    const s = createInitialState();
    const withPerk = {
      ...s,
      prestige: {
        perks: {
          ...s.prestige.perks,
          goldenRatio: { unlocked: true, researched: true },
        },
      },
    };
    const effects = mgr.updateEffects(withPerk);
    expect(effects.priceRatio).toBeCloseTo(-(1 + Math.sqrt(5)) / 200);
    expect(effects.queueCap).toBe(1);
  });

  it("malkuth researched → effectCache gains paragonRatio: 0.05", () => {
    const s = createInitialState();
    const withPerk = {
      ...s,
      prestige: {
        perks: {
          ...s.prestige.perks,
          malkuth: { unlocked: true, researched: true },
        },
      },
    };
    const effects = mgr.updateEffects(withPerk);
    expect(effects.paragonRatio).toBeCloseTo(0.05);
  });
});

// ── Story 4: SOFT_RESET action ────────────────────────────────────────────────

describe("applySoftReset", () => {
  const managers = [
    new ResourceManager(),
    new BuildingManager(),
    new VillageManager(),
    new CalendarManager(),
    new ScienceManager(),
    new WorkshopManager(),
    new ReligionManager(),
    new PrestigeManager(),
  ];

  it("resources reset to initial (except paragon which persists)", () => {
    const s = createInitialState();
    // Set up some resources
    const withResources = {
      ...s,
      resources: {
        ...s.resources,
        catnip: { value: 9999, maxValue: 9999 },
        paragon: { value: 50, maxValue: 1000 },
      },
    };
    const next = applySoftReset(withResources, managers);
    expect(next.resources.catnip?.value).toBe(0);
    expect(next.resources.paragon?.value).toBe(50); // preserved
  });

  it("buildings reset to initial", () => {
    const s = createInitialState();
    const withBuilding = {
      ...s,
      buildings: {
        ...s.buildings,
        hut: { val: 10, on: 10 },
      },
    };
    const next = applySoftReset(withBuilding, managers);
    expect(next.buildings.hut?.val).toBe(0);
  });

  it("village resets (kittens=0)", () => {
    const s = createInitialState();
    const withKittens = {
      ...s,
      village: { ...s.village, kittens: 5, kittenProgress: 0.5 },
    };
    const next = applySoftReset(withKittens, managers);
    expect(next.village.kittens).toBe(0);
  });

  it("calendar resets to initial", () => {
    const s = createInitialState();
    const withCalendar = {
      ...s,
      calendar: { day: 100, season: 3, year: 5, festivalDays: 0 },
    };
    const next = applySoftReset(withCalendar, managers);
    expect(next.calendar.day).toBe(0);
    expect(next.calendar.season).toBe(0);
    expect(next.calendar.year).toBe(0);
  });

  it("science resets", () => {
    const s = createInitialState();
    const next = applySoftReset(s, managers);
    // All techs should be in initial state (not researched)
    for (const [, tech] of Object.entries(next.science.techs)) {
      expect(tech.researched).toBe(false);
    }
  });

  it("religion resets (worship=0, faithRatio=0)", () => {
    const s = createInitialState();
    const withReligion = {
      ...s,
      religion: { ...s.religion, worship: 999, faithRatio: 10 },
    };
    const next = applySoftReset(withReligion, managers);
    expect(next.religion.worship).toBe(0);
    expect(next.religion.faithRatio).toBe(0);
  });

  it("prestige state is preserved (perks remain researched)", () => {
    const s = createInitialState();
    const withPerk = {
      ...s,
      prestige: {
        perks: {
          ...s.prestige.perks,
          engeneering: { unlocked: true, researched: true },
        },
      },
      resources: { ...s.resources, paragon: { value: 50, maxValue: 1000 } },
    };
    const next = applySoftReset(withPerk, managers);
    expect(next.prestige.perks.engeneering?.researched).toBe(true);
    expect(next.resources.paragon?.value).toBe(50);
  });

  it("works via applyAction SOFT_RESET", () => {
    const s = createInitialState();
    const withData = {
      ...s,
      resources: {
        ...s.resources,
        catnip: { value: 500, maxValue: 9999 },
        paragon: { value: 25, maxValue: 1000 },
      },
    };
    const next = applyAction(withData, { type: "SOFT_RESET" }, managers);
    expect(next.resources.catnip?.value).toBe(0);
    expect(next.resources.paragon?.value).toBe(25);
  });
});

// ── Story 5: Paragon production / storage ratios ──────────────────────────────

describe("getParagonProductionRatio", () => {
  it("returns 0 when paragon=0 and burnedParagon=0", () => {
    expect(getParagonProductionRatio(0, 0, 1.0)).toBe(0);
  });

  it("given paragon=100, burnedParagon=0, paragonRatio=1.0, returns getLimitedDR(1.0, 2.0)", () => {
    // getLimitedDR(1.0, 2.0): maxUndiminished = 0.75 * 2 = 1.5; effect 1.0 <= 1.5 → returns 1.0
    const ratio = getParagonProductionRatio(100, 0, 1.0);
    expect(ratio).toBeCloseTo(1.0, 8);
  });

  it("is bounded by ~3 * paragonRatio (paragon cap 2 + burnedParagon cap 1)", () => {
    const ratio = getParagonProductionRatio(1e9, 1e9, 1.0);
    expect(ratio).toBeLessThan(3.0);
    expect(ratio).toBeGreaterThan(2.9);
  });

  it("burnedParagon adds to ratio (non-dark-future, cap=1*paragonRatio)", () => {
    // burnedParagon=50, paragonRatio=1.0: uncapped=0.5, limit=1 → returns 0.5
    const ratio = getParagonProductionRatio(0, 50, 1.0);
    expect(ratio).toBeCloseTo(0.5, 8);
  });
});

describe("getParagonStorageRatio", () => {
  it("returns 0 when paragon=0 and burnedParagon=0", () => {
    expect(getParagonStorageRatio(0, 0, 1.0)).toBe(0);
  });

  it("returns paragon/1000 * paragonRatio", () => {
    expect(getParagonStorageRatio(1000, 0, 1.0)).toBeCloseTo(1.0);
    expect(getParagonStorageRatio(500, 0, 2.0)).toBeCloseTo(1.0);
  });

  it("burnedParagon adds burnedParagon/2000 * paragonRatio", () => {
    expect(getParagonStorageRatio(0, 2000, 1.0)).toBeCloseTo(1.0);
    expect(getParagonStorageRatio(1000, 2000, 1.0)).toBeCloseTo(2.0);
  });
});

// ── Story 6: Save / load / reset ─────────────────────────────────────────────

describe("PrestigeManager save/load/reset", () => {
  const mgr = new PrestigeManager();

  it("serialize includes prestige perks", () => {
    const s = createInitialState();
    const saved = mgr.save(s);
    expect(saved).toHaveProperty("perks");
  });

  it("load restores all perk states", () => {
    const s = createInitialState();
    const data = {
      perks: {
        engeneering: { unlocked: true, researched: true },
        goldenRatio: { unlocked: true, researched: false },
      },
    };
    const loaded = mgr.load(data, s);
    expect(loaded.prestige.perks.engeneering?.researched).toBe(true);
    expect(loaded.prestige.perks.goldenRatio?.researched).toBe(false);
  });

  it("resetState resets all perks to initial values", () => {
    const s = createInitialState();
    const withPerks = {
      ...s,
      prestige: {
        perks: {
          ...s.prestige.perks,
          engeneering: { unlocked: true, researched: true },
          goldenRatio: { unlocked: true, researched: true },
        },
      },
    };
    const reset = mgr.resetState(withPerks);
    expect(reset.prestige.perks.engeneering).toEqual({ unlocked: true, researched: false });
    expect(reset.prestige.perks.goldenRatio).toEqual({ unlocked: false, researched: false });
  });

  it("load with missing prestige field initializes to defaults", () => {
    const s = createInitialState();
    const loaded = mgr.load({}, s);
    expect(loaded.prestige.perks.engeneering).toEqual({ unlocked: true, researched: false });
  });

  it("after load, researched perks unlock their unlock chains", () => {
    const s = createInitialState();
    const data = {
      perks: {
        engeneering: { unlocked: true, researched: true },
      },
    };
    const loaded = mgr.load(data, s);
    // engeneering unlocks megalomania, goldenRatio, codexVox
    expect(loaded.prestige.perks.megalomania?.unlocked).toBe(true);
    expect(loaded.prestige.perks.goldenRatio?.unlocked).toBe(true);
    expect(loaded.prestige.perks.codexVox?.unlocked).toBe(true);
  });

  it("after load, researched megalomania unlocks ziggurat upgrades via unlock chain", () => {
    const s = createInitialState();
    const data = {
      perks: {
        megalomania: { unlocked: true, researched: true },
      },
    };
    const loaded = mgr.load(data, s);
    expect(loaded.religion.zigguratUpgrades.marker?.unlocked).toBe(true);
    expect(loaded.religion.zigguratUpgrades.blackPyramid?.unlocked).toBe(true);
  });
});

// ── Story 7: Cross-manager integration ───────────────────────────────────────

describe("PrestigeManager cross-manager integration", () => {
  const managers = [
    new ResourceManager(),
    new BuildingManager(),
    new VillageManager(),
    new CalendarManager(),
    new ScienceManager(),
    new WorkshopManager(),
    new ReligionManager(),
    new PrestigeManager(),
  ];

  it("tick() advances without error when PrestigeManager is registered", () => {
    const s = createInitialState();
    expect(() => tick(s, managers)).not.toThrow();
  });

  it("engeneering researched → effectCache contains priceRatio", () => {
    const s = createInitialState();
    const withPerk = {
      ...s,
      prestige: {
        perks: {
          ...s.prestige.perks,
          engeneering: { unlocked: true, researched: true },
        },
      },
    };
    const effects = buildEffectCache(managers, withPerk);
    expect(effects.priceRatio).toBeLessThan(0);
  });

  it("SOFT_RESET wipes resources+buildings but preserves prestige perks", () => {
    const s = createInitialState();
    const withData = {
      ...s,
      resources: {
        ...s.resources,
        wood: { value: 500, maxValue: 1000 },
        paragon: { value: 30, maxValue: 1000 },
      },
      buildings: {
        ...s.buildings,
        hut: { val: 5, on: 5 },
      },
      prestige: {
        perks: {
          ...s.prestige.perks,
          engeneering: { unlocked: true, researched: true },
        },
      },
    };
    const next = applyAction(withData, { type: "SOFT_RESET" }, managers);
    expect(next.resources.wood?.value).toBe(0);
    expect(next.buildings.hut?.val).toBe(0);
    expect(next.prestige.perks.engeneering?.researched).toBe(true);
    expect(next.resources.paragon?.value).toBe(30);
  });
});

// ── Story 19-4: Paragon production ratio into effectCache ──────────────────────

describe("PrestigeManager.updateEffects — paragon production ratio (Story 19-4)", () => {
  it("contributes globalProductionModifier when paragon > 0", () => {
    const base = createInitialState();
    const s = {
      ...base,
      resources: {
        ...base.resources,
        paragon: { value: 100, maxValue: 0 },
        burnedParagon: { value: 0, maxValue: 0 },
      },
    };
    const mgr = new PrestigeManager();
    const effects = mgr.updateEffects(s);
    // getLimitedDR(100*0.01*1, 2*1) = getLimitedDR(1.0, 2.0) ≈ 1.0
    expect(effects.globalProductionModifier).toBeCloseTo(1.0, 5);
  });

  it("contributes globalStorageRatio when paragon > 0", () => {
    const base = createInitialState();
    const s = {
      ...base,
      resources: {
        ...base.resources,
        paragon: { value: 1000, maxValue: 0 },
        burnedParagon: { value: 0, maxValue: 0 },
      },
    };
    const mgr = new PrestigeManager();
    const effects = mgr.updateEffects(s);
    // 1000/1000 * 1.0 = 1.0
    expect(effects.globalStorageRatio).toBeCloseTo(1.0, 5);
  });

  it("does not contribute when paragon=0 and burnedParagon=0", () => {
    const base = createInitialState();
    const mgr = new PrestigeManager();
    const effects = mgr.updateEffects(base);
    expect(effects.globalProductionModifier ?? 0).toBe(0);
    expect(effects.globalStorageRatio ?? 0).toBe(0);
  });

  it("Sephirot perks (paragonRatio bonus) multiply the production ratio", () => {
    const base = createInitialState();
    // With malkuth perk (paragonRatio: 0.05), paragonRatio = 1.05
    const s = {
      ...base,
      resources: {
        ...base.resources,
        paragon: { value: 100, maxValue: 0 },
        burnedParagon: { value: 0, maxValue: 0 },
        // Need science for metaphysics — skip perk check by using direct state
      },
      prestige: {
        perks: {
          ...createInitialPrestige().perks,
          malkuth: { unlocked: true, researched: true },
        },
      },
    };
    const mgr = new PrestigeManager();
    const effects = mgr.updateEffects(s);
    // paragonRatio = 1 + 0.05 = 1.05
    // getLimitedDR(100*0.01*1.05, 2*1.05) = getLimitedDR(1.05, 2.1) ≈ 1.05 (under cap)
    expect(effects.globalProductionModifier).toBeCloseTo(1.05, 3);
  });
});

// ── Story 19-5: BURN_PARAGON action ────────────────────────────────────────────

describe("applyBurnParagon (Story 19-5)", () => {
  it("converts 1 paragon to 1 burnedParagon", () => {
    const base = createInitialState();
    const s = {
      ...base,
      resources: {
        ...base.resources,
        paragon: { value: 5, maxValue: 0 },
        burnedParagon: { value: 10, maxValue: 0 },
      },
    };
    const next = applyBurnParagon(s);
    expect(next.resources.paragon?.value).toBe(4);
    expect(next.resources.burnedParagon?.value).toBe(11);
  });

  it("returns unchanged state if paragon < 1", () => {
    const base = createInitialState();
    const s = {
      ...base,
      resources: {
        ...base.resources,
        paragon: { value: 0, maxValue: 0 },
        burnedParagon: { value: 0, maxValue: 0 },
      },
    };
    expect(applyBurnParagon(s)).toBe(s);
  });

  it("BURN_PARAGON action dispatches correctly", () => {
    const base = createInitialState();
    const s = {
      ...base,
      resources: {
        ...base.resources,
        paragon: { value: 3, maxValue: 0 },
        burnedParagon: { value: 0, maxValue: 0 },
      },
    };
    const next = applyAction(s, { type: "BURN_PARAGON" });
    expect(next.resources.paragon?.value).toBe(2);
    expect(next.resources.burnedParagon?.value).toBe(1);
  });
});
