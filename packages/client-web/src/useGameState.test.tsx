import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, renderHook, waitFor } from "@testing-library/react";
import type React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useGameState } from "./useGameState.js";

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
    defaultOptions: { queries: { retry: false } },
  });
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  return { wrapper: Wrapper, queryClient };
}

describe("useGameState", () => {
  it("returns isPending true on initial load", () => {
    mockFetch.mockImplementation(() => new Promise(() => {})); // never resolves
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useGameState(), { wrapper });
    expect(result.current.isPending).toBe(true);
  });

  it("returns data after successful fetch", async () => {
    const state = { version: 1, tick: 10 };
    mockFetch.mockResolvedValueOnce(makeResponse(state));
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useGameState(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(state);
  });

  it("returns error on fetch failure", async () => {
    mockFetch.mockResolvedValueOnce(makeResponse({}, 500));
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useGameState(), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeTruthy();
  });

  it("uses queryKey ['gameState', 'default'] for default slot", async () => {
    const state = { version: 1, tick: 5 };
    mockFetch.mockResolvedValueOnce(makeResponse(state));
    const { wrapper, queryClient } = makeWrapper();
    renderHook(() => useGameState(), { wrapper });
    await waitFor(() => expect(queryClient.getQueryData(["gameState", "default"])).toEqual(state));
  });

  it("uses queryKey ['gameState', slot] for named slot", async () => {
    const state = { version: 1, tick: 7 };
    mockFetch.mockResolvedValueOnce(makeResponse(state));
    const { wrapper, queryClient } = makeWrapper();
    renderHook(() => useGameState("mysave"), { wrapper });
    await waitFor(() => expect(queryClient.getQueryData(["gameState", "mysave"])).toEqual(state));
    expect(mockFetch).toHaveBeenCalledWith("/api/game/state?slot=mysave");
  });
});
