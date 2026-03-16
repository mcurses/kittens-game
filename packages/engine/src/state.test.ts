import { describe, expect, it } from "vitest";
import { applyAction } from "./actions.js";
import { createInitialState } from "./state.js";

describe("createInitialState", () => {
  it("returns version 1", () => {
    expect(createInitialState().version).toBe(1);
  });

  it("starts at tick 0", () => {
    expect(createInitialState().tick).toBe(0);
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
