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
 * Requires version + tick; all domain fields (resources, buildings, …) pass through
 * unvalidated — use SerializedGameState from @kittens/engine for full typing.
 */
export const GameStateResponseSchema = z
  .object({
    version: z.number().int().positive(),
    tick: z.number().int().min(0),
  })
  .passthrough();
export type GameStateResponse = z.infer<typeof GameStateResponseSchema>;

// ── Actions ───────────────────────────────────────────────────────────────────

const s = z.string().min(1);
const n = z.number();

/**
 * Discriminated union of all 26 game actions — mirrors GameAction in @kittens/engine.
 */
export const GameActionRequestSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("TICK") }),
  z.object({ type: z.literal("GATHER_CATNIP") }),
  z.object({ type: z.literal("BUY_BUILDING"), name: s }),
  z.object({ type: z.literal("ASSIGN_JOB"), job: s }),
  z.object({ type: z.literal("UNASSIGN_JOB"), job: s }),
  z.object({ type: z.literal("RESEARCH"), name: s }),
  z.object({ type: z.literal("RESEARCH_POLICY"), name: s }),
  z.object({ type: z.literal("PURCHASE_UPGRADE"), name: s }),
  z.object({ type: z.literal("CRAFT"), name: s, amount: n }),
  z.object({ type: z.literal("BUY_ZIGGURAT_UPGRADE"), name: s }),
  z.object({ type: z.literal("BUY_RELIGION_UPGRADE"), name: s }),
  z.object({ type: z.literal("BUY_TRANSCENDENCE_UPGRADE"), name: s }),
  z.object({ type: z.literal("PRAISE") }),
  z.object({ type: z.literal("ADORE") }),
  z.object({ type: z.literal("TRANSCEND") }),
  z.object({ type: z.literal("PURCHASE_PERK"), name: s }),
  z.object({ type: z.literal("SOFT_RESET") }),
  z.object({ type: z.literal("START_CHALLENGE"), name: s }),
  z.object({ type: z.literal("COMPLETE_CHALLENGE"), name: s }),
  z.object({ type: z.literal("LAUNCH_MISSION"), name: s }),
  z.object({ type: z.literal("BUY_SPACE_BUILDING"), name: s }),
  z.object({ type: z.literal("SEND_EMBASSY"), name: s }),
  z.object({ type: z.literal("TRADE"), name: s }),
  z.object({ type: z.literal("BUY_CFU"), name: s }),
  z.object({ type: z.literal("BUY_VSU"), name: s }),
  z.object({ type: z.literal("SHATTER_TC") }),
  z.object({ type: z.literal("BURN_PARAGON") }),
  z.object({ type: z.literal("SACRIFICE_UNICORNS") }),
  z.object({ type: z.literal("SACRIFICE_ALICORNS") }),
  z.object({ type: z.literal("REFINE_TIME_CRYSTALS") }),
  z.object({ type: z.literal("HUNT") }),
  z.object({ type: z.literal("HOLD_FESTIVAL") }),
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

export const LegacyImportRequestSchema = z.object({
  data: z.string().min(1),
});
export type LegacyImportRequest = z.infer<typeof LegacyImportRequestSchema>;

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
  payload: GameStateResponseSchema,
});
export type WsStateDelta = z.infer<typeof WsStateDeltaSchema>;

export const WsConnectedSchema = WsEnvelopeBase.extend({
  type: z.literal("CONNECTED"),
  payload: z.object({
    sessionId: z.string().min(1),
  }),
});
export type WsConnected = z.infer<typeof WsConnectedSchema>;
