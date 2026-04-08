import { describe, expect, it } from "vitest";
import { applyAction } from "./actions.js";
import { POLICY_DEFS, ScienceManager, TECH_DEFS, createInitialScience } from "./science.js";
import { createInitialState } from "./state.js";
import { tick } from "./tick.js";
import { createInitialWorkshop } from "./workshop.js";

// ── Story 1: TechDef and ScienceState shape ───────────────────────────────────

describe("TECH_DEFS", () => {
  it("is a non-empty readonly array", () => {
    expect(Array.isArray(TECH_DEFS)).toBe(true);
    expect(TECH_DEFS.length).toBeGreaterThan(0);
  });

  it("every TechDef has a name string and prices array", () => {
    for (const def of TECH_DEFS) {
      expect(typeof def.name).toBe("string");
      expect(Array.isArray(def.prices)).toBe(true);
      expect(def.prices.length).toBeGreaterThan(0);
    }
  });

  it("contains 'calendar' with prices [{name:'science',val:30}]", () => {
    const def = TECH_DEFS.find((t) => t.name === "calendar");
    expect(def).toBeDefined();
    expect(def?.prices).toEqual([{ name: "science", val: 30 }]);
  });

  it("contains 'construction' with effects.queueCap = 1", () => {
    const def = TECH_DEFS.find((t) => t.name === "construction");
    expect(def).toBeDefined();
    expect(def?.effects?.queueCap).toBe(1);
  });

  it("contains 'agriculture' with unlocks.tech including 'mining'", () => {
    const def = TECH_DEFS.find((t) => t.name === "agriculture");
    expect(def?.unlocks?.tech).toContain("mining");
  });

  it("all TechDef names are unique", () => {
    const names = TECH_DEFS.map((t) => t.name);
    const unique = new Set(names);
    expect(unique.size).toBe(names.length);
  });
});

describe("createInitialScience", () => {
  it("only 'calendar' tech is unlocked initially", () => {
    const sci = createInitialScience();
    expect(sci.techs.calendar?.unlocked).toBe(true);
    // All others should be unlocked=false
    for (const [name, entry] of Object.entries(sci.techs)) {
      if (name !== "calendar") {
        expect(entry.unlocked).toBe(false);
      }
    }
  });

  it("no tech is researched initially", () => {
    const sci = createInitialScience();
    for (const entry of Object.values(sci.techs)) {
      expect(entry.researched).toBe(false);
    }
  });

  it("all techs from TECH_DEFS are present in initial state", () => {
    const sci = createInitialScience();
    for (const def of TECH_DEFS) {
      expect(sci.techs[def.name]).toBeDefined();
    }
  });

  it("no policy is unlocked, blocked, or researched initially", () => {
    const sci = createInitialScience();
    for (const entry of Object.values(sci.policies)) {
      expect(entry.unlocked).toBe(false);
      expect(entry.blocked).toBe(false);
      expect(entry.researched).toBe(false);
    }
  });
});

// ── Story 2: PolicyDef and policy state ──────────────────────────────────────

describe("POLICY_DEFS", () => {
  it("is a non-empty readonly array", () => {
    expect(Array.isArray(POLICY_DEFS)).toBe(true);
    expect(POLICY_DEFS.length).toBeGreaterThan(0);
  });

  it("every PolicyDef has name, prices, and blocks", () => {
    for (const def of POLICY_DEFS) {
      expect(typeof def.name).toBe("string");
      expect(Array.isArray(def.prices)).toBe(true);
      expect(Array.isArray(def.blocks)).toBe(true);
    }
  });

  it("contains 'liberty' with blocks: ['tradition']", () => {
    const def = POLICY_DEFS.find((p) => p.name === "liberty");
    expect(def).toBeDefined();
    expect(def?.blocks).toContain("tradition");
  });

  it("contains 'tradition' with blocks: ['liberty']", () => {
    const def = POLICY_DEFS.find((p) => p.name === "tradition");
    expect(def).toBeDefined();
    expect(def?.blocks).toContain("liberty");
  });

  it("all PolicyDef names are unique", () => {
    const names = POLICY_DEFS.map((p) => p.name);
    const unique = new Set(names);
    expect(unique.size).toBe(names.length);
  });

  it("all policies from POLICY_DEFS are present in initial state", () => {
    const sci = createInitialScience();
    for (const def of POLICY_DEFS) {
      expect(sci.policies[def.name]).toBeDefined();
    }
  });
});

