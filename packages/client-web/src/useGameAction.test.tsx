import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, renderHook, waitFor } from "@testing-library/react";
import type React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useGameAction } from "./useGameAction.js";

const mockFetch = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", mockFetch);
});

afterEach(() => {
  cleanup();
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

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  return { wrapper: Wrapper, queryClient };
}

describe("useGameAction", () => {
  it("calls POST /api/game/action when mutate is called", async () => {
    const actionResult = { ok: true, state: { version: 1, tick: 43 } };
    mockFetch.mockResolvedValueOnce(makeResponse(actionResult, 200));
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useGameAction(), { wrapper });
    result.current.mutate({ type: "GATHER_CATNIP" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/game/action",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ type: "GATHER_CATNIP" }),
      }),
    );
  });

  it("updates queryClient cache with result.state on success", async () => {
    const newState = { version: 1, tick: 99 };
    const actionResult = { ok: true, state: newState };
    mockFetch.mockResolvedValueOnce(makeResponse(actionResult, 200));
    const { wrapper, queryClient } = makeWrapper();
    const { result } = renderHook(() => useGameAction(), { wrapper });
    result.current.mutate({ type: "GATHER_CATNIP" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(queryClient.getQueryData(["gameState", "default"])).toEqual(newState);
  });

  it("does not update cache when ok is false", async () => {
    const actionResult = {
      ok: false,
      error: "Not enough resources",
      state: { version: 1, tick: 5 },
    };
    mockFetch.mockResolvedValueOnce(makeResponse(actionResult, 400));
    const { wrapper, queryClient } = makeWrapper();
    // Pre-seed cache with initial state
    queryClient.setQueryData(["gameState", "default"], { version: 1, tick: 5 });
    const { result } = renderHook(() => useGameAction(), { wrapper });
    result.current.mutate({ type: "BUY_BUILDING" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    // Cache should remain the original value
    expect(queryClient.getQueryData(["gameState", "default"])).toEqual({
      version: 1,
      tick: 5,
    });
  });

  it("is idle initially", () => {
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useGameAction(), { wrapper });
    expect(result.current.isPending).toBe(false);
    expect(result.current.isIdle).toBe(true);
  });
});
