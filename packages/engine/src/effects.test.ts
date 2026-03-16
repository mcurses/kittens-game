import { describe, expect, it } from "vitest";
import { buildEffectCache, getEffect, getLimitedDR } from "./effects.js";
import { NullManager } from "./manager.js";
import { createInitialState } from "./state.js";

// ── getLimitedDR ──────────────────────────────────────────────────────────────

describe("getLimitedDR", () => {
  it("returns 0 when effect is 0", () => {
    expect(getLimitedDR(0, 1)).toBe(0);
  });

  it("does not diminish effects below 75% of limit", () => {
    expect(getLimitedDR(0.5, 1)).toBe(0.5);
  });

  it("does not diminish effect exactly at 75% boundary", () => {
    expect(getLimitedDR(0.75, 1)).toBe(0.75);
  });

  it("diminishes effects above 75% of limit", () => {
    const result = getLimitedDR(1.0, 1);
    expect(result).toBeGreaterThan(0.75);
    expect(result).toBeLessThan(1.0);
  });

  it("approaches but never reaches the limit for very large inputs", () => {
    const result = getLimitedDR(100, 1);
    expect(result).toBeGreaterThan(0.75);
    expect(result).toBeLessThan(1.0);
  });

  it("preserves sign for negative inputs (no diminish)", () => {
    expect(getLimitedDR(-0.5, 1)).toBe(-0.5);
  });

  it("preserves sign for negative inputs (with diminish)", () => {
    const result = getLimitedDR(-1.0, 1);
    expect(result).toBeLessThan(-0.75);
    expect(result).toBeGreaterThan(-1.0);
  });

  it("works with limit other than 1", () => {
    // Below 75% of limit=2 → no diminish
    expect(getLimitedDR(1.0, 2)).toBe(1.0);
    // At 75% of limit=2 (1.5) → no diminish
    expect(getLimitedDR(1.5, 2)).toBe(1.5);
    // Above 75% of limit=2 → diminished
    const r = getLimitedDR(2.0, 2);
    expect(r).toBeGreaterThan(1.5);
    expect(r).toBeLessThan(2.0);
  });
});

// ── buildEffectCache ──────────────────────────────────────────────────────────

describe("buildEffectCache", () => {
  it("returns empty object with no managers", () => {
    const cache = buildEffectCache([], createInitialState());
    expect(Object.keys(cache)).toHaveLength(0);
  });

  it("returns 0 for unknown effects via getEffect", () => {
    const cache = buildEffectCache([], createInitialState());
    expect(getEffect(cache, "nonExistent")).toBe(0);
  });

  it("aggregates effects from a single manager", () => {
    const manager = new NullManager();
    manager.updateEffects = () => ({ catnipPerTickBase: 1.5 });
    const cache = buildEffectCache([manager], createInitialState());
    expect(getEffect(cache, "catnipPerTickBase")).toBe(1.5);
  });

  it("sums effects from two managers for the same key", () => {
    const m1 = new NullManager();
    m1.updateEffects = () => ({ catnipPerTickBase: 1 });
    const m2 = new NullManager();
    m2.updateEffects = () => ({ catnipPerTickBase: 1 });
    const cache = buildEffectCache([m1, m2], createInitialState());
    expect(getEffect(cache, "catnipPerTickBase")).toBe(2);
  });

  it("applies limited DR to catnipDemandRatio", () => {
    const manager = new NullManager();
    manager.updateEffects = () => ({ catnipDemandRatio: 1.0 });
    const cache = buildEffectCache([manager], createInitialState());
    const result = getEffect(cache, "catnipDemandRatio");
    expect(result).toBeGreaterThan(0.75);
    expect(result).toBeLessThan(1.0);
  });

  it("does NOT apply limited DR to normal effects", () => {
    const manager = new NullManager();
    manager.updateEffects = () => ({ catnipPerTickBase: 1.0 });
    const cache = buildEffectCache([manager], createInitialState());
    expect(getEffect(cache, "catnipPerTickBase")).toBe(1.0);
  });

  it("applies limited DR to all 5 DR-eligible effects", () => {
    const effects = {
      catnipDemandRatio: 1.0,
      fursDemandRatio: 1.0,
      ivoryDemandRatio: 1.0,
      spiceDemandRatio: 1.0,
      unhappinessRatio: 1.0,
    };
    const manager = new NullManager();
    manager.updateEffects = () => effects;
    const cache = buildEffectCache([manager], createInitialState());
    for (const name of Object.keys(effects)) {
      const v = getEffect(cache, name);
      expect(v).toBeGreaterThan(0.75);
      expect(v).toBeLessThan(1.0);
    }
  });
});