// ── Story 3: RESEARCH action ──────────────────────────────────────────────────

describe("RESEARCH action", () => {
  function stateWithScience(scienceAmt: number) {
    const base = createInitialState();
    return {
      ...base,
      resources: {
        ...base.resources,
        science: { value: scienceAmt, maxValue: 999999 },
      },
    };
  }

  it("researches 'calendar' when science >= 30", () => {
    const s0 = stateWithScience(100);
    const s1 = applyAction(s0, { type: "RESEARCH", name: "calendar" });
    expect(s1.science.techs.calendar?.researched).toBe(true);
  });

  it("deducts science cost on research", () => {
    const s0 = stateWithScience(100);
    const s1 = applyAction(s0, { type: "RESEARCH", name: "calendar" });
    expect(s1.resources.science?.value).toBeCloseTo(100 - 30);
  });

  it("does nothing when tech is not unlocked", () => {
    const s0 = stateWithScience(99999);
    // "agriculture" is not unlocked initially
    const s1 = applyAction(s0, { type: "RESEARCH", name: "agriculture" });
    expect(s1.science.techs.agriculture?.researched).toBe(false);
    expect(s1.resources.science?.value).toBe(99999);
  });

  it("does nothing when tech is already researched", () => {
    const s0 = stateWithScience(99999);
    const s1 = applyAction(s0, { type: "RESEARCH", name: "calendar" });
    const s2 = applyAction(s1, { type: "RESEARCH", name: "calendar" });
    // Science should only be deducted once
    expect(s2.resources.science?.value).toBeCloseTo(99999 - 30);
  });

  it("does nothing when resources are insufficient", () => {
    const s0 = stateWithScience(10); // calendar costs 30
    const s1 = applyAction(s0, { type: "RESEARCH", name: "calendar" });
    expect(s1.science.techs.calendar?.researched).toBe(false);
  });

  it("does nothing for unknown tech name", () => {
    const s0 = stateWithScience(99999);
    const s1 = applyAction(s0, { type: "RESEARCH", name: "unicornMagic" });
    expect(s1).toBe(s0);
  });

  it("deducts multiple resource prices for multi-cost techs (theology: science+manuscript)", () => {
    const s0 = {
      ...createInitialState(),
      resources: {
        ...createInitialState().resources,
        science: { value: 50000, maxValue: 999999 },
        manuscript: { value: 100, maxValue: 999999 },
      },
      // manually unlock theology for this test
      science: {
        ...createInitialScience(),
        techs: {
          ...createInitialScience().techs,
          theology: { unlocked: true, researched: false },
        },
      },
    };
    const s1 = applyAction(s0, { type: "RESEARCH", name: "theology" });
    expect(s1.science.techs.theology?.researched).toBe(true);
    expect(s1.resources.science?.value).toBeCloseTo(50000 - 20000);
    expect(s1.resources.manuscript?.value).toBeCloseTo(100 - 35);
  });

  it("does not mutate input state", () => {
    const s0 = stateWithScience(100);
    applyAction(s0, { type: "RESEARCH", name: "calendar" });
    expect(s0.science.techs.calendar?.researched).toBe(false);
  });
});

// ── Story 4: RESEARCH_POLICY action ──────────────────────────────────────────

