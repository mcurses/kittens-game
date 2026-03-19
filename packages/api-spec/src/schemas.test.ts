import { describe, expect, it } from "vitest";
import {
  ActionResultSchema,
  GameActionRequestSchema,
  GameResetRequestSchema,
  GameStateResponseSchema,
  HealthResponseSchema,
  SaveExportResponseSchema,
  SaveImportRequestSchema,
  WsConnectedSchema,
  WsStateDeltaSchema,
} from "./schemas.js";

// ── Health ────────────────────────────────────────────────────────────────────

describe("HealthResponseSchema", () => {
  it("accepts a valid health response", () => {
    const result = HealthResponseSchema.safeParse({ status: "ok", version: "0.1.0" });
    expect(result.success).toBe(true);
  });

  it("rejects status other than ok", () => {
    const result = HealthResponseSchema.safeParse({ status: "error", version: "0.1.0" });
    expect(result.success).toBe(false);
  });

  it("rejects missing version", () => {
    const result = HealthResponseSchema.safeParse({ status: "ok" });
    expect(result.success).toBe(false);
  });
});

// ── Game state ────────────────────────────────────────────────────────────────

describe("GameStateResponseSchema", () => {
  it("accepts a minimal valid game state", () => {
    const result = GameStateResponseSchema.safeParse({ version: 1, tick: 0 });
    expect(result.success).toBe(true);
  });

  it("rejects negative tick", () => {
    const result = GameStateResponseSchema.safeParse({ version: 1, tick: -1 });
    expect(result.success).toBe(false);
  });

  it("rejects missing version", () => {
    const result = GameStateResponseSchema.safeParse({ tick: 0 });
    expect(result.success).toBe(false);
  });
});

// ── Action ────────────────────────────────────────────────────────────────────

describe("GameActionRequestSchema", () => {
  it("accepts a TICK action", () => {
    const result = GameActionRequestSchema.safeParse({ type: "TICK" });
    expect(result.success).toBe(true);
  });

  it("rejects unknown action type", () => {
    const result = GameActionRequestSchema.safeParse({ type: "EXPLODE" });
    expect(result.success).toBe(false);
  });

  it("rejects missing type", () => {
    const result = GameActionRequestSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("ActionResultSchema", () => {
  it("accepts a successful action result", () => {
    const result = ActionResultSchema.safeParse({
      ok: true,
      state: { version: 1, tick: 1 },
    });
    expect(result.success).toBe(true);
  });

  it("accepts a failed action result", () => {
    const result = ActionResultSchema.safeParse({
      ok: false,
      error: "invalid action",
      state: { version: 1, tick: 0 },
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing ok", () => {
    const result = ActionResultSchema.safeParse({ state: { version: 1, tick: 0 } });
    expect(result.success).toBe(false);
  });
});

// ── Save / Load / Reset ───────────────────────────────────────────────────────

describe("SaveExportResponseSchema", () => {
  it("accepts valid save export", () => {
    const result = SaveExportResponseSchema.safeParse({
      saveVersion: 1,
      data: { tick: 0 },
    });
    expect(result.success).toBe(true);
  });

  it("rejects saveVersion < 1", () => {
    const result = SaveExportResponseSchema.safeParse({
      saveVersion: 0,
      data: {},
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-integer saveVersion", () => {
    const result = SaveExportResponseSchema.safeParse({
      saveVersion: 1.5,
      data: {},
    });
    expect(result.success).toBe(false);
  });
});

describe("SaveImportRequestSchema", () => {
  it("accepts valid save import", () => {
    const result = SaveImportRequestSchema.safeParse({
      data: { saveVersion: 1 },
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing data", () => {
    const result = SaveImportRequestSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("GameResetRequestSchema", () => {
  it("accepts empty body (soft reset by default)", () => {
    const result = GameResetRequestSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts hard reset flag", () => {
    const result = GameResetRequestSchema.safeParse({ hard: true });
    expect(result.success).toBe(true);
  });
});

// ── WebSocket envelopes ───────────────────────────────────────────────────────

describe("WsStateDeltaSchema", () => {
  it("accepts a valid state delta", () => {
    const result = WsStateDeltaSchema.safeParse({
      type: "STATE_DELTA",
      payload: { version: 1, tick: 5 },
      ts: Date.now(),
    });
    expect(result.success).toBe(true);
  });

  it("rejects wrong type literal", () => {
    const result = WsStateDeltaSchema.safeParse({
      type: "OTHER",
      payload: {},
      ts: Date.now(),
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing ts", () => {
    const result = WsStateDeltaSchema.safeParse({
      type: "STATE_DELTA",
      payload: {},
    });
    expect(result.success).toBe(false);
  });
});

describe("WsConnectedSchema", () => {
  it("accepts a valid connected message", () => {
    const result = WsConnectedSchema.safeParse({
      type: "CONNECTED",
      payload: { sessionId: "abc-123" },
      ts: Date.now(),
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing sessionId", () => {
    const result = WsConnectedSchema.safeParse({
      type: "CONNECTED",
      payload: {},
      ts: Date.now(),
    });
    expect(result.success).toBe(false);
  });
});
