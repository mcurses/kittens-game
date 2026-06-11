import { describe, expect, it } from "vitest";
import { applyAction } from "./actions.js";
import { buildEffectCache } from "./effects.js";
import {
  BuildingManager,
  CalendarManager,
  ResourceManager,
  ScienceManager,
  VillageManager,
  WorkshopManager,
} from "./index.js";
import {
  RELIGION_UPGRADE_DEFS,
  ReligionManager,
  TRANSCENDENCE_UPGRADE_DEFS,
  ZIGGURAT_UPGRADE_DEFS,
  applyAdore,
  applyBuyReligionUpgrade,
  applyBuyTranscendenceUpgrade,
  applyBuyZigguratUpgrade,
  applyPraise,
  applyRefineTimeCrystals,
  applySacrificeAlicorns,
  applySacrificeUnicorns,
  applyTranscend,
  createInitialReligion,
  getApocryphaBonus,
  getSolarRevolutionRatio,
  getTranscendNextPrice,
  getTranscendTotalPrice,
} from "./religion.js";
import { createInitialResources } from "./resources.js";
import { createInitialState } from "./state.js";
import { tick } from "./tick.js";

// ── Story 1: ReligionState shape and initial values ──────────────────────────

describe("createInitialReligion", () => {
  it("returns worship=0, faithRatio=0, transcendenceTier=0", () => {
    const r = createInitialReligion();
    expect(r.worship).toBe(0);
    expect(r.faithRatio).toBe(0);
    expect(r.transcendenceTier).toBe(0);
  });

  it("unicornTomb is unlocked by default", () => {
    const r = createInitialReligion();
    expect(r.zigguratUpgrades.unicornTomb?.unlocked).toBe(true);
  });

  it("all other ziggurat upgrades start locked", () => {
    const r = createInitialReligion();
    for (const def of ZIGGURAT_UPGRADE_DEFS) {
      if (def.name !== "unicornTomb") {
        expect(r.zigguratUpgrades[def.name]?.unlocked).toBe(false);
      }
    }
  });

  it("all religion upgrades start with val=0, on=0", () => {
    const r = createInitialReligion();
    for (const def of RELIGION_UPGRADE_DEFS) {
      expect(r.religionUpgrades[def.name]?.val).toBe(0);
      expect(r.religionUpgrades[def.name]?.on).toBe(0);
    }
  });

  it("all transcendence upgrades start locked with val=0", () => {
    const r = createInitialReligion();
    for (const def of TRANSCENDENCE_UPGRADE_DEFS) {
      expect(r.transcendenceUpgrades[def.name]?.unlocked).toBe(false);
      expect(r.transcendenceUpgrades[def.name]?.val).toBe(0);
    }
  });

  it("GameState has religion field", () => {
    const state = createInitialState();
    expect(state.religion).toBeDefined();
    expect(state.religion.worship).toBe(0);
  });

  it("ZIGGURAT_UPGRADE_DEFS has 10 entries", () => {
    expect(ZIGGURAT_UPGRADE_DEFS.length).toBe(10);
  });

  it("RELIGION_UPGRADE_DEFS has 10 entries", () => {
    expect(RELIGION_UPGRADE_DEFS.length).toBe(10);
  });

  it("TRANSCENDENCE_UPGRADE_DEFS has 10 entries", () => {
    expect(TRANSCENDENCE_UPGRADE_DEFS.length).toBe(10);
  });
});

// ── Story 2: BUY_ZIGGURAT_UPGRADE ────────────────────────────────────────────

