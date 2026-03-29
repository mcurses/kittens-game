import { describe, expect, it } from "vitest";
import { canAfford, extractResources } from "./utils.js";

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
        wood: { value: 10, maxValue: 0 },
        catnip: { value: 5, maxValue: 0 },
      },
    } as never;
    const result = extractResources(state);
    expect(result.wood?.value).toBe(10);
    expect(result.catnip?.value).toBe(5);
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
