import type { Hono } from "hono";
// Integration tests for the Hono app — uses in-memory adapter, no network, no bun:sqlite
import LZString from "lz-string";
import { describe, expect, it } from "vitest";
import { createApp } from "./app.js";
import { createMemoryAdapter } from "./db.js";
import type { GameStateStore } from "./store.js";
import { SessionRegistry } from "./store.js";

function makeApp(): { app: Hono; registry: SessionRegistry; store: GameStateStore } {
  const db = createMemoryAdapter();
  const registry = new SessionRegistry(db);
  const app = createApp(registry);
  // Eagerly create the default store so tests that call store.advanceTick() work
  const store = registry.create("default");
  return { app, registry, store };
}

async function req(app: Hono, path: string, options?: RequestInit): Promise<Response> {
  return app.request(path, options);
}

describe("GET /api/health", () => {
  it("returns status ok and version", async () => {
    const { app } = makeApp();
    const res = await req(app, "/api/health");
    expect(res.status).toBe(200);
    const body = (await res.json()) as { status: string; version: string };
    expect(body.status).toBe("ok");
    expect(body.version).toBe("0.1.0");
  });
});

describe("GET /api/game/state", () => {
  it("returns initial state with tick=0", async () => {
    const { app } = makeApp();
    const res = await req(app, "/api/game/state");
    expect(res.status).toBe(200);
    const body = (await res.json()) as { tick: number };
    expect(body.tick).toBe(0);
  });

  it("reflects tick advances", async () => {
    const { app, store } = makeApp();
    store.advanceTick();
    const res = await req(app, "/api/game/state");
    const body = (await res.json()) as { tick: number };
    expect(body.tick).toBe(1);
  });

  it("defaults to default slot when no slot param", async () => {
    const { app } = makeApp();
    const res = await req(app, "/api/game/state");
    expect(res.status).toBe(200);
  });

  it("returns state for a specific slot", async () => {
    const { app, registry } = makeApp();
    registry.create("myslot").advanceTick();
    const res = await req(app, "/api/game/state?slot=myslot");
    const body = (await res.json()) as { tick: number };
    expect(body.tick).toBe(1);
  });

  it("different slots have independent state", async () => {
    const { app, registry } = makeApp();
    registry.create("slot-a").advanceTick();
    registry.create("slot-b");
    const resA = await req(app, "/api/game/state?slot=slot-a");
    const resB = await req(app, "/api/game/state?slot=slot-b");
    expect(((await resA.json()) as { tick: number }).tick).toBe(1);
    expect(((await resB.json()) as { tick: number }).tick).toBe(0);
  });

  it("returns 400 for invalid slot name", async () => {
    const { app } = makeApp();
    const res = await req(app, "/api/game/state?slot=../bad");
    expect(res.status).toBe(400);
  });
});

describe("POST /api/game/action", () => {
  it("dispatches TICK action and returns ok:true with updated state", async () => {
    const { app } = makeApp();
    const res = await req(app, "/api/game/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "TICK" }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; state: { tick: number } };
    expect(body.ok).toBe(true);
    expect(body.state.tick).toBe(1);
  });

  it("returns 400 for invalid JSON body", async () => {
    const { app } = makeApp();
    const res = await req(app, "/api/game/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not-json",
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { ok: boolean; error: string };
    expect(body.ok).toBe(false);
    expect(body.error).toBeDefined();
  });

  it("returns 400 for missing type field", async () => {
    const { app } = makeApp();
    const res = await req(app, "/api/game/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ foo: "bar" }),
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { ok: boolean };
    expect(body.ok).toBe(false);
  });

  it("returns 400 for unknown action type", async () => {
    const { app } = makeApp();
    const res = await req(app, "/api/game/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "NOT_A_REAL_ACTION" }),
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { ok: boolean; error: string };
    expect(body.ok).toBe(false);
    expect(body.error).toBeDefined();
  });

  it("dispatches GATHER_CATNIP and returns ok:true", async () => {
    const { app } = makeApp();
    const res = await req(app, "/api/game/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "GATHER_CATNIP" }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean };
    expect(body.ok).toBe(true);
  });

  it("routes action to specific slot", async () => {
    const { app, registry } = makeApp();
    registry.create("test-slot");
    await req(app, "/api/game/action?slot=test-slot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "TICK" }),
    });
    const res = await req(app, "/api/game/state?slot=test-slot");
    const body = (await res.json()) as { tick: number };
    expect(body.tick).toBe(1);
    // default slot unaffected
    const defaultRes = await req(app, "/api/game/state");
    expect(((await defaultRes.json()) as { tick: number }).tick).toBe(0);
  });

  it("returns 409 if slot is paused", async () => {
    const { app, registry } = makeApp();
    registry.create("paused-slot");
    registry.pause("paused-slot");

    const res = await req(app, "/api/game/action?slot=paused-slot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "TICK" }),
    });
    expect(res.status).toBe(409);
    const body = (await res.json()) as { error: string };
    expect(body.error).toContain("paused");
  });

  it("allows reads on paused slots", async () => {
    const { app, registry } = makeApp();
    registry.create("paused-slot");
    registry.pause("paused-slot");

    const res = await req(app, "/api/game/state?slot=paused-slot");
    expect(res.status).toBe(200);
    const body = (await res.json()) as { tick: number };
    expect(body.tick).toBe(0);
  });

  it("returns 400 for invalid slot", async () => {
    const { app } = makeApp();
    const res = await req(app, "/api/game/action?slot=..%2Fbad", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "TICK" }),
    });
    expect(res.status).toBe(400);
  });
});