describe("applyBuyZigguratUpgrade", () => {
  function stateWithResources(resources: Record<string, { value: number; maxValue: number }>) {
    const base = createInitialState();
    return {
      ...base,
      resources: { ...createInitialResources(), ...resources },
    };
  }

  it("increments val and on when affordable and unlocked", () => {
    const state = stateWithResources({
      ivory: { value: 1000, maxValue: 10000 },
      tears: { value: 100, maxValue: 1000 },
    });
    const next = applyBuyZigguratUpgrade(state, "unicornTomb");
    expect(next.religion.zigguratUpgrades.unicornTomb?.val).toBe(1);
    expect(next.religion.zigguratUpgrades.unicornTomb?.on).toBe(1);
  });

  it("deducts resources on purchase", () => {
    const state = stateWithResources({
      ivory: { value: 1000, maxValue: 10000 },
      tears: { value: 100, maxValue: 1000 },
    });
    const next = applyBuyZigguratUpgrade(state, "unicornTomb");
    expect(next.resources.ivory?.value).toBe(1000 - 500);
    expect(next.resources.tears?.value).toBe(100 - 5);
  });

  it("returns state unchanged when insufficient resources", () => {
    const state = stateWithResources({
      ivory: { value: 1, maxValue: 10000 },
      tears: { value: 0, maxValue: 1000 },
    });
    const next = applyBuyZigguratUpgrade(state, "unicornTomb");
    expect(next).toBe(state);
  });

  it("returns state unchanged for locked upgrade", () => {
    const state = stateWithResources({
      ivory: { value: 100000, maxValue: 1000000 },
      tears: { value: 1000, maxValue: 100000 },
    });
    const next = applyBuyZigguratUpgrade(state, "ivoryTower");
    expect(next).toBe(state);
  });

  it("returns state unchanged for unknown upgrade", () => {
    const state = createInitialState();
    const next = applyBuyZigguratUpgrade(state, "nonexistent");
    expect(next).toBe(state);
  });

  it("unlocks ivoryTower after buying unicornTomb", () => {
    const state = stateWithResources({
      ivory: { value: 1000, maxValue: 10000 },
      tears: { value: 100, maxValue: 1000 },
    });
    const next = applyBuyZigguratUpgrade(state, "unicornTomb");
    expect(next.religion.zigguratUpgrades.ivoryTower?.unlocked).toBe(true);
  });

  it("price scales with priceRatio on second purchase", () => {
    const state = stateWithResources({
      ivory: { value: 100000, maxValue: 1000000 },
      tears: { value: 10000, maxValue: 100000 },
    });
    // First purchase: 500 ivory, 5 tears
    const s1 = applyBuyZigguratUpgrade(state, "unicornTomb");
    expect(s1.religion.zigguratUpgrades.unicornTomb?.val).toBe(1);

    // Second purchase: 500 * 1.15 = 575 ivory
    const s2 = applyBuyZigguratUpgrade(s1, "unicornTomb");
    expect(s2.religion.zigguratUpgrades.unicornTomb?.val).toBe(2);
    const expectedIvory = 100000 - 500 - 500 * 1.15;
    expect(s2.resources.ivory?.value).toBeCloseTo(expectedIvory, 5);
  });
});

// ── Story 3: BUY_RELIGION_UPGRADE ────────────────────────────────────────────

describe("applyBuyReligionUpgrade", () => {
  it("increments val and on when affordable", () => {
    const state = {
      ...createInitialState(),
      resources: {
        ...createInitialResources(),
        faith: { value: 200, maxValue: 10000 },
      },
    };
    const next = applyBuyReligionUpgrade(state, "solarchant");
    expect(next.religion.religionUpgrades.solarchant?.val).toBe(1);
    expect(next.religion.religionUpgrades.solarchant?.on).toBe(1);
  });

  it("deducts faith resource on purchase", () => {
    const state = {
      ...createInitialState(),
      resources: {
        ...createInitialResources(),
        faith: { value: 200, maxValue: 10000 },
      },
    };
    const next = applyBuyReligionUpgrade(state, "solarchant");
    expect(next.resources.faith?.value).toBe(200 - 100);
  });

  it("returns state unchanged when insufficient faith", () => {
    const state = {
      ...createInitialState(),
      resources: {
        ...createInitialResources(),
        faith: { value: 50, maxValue: 10000 },
      },
    };
    const next = applyBuyReligionUpgrade(state, "solarchant");
    expect(next).toBe(state);
  });

  it("returns state unchanged for unknown upgrade", () => {
    const state = createInitialState();
    const next = applyBuyReligionUpgrade(state, "unknown");
    expect(next).toBe(state);
  });

  it("transcendence purchase also increments the listed religion upgrades", () => {
    const state = {
      ...createInitialState(),
      resources: {
        ...createInitialResources(),
        gold: { value: 100000, maxValue: 1000000 },
        faith: { value: 200000, maxValue: 1000000 },
      },
    };
    const next = applyBuyReligionUpgrade(state, "transcendence");
    expect(next.religion.religionUpgrades.transcendence?.val).toBe(1);
    // All listed upgrades also get +1
    expect(next.religion.religionUpgrades.solarchant?.val).toBe(1);
    expect(next.religion.religionUpgrades.scholasticism?.val).toBe(1);
    expect(next.religion.religionUpgrades.goldenSpire?.val).toBe(1);
    expect(next.religion.religionUpgrades.sunAltar?.val).toBe(1);
    expect(next.religion.religionUpgrades.stainedGlass?.val).toBe(1);
    expect(next.religion.religionUpgrades.basilica?.val).toBe(1);
    expect(next.religion.religionUpgrades.templars?.val).toBe(1);
  });
});

// ── Story 4: BUY_TRANSCENDENCE_UPGRADE ───────────────────────────────────────

