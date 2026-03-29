import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  fetchGameState,
  fetchHealth,
  fetchSave,
  postGameAction,
  postLoad,
  postReset,
} from "./api.js";

// Mock fetch globally
const mockFetch = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", mockFetch);
});

afterEach(() => {
  vi.restoreAllMocks();
  mockFetch.mockReset();
});

function makeResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as unknown as Response;
}

describe("fetchHealth", () => {
  it("calls GET /api/health and returns body", async () => {
    const body = { status: "ok", version: "0.1.0" };
    mockFetch.mockResolvedValueOnce(makeResponse(body));
    const result = await fetchHealth();
    expect(result).toEqual(body);
    expect(mockFetch).toHaveBeenCalledWith("/api/health");
  });

  it("throws on non-ok response", async () => {
    mockFetch.mockResolvedValueOnce(makeResponse({}, 503));
    await expect(fetchHealth()).rejects.toThrow("Health check failed: 503");
  });
});

describe("fetchGameState", () => {
  it("calls GET /api/game/state and returns body", async () => {
    const body = { version: 1, tick: 42 };
    mockFetch.mockResolvedValueOnce(makeResponse(body));
    const result = await fetchGameState();
    expect(result).toEqual(body);
    expect(mockFetch).toHaveBeenCalledWith("/api/game/state");
  });

  it("appends slot param when slot is provided", async () => {
    const body = { version: 1, tick: 42 };
    mockFetch.mockResolvedValueOnce(makeResponse(body));
    await fetchGameState("mysave");
    expect(mockFetch).toHaveBeenCalledWith("/api/game/state?slot=mysave");
  });

  it("omits slot param when slot is 'default'", async () => {
    const body = { version: 1, tick: 42 };
    mockFetch.mockResolvedValueOnce(makeResponse(body));
    await fetchGameState("default");
    expect(mockFetch).toHaveBeenCalledWith("/api/game/state");
  });

  it("throws on non-ok response", async () => {
    mockFetch.mockResolvedValueOnce(makeResponse({}, 500));
    await expect(fetchGameState()).rejects.toThrow(
      "Failed to fetch game state: 500",
    );
  });
});

describe("postGameAction", () => {
  it("calls POST /api/game/action with action body", async () => {
    const actionResult = {
      ok: true,
      state: { version: 1, tick: 43 },
    };
    mockFetch.mockResolvedValueOnce(makeResponse(actionResult, 200));
    const result = await postGameAction({ type: "GATHER_CATNIP" });
    expect(result).toEqual(actionResult);
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/game/action",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "GATHER_CATNIP" }),
      }),
    );
  });

  it("appends slot param when slot is provided", async () => {
    const actionResult = { ok: true, state: { version: 1, tick: 1 } };
    mockFetch.mockResolvedValueOnce(makeResponse(actionResult, 200));
    await postGameAction({ type: "GATHER_CATNIP" }, "mysave");
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/game/action?slot=mysave",
      expect.any(Object),
    );
  });

  it("returns error action result on 400", async () => {
    const actionResult = {
      ok: false,
      error: "Unknown action",
      state: { version: 1, tick: 43 },
    };
    mockFetch.mockResolvedValueOnce(makeResponse(actionResult, 400));
    const result = await postGameAction({ type: "UNKNOWN" });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Unknown action");
  });
});

describe("fetchSave", () => {
  it("calls GET /api/game/save and returns body", async () => {
    const body = { saveVersion: 1, data: { version: 1, tick: 10 } };
    mockFetch.mockResolvedValueOnce(makeResponse(body));
    const result = await fetchSave();
    expect(result).toEqual(body);
    expect(mockFetch).toHaveBeenCalledWith("/api/game/save");
  });

  it("throws on non-ok response", async () => {
    mockFetch.mockResolvedValueOnce(makeResponse({}, 500));
    await expect(fetchSave()).rejects.toThrow("Failed to fetch save: 500");
  });
});

describe("postLoad", () => {
  it("calls POST /api/game/load with save data", async () => {
    const state = { version: 1, tick: 5 };
    mockFetch.mockResolvedValueOnce(makeResponse(state));
    const result = await postLoad({ data: { version: 1 } });
    expect(result).toEqual(state);
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/game/load",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: { version: 1 } }),
      }),
    );
  });

  it("throws on non-ok response", async () => {
    mockFetch.mockResolvedValueOnce(makeResponse({}, 400));
    await expect(postLoad({ data: {} })).rejects.toThrow(
      "Failed to load save: 400",
    );
  });
});

describe("postReset", () => {
  it("calls POST /api/game/reset with optional body", async () => {
    const state = { version: 1, tick: 0 };
    mockFetch.mockResolvedValueOnce(makeResponse(state));
    const result = await postReset({ hard: true });
    expect(result).toEqual(state);
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/game/reset",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ hard: true }),
      }),
    );
  });

  it("sends empty body when no request provided", async () => {
    const state = { version: 1, tick: 0 };
    mockFetch.mockResolvedValueOnce(makeResponse(state));
    await postReset();
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/game/reset",
      expect.objectContaining({ body: JSON.stringify({}) }),
    );
  });

  it("throws on non-ok response", async () => {
    mockFetch.mockResolvedValueOnce(makeResponse({}, 500));
    await expect(postReset()).rejects.toThrow("Failed to reset game: 500");
  });
});
