import type { CraftDef } from "@kittens/engine";
import { describe, expect, it } from "vitest";
import { expandCraftCosts } from "./expandCraftCosts";
import type { IngredientNode } from "./expandCraftCosts";
import type { ResourceMap } from "./utils";

// ── helpers ──────────────────────────────────────────────────────────────────

function res(value: number, maxValue = 1_000_000): ResourceMap[string] {
  return { value, maxValue, perTick: 1 };
}

// Minimal craft defs for testing
const CRAFT_DEFS: CraftDef[] = [
  // parchment (base craft: from catNip)
  {
    name: "parchment",
    prices: [{ name: "catNip", val: 175 }],
    tier: 0,
    ignoreBonuses: false,
  },
  // manuscript: from parchment
  {
    name: "manuscript",
    prices: [{ name: "parchment", val: 25 }],
    tier: 0,
    ignoreBonuses: false,
  },
  // compendium: from manuscript + science
  {
    name: "compendium",
    prices: [
      { name: "manuscript", val: 50 },
      { name: "science", val: 10_000 },
    ],
    tier: 0,
    ignoreBonuses: false,
  },
  // blueprint: from compendium + science (diamond: science appears at depth 2 via compendium and also here)
  {
    name: "blueprint",
    prices: [
      { name: "compendium", val: 25 },
      { name: "science", val: 25_000 },
    ],
    tier: 0,
    ignoreBonuses: false,
  },
] as unknown as CraftDef[];

// ── Story 41-06: expandCraftCosts pure function ───────────────────────────────

