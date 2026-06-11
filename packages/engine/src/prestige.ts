import type { Serializable } from "@kittens/shared";
import { produce } from "immer";
import { getLimitedDR } from "./effects.js";
import type { Manager } from "./manager.js";
import type { GameState } from "./state.js";
import { resetState } from "./tick.js";

// ── PerkDef ───────────────────────────────────────────────────────────────────

export interface PerkUnlocks {
  readonly perks?: readonly string[];
  readonly zigguratUpgrades?: readonly string[];
  readonly tabs?: readonly string[];
}

export interface PerkDef {
  readonly name: string;
  readonly prices: readonly { name: string; val: number }[];
  readonly effects?: Readonly<Record<string, number>>;
  readonly defaultUnlocked: boolean;
  readonly unlocks?: PerkUnlocks;
}

export interface PerkEntry {
  readonly unlocked: boolean;
  readonly researched: boolean;
}

// ── PrestigeState ─────────────────────────────────────────────────────────────

export interface PrestigeState {
  readonly perks: Record<string, PerkEntry>;
}

// ── PERK_DEFS ─────────────────────────────────────────────────────────────────

export const PERK_DEFS: readonly PerkDef[] = [
  {
    name: "engeneering",
    prices: [{ name: "paragon", val: 5 }],
    defaultUnlocked: true,
    effects: { priceRatio: -0.01 },
    unlocks: { perks: ["megalomania", "goldenRatio", "codexVox"] },
  },
  {
    name: "codexVox",
    prices: [{ name: "paragon", val: 25 }],
    defaultUnlocked: false,
    effects: { manuscriptCraftRatio: 0.25, manuscriptGlobalCraftRatio: 0.05 },
    unlocks: { perks: ["codexLogos"] },
  },
  {
    name: "codexLogos",
    prices: [{ name: "paragon", val: 50 }],
    defaultUnlocked: false,
    effects: {
      manuscriptGlobalCraftRatio: 0.05,
      compediumCraftRatio: 0.25,
      compediumGlobalCraftRatio: 0.05,
    },
    unlocks: { perks: ["codexAgrum", "codexLeviathanianus"] },
  },
  {
    name: "codexAgrum",
    prices: [{ name: "paragon", val: 75 }],
    defaultUnlocked: false,
    effects: {
      manuscriptGlobalCraftRatio: 0.05,
      compediumGlobalCraftRatio: 0.05,
      blueprintCraftRatio: 0.25,
      blueprintGlobalCraftRatio: 0.05,
    },
  },
  {
    name: "megalomania",
    prices: [{ name: "paragon", val: 10 }],
    defaultUnlocked: false,
    unlocks: {
      perks: ["blackCodex"],
      zigguratUpgrades: ["marker", "blackPyramid"],
    },
  },
  {
    name: "blackCodex",
    prices: [{ name: "paragon", val: 25 }],
    defaultUnlocked: false,
    unlocks: { zigguratUpgrades: ["unicornGraveyard"] },
  },
  {
    name: "codexLeviathanianus",
    prices: [{ name: "paragon", val: 75 }],
    defaultUnlocked: false,
  },
  {
    name: "goldenRatio",
    prices: [{ name: "paragon", val: 50 }],
    defaultUnlocked: false,
    effects: { priceRatio: -(1 + Math.sqrt(5)) / 200, queueCap: 1 },
    unlocks: { perks: ["divineProportion"] },
  },
  {
    name: "divineProportion",
    prices: [{ name: "paragon", val: 100 }],
    defaultUnlocked: false,
    effects: { priceRatio: -16 / 900, queueCap: 2 },
    unlocks: { perks: ["vitruvianFeline"] },
  },
  {
    name: "vitruvianFeline",
    prices: [{ name: "paragon", val: 250 }],
    defaultUnlocked: false,
    effects: { priceRatio: -0.02 },
    unlocks: { perks: ["renaissance"] },
  },
  {
    name: "renaissance",
    prices: [{ name: "paragon", val: 750 }],
    defaultUnlocked: false,
    effects: { priceRatio: -0.0225, queueCap: 2 },
  },
  {
    name: "diplomacy",
    prices: [{ name: "paragon", val: 5 }],
    defaultUnlocked: true,
    effects: { standingRatio: 0.1 },
    unlocks: { perks: ["zebraDiplomacy"] },
  },
  {
    name: "zebraDiplomacy",
    prices: [{ name: "paragon", val: 35 }],
    defaultUnlocked: false,
    unlocks: { perks: ["zebraCovenant"] },
  },
  {
    name: "zebraCovenant",
    prices: [{ name: "paragon", val: 75 }],
    defaultUnlocked: false,
    unlocks: { perks: ["navigationDiplomacy"] },
  },
  {
    name: "navigationDiplomacy",
    prices: [{ name: "paragon", val: 300 }],
    defaultUnlocked: false,
  },
  {
    name: "chronomancy",
    prices: [{ name: "paragon", val: 25 }],
    defaultUnlocked: true,
    unlocks: { perks: ["astromancy", "anachronomancy", "unicornmancy"] },
  },
  {
    name: "astromancy",
    prices: [{ name: "paragon", val: 50 }],
    defaultUnlocked: false,
  },
  {
    name: "unicornmancy",
    prices: [{ name: "paragon", val: 125 }],
    defaultUnlocked: true,
  },
  {
    name: "anachronomancy",
    prices: [{ name: "paragon", val: 125 }],
    defaultUnlocked: false,
  },
  {
    name: "carnivals",
    prices: [{ name: "paragon", val: 25 }],
    defaultUnlocked: true,
    unlocks: { perks: ["numerology"] },
  },
  {
    name: "willenfluff",
    prices: [{ name: "paragon", val: 150 }],
    defaultUnlocked: false,
    effects: { kittenGrowthRatio: 0.75 },
    unlocks: { perks: ["pawgan"] },
  },
  {
    name: "pawgan",
    prices: [{ name: "paragon", val: 400 }],
    defaultUnlocked: false,
    effects: { kittenGrowthRatio: 1.5 },
  },
  {
    name: "numerology",
    prices: [{ name: "paragon", val: 50 }],
    defaultUnlocked: false,
    unlocks: { perks: ["numeromancy", "willenfluff", "voidOrder"] },
  },
  {
    name: "numeromancy",
    prices: [{ name: "paragon", val: 250 }],
    defaultUnlocked: false,
    unlocks: { perks: ["malkuth"] },
  },
  {
    name: "malkuth",
    prices: [{ name: "paragon", val: 500 }],
    defaultUnlocked: false,
    effects: { paragonRatio: 0.05 },
    unlocks: { perks: ["yesod"] },
  },
  {
    name: "yesod",
    prices: [{ name: "paragon", val: 750 }],
    defaultUnlocked: false,
    effects: { paragonRatio: 0.05 },
    unlocks: { perks: ["hod"] },
  },
  {
    name: "hod",
    prices: [{ name: "paragon", val: 1250 }],
    defaultUnlocked: false,
    effects: { paragonRatio: 0.05 },
    unlocks: { perks: ["netzach"] },
  },
  {
    name: "netzach",
    prices: [{ name: "paragon", val: 1750 }],
    defaultUnlocked: false,
    effects: { paragonRatio: 0.05 },
    unlocks: { perks: ["tiferet"] },
  },
  {
    name: "tiferet",
    prices: [{ name: "paragon", val: 2500 }],
    defaultUnlocked: false,
    effects: { paragonRatio: 0.05 },
    unlocks: { perks: ["gevurah"] },
  },
  {
    name: "gevurah",
    prices: [{ name: "paragon", val: 5000 }],
    defaultUnlocked: false,
    effects: { paragonRatio: 0.05 },
    unlocks: { perks: ["chesed"] },
  },
  {
    name: "chesed",
    prices: [{ name: "paragon", val: 7500 }],
    defaultUnlocked: false,
    effects: { paragonRatio: 0.05 },
    unlocks: { perks: ["binah"] },
  },
  {
    name: "binah",
    prices: [{ name: "paragon", val: 15000 }],
    defaultUnlocked: false,
    effects: { paragonRatio: 0.05 },
    unlocks: { perks: ["chokhmah"] },
  },
  {
    name: "chokhmah",
    prices: [{ name: "paragon", val: 30000 }],
    defaultUnlocked: false,
    effects: { paragonRatio: 0.05 },
    unlocks: { perks: ["keter"] },
  },
  {
    name: "keter",
    prices: [{ name: "paragon", val: 60000 }],
    defaultUnlocked: false,
    effects: { paragonRatio: 0.05 },
  },
  {
    name: "voidOrder",
    prices: [{ name: "paragon", val: 75 }],
    defaultUnlocked: false,
  },
  {
    name: "adjustmentBureau",
    prices: [{ name: "paragon", val: 5 }],
    defaultUnlocked: true,
    unlocks: { perks: ["ascoh"], tabs: ["challenges"] },
  },
  {
    name: "ascoh",
    prices: [{ name: "paragon", val: 5 }],
    defaultUnlocked: false,
  },
];

