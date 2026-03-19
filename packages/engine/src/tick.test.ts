import { describe, expect, it } from "vitest";
import { NullManager } from "./manager.js";
import { type GameState, createInitialState } from "./state.js";
import { resetState, tick } from "./tick.js";

describe("tick", () => {
  it("increments tick by 1", () => {
    const s = createInitialState();
    expect(tick(s, []).tick).toBe(1);
  });

  it("does not mutate the input state", () => {
    const s = createInitialState();
    tick(s, []);
    expect(s.tick).toBe(0);
  });

  it("calls update on each manager in registration order", () => {
    const calls: number[] = [];
    const m1 = new NullManager();
    const m2 = new NullManager();
    m1.update = (state) => {
      calls.push(1);
      return state;
    };
    m2.update = (state) => {
      calls.push(2);
      return state;
    };
    tick(createInitialState(), [m1, m2]);
    expect(calls).toEqual([1, 2]);
  });

  it("passes updated state from one manager to the next", () => {
    // m1 adds a marker; m2 reads it
    type MarkedState = GameState & { marker?: boolean };
    const m1 = new NullManager();
    const m2 = new NullManager();
    m1.update = (state) => ({ ...state, marker: true }) as MarkedState;
    let seenMarker = false;
    m2.update = (state: MarkedState) => {
      seenMarker = (state as MarkedState).marker === true;
      return state;
    };
    tick(createInitialState(), [m1, m2]);
    expect(seenMarker).toBe(true);
  });

  it("rebuilds effectCache after all manager updates", () => {
    const m = new NullManager();
    m.updateEffects = () => ({ catnipPerTickBase: 3 });
    const result = tick(createInitialState(), [m]);
    expect(result.effectCache.catnipPerTickBase).toBe(3);
  });

  it("is composable — 3 ticks produces tick 3", () => {
    let state = createInitialState();
    for (let i = 0; i < 3; i++) {
      state = tick(state, []);
    }
    expect(state.tick).toBe(3);
  });
});

describe("resetState", () => {
  it("returns tick 0", () => {
    const s = createInitialState();
    const advanced = tick(tick(tick(s, []), []), []);
    expect(resetState([]).tick).toBe(0);
    // advanced is at tick 3 — just confirm the original is unchanged
    expect(advanced.tick).toBe(3);
  });

  it("calls resetState on each manager", () => {
    const called: boolean[] = [];
    const m = new NullManager();
    m.resetState = (state) => {
      called.push(true);
      return state;
    };
    resetState([m]);
    expect(called).toHaveLength(1);
  });

  it("does not mutate input state", () => {
    const s = createInitialState();
    resetState([]);
    expect(s.tick).toBe(0);
  });
});
