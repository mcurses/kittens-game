import { describe, expect, it } from "vitest";
import { NullManager } from "./manager.js";
import { createInitialState } from "./state.js";

describe("NullManager", () => {
  const state = createInitialState();

  it("update returns the same state", () => {
    const m = new NullManager();
    expect(m.update(state)).toBe(state);
  });

  it("updateEffects returns empty record", () => {
    const m = new NullManager();
    expect(m.updateEffects(state)).toEqual({});
  });

  it("save returns null", () => {
    const m = new NullManager();
    expect(m.save(state)).toBeNull();
  });

  it("load returns the same state", () => {
    const m = new NullManager();
    expect(m.load(null, state)).toBe(state);
  });

  it("resetState returns the same state", () => {
    const m = new NullManager();
    expect(m.resetState(state)).toBe(state);
  });
});
