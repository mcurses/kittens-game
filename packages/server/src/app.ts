import {
  type ActionResult,
  ActionResultSchema,
  GameActionRequestSchema,
  GameResetRequestSchema,
  GameStateResponseSchema,
  HealthResponseSchema,
  SaveExportResponseSchema,
  SaveImportRequestSchema,
} from "@kittens/api-spec";
import type { SerializedGameState } from "@kittens/engine";
// Hono app factory — creates the HTTP + WS app given a SessionRegistry
import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Context } from "hono";
import { DEFAULT_SLOT, type GameStateStore } from "./store.js";
import { SessionRegistry, isValidSlot } from "./session.js";

const VERSION = "0.1.0";

function parseSerializedState(data: unknown): SerializedGameState {
  if (typeof data !== "object" || data === null) {
    throw new Error("Invalid save data: expected an object");
  }
  return data as SerializedGameState;
}

/** Extract and validate the slot query param from a request context. */
function getSlotParam(c: Context): string | null {
  const slot = c.req.query("slot") ?? DEFAULT_SLOT;
  if (!isValidSlot(slot)) return null;
  return slot;
}

/** Get the store for the request's slot, or return a 400 error response. */
function resolveStore(
  c: Context,
  registry: SessionRegistry,
): { store: GameStateStore } | Response {
  const slot = getSlotParam(c);
  if (slot === null) {
    return c.json({ ok: false, error: "Invalid slot name" }, 400) as unknown as Response;
  }
  return { store: registry.getOrCreate(slot) };
}

export function createApp(registry: SessionRegistry): Hono {
  const app = new Hono();

  // ── CORS ────────────────────────────────────────────────────────────────────
  app.use("/api/*", cors());

  // ── Health ──────────────────────────────────────────────────────────────────
  app.get("/api/health", (c) => {
    const body = HealthResponseSchema.parse({ status: "ok", version: VERSION });
    return c.json(body);
  });

  // ── Game state ───────────────────────────────────────────────────────────────
  app.get("/api/game/state", (c) => {
    const result = resolveStore(c, registry);
    if (result instanceof Response) return result;
    const serialized = result.store.getSerialized();
    return c.json(serialized);
  });

  // ── Action ───────────────────────────────────────────────────────────────────
  app.post("/api/game/action", async (c) => {
    const result = resolveStore(c, registry);
    if (result instanceof Response) return result;
    const { store } = result;

    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      const actionResult: ActionResult = {
        ok: false,
        error: "Invalid JSON body",
        state: GameStateResponseSchema.parse(store.getSerialized()),
      };
      return c.json(ActionResultSchema.parse(actionResult), 400);
    }

    const parsed = GameActionRequestSchema.safeParse(body);
    if (!parsed.success) {
      const actionResult: ActionResult = {
        ok: false,
        error: parsed.error.issues[0]?.message ?? "Invalid action",
        state: GameStateResponseSchema.parse(store.getSerialized()),
      };
      return c.json(ActionResultSchema.parse(actionResult), 400);
    }

    const actionResult = store.applyGameAction(parsed.data);
    const responseBody: ActionResult = {
      ok: actionResult.ok,
      ...(actionResult.error !== undefined ? { error: actionResult.error } : {}),
      state: GameStateResponseSchema.parse(actionResult.state),
    };
    const status = actionResult.ok ? 200 : 400;
    return c.json(ActionResultSchema.parse(responseBody), status as 200 | 400);
  });

  // ── Tick (testing) ───────────────────────────────────────────────────────────
  app.post("/api/game/tick", (c) => {
    const result = resolveStore(c, registry);
    if (result instanceof Response) return result;
    const newState = result.store.advanceTick();
    return c.json(newState);
  });

  // ── Save ─────────────────────────────────────────────────────────────────────
  app.get("/api/game/save", (c) => {
    const result = resolveStore(c, registry);
    if (result instanceof Response) return result;
    const data = result.store.getSerialized();
    const body = SaveExportResponseSchema.parse({ saveVersion: 1, data });
    return c.json(body);
  });

  // ── Load ─────────────────────────────────────────────────────────────────────
  app.post("/api/game/load", async (c) => {
    const result = resolveStore(c, registry);
    if (result instanceof Response) return result;
    const { store } = result;

    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ ok: false, error: "Invalid JSON body" }, 400);
    }

    const parsed = SaveImportRequestSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ ok: false, error: parsed.error.message }, 400);
    }

    try {
      const stateData = parseSerializedState(parsed.data.data);
      const newState = store.loadFromSave(stateData);
      return c.json(newState);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return c.json({ ok: false, error: message }, 400);
    }
  });

  // ── Reset ─────────────────────────────────────────────────────────────────────
  app.post("/api/game/reset", async (c) => {
    const result = resolveStore(c, registry);
    if (result instanceof Response) return result;
    const { store } = result;

    let hard = false;
    try {
      const body = await c.req.json();
      const parsed = GameResetRequestSchema.safeParse(body);
      if (parsed.success) {
        hard = parsed.data.hard ?? false;
      }
    } catch {
      // Body is optional for reset
    }
    const newState = store.reset(hard);
    return c.json(newState);
  });

  return app;
}