describe("RESEARCH_POLICY action", () => {
  function stateWithUnlockedPolicy(policyName: string, culturalAmt = 5000) {
    const base = createInitialState();
    return {
      ...base,
      resources: {
        ...base.resources,
        culture: { value: culturalAmt, maxValue: 999999 },
      },
      science: {
        ...createInitialScience(),
        policies: {
          ...createInitialScience().policies,
          [policyName]: { unlocked: true, blocked: false, researched: false },
        },
      },
    };
  }

  it("researches 'liberty' when unlocked and affordable", () => {
    const s0 = stateWithUnlockedPolicy("liberty"); // costs 150 culture
    const s1 = applyAction(s0, { type: "RESEARCH_POLICY", name: "liberty" });
    expect(s1.science.policies.liberty?.researched).toBe(true);
  });

  it("deducts culture cost on policy research", () => {
    const s0 = stateWithUnlockedPolicy("liberty", 5000);
    const s1 = applyAction(s0, { type: "RESEARCH_POLICY", name: "liberty" });
    expect(s1.resources.culture?.value).toBeCloseTo(5000 - 150);
  });

  it("does nothing when policy is not unlocked", () => {
    const s0 = {
      ...createInitialState(),
      resources: {
        ...createInitialState().resources,
        culture: { value: 99999, maxValue: 999999 },
      },
    };
    const s1 = applyAction(s0, { type: "RESEARCH_POLICY", name: "liberty" });
    expect(s1.science.policies.liberty?.researched).toBe(false);
  });

  it("does nothing when policy is blocked", () => {
    const s0 = {
      ...createInitialState(),
      resources: {
        ...createInitialState().resources,
        culture: { value: 99999, maxValue: 999999 },
      },
      science: {
        ...createInitialScience(),
        policies: {
          ...createInitialScience().policies,
          liberty: { unlocked: true, blocked: true, researched: false },
        },
      },
    };
    const s1 = applyAction(s0, { type: "RESEARCH_POLICY", name: "liberty" });
    expect(s1.science.policies.liberty?.researched).toBe(false);
  });

  it("does nothing when policy is already researched", () => {
    const s0 = {
      ...createInitialState(),
      resources: {
        ...createInitialState().resources,
        culture: { value: 99999, maxValue: 999999 },
      },
      science: {
        ...createInitialScience(),
        policies: {
          ...createInitialScience().policies,
          liberty: { unlocked: true, blocked: false, researched: true },
        },
      },
    };
    const s1 = applyAction(s0, { type: "RESEARCH_POLICY", name: "liberty" });
    // Should not deduct twice
    expect(s1.resources.culture?.value).toBe(99999);
  });

  it("blocks competing policies when researching 'liberty'", () => {
    const s0 = stateWithUnlockedPolicy("liberty");
    const s1 = applyAction(s0, { type: "RESEARCH_POLICY", name: "liberty" });
    expect(s1.science.policies.tradition?.blocked).toBe(true);
  });

  it("blocks competing policies when researching 'tradition'", () => {
    const s0 = stateWithUnlockedPolicy("tradition");
    const s1 = applyAction(s0, { type: "RESEARCH_POLICY", name: "tradition" });
    expect(s1.science.policies.liberty?.blocked).toBe(true);
  });

  it("unlocks downstream policies listed in policy.unlocks.policies", () => {
    // "liberty" unlocks "authocracy" and "republic"
    const s0 = stateWithUnlockedPolicy("liberty");
    const s1 = applyAction(s0, { type: "RESEARCH_POLICY", name: "liberty" });
    expect(s1.science.policies.authocracy?.unlocked).toBe(true);
    expect(s1.science.policies.republic?.unlocked).toBe(true);
  });

  it("does nothing when policy is affordable=false (insufficient resources)", () => {
    const s0 = {
      ...createInitialState(),
      resources: {
        ...createInitialState().resources,
        culture: { value: 1, maxValue: 999999 }, // liberty costs 150 culture
      },
      science: {
        ...createInitialScience(),
        policies: {
          ...createInitialScience().policies,
          liberty: { unlocked: true, blocked: false, researched: false },
        },
      },
    };
    const s1 = applyAction(s0, { type: "RESEARCH_POLICY", name: "liberty" });
    expect(s1.science.policies.liberty?.researched).toBe(false);
    expect(s1.resources.culture?.value).toBe(1);
  });

  it("does nothing for unknown policy name", () => {
    const s0 = createInitialState();
    const s1 = applyAction(s0, { type: "RESEARCH_POLICY", name: "policyThatDoesntExist" });
    expect(s1).toBe(s0);
  });
});

// ── Story 5: updateEffects ────────────────────────────────────────────────────

