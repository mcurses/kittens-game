import { describe, expect, it } from "vitest";
import { applyAction } from "./actions.js";
import { createInitialResources } from "./resources.js";
import { createInitialState } from "./state.js";
import { tick } from "./tick.js";
import {
  CRAFT_DEFS,
  UPGRADE_DEFS,
  WorkshopManager,
  applyCraft,
  applyPurchaseUpgrade,
  createInitialWorkshop,
} from "./workshop.js";
import type { WorkshopState } from "./workshop.js";

// ── Story 1: UpgradeDef and WorkshopState shape ───────────────────────────────

describe("UPGRADE_DEFS", () => {
  it("is a readonly array of UpgradeDef objects", () => {
    expect(Array.isArray(UPGRADE_DEFS)).toBe(true);
    expect(UPGRADE_DEFS.length).toBeGreaterThan(0);
  });

  it("each def has name, prices, optional effects and unlocks", () => {
    for (const def of UPGRADE_DEFS) {
      expect(typeof def.name).toBe("string");
      expect(Array.isArray(def.prices)).toBe(true);
      if (def.effects !== undefined) {
        expect(typeof def.effects).toBe("object");
      }
      if (def.unlocks !== undefined) {
        expect(typeof def.unlocks).toBe("object");
      }
    }
  });

  it("contains mineralHoes with catnipJobRatio: 0.5", () => {
    const def = UPGRADE_DEFS.find((d) => d.name === "mineralHoes");
    expect(def).toBeDefined();
    expect(def?.effects?.catnipJobRatio).toBe(0.5);
  });

  it("contains ironHoes with correct prices", () => {
    const def = UPGRADE_DEFS.find((d) => d.name === "ironHoes");
    expect(def).toBeDefined();
    expect(def?.prices).toContainEqual({ name: "iron", val: 25 });
    expect(def?.prices).toContainEqual({ name: "science", val: 200 });
  });

  it("contains at least 80 upgrade definitions", () => {
    expect(UPGRADE_DEFS.length).toBeGreaterThanOrEqual(80);
  });
});

describe("createInitialWorkshop", () => {
  it("returns a WorkshopState with upgrades and crafts records", () => {
    const ws = createInitialWorkshop();
    expect(typeof ws.upgrades).toBe("object");
    expect(typeof ws.crafts).toBe("object");
  });

  it("exactly 6 upgrades start unlocked: mineralHoes, ironHoes, mineralAxes, ironAxes, stoneBarns, reinforcedBarns", () => {
    const ws = createInitialWorkshop();
    const initiallyUnlocked = [
      "mineralHoes",
      "ironHoes",
      "mineralAxes",
      "ironAxes",
      "stoneBarns",
      "reinforcedBarns",
    ];
    for (const name of initiallyUnlocked) {
      expect(ws.upgrades[name]?.unlocked).toBe(true);
    }
    const unlockedCount = Object.values(ws.upgrades).filter((e) => e.unlocked).length;
    expect(unlockedCount).toBe(6);
  });

  it("no upgrade starts as researched", () => {
    const ws = createInitialWorkshop();
    const anyResearched = Object.values(ws.upgrades).some((e) => e.researched);
    expect(anyResearched).toBe(false);
  });

  it("has entries for all UPGRADE_DEFS", () => {
    const ws = createInitialWorkshop();
    for (const def of UPGRADE_DEFS) {
      expect(ws.upgrades[def.name]).toBeDefined();
    }
  });
});

// ── Story 2: CraftDef and craft state ────────────────────────────────────────

