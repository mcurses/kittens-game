import type { Serializable } from "@kittens/shared";
import { produce } from "immer";
import type { PriceEntry } from "./buildings.js";
import { canAfford } from "./buildings.js";
import type { Manager } from "./manager.js";
import type { GameState } from "./state.js";

// ── ZigguratUpgradeDef ────────────────────────────────────────────────────────

export interface ZigguratUpgradeUnlocks {
  readonly zigguratUpgrades?: readonly string[];
  readonly policies?: readonly string[];
}

export interface ZigguratUpgradeDef {
  readonly name: string;
  readonly prices: readonly PriceEntry[];
  readonly priceRatio: number;
  readonly effects: Readonly<Record<string, number>>;
  readonly defaultUnlocked: boolean;
  readonly unlocks?: ZigguratUpgradeUnlocks;
}

export interface ZigguratUpgradeEntry {
  readonly val: number;
  readonly on: number;
  readonly unlocked: boolean;
}

// ── ReligionUpgradeDef ────────────────────────────────────────────────────────

export interface ReligionUpgradeDef {
  readonly name: string;
  readonly prices: readonly PriceEntry[];
  readonly priceRatio: number;
  readonly effects: Readonly<Record<string, number>>;
  /** Minimum accumulated worship required to see/buy */
  readonly faith: number;
  /** Names of religion upgrades to also increment val+on when this is purchased */
  readonly upgradesReligion?: readonly string[];
}

export interface ReligionUpgradeEntry {
  readonly val: number;
  readonly on: number;
}

// ── TranscendenceUpgradeDef ───────────────────────────────────────────────────

export interface TranscendenceUpgradeDef {
  readonly name: string;
  readonly prices: readonly PriceEntry[];
  readonly priceRatio: number;
  readonly tier: number;
  readonly effects: Readonly<Record<string, number>>;
}

export interface TranscendenceUpgradeEntry {
  readonly val: number;
  readonly on: number;
  readonly unlocked: boolean;
}

// ── ReligionState ─────────────────────────────────────────────────────────────

export interface ReligionState {
  /** Accumulated worship (gained through PRAISE action) */
  readonly worship: number;
  /** faithRatio — accumulated via ADORE action, spent to TRANSCEND */
  readonly faithRatio: number;
  /** Current transcendence tier */
  readonly transcendenceTier: number;
  /** Ziggurat upgrade counts */
  readonly zigguratUpgrades: Record<string, ZigguratUpgradeEntry>;
  /** Religion upgrade counts */
  readonly religionUpgrades: Record<string, ReligionUpgradeEntry>;
  /** Transcendence upgrade counts */
  readonly transcendenceUpgrades: Record<string, TranscendenceUpgradeEntry>;
}

// ── ZIGGURAT_UPGRADE_DEFS ─────────────────────────────────────────────────────

