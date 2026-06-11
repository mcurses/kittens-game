import { produce } from "immer";
import { describe, expect, it } from "vitest";
import { applyAction } from "./actions.js";
import { BuildingManager } from "./buildings.js";
import { CalendarManager } from "./calendar.js";
import { ChallengeManager } from "./challenges.js";
import {
  BASE_CATPOWER_COST,
  BASE_GOLD_COST,
  DiplomacyManager,
  RACE_DEFS,
  applySendEmbassy,
  applyTrade,
  calculateTradeYield,
  createInitialDiplomacy,
  getEmbassyCost,
} from "./diplomacy.js";
import { PrestigeManager } from "./prestige.js";
import { ReligionManager } from "./religion.js";
import { ResourceManager } from "./resources.js";
import { ScienceManager } from "./science.js";
import { SpaceManager } from "./space.js";
import { createInitialState } from "./state.js";
import { tick } from "./tick.js";
import { VillageManager } from "./village.js";
import { WorkshopManager } from "./workshop.js";

// ── Helpers ────────────────────────────────────────────────────────────────────

function makeManagers() {
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
  ];
}

function stateWithResources(resources: Record<string, number>) {
  const state = createInitialState();
  return produce(state, (draft) => {
    for (const [name, val] of Object.entries(resources)) {
      if (draft.resources[name]) {
        draft.resources[name].value = val;
        // Set maxValue to at least 1M to avoid capping trade yields at 0
        draft.resources[name].maxValue = Math.max(val * 10, 1000000);
      }
    }
  });
}

function stateWithRaceUnlocked(raceName: string, resources: Record<string, number> = {}) {
  const base = stateWithResources(resources);
  return produce(base, (draft) => {
    const race = draft.diplomacy.races[raceName];
    if (race) race.unlocked = true;
  });
}

// ── Story 1: DiplomacyState shape and initial values ──────────────────────────

describe("createInitialDiplomacy", () => {
  it("all 8 races are present", () => {
    const diplomacy = createInitialDiplomacy();
    expect(RACE_DEFS.length).toBe(8);
    for (const def of RACE_DEFS) {
      expect(diplomacy.races[def.name]).toBeDefined();
    }
  });

  it("all races start unlocked=false, embassyLevel=0", () => {
    const diplomacy = createInitialDiplomacy();
    for (const entry of Object.values(diplomacy.races)) {
      expect(entry.unlocked).toBe(false);
      expect(entry.embassyLevel).toBe(0);
    }
  });

  it("base gold cost is 15", () => {
    const diplomacy = createInitialDiplomacy();
    expect(diplomacy.baseGoldCost).toBe(BASE_GOLD_COST);
    expect(diplomacy.baseGoldCost).toBe(15);
  });

  it("base catpower cost is 50", () => {
    const diplomacy = createInitialDiplomacy();
    expect(diplomacy.baseCatpowerCost).toBe(BASE_CATPOWER_COST);
    expect(diplomacy.baseCatpowerCost).toBe(50);
  });
});

// ── Story 2: SEND_EMBASSY action ──────────────────────────────────────────────

