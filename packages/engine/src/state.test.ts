import { describe, expect, it } from "vitest";
import { applyAction } from "./actions.js";
import { createInitialBuildings } from "./buildings.js";
import { NullManager } from "./manager.js";
import { createInitialResources } from "./resources.js";
import { createInitialState, deserialize, serialize } from "./state.js";

describe("createInitialState", () => {
  it("returns version 1", () => {
    expect(createInitialState().version).toBe(1);
  });

  it("starts at tick 0", () => {
    expect(createInitialState().tick).toBe(0);
  });

  it("starts with empty effectCache", () => {
    expect(createInitialState().effectCache).toEqual({});
  });

  it("starts with initial buildings (all zero)", () => {
    const state = createInitialState();
    expect(state.buildings.field?.val).toBe(0);
    expect(state.buildings.field?.on).toBe(0);
  });

  it("buildings field has all building names", () => {
    const state = createInitialState();
    const initial = createInitialBuildings();
    expect(Object.keys(state.buildings)).toEqual(Object.keys(initial));
  });

  it("starts with initial resources (all zero)", () => {
    const state = createInitialState();
    expect(state.resources.catnip?.value).toBe(0);
    expect(state.resources.catnip?.maxValue).toBe(0);
  });

  it("resources field has all resource names", () => {
    const state = createInitialState();
    const initial = createInitialResources();
    expect(Object.keys(state.resources)).toEqual(Object.keys(initial));
  });
});

describe("applyAction TICK", () => {
  it("increments tick by 1", () => {
    const s0 = createInitialState();
    const s1 = applyAction(s0, { type: "TICK" });
    expect(s1.tick).toBe(1);
  });

  it("does not mutate the input state", () => {
    const s0 = createInitialState();
    applyAction(s0, { type: "TICK" });
    expect(s0.tick).toBe(0);
  });

  it("is composable — 5 ticks produces tick 5", () => {
    let state = createInitialState();
    for (let i = 0; i < 5; i++) {
      state = applyAction(state, { type: "TICK" });
    }
    expect(state.tick).toBe(5);
  });
});

describe("applyAction GATHER_CATNIP", () => {
  it("increments catnip by 1", () => {
    const state = {
      ...createInitialState(),
      resources: {
        ...createInitialResources(),
        catnip: { value: 0, maxValue: 100 },
      },
    };
    const next = applyAction(state, { type: "GATHER_CATNIP" });
    expect(next.resources.catnip?.value).toBe(1);
  });

  it("does not exceed maxValue", () => {
    const state = {
      ...createInitialState(),
      resources: {
        ...createInitialResources(),
        catnip: { value: 100, maxValue: 100 },
      },
    };
    const next = applyAction(state, { type: "GATHER_CATNIP" });
    expect(next.resources.catnip?.value).toBe(100);
  });

  it("clamps to 0 when maxValue is 0", () => {
    const state = createInitialState();
    const next = applyAction(state, { type: "GATHER_CATNIP" });
    expect(next.resources.catnip?.value).toBe(0);
  });

  it("does not mutate input state", () => {
    const state = {
      ...createInitialState(),
      resources: {
        ...createInitialResources(),
        catnip: { value: 5, maxValue: 100 },
      },
    };
    applyAction(state, { type: "GATHER_CATNIP" });
    expect(state.resources.catnip?.value).toBe(5);
  });

  it("handles missing catnip entry gracefully (stays at 0)", () => {
    // Create a state where catnip is explicitly absent — covers the fallback branch
    const noResources: Record<string, { value: number; maxValue: number }> = {};
    const state = {
      ...createInitialState(),
      resources: noResources,
    };
    const next = applyAction(state, { type: "GATHER_CATNIP" });
    expect(next.resources.catnip?.value ?? 0).toBe(0);
  });
});