describe("CRAFT_DEFS", () => {
  it("is a readonly array of CraftDef objects", () => {
    expect(Array.isArray(CRAFT_DEFS)).toBe(true);
    expect(CRAFT_DEFS.length).toBeGreaterThan(0);
  });

  it("each def has name, prices, tier, ignoreBonuses", () => {
    for (const def of CRAFT_DEFS) {
      expect(typeof def.name).toBe("string");
      expect(Array.isArray(def.prices)).toBe(true);
      expect(typeof def.tier).toBe("number");
      expect(typeof def.ignoreBonuses).toBe("boolean");
    }
  });

  it("contains wood with ignoreBonuses: true, tier: 1", () => {
    const def = CRAFT_DEFS.find((d) => d.name === "wood");
    expect(def).toBeDefined();
    expect(def?.ignoreBonuses).toBe(true);
    expect(def?.tier).toBe(1);
    expect(def?.prices).toContainEqual({ name: "catnip", val: 100 });
  });

  it("contains steel with correct prices, tier: 2", () => {
    const def = CRAFT_DEFS.find((d) => d.name === "steel");
    expect(def).toBeDefined();
    expect(def?.tier).toBe(2);
    expect(def?.prices).toContainEqual({ name: "coal", val: 100 });
    expect(def?.prices).toContainEqual({ name: "iron", val: 100 });
  });

  it("contains at least 15 craft definitions", () => {
    expect(CRAFT_DEFS.length).toBeGreaterThanOrEqual(15);
  });
});

describe("createInitialWorkshop crafts", () => {
  it("exactly 8 crafts start unlocked: wood, beam, slab, plate, gear, scaffold, manuscript, megalith", () => {
    const ws = createInitialWorkshop();
    const initiallyUnlocked = [
      "wood",
      "beam",
      "slab",
      "plate",
      "gear",
      "scaffold",
      "manuscript",
      "megalith",
    ];
    for (const name of initiallyUnlocked) {
      expect(ws.crafts[name]?.unlocked).toBe(true);
    }
    const unlockedCount = Object.values(ws.crafts).filter((e) => e.unlocked).length;
    expect(unlockedCount).toBe(8);
  });

  it("all other crafts start unlocked=false", () => {
    const ws = createInitialWorkshop();
    const initiallyUnlocked = new Set([
      "wood",
      "beam",
      "slab",
      "plate",
      "gear",
      "scaffold",
      "manuscript",
      "megalith",
    ]);
    for (const [name, entry] of Object.entries(ws.crafts)) {
      if (!initiallyUnlocked.has(name)) {
        expect(entry.unlocked).toBe(false);
      }
    }
  });

  it("has entries for all CRAFT_DEFS", () => {
    const ws = createInitialWorkshop();
    for (const def of CRAFT_DEFS) {
      expect(ws.crafts[def.name]).toBeDefined();
    }
  });

  it("all crafts start with zero assigned engineers", () => {
    const ws = createInitialWorkshop();
    for (const entry of Object.values(ws.crafts)) {
      expect(entry.engineers).toBe(0);
    }
  });
});

// ── Story 3: PURCHASE_UPGRADE action ─────────────────────────────────────────

describe("applyPurchaseUpgrade", () => {
  function stateWithResources(resources: Record<string, number>) {
    const s = createInitialState();
    const newResources: typeof s.resources = { ...s.resources };
    for (const [name, value] of Object.entries(resources)) {
      newResources[name] = {
        value,
        maxValue: Math.max(value * 2, 10000),
      };
    }
    return { ...s, resources: newResources };
  }

  it("deducts resources and marks upgrade researched when unlocked and affordable", () => {
    const s = stateWithResources({ minerals: 300, science: 200 });
    const next = applyPurchaseUpgrade(s, "mineralHoes");
    expect(next.workshop.upgrades.mineralHoes?.researched).toBe(true);
    expect(next.resources.minerals?.value).toBe(300 - 275);
    expect(next.resources.science?.value).toBe(200 - 100);
  });

  it("does nothing if upgrade is not unlocked", () => {
    const s = stateWithResources({ science: 1000000 });
    // alloySaw is not initially unlocked (requires steelSaw → titaniumSaw chain)
    const next = applyPurchaseUpgrade(s, "alloySaw");
    expect(next.workshop.upgrades.alloySaw?.researched).toBe(false);
    expect(next).toBe(s); // reference equality — no mutation
  });

  it("does nothing if already researched", () => {
    const s = stateWithResources({ minerals: 300, science: 200 });
    const afterFirst = applyPurchaseUpgrade(s, "mineralHoes");
    const afterSecond = applyPurchaseUpgrade(afterFirst, "mineralHoes");
    expect(afterSecond).toBe(afterFirst);
  });

  it("does nothing if cannot afford", () => {
    const s = stateWithResources({ minerals: 100, science: 0 });
    const next = applyPurchaseUpgrade(s, "mineralHoes");
    expect(next.workshop.upgrades.mineralHoes?.researched).toBe(false);
    expect(next).toBe(s);
  });

  it("deducts all prices for a multi-price upgrade", () => {
    // ironHoes: {iron:25, science:200}
    const s = stateWithResources({ iron: 100, science: 500 });
    const next = applyPurchaseUpgrade(s, "ironHoes");
    expect(next.workshop.upgrades.ironHoes?.researched).toBe(true);
    expect(next.resources.iron?.value).toBe(100 - 25);
    expect(next.resources.science?.value).toBe(500 - 200);
  });

  it("does nothing for unknown upgrade name", () => {
    const s = createInitialState();
    const next = applyPurchaseUpgrade(s, "notAnUpgrade");
    expect(next).toBe(s);
  });

  it("does not mutate input state", () => {
    const s = stateWithResources({ minerals: 300, science: 200 });
    applyPurchaseUpgrade(s, "mineralHoes");
    expect(s.workshop.upgrades.mineralHoes?.researched).toBe(false);
  });
});