// ── createInitialPrestige ─────────────────────────────────────────────────────

export function createInitialPrestige(): PrestigeState {
  const perks: Record<string, PerkEntry> = {};
  for (const def of PERK_DEFS) {
    perks[def.name] = { unlocked: def.defaultUnlocked, researched: false };
  }
  return { perks };
}

// ── applyPurchasePerk ─────────────────────────────────────────────────────────

/**
 * PURCHASE_PERK action: buy a prestige perk with paragon.
 * Port of legacy PrestigeManager buyItem (not-stackable research).
 */
export function applyPurchasePerk(state: GameState, name: string): GameState {
  const def = PERK_DEFS.find((d) => d.name === name);
  if (!def) return state;

  const entry = state.prestige.perks[name] ?? { unlocked: false, researched: false };
  if (!entry.unlocked) return state;
  if (entry.researched) return state;

  // Check paragon cost
  const paragonRes = state.resources.paragon ?? { value: 0, maxValue: 0 };
  const cost = def.prices[0]?.val ?? 0;
  if (paragonRes.value < cost) return state;

  return produce(state, (draft) => {
    // Deduct paragon
    const paragon = draft.resources.paragon ?? { value: 0, maxValue: 0 };
    paragon.value -= cost;
    draft.resources.paragon = paragon;

    // Mark as researched
    const perk = draft.prestige.perks[name] ?? { unlocked: false, researched: false };
    perk.unlocked = true;
    perk.researched = true;
    draft.prestige.perks[name] = perk;

    // Unlock downstream perks
    if (def.unlocks?.perks) {
      for (const unlockName of def.unlocks.perks) {
        const current = draft.prestige.perks[unlockName];
        if (current) {
          current.unlocked = true;
        }
      }
    }

    // Unlock ziggurat upgrades in religion state
    if (def.unlocks?.zigguratUpgrades) {
      for (const zuName of def.unlocks.zigguratUpgrades) {
        const zu = draft.religion.zigguratUpgrades[zuName];
        if (zu) {
          zu.unlocked = true;
        }
      }
    }
  });
}