describe("ScienceManager.updateEffects", () => {
  it("returns {} when no techs or policies are researched", () => {
    const mgr = new ScienceManager();
    const state = createInitialState();
    const effects = mgr.updateEffects(state);
    expect(Object.keys(effects)).toHaveLength(0);
  });

  it("returns construction's queueCap:1 when construction is researched", () => {
    const mgr = new ScienceManager();
    const state = {
      ...createInitialState(),
      science: {
        ...createInitialScience(),
        techs: {
          ...createInitialScience().techs,
          construction: { unlocked: true, researched: true },
        },
      },
    };
    const effects = mgr.updateEffects(state);
    expect(effects.queueCap).toBe(1);
  });

  it("sums effects when multiple techs are researched", () => {
    const mgr = new ScienceManager();
    // Two techs that both have queueCap effects would sum
    // Use construction (queueCap:1) and any tech with no effects → still queueCap:1
    const state = {
      ...createInitialState(),
      science: {
        ...createInitialScience(),
        techs: {
          ...createInitialScience().techs,
          construction: { unlocked: true, researched: true },
          calendar: { unlocked: true, researched: true },
        },
      },
    };
    const effects = mgr.updateEffects(state);
    // Only construction has effects; calendar has none
    expect(effects.queueCap).toBe(1);
  });

  it("includes researched policy effects in the sum", () => {
    const mgr = new ScienceManager();
    // "rationality" has {sciencePolicyRatio: 0.05, ironPolicyRatio: 0.05}
    const state = {
      ...createInitialState(),
      science: {
        ...createInitialScience(),
        policies: {
          ...createInitialScience().policies,
          rationality: { unlocked: true, blocked: false, researched: true },
        },
      },
    };
    const effects = mgr.updateEffects(state);
    expect(effects.sciencePolicyRatio).toBeCloseTo(0.05);
    expect(effects.ironPolicyRatio).toBeCloseTo(0.05);
  });

  it("effectCache has tech effects after full tick with ScienceManager registered", () => {
    const state = {
      ...createInitialState(),
      science: {
        ...createInitialScience(),
        techs: {
          ...createInitialScience().techs,
          construction: { unlocked: true, researched: true },
        },
      },
    };
    const mgr = new ScienceManager();
    const result = tick(state, [mgr]);
    expect(result.effectCache.queueCap).toBe(1);
  });
});

// ── Story 6: Tech unlock propagation ─────────────────────────────────────────

describe("tech unlock propagation", () => {
  function stateWithScience(scienceAmt: number) {
    const base = createInitialState();
    return {
      ...base,
      resources: {
        ...base.resources,
        science: { value: scienceAmt, maxValue: 999999 },
      },
    };
  }

  it("researching 'calendar' unlocks 'agriculture'", () => {
    const s0 = stateWithScience(100);
    const s1 = applyAction(s0, { type: "RESEARCH", name: "calendar" });
    expect(s1.science.techs.agriculture?.unlocked).toBe(true);
  });

  it("researching 'calendar' does not unlock 'mining' directly (that's agriculture's unlock)", () => {
    const s0 = stateWithScience(100);
    const s1 = applyAction(s0, { type: "RESEARCH", name: "calendar" });
    expect(s1.science.techs.mining?.unlocked).toBe(false);
  });

  it("researching 'agriculture' unlocks 'mining' and 'archery'", () => {
    const s0 = {
      ...stateWithScience(99999),
      science: {
        ...createInitialScience(),
        techs: {
          ...createInitialScience().techs,
          agriculture: { unlocked: true, researched: false },
        },
      },
    };
    const s1 = applyAction(s0, { type: "RESEARCH", name: "agriculture" });
    expect(s1.science.techs.mining?.unlocked).toBe(true);
    expect(s1.science.techs.archery?.unlocked).toBe(true);
  });

  it("researching 'engineering' unlocks policies from unlocks.policies", () => {
    const s0 = {
      ...createInitialState(),
      resources: {
        ...createInitialState().resources,
        science: { value: 99999, maxValue: 999999 },
      },
      science: {
        ...createInitialScience(),
        techs: {
          ...createInitialScience().techs,
          engineering: { unlocked: true, researched: false },
        },
      },
    };
    const s1 = applyAction(s0, { type: "RESEARCH", name: "engineering" });
    expect(s1.science.policies.stripMining?.unlocked).toBe(true);
    expect(s1.science.policies.clearCutting?.unlocked).toBe(true);
    expect(s1.science.policies.environmentalism?.unlocked).toBe(true);
  });

  it("techs not in the unlock list stay unlocked=false", () => {
    const s0 = stateWithScience(100);
    const s1 = applyAction(s0, { type: "RESEARCH", name: "calendar" });
    // "astronomy" is many steps away — should not be unlocked
    expect(s1.science.techs.astronomy?.unlocked).toBe(false);
  });

  it("policy with unlocks.policies unlocks those policies on research", () => {
    const s0 = {
      ...createInitialState(),
      resources: {
        ...createInitialState().resources,
        culture: { value: 9999, maxValue: 999999 },
      },
      science: {
        ...createInitialScience(),
        policies: {
          ...createInitialScience().policies,
          liberty: { unlocked: true, blocked: false, researched: false },
        },
      },
    };
    const s1 = applyAction(s0, { type: "RESEARCH_POLICY", name: "liberty" });
    // liberty unlocks authocracy and republic
    expect(s1.science.policies.authocracy?.unlocked).toBe(true);
    expect(s1.science.policies.republic?.unlocked).toBe(true);
  });
});