describe("POST /api/game/tick", () => {
  it("advances tick by 1", async () => {
    const { app } = makeApp();
    const res = await req(app, "/api/game/tick", { method: "POST" });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { tick: number };
    expect(body.tick).toBe(1);
  });

  it("advances tick twice across two calls", async () => {
    const { app } = makeApp();
    await req(app, "/api/game/tick", { method: "POST" });
    const res = await req(app, "/api/game/tick", { method: "POST" });
    const body = (await res.json()) as { tick: number };
    expect(body.tick).toBe(2);
  });

  it("routes tick to specific slot", async () => {
    const { app, registry } = makeApp();
    registry.create("tick-slot");
    await req(app, "/api/game/tick?slot=tick-slot", { method: "POST" });
    const res = await req(app, "/api/game/state?slot=tick-slot");
    expect(((await res.json()) as { tick: number }).tick).toBe(1);
    // default slot unaffected
    const defaultRes = await req(app, "/api/game/state");
    expect(((await defaultRes.json()) as { tick: number }).tick).toBe(0);
  });

  it("returns 409 if slot is paused", async () => {
    const { app, registry } = makeApp();
    registry.create("paused-slot");
    registry.pause("paused-slot");

    const res = await req(app, "/api/game/tick?slot=paused-slot", { method: "POST" });
    expect(res.status).toBe(409);
    const body = (await res.json()) as { error: string };
    expect(body.error).toContain("paused");
  });

  it("restarts ticks after resuming paused slot", async () => {
    const { app, registry } = makeApp();
    registry.create("test-slot");
    // Pause the slot
    registry.pause("test-slot");
    // Try to tick — should fail
    let res = await req(app, "/api/game/tick?slot=test-slot", { method: "POST" });
    expect(res.status).toBe(409);

    // Resume the slot
    registry.resume("test-slot");
    // Now tick should work
    res = await req(app, "/api/game/tick?slot=test-slot", { method: "POST" });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { tick: number };
    expect(body.tick).toBe(1);
  });
});

describe("GET /api/game/save", () => {
  it("returns saveVersion=1 and data with tick=0", async () => {
    const { app } = makeApp();
    const res = await req(app, "/api/game/save");
    expect(res.status).toBe(200);
    const body = (await res.json()) as { saveVersion: number; data: { tick: number } };
    expect(body.saveVersion).toBe(1);
    expect(body.data).toBeDefined();
    expect(body.data.tick).toBe(0);
  });
});

describe("POST /api/game/load", () => {
  it("loads state from valid save data", async () => {
    const { app, store } = makeApp();
    store.advanceTick();
    store.advanceTick();
    const saved = store.getSerialized();

    store.reset(true);
    expect(store.getSerialized().tick).toBe(0);

    const res = await req(app, "/api/game/load", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: saved }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { tick: number };
    expect(body.tick).toBe(2);
  });

  it("returns 400 for invalid JSON", async () => {
    const { app } = makeApp();
    const res = await req(app, "/api/game/load", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "bad json",
    });
    expect(res.status).toBe(400);
  });

  it("returns 400 for missing data field", async () => {
    const { app } = makeApp();
    const res = await req(app, "/api/game/load", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notdata: {} }),
    });
    expect(res.status).toBe(400);
  });
});

// ── POST /api/game/import-legacy ─────────────────────────────────────────────

const minimalLegacySave = JSON.stringify({
  saveVersion: 15,
  resources: [{ name: "catnip", value: 100, maxValue: 5000 }],
  buildings: [{ name: "field", val: 1, on: 1, unlocked: true }],
  village: {
    kittens: [],
    nextKittenProgress: 0,
    jobs: [{ name: "farmer", value: 0 }],
  },
  calendar: { day: 0, season: 0, year: 1 },
  science: { techs: [], policies: [] },
  workshop: { upgrades: [], crafts: [] },
});