export const ZIGGURAT_UPGRADE_DEFS: readonly ZigguratUpgradeDef[] = [
  {
    name: "unicornTomb",
    prices: [
      { name: "ivory", val: 500 },
      { name: "tears", val: 5 },
    ],
    priceRatio: 1.15,
    effects: { unicornsRatioReligion: 0.05 },
    defaultUnlocked: true,
    unlocks: { zigguratUpgrades: ["ivoryTower"] },
  },
  {
    name: "ivoryTower",
    prices: [
      { name: "ivory", val: 25000 },
      { name: "tears", val: 25 },
    ],
    priceRatio: 1.15,
    effects: { unicornsRatioReligion: 0.1, riftChance: 0.0005 },
    defaultUnlocked: false,
    unlocks: { zigguratUpgrades: ["ivoryCitadel"] },
  },
  {
    name: "ivoryCitadel",
    prices: [
      { name: "ivory", val: 50000 },
      { name: "tears", val: 50 },
    ],
    priceRatio: 1.15,
    effects: { unicornsRatioReligion: 0.25, ivoryMeteorChance: 0.0005 },
    defaultUnlocked: false,
    unlocks: { zigguratUpgrades: ["skyPalace"] },
  },
  {
    name: "skyPalace",
    prices: [
      { name: "ivory", val: 125000 },
      { name: "tears", val: 500 },
      { name: "megalith", val: 5 },
    ],
    priceRatio: 1.15,
    effects: {
      goldMaxRatio: 0.01,
      unicornsRatioReligion: 0.5,
      alicornChance: 0.0001,
      ivoryMeteorRatio: 0.05,
    },
    defaultUnlocked: false,
    unlocks: { zigguratUpgrades: ["unicornUtopia"] },
  },
  {
    name: "unicornUtopia",
    prices: [
      { name: "gold", val: 500 },
      { name: "ivory", val: 1000000 },
      { name: "tears", val: 5000 },
    ],
    priceRatio: 1.15,
    effects: {
      unicornsRatioReligion: 2.5,
      alicornChance: 0.00015,
      tcRefineRatio: 0.05,
      ivoryMeteorRatio: 0.15,
    },
    defaultUnlocked: false,
    unlocks: { zigguratUpgrades: ["sunspire"] },
  },
  {
    name: "sunspire",
    prices: [
      { name: "gold", val: 1250 },
      { name: "ivory", val: 750000 },
      { name: "tears", val: 25000 },
    ],
    priceRatio: 1.15,
    effects: {
      unicornsRatioReligion: 5,
      alicornChance: 0.0003,
      tcRefineRatio: 0.1,
      ivoryMeteorRatio: 0.5,
    },
    defaultUnlocked: false,
  },
  {
    name: "marker",
    prices: [
      { name: "unobtainium", val: 2500 },
      { name: "spice", val: 50000 },
      { name: "tears", val: 5000 },
      { name: "megalith", val: 750 },
    ],
    priceRatio: 1.15,
    effects: { corruptionRatio: 0.000001 },
    defaultUnlocked: false,
    unlocks: { policies: ["siphoning", "feedingFrenzy", "upfrontPayment"] },
  },
  {
    name: "unicornGraveyard",
    prices: [
      { name: "necrocorn", val: 5 },
      { name: "megalith", val: 1000 },
    ],
    priceRatio: 1.15,
    effects: { cultureMaxRatioBonus: 0.01, blackLibraryBonus: 0.02 },
    defaultUnlocked: false,
    unlocks: { zigguratUpgrades: ["unicornNecropolis"] },
  },
  {
    name: "unicornNecropolis",
    prices: [
      { name: "alicorn", val: 100 },
      { name: "necrocorn", val: 15 },
      { name: "void", val: 5 },
      { name: "megalith", val: 2500 },
    ],
    priceRatio: 1.15,
    effects: { corruptionBoostRatio: 0.1 },
    defaultUnlocked: false,
  },
  {
    name: "blackPyramid",
    prices: [
      { name: "unobtainium", val: 5000 },
      { name: "spice", val: 150000 },
      { name: "sorrow", val: 5 },
      { name: "megalith", val: 2500 },
    ],
    priceRatio: 1.15,
    effects: {},
    defaultUnlocked: false,
  },
];

// ── RELIGION_UPGRADE_DEFS ─────────────────────────────────────────────────────