describe("SEND_EMBASSY", () => {
  it("increments embassy level when race unlocked and culture sufficient", () => {
    const state = stateWithRaceUnlocked("lizards", { culture: 500 });
    // lizards embassy: (0+1)*100 = 100 culture for level 1
    const next = applySendEmbassy(state, "lizards");
    expect(next.diplomacy.races.lizards?.embassyLevel).toBe(1);
  });

  it("deducts culture on embassy", () => {
    const state = stateWithRaceUnlocked("lizards", { culture: 500 });
    const cost = getEmbassyCost(RACE_DEFS.find((r) => r.name === "lizards")!, 0);
    const next = applySendEmbassy(state, "lizards");
    expect(next.resources.culture?.value).toBeCloseTo(500 - cost, 1);
  });

  it("embassy cost scales with existing level", () => {
    const def = RACE_DEFS.find((r) => r.name === "lizards")!;
    expect(getEmbassyCost(def, 0)).toBe(100); // (0+1)*100
    expect(getEmbassyCost(def, 1)).toBe(200); // (1+1)*100
    expect(getEmbassyCost(def, 4)).toBe(500); // (4+1)*100
  });

  it("returns unchanged state when race not unlocked", () => {
    const state = stateWithResources({ culture: 500 });
    const next = applySendEmbassy(state, "lizards");
    expect(next).toBe(state);
  });

  it("returns unchanged state when culture insufficient", () => {
    const state = stateWithRaceUnlocked("lizards", { culture: 50 });
    const next = applySendEmbassy(state, "lizards");
    expect(next).toBe(state);
  });

  it("returns unchanged state for unknown race", () => {
    const state = createInitialState();
    const next = applySendEmbassy(state, "unknownRace");
    expect(next).toBe(state);
  });

  it("leviathans have no embassy (embassyPrice=0)", () => {
    const state = stateWithRaceUnlocked("leviathans", { culture: 100000 });
    const next = applySendEmbassy(state, "leviathans");
    expect(next).toBe(state);
  });

  it("dispatch via applyAction works", () => {
    const state = stateWithRaceUnlocked("lizards", { culture: 500 });
    const next = applyAction(state, { type: "SEND_EMBASSY", name: "lizards" });
    expect(next.diplomacy.races.lizards?.embassyLevel).toBe(1);
  });
});

// ── Story 3: TRADE action ─────────────────────────────────────────────────────

describe("TRADE", () => {
  it("deducts gold, catpower, and buy resource on trade", () => {
    // lizards buy minerals:1000, trade costs gold:15, catpower:50
    const state = stateWithRaceUnlocked("lizards", {
      gold: 100,
      catpower: 500,
      minerals: 5000,
      wood: 0,
    });
    const next = applyTrade(state, "lizards");
    expect(next.resources.gold?.value).toBeCloseTo(85, 1);
    expect(next.resources.catpower?.value).toBeCloseTo(450, 1);
    expect(next.resources.minerals?.value).toBeCloseTo(4000, 1);
  });

  it("adds wood from lizards trade (chance=1, always received)", () => {
    const state = stateWithRaceUnlocked("lizards", {
      gold: 100,
      catpower: 500,
      minerals: 5000,
      wood: 0,
    });
    const next = applyTrade(state, "lizards");
    // wood: value=500, chance=1, multiplier=1 (no tradeRatio)
    expect(next.resources.wood?.value).toBeGreaterThan(0);
  });

  it("returns unchanged state when race not unlocked", () => {
    const state = stateWithResources({ gold: 100, catpower: 500, minerals: 5000 });
    const next = applyTrade(state, "lizards");
    expect(next).toBe(state);
  });

  it("returns unchanged state when gold insufficient", () => {
    const state = stateWithRaceUnlocked("lizards", { gold: 5, catpower: 500, minerals: 5000 });
    const next = applyTrade(state, "lizards");
    expect(next).toBe(state);
  });

  it("returns unchanged state when catpower insufficient", () => {
    const state = stateWithRaceUnlocked("lizards", { gold: 100, catpower: 10, minerals: 5000 });
    const next = applyTrade(state, "lizards");
    expect(next).toBe(state);
  });

  it("returns unchanged state when buy resource insufficient", () => {
    const state = stateWithRaceUnlocked("lizards", { gold: 100, catpower: 500, minerals: 0 });
    const next = applyTrade(state, "lizards");
    expect(next).toBe(state);
  });

  it("returns unchanged state for unknown race", () => {
    const state = createInitialState();
    const next = applyTrade(state, "unknownRace");
    expect(next).toBe(state);
  });

  it("tradeRatio in effectCache increases trade yield", () => {
    const baseState = stateWithRaceUnlocked("lizards", {
      gold: 100,
      catpower: 500,
      minerals: 5000,
      wood: 0,
    });
    const stateNoRatio = applyTrade(baseState, "lizards");
    const woodBase = stateNoRatio.resources.wood?.value ?? 0;

    const stateWithRatio = produce(baseState, (draft) => {
      draft.effectCache.tradeRatio = 0.5;
    });
    const stateRatio = applyTrade(stateWithRatio, "lizards");
    const woodWithRatio = stateRatio.resources.wood?.value ?? 0;

    expect(woodWithRatio).toBeGreaterThan(woodBase);
  });

  it("minLevel items not included when embassy below threshold", () => {
    // lizards beam requires minLevel=5, default embassy=0
    const state = stateWithRaceUnlocked("lizards", {
      gold: 100,
      catpower: 500,
      minerals: 5000,
      beam: 0,
    });
    const next = applyTrade(state, "lizards");
    // beam should not be in yield with embassyLevel=0
    expect(next.resources.beam?.value ?? 0).toBe(0);
  });

  it("minLevel items included when embassy at or above threshold", () => {
    const state = produce(
      stateWithRaceUnlocked("lizards", {
        gold: 100,
        catpower: 500,
        minerals: 5000,
        beam: 0,
      }),
      (draft) => {
        const r = draft.diplomacy.races.lizards;
        if (r) r.embassyLevel = 5;
      },
    );
    const next = applyTrade(state, "lizards");
    expect(next.resources.beam?.value ?? 0).toBeGreaterThan(0);
  });

  it("dispatch via applyAction works", () => {
    const state = stateWithRaceUnlocked("lizards", {
      gold: 100,
      catpower: 500,
      minerals: 5000,
      wood: 0,
    });
    const next = applyAction(state, { type: "TRADE", name: "lizards" });
    expect(next.resources.gold?.value).toBeCloseTo(85, 1);
  });
});

