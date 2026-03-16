import type { Tick } from "@kittens/shared";
import { BUILDING_DEFS, canAfford, getBuildingPrice } from "./buildings.js";
import type { Manager } from "./manager.js";
import type { GameState } from "./state.js";

/** Discriminated union of all possible game actions */
export type GameAction =
  | { readonly type: "TICK" }
  | { readonly type: "GATHER_CATNIP" }
  | { readonly type: "BUY_BUILDING"; readonly name: string };

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
  }
}