export const RELIGION_UPGRADE_DEFS: readonly ReligionUpgradeDef[] = [
  {
    name: "solarchant",
    prices: [{ name: "faith", val: 100 }],
    priceRatio: 2.5,
    effects: { faithRatioReligion: 0.1 },
    faith: 150,
  },
  {
    name: "scholasticism",
    prices: [{ name: "faith", val: 250 }],
    priceRatio: 2.5,
    effects: {},
    faith: 300,
  },
  {
    name: "goldenSpire",
    prices: [
      { name: "gold", val: 150 },
      { name: "faith", val: 350 },
    ],
    priceRatio: 2.5,
    effects: {},
    faith: 500,
  },
  {
    name: "sunAltar",
    prices: [
      { name: "gold", val: 250 },
      { name: "faith", val: 500 },
    ],
    priceRatio: 2.5,
    effects: {},
    faith: 750,
  },
  {
    name: "stainedGlass",
    prices: [
      { name: "gold", val: 250 },
      { name: "faith", val: 500 },
    ],
    priceRatio: 2.5,
    effects: {},
    faith: 750,
  },
  {
    name: "solarRevolution",
    prices: [
      { name: "gold", val: 500 },
      { name: "faith", val: 750 },
    ],
    priceRatio: 2.5,
    effects: { solarRevolutionRatio: 0 }, // calculated dynamically
    faith: 1000,
  },
  {
    name: "basilica",
    prices: [
      { name: "gold", val: 750 },
      { name: "faith", val: 1250 },
    ],
    priceRatio: 2.5,
    effects: {},
    faith: 10000,
  },
  {
    name: "templars",
    prices: [
      { name: "gold", val: 3000 },
      { name: "faith", val: 3500 },
    ],
    priceRatio: 2.5,
    effects: {},
    faith: 75000,
  },
  {
    name: "apocripha",
    prices: [
      { name: "gold", val: 5000 },
      { name: "faith", val: 5000 },
    ],
    priceRatio: 2.5,
    effects: {},
    faith: 100000,
  },
  {
    name: "transcendence",
    prices: [
      { name: "gold", val: 7500 },
      { name: "faith", val: 7500 },
    ],
    priceRatio: 2.5,
    effects: {},
    faith: 125000,
    // When transcendence is bought, it grants val to these religion upgrades
    upgradesReligion: [
      "solarchant",
      "scholasticism",
      "goldenSpire",
      "sunAltar",
      "stainedGlass",
      "basilica",
      "templars",
    ],
  },
];

// ── TRANSCENDENCE_UPGRADE_DEFS ────────────────────────────────────────────────

export const TRANSCENDENCE_UPGRADE_DEFS: readonly TranscendenceUpgradeDef[] = [
  {
    name: "blackObelisk",
    prices: [{ name: "relic", val: 100 }],
    priceRatio: 1.15,
    tier: 1,
    effects: { solarRevolutionLimit: 0.05 }, // multiplied by tier at runtime
  },
  {
    name: "blackNexus",
    prices: [{ name: "relic", val: 5000 }],
    priceRatio: 1.15,
    tier: 3,
    effects: { relicRefineRatio: 1.0 },
  },
  {
    name: "blackCore",
    prices: [{ name: "relic", val: 10000 }],
    priceRatio: 1.15,
    tier: 5,
    effects: { blsLimit: 1 },
  },
  {
    name: "singularity",
    prices: [{ name: "relic", val: 25000 }],
    priceRatio: 1.15,
    tier: 7,
    effects: { globalResourceRatio: 0.1 },
  },
  {
    name: "blackLibrary",
    prices: [{ name: "relic", val: 30000 }],
    priceRatio: 1.15,
    tier: 9,
    effects: { compendiaTTBoostRatio: 0.02 },
  },
  {
    name: "blackRadiance",
    prices: [{ name: "relic", val: 37500 }],
    priceRatio: 1.15,
    tier: 12,
    effects: { blsCorruptionRatio: 0.0012 },
  },
  {
    name: "blazar",
    prices: [{ name: "relic", val: 50000 }],
    priceRatio: 1.15,
    tier: 15,
    effects: { timeRatio: 0.1, rrRatio: 0.02 },
  },
  {
    name: "darkNova",
    prices: [
      { name: "relic", val: 75000 },
      { name: "void", val: 7500 },
    ],
    priceRatio: 1.15,
    tier: 20,
    effects: { energyProductionRatio: 0.02 },
  },
  {
    name: "mausoleum",
    prices: [
      { name: "relic", val: 50000 },
      { name: "void", val: 12500 },
      { name: "necrocorn", val: 10 },
    ],
    priceRatio: 1.15,
    tier: 23,
    effects: { pactsAvailable: 1 },
  },
  {
    name: "holyGenocide",
    prices: [
      { name: "relic", val: 100000 },
      { name: "void", val: 25000 },
    ],
    priceRatio: 1.15,
    tier: 25,
    effects: { maxKittensRatio: -0.01, simScalingRatio: 0.02 },
  },
];

// ── createInitialReligion ─────────────────────────────────────────────────────

