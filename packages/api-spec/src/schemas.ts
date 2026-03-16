import { z } from "zod";

// ── Health ────────────────────────────────────────────────────────────────────

export const HealthResponseSchema = z.object({
  status: z.literal("ok"),
  version: z.string(),
});
export type HealthResponse = z.infer<typeof HealthResponseSchema>;

// ── Game state ────────────────────────────────────────────────────────────────

/**
 * Serialized snapshot of the full game state.
 * This is the shape returned by GET /api/game/state and embedded in action results.
 * Extended by later epics as domain managers are added.
 */
export const GameStateResponseSchema = z.object({
  version: z.number().int().positive(),
  tick: z.number().int().min(0),
});
export type GameStateResponse = z.infer<typeof GameStateResponseSchema>;

// ── Actions ───────────────────────────────────────────────────────────────────

/**
 * Discriminated union of all game actions.
 * Extended by later epics as new action types are added.
 */
export const GameActionRequestSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("TICK") }),
]);
export type GameActionRequest = z.infer<typeof GameActionRequestSchema>;

export const ActionResultSchema = z.object({
  ok: z.boolean(),
  error: z.string().optional(),
  state: GameStateResponseSchema,
});
export type ActionResult = z.infer<typeof ActionResultSchema>;

// ── Save / Load / Reset ───────────────────────────────────────────────────────

export const SaveExportResponseSchema = z.object({
  /** Integer ≥ 1. Bumped on every breaking schema change. */
  saveVersion: z.number().int().min(1),
  data: z.record(z.string(), z.unknown()),
});
export type SaveExportResponse = z.infer<typeof SaveExportResponseSchema>;

export const SaveImportRequestSchema = z.object({
  data: z.record(z.string(), z.unknown()),
});
export type SaveImportRequest = z.infer<typeof SaveImportRequestSchema>;

export const GameResetRequestSchema = z.object({
  /** true = wipe everything including prestige. false/absent = soft reset only. */
  hard: z.boolean().optional(),
});
export type GameResetRequest = z.infer<typeof GameResetRequestSchema>;

// ── WebSocket envelopes ───────────────────────────────────────────────────────

/** Base envelope for all WebSocket messages */
const WsEnvelopeBase = z.object({
  type: z.string(),
  payload: z.unknown(),
  /** Unix timestamp in milliseconds */
  ts: z.number().int().positive(),
});

export const WsStateDeltaSchema = WsEnvelopeBase.extend({
  type: z.literal("STATE_DELTA"),
  payload: GameStateResponseSchema.partial(),
});
export type WsStateDelta = z.infer<typeof WsStateDeltaSchema>;

export const WsConnectedSchema = WsEnvelopeBase.extend({
  type: z.literal("CONNECTED"),
  payload: z.object({
    sessionId: z.string().min(1),
  }),
});
export type WsConnected = z.infer<typeof WsConnectedSchema>;
