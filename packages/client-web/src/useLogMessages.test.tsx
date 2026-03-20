import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, renderHook } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useLogMessages } from "./useLogMessages.js";

// Minimal WebSocket mock — same pattern as useWebSocket.test.tsx
class MockWebSocket {
  static instances: MockWebSocket[] = [];
  readonly url: string;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  closeCalled = false;

  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
  }

  simulateMessage(data: unknown) {
    if (this.onmessage) {
      this.onmessage({ data: JSON.stringify(data) } as MessageEvent);
    }
  }

  simulateClose() {
    if (this.onclose) this.onclose({} as CloseEvent);
  }

  close() {
    this.closeCalled = true;
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

describe("useLogMessages", () => {
  it("starts with an empty messages array", () => {
    const { wrapper } = makeWrapper();
    const { result } = renderHook(
      () => useLogMessages("ws://localhost:3000/ws"),
      { wrapper },
    );
    expect(result.current.messages).toEqual([]);
  });

  it("appends a message when LOG_MESSAGE is received", () => {
    const { wrapper } = makeWrapper();
    const { result } = renderHook(
      () => useLogMessages("ws://localhost:3000/ws"),
      { wrapper },
    );
    const ws = MockWebSocket.instances[0];
    act(() => {
      ws?.simulateMessage({ type: "LOG_MESSAGE", payload: "Hello world", ts: 1 });
    });
    expect(result.current.messages).toEqual(["Hello world"]);
  });

  it("appends multiple messages in order", () => {
    const { wrapper } = makeWrapper();
    const { result } = renderHook(
      () => useLogMessages("ws://localhost:3000/ws"),
      { wrapper },
    );
    const ws = MockWebSocket.instances[0];
    act(() => {
      ws?.simulateMessage({ type: "LOG_MESSAGE", payload: "first", ts: 1 });
      ws?.simulateMessage({ type: "LOG_MESSAGE", payload: "second", ts: 2 });
    });
    expect(result.current.messages).toEqual(["first", "second"]);
  });

  it("trims log to last 50 messages", () => {
    const { wrapper } = makeWrapper();
    const { result } = renderHook(
      () => useLogMessages("ws://localhost:3000/ws"),
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

  it("ignores non-LOG_MESSAGE ws events", () => {
    const { wrapper } = makeWrapper();
    const { result } = renderHook(
      () => useLogMessages("ws://localhost:3000/ws"),
      { wrapper },
    );
    const ws = MockWebSocket.instances[0];
    act(() => {
      ws?.simulateMessage({ type: "STATE_DELTA", payload: { tick: 1 }, ts: 1 });
    });
    expect(result.current.messages).toEqual([]);
  });
});