export function createInitialReligion(): ReligionState {
  const zigguratUpgrades: Record<string, ZigguratUpgradeEntry> = {};
  for (const def of ZIGGURAT_UPGRADE_DEFS) {
    zigguratUpgrades[def.name] = {
      val: 0,
      on: 0,
      unlocked: def.defaultUnlocked,
    };
  }

  const religionUpgrades: Record<string, ReligionUpgradeEntry> = {};
  for (const def of RELIGION_UPGRADE_DEFS) {
    religionUpgrades[def.name] = { val: 0, on: 0 };
  }

  const transcendenceUpgrades: Record<string, TranscendenceUpgradeEntry> = {};
  for (const def of TRANSCENDENCE_UPGRADE_DEFS) {
    transcendenceUpgrades[def.name] = { val: 0, on: 0, unlocked: false };
  }

  return {
    worship: 0,
    faithRatio: 0,
    transcendenceTier: 0,
    zigguratUpgrades,
    religionUpgrades,
    transcendenceUpgrades,
  };
}

// ── Price scaling (same as buildings) ────────────────────────────────────────

/**
 * Get the actual price for a ziggurat upgrade at current count.
 * Port of legacy getPrice() with priceRatio^count scaling.
 */
export function getZigguratUpgradePrice(
  def: ZigguratUpgradeDef,
  count: number,
): readonly PriceEntry[] {
  return def.prices.map((p) => ({
    name: p.name,
    val: p.val * Math.pow(def.priceRatio, count),
  }));
}

/**
 * Get the actual price for a transcendence upgrade at current count.
 */
export function getTranscendenceUpgradePrice(
  def: TranscendenceUpgradeDef,
  count: number,
): readonly PriceEntry[] {
  return def.prices.map((p) => ({
    name: p.name,
    val: p.val * Math.pow(def.priceRatio, count),
  }));
}

// ── Apocrypha bonus ───────────────────────────────────────────────────────────

/**
 * Get the apocrypha bonus multiplier.
 * Port of legacy getApocryphaBonus():
 * getUnlimitedDR(faithRatio, 0.1) * 0.1
 * getUnlimitedDR(x, ratio) = Math.log(1 + x * ratio) / ratio
 */
export function getApocryphaBonus(faithRatio: number): number {
  // getUnlimitedDR(x, 0.1) = Math.log(1 + x * 0.1) / 0.1
  return (Math.log(1 + faithRatio * 0.1) / 0.1) * 0.1;
}

// ── Transcendence price formulas ──────────────────────────────────────────────

/**
 * Total cost of reaching a given transcendence tier (cumulative).
 * Port of _getTranscendTotalPrice: getInverseUnlimitedDR(exp(tier) / 10, 0.1)
 * getInverseUnlimitedDR(y, ratio) = (exp(y * ratio) - 1) / ratio
 */
export function getTranscendTotalPrice(tier: number): number {
  // getInverseUnlimitedDR(exp(tier) / 10, 0.1)
  // = (exp((exp(tier) / 10) * 0.1) - 1) / 0.1
  // = (exp(exp(tier) / 100) - 1) / 0.1
  const y = Math.exp(tier) / 10;
  return (Math.exp(y * 0.1) - 1) / 0.1;
}

/**
 * Price to advance from current tier to tier+1.
 * Port of _getTranscendNextPrice.
 */
export function getTranscendNextPrice(currentTier: number): number {
  return getTranscendTotalPrice(currentTier + 1) - getTranscendTotalPrice(currentTier);
}

// ── Solar revolution ratio ────────────────────────────────────────────────────

/**
 * Calculate solarRevolutionRatio based on worship and effectCache.
 * Port of getSolarRevolutionRatio():
 * uncapped = getUnlimitedDR(worship, 1000) / 100
 * then getLimitedDR(uncapped, 10 + solarRevolutionLimit)
 */
export function getSolarRevolutionRatio(
  worship: number,
  effectCache: Record<string, number>,
): number {
  if (worship <= 0) return 0;
  // getUnlimitedDR(x, ratio) = log(1 + x * ratio) / ratio
  const unlimitedDr = (x: number, ratio: number) => Math.log(1 + x * ratio) / ratio;
  const uncapped = unlimitedDr(worship, 1000) / 100;
  const limit = 10 + (effectCache["solarRevolutionLimit"] ?? 0);
  // getLimitedDR(x, limit) — from effects.ts pattern
  const limitedDr = (x: number, lim: number) => lim * (1 - Math.exp(-x / lim));
  return limitedDr(uncapped, limit);
}

