import { QueryClient } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App, getWsUrl } from "./App.js";

// Mock fetch (for useGameState initial query)
const mockFetch = vi.fn();

// Mock WebSocket
class MockWebSocket {
  static instances: MockWebSocket[] = [];
  readonly url: string;
  onmessage: null = null;
  onclose: null = null;
  onerror: null = null;
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
    // state is pending → loading placeholder
    expect(screen.getByTestId("resource-panel-loading")).toBeTruthy();
  });

  it("renders ActionPanel with Gather Catnip button", () => {
    mockFetch.mockImplementation(() => new Promise(() => {}));
    render(<App queryClient={makeClient()} />);
    expect(screen.getByTestId("action-panel")).toBeTruthy();
    expect(screen.getByTestId("btn-gather-catnip")).toBeTruthy();
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
});