describe("applyBuyTranscendenceUpgrade", () => {
  function stateWithTier(tier: number) {
    const base = createInitialState();
    return {
      ...base,
      resources: {
        ...createInitialResources(),
        relic: { value: 1000000, maxValue: 10000000 },
        void: { value: 100000, maxValue: 1000000 },
        necrocorn: { value: 10000, maxValue: 100000 },
      },
      religion: {
        ...createInitialReligion(),
        transcendenceTier: tier,
      },
    };
  }

  it("can buy tier-1 upgrade when transcendenceTier >= 1", () => {
    const state = stateWithTier(1);
    const next = applyBuyTranscendenceUpgrade(state, "blackObelisk");
    expect(next.religion.transcendenceUpgrades.blackObelisk?.val).toBe(1);
  });

  it("cannot buy tier-1 upgrade when transcendenceTier = 0", () => {
    const state = stateWithTier(0);
    const next = applyBuyTranscendenceUpgrade(state, "blackObelisk");
    expect(next).toBe(state);
  });

  it("cannot buy tier-3 upgrade when transcendenceTier = 2", () => {
    const state = stateWithTier(2);
    const next = applyBuyTranscendenceUpgrade(state, "blackNexus");
    expect(next).toBe(state);
  });

  it("deducts relics on purchase", () => {
    const state = stateWithTier(3);
    const next = applyBuyTranscendenceUpgrade(state, "blackNexus");
    expect(next.resources.relic?.value).toBe(1000000 - 5000);
  });

  it("returns state unchanged for unknown upgrade", () => {
    const state = stateWithTier(5);
    const next = applyBuyTranscendenceUpgrade(state, "nonexistent");
    expect(next).toBe(state);
  });

  it("price scales with priceRatio on second purchase", () => {
    const state = stateWithTier(5);
    const s1 = applyBuyTranscendenceUpgrade(state, "blackObelisk");
    const s2 = applyBuyTranscendenceUpgrade(s1, "blackObelisk");
    const expected = 1000000 - 100 - 100 * 1.15;
    expect(s2.resources.relic?.value).toBeCloseTo(expected, 5);
  });
});

// ── Story 5: PRAISE action ────────────────────────────────────────────────────

describe("applyPraise", () => {
  it("converts faith to worship when faith > 0", () => {
    const state = {
      ...createInitialState(),
      resources: {
        ...createInitialResources(),
        faith: { value: 1000, maxValue: 10000 },
      },
    };
    const next = applyPraise(state);
    expect(next.religion.worship).toBeCloseTo(1000, 5);
    expect(next.resources.faith?.value).toBe(0.0001);
  });

  it("returns state unchanged when faith = 0", () => {
    const state = createInitialState();
    const next = applyPraise(state);
    expect(next).toBe(state);
  });

  it("applies apocrypha bonus when faithRatio > 0", () => {
    const faithRatio = 10;
    const bonus = getApocryphaBonus(faithRatio);
    expect(bonus).toBeGreaterThan(0);

    const state = {
      ...createInitialState(),
      resources: {
        ...createInitialResources(),
        faith: { value: 1000, maxValue: 10000 },
      },
      religion: {
        ...createInitialReligion(),
        faithRatio,
      },
    };
    const next = applyPraise(state);
    const expected = 1000 * (1 + bonus);
    expect(next.religion.worship).toBeCloseTo(expected, 5);
  });

  it("faith resource is reset to 0.0001 after praise", () => {
    const state = {
      ...createInitialState(),
      resources: {
        ...createInitialResources(),
        faith: { value: 500, maxValue: 10000 },
      },
    };
    const next = applyPraise(state);
    expect(next.resources.faith?.value).toBe(0.0001);
  });
});

// ── Story 6: ADORE action ─────────────────────────────────────────────────────

describe("applyAdore", () => {
  it("returns state unchanged when transcendence not purchased", () => {
    const state = {
      ...createInitialState(),
      religion: {
        ...createInitialReligion(),
        worship: 1000000,
      },
    };
    const next = applyAdore(state);
    expect(next).toBe(state);
  });

  it("converts worship to faithRatio when transcendence purchased", () => {
    const state = {
      ...createInitialState(),
      religion: {
        ...createInitialReligion(),
        worship: 1000000,
        religionUpgrades: {
          ...createInitialReligion().religionUpgrades,
          transcendence: { val: 1, on: 1 },
        },
        transcendenceTier: 0,
      },
    };
    // faithRatioGain = 1000000 / 1e6 * 1^2 = 1.0
    const next = applyAdore(state);
    expect(next.religion.faithRatio).toBeCloseTo(1.0, 10);
    expect(next.religion.worship).toBe(0.01);
  });

  it("uses (transcendenceTier + 1)^2 as multiplier", () => {
    const state = {
      ...createInitialState(),
      religion: {
        ...createInitialReligion(),
        worship: 1000000,
        religionUpgrades: {
          ...createInitialReligion().religionUpgrades,
          transcendence: { val: 1, on: 1 },
        },
        transcendenceTier: 3,
      },
    };
    // ttPlus1 = 4, gain = 1000000 / 1e6 * 16 = 16
    const next = applyAdore(state);
    expect(next.religion.faithRatio).toBeCloseTo(16.0, 10);
  });
});