describe("expandCraftCosts", () => {
  it("returns direct prices at depth 1 even when already met", () => {
    const resources: ResourceMap = { wood: res(1000), minerals: res(500) };
    const result = expandCraftCosts(
      [
        { name: "wood", val: 100 },
        { name: "minerals", val: 200 },
      ],
      CRAFT_DEFS,
      resources,
    );
    expect(result.get("wood")).toMatchObject<IngredientNode>({
      amount: 100,
      depth: 1,
      parentName: "",
    });
    expect(result.get("minerals")).toMatchObject<IngredientNode>({
      amount: 200,
      depth: 1,
      parentName: "",
    });
  });

  it("does not expand ingredients for a depth-1 resource that is already met", () => {
    // compendium is required but we already have enough
    const resources: ResourceMap = { compendium: res(10) };
    const result = expandCraftCosts([{ name: "compendium", val: 5 }], CRAFT_DEFS, resources);
    // Only depth-1 entry; no ingredients since requirement is met
    expect(result.size).toBe(1);
    expect(result.get("compendium")).toMatchObject({ depth: 1 });
    expect(result.get("manuscript")).toBeUndefined();
  });

  it("expands one level of ingredients when deficit exists at depth 1", () => {
    // We need 5 compendium but have 0 → expand its ingredients (manuscript + science) at depth 2
    const resources: ResourceMap = {
      compendium: res(0),
      manuscript: res(0),
      science: res(0),
    };
    const result = expandCraftCosts([{ name: "compendium", val: 5 }], CRAFT_DEFS, resources);
    // depth 1: compendium
    expect(result.get("compendium")).toMatchObject({ depth: 1 });
    // depth 2: manuscript (5 crafts * 50 each = 250) and science (5 crafts * 10000 = 50000)
    expect(result.get("manuscript")).toMatchObject({
      depth: 2,
      parentName: "compendium",
      amount: 250,
    });
    expect(result.get("science")).toMatchObject({
      depth: 2,
      parentName: "compendium",
      amount: 50_000,
    });
  });

  it("stops recursion when an ingredient's requirement is already met", () => {
    // We need 5 compendium (have 0): manuscript needed but we have enough; science needed and lacking
    const resources: ResourceMap = {
      compendium: res(0),
      manuscript: res(999), // plenty
      science: res(0),
    };
    const result = expandCraftCosts([{ name: "compendium", val: 5 }], CRAFT_DEFS, resources);
    // manuscript IS in result at depth 2 (it IS in the ingredients list)
    // but since manuscript is met, its own ingredient (parchment) should NOT be expanded
    expect(result.get("manuscript")).toMatchObject({ depth: 2, parentName: "compendium" });
    expect(result.get("parchment")).toBeUndefined(); // met at manuscript, no expansion
  });

  it("recurses to depth 3 for a full chain: compendium → manuscript → parchment", () => {
    const resources: ResourceMap = {
      compendium: res(0),
      manuscript: res(0),
      parchment: res(0),
      catNip: res(0),
      science: res(9_999_999), // enough science, so only manuscript chain expands
    };
    const result = expandCraftCosts([{ name: "compendium", val: 1 }], CRAFT_DEFS, resources);
    // depth 1: compendium
    expect(result.get("compendium")).toMatchObject({ depth: 1 });
    // depth 2: manuscript (1 craft * 50 = 50)
    expect(result.get("manuscript")).toMatchObject({
      depth: 2,
      parentName: "compendium",
      amount: 50,
    });
    // science is met, so should be in result at depth 2 but not expanded further
    expect(result.get("science")).toMatchObject({ depth: 2, parentName: "compendium" });
    // depth 3: parchment (need 50 manuscript, have 0, so 50 crafts * 25 = 1250)
    expect(result.get("parchment")).toMatchObject({
      depth: 3,
      parentName: "manuscript",
      amount: 1250,
    });
    // catNip is depth 4 but maxDepth=3 so should NOT appear
    expect(result.get("catNip")).toBeUndefined();
  });

  it("respects maxDepth — stops at depth 2 when maxDepth=2", () => {
    const resources: ResourceMap = {
      compendium: res(0),
      manuscript: res(0),
      parchment: res(0),
      science: res(0),
    };
    const result = expandCraftCosts([{ name: "compendium", val: 1 }], CRAFT_DEFS, resources, 2);
    expect(result.get("manuscript")).toMatchObject({ depth: 2 });
    expect(result.get("science")).toMatchObject({ depth: 2 });
    // parchment would be depth 3 — should not appear
    expect(result.get("parchment")).toBeUndefined();
  });

  it("diamond dependency: shallowest depth wins", () => {
    // science appears both in direct prices (depth 1) and as ingredient of compendium (depth 2)
    // When it appears at depth 1 first, the depth-2 entry should be skipped
    const resources: ResourceMap = {
      science: res(0),
      compendium: res(0),
      manuscript: res(0),
    };
    const result = expandCraftCosts(
      [
        { name: "science", val: 5_000 },
        { name: "compendium", val: 1 },
      ],
      CRAFT_DEFS,
      resources,
    );
    // science is at depth 1 (from direct prices)
    expect(result.get("science")).toMatchObject({ depth: 1, parentName: "" });
    // compendium's expansion tries to add science at depth 2, but diamond check skips it
    // manuscript should still appear
    expect(result.get("manuscript")).toMatchObject({ depth: 2 });
  });

  it("handles empty prices — returns empty map", () => {
    const resources: ResourceMap = {};
    const result = expandCraftCosts([], CRAFT_DEFS, resources);
    expect(result.size).toBe(0);
  });

  it("handles base resources with no craft recipe — no expansion", () => {
    // catNip is a base resource with no recipe
    const resources: ResourceMap = { catNip: res(0) };
    const result = expandCraftCosts([{ name: "catNip", val: 500 }], CRAFT_DEFS, resources);
    expect(result.size).toBe(1);
    expect(result.get("catNip")).toMatchObject({ depth: 1 });
  });

  it("computes craftsNeeded correctly (ceil of deficit, yield=1)", () => {
    // Need 3 compendium, have 1 → deficit = 2 → 2 crafts needed
    // 2 crafts * 50 manuscript/craft = 100 manuscript needed
    const resources: ResourceMap = {
      compendium: res(1),
      manuscript: res(0),
      science: res(9_999_999), // met
    };
    const result = expandCraftCosts([{ name: "compendium", val: 3 }], CRAFT_DEFS, resources);
    expect(result.get("manuscript")).toMatchObject({ amount: 100 });
  });

  it("skips expanding an ingredient if its required amount is already met by current resources", () => {
    // Need 1 compendium (have 0) → 1 craft → 50 manuscript + 10000 science
    // We have 50 manuscript already → skip expanding manuscript's ingredients
    const resources: ResourceMap = {
      compendium: res(0),
      manuscript: res(50), // exactly met
      science: res(0),
      parchment: res(0),
    };
    const result = expandCraftCosts([{ name: "compendium", val: 1 }], CRAFT_DEFS, resources);
    // manuscript still appears in result (it IS an ingredient of compendium)
    expect(result.get("manuscript")).toMatchObject({ depth: 2 });
    // but parchment should NOT appear (manuscript is met, so no expansion of its ingredients)
    expect(result.get("parchment")).toBeUndefined();
  });
});
