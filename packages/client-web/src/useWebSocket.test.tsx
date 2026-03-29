import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, renderHook } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GAME_STATE_QUERY_KEY } from "./useGameState.js";
import { useWebSocket } from "./useWebSocket.js";

// --------------------------------------------------------------------------
// Minimal WebSocket mock
// --------------------------------------------------------------------------

class MockWebSocket {
  static instances: MockWebSocket[] = [];

  readonly url: string;
  readyState = 0; // CONNECTING
  onmessage: ((event: MessageEvent) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  closeCalled = false;

  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
  }

  // Simulate server sending a message
  simulateMessage(data: unknown) {
    if (this.onmessage) {
      this.onmessage({ data: JSON.stringify(data) } as MessageEvent);
    }
  }

  // Simulate connection close
  simulateClose() {
    if (this.onclose) {
      this.onclose({} as CloseEvent);
    }
  }

  // Simulate error (triggers close)
  simulateError() {
    if (this.onerror) {
      this.onerror({} as Event);
    }
  }

  close() {
    this.closeCalled = true;
    this.readyState = 3; // CLOSED
  }
}

beforeEach(() => {
  MockWebSocket.instances = [];
  vi.stubGlobal("WebSocket", MockWebSocket);
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
  MockWebSocket.instances = [];
});

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }
  return { wrapper: Wrapper, queryClient };
}