describe("serialize / deserialize", () => {
  it("round-trips a basic state", () => {
    const state = createInitialState();
    const restored = deserialize(serialize(state));
    expect(restored.tick).toBe(state.tick);
    expect(restored.version).toBe(state.version);
    expect(restored.effectCache).toEqual(state.effectCache);
  });

  it("round-trips a state with tick=42", () => {
    let state = createInitialState();
    for (let i = 0; i < 42; i++) {
      state = applyAction(state, { type: "TICK" });
    }
    const restored = deserialize(serialize(state));
    expect(restored.tick).toBe(42);
  });

  it("serialized output is JSON.stringify-safe", () => {
    const state = createInitialState();
    const serialized = serialize(state);
    expect(() => JSON.stringify(serialized)).not.toThrow();
  });

  it("deserialized output ignores unknown fields", () => {
    const state = createInitialState();
    const raw = { ...serialize(state), unknownFutureField: "hello" };
    const restored = deserialize(raw as ReturnType<typeof serialize>);
    expect(restored.tick).toBe(0);
  });

  it("effectCache is preserved through round-trip", () => {
    const state = { ...createInitialState(), effectCache: { catnipPerTickBase: 2.5 } };
    const restored = deserialize(serialize(state));
    expect(restored.effectCache.catnipPerTickBase).toBe(2.5);
  });

  it("deserialize falls back to empty effectCache if field is missing", () => {
    const raw = { version: 1, tick: 0 } as ReturnType<typeof serialize>;
    const restored = deserialize(raw);
    expect(restored.effectCache).toEqual({});
  });

  it("resources are preserved through round-trip", () => {
    const state = {
      ...createInitialState(),
      resources: {
        ...createInitialResources(),
        catnip: { value: 42.5, maxValue: 5000 },
      },
    };
    const restored = deserialize(serialize(state));
    expect(restored.resources.catnip?.value).toBe(42.5);
    expect(restored.resources.catnip?.maxValue).toBe(5000);
  });

  it("deserialize falls back to initial resources if field is missing", () => {
    const raw = { version: 1, tick: 0 } as ReturnType<typeof serialize>;
    const restored = deserialize(raw);
    expect(restored.resources.catnip?.value).toBe(0);
  });

  it("buildings are preserved through round-trip", () => {
    const state = {
      ...createInitialState(),
      buildings: {
        ...createInitialBuildings(),
        field: { val: 5, on: 5 },
      },
    };
    const restored = deserialize(serialize(state));
    expect(restored.buildings.field?.val).toBe(5);
    expect(restored.buildings.field?.on).toBe(5);
  });

  it("deserialize falls back to initial buildings if field is missing", () => {
    const raw = { version: 1, tick: 0 } as ReturnType<typeof serialize>;
    const restored = deserialize(raw);
    expect(restored.buildings.field?.val).toBe(0);
  });
});

describe("applyAction BUY_BUILDING", () => {
  it("buys a field when catnip is sufficient", () => {
    const state = {
      ...createInitialState(),
      resources: {
        ...createInitialResources(),
        catnip: { value: 100, maxValue: 5000 },
      },
    };
    const next = applyAction(state, { type: "BUY_BUILDING", name: "field" });
    expect(next.buildings.field?.val).toBe(1);
    expect(next.buildings.field?.on).toBe(1);
    expect(next.resources.catnip?.value).toBeCloseTo(90); // 100 - 10
  });

  it("does nothing when resources are insufficient", () => {
    const state = createInitialState();
    const next = applyAction(state, { type: "BUY_BUILDING", name: "field" });
    expect(next.buildings.field?.val).toBe(0);
  });

  it("does nothing for unknown building name", () => {
    const state = createInitialState();
    const next = applyAction(state, { type: "BUY_BUILDING", name: "unicornLair" });
    expect(next).toBe(state);
  });

  it("scales price by priceRatio for 2nd purchase", () => {
    const state = {
      ...createInitialState(),
      resources: {
        ...createInitialResources(),
        catnip: { value: 10000, maxValue: 50000 },
      },
      buildings: {
        ...createInitialBuildings(),
        field: { val: 1, on: 1 },
      },
    };
    const next = applyAction(state, { type: "BUY_BUILDING", name: "field" });
    expect(next.buildings.field?.val).toBe(2);
    // 2nd field costs: 10 * 1.12^1 = 11.2
    expect(next.resources.catnip?.value).toBeCloseTo(10000 - 11.2);
  });

  it("does not mutate input state", () => {
    const state = {
      ...createInitialState(),
      resources: { ...createInitialResources(), catnip: { value: 100, maxValue: 5000 } },
    };
    applyAction(state, { type: "BUY_BUILDING", name: "field" });
    expect(state.buildings.field?.val).toBe(0);
    expect(state.resources.catnip?.value).toBe(100);
  });

  it("handles BUY_BUILDING when building not in state (uses fallback val=0)", () => {
    // A state where 'field' is absent — covers the fallback branch
    const state = {
      ...createInitialState(),
      resources: { ...createInitialResources(), catnip: { value: 100, maxValue: 5000 } },
      buildings: {} as Record<string, { val: number; on: number }>,
    };
    const next = applyAction(state, { type: "BUY_BUILDING", name: "field" });
    expect(next.buildings.field?.val).toBe(1);
    expect(next.resources.catnip?.value).toBeCloseTo(90); // 100 - 10
  });
});

describe("applyAction with managers", () => {
  it("calls manager.update during TICK", () => {
    const m = new NullManager();
    let called = false;
    m.update = (s) => {
      called = true;
      return s;
    };
    applyAction(createInitialState(), { type: "TICK" }, [m]);
    expect(called).toBe(true);
  });
});
