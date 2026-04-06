import type { CraftDef } from "@kittens/engine";
import type { ResourceMap } from "./utils";

export interface IngredientNode {
  amount: number;
  depth: number;
  parentName: string;
}

/**
 * Expands the direct prices of a purchasable item into a full ingredient map,
 * recursively following craft recipes for any resource with a deficit.
 *
 * - Depth 1: direct prices (always included, even if already met)
 * - Depth 2+: craft ingredients, only when a deficit exists at the parent resource
 * - Diamond dependency: shallowest depth wins (first-visited in BFS order)
 * - Craft yield is always 1 (CraftDef has no yields field)
 */
export function expandCraftCosts(
  prices: readonly { name: string; val: number }[],
  craftDefs: readonly CraftDef[],
  resources: ResourceMap,
  maxDepth = 3,
): Map<string, IngredientNode> {
  const result = new Map<string, IngredientNode>();

  // Phase 1: all direct prices at depth 1 (unconditionally)
  for (const price of prices) {
    result.set(price.name, { amount: price.val, depth: 1, parentName: "" });
  }

  // Phase 2: recursively expand ingredients for resources with a deficit
  function expand(name: string, amountNeeded: number, parentName: string, depth: number): void {
    if (depth > maxDepth) return;

    const current = resources[name]?.value ?? 0;
    const deficit = amountNeeded - current;
    if (deficit <= 0) return; // requirement met — stop recursion here

    const recipe = craftDefs.find((c) => c.name === name);
    if (!recipe) return; // base resource, no recipe

    const craftsNeeded = Math.ceil(deficit); // yield = 1

    for (const ingredient of recipe.prices) {
      if (result.has(ingredient.name)) continue; // diamond: shallowest depth wins

      const ingNeeded = ingredient.val * craftsNeeded;
      result.set(ingredient.name, { amount: ingNeeded, depth, parentName });
      expand(ingredient.name, ingNeeded, ingredient.name, depth + 1);
    }
  }

  for (const price of prices) {
    expand(price.name, price.val, price.name, 2);
  }

  return result;
}