describe("useWebSocket", () => {
  it("does not create a connection when the URL is null", () => {
    const { wrapper } = makeWrapper();
    renderHook(() => useWebSocket(null), { wrapper });
    expect(MockWebSocket.instances).toHaveLength(0);
  });

  it("creates a WebSocket connection on mount", () => {
    const { wrapper } = makeWrapper();
    renderHook(() => useWebSocket("ws://localhost:3000/ws"), { wrapper });
    expect(MockWebSocket.instances).toHaveLength(1);
    expect(MockWebSocket.instances[0]?.url).toBe("ws://localhost:3000/ws");
  });

  it("updates sessionId and cache on CONNECTED message", () => {
    const { wrapper, queryClient } = makeWrapper();
    const { result } = renderHook(
      () => useWebSocket("ws://localhost:3000/ws"),
      { wrapper },
    );
    const ws = MockWebSocket.instances[0];
    expect(ws).toBeDefined();
    const state = { version: 1, tick: 0 };
    act(() => {
      ws?.simulateMessage({
        type: "CONNECTED",
        payload: { sessionId: "sess-123", state },
        ts: Date.now(),
      });
    });
    expect(result.current.sessionId).toBe("sess-123");
    expect(queryClient.getQueryData([...GAME_STATE_QUERY_KEY, "default"])).toEqual(state);
  });

  it("does not overwrite an existing cache entry with a stale CONNECTED snapshot", () => {
    const { wrapper, queryClient } = makeWrapper();
    queryClient.setQueryData([...GAME_STATE_QUERY_KEY, "default"], {
      version: 1,
      tick: 5,
      resources: { catnip: { value: 1, maxValue: 0 } },
    });

    renderHook(() => useWebSocket("ws://localhost:3000/ws"), { wrapper });

    const ws = MockWebSocket.instances[0];
    act(() => {
      ws?.simulateMessage({
        type: "CONNECTED",
        payload: {
          sessionId: "sess-123",
          state: {
            version: 1,
            tick: 5,
            resources: { catnip: { value: 0, maxValue: 0 } },
          },
        },
        ts: Date.now(),
      });
    });

    expect(queryClient.getQueryData([...GAME_STATE_QUERY_KEY, "default"])).toEqual({
      version: 1,
      tick: 5,
      resources: { catnip: { value: 1, maxValue: 0 } },
    });
  });

  it("updates query cache on STATE_DELTA message", () => {
    const { wrapper, queryClient } = makeWrapper();
    renderHook(() => useWebSocket("ws://localhost:3000/ws"), { wrapper });
    const ws = MockWebSocket.instances[0];
    const newState = { version: 1, tick: 55 };
    act(() => {
      ws?.simulateMessage({
        type: "STATE_DELTA",
        payload: newState,
        ts: Date.now(),
      });
    });
    expect(queryClient.getQueryData([...GAME_STATE_QUERY_KEY, "default"])).toEqual(newState);
  });

  it("updates the cache entry for the active slot", () => {
    const { wrapper, queryClient } = makeWrapper();
    renderHook(() => useWebSocket("ws://localhost:3000/ws?slot=save-2", "save-2"), { wrapper });
    const ws = MockWebSocket.instances[0];
    const newState = { version: 1, tick: 88 };
    act(() => {
      ws?.simulateMessage({
        type: "STATE_DELTA",
        payload: newState,
        ts: Date.now(),
      });
    });
    expect(queryClient.getQueryData([...GAME_STATE_QUERY_KEY, "save-2"])).toEqual(newState);
    expect(queryClient.getQueryData([...GAME_STATE_QUERY_KEY, "default"])).toBeUndefined();
  });

  it("schedules reconnect after 2s when connection closes", () => {
    const { wrapper } = makeWrapper();
    renderHook(() => useWebSocket("ws://localhost:3000/ws"), { wrapper });
    expect(MockWebSocket.instances).toHaveLength(1);
    act(() => {
      MockWebSocket.instances[0]?.simulateClose();
    });
    // Before 2s — no reconnect yet
    expect(MockWebSocket.instances).toHaveLength(1);
    // Advance timer by 2s
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(MockWebSocket.instances).toHaveLength(2);
  });

  it("closes WebSocket on unmount", () => {
    const { wrapper } = makeWrapper();
    const { unmount } = renderHook(
      () => useWebSocket("ws://localhost:3000/ws"),
      { wrapper },
    );
    const ws = MockWebSocket.instances[0];
    expect(ws).toBeDefined();
    unmount();
    expect(ws?.closeCalled).toBe(true);
  });

  it("does not reconnect after unmount", () => {
    const { wrapper } = makeWrapper();
    const { unmount } = renderHook(
      () => useWebSocket("ws://localhost:3000/ws"),
      { wrapper },
    );
    unmount();
    // Simulate close after unmount
    act(() => {
      MockWebSocket.instances[0]?.simulateClose();
      vi.advanceTimersByTime(2000);
    });
    // Should NOT create a second instance
    expect(MockWebSocket.instances).toHaveLength(1);
  });

  it("starts with an empty messages array", () => {
    const { wrapper } = makeWrapper();
    const { result } = renderHook(
      () => useWebSocket("ws://localhost:3000/ws"),
      { wrapper },
    );
    expect(result.current.messages).toEqual([]);
  });

  it("appends log messages on LOG_MESSAGE envelope", () => {
    const { wrapper } = makeWrapper();
    const { result } = renderHook(
      () => useWebSocket("ws://localhost:3000/ws"),
      { wrapper },
    );
    const ws = MockWebSocket.instances[0];
    act(() => {
      ws?.simulateMessage({ type: "LOG_MESSAGE", payload: "Hello world", ts: 1 });
    });
    expect(result.current.messages).toEqual(["Hello world"]);
  });

  it("supports legacy LOG_MESSAGE envelopes with object payloads", () => {
    const { wrapper } = makeWrapper();
    const { result } = renderHook(
      () => useWebSocket("ws://localhost:3000/ws"),
      { wrapper },
    );
    const ws = MockWebSocket.instances[0];
    act(() => {
      ws?.simulateMessage({
        type: "LOG_MESSAGE",
        payload: { message: "Legacy hello" },
        ts: 1,
      });
    });
    expect(result.current.messages).toEqual(["Legacy hello"]);
  });

  it("trims log messages to last 50 entries", () => {
    const { wrapper } = makeWrapper();
    const { result } = renderHook(
      () => useWebSocket("ws://localhost:3000/ws"),
      { wrapper },
    );
    const ws = MockWebSocket.instances[0];
    act(() => {
      for (let i = 0; i < 55; i++) {
        ws?.simulateMessage({ type: "LOG_MESSAGE", payload: `msg-${i}`, ts: i });
      }
    });
    expect(result.current.messages.length).toBe(50);
    expect(result.current.messages[0]).toBe("msg-5");
    expect(result.current.messages[49]).toBe("msg-54");
  });

  it("ignores malformed JSON messages", () => {
    const { wrapper, queryClient } = makeWrapper();
    renderHook(() => useWebSocket("ws://localhost:3000/ws"), { wrapper });
    const ws = MockWebSocket.instances[0];
    act(() => {
      if (ws?.onmessage) {
        ws.onmessage({ data: "not-valid-json{{{" } as MessageEvent);
      }
    });
    // Cache should remain empty — no crash
    expect(queryClient.getQueryData([...GAME_STATE_QUERY_KEY, "default"])).toBeUndefined();
  });

  it("closes and reconnects on error", () => {
    const { wrapper } = makeWrapper();
    renderHook(() => useWebSocket("ws://localhost:3000/ws"), { wrapper });
    const ws = MockWebSocket.instances[0];
    act(() => {
      ws?.simulateError();
      // onerror calls ws.close(), which triggers onclose
      ws?.simulateClose();
    });
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(MockWebSocket.instances).toHaveLength(2);
  });
});