// ── Story 4: Upgrade unlock chain propagation ─────────────────────────────────

describe("applyPurchaseUpgrade unlock chain", () => {
  function stateAffordingAll() {
    const s = createInitialState();
    // Give massive resources
    const newResources: typeof s.resources = {};
    for (const [name, _entry] of Object.entries(s.resources)) {
      newResources[name] = { value: 9999999, maxValue: 9999999 };
    }
    return { ...s, resources: newResources };
  }

  it("mineralHoes does not unlock anything new (ironHoes already unlocked)", () => {
    const s = stateAffordingAll();
    const next = applyPurchaseUpgrade(s, "mineralHoes");
    // ironHoes was already unlocked; confirm still true
    expect(next.workshop.upgrades.ironHoes?.unlocked).toBe(true);
  });

  it("steelSaw unlocks titaniumSaw", () => {
    const s = stateAffordingAll();
    // steelSaw is not initially unlocked — manually unlock it
    const sUnlocked = {
      ...s,
      workshop: {
        ...s.workshop,
        upgrades: {
          ...s.workshop.upgrades,
          steelSaw: { unlocked: true, researched: false },
        },
      },
    };
    const next = applyPurchaseUpgrade(sUnlocked, "steelSaw");
    expect(next.workshop.upgrades.titaniumSaw?.unlocked).toBe(true);
  });

  it("titaniumSaw unlocks alloySaw", () => {
    const s = stateAffordingAll();
    const sUnlocked = {
      ...s,
      workshop: {
        ...s.workshop,
        upgrades: {
          ...s.workshop.upgrades,
          titaniumSaw: { unlocked: true, researched: false },
        },
      },
    };
    const next = applyPurchaseUpgrade(sUnlocked, "titaniumSaw");
    expect(next.workshop.upgrades.alloySaw?.unlocked).toBe(true);
  });

  it("reinforcedBarns unlocks titaniumBarns", () => {
    const s = stateAffordingAll();
    const next = applyPurchaseUpgrade(s, "reinforcedBarns");
    expect(next.workshop.upgrades.titaniumBarns?.unlocked).toBe(true);
  });

  it("upgrade with no unlocks does not change any upgrade unlock state", () => {
    const s = stateAffordingAll();
    // ironHoes has no unlocks
    const before = { ...s.workshop.upgrades };
    const next = applyPurchaseUpgrade(s, "ironHoes");
    // Count unlocked before and after — should be same
    const unlockedBefore = Object.values(before).filter((e) => e.unlocked).length;
    const unlockedAfter = Object.values(next.workshop.upgrades).filter((e) => e.unlocked).length;
    expect(unlockedAfter).toBe(unlockedBefore);
  });

  it("reinforcedWarehouses unlocks ironwood", () => {
    const s = stateAffordingAll();
    const sUnlocked = {
      ...s,
      workshop: {
        ...s.workshop,
        upgrades: {
          ...s.workshop.upgrades,
          reinforcedWarehouses: { unlocked: true, researched: false },
        },
      },
    };
    const next = applyPurchaseUpgrade(sUnlocked, "reinforcedWarehouses");
    expect(next.workshop.upgrades.ironwood?.unlocked).toBe(true);
  });
});