// ── Paragon production / storage ratios ──────────────────────────────────────

/**
 * Global production ratio from paragon + burnedParagon.
 * Port of legacy getParagonProductionRatio():
 *   productionRatioParagon = getLimitedDR(paragon * 0.01 * paragonRatio, 2 * paragonRatio)
 *   productionRatioBurnedParagon = getLimitedDR(burnedParagon * 0.01 * paragonRatio, 1 * paragonRatio)
 *   (ratio=1 for non-dark-future, ratio=4 for dark future — dark future not yet implemented)
 */
export function getParagonProductionRatio(
  paragon: number,
  burnedParagon: number,
  paragonRatio: number,
): number {
  const uncappedParagon = paragon * 0.01 * paragonRatio;
  const productionRatioParagon = getLimitedDR(uncappedParagon, 2 * paragonRatio);

  // darkFutureYears not implemented — use non-dark-future ratio = 1
  const uncappedBurned = burnedParagon * 0.01 * paragonRatio;
  const productionRatioBurnedParagon = getLimitedDR(uncappedBurned, 1 * paragonRatio);

  return productionRatioParagon + productionRatioBurnedParagon;
}

/**
 * Global storage ratio from paragon + burnedParagon.
 * Port of legacy getParagonStorageRatio():
 *   storageRatio = paragon / 1000 * paragonRatio
 *   (darkFutureYears >= 0: burnedParagon/500; else burnedParagon/2000)
 *   darkFutureYears not implemented — use non-dark-future (burnedParagon/2000)
 */
