import type { Tick } from "@kittens/shared";
import { produce } from "immer";
import { BUILDING_DEFS, canAfford, getBuildingPrice } from "./buildings.js";
import { applyCompleteChallenge, applyStartChallenge } from "./challenges.js";
import type { Manager } from "./manager.js";
import { applyPurchasePerk, applySoftReset } from "./prestige.js";
import {
  applyAdore,
  applyBuyReligionUpgrade,
  applyBuyTranscendenceUpgrade,
  applyBuyZigguratUpgrade,
  applyPraise,
  applyTranscend,
} from "./religion.js";
import { applyResearch, applyResearchPolicy } from "./science.js";
import { applySendEmbassy, applyTrade } from "./diplomacy.js";
import { applyBuySpaceBuilding, applyLaunchMission } from "./space.js";
import type { GameState } from "./state.js";
import { JOB_DEFS, totalAssignedKittens } from "./village.js";
import { applyCraft, applyPurchaseUpgrade } from "./workshop.js";

/** Discriminated union of all possible game actions */
export type GameAction =
  | { readonly type: "TICK" }
  | { readonly type: "GATHER_CATNIP" }
  | { readonly type: "BUY_BUILDING"; readonly name: string }
  | { readonly type: "ASSIGN_JOB"; readonly job: string }
  | { readonly type: "UNASSIGN_JOB"; readonly job: string }
  | { readonly type: "RESEARCH"; readonly name: string }
  | { readonly type: "RESEARCH_POLICY"; readonly name: string }
  | { readonly type: "PURCHASE_UPGRADE"; readonly name: string }
  | { readonly type: "CRAFT"; readonly name: string; readonly amount: number }
  | { readonly type: "BUY_ZIGGURAT_UPGRADE"; readonly name: string }
  | { readonly type: "BUY_RELIGION_UPGRADE"; readonly name: string }
  | { readonly type: "BUY_TRANSCENDENCE_UPGRADE"; readonly name: string }
  | { readonly type: "PRAISE" }
  | { readonly type: "ADORE" }
  | { readonly type: "TRANSCEND" }
  | { readonly type: "PURCHASE_PERK"; readonly name: string }
  | { readonly type: "SOFT_RESET" }
  | { readonly type: "START_CHALLENGE"; readonly name: string }
  | { readonly type: "COMPLETE_CHALLENGE"; readonly name: string }
  | { readonly type: "LAUNCH_MISSION"; readonly name: string }
  | { readonly type: "BUY_SPACE_BUILDING"; readonly name: string }
  | { readonly type: "SEND_EMBASSY"; readonly name: string }
  | { readonly type: "TRADE"; readonly name: string };

/**
 * Pure reducer: apply an action to a state and return the next state.
 * Never mutates the input state.
 *
 * For full tick semantics (manager updates + effect cache), use `tick()` from tick.ts.
 * This reducer is used by the server for single-action dispatch.
 */
export function applyAction(
  state: GameState,
  action: GameAction,
  managers: readonly Manager[] = [],
): GameState {
  switch (action.type) {
    case "TICK": {
      // Inline tick to avoid circular imports; mirrors tick.ts logic
      let next: GameState = { ...state, tick: (state.tick + 1) as Tick };
      for (const manager of managers) {
        next = manager.update(next);
      }
      return next;
    }
    case "GATHER_CATNIP": {
      return produce(state, (draft) => {
        const catnip = draft.resources.catnip ?? { value: 0, maxValue: 0 };
        catnip.value = Math.min(catnip.value + 1, catnip.maxValue);
        draft.resources.catnip = catnip;
      });
    }
    case "BUY_BUILDING": {
      const def = BUILDING_DEFS.find((b) => b.name === action.name);
      if (!def) return state;

      const building = state.buildings[action.name] ?? { val: 0, on: 0 };
      const prices = getBuildingPrice(def, building.val);

      if (!canAfford(prices, state.resources)) return state;

      return produce(state, (draft) => {
        // Deduct resources
        for (const price of prices) {
          const entry = draft.resources[price.name];
          if (entry) {
            entry.value -= price.val;
          }
        }
        // Increment building val and on
        const b = draft.buildings[action.name] ?? { val: 0, on: 0 };
        b.val += 1;
        b.on += 1;
        draft.buildings[action.name] = b;
      });
    }
    case "ASSIGN_JOB": {
      const def = JOB_DEFS.find((j) => j.name === action.job);
      if (!def) return state;

      const assigned = totalAssignedKittens(state.village);
      if (assigned >= state.village.kittens) return state;

      return produce(state, (draft) => {
        const job = draft.village.jobs[action.job] ?? { value: 0 };
        job.value += 1;
        draft.village.jobs[action.job] = job;
      });
    }
    case "UNASSIGN_JOB": {
      const def = JOB_DEFS.find((j) => j.name === action.job);
      if (!def) return state;

      const job = state.village.jobs[action.job] ?? { value: 0 };
      if (job.value <= 0) return state;

      return produce(state, (draft) => {
        const j = draft.village.jobs[action.job] ?? { value: 0 };
        j.value -= 1;
        draft.village.jobs[action.job] = j;
      });
    }
    case "RESEARCH": {
      return applyResearch(state, action.name);
    }
    case "RESEARCH_POLICY": {
      return applyResearchPolicy(state, action.name);
    }
    case "PURCHASE_UPGRADE": {
      return applyPurchaseUpgrade(state, action.name);
    }
    case "CRAFT": {
      return applyCraft(state, action.name, action.amount);
    }
    case "BUY_ZIGGURAT_UPGRADE": {
      return applyBuyZigguratUpgrade(state, action.name);
    }
    case "BUY_RELIGION_UPGRADE": {
      return applyBuyReligionUpgrade(state, action.name);
    }
    case "BUY_TRANSCENDENCE_UPGRADE": {
      return applyBuyTranscendenceUpgrade(state, action.name);
    }
    case "PRAISE": {
      return applyPraise(state);
    }
    case "ADORE": {
      return applyAdore(state);
    }
    case "TRANSCEND": {
      return applyTranscend(state);
    }
    case "PURCHASE_PERK": {
      return applyPurchasePerk(state, action.name);
    }
    case "SOFT_RESET": {
      return applySoftReset(state, managers);
    }
    case "START_CHALLENGE": {
      return applyStartChallenge(state, action.name);
    }
    case "COMPLETE_CHALLENGE": {
      return applyCompleteChallenge(state, action.name);
    }
    case "LAUNCH_MISSION": {
      return applyLaunchMission(state, action.name);
    }
    case "BUY_SPACE_BUILDING": {
      return applyBuySpaceBuilding(state, action.name);
    }
    case "SEND_EMBASSY": {
      return applySendEmbassy(state, action.name);
    }
    case "TRADE": {
      return applyTrade(state, action.name);
    }
  }
}