// ── Story 7: TRANSCEND action ─────────────────────────────────────────────────

describe("applyTranscend", () => {
  it("returns state unchanged when transcendence not purchased", () => {
    const state = {
      ...createInitialState(),
      religion: {
        ...createInitialReligion(),
        faithRatio: 1000,
      },
    };
    const next = applyTranscend(state);
    expect(next).toBe(state);
  });

  it("increments transcendenceTier when faithRatio >= price", () => {
    const tier0 = 0;
    const price = getTranscendNextPrice(tier0);
    const state = {
      ...createInitialState(),
      religion: {
        ...createInitialReligion(),
        faithRatio: price + 0.001,
        religionUpgrades: {
          ...createInitialReligion().religionUpgrades,
          transcendence: { val: 1, on: 1 },
        },
      },
    };
    const next = applyTranscend(state);
    expect(next.religion.transcendenceTier).toBe(1);
  });

  it("deducts the correct faithRatio price", () => {
    const tier0 = 0;
    const price = getTranscendNextPrice(tier0);
    const startRatio = price * 2;
    const state = {
      ...createInitialState(),
      religion: {
        ...createInitialReligion(),
        faithRatio: startRatio,
        religionUpgrades: {
          ...createInitialReligion().religionUpgrades,
          transcendence: { val: 1, on: 1 },
        },
      },
    };
    const next = applyTranscend(state);
    expect(next.religion.faithRatio).toBeCloseTo(startRatio - price, 10);
  });

  it("returns state unchanged when faithRatio < price", () => {
    const state = {
      ...createInitialState(),
      religion: {
        ...createInitialReligion(),
        faithRatio: 0.001,
        religionUpgrades: {
          ...createInitialReligion().religionUpgrades,
          transcendence: { val: 1, on: 1 },
        },
      },
    };
    const next = applyTranscend(state);
    expect(next).toBe(state);
  });
});

// ── Story 8: updateEffects ────────────────────────────────────────────────────

describe("ReligionManager.updateEffects", () => {
  const mgr = new ReligionManager();

  it("contributes unicornsRatioReligion from unicornTomb val=3 on=3", () => {
    const state = {
      ...createInitialState(),
      religion: {
        ...createInitialReligion(),
        zigguratUpgrades: {
          ...createInitialReligion().zigguratUpgrades,
          unicornTomb: { val: 3, on: 3, unlocked: true },
        },
      },
    };
    const effects = mgr.updateEffects(state);
    expect(effects.unicornsRatioReligion).toBeCloseTo(3 * 0.05, 10);
  });

  it("contributes faithRatioReligion from solarchant on=2", () => {
    const state = {
      ...createInitialState(),
      religion: {
        ...createInitialReligion(),
        religionUpgrades: {
          ...createInitialReligion().religionUpgrades,
          solarchant: { val: 2, on: 2 },
        },
      },
    };
    const effects = mgr.updateEffects(state);
    expect(effects.faithRatioReligion).toBeCloseTo(2 * 0.1, 10);
  });

  it("blackObelisk solarRevolutionLimit = 0.05 * tier * on", () => {
    const state = {
      ...createInitialState(),
      religion: {
        ...createInitialReligion(),
        transcendenceTier: 5,
        transcendenceUpgrades: {
          ...createInitialReligion().transcendenceUpgrades,
          blackObelisk: { val: 1, on: 1, unlocked: true },
        },
      },
    };
    const effects = mgr.updateEffects(state);
    expect(effects.solarRevolutionLimit).toBeCloseTo(0.05 * 5 * 1, 10);
  });

  it("returns empty record when no upgrades are active", () => {
    const state = createInitialState();
    const effects = mgr.updateEffects(state);
    expect(Object.keys(effects).length).toBe(0);
  });

  it("contributes solarRevolutionRatio from solarRevolution upgrade with worship", () => {
    const state = {
      ...createInitialState(),
      religion: {
        ...createInitialReligion(),
        worship: 1000,
        religionUpgrades: {
          ...createInitialReligion().religionUpgrades,
          solarRevolution: { val: 1, on: 1 },
        },
      },
    };
    const effects = mgr.updateEffects(state);
    expect(effects.solarRevolutionRatio).toBeGreaterThan(0);
  });

  it("contributes non-blackObelisk TU effects (singularity globalResourceRatio)", () => {
    const state = {
      ...createInitialState(),
      religion: {
        ...createInitialReligion(),
        transcendenceTier: 7,
        transcendenceUpgrades: {
          ...createInitialReligion().transcendenceUpgrades,
          singularity: { val: 2, on: 2, unlocked: true },
        },
      },
    };
    const effects = mgr.updateEffects(state);
    expect(effects.globalResourceRatio).toBeCloseTo(2 * 0.1, 10);
  });
});

