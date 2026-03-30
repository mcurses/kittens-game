import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ActionPanel } from "./ActionPanel.js";
import { SlotProvider } from "./SlotContext.js";

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

function renderWithClient(ui: React.ReactElement, slot = "default") {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <SlotProvider slot={slot}>{ui}</SlotProvider>
    </QueryClientProvider>,
  );
}

describe("ActionPanel", () => {
  it("renders the Gather Catnip and Hunt buttons", () => {
    mockFetch.mockImplementation(() => new Promise(() => {}));
    renderWithClient(<ActionPanel />);
    expect(screen.getByTestId("btn-gather-catnip")).toBeTruthy();
    expect(screen.getByText("Gather Catnip")).toBeTruthy();
    expect(screen.getByTestId("btn-hunt")).toBeTruthy();
    expect(screen.getByText("Hunt")).toBeTruthy();
  });

  it("calls mutate with GATHER_CATNIP when button clicked", async () => {
    const actionResult = { ok: true, state: { version: 1, tick: 1 } };
    mockFetch.mockResolvedValueOnce(makeResponse(actionResult, 200));
    renderWithClient(<ActionPanel />);
    fireEvent.click(screen.getByTestId("btn-gather-catnip"));
    await vi.waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/game/action",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ type: "GATHER_CATNIP" }),
        }),
      );
    });
  });

  it("calls mutate with HUNT when hunt button clicked", async () => {
    const actionResult = { ok: true, state: { version: 1, tick: 1 } };
    mockFetch.mockResolvedValueOnce(makeResponse(actionResult, 200));
    renderWithClient(
      <ActionPanel
        state={{
          resources: { manpower: { value: 250 } },
          effectCache: {},
        }}
      />,
    );
    fireEvent.click(screen.getByTestId("btn-hunt"));
    await vi.waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/game/action",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ type: "HUNT" }),
        }),
      );
    });
  });

  it("includes the current slot when dispatching actions", async () => {
    const actionResult = { ok: true, state: { version: 1, tick: 1 } };
    mockFetch.mockResolvedValueOnce(makeResponse(actionResult, 200));
    renderWithClient(<ActionPanel />, "mysave");
    fireEvent.click(screen.getByTestId("btn-gather-catnip"));
    await vi.waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/game/action?slot=mysave",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ type: "GATHER_CATNIP" }),
        }),
      );
    });
  });

  it("button is enabled when not pending", () => {
    mockFetch.mockImplementation(() => new Promise(() => {}));
    renderWithClient(<ActionPanel />);
    // Before clicking — not pending
    expect(
      (screen.getByTestId("btn-gather-catnip") as HTMLButtonElement).disabled,
    ).toBe(false);
    expect((screen.getByTestId("btn-hunt") as HTMLButtonElement).disabled).toBe(true);
  });

  it("enables Hunt and shows squad count when enough manpower is available", () => {
    mockFetch.mockImplementation(() => new Promise(() => {}));
    renderWithClient(
      <ActionPanel
        state={{
          resources: { manpower: { value: 250 } },
          effectCache: {},
        }}
      />,
    );
    expect(screen.getByText("Hunt (2 squads)")).toBeTruthy();
    expect((screen.getByTestId("btn-hunt") as HTMLButtonElement).disabled).toBe(false);
  });

  it("shows error message when mutation fails", async () => {
    // Simulate a network error
    mockFetch.mockRejectedValueOnce(new Error("Network error"));
    renderWithClient(<ActionPanel />);
    fireEvent.click(screen.getByTestId("btn-gather-catnip"));
    // Wait for error to appear
    await vi.waitFor(() => {
      expect(screen.getByTestId("action-error")).toBeTruthy();
    });
  });
});