// ── applyBuyZigguratUpgrade ───────────────────────────────────────────────────

export function applyBuyZigguratUpgrade(state: GameState, name: string): GameState {
  const def = ZIGGURAT_UPGRADE_DEFS.find((d) => d.name === name);
  if (!def) return state;

  const entry = state.religion.zigguratUpgrades[name] ?? {
    val: 0,
    on: 0,
    unlocked: false,
  };
  if (!entry.unlocked) return state;

  const prices = getZigguratUpgradePrice(def, entry.val);
  if (!canAfford(prices, state.resources)) return state;

  return produce(state, (draft) => {
    // Deduct resources
    for (const price of prices) {
      const existing = draft.resources[price.name];
      if (existing) {
        existing.value -= price.val;
      }
    }

    // Increment val/on
    const zu = draft.religion.zigguratUpgrades[name] ?? { val: 0, on: 0, unlocked: false };
    zu.val += 1;
    zu.on += 1;
    draft.religion.zigguratUpgrades[name] = zu;

    // Unlock next upgrades
    if (def.unlocks?.zigguratUpgrades) {
      for (const unlockName of def.unlocks.zigguratUpgrades) {
        const current = draft.religion.zigguratUpgrades[unlockName];
        if (current) {
          current.unlocked = true;
        }
      }
    }
  });
}

// ── applyBuyReligionUpgrade ───────────────────────────────────────────────────

export function applyBuyReligionUpgrade(state: GameState, name: string): GameState {
  const def = RELIGION_UPGRADE_DEFS.find((d) => d.name === name);
  if (!def) return state;

  const entry = state.religion.religionUpgrades[name] ?? { val: 0, on: 0 };

  // Price for religion upgrades uses priceRatio^val (each buy is more expensive)
  const prices: PriceEntry[] = def.prices.map((p) => ({
    name: p.name,
    val: p.val * Math.pow(def.priceRatio, entry.val),
  }));

  if (!canAfford(prices, state.resources)) return state;

  return produce(state, (draft) => {
    // Deduct resources
    for (const price of prices) {
      const existing = draft.resources[price.name];
      if (existing) {
        existing.value -= price.val;
      }
    }

    // Increment val/on
    const ru = draft.religion.religionUpgrades[name] ?? { val: 0, on: 0 };
    ru.val += 1;
    ru.on += 1;
    draft.religion.religionUpgrades[name] = ru;

    // If transcendence is bought, also increment the listed upgrades
    if (def.upgradesReligion) {
      for (const upgName of def.upgradesReligion) {
        const upg = draft.religion.religionUpgrades[upgName];
        if (upg) {
          upg.val += 1;
          upg.on += 1;
        }
      }
    }
  });
}

// ── applyBuyTranscendenceUpgrade ──────────────────────────────────────────────

export function applyBuyTranscendenceUpgrade(state: GameState, name: string): GameState {
  const def = TRANSCENDENCE_UPGRADE_DEFS.find((d) => d.name === name);
  if (!def) return state;

  // Must have sufficient transcendence tier
  if (state.religion.transcendenceTier < def.tier) return state;

  const entry = state.religion.transcendenceUpgrades[name] ?? {
    val: 0,
    on: 0,
    unlocked: false,
  };

  const prices = getTranscendenceUpgradePrice(def, entry.val);
  if (!canAfford(prices, state.resources)) return state;

  return produce(state, (draft) => {
    // Deduct resources
    for (const price of prices) {
      const existing = draft.resources[price.name];
      if (existing) {
        existing.value -= price.val;
      }
    }

    const tu = draft.religion.transcendenceUpgrades[name] ?? { val: 0, on: 0, unlocked: false };
    tu.val += 1;
    tu.on += 1;
    tu.unlocked = true;
    draft.religion.transcendenceUpgrades[name] = tu;
  });
}

// ── applyPraise ───────────────────────────────────────────────────────────────