// ── Story 9: Faith per tick ───────────────────────────────────────────────────

describe("ReligionManager.update — faith per tick", () => {
  const mgr = new ReligionManager();

  it("adds faithPerTick to faith resource each tick", () => {
    const state = {
      ...createInitialState(),
      effectCache: { faithPerTick: 0.1 },
      resources: {
        ...createInitialResources(),
        faith: { value: 0, maxValue: 100 },
      },
    };
    const next = mgr.update(state);
    expect(next.resources.faith?.value).toBeCloseTo(0.1, 10);
  });

  it("clamps faith at maxValue", () => {
    const state = {
      ...createInitialState(),
      effectCache: { faithPerTick: 10 },
      resources: {
        ...createInitialResources(),
        faith: { value: 95, maxValue: 100 },
      },
    };
    const next = mgr.update(state);
    expect(next.resources.faith?.value).toBe(100);
  });

  it("does not add faith when faithPerTick = 0", () => {
    const state = {
      ...createInitialState(),
      effectCache: {},
      resources: {
        ...createInitialResources(),
        faith: { value: 5, maxValue: 100 },
      },
    };
    const next = mgr.update(state);
    // State should be unchanged (no faith generated)
    expect(next.resources.faith?.value).toBe(5);
  });

  it("does not add faith when maxValue = 0", () => {
    const state = {
      ...createInitialState(),
      effectCache: { faithPerTick: 0.5 },
      resources: {
        ...createInitialResources(),
        faith: { value: 0, maxValue: 0 },
      },
    };
    const next = mgr.update(state);
    expect(next.resources.faith?.value).toBe(0);
  });
});

// ── Story 10: Save / load / reset ─────────────────────────────────────────────

describe("ReligionManager save/load/reset", () => {
  const mgr = new ReligionManager();

  it("resetState returns initial religion state", () => {
    const modified = {
      ...createInitialState(),
      religion: {
        ...createInitialReligion(),
        worship: 999,
        transcendenceTier: 5,
      },
    };
    const reset = mgr.resetState(modified);
    expect(reset.religion.worship).toBe(0);
    expect(reset.religion.transcendenceTier).toBe(0);
  });

  it("save captures worship, faithRatio, transcendenceTier, zu, ru, tu", () => {
    const state = {
      ...createInitialState(),
      religion: {
        ...createInitialReligion(),
        worship: 1234,
        faithRatio: 5.5,
        transcendenceTier: 3,
        zigguratUpgrades: {
          ...createInitialReligion().zigguratUpgrades,
          unicornTomb: { val: 2, on: 2, unlocked: true },
        },
        religionUpgrades: {
          ...createInitialReligion().religionUpgrades,
          solarchant: { val: 1, on: 1 },
        },
        transcendenceUpgrades: {
          ...createInitialReligion().transcendenceUpgrades,
          blackObelisk: { val: 1, on: 1, unlocked: true },
        },
      },
    };
    const saved = mgr.save(state);
    expect(typeof saved).toBe("object");
    const s = saved as Record<string, unknown>;
    expect(s.worship).toBe(1234);
    expect(s.faithRatio).toBe(5.5);
    expect(s.transcendenceTier).toBe(3);
    expect((s.zu as Record<string, unknown>).unicornTomb).toEqual({
      val: 2,
      on: 2,
      unlocked: true,
    });
    expect((s.ru as Record<string, unknown>).solarchant).toEqual({ val: 1, on: 1 });
    expect((s.tu as Record<string, unknown>).blackObelisk).toEqual({
      val: 1,
      on: 1,
      unlocked: true,
    });
  });

  it("load restores worship, faithRatio, transcendenceTier, zu, ru, tu", () => {
    const data = {
      worship: 500,
      faithRatio: 2.2,
      transcendenceTier: 4,
      zu: { unicornTomb: { val: 3, on: 3, unlocked: true } },
      ru: { solarchant: { val: 2, on: 2 } },
      tu: { blackObelisk: { val: 1, on: 1, unlocked: true } },
    };
    const loaded = mgr.load(data, createInitialState());
    expect(loaded.religion.worship).toBe(500);
    expect(loaded.religion.faithRatio).toBe(2.2);
    expect(loaded.religion.transcendenceTier).toBe(4);
    expect(loaded.religion.zigguratUpgrades.unicornTomb?.val).toBe(3);
    expect(loaded.religion.religionUpgrades.solarchant?.val).toBe(2);
    expect(loaded.religion.transcendenceUpgrades.blackObelisk?.val).toBe(1);
  });

  it("load with missing/null data returns default state", () => {
    const loaded = mgr.load(null, createInitialState());
    expect(loaded.religion.worship).toBe(0);
    expect(loaded.religion.transcendenceTier).toBe(0);
  });

  it("load uses default unlocked when zu entry has no unlocked field", () => {
    // This tests the fallback branch at line 878
    const data = {
      worship: 0,
      faithRatio: 0,
      transcendenceTier: 0,
      zu: { unicornTomb: { val: 1, on: 1 /* no unlocked field */ } },
      ru: {},
      tu: {},
    };
    const loaded = mgr.load(data, createInitialState());
    // unicornTomb is defaultUnlocked: true, so the fallback should be true
    expect(loaded.religion.zigguratUpgrades.unicornTomb?.unlocked).toBe(true);
  });
});

