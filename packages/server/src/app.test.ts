import type { Hono } from "hono";
// Integration tests for the Hono app — uses in-memory adapter, no network, no bun:sqlite
import { describe, expect, it } from "vitest";
import { createApp } from "./app.js";
import { createMemoryAdapter } from "./db.js";
import { GameStateStore } from "./store.js";

function makeApp(): { app: Hono; store: GameStateStore } {
  const store = new GameStateStore(createMemoryAdapter());
  store.init();
  const app = createApp(store);
  return { app, store };
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