// ── Story 7: Save / load / reset ─────────────────────────────────────────────

describe("ScienceManager save/load/reset", () => {
  it("save returns the science state", () => {
    const mgr = new ScienceManager();
    const state = {
      ...createInitialState(),
      science: {
        ...createInitialScience(),
        techs: {
          ...createInitialScience().techs,
          calendar: { unlocked: true, researched: true },
          agriculture: { unlocked: true, researched: false },
        },
      },
    };
    const saved = mgr.save(state);
    expect(saved).toBeDefined();
  });

  it("load restores techs researched/unlocked flags", () => {
    const mgr = new ScienceManager();
    const saved = {
      techs: {
        calendar: { unlocked: true, researched: true },
        agriculture: { unlocked: true, researched: false },
      },
      policies: {},
    };
    const base = createInitialState();
    const restored = mgr.load(saved, base);
    expect(restored.science.techs.calendar?.researched).toBe(true);
    expect(restored.science.techs.agriculture?.unlocked).toBe(true);
  });

  it("load restores policy blocked/researched flags", () => {
    const mgr = new ScienceManager();
    const saved = {
      techs: {},
      policies: {
        liberty: { unlocked: true, blocked: false, researched: true },
        tradition: { unlocked: false, blocked: true, researched: false },
      },
    };
    const base = createInitialState();
    const restored = mgr.load(saved, base);
    expect(restored.science.policies.liberty?.researched).toBe(true);
    expect(restored.science.policies.tradition?.blocked).toBe(true);
  });

  it("load handles non-boolean tech fields by defaulting to false/initial", () => {
    const mgr = new ScienceManager();
    const saved = {
      techs: {
        calendar: { unlocked: "yes" as unknown as boolean, researched: null as unknown as boolean },
      },
      policies: {},
    };
    const base = createInitialState();
    const restored = mgr.load(saved, base);
    // unlocked falls back to initial value (true for calendar), researched falls back to false
    expect(restored.science.techs.calendar?.unlocked).toBe(true);
    expect(restored.science.techs.calendar?.researched).toBe(false);
  });

  it("load handles non-boolean policy fields by defaulting to false", () => {
    const mgr = new ScienceManager();
    const saved = {
      techs: {},
      policies: {
        liberty: {
          unlocked: "yes" as unknown as boolean,
          blocked: null as unknown as boolean,
          researched: 1 as unknown as boolean,
        },
      },
    };
    const base = createInitialState();
    const restored = mgr.load(saved, base);
    expect(restored.science.policies.liberty?.unlocked).toBe(false);
    expect(restored.science.policies.liberty?.blocked).toBe(false);
    expect(restored.science.policies.liberty?.researched).toBe(false);
  });

  it("load with missing/null data defaults to initial science", () => {
    const mgr = new ScienceManager();
    const base = createInitialState();
    const restored = mgr.load(null, base);
    expect(restored.science.techs.calendar?.unlocked).toBe(true);
    expect(restored.science.techs.calendar?.researched).toBe(false);
  });

  it("resetState restores initial state: only calendar unlocked", () => {
    const mgr = new ScienceManager();
    const state = {
      ...createInitialState(),
      science: {
        techs: {
          ...createInitialScience().techs,
          calendar: { unlocked: true, researched: true },
          agriculture: { unlocked: true, researched: true },
        },
        policies: {
          ...createInitialScience().policies,
          liberty: { unlocked: true, blocked: false, researched: true },
        },
      },
    };
    const reset = mgr.resetState(state);
    expect(reset.science.techs.calendar?.unlocked).toBe(true);
    expect(reset.science.techs.calendar?.researched).toBe(false);
    expect(reset.science.techs.agriculture?.unlocked).toBe(false);
    expect(reset.science.policies.liberty?.researched).toBe(false);
    expect(reset.science.policies.liberty?.unlocked).toBe(false);
  });

  it("GameState has a 'science' field", () => {
    const s = createInitialState();
    expect(s.science).toBeDefined();
    expect(s.science.techs).toBeDefined();
    expect(s.science.policies).toBeDefined();
  });
});