// ── Story 11: Cross-manager integration test ──────────────────────────────────

describe("cross-manager integration with ReligionManager", () => {
  it("tick advances without error with all managers registered", () => {
    const managers = [
      new ResourceManager(),
      new BuildingManager(),
      new VillageManager(),
      new CalendarManager(),
      new ScienceManager(),
      new WorkshopManager(),
      new ReligionManager(),
    ];
    const state = createInitialState();
    expect(() => tick(state, managers)).not.toThrow();
  });

  it("faith accumulates per tick when faithPerTick is in effectCache", () => {
    const managers = [new ReligionManager()];
    const state = {
      ...createInitialState(),
      effectCache: { faithPerTick: 1.0 },
      resources: {
        ...createInitialResources(),
        faith: { value: 0, maxValue: 100 },
      },
    };
    const next = tick(state, managers);
    expect(next.resources.faith?.value).toBeCloseTo(1.0, 10);
  });

  it("PRAISE action increases worship and resets faith", () => {
    const state = {
      ...createInitialState(),
      resources: {
        ...createInitialResources(),
        faith: { value: 200, maxValue: 10000 },
      },
    };
    const next = applyPraise(state);
    expect(next.religion.worship).toBeCloseTo(200, 5);
    expect(next.resources.faith?.value).toBe(0.0001);
  });

  it("effectCache has unicornsRatioReligion after building ziggurat upgrades", () => {
    const managers = [new ReligionManager()];
    const state = {
      ...createInitialState(),
      religion: {
        ...createInitialReligion(),
        zigguratUpgrades: {
          ...createInitialReligion().zigguratUpgrades,
          unicornTomb: { val: 2, on: 2, unlocked: true },
        },
      },
    };
    const effects = buildEffectCache(managers, state);
    expect(effects.unicornsRatioReligion).toBeCloseTo(2 * 0.05, 10);
  });
});

// ── Utility function tests ────────────────────────────────────────────────────

describe("getApocryphaBonus", () => {
  it("returns 0 when faithRatio = 0", () => {
    expect(getApocryphaBonus(0)).toBe(0);
  });

  it("returns a positive value when faithRatio > 0", () => {
    expect(getApocryphaBonus(1)).toBeGreaterThan(0);
  });
});

describe("getTranscendTotalPrice / getTranscendNextPrice", () => {
  it("total price at tier 0 is 0 (nothing spent yet)", () => {
    // getInverseUnlimitedDR(exp(0)/10, 0.1) = getInverseUnlimitedDR(0.1, 0.1)
    // = (exp(0.1 * 0.1) - 1) / 0.1 = (exp(0.01) - 1) / 0.1
    const expected = (Math.exp(0.01) - 1) / 0.1;
    expect(getTranscendTotalPrice(0)).toBeCloseTo(expected, 10);
  });

  it("next price at tier 0 is positive", () => {
    expect(getTranscendNextPrice(0)).toBeGreaterThan(0);
  });

  it("price to advance increases with tier (monotonically)", () => {
    for (let i = 0; i < 5; i++) {
      expect(getTranscendNextPrice(i + 1)).toBeGreaterThan(getTranscendNextPrice(i));
    }
  });
});

