import { describe, expect, it } from "vitest";
import { getResourceAttribution } from "./attribution.js";
import { createInitialState } from "./state.js";
import type { GameState } from "./state.js";

function makeState(overrides: Partial<GameState> = {}): GameState {
  return { ...createInitialState(), ...overrides };
}

describe("getResourceAttribution", () => {
  it("returns empty array when no sources produce the resource", () => {
    const state = makeState();
    expect(getResourceAttribution(state, "catnip")).toEqual([]);
  });

  it("attributes catnip production to fields", () => {
    const state = makeState({
      buildings: {
        field: { val: 10, on: 10, unlocked: true },
      },
    });
    const sources = getResourceAttribution(state, "catnip");
    const fieldSource = sources.find((s) => s.label.startsWith("Field"));
    expect(fieldSource).toBeDefined();
    expect(fieldSource!.amount).toBeCloseTo(0.125 * 10);
    expect(fieldSource!.channel).toBe("base");
  });

  it("attributes science production to libraries (ratio)", () => {
    const state = makeState({
      buildings: {
        library: { val: 5, on: 5, unlocked: true },
      },
    });
    const sources = getResourceAttribution(state, "science");
    const ratioSource = sources.find((s) => s.channel === "ratio");
    expect(ratioSource).toBeDefined();
    expect(ratioSource!.amount).toBeCloseTo(0.1 * 5);
  });

  it("attributes catnip production to farmers", () => {
    const state = makeState({
      village: {
        kittens: 5,
        kittenProgress: 0,
        jobs: { farmer: { value: 3 } },
        sim: [],
        deadKittens: 0,
        happiness: 1.0,
        leader: null,
      },
      effectCache: {},
    });
    const sources = getResourceAttribution(state, "catnip");
    const farmerSource = sources.find((s) => s.label.startsWith("Farmer"));
    expect(farmerSource).toBeDefined();
    expect(farmerSource!.amount).toBeCloseTo(1.0 * 3 * 1.0);
    expect(farmerSource!.channel).toBe("base");
  });

  it("attributes catnip consumption to kittens", () => {
    const state = makeState({
      village: {
        kittens: 10,
        kittenProgress: 0,
        jobs: {},
        sim: [],
        deadKittens: 0,
        happiness: 1.0,
        leader: null,
      },
      effectCache: {},
    });
    const sources = getResourceAttribution(state, "catnip");
    const kittenSource = sources.find((s) => s.label.startsWith("Kittens"));
    expect(kittenSource).toBeDefined();
    expect(kittenSource!.amount).toBeLessThan(0);
    expect(kittenSource!.channel).toBe("consumption");
    // 10 unassigned kittens × -0.85 = -8.5
    expect(kittenSource!.amount).toBeCloseTo(-0.85 * 10);
  });

  it("attributes smelter iron production (static ratio + dynamic autoprod)", () => {
    const state = makeState({
      buildings: {
        smelter: { val: 3, on: 3, unlocked: true },
      },
      effectCache: {},
    });
    const sources = getResourceAttribution(state, "iron");
    // Static: ironRatio 0.5 × 3 on
    const ratioSource = sources.find((s) => s.label.startsWith("Smelter") && s.channel === "ratio");
    expect(ratioSource).toBeDefined();
    expect(ratioSource!.amount).toBeCloseTo(0.5 * 3);
    // Dynamic: ironPerTickAutoprod 0.02 × smelterRatio × 3 on
    const autoprodSource = sources.find((s) => s.label.startsWith("Smelter") && s.channel === "autoprod");
    expect(autoprodSource).toBeDefined();
    expect(autoprodSource!.amount).toBeCloseTo(0.02 * 3);
  });

  it("attributes smelter wood consumption", () => {
    const state = makeState({
      buildings: {
        smelter: { val: 2, on: 2, unlocked: true },
      },
      effectCache: {},
    });
    const sources = getResourceAttribution(state, "wood");
    const smelterSource = sources.find((s) => s.label.startsWith("Smelter"));
    expect(smelterSource).toBeDefined();
    expect(smelterSource!.amount).toBeCloseTo(-0.05 * 2);
    expect(smelterSource!.channel).toBe("consumption");
  });

  it("attributes aqueduct ratio bonus to catnip", () => {
    const state = makeState({
      buildings: {
        aqueduct: { val: 3, on: 3, unlocked: true },
      },
    });
    const sources = getResourceAttribution(state, "catnip");
    const aqueductSource = sources.find((s) => s.label.startsWith("Aqueduct"));
    expect(aqueductSource).toBeDefined();
    expect(aqueductSource!.amount).toBeCloseTo(0.03 * 3);
    expect(aqueductSource!.channel).toBe("ratio");
  });

  it("returns multiple sources for a resource with complex production", () => {
    const state = makeState({
      buildings: {
        field: { val: 5, on: 5, unlocked: true },
        aqueduct: { val: 2, on: 2, unlocked: true },
      },
      village: {
        kittens: 8,
        kittenProgress: 0,
        jobs: { farmer: { value: 3 } },
        sim: [],
        deadKittens: 0,
        happiness: 1.0,
        leader: null,
      },
      effectCache: {},
    });
    const sources = getResourceAttribution(state, "catnip");
    expect(sources.length).toBeGreaterThanOrEqual(3); // field, aqueduct, farmer, kittens
    const labels = sources.map((s) => s.label);
    expect(labels.some((l) => l.startsWith("Field"))).toBe(true);
    expect(labels.some((l) => l.startsWith("Aqueduct"))).toBe(true);
    expect(labels.some((l) => l.startsWith("Farmer"))).toBe(true);
    expect(labels.some((l) => l.startsWith("Kittens"))).toBe(true);
  });
});
