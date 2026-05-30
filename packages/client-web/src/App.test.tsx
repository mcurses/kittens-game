import { QueryClient } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App, getRoute, getSlot, getWsUrl } from "./App.js";

// Mock fetch (for useGameState initial query)
const mockFetch = vi.fn();

// Mock WebSocket
class MockWebSocket {
  static instances: MockWebSocket[] = [];
  readonly url: string;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
  }
  close() {}
}

beforeEach(() => {
  MockWebSocket.instances = [];
  vi.stubGlobal("fetch", mockFetch);
  vi.stubGlobal("WebSocket", MockWebSocket);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  mockFetch.mockReset();
  MockWebSocket.instances = [];
});

function makeClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

describe("App", () => {
  it("renders without crashing", () => {
    mockFetch.mockImplementation(() => new Promise(() => {}));
    render(<App queryClient={makeClient()} />);
    expect(screen.getByText("Kittens Game")).toBeTruthy();
  });

  it("renders ResourcePanel", () => {
    mockFetch.mockImplementation(() => new Promise(() => {}));
    render(<App queryClient={makeClient()} />);
    expect(screen.getByTestId("resource-sidebar")).toBeTruthy();
    expect(screen.getByTestId("resource-panel-loading")).toBeTruthy();
  });

  it("renders ActionPanel with Gather Catnip and hides Hunt before archery", () => {
    mockFetch.mockImplementation(() => new Promise(() => {}));
    render(<App queryClient={makeClient()} />);
    expect(screen.getByTestId("action-panel")).toBeTruthy();
    expect(screen.getByTestId("btn-gather-catnip")).toBeTruthy();
    expect(screen.queryByTestId("btn-hunt")).toBeNull();
  });

  it("creates a WebSocket connection on mount", () => {
    const state = {
      version: 1,
      tick: 5,
      resources: {
        catnip: { value: 10, perTick: 0.5 },
      },
    };
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(state),
    } as unknown as Response);

    render(<App queryClient={makeClient()} />);

    return vi.waitFor(() => {
      // Single WS connection: useWebSocket handles both state and log messages
      expect(MockWebSocket.instances.length).toBeGreaterThanOrEqual(1);
      expect(MockWebSocket.instances[0]?.url).toMatch(/\/ws$/);
    });
  });

  it("does not create a WebSocket connection before state loads", () => {
    mockFetch.mockImplementation(() => new Promise(() => {}));
    render(<App queryClient={makeClient()} />);
    expect(MockWebSocket.instances).toHaveLength(0);
  });

  it("shows resource data after state loads", async () => {
    const state = {
      version: 1,
      tick: 5,
      resources: {
        catnip: { value: 10, perTick: 0.5 },
      },
    };
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(state),
    } as unknown as Response);
    render(<App queryClient={makeClient()} />);
    await vi.waitFor(() => {
      expect(screen.getByTestId("resource-sidebar")).toBeTruthy();
      expect(screen.getByTestId("resource-panel")).toBeTruthy();
      expect(screen.getByTestId("resource-catnip")).toBeTruthy();
    });
  });

  it("shows an error message when the initial state fetch fails", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({}),
    } as unknown as Response);

    render(<App queryClient={makeClient()} />);

    await vi.waitFor(() => {
      expect(screen.getByTestId("game-state-error")).toBeTruthy();
      expect(screen.getByText("Failed to fetch game state: 500")).toBeTruthy();
    });
  });

  it("renders without a queryClient prop (creates its own)", () => {
    mockFetch.mockImplementation(() => new Promise(() => {}));
    // Should not throw — App creates its own QueryClient internally
    render(<App />);
    expect(screen.getByText("Kittens Game")).toBeTruthy();
  });

  it("uses the backend WebSocket URL in local Vite development", () => {
    expect(
      getWsUrl(
        {
          protocol: "http:",
          host: "localhost:5173",
          hostname: "localhost",
          port: "5173",
        },
        true,
      ),
    ).toBe("ws://localhost:3000/ws");
  });

  it("renders the sessions panel at /sessions without loading game state", async () => {
    window.history.replaceState({}, "", "/sessions");

    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          sessions: [],
        }),
    } as unknown as Response);

    render(<App queryClient={makeClient()} />);

    await vi.waitFor(() => {
      expect(screen.getByText("Sessions")).toBeTruthy();
      expect(screen.getByText(/no sessions yet/i)).toBeTruthy();
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith("/api/sessions");
    expect(MockWebSocket.instances).toHaveLength(0);
    expect(screen.queryByText("Kittens Game")).toBeNull();
  });
});

describe("getRoute", () => {
  it("returns sessions for the sessions pathname", () => {
    expect(getRoute("/sessions")).toBe("sessions");
  });

  it("returns game for the root pathname", () => {
    expect(getRoute("/")).toBe("game");
  });

  it("returns game for unknown pathnames", () => {
    expect(getRoute("/nope")).toBe("game");
  });
});

describe("getSlot", () => {
  it("returns 'default' when no slot param", () => {
    expect(getSlot("")).toBe("default");
    expect(getSlot("?foo=bar")).toBe("default");
  });

  it("returns the slot name from URL search param", () => {
    expect(getSlot("?slot=mysave")).toBe("mysave");
    expect(getSlot("?slot=save-1")).toBe("save-1");
  });

  it("returns 'default' for invalid slot names", () => {
    expect(getSlot("?slot=../bad")).toBe("default");
    expect(getSlot("?slot=")).toBe("default");
    expect(getSlot("?slot=a".repeat(70))).toBe("default");
  });
});

describe("getWsUrl with slot", () => {
  it("includes slot param when slot is not default", () => {
    const url = getWsUrl(
      { protocol: "http:", host: "localhost:5173", hostname: "localhost", port: "5173" },
      true,
      "mysave",
    );
    expect(url).toBe("ws://localhost:3000/ws?slot=mysave");
  });

  it("omits slot param when slot is 'default'", () => {
    const url = getWsUrl(
      { protocol: "http:", host: "localhost:5173", hostname: "localhost", port: "5173" },
      true,
      "default",
    );
    expect(url).toBe("ws://localhost:3000/ws");
  });

  it("includes slot param in production URL", () => {
    const url = getWsUrl(
      { protocol: "https:", host: "mygame.com", hostname: "mygame.com", port: "" },
      false,
      "mysave",
    );
    expect(url).toBe("wss://mygame.com/ws?slot=mysave");
  });
});