// ── Action dispatch coverage ──────────────────────────────────────────────────

describe("applyAction — religion actions", () => {
  it("BUY_ZIGGURAT_UPGRADE dispatches correctly", () => {
    const state = {
      ...createInitialState(),
      resources: {
        ...createInitialResources(),
        ivory: { value: 1000, maxValue: 10000 },
        tears: { value: 100, maxValue: 1000 },
      },
    };
    const next = applyAction(state, { type: "BUY_ZIGGURAT_UPGRADE", name: "unicornTomb" });
    expect(next.religion.zigguratUpgrades.unicornTomb?.val).toBe(1);
  });

  it("BUY_RELIGION_UPGRADE dispatches correctly", () => {
    const state = {
      ...createInitialState(),
      resources: {
        ...createInitialResources(),
        faith: { value: 200, maxValue: 10000 },
      },
    };
    const next = applyAction(state, { type: "BUY_RELIGION_UPGRADE", name: "solarchant" });
    expect(next.religion.religionUpgrades.solarchant?.val).toBe(1);
  });

  it("BUY_TRANSCENDENCE_UPGRADE dispatches correctly", () => {
    const state = {
      ...createInitialState(),
      resources: {
        ...createInitialResources(),
        relic: { value: 1000000, maxValue: 10000000 },
      },
      religion: {
        ...createInitialReligion(),
        transcendenceTier: 1,
      },
    };
    const next = applyAction(state, {
      type: "BUY_TRANSCENDENCE_UPGRADE",
      name: "blackObelisk",
    });
    expect(next.religion.transcendenceUpgrades.blackObelisk?.val).toBe(1);
  });

  it("PRAISE dispatches correctly", () => {
    const state = {
      ...createInitialState(),
      resources: {
        ...createInitialResources(),
        faith: { value: 100, maxValue: 10000 },
      },
    };
    const next = applyAction(state, { type: "PRAISE" });
    expect(next.religion.worship).toBeCloseTo(100, 5);
  });

  it("ADORE dispatches correctly", () => {
    const state = {
      ...createInitialState(),
      religion: {
        ...createInitialReligion(),
        worship: 2000000,
        religionUpgrades: {
          ...createInitialReligion().religionUpgrades,
          transcendence: { val: 1, on: 1 },
        },
      },
    };
    const next = applyAction(state, { type: "ADORE" });
    expect(next.religion.faithRatio).toBeCloseTo(2.0, 10);
  });

  it("TRANSCEND dispatches correctly", () => {
    const price = getTranscendNextPrice(0);
    const state = {
      ...createInitialState(),
      religion: {
        ...createInitialReligion(),
        faithRatio: price + 1,
        religionUpgrades: {
          ...createInitialReligion().religionUpgrades,
          transcendence: { val: 1, on: 1 },
        },
      },
    };
    const next = applyAction(state, { type: "TRANSCEND" });
    expect(next.religion.transcendenceTier).toBe(1);
  });
});

describe("getSolarRevolutionRatio", () => {
  it("returns 0 when worship = 0", () => {
    expect(getSolarRevolutionRatio(0, {})).toBe(0);
  });

  it("returns positive value when worship > 0", () => {
    expect(getSolarRevolutionRatio(1000, {})).toBeGreaterThan(0);
  });

  it("is capped by the limit (10 by default) and grows with worship", () => {
    // getLimitedDR(x, 10) = 10 * (1 - exp(-x/10))
    // With very high worship, uncapped approaches infinity, so result approaches 10
    const ratio1 = getSolarRevolutionRatio(1000, {});
    const ratio2 = getSolarRevolutionRatio(10000, {});
    expect(ratio2).toBeGreaterThan(ratio1);
    // Both should be below the limit of 10
    expect(ratio1).toBeLessThan(10);
    expect(ratio2).toBeLessThan(10);
  });
});

// ── Story 19-6: Unicorn sacrifice actions ──────────────────────────────────────

