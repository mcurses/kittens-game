import {
  type ActionResult,
  ActionResultSchema,
  GameResetRequestSchema,
  GameStateResponseSchema,
  HealthResponseSchema,
  SaveExportResponseSchema,
  SaveImportRequestSchema,
} from "@kittens/api-spec";
import type { SerializedGameState } from "@kittens/engine";
// Hono app factory — creates the HTTP + WS app given a GameStateStore
import { Hono } from "hono";
import { cors } from "hono/cors";
import type { GameStateStore } from "./store.js";

const VERSION = "0.1.0";

function parseSerializedState(data: unknown): SerializedGameState {
  if (typeof data !== "object" || data === null) {
    throw new Error("Invalid save data: expected an object");
  }
  return data as SerializedGameState;
}

export function createApp(store: GameStateStore): Hono {
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
    const serialized = store.getSerialized();
    return c.json(serialized);
  });

  // ── Action ───────────────────────────────────────────────────────────────────
  app.post("/api/game/action", async (c) => {
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      const result: ActionResult = {
        ok: false,
        error: "Invalid JSON body",
        state: GameStateResponseSchema.parse(store.getSerialized()),
      };
      return c.json(ActionResultSchema.parse(result), 400);
    }

    if (
      typeof body !== "object" ||
      body === null ||
      !("type" in body) ||
      typeof (body as Record<string, unknown>).type !== "string"
    ) {
      const result: ActionResult = {
        ok: false,
        error: "Missing or invalid action type",
        state: GameStateResponseSchema.parse(store.getSerialized()),
      };
      return c.json(ActionResultSchema.parse(result), 400);
    }

    const actionResult = store.applyGameAction(body as Parameters<typeof store.applyGameAction>[0]);
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
    const newState = store.advanceTick();
    return c.json(newState);
  });

  // ── Save ─────────────────────────────────────────────────────────────────────
  app.get("/api/game/save", (c) => {
    const data = store.getSerialized();
    const body = SaveExportResponseSchema.parse({ saveVersion: 1, data });
    return c.json(body);
  });

  // ── Load ─────────────────────────────────────────────────────────────────────
  app.post("/api/game/load", async (c) => {
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
