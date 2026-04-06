import {
  type ActionResult,
  ActionResultSchema,
  GameActionRequestSchema,
  GameResetRequestSchema,
  GameStateResponseSchema,
  HealthResponseSchema,
  LegacyImportRequestSchema,
  SaveExportResponseSchema,
  SaveImportRequestSchema,
} from "@kittens/api-spec";
import type { SerializedGameState } from "@kittens/engine";
import { migrateLegacySave } from "@kittens/engine";
import LZString from "lz-string";
// Hono app factory — creates the HTTP + WS app given a SessionRegistry
import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Context } from "hono";
import { DEFAULT_SLOT, isValidSlot, type GameStateStore, SessionRegistry } from "./store.js";
import type { SlotMeta } from "./db.js";

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
  const store = registry.getOrCreate(slot);
  if (store === null) {
    return c.json({ ok: false, error: "Slot not found or archived" }, 404) as unknown as Response;
  }
  return { store };
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

  // ── Import Legacy ────────────────────────────────────────────────────────────
  app.post("/api/game/import-legacy", async (c) => {
    const result = resolveStore(c, registry);
    if (result instanceof Response) return result;
    const { store } = result;

    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ ok: false, error: "Invalid JSON body" }, 400);
    }

    const parsed = LegacyImportRequestSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ ok: false, error: parsed.error.message }, 400);
    }

    // Decompress: raw JSON → try base64 → try UTF-16
    let jsonStr: string;
    const raw = parsed.data.data;
    if (raw[0] === "{") {
      jsonStr = raw;
    } else {
      const fromBase64 = LZString.decompressFromBase64(raw);
      if (fromBase64 && fromBase64[0] === "{") {
        jsonStr = fromBase64;
      } else {
        const fromUTF16 = LZString.decompressFromUTF16(raw);
        if (fromUTF16 && fromUTF16[0] === "{") {
          jsonStr = fromUTF16;
        } else {
          return c.json({ ok: false, error: "Failed to decompress save data" }, 400);
        }
      }
    }

    let legacyJson: unknown;
    try {
      legacyJson = JSON.parse(jsonStr);
    } catch {
      return c.json({ ok: false, error: "Failed to parse save data as JSON" }, 400);
    }

    try {
      const migrated = migrateLegacySave(legacyJson);
      const newState = store.loadFromSave(migrated);
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

  // ── Sessions ─────────────────────────────────────────────────────────────────────

  // GET /api/sessions — list all slots
  app.get("/api/sessions", (c) => {
    const all = registry.listAll();
    return c.json({ sessions: all });
  });

  // POST /api/sessions — create new session
  app.post("/api/sessions", async (c) => {
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ ok: false, error: "Invalid JSON body" }, 400);
    }

    if (typeof body !== "object" || body === null || !("slot" in body)) {
      return c.json({ ok: false, error: "Missing slot field" }, 400);
    }
    const slot = (body as Record<string, unknown>).slot;
    if (typeof slot !== "string") {
      return c.json({ ok: false, error: "Slot must be a string" }, 400);
    }
    if (!isValidSlot(slot)) {
      return c.json({ ok: false, error: "Invalid slot name" }, 400);
    }

    try {
      registry.create(slot);
      const meta = registry.listAll().find((m) => m.slot === slot);
      if (!meta) {
        throw new Error("Failed to retrieve created slot metadata");
      }
      return c.json(meta, 201);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes("Slot already exists")) {
        return c.json({ ok: false, error: message }, 409);
      }
      return c.json({ ok: false, error: message }, 400);
    }
  });

  // GET /api/sessions/:slot — get slot metadata
  app.get("/api/sessions/:slot", (c) => {
    const slot = c.req.param("slot");
    if (!isValidSlot(slot)) {
      return c.json({ ok: false, error: "Invalid slot name" }, 400);
    }
    const meta = registry.listAll().find((m) => m.slot === slot);
    if (!meta) {
      return c.json({ ok: false, error: "Slot not found" }, 404);
    }
    return c.json(meta);
  });

  // DELETE /api/sessions/:slot — delete slot
  app.delete("/api/sessions/:slot", (c) => {
    const slot = c.req.param("slot");
    if (!isValidSlot(slot)) {
      return c.json({ ok: false, error: "Invalid slot name" }, 400);
    }
    try {
      registry.delete(slot);
      return new Response(null, { status: 204 });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes("not found")) {
        return c.json({ ok: false, error: message }, 404);
      }
      return c.json({ ok: false, error: message }, 400);
    }
  });

  // POST /api/sessions/:slot/pause — pause slot
  app.post("/api/sessions/:slot/pause", (c) => {
    const slot = c.req.param("slot");
    if (!isValidSlot(slot)) {
      return c.json({ ok: false, error: "Invalid slot name" }, 400);
    }
    try {
      const meta = registry.listAll().find((m) => m.slot === slot);
      if (!meta) {
        return c.json({ ok: false, error: "Slot not found" }, 404);
      }
      if (meta.status === "paused" || meta.status === "archived") {
        return c.json({ ok: false, error: `Cannot pause ${meta.status} slot` }, 409);
      }
      registry.pause(slot);
      const updated = registry.listAll().find((m) => m.slot === slot);
      return c.json(updated);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return c.json({ ok: false, error: message }, 400);
    }
  });

  // POST /api/sessions/:slot/resume — resume slot
  app.post("/api/sessions/:slot/resume", (c) => {
    const slot = c.req.param("slot");
    if (!isValidSlot(slot)) {
      return c.json({ ok: false, error: "Invalid slot name" }, 400);
    }
    try {
      const meta = registry.listAll().find((m) => m.slot === slot);
      if (!meta) {
        return c.json({ ok: false, error: "Slot not found" }, 404);
      }
      if (meta.status !== "paused") {
        return c.json({ ok: false, error: `Cannot resume ${meta.status} slot` }, 409);
      }
      registry.resume(slot);
      const updated = registry.listAll().find((m) => m.slot === slot);
      return c.json(updated);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return c.json({ ok: false, error: message }, 400);
    }
  });

  // POST /api/sessions/:slot/archive — archive slot
  app.post("/api/sessions/:slot/archive", (c) => {
    const slot = c.req.param("slot");
    if (!isValidSlot(slot)) {
      return c.json({ ok: false, error: "Invalid slot name" }, 400);
    }
    try {
      const meta = registry.listAll().find((m) => m.slot === slot);
      if (!meta) {
        return c.json({ ok: false, error: "Slot not found" }, 404);
      }
      if (meta.status === "archived") {
        return c.json({ ok: false, error: "Cannot archive archived slot" }, 409);
      }
      registry.archive(slot);
      const updated = registry.listAll().find((m) => m.slot === slot);
      return c.json(updated);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return c.json({ ok: false, error: message }, 400);
    }
  });

  // GET /api/sessions/:slot/export — export slot state
  app.get("/api/sessions/:slot/export", (c) => {
    const slot = c.req.param("slot");
    if (!isValidSlot(slot)) {
      return c.json({ ok: false, error: "Invalid slot name" }, 400);
    }
    try {
      const meta = registry.listAll().find((m) => m.slot === slot);
      if (!meta) {
        return c.json({ ok: false, error: "Slot not found" }, 404);
      }
      if (meta.status === "archived") {
        return c.json({ ok: false, error: "Archived slot cannot be exported" }, 409);
      }
      const json = registry.export(slot);
      return c.text(json, 200, {
        "Content-Disposition": `attachment; filename="${slot}.json"`,
        "Content-Type": "application/json",
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return c.json({ ok: false, error: message }, 400);
    }
  });

  return app;
}