// ── calculateTradeYield helper ─────────────────────────────────────────────────

describe("calculateTradeYield", () => {
  const lizardsDef = RACE_DEFS.find((r) => r.name === "lizards")!;

  it("returns wood for lizards at embassy level 0", () => {
    const yield_ = calculateTradeYield(lizardsDef, 0, 0, "spring");
    expect(yield_.wood).toBeGreaterThan(0);
  });

  it("no beam/scaffold at embassy level 0 (minLevel 5/10)", () => {
    const yield_ = calculateTradeYield(lizardsDef, 0, 0, "spring");
    expect(yield_.beam).toBeUndefined();
    expect(yield_.scaffold).toBeUndefined();
  });

  it("includes beam at embassy level 5", () => {
    const yield_ = calculateTradeYield(lizardsDef, 5, 0, "spring");
    expect(yield_.beam).toBeGreaterThan(0);
  });

  it("tradeRatio=0.5 increases yield by 50%", () => {
    const baseYield = calculateTradeYield(lizardsDef, 0, 0, "spring");
    const boostedYield = calculateTradeYield(lizardsDef, 0, 0.5, "spring");
    expect(boostedYield.wood).toBeCloseTo((baseYield.wood ?? 0) * 1.5, 1);
  });
});

// ── Story 4: Race unlock mechanics ────────────────────────────────────────────

describe("DiplomacyManager.update - race unlocks", () => {
  const manager = new DiplomacyManager();

  it("unlocks nagas when culture >= 1500", () => {
    const state = produce(createInitialState(), (draft) => {
      if (draft.resources.culture) {
        draft.resources.culture.value = 1500;
      }
    });
    const next = manager.update(state);
    expect(next.diplomacy.races.nagas?.unlocked).toBe(true);
  });

  it("does not unlock nagas when culture < 1500", () => {
    const state = produce(createInitialState(), (draft) => {
      if (draft.resources.culture) {
        draft.resources.culture.value = 1000;
      }
    });
    const next = manager.update(state);
    expect(next.diplomacy.races.nagas?.unlocked).toBe(false);
  });

  it("unlocks zebras when ship >= 1", () => {
    const state = produce(createInitialState(), (draft) => {
      draft.resources.ship = { value: 1, maxValue: 100 };
    });
    const next = manager.update(state);
    expect(next.diplomacy.races.zebras?.unlocked).toBe(true);
  });

  it("unlocks dragons when nuclearFission researched", () => {
    const state = produce(createInitialState(), (draft) => {
      const tech = draft.science.techs.nuclearFission;
      if (tech) tech.researched = true;
    });
    const next = manager.update(state);
    expect(next.diplomacy.races.dragons?.unlocked).toBe(true);
  });

  it("unlocks spiders when ship >= 100 and scienceMax > 125000", () => {
    const state = produce(createInitialState(), (draft) => {
      draft.resources.ship = { value: 100, maxValue: 200 };
      draft.effectCache.scienceMax = 200000;
    });
    const next = manager.update(state);
    expect(next.diplomacy.races.spiders?.unlocked).toBe(true);
  });

  it("does not unlock spiders when ship < 100", () => {
    const state = produce(createInitialState(), (draft) => {
      draft.resources.ship = { value: 50, maxValue: 200 };
      draft.effectCache.scienceMax = 200000;
    });
    const next = manager.update(state);
    expect(next.diplomacy.races.spiders?.unlocked).toBe(false);
  });
});