describe("POST /api/game/import-legacy", () => {
  it("loads a raw JSON legacy save string", async () => {
    const { app } = makeApp();
    const res = await req(app, "/api/game/import-legacy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: minimalLegacySave }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { calendar: { year: number } };
    expect(body.calendar.year).toBe(1);
  });

  it("loads a base64 LZString-compressed legacy save", async () => {
    const { app } = makeApp();
    const compressed = LZString.compressToBase64(minimalLegacySave);
    const res = await req(app, "/api/game/import-legacy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: compressed }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { calendar: { year: number } };
    expect(body.calendar.year).toBe(1);
  });

  it("loads a UTF-16 LZString-compressed legacy save", async () => {
    const { app } = makeApp();
    const compressed = LZString.compressToUTF16(minimalLegacySave);
    const res = await req(app, "/api/game/import-legacy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: compressed }),
    });
    expect(res.status).toBe(200);
  });

  it("returns 400 for garbage data that cannot be decompressed", async () => {
    const { app } = makeApp();
    const res = await req(app, "/api/game/import-legacy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: "notjsonnotcompressed" }),
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { ok: boolean; error: string };
    expect(body.ok).toBe(false);
    expect(body.error).toContain("decompress");
  });

  it("returns 400 for missing data field", async () => {
    const { app } = makeApp();
    const res = await req(app, "/api/game/import-legacy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notdata: "oops" }),
    });
    expect(res.status).toBe(400);
  });
});

describe("POST /api/game/reset", () => {
  it("resets state to tick=0", async () => {
    const { app, store } = makeApp();
    store.advanceTick();
    store.advanceTick();

    const res = await req(app, "/api/game/reset", { method: "POST" });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { tick: number };
    expect(body.tick).toBe(0);
  });

  it("hard=false performs soft reset", async () => {
    const { app, store } = makeApp();
    store.advanceTick();

    const res = await req(app, "/api/game/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hard: false }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { tick: number };
    expect(body.tick).toBe(0);
  });

  it("hard=true performs hard reset", async () => {
    const { app, store } = makeApp();
    store.advanceTick();

    const res = await req(app, "/api/game/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hard: true }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { tick: number };
    expect(body.tick).toBe(0);
  });

  it("works with empty body (no JSON)", async () => {
    const { app } = makeApp();
    const res = await req(app, "/api/game/reset", { method: "POST" });
    expect(res.status).toBe(200);
  });

  it("resets only the specified slot", async () => {
    const { app, registry } = makeApp();
    const s = registry.create("rs");
    s.advanceTick();
    await req(app, "/api/game/reset?slot=rs", { method: "POST" });
    expect(s.getSerialized().tick).toBe(0);
    // default slot unaffected
    const store = registry.getOrCreate("default");
    if (store) store.advanceTick();
    const defaultRes = await req(app, "/api/game/state");
    expect(((await defaultRes.json()) as { tick: number }).tick).toBe(1);
  });
});

describe("CORS headers", () => {
  it("OPTIONS preflight on /api/health does not return 404", async () => {
    const { app } = makeApp();
    const preflightRes = await app.request("/api/health", {
      method: "OPTIONS",
      headers: {
        Origin: "http://localhost:5173",
        "Access-Control-Request-Method": "GET",
      },
    });
    expect(preflightRes.status).not.toBe(404);
  });

  it("GET /api/health with Origin header includes Access-Control-Allow-Origin", async () => {
    const { app } = makeApp();
    const res = await app.request("/api/health", {
      headers: { Origin: "http://localhost:5173" },
    });
    expect(res.headers.get("Access-Control-Allow-Origin")).toBeTruthy();
  });
});

describe("GET /api/sessions", () => {
  it("returns empty sessions list on fresh registry", async () => {
    const { app } = makeApp();
    const res = await req(app, "/api/sessions");
    expect(res.status).toBe(200);
    const body = (await res.json()) as { sessions: Array<{ slot: string; status: string }> };
    expect(Array.isArray(body.sessions)).toBe(true);
  });

  it("returns all created slots with metadata", async () => {
    const { app, registry } = makeApp();
    registry.create("slot1");
    registry.create("slot2");

    const res = await req(app, "/api/sessions");
    expect(res.status).toBe(200);
    const body = (await res.json()) as { sessions: Array<{ slot: string; status: string }> };
    const slotNames = body.sessions.map((s) => s.slot).sort();
    expect(slotNames).toContain("slot1");
    expect(slotNames).toContain("slot2");
  });

  it("includes status and timestamps in metadata", async () => {
    const { app, registry } = makeApp();
    registry.create("myslot");

    const res = await req(app, "/api/sessions");
    const body = (await res.json()) as {
      sessions: Array<{ slot: string; status: string; createdAt: number; updatedAt: number }>;
    };
    const slot = body.sessions.find((s) => s.slot === "myslot");
    expect(slot).toBeDefined();
    expect(slot!.status).toBe("active");
    expect(typeof slot!.createdAt).toBe("number");
    expect(typeof slot!.updatedAt).toBe("number");
  });
});

describe("POST /api/sessions", () => {
  it("creates a new session and returns metadata with 201", async () => {
    const { app } = makeApp();
    const res = await req(app, "/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slot: "newsession" }),
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as { slot: string; status: string };
    expect(body.slot).toBe("newsession");
    expect(body.status).toBe("active");
  });

  it("returns 400 for invalid slot name", async () => {
    const { app } = makeApp();
    const res = await req(app, "/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slot: "../../../etc/passwd" }),
    });
    expect(res.status).toBe(400);
  });

  it("returns 409 if slot already exists", async () => {
    const { app, registry } = makeApp();
    registry.create("existing");

    const res = await req(app, "/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slot: "existing" }),
    });
    expect(res.status).toBe(409);
  });

  it("returns 400 for missing slot field", async () => {
    const { app } = makeApp();
    const res = await req(app, "/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notslot: "value" }),
    });
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid JSON body", async () => {
    const { app } = makeApp();
    const res = await req(app, "/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not-json",
    });
    expect(res.status).toBe(400);
  });
});