// ── Epic 46 Story 1: applyResearch propagates workshop upgrades and crafts ────

describe("Epic 46: applyResearch propagates workshop unlocks", () => {
  function stateWithUnlockedTech(techName: string) {
    const base = createInitialState();
    return {
      ...base,
      resources: {
        ...base.resources,
        science: { value: 999999, maxValue: 999999 },
        iron: { value: 999999, maxValue: 999999 },
        wood: { value: 999999, maxValue: 999999 },
        minerals: { value: 999999, maxValue: 999999 },
        gold: { value: 999999, maxValue: 999999 },
        manuscript: { value: 999999, maxValue: 999999 },
        coal: { value: 999999, maxValue: 999999 },
      },
      workshop: createInitialWorkshop(),
      science: {
        ...createInitialScience(),
        techs: {
          ...createInitialScience().techs,
          [techName]: { unlocked: true, researched: false },
        },
      },
    };
  }

  it("researching 'mining' unlocks workshop upgrade 'bolas'", () => {
    const s0 = stateWithUnlockedTech("mining");
    const s1 = applyAction(s0, { type: "RESEARCH", name: "mining" });
    expect(s1.workshop.upgrades.bolas?.unlocked).toBe(true);
  });

  it("researching 'metal' unlocks workshop upgrade 'huntingArmor'", () => {
    const s0 = stateWithUnlockedTech("metal");
    const s1 = applyAction(s0, { type: "RESEARCH", name: "metal" });
    expect(s1.workshop.upgrades.huntingArmor?.unlocked).toBe(true);
  });

  it("researching 'math' unlocks workshop upgrade 'celestialMechanics'", () => {
    const s0 = stateWithUnlockedTech("math");
    const s1 = applyAction(s0, { type: "RESEARCH", name: "math" });
    expect(s1.workshop.upgrades.celestialMechanics?.unlocked).toBe(true);
  });

  it("researching 'construction' unlocks 'compositeBow', 'advancedRefinement', 'reinforcedSaw'", () => {
    const s0 = stateWithUnlockedTech("construction");
    const s1 = applyAction(s0, { type: "RESEARCH", name: "construction" });
    expect(s1.workshop.upgrades.compositeBow?.unlocked).toBe(true);
    expect(s1.workshop.upgrades.advancedRefinement?.unlocked).toBe(true);
    expect(s1.workshop.upgrades.reinforcedSaw?.unlocked).toBe(true);
  });

  it("researching 'currency' unlocks workshop upgrade 'goldOre'", () => {
    const s0 = stateWithUnlockedTech("currency");
    const s1 = applyAction(s0, { type: "RESEARCH", name: "currency" });
    expect(s1.workshop.upgrades.goldOre?.unlocked).toBe(true);
  });

  it("researching 'writing' unlocks upgrade 'register' and craft 'parchment'", () => {
    const s0 = stateWithUnlockedTech("writing");
    const s1 = applyAction(s0, { type: "RESEARCH", name: "writing" });
    expect(s1.workshop.upgrades.register?.unlocked).toBe(true);
    expect(s1.workshop.crafts.parchment?.unlocked).toBe(true);
  });

  it("researching 'philosophy' unlocks craft 'compedium'", () => {
    const s0 = stateWithUnlockedTech("philosophy");
    const s1 = applyAction(s0, { type: "RESEARCH", name: "philosophy" });
    expect(s1.workshop.crafts.compedium?.unlocked).toBe(true);
  });

  it("upgrade unlocked by tech research was previously locked", () => {
    const s0 = stateWithUnlockedTech("mining");
    expect(s0.workshop.upgrades.bolas?.unlocked).toBe(false);
  });

  it("does not mutate input workshop state", () => {
    const s0 = stateWithUnlockedTech("mining");
    applyAction(s0, { type: "RESEARCH", name: "mining" });
    expect(s0.workshop.upgrades.bolas?.unlocked).toBe(false);
  });
});