// ── Story 5: updateEffects ────────────────────────────────────────────────────

describe("DiplomacyManager.updateEffects", () => {
  it("returns empty effects (no direct effectCache contributions)", () => {
    const manager = new DiplomacyManager();
    const state = createInitialState();
    const effects = manager.updateEffects(state);
    expect(Object.keys(effects).length).toBe(0);
  });
});

// ── Story 6: Save / load / reset ─────────────────────────────────────────────

describe("DiplomacyManager save/load/reset", () => {
  const manager = new DiplomacyManager();

  it("resetState restores initial diplomacy state", () => {
    const state = produce(createInitialState(), (draft) => {
      const r = draft.diplomacy.races.lizards;
      if (r) {
        r.unlocked = true;
        r.embassyLevel = 5;
      }
    });
    const reset = manager.resetState(state);
    expect(reset.diplomacy.races.lizards?.unlocked).toBe(false);
    expect(reset.diplomacy.races.lizards?.embassyLevel).toBe(0);
  });

  it("save/load round-trip preserves race unlock and embassy levels", () => {
    const state = produce(createInitialState(), (draft) => {
      const r = draft.diplomacy.races.lizards;
      if (r) {
        r.unlocked = true;
        r.embassyLevel = 3;
      }
      const n = draft.diplomacy.races.nagas;
      if (n) n.unlocked = true;
    });

    const saved = manager.save(state);
    const loaded = manager.load(saved, createInitialState());

    expect(loaded.diplomacy.races.lizards?.unlocked).toBe(true);
    expect(loaded.diplomacy.races.lizards?.embassyLevel).toBe(3);
    expect(loaded.diplomacy.races.nagas?.unlocked).toBe(true);
  });

  it("load preserves baseGoldCost and baseCatpowerCost", () => {
    const state = produce(createInitialState(), (draft) => {
      draft.diplomacy.baseGoldCost = 10;
      draft.diplomacy.baseCatpowerCost = 30;
    });
    const saved = manager.save(state);
    const loaded = manager.load(saved, createInitialState());
    expect(loaded.diplomacy.baseGoldCost).toBe(10);
    expect(loaded.diplomacy.baseCatpowerCost).toBe(30);
  });
});

// ── Story 7: Cross-manager integration test ───────────────────────────────────

describe("DiplomacyManager integration - full tick loop", () => {
  it("full tick loop with all managers runs without errors", () => {
    const managers = makeManagers();
    let state = createInitialState();
    for (const m of managers) {
      state = m.resetState(state);
    }
    expect(() => {
      for (let i = 0; i < 5; i++) {
        state = tick(state, managers);
      }
    }).not.toThrow();
  });

  it("nagas become unlocked when culture >= 1500 during tick", () => {
    const managers = makeManagers();
    let state = createInitialState();
    for (const m of managers) {
      state = m.resetState(state);
    }

    state = produce(state, (draft) => {
      if (draft.resources.culture) {
        draft.resources.culture.value = 2000;
        draft.resources.culture.maxValue = 10000;
      }
    });

    state = tick(state, managers);
    expect(state.diplomacy.races.nagas?.unlocked).toBe(true);
  });

  it("TRADE action works within full tick context", () => {
    const managers = makeManagers();
    let state = createInitialState();
    for (const m of managers) {
      state = m.resetState(state);
    }

    state = produce(state, (draft) => {
      draft.diplomacy.races.lizards = { unlocked: true, embassyLevel: 0 };
      draft.resources.gold = { value: 100, maxValue: 1000 };
      draft.resources.catpower = { value: 500, maxValue: 5000 };
      draft.resources.minerals = { value: 5000, maxValue: 50000 };
      draft.resources.wood = { value: 0, maxValue: 50000 };
    });

    state = applyAction(state, { type: "TRADE", name: "lizards" }, managers);
    expect(state.resources.gold?.value).toBeCloseTo(85, 1);
    expect(state.resources.wood?.value).toBeGreaterThan(0);
  });

  it("state is valid JSON after serialization", () => {
    const managers = makeManagers();
    let state = createInitialState();
    for (const m of managers) {
      state = m.resetState(state);
    }
    expect(() => JSON.stringify(state)).not.toThrow();
  });
});