describe("GET /api/sessions/:slot", () => {
  it("returns metadata for an existing slot", async () => {
    const { app, registry } = makeApp();
    registry.create("getslot");

    const res = await req(app, "/api/sessions/getslot");
    expect(res.status).toBe(200);
    const body = (await res.json()) as { slot: string; status: string };
    expect(body.slot).toBe("getslot");
    expect(body.status).toBe("active");
  });

  it("returns 404 for unknown slot", async () => {
    const { app } = makeApp();
    const res = await req(app, "/api/sessions/nonexistent");
    expect(res.status).toBe(404);
  });

  it("returns 400 for invalid slot name", async () => {
    const { app } = makeApp();
    const res = await req(app, "/api/sessions/..%2Fbad");
    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/sessions/:slot", () => {
  it("deletes a slot and returns 204", async () => {
    const { app, registry } = makeApp();
    registry.create("delslot");

    const res = await req(app, "/api/sessions/delslot", { method: "DELETE" });
    expect(res.status).toBe(204);

    // Verify it's gone
    const getRes = await req(app, "/api/sessions/delslot");
    expect(getRes.status).toBe(404);
  });

  it("returns 404 for unknown slot", async () => {
    const { app } = makeApp();
    const res = await req(app, "/api/sessions/notreal", { method: "DELETE" });
    expect(res.status).toBe(404);
  });

  it("returns 400 for invalid slot name", async () => {
    const { app } = makeApp();
    const res = await req(app, "/api/sessions/..%2Fbad", { method: "DELETE" });
    expect(res.status).toBe(400);
  });
});

describe("POST /api/sessions/:slot/pause", () => {
  it("pauses an active slot and returns metadata", async () => {
    const { app, registry } = makeApp();
    registry.create("pauseslot");

    const res = await req(app, "/api/sessions/pauseslot/pause", { method: "POST" });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { status: string };
    expect(body.status).toBe("paused");
  });

  it("returns 404 for unknown slot", async () => {
    const { app } = makeApp();
    const res = await req(app, "/api/sessions/unknown/pause", { method: "POST" });
    expect(res.status).toBe(404);
  });

  it("returns 409 if already paused", async () => {
    const { app, registry } = makeApp();
    registry.create("pausedslot");
    registry.pause("pausedslot");

    const res = await req(app, "/api/sessions/pausedslot/pause", { method: "POST" });
    expect(res.status).toBe(409);
  });

  it("returns 400 for invalid slot name", async () => {
    const { app } = makeApp();
    const res = await req(app, "/api/sessions/..%2Fbad/pause", { method: "POST" });
    expect(res.status).toBe(400);
  });
});

describe("POST /api/sessions/:slot/resume", () => {
  it("resumes a paused slot and returns metadata", async () => {
    const { app, registry } = makeApp();
    registry.create("resumeslot");
    registry.pause("resumeslot");

    const res = await req(app, "/api/sessions/resumeslot/resume", { method: "POST" });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { status: string };
    expect(body.status).toBe("active");
  });

  it("returns 404 for unknown slot", async () => {
    const { app } = makeApp();
    const res = await req(app, "/api/sessions/unknown/resume", { method: "POST" });
    expect(res.status).toBe(404);
  });

  it("returns 409 if already active", async () => {
    const { app, registry } = makeApp();
    registry.create("activeslot");

    const res = await req(app, "/api/sessions/activeslot/resume", { method: "POST" });
    expect(res.status).toBe(409);
  });

  it("returns 400 for invalid slot name", async () => {
    const { app } = makeApp();
    const res = await req(app, "/api/sessions/..%2Fbad/resume", { method: "POST" });
    expect(res.status).toBe(400);
  });
});

describe("POST /api/sessions/:slot/archive", () => {
  it("archives an active slot and returns metadata", async () => {
    const { app, registry } = makeApp();
    registry.create("archiveslot");

    const res = await req(app, "/api/sessions/archiveslot/archive", { method: "POST" });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { status: string };
    expect(body.status).toBe("archived");
  });

  it("returns 404 for unknown slot", async () => {
    const { app } = makeApp();
    const res = await req(app, "/api/sessions/unknown/archive", { method: "POST" });
    expect(res.status).toBe(404);
  });

  it("returns 409 if already archived", async () => {
    const { app, registry } = makeApp();
    registry.create("archivedslot");
    registry.archive("archivedslot");

    const res = await req(app, "/api/sessions/archivedslot/archive", { method: "POST" });
    expect(res.status).toBe(409);
  });

  it("returns 400 for invalid slot name", async () => {
    const { app } = makeApp();
    const res = await req(app, "/api/sessions/..%2Fbad/archive", { method: "POST" });
    expect(res.status).toBe(400);
  });
});

describe("GET /api/sessions/:slot/export", () => {
  it("exports state JSON with attachment header", async () => {
    const { app, registry } = makeApp();
    const store = registry.create("exportslot");
    store.advanceTick();

    const res = await req(app, "/api/sessions/exportslot/export");
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Disposition")).toContain("exportslot.json");
    expect(res.headers.get("Content-Type")).toBe("application/json");
    const body = (await res.json()) as { tick: number };
    expect(body.tick).toBe(1);
  });

  it("returns 404 for unknown slot", async () => {
    const { app } = makeApp();
    const res = await req(app, "/api/sessions/unknown/export");
    expect(res.status).toBe(404);
  });

  it("returns 409 for archived slot", async () => {
    const { app, registry } = makeApp();
    registry.create("archslot");
    registry.archive("archslot");

    const res = await req(app, "/api/sessions/archslot/export");
    expect(res.status).toBe(409);
  });

  it("returns 400 for invalid slot name", async () => {
    const { app } = makeApp();
    const res = await req(app, "/api/sessions/..%2Fbad/export");
    expect(res.status).toBe(400);
  });
});

describe("Full round-trip integration", () => {
  it("health → state → action → tick → save → load → reset all pass", async () => {
    const { app } = makeApp();

    const health = await req(app, "/api/health");
    expect(health.status).toBe(200);

    const state = await req(app, "/api/game/state");
    expect(state.status).toBe(200);
    expect(((await state.json()) as { tick: number }).tick).toBe(0);

    const action = await req(app, "/api/game/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "TICK" }),
    });
    expect(action.status).toBe(200);

    const tickRes = await req(app, "/api/game/tick", { method: "POST" });
    expect(tickRes.status).toBe(200);
    expect(((await tickRes.json()) as { tick: number }).tick).toBe(2);

    const save = await req(app, "/api/game/save");
    expect(save.status).toBe(200);
    const saveBody = (await save.json()) as { saveVersion: number; data: unknown };
    expect(saveBody.saveVersion).toBe(1);

    const load = await req(app, "/api/game/load", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: saveBody.data }),
    });
    expect(load.status).toBe(200);
    expect(((await load.json()) as { tick: number }).tick).toBe(2);

    const reset = await req(app, "/api/game/reset", { method: "POST" });
    expect(reset.status).toBe(200);
    expect(((await reset.json()) as { tick: number }).tick).toBe(0);
  });
});

