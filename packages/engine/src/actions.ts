import type { Tick } from "@kittens/shared";
import { BUILDING_DEFS, canAfford, getBuildingPrice } from "./buildings.js";
import type { Manager } from "./manager.js";
import {
  applyAdore,
  applyBuyReligionUpgrade,
  applyBuyTranscendenceUpgrade,
  applyBuyZigguratUpgrade,
  applyPraise,
  applyTranscend,
} from "./religion.js";
import { applyResearch, applyResearchPolicy } from "./science.js";
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
  | { readonly type: "TRANSCEND" };

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
      const catnip = state.resources.catnip ?? { value: 0, maxValue: 0 };
      const newValue = Math.min(catnip.value + 1, catnip.maxValue);
      return {
        ...state,
        resources: {
          ...state.resources,
          catnip: { ...catnip, value: newValue },
        },
      };
    }
    case "BUY_BUILDING": {
      const def = BUILDING_DEFS.find((b) => b.name === action.name);
      if (!def) return state;

      const building = state.buildings[action.name] ?? { val: 0, on: 0 };
      const prices = getBuildingPrice(def, building.val);

      if (!canAfford(prices, state.resources)) return state;

      // Deduct resources
      const newResources = { ...state.resources };
      for (const price of prices) {
        const entry = newResources[price.name];
        if (entry) {
          newResources[price.name] = { ...entry, value: entry.value - price.val };
        }
      }

      // Increment building val and on
      const newBuildings = {
        ...state.buildings,
        [action.name]: { val: building.val + 1, on: building.on + 1 },
      };

      return { ...state, resources: newResources, buildings: newBuildings };
    }
    case "ASSIGN_JOB": {
      const def = JOB_DEFS.find((j) => j.name === action.job);
      if (!def) return state;

      const assigned = totalAssignedKittens(state.village);
      if (assigned >= state.village.kittens) return state;

      const job = state.village.jobs[action.job] ?? { value: 0 };
      return {
        ...state,
        village: {
          ...state.village,
          jobs: {
            ...state.village.jobs,
            [action.job]: { value: job.value + 1 },
          },
        },
      };
    }
    case "UNASSIGN_JOB": {
      const def = JOB_DEFS.find((j) => j.name === action.job);
      if (!def) return state;

      const job = state.village.jobs[action.job] ?? { value: 0 };
      if (job.value <= 0) return state;

      return {
        ...state,
        village: {
          ...state.village,
          jobs: {
            ...state.village.jobs,
            [action.job]: { value: job.value - 1 },
          },
        },
      };
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
  }
}