export function getParagonStorageRatio(
  paragon: number,
  burnedParagon: number,
  paragonRatio: number,
): number {
  // non-dark-future path
  return (paragon / 1000 + burnedParagon / 2000) * paragonRatio;
}

// ── PrestigeManager ───────────────────────────────────────────────────────────

export class PrestigeManager implements Manager {
  readonly sectionKey = "prestige";

  update(state: GameState): GameState {
    // No per-tick updates needed — prestige is passive
    return state;
  }

  updateEffects(state: GameState): Record<string, number> {
    const effects: Record<string, number> = {};

    for (const def of PERK_DEFS) {
      const entry = state.prestige.perks[def.name];
      if (!entry?.researched) continue;
      if (!def.effects) continue;

      for (const [effectName, value] of Object.entries(def.effects)) {
        effects[effectName] = (effects[effectName] ?? 0) + value;
      }
    }

    // Contribute paragon production ratio to effectCache
    // paragonRatio is the sum of all Sephirot perk bonuses (each 0.05) + 1 base
    const paragonRatioBonus = effects.paragonRatio ?? 0;
    const paragonRatio = 1 + paragonRatioBonus;
    const paragonValue = state.resources.paragon?.value ?? 0;
    const burnedParagonValue = state.resources.burnedParagon?.value ?? 0;

    if (paragonValue > 0 || burnedParagonValue > 0) {
      // paragonProductionRatio goes into globalProductionModifier (additive with other effects)
      const prodRatio = getParagonProductionRatio(paragonValue, burnedParagonValue, paragonRatio);
      if (prodRatio > 0) {
        effects.globalProductionModifier = (effects.globalProductionModifier ?? 0) + prodRatio;
      }
      // paragonStorageRatio goes into globalStorageRatio
      const storRatio = getParagonStorageRatio(paragonValue, burnedParagonValue, paragonRatio);
      if (storRatio > 0) {
        effects.globalStorageRatio = (effects.globalStorageRatio ?? 0) + storRatio;
      }
    }

    return effects;
  }

  resetState(state: GameState): GameState {
    return { ...state, prestige: createInitialPrestige() };
  }

  save(state: GameState): Serializable {
    return {
      perks: Object.fromEntries(
        Object.entries(state.prestige.perks).map(([n, e]) => [
          n,
          { unlocked: e.unlocked, researched: e.researched },
        ]),
      ),
    };
  }