/**
 * PRAISE action: convert faith resource to worship.
 * Port of legacy praise() — faith * (1 + apocryphaBonus) added to worship.
 */
export function applyPraise(state: GameState): GameState {
  const faithRes = state.resources.faith ?? { value: 0, maxValue: 0 };
  if (faithRes.value <= 0) return state;

  const apocryphaBonus = getApocryphaBonus(state.religion.faithRatio);
  const worshipGained = faithRes.value * (1 + apocryphaBonus);

  return produce(state, (draft) => {
    const faith = draft.resources.faith ?? { value: 0, maxValue: 0 };
    faith.value = 0.0001;
    draft.resources.faith = faith;
    draft.religion.worship += worshipGained;
  });
}

// ── applyAdore ────────────────────────────────────────────────────────────────

/**
 * ADORE action: convert worship to faithRatio (epiphany).
 * Port of legacy _resetFaithInternal():
 * faithRatio += worship / 1000000 * ttPlus1^2
 * worship = 0.01
 */
export function applyAdore(state: GameState): GameState {
  const transcendenceEntry = state.religion.religionUpgrades.transcendence;
  // transcendence upgrade must have been purchased (val > 0)
  if (!transcendenceEntry || transcendenceEntry.val === 0) return state;

  const tt = state.religion.transcendenceTier;
  const ttPlus1 = tt + 1;
  const faithRatioGain = (state.religion.worship / 1_000_000) * ttPlus1 * ttPlus1;

  return produce(state, (draft) => {
    draft.religion.faithRatio += faithRatioGain;
    draft.religion.worship = 0.01;
  });
}

// ── applyTranscend ────────────────────────────────────────────────────────────

/**
 * TRANSCEND action: spend faithRatio to increment transcendenceTier.
 * Port of legacy transcend().
 */
export function applyTranscend(state: GameState): GameState {
  const transcendenceEntry = state.religion.religionUpgrades.transcendence;
  if (!transcendenceEntry || transcendenceEntry.val === 0) return state;

  const price = getTranscendNextPrice(state.religion.transcendenceTier);
  if (state.religion.faithRatio < price) return state;

  return produce(state, (draft) => {
    draft.religion.faithRatio -= price;
    draft.religion.transcendenceTier += 1;
  });
}

// ── applySacrificeUnicorns ────────────────────────────────────────────────────

/**
 * SACRIFICE_UNICORNS: costs 2500 unicorns, gains ziggurat.on tears.
 * Legacy: TransformBtnController with gainMultiplier = game.bld.get("ziggurat").on
 */
export function applySacrificeUnicorns(state: GameState): GameState {
  const unicorns = state.resources.unicorns;
  if (!unicorns || unicorns.value < 2500) return state;

  const zigguratCount = state.buildings.ziggurat?.on ?? 0;
  if (zigguratCount <= 0) return state;

  return produce(state, (draft) => {
    const u = draft.resources.unicorns;
    if (u) u.value -= 2500;
    const tears = draft.resources.tears;
    if (tears) {
      const gain = zigguratCount;
      tears.value = tears.maxValue > 0 ? Math.min(tears.value + gain, tears.maxValue) : tears.value + gain;
    }
  });
}

// ── applySacrificeAlicorns ────────────────────────────────────────────────────

/**
 * SACRIFICE_ALICORNS: costs 25 alicorns, gains (1 + tcRefineRatio) timeCrystals.
 * Also unlocks skyPalace, unicornUtopia, sunspire ziggurat upgrades.
 * Legacy: TransformBtnController with gainMultiplier = 1 + tcRefineRatio
 */
export function applySacrificeAlicorns(state: GameState): GameState {
  const alicorns = state.resources.alicorn;
  if (!alicorns || alicorns.value < 25) return state;

  const tcRefineRatio = state.effectCache.tcRefineRatio ?? 0;
  const gain = 1 + tcRefineRatio;

  return produce(state, (draft) => {
    const a = draft.resources.alicorn;
    if (a) a.value -= 25;
    const tc = draft.resources.timeCrystal;
    if (tc) {
      tc.value = tc.maxValue > 0 ? Math.min(tc.value + gain, tc.maxValue) : tc.value + gain;
    }

    // Unlock ziggurat upgrades
    for (const name of ["skyPalace", "unicornUtopia", "sunspire"] as const) {
      const zu = draft.religion.zigguratUpgrades[name];
      if (zu) zu.unlocked = true;
    }
  });
}