describe("applySacrificeUnicorns (Story 19-6)", () => {
  it("costs 2500 unicorns and gains ziggurat.on tears", () => {
    const base = createInitialState();
    const s = {
      ...base,
      resources: {
        ...base.resources,
        unicorns: { value: 5000, maxValue: 0 },
        tears: { value: 0, maxValue: 1_000_000 },
      },
      buildings: {
        ...base.buildings,
        ziggurat: { val: 3, on: 3 },
      },
    };
    const next = applySacrificeUnicorns(s);
    expect(next.resources.unicorns?.value).toBe(2500);
    expect(next.resources.tears?.value).toBe(3); // ziggurat.on = 3
  });

  it("returns unchanged if unicorns < 2500", () => {
    const base = createInitialState();
    const s = {
      ...base,
      resources: {
        ...base.resources,
        unicorns: { value: 100, maxValue: 0 },
        tears: { value: 0, maxValue: 0 },
      },
      buildings: { ...base.buildings, ziggurat: { val: 1, on: 1 } },
    };
    expect(applySacrificeUnicorns(s)).toBe(s);
  });

  it("returns unchanged if no ziggurat built (on=0)", () => {
    const base = createInitialState();
    const s = {
      ...base,
      resources: {
        ...base.resources,
        unicorns: { value: 5000, maxValue: 0 },
        tears: { value: 0, maxValue: 0 },
      },
    };
    expect(applySacrificeUnicorns(s)).toBe(s);
  });

  it("SACRIFICE_UNICORNS dispatches via applyAction", () => {
    const base = createInitialState();
    const s = {
      ...base,
      resources: {
        ...base.resources,
        unicorns: { value: 5000, maxValue: 0 },
        tears: { value: 0, maxValue: 1_000_000 },
      },
      buildings: { ...base.buildings, ziggurat: { val: 2, on: 2 } },
    };
    const next = applyAction(s, { type: "SACRIFICE_UNICORNS" });
    expect(next.resources.unicorns?.value).toBe(2500);
    expect(next.resources.tears?.value).toBe(2);
  });
});

describe("applySacrificeAlicorns (Story 19-6)", () => {
  it("costs 25 alicorns and gains (1 + tcRefineRatio) timeCrystals", () => {
    const base = createInitialState();
    const s = {
      ...base,
      effectCache: { tcRefineRatio: 0.5 },
      resources: {
        ...base.resources,
        alicorn: { value: 50, maxValue: 0 },
        timeCrystal: { value: 0, maxValue: 1_000_000 },
      },
    };
    const next = applySacrificeAlicorns(s);
    expect(next.resources.alicorn?.value).toBe(25);
    expect(next.resources.timeCrystal?.value).toBeCloseTo(1.5); // 1 + 0.5
  });

  it("unlocks skyPalace, unicornUtopia, sunspire ziggurat upgrades", () => {
    const base = createInitialState();
    const s = {
      ...base,
      resources: {
        ...base.resources,
        alicorn: { value: 50, maxValue: 0 },
        timeCrystal: { value: 0, maxValue: 0 },
      },
    };
    const next = applySacrificeAlicorns(s);
    expect(next.religion.zigguratUpgrades.skyPalace?.unlocked).toBe(true);
    expect(next.religion.zigguratUpgrades.unicornUtopia?.unlocked).toBe(true);
    expect(next.religion.zigguratUpgrades.sunspire?.unlocked).toBe(true);
  });

  it("returns unchanged if alicorns < 25", () => {
    const base = createInitialState();
    const s = {
      ...base,
      resources: {
        ...base.resources,
        alicorn: { value: 10, maxValue: 0 },
        timeCrystal: { value: 0, maxValue: 0 },
      },
    };
    expect(applySacrificeAlicorns(s)).toBe(s);
  });
});

describe("applyRefineTimeCrystals (Story 19-6)", () => {
  it("costs 25 timeCrystals and gains (1 + relicRefineRatio) relics", () => {
    const base = createInitialState();
    const s = {
      ...base,
      effectCache: { relicRefineRatio: 2 },
      resources: {
        ...base.resources,
        timeCrystal: { value: 50, maxValue: 0 },
        relic: { value: 0, maxValue: 1_000_000 },
      },
    };
    const next = applyRefineTimeCrystals(s);
    expect(next.resources.timeCrystal?.value).toBe(25);
    expect(next.resources.relic?.value).toBeCloseTo(3); // 1 + 2
  });

  it("returns unchanged if timeCrystal < 25", () => {
    const base = createInitialState();
    const s = {
      ...base,
      resources: {
        ...base.resources,
        timeCrystal: { value: 10, maxValue: 0 },
        relic: { value: 0, maxValue: 0 },
      },
    };
    expect(applyRefineTimeCrystals(s)).toBe(s);
  });

  it("REFINE_TIME_CRYSTALS dispatches via applyAction", () => {
    const base = createInitialState();
    const s = {
      ...base,
      resources: {
        ...base.resources,
        timeCrystal: { value: 100, maxValue: 0 },
        relic: { value: 5, maxValue: 1_000_000 },
      },
    };
    const next = applyAction(s, { type: "REFINE_TIME_CRYSTALS" });
    expect(next.resources.timeCrystal?.value).toBe(75);
    expect(next.resources.relic?.value).toBeCloseTo(6); // 5 + 1 (no relicRefineRatio)
  });
});