// ── Story 19-7: Seasonal trade modifiers in RACE_DEFS ──────────────────────────

describe("RACE_DEFS seasonal modifiers (Story 19-7)", () => {
  const lizards = RACE_DEFS.find((r) => r.name === "lizards")!;
  const sharks = RACE_DEFS.find((r) => r.name === "sharks")!;
  const griffins = RACE_DEFS.find((r) => r.name === "griffins")!;
  const nagas = RACE_DEFS.find((r) => r.name === "nagas")!;
  const zebras = RACE_DEFS.find((r) => r.name === "zebras")!;

  it("lizards wood has correct seasonal modifiers", () => {
    const woodSell = lizards.sells.find((s) => s.name === "wood")!;
    expect(woodSell.seasons?.spring).toBeCloseTo(-0.05);
    expect(woodSell.seasons?.summer).toBeCloseTo(0.35);
    expect(woodSell.seasons?.autumn).toBeCloseTo(0.15);
    expect(woodSell.seasons?.winter).toBeCloseTo(0.05);
  });

  it("sharks catnip has correct seasonal modifiers", () => {
    const catnipSell = sharks.sells.find((s) => s.name === "catnip")!;
    expect(catnipSell.seasons?.spring).toBeCloseTo(0.2);
    expect(catnipSell.seasons?.summer).toBeCloseTo(-0.05);
    expect(catnipSell.seasons?.autumn).toBeCloseTo(0.15);
    expect(catnipSell.seasons?.winter).toBeCloseTo(0.45);
  });

  it("griffins iron has correct seasonal modifiers", () => {
    const ironSell = griffins.sells.find((s) => s.name === "iron")!;
    expect(ironSell.seasons?.spring).toBeCloseTo(-0.25);
    expect(ironSell.seasons?.summer).toBeCloseTo(-0.05);
    expect(ironSell.seasons?.autumn).toBeCloseTo(0.35);
    expect(ironSell.seasons?.winter).toBeCloseTo(-0.2);
  });

  it("nagas minerals has correct seasonal modifiers", () => {
    const mineralsSell = nagas.sells.find((s) => s.name === "minerals")!;
    expect(mineralsSell.seasons?.spring).toBeCloseTo(0.25);
    expect(mineralsSell.seasons?.summer).toBeCloseTo(0.05);
    expect(mineralsSell.seasons?.autumn).toBeCloseTo(-0.35);
    expect(mineralsSell.seasons?.winter).toBeCloseTo(-0.05);
  });

  it("zebras iron has correct seasonal modifiers", () => {
    const ironSell = zebras.sells.find((s) => s.name === "iron")!;
    expect(ironSell.seasons?.spring).toBeCloseTo(0);
    expect(ironSell.seasons?.summer).toBeCloseTo(0.15);
    expect(ironSell.seasons?.autumn).toBeCloseTo(-0.1);
    expect(ironSell.seasons?.winter).toBeCloseTo(-0.2);
  });

  it("calculateTradeYield applies seasonal modifier from CalendarState.season", () => {
    // lizards wood in summer: base 500 * chance 1 * (1+0) * (1+0.35) = 675
    const wood = calculateTradeYield(lizards, 0, 0, "summer").wood;
    expect(wood).toBeCloseTo(675);
  });

  it("calculateTradeYield applies negative seasonal modifier (winter reduces yield)", () => {
    // sharks catnip in winter: 35000 * 1 * 1 * (1+0.45) = 50750... wait
    // Actually sharks catnip winter = +0.45 (bonus), not penalty
    // Use griffins iron in spring: 250 * 1 * 1 * (1-0.25) = 187.5
    const iron = calculateTradeYield(griffins, 0, 0, "spring").iron;
    expect(iron).toBeCloseTo(187.5);
  });
});