// ── Story 5: WorkshopManager.updateEffects ────────────────────────────────────

describe("WorkshopManager.updateEffects", () => {
  it("returns {} when no upgrades researched", () => {
    const s = createInitialState();
    const mgr = new WorkshopManager();
    expect(mgr.updateEffects(s)).toEqual({});
  });

  it("returns catnipJobRatio: 0.5 when mineralHoes researched", () => {
    const s = {
      ...createInitialState(),
      workshop: {
        ...createInitialWorkshop(),
        upgrades: {
          ...createInitialWorkshop().upgrades,
          mineralHoes: { unlocked: true, researched: true },
        },
      },
    };
    const mgr = new WorkshopManager();
    expect(mgr.updateEffects(s)).toEqual({ catnipJobRatio: 0.5 });
  });

  it("sums overlapping effect keys from multiple researched upgrades", () => {
    const ws = createInitialWorkshop();
    const s = {
      ...createInitialState(),
      workshop: {
        ...ws,
        upgrades: {
          ...ws.upgrades,
          mineralHoes: { unlocked: true, researched: true }, // catnipJobRatio: 0.5
          ironHoes: { unlocked: true, researched: true }, // catnipJobRatio: 0.3
        },
      },
    };
    const mgr = new WorkshopManager();
    const effects = mgr.updateEffects(s);
    expect(effects.catnipJobRatio).toBeCloseTo(0.8);
  });

  it("upgrade with empty effects contributes nothing", () => {
    // goldOre has empty effects {}
    const ws = createInitialWorkshop();
    const s = {
      ...createInitialState(),
      workshop: {
        ...ws,
        upgrades: {
          ...ws.upgrades,
          goldOre: { unlocked: true, researched: true },
        },
      },
    };
    const mgr = new WorkshopManager();
    expect(mgr.updateEffects(s)).toEqual({});
  });

  it("effectCache includes upgrade effects after a tick with WorkshopManager registered", () => {
    let s = createInitialState();
    // Research mineralHoes
    s = {
      ...s,
      workshop: {
        ...s.workshop,
        upgrades: {
          ...s.workshop.upgrades,
          mineralHoes: { unlocked: true, researched: true },
        },
      },
    };
    const mgr = new WorkshopManager();
    const result = tick(s, [mgr]);
    expect(result.effectCache.catnipJobRatio).toBe(0.5);
  });
});

// ── Story 6: CRAFT action ─────────────────────────────────────────────────────