// ── applyRefineTimeCrystals ───────────────────────────────────────────────────

/**
 * REFINE_TIME_CRYSTALS: costs 25 timeCrystals, gains relics.
 * Legacy: gainMultiplier = 1 + relicRefineRatio * blackPyramid.getEffectiveValue
 * Simplified: use effectCache.relicRefineRatio (blackPyramid getEffectiveValue deferred)
 */
export function applyRefineTimeCrystals(state: GameState): GameState {
  const tc = state.resources.timeCrystal;
  if (!tc || tc.value < 25) return state;

  const relicRefineRatio = state.effectCache.relicRefineRatio ?? 0;
  const gain = 1 + relicRefineRatio;

  return produce(state, (draft) => {
    const timeCrystal = draft.resources.timeCrystal;
    if (timeCrystal) timeCrystal.value -= 25;
    const relics = draft.resources.relic;
    if (relics) {
      relics.value = relics.maxValue > 0 ? Math.min(relics.value + gain, relics.maxValue) : relics.value + gain;
    }
  });
}

// ── ReligionManager ───────────────────────────────────────────────────────────

export class ReligionManager implements Manager {
  update(state: GameState): GameState {
    // Faith per tick — faith resource accumulates based on effectCache
    const faithPerTick = state.effectCache["faithPerTick"] ?? 0;
    if (faithPerTick <= 0) return state;

    const faithRes = state.resources.faith ?? { value: 0, maxValue: 0 };
    const maxFaith = faithRes.maxValue;
    if (maxFaith <= 0) return state;

    const newFaith = Math.min(faithRes.value + faithPerTick, maxFaith);
    return produce(state, (draft) => {
      const faith = draft.resources.faith ?? { value: 0, maxValue: 0 };
      faith.value = newFaith;
      draft.resources.faith = faith;
    });
  }

  updateEffects(state: GameState): Record<string, number> {
    const effects: Record<string, number> = {};

    // Ziggurat upgrades — effects scale with `on`
    for (const def of ZIGGURAT_UPGRADE_DEFS) {
      const entry = state.religion.zigguratUpgrades[def.name];
      if (!entry || entry.on === 0) continue;

      for (const [effectName, baseValue] of Object.entries(def.effects)) {
        if (effectName === "solarRevolutionLimit") {
          // blackObelisk: solarRevolutionLimit = 0.05 * transcendenceTier per stack
          const perStack = 0.05 * state.religion.transcendenceTier;
          effects[effectName] = (effects[effectName] ?? 0) + perStack * entry.on;
        } else {
          effects[effectName] = (effects[effectName] ?? 0) + baseValue * entry.on;
        }
      }
    }

    // Religion upgrades — effects scale with `on`
    for (const def of RELIGION_UPGRADE_DEFS) {
      const entry = state.religion.religionUpgrades[def.name];
      if (!entry || entry.on === 0) continue;

      if (def.name === "solarRevolution") {
        // Dynamic effect: calculate solarRevolutionRatio from worship
        const srRatio = getSolarRevolutionRatio(state.religion.worship, state.effectCache);
        effects["solarRevolutionRatio"] = (effects["solarRevolutionRatio"] ?? 0) + srRatio * entry.on;
      } else {
        for (const [effectName, baseValue] of Object.entries(def.effects)) {
          effects[effectName] = (effects[effectName] ?? 0) + baseValue * entry.on;
        }
      }
    }

    // Transcendence upgrades — effects scale with `on`
    for (const def of TRANSCENDENCE_UPGRADE_DEFS) {
      const entry = state.religion.transcendenceUpgrades[def.name];
      if (!entry || entry.on === 0) continue;

      if (def.name === "blackObelisk") {
        // solarRevolutionLimit = 0.05 * transcendenceTier per stack
        const perStack = 0.05 * state.religion.transcendenceTier;
        effects["solarRevolutionLimit"] =
          (effects["solarRevolutionLimit"] ?? 0) + perStack * entry.on;
      } else {
        for (const [effectName, baseValue] of Object.entries(def.effects)) {
          effects[effectName] = (effects[effectName] ?? 0) + baseValue * entry.on;
        }
      }
    }

    return effects;
  }