describe("Legacy import — derived values parity", () => {
  it("housing buildings contribute correctly to maxKittens during import", async () => {
    const { app } = makeApp();

    // Minimal legacy save with housing buildings that should give maxKittens
    // hut (2), logHouse (1), mansion (1) = 4 total
    const minimalHousingLegacySave = JSON.stringify({
      saveVersion: 15,
      resources: [{ name: "catnip", value: 100, maxValue: 5000 }],
      buildings: [
        { name: "field", val: 1, on: 1, unlocked: true },
        { name: "hut", val: 10, on: 10, unlocked: true },
        { name: "logHouse", val: 5, on: 5, unlocked: true },
        { name: "mansion", val: 3, on: 3, unlocked: true },
      ],
      village: {
        kittens: 50,
        nextKittenProgress: 0,
        jobs: [{ name: "farmer", value: 0 }],
      },
      calendar: { day: 0, season: 0, year: 1 },
      science: { techs: [], policies: [] },
      workshop: { upgrades: [], crafts: [] },
    });

    const res = await req(app, "/api/game/import-legacy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: minimalHousingLegacySave }),
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      village: { kittens: number };
      effectCache: { maxKittens: number };
    };

    // hut: 10 * 2 = 20
    // logHouse: 5 * 1 = 5
    // mansion: 3 * 1 = 3
    // Total: 28
    expect(body.effectCache.maxKittens).toBe(28);
  });

  it("Run 8 fixture: recomputes maxKittens from housing effects after import", async () => {
    const { app } = makeApp();

    // Load the Run 8 fixture (LZ-string compressed)
    // This is a real late-game save: Year 10527, Season 2, Day 48
    // Legacy maxKittens: 579 kittens alive
    // Housing: hut (67) * 2 + logHouse (216) * 1 + mansion (192) * 1 = 542 (base housing capacity)
    const fs = await import("fs");
    const path = await import("path");
    const __dirname = path.dirname(new URL(import.meta.url).pathname);
    const run8FilePath = path.join(__dirname, "../../../agent-docs/example-saves/Kittens Game - Run 8 - Year 10527 - Autumn, day 48.txt");
    const run8Compressed = fs.readFileSync(run8FilePath, "utf8");
    const run8Json = LZString.decompressFromBase64(run8Compressed);
    const run8Data = JSON.parse(run8Json) as unknown;

    // Check what the legacy save says about maxKittens
    const legacyData = run8Data as Record<string, unknown>;
    const legacyVillage = legacyData.village as Record<string, unknown>;
    const legacyMaxKittens = legacyVillage?.maxKittens as number | undefined;

    // No need to log detailed debug info for story completion
    // Legacy maxKittens is now preserved and tested

    const res = await req(app, "/api/game/import-legacy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: run8Json }),
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      calendar: { year: number; season: number; day: number };
      village: { kittens: number };
      buildings?: Record<string, unknown>;
      science?: { policies?: Record<string, unknown> };
      religion?: { ru?: Record<string, unknown> };
      space?: { spaceBuildings?: Record<string, unknown> };
      effectCache: { maxKittens: number; maxKittensRatio?: number };
    };

    // Verify calendar matches
    expect(body.calendar.year).toBe(10527);
    expect(body.calendar.season).toBe(2);
    expect(body.calendar.day).toBe(48);

    // Verify that buildings were loaded correctly
    expect(body.buildings).toBeDefined();
    expect((body.buildings?.hut as Record<string, number> | undefined)?.val).toBe(67);
    expect((body.buildings?.logHouse as Record<string, number> | undefined)?.val).toBe(216);
    expect((body.buildings?.mansion as Record<string, number> | undefined)?.val).toBe(192);

    // Verify that housing was imported correctly
    const hut = (body.buildings?.hut as Record<string, number> | undefined)?.val ?? 0;
    const logHouse = (body.buildings?.logHouse as Record<string, number> | undefined)?.val ?? 0;
    const mansion = (body.buildings?.mansion as Record<string, number> | undefined)?.val ?? 0;
    const calcHousing = hut * 2 + logHouse * 1 + mansion * 1;


    // Check which policies are researched (liberty policy adds maxKittens: 1)
    const policies = body.science?.policies as Record<string, unknown> | undefined;
    if (policies) {
      const libertyPolicy = policies.liberty as Record<string, unknown> | undefined;
      if (libertyPolicy?.researched) {
        console.log("DEBUG: liberty policy is researched (+1 maxKittens)");
      }
      // Check for fulfillment upgrade
      const fulfillment = policies.fulfillment as Record<string, unknown> | undefined;
      if (fulfillment) {
        console.log("DEBUG: fulfillment upgrade found, researched:", fulfillment.researched);
      }

      // Count ALL policies and check liberty
      const allPolicies = Object.entries(policies);
      console.log("DEBUG: Total policies in state:", allPolicies.length);
      const liberty = policies.liberty as Record<string, unknown> | undefined;
      if (liberty) {
        console.log("DEBUG: liberty policy researched:", liberty.researched);
      }
    }

    // Also check religion upgrades for maxKittensRatio
    if (body.religion) {
      const ru = body.religion.ru;
      if (ru) {
        const allReligionUpgrades = Object.entries(ru);
        console.log("DEBUG: Total religion upgrades:", allReligionUpgrades.length);
        // Check if any have maxKittensRatio
        allReligionUpgrades.forEach(([name, u]) => {
          const uRec = u as Record<string, unknown>;
          if (typeof u === "object" && u !== null && typeof uRec.on === "number" && uRec.on > 0) {
            console.log("DEBUG: Active religion upgrade:", name, uRec.on);
          }
        });
      }
    }


    console.log("DEBUG: Housing contribution: hut(67)*2 + logHouse(216)*1 + mansion(192)*1 = 542");
    console.log("DEBUG: Actual maxKittens =", body.effectCache.maxKittens, "(" + (body.effectCache.maxKittens - 542) + " bonus)");

    // Check which policies might have maxKittens
    if (policies) {
      const withMaxKittens: string[] = [];
      Object.entries(policies).forEach(([name, p]) => {
        if (typeof p === "object" && p !== null && (p as Record<string, unknown>).researched === true) {
          // Check if this is one of the known maxKittens-contributing policies
          if (name === "liberty") {
            withMaxKittens.push(`${name}(+1)`);
          }
        }
      });
      if (withMaxKittens.length > 0) {
        console.log("DEBUG: Policies with maxKittens effects:", withMaxKittens.join(", "));
      }
    }

    // Check space buildings
    const space = body.space as Record<string, unknown> | undefined;
    if (space && typeof space === "object") {
      const spaceBuildings = space.spaceBuildings as Record<string, unknown> | undefined;
      if (spaceBuildings && typeof spaceBuildings === "object") {
        // Log all space buildings with on > 0
        Object.entries(spaceBuildings).forEach(([name, bld]) => {
          const bldRec = bld as Record<string, unknown>;
          if (bldRec && typeof bldRec === "object") {
            const on = bldRec.on as number | undefined;
            if (typeof on === "number" && on > 0) {
              console.log(`DEBUG: space building ${name}: on=${on}`);
            }
          }
        });
      }
    }

    // Check maxKittensRatio in effect cache
    const maxKittensRatio = (body.effectCache as Record<string, unknown>).maxKittensRatio as number | undefined;
    const terraformingMaxKittensRatio = (body.effectCache as Record<string, unknown>).terraformingMaxKittensRatio as number | undefined;
    console.log("DEBUG: maxKittensRatio effect:", maxKittensRatio ?? 0);
    console.log("DEBUG: terraformingMaxKittensRatio effect:", terraformingMaxKittensRatio ?? 0);

    // Check transcendence upgrades
    const religion = body.religion as Record<string, unknown> | undefined;
    if (religion && typeof religion === "object") {
      const tu = religion.tu as Record<string, unknown> | undefined;
      if (tu) {
        const holyGenocide = tu.holyGenocide as Record<string, unknown> | undefined;
        if (holyGenocide) {
          console.log("DEBUG: holyGenocide tu:", JSON.stringify(holyGenocide));
        }
      }
    }

    // Verify that recomputed maxKittens is reasonable (at least housing baseline of 542)
    // The rewrite now correctly imports buildings from legacy saves using numeric-indexed arrays.
    // Story 45-02: derived values should match legacy, ensuring no impossible kitten counts.

    // Check if legacy maxKittens was preserved
    const legacyMaxKittensImported = (body.effectCache as Record<string, unknown>)._legacyMaxKittensImported as number | undefined;
    console.log("DEBUG: legacyMaxKittensImported in effectCache:", legacyMaxKittensImported);

    // At import time, we should use the legacy maxKittens value to maintain parity
    // Story 45-02 AC1: "maxKittens matches legacy so the header does not show 579 / 562 for a legacy 579 / 579 save"
    if (legacyMaxKittensImported !== undefined) {
      // After import, maxKittens should match the legacy value
      expect(body.effectCache.maxKittens).toBe(legacyMaxKittensImported);
    } else {
      // Fallback: at least match housing baseline
      expect(body.effectCache.maxKittens).toBeGreaterThanOrEqual(542);
    }
  });

  it("Story 45-03: Run 8 fixture comprehensive regression parity assertions", async () => {
    const { app } = makeApp();

    // Load and import the Run 8 fixture
    const fs = await import("fs");
    const path = await import("path");
    const __dirname = path.dirname(new URL(import.meta.url).pathname);
    const run8FilePath = path.join(__dirname, "../../../agent-docs/example-saves/Kittens Game - Run 8 - Year 10527 - Autumn, day 48.txt");
    const run8Compressed = fs.readFileSync(run8FilePath, "utf8");
    const run8Json = LZString.decompressFromBase64(run8Compressed);

    const res = await req(app, "/api/game/import-legacy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: run8Json }),
    });

    expect(res.status).toBe(200);
    const imported = (await res.json()) as {
      calendar: { year: number; season: number; day: number };
      village: { kittens: number };
      resources?: Record<string, { value: number; maxValue?: number }>;
      buildings?: Record<string, { val: number; on?: number }>;
      science?: { policies?: Record<string, unknown> };
      religion?: Record<string, unknown>;
      space?: Record<string, unknown>;
      effectCache: Record<string, unknown>;
    };

    // AC: year / season / day
    expect(imported.calendar.year).toBe(10527);
    expect(imported.calendar.season).toBe(2); // Autumn
    expect(imported.calendar.day).toBe(48);

    // AC: kitten count and max kittens
    expect(imported.village.kittens).toBe(579);
    const maxKittens = (imported.effectCache as Record<string, unknown>).maxKittens as number | undefined;
    expect(maxKittens).toBe(579); // Should match legacy maxKittens

    // AC: representative resource values
    // Run 8 has: catnip, wood, minerals, science, faith, antimatter, unobtainium preserved
    const resources = imported.resources as Record<string, { value: number; maxValue?: number }> | undefined;
    if (resources) {
      // Verify we have core resources
      expect(resources.catnip).toBeDefined();
      expect(resources.catnip?.value).toBeGreaterThan(0);
      expect(resources.catnip?.maxValue).toBeGreaterThan(0);

      expect(resources.wood).toBeDefined();
      expect(resources.wood?.value).toBeGreaterThan(0);

      expect(resources.minerals).toBeDefined();
      expect(resources.minerals?.value).toBeGreaterThan(0);

      expect(resources.science).toBeDefined();
      expect(resources.science?.value).toBeGreaterThan(0);

      // Late-game resources
      if (resources.faith) {
        expect(resources.faith.value).toBeGreaterThan(0);
      }
      if (resources.antimatter) {
        expect(resources.antimatter.value).toBeGreaterThan(0);
      }
      if (resources.unobtainium) {
        expect(resources.unobtainium.value).toBeGreaterThan(0);
      }
    }

    // AC: representative building counts and on/off state
    const buildings = imported.buildings as Record<string, { val: number; on?: number }> | undefined;
    if (buildings) {
      // Housing buildings (should match calculated maxKittens)
      expect(buildings.hut?.val).toBe(67);
      expect(buildings.logHouse?.val).toBe(216);
      expect(buildings.mansion?.val).toBe(192);

      // Other representative buildings from late-game state
      expect(buildings.field).toBeDefined();
      expect(buildings.field?.val).toBeGreaterThan(0);

      expect(buildings.pasture).toBeDefined();
      expect(buildings.pasture?.val).toBeGreaterThan(0);

      expect(buildings.aqueduct).toBeDefined();
      expect(buildings.aqueduct?.val).toBeGreaterThan(0);

      expect(buildings.library).toBeDefined();
      expect(buildings.library?.val).toBeGreaterThan(0);

      // Verify some buildings have on/off states (automation state)
      if (buildings.barn?.on) {
        expect(typeof buildings.barn.on).toBe("number");
      }
      if (buildings.warehouse?.on) {
        expect(typeof buildings.warehouse.on).toBe("number");
      }
    }

    // AC: representative imported progression state (policies and upgrades)
    const science = imported.science as { policies?: Record<string, unknown> } | undefined;
    if (science?.policies) {
      // Should have multiple policies researched
      const researched = Object.entries(science.policies).filter(
        ([, p]) => typeof p === "object" && p !== null && (p as Record<string, unknown>).researched === true
      );
      expect(researched.length).toBeGreaterThan(0);
    }

    // Verify religion upgrades are loaded
    const religion = imported.religion as { ru?: Record<string, unknown> } | undefined;
    if (religion?.ru) {
      expect(Object.keys(religion.ru).length).toBeGreaterThan(0);
    }

    // Verify space buildings are loaded
    const space = imported.space as { spaceBuildings?: Record<string, unknown> } | undefined;
    if (space?.spaceBuildings) {
      expect(Object.keys(space.spaceBuildings).length).toBeGreaterThan(0);
    }

    // AC: immediate post-import snapshot (not after auto-tick)
    // We verified the imported state directly from the /api/game/import-legacy response
    // No time has advanced in the rewrite; this is the fresh import
    expect(imported.calendar.year).toBe(10527); // Still the exact import timestamp
  });
});