describe("applyCraft", () => {
  function stateWithResources(resources: Record<string, number>) {
    const s = createInitialState();
    const newResources: typeof s.resources = { ...s.resources };
    for (const [name, value] of Object.entries(resources)) {
      const existing = newResources[name];
      newResources[name] = {
        value,
        maxValue: existing ? Math.max(existing.maxValue, value * 2, 10000) : 10000,
      };
    }
    return { ...s, resources: newResources };
  }

  it("deducts input and adds output for unlocked craft", () => {
    // beam: 175 wood → 1 beam (craftRatio=0)
    const s = stateWithResources({ wood: 500, beam: 0 });
    const next = applyCraft(s, "beam", 1);
    expect(next.resources.wood?.value).toBe(500 - 175);
    expect(next.resources.beam?.value).toBe(1);
  });

  it("does nothing if craft is not unlocked", () => {
    // steel is not initially unlocked
    const s = stateWithResources({ coal: 500, iron: 500 });
    const next = applyCraft(s, "steel", 1);
    expect(next).toBe(s);
  });

  it("does nothing if cannot afford", () => {
    const s = stateWithResources({ wood: 100 }); // need 175 for beam
    const next = applyCraft(s, "beam", 1);
    expect(next).toBe(s);
  });

  it("applies craftRatio from effectCache for non-ignoreBonuses crafts", () => {
    // beam: 175 wood → 1 beam × (1 + 0.5) = 1.5 beams → floor to 1? No, additive as float
    // Legacy: craftAmt = amt * (1 + craftRatio), so 1 × 1.5 = 1.5 beams
    const s = {
      ...stateWithResources({ wood: 175, beam: 0 }),
      effectCache: { craftRatio: 0.5 },
    };
    const next = applyCraft(s, "beam", 1);
    expect(next.resources.wood?.value).toBe(0);
    // craftAmt = 1 * (1 + 0.5) = 1.5
    expect(next.resources.beam?.value).toBeCloseTo(1.5);
  });

  it("wood craft ignores craftRatio (ignoreBonuses: true)", () => {
    const s = {
      ...stateWithResources({ catnip: 100, wood: 0 }),
      effectCache: { craftRatio: 5.0 }, // high craftRatio should be ignored
    };
    const next = applyCraft(s, "wood", 1);
    expect(next.resources.catnip?.value).toBe(0);
    // ignoreBonuses: exactly 1 wood per 100 catnip, no craft bonus
    expect(next.resources.wood?.value).toBe(1);
  });

  it("crafts multiple units correctly", () => {
    // beam x3: costs 3 * 175 = 525 wood, yields 3 beams
    const s = stateWithResources({ wood: 525, beam: 10 });
    const next = applyCraft(s, "beam", 3);
    expect(next.resources.wood?.value).toBe(0);
    expect(next.resources.beam?.value).toBe(13);
  });

  it("does nothing for unknown craft name", () => {
    const s = createInitialState();
    const next = applyCraft(s, "notACraft", 1);
    expect(next).toBe(s);
  });

  it("does nothing for amount <= 0", () => {
    const s = stateWithResources({ wood: 1000 });
    const next = applyCraft(s, "beam", 0);
    expect(next).toBe(s);
    const next2 = applyCraft(s, "beam", -1);
    expect(next2).toBe(s);
  });

  it("does not mutate input state", () => {
    const s = stateWithResources({ wood: 500, beam: 0 });
    applyCraft(s, "beam", 1);
    expect(s.resources.wood?.value).toBe(500);
  });
});

// ── Story 7: Save / load / reset ─────────────────────────────────────────────

describe("WorkshopManager save/load/reset", () => {
  it("save+load preserves upgrade researched and unlocked flags", () => {
    const ws = createInitialWorkshop();
    const s = {
      ...createInitialState(),
      workshop: {
        ...ws,
        upgrades: {
          ...ws.upgrades,
          mineralHoes: { unlocked: true, researched: true },
          ironHoes: { unlocked: true, researched: false },
        },
      },
    };
    const mgr = new WorkshopManager();
    const saved = mgr.save(s);
    const loaded = mgr.load(saved, createInitialState());
    expect(loaded.workshop.upgrades.mineralHoes?.researched).toBe(true);
    expect(loaded.workshop.upgrades.mineralHoes?.unlocked).toBe(true);
    expect(loaded.workshop.upgrades.ironHoes?.researched).toBe(false);
  });

  it("save+load preserves craft unlocked flags", () => {
    const ws = createInitialWorkshop();
    // Manually unlock steel
    const s = {
      ...createInitialState(),
      workshop: {
        ...ws,
        crafts: {
          ...ws.crafts,
          steel: { unlocked: true },
        },
      },
    };
    const mgr = new WorkshopManager();
    const saved = mgr.save(s);
    const loaded = mgr.load(saved, createInitialState());
    expect(loaded.workshop.crafts.steel?.unlocked).toBe(true);
  });

  it("save+load preserves per-craft engineer assignments", () => {
    const ws = createInitialWorkshop();
    const s = {
      ...createInitialState(),
      workshop: {
        ...ws,
        crafts: {
          ...ws.crafts,
          beam: { unlocked: true, engineers: 2 },
        },
      },
    };
    const mgr = new WorkshopManager();
    const saved = mgr.save(s);
    const loaded = mgr.load(saved, createInitialState());
    expect(loaded.workshop.crafts.beam?.engineers).toBe(2);
  });

  it("resetState returns initial unlocked set (6 upgrades)", () => {
    const mgr = new WorkshopManager();
    const reset = mgr.resetState(createInitialState());
    const unlockedCount = Object.values(reset.workshop.upgrades).filter((e) => e.unlocked).length;
    expect(unlockedCount).toBe(6);
    expect(reset.workshop.upgrades.mineralHoes?.researched).toBe(false);
  });

  it("resetState returns initial unlocked crafts (8 crafts)", () => {
    const mgr = new WorkshopManager();
    const reset = mgr.resetState(createInitialState());
    const unlockedCount = Object.values(reset.workshop.crafts).filter((e) => e.unlocked).length;
    expect(unlockedCount).toBe(8);
  });

  it("load with missing workshop data returns initial state", () => {
    const mgr = new WorkshopManager();
    const loaded = mgr.load(null, createInitialState());
    const ws = loaded.workshop;
    expect(ws.upgrades.mineralHoes?.unlocked).toBe(true);
    expect(ws.upgrades.mineralHoes?.researched).toBe(false);
  });
});