  resetState(state: GameState): GameState {
    return { ...state, religion: createInitialReligion() };
  }

  save(state: GameState): Serializable {
    const r = state.religion;
    return {
      worship: r.worship,
      faithRatio: r.faithRatio,
      transcendenceTier: r.transcendenceTier,
      zu: Object.fromEntries(
        Object.entries(r.zigguratUpgrades).map(([n, e]) => [
          n,
          { val: e.val, on: e.on, unlocked: e.unlocked },
        ]),
      ),
      ru: Object.fromEntries(
        Object.entries(r.religionUpgrades).map(([n, e]) => [n, { val: e.val, on: e.on }]),
      ),
      tu: Object.fromEntries(
        Object.entries(r.transcendenceUpgrades).map(([n, e]) => [
          n,
          { val: e.val, on: e.on, unlocked: e.unlocked },
        ]),
      ),
    };
  }

  load(data: Serializable, state: GameState): GameState {
    if (!data || typeof data !== "object") return state;
    const d = data as Record<string, unknown>;

    const worship = typeof d["worship"] === "number" ? d["worship"] : 0;
    const faithRatio = typeof d["faithRatio"] === "number" ? d["faithRatio"] : 0;
    const transcendenceTier =
      typeof d["transcendenceTier"] === "number" ? d["transcendenceTier"] : 0;

    const initial = createInitialReligion();

    // Restore ziggurat upgrades
    const zigguratUpgrades = { ...initial.zigguratUpgrades };
    const savedZu = d["zu"];
    if (savedZu && typeof savedZu === "object") {
      for (const [name, entry] of Object.entries(savedZu as Record<string, unknown>)) {
        if (
          entry &&
          typeof entry === "object" &&
          typeof (entry as Record<string, unknown>)["val"] === "number" &&
          typeof (entry as Record<string, unknown>)["on"] === "number"
        ) {
          const e = entry as Record<string, unknown>;
          const unlocked =
            typeof e["unlocked"] === "boolean"
              ? e["unlocked"]
              : (zigguratUpgrades[name]?.unlocked ?? false);
          zigguratUpgrades[name] = {
            val: e["val"] as number,
            on: e["on"] as number,
            unlocked,
          };
        }
      }
    }

    // Restore religion upgrades
    const religionUpgrades = { ...initial.religionUpgrades };
    const savedRu = d["ru"];
    if (savedRu && typeof savedRu === "object") {
      for (const [name, entry] of Object.entries(savedRu as Record<string, unknown>)) {
        if (
          entry &&
          typeof entry === "object" &&
          typeof (entry as Record<string, unknown>)["val"] === "number" &&
          typeof (entry as Record<string, unknown>)["on"] === "number"
        ) {
          const e = entry as Record<string, unknown>;
          religionUpgrades[name] = {
            val: e["val"] as number,
            on: e["on"] as number,
          };
        }
      }
    }

    // Restore transcendence upgrades
    const transcendenceUpgrades = { ...initial.transcendenceUpgrades };
    const savedTu = d["tu"];
    if (savedTu && typeof savedTu === "object") {
      for (const [name, entry] of Object.entries(savedTu as Record<string, unknown>)) {
        if (
          entry &&
          typeof entry === "object" &&
          typeof (entry as Record<string, unknown>)["val"] === "number" &&
          typeof (entry as Record<string, unknown>)["on"] === "number"
        ) {
          const e = entry as Record<string, unknown>;
          const unlocked =
            typeof e["unlocked"] === "boolean" ? e["unlocked"] : false;
          transcendenceUpgrades[name] = {
            val: e["val"] as number,
            on: e["on"] as number,
            unlocked,
          };
        }
      }
    }

    return {
      ...state,
      religion: {
        worship,
        faithRatio,
        transcendenceTier,
        zigguratUpgrades,
        religionUpgrades,
        transcendenceUpgrades,
      },
    };
  }
}
