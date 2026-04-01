import { describe, expect, it } from "vitest";
import { canAfford, extractResources, isStorageLimited } from "./utils.js";

describe("extractResources", () => {
  it("returns empty object for null state.resources", () => {
    const state = { resources: null } as never;
    expect(extractResources(state)).toEqual({});
  });

  it("returns empty object for non-object state", () => {
    const state = {} as never;
    expect(extractResources(state)).toEqual({});
  });

  it("extracts resource values", () => {
    const state = {
      resources: {
        wood: { value: 10, maxValue: 100 },
        catnip: { value: 5, maxValue: 50 },
      },
    } as never;
    const result = extractResources(state);
    expect(result.wood?.value).toBe(10);
    expect(result.wood?.maxValue).toBe(100);
    expect(result.catnip?.value).toBe(5);
    expect(result.catnip?.maxValue).toBe(50);
  });

  it("skips entries without numeric value", () => {
    const state = {
      resources: {
        wood: { value: 10, maxValue: 0 },
        bad: { notValue: "x" },
      },
    } as never;
    const result = extractResources(state);
    expect(result.wood?.value).toBe(10);
    expect(result.bad).toBeUndefined();
  });

  it("skips null entries", () => {
    const state = { resources: { wood: null } } as never;
    expect(extractResources(state)).toEqual({});
  });
});

describe("canAfford", () => {
  it("returns true when all resources sufficient", () => {
    expect(canAfford([{ name: "wood", val: 5 }], { wood: { value: 10 } })).toBe(true);
  });

  it("returns false when a resource is insufficient", () => {
    expect(canAfford([{ name: "wood", val: 10 }], { wood: { value: 5 } })).toBe(false);
  });

  it("returns true when exactly equal", () => {
    expect(canAfford([{ name: "wood", val: 5 }], { wood: { value: 5 } })).toBe(true);
  });

  it("returns false when resource missing from map", () => {
    expect(canAfford([{ name: "wood", val: 1 }], {})).toBe(false);
  });

  it("returns true for empty prices", () => {
    expect(canAfford([], {})).toBe(true);
  });
});

describe("isStorageLimited", () => {
  it("returns true when a price exceeds max storage and current value is still below the price", () => {
    expect(
      isStorageLimited([{ name: "wood", val: 250 }], { wood: { value: 100, maxValue: 200 } }),
    ).toBe(true);
  });

  it("returns false when the player already has enough even if the price exceeds max storage", () => {
    expect(
      isStorageLimited([{ name: "wood", val: 250 }], { wood: { value: 300, maxValue: 200 } }),
    ).toBe(false);
  });

  it("returns false when the resource has no capped storage", () => {
    expect(
      isStorageLimited([{ name: "faith", val: 250 }], { faith: { value: 0, maxValue: 0 } }),
    ).toBe(false);
  });
});