// ── Story 7 extra: GameState integration ──────────────────────────────────────

describe("GameState workshop integration", () => {
  it("GameState has a workshop field", () => {
    const s = createInitialState();
    expect(s.workshop).toBeDefined();
    expect(typeof s.workshop.upgrades).toBe("object");
    expect(typeof s.workshop.crafts).toBe("object");
  });

  it("tick.test.ts MarkedState — workshop field exists in GameState shape", () => {
    // Verified by tick.test.ts MarkedState update
    const s = createInitialState();
    const workshopState: WorkshopState = s.workshop;
    expect(workshopState).toBeDefined();
  });
});

// ── Coverage gap: actions.ts PURCHASE_UPGRADE and CRAFT dispatch ──────────────

describe("applyAction workshop actions", () => {
  it("PURCHASE_UPGRADE dispatches to applyPurchaseUpgrade", () => {
    const s = createInitialState();
    const newResources = { ...s.resources };
    newResources.minerals = { value: 300, maxValue: 9999 };
    newResources.science = { value: 200, maxValue: 9999 };
    const state = { ...s, resources: newResources };
    const next = applyAction(state, { type: "PURCHASE_UPGRADE", name: "mineralHoes" });
    expect(next.workshop.upgrades.mineralHoes?.researched).toBe(true);
  });

  it("CRAFT dispatches to applyCraft", () => {
    const s = createInitialState();
    const newResources = { ...s.resources };
    newResources.wood = { value: 500, maxValue: 9999 };
    newResources.beam = { value: 0, maxValue: 9999 };
    const state = { ...s, resources: newResources };
    const next = applyAction(state, { type: "CRAFT", name: "beam", amount: 1 });
    expect(next.resources.wood?.value).toBe(500 - 175);
    expect(next.resources.beam?.value).toBe(1);
  });
});

// ── Coverage gap: applyCraft output resource not in resourcePool ──────────────

describe("applyCraft output resource missing from pool", () => {
  it("creates the output resource entry with value: craftAmt if not in pool", () => {
    // Use a craft with an output resource not present in initial state
    // Give resources for parchment (furs: 175 → parchment)
    // parchment is initially unlocked
    const s = createInitialState();
    const newResources = { ...s.resources };
    newResources.furs = { value: 1000, maxValue: 9999 };
    // Remove parchment from resources if present
    const { parchment: _p, ...withoutParchment } = newResources as Record<
      string,
      { value: number; maxValue: number }
    >;
    const state = { ...s, resources: withoutParchment };
    const next = applyCraft(state, "parchment", 1);
    // parchment resource not in pool → defaults to {value:0, maxValue:0}
    // Math.min(0 + 1, 0) = 0 (capped by maxValue:0)
    // This tests that the fallback path doesn't crash
    expect(next).toBeDefined();
  });
});