  load(data: Serializable, state: GameState): GameState {
    if (!data || typeof data !== "object") return state;
    const d = data as Record<string, unknown>;

    const initial = createInitialPrestige();
    const perks = { ...initial.perks };

    const savedPerks = d.perks;
    if (savedPerks && typeof savedPerks === "object") {
      for (const [name, entry] of Object.entries(savedPerks as Record<string, unknown>)) {
        if (entry && typeof entry === "object") {
          const e = entry as Record<string, unknown>;
          const unlocked =
            typeof e.unlocked === "boolean" ? e.unlocked : (perks[name]?.unlocked ?? false);
          const researched = typeof e.researched === "boolean" ? e.researched : false;
          perks[name] = { unlocked, researched };
        }
      }
    }

    // After restoring, replay unlock chains for researched perks
    let religion = state.religion;
    for (const def of PERK_DEFS) {
      const entry = perks[def.name];
      if (!entry?.researched) continue;
      if (!def.unlocks) continue;

      // Unlock downstream perks
      if (def.unlocks.perks) {
        for (const unlockName of def.unlocks.perks) {
          const current = perks[unlockName];
          if (current) {
            perks[unlockName] = { ...current, unlocked: true };
          }
        }
      }

      // Unlock ziggurat upgrades in religion
      if (def.unlocks.zigguratUpgrades) {
        const newZigguratUpgrades = { ...religion.zigguratUpgrades };
        for (const zuName of def.unlocks.zigguratUpgrades) {
          const zu = newZigguratUpgrades[zuName];
          if (zu) {
            newZigguratUpgrades[zuName] = { ...zu, unlocked: true };
          }
        }
        religion = { ...religion, zigguratUpgrades: newZigguratUpgrades };
      }
    }

    return {
      ...state,
      religion,
      prestige: { perks },
    };
  }
}

// ── applyBurnParagon ──────────────────────────────────────────────────────────

/**
 * BURN_PARAGON action: convert 1 paragon to 1 burnedParagon.
 * Legacy: burnParagon button, spends paragon, gains burnedParagon 1:1.
 */
export function applyBurnParagon(state: GameState): GameState {
  const paragon = state.resources.paragon;
  if (!paragon || paragon.value < 1) return state;

  return produce(state, (draft) => {
    const p = draft.resources.paragon;
    if (p) p.value -= 1;
    const bp = draft.resources.burnedParagon;
    if (bp) bp.value += 1;
  });
}

// ── applySoftReset ────────────────────────────────────────────────────────────

/**
 * SOFT_RESET action: reset all game state except prestige perks and paragon resources.
 * Port of legacy game.resetAutomatic().
 *
 * Preserves: prestige.perks, resources.paragon, resources.burnedParagon
 * Resets: everything else (resources, buildings, village, calendar, science, workshop, religion)
 */
export function applySoftReset(
  state: GameState,
  managers: readonly import("./manager.js").Manager[],
): GameState {
  // Save prestige perks and paragon before reset
  const savedPrestige = state.prestige;
  const paragonValue = state.resources.paragon?.value ?? 0;
  const burnedParagonValue = state.resources.burnedParagon?.value ?? 0;

  // Save challenge completion state before reset (on/researched/unlocked persist across soft resets)
  // Inline to avoid circular import (challenges.ts → state.ts → prestige.ts)
  const savedChallengeCompletions: Record<
    string,
    { on: number; researched: boolean; unlocked: boolean }
  > = {};
  for (const [name, entry] of Object.entries(state.challenges.challenges)) {
    savedChallengeCompletions[name] = {
      on: entry.on,
      researched: entry.researched,
      unlocked: entry.unlocked,
    };
  }

  // Reset all state
  let newState = resetState(managers);

  // Restore prestige perks
  newState = { ...newState, prestige: savedPrestige };

  // Apply challenge soft-reset: restore on/researched/unlocked, cancel active/pending
  const softResetChallenges: Record<
    string,
    { unlocked: boolean; active: boolean; researched: boolean; on: number; pending: boolean }
  > = {};
  for (const [name, entry] of Object.entries(newState.challenges.challenges)) {
    const saved = savedChallengeCompletions[name];
    softResetChallenges[name] = {
      unlocked: saved?.unlocked ?? entry.unlocked,
      active: false,
      researched: saved?.researched ?? entry.researched,
      on: saved?.on ?? entry.on,
      pending: false,
    };
  }
  newState = { ...newState, challenges: { challenges: softResetChallenges } };

  // Restore paragon and burnedParagon resources (they persist across resets)
  newState = produce(newState, (draft) => {
    const paragonEntry = draft.resources.paragon;
    if (paragonEntry) {
      paragonEntry.value = paragonValue;
    }
    const burnedParagonEntry = draft.resources.burnedParagon;
    if (burnedParagonEntry) {
      burnedParagonEntry.value = burnedParagonValue;
    }
  });

  return newState;
}