// ── Epic 46 Story 2: load replays workshop unlocks for researched techs ────────

describe("Epic 46: ScienceManager.load replays workshop unlocks", () => {
  it("loading a save with researched 'mining' tech causes bolas to be unlocked in workshop state", () => {
    const mgr = new ScienceManager();
    const saved = {
      techs: { mining: { unlocked: true, researched: true } },
      policies: {},
    };
    const base = createInitialState();
    const restored = mgr.load(saved, base);
    expect(restored.workshop.upgrades.bolas?.unlocked).toBe(true);
  });

  it("loading a save with researched 'writing' tech unlocks register and parchment", () => {
    const mgr = new ScienceManager();
    const saved = {
      techs: { writing: { unlocked: true, researched: true } },
      policies: {},
    };
    const base = createInitialState();
    const restored = mgr.load(saved, base);
    expect(restored.workshop.upgrades.register?.unlocked).toBe(true);
    expect(restored.workshop.crafts.parchment?.unlocked).toBe(true);
  });

  it("loading with no researched techs does not unlock workshop entries beyond initial set", () => {
    const mgr = new ScienceManager();
    const saved = {
      techs: { calendar: { unlocked: true, researched: false } },
      policies: {},
    };
    const base = createInitialState();
    const restored = mgr.load(saved, base);
    expect(restored.workshop.upgrades.bolas?.unlocked).toBe(false);
  });

  it("loading the slot=new tech set unlocks all expected workshop items", () => {
    const mgr = new ScienceManager();
    // From agent-docs/epics/46/NOTES.md: the reported slot=new researched techs
    const slotNewTechs = [
      "calendar", "agriculture", "archery", "mining", "metal",
      "animal", "civil", "math", "construction", "engineering",
      "currency", "writing", "philosophy", "steel",
    ];
    const saved = {
      techs: Object.fromEntries(slotNewTechs.map((t) => [t, { unlocked: true, researched: true }])),
      policies: {},
    };
    const base = createInitialState();
    const restored = mgr.load(saved, base);

    // Expected missing upgrades from NOTES.md
    const expectedUpgrades = [
      "advancedRefinement", "bolas", "celestialMechanics", "coalFurnace",
      "combustionEngine", "compositeBow", "deepMining", "goldOre",
      "huntingArmor", "register", "reinforcedSaw", "reinforcedWarehouses",
      "steelArmor", "steelAxe",
    ];
    const missingUpgrades = expectedUpgrades.filter(
      (u) => !restored.workshop.upgrades[u]?.unlocked,
    );
    expect(missingUpgrades).toEqual([]);

    // Expected missing crafts from NOTES.md
    const expectedCrafts = ["compedium", "parchment", "steel"];
    const missingCrafts = expectedCrafts.filter(
      (c) => !restored.workshop.crafts[c]?.unlocked,
    );
    expect(missingCrafts).toEqual([]);
  });
});