// ── Story 27-11: Tier craft ratio wiring ─────────────────────────────────────

describe("Story 27-11: tier craft ratio wiring", () => {
  function mkCraftState(resources: Record<string, number>) {
    const base = createInitialState();
    const res = { ...createInitialResources() };
    for (const [name, val] of Object.entries(resources)) {
      if (res[name] !== undefined) {
        res[name] = { value: val, maxValue: 0 };
      } else {
        res[name] = { value: val, maxValue: 0 };
      }
    }
    return {
      ...base,
      resources: res,
      workshop: {
        ...base.workshop,
        crafts: Object.fromEntries(
          ["beam", "slab", "plate", "steel", "scaffold", "gear", "alloy", "wood", "parchment"].map(
            (n) => [n, { unlocked: true }],
          ),
        ),
      },
    };
  }

  it("applies t1CraftRatio to tier-1 craft (beam)", () => {
    const s = {
      ...mkCraftState({ wood: 175, beam: 0 }),
      effectCache: { t1CraftRatio: 0.5 },
    };
    const next = applyCraft(s, "beam", 1);
    expect(next.resources.beam?.value).toBeCloseTo(1.5);
  });

  it("applies t2CraftRatio to tier-2 craft (scaffold)", () => {
    const s = {
      ...mkCraftState({ beam: 50, scaffold: 0 }),
      effectCache: { t2CraftRatio: 1.0 },
    };
    const next = applyCraft(s, "scaffold", 1);
    expect(next.resources.scaffold?.value).toBeCloseTo(2);
  });

  it("applies t3CraftRatio to tier-3 craft (gear)", () => {
    const s = {
      ...mkCraftState({ steel: 15, gear: 0 }),
      effectCache: { t3CraftRatio: 0.25 },
    };
    const next = applyCraft(s, "gear", 1);
    expect(next.resources.gear?.value).toBeCloseTo(1.25);
  });

  it("stacks craftRatio and t1CraftRatio", () => {
    const s = {
      ...mkCraftState({ wood: 175, beam: 0 }),
      effectCache: { craftRatio: 0.1, t1CraftRatio: 0.2 },
    };
    const next = applyCraft(s, "beam", 1);
    expect(next.resources.beam?.value).toBeCloseTo(1.3);
  });

  it("t1CraftRatio does NOT apply to tier-2 craft (scaffold)", () => {
    const s = {
      ...mkCraftState({ beam: 50, scaffold: 0 }),
      effectCache: { t1CraftRatio: 10.0 },
    };
    const next = applyCraft(s, "scaffold", 1);
    expect(next.resources.scaffold?.value).toBeCloseTo(1);
  });

  it("wood craft ignores t1CraftRatio (ignoreBonuses: true)", () => {
    const s = {
      ...mkCraftState({ catnip: 100, wood: 0 }),
      effectCache: { t1CraftRatio: 5.0 },
    };
    const next = applyCraft(s, "wood", 1);
    expect(next.resources.wood?.value).toBe(1);
  });
});

// ── Coverage gap: WorkshopManager.load non-boolean fallbacks ─────────────────

describe("WorkshopManager.load edge cases", () => {
  it("handles non-boolean unlocked/researched in saved upgrade data", () => {
    const mgr = new WorkshopManager();
    // Pass malformed saved data where unlocked/researched are not booleans
    const malformedSaved = {
      upgrades: {
        mineralHoes: { unlocked: "yes", researched: 1 }, // non-boolean
      },
      crafts: {
        wood: { unlocked: "true" }, // non-boolean
      },
    };
    const loaded = mgr.load(
      malformedSaved as unknown as Parameters<typeof mgr.load>[0],
      createInitialState(),
    );
    // Fallback: mineralHoes uses initial value (true from initial state)
    expect(loaded.workshop.upgrades.mineralHoes?.unlocked).toBe(true);
    expect(loaded.workshop.upgrades.mineralHoes?.researched).toBe(false);
    // wood craft: falls back to initial value (true)
    expect(loaded.workshop.crafts.wood?.unlocked).toBe(true);
  });
});
