import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type React from "react";
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
    renderWithClient(
      <ActionPanel
        state={
          {
            resources: { catpower: { value: 250 } },
            science: { techs: { archery: { researched: true } } },
          } as never
        }
      />,
    );
    expect(screen.getByTestId("btn-gather-catnip")).toBeTruthy();
    expect(screen.getByText("Gather Catnip")).toBeTruthy();
    expect(screen.getByTestId("btn-hunt")).toBeTruthy();
    expect(screen.getByText(/Hunt/)).toBeTruthy();
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
          resources: { catpower: { value: 250 } },
          effectCache: {},
          science: { techs: { archery: { researched: true } } },
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
    expect((screen.getByTestId("btn-gather-catnip") as HTMLButtonElement).disabled).toBe(false);
    expect(screen.queryByTestId("btn-hunt")).toBeNull();
  });

  it("enables Hunt and shows squad count when enough catpower is available", () => {
    mockFetch.mockImplementation(() => new Promise(() => {}));
    renderWithClient(
      <ActionPanel
        state={{
          resources: { catpower: { value: 250 } },
          effectCache: {},
          science: { techs: { archery: { researched: true } } },
        }}
      />,
    );
    expect(screen.getByText("Hunt (2 squads)")).toBeTruthy();
    expect((screen.getByTestId("btn-hunt") as HTMLButtonElement).disabled).toBe(false);
  });

  it("hides Hunt until archery is researched", () => {
    mockFetch.mockImplementation(() => new Promise(() => {}));
    renderWithClient(
      <ActionPanel
        state={
          {
            resources: { catpower: { value: 250 } },
            effectCache: {},
          } as never
        }
      />,
    );
    expect(screen.queryByTestId("btn-hunt")).toBeNull();
  });

  it("shows hunt shortcuts when 2+ squads affordable", () => {
    mockFetch.mockImplementation(() => new Promise(() => {}));
    renderWithClient(
      <ActionPanel
        state={{
          resources: { catpower: { value: 1000 } },
          effectCache: {},
          science: { techs: { archery: { researched: true } } },
        }}
      />,
    );
    expect(screen.getByTestId("btn-hunt-half")).toBeTruthy();
    expect(screen.getByTestId("btn-hunt-fifth")).toBeTruthy();
  });

  it("hides hunt shortcuts when only 1 squad affordable", () => {
    mockFetch.mockImplementation(() => new Promise(() => {}));
    renderWithClient(
      <ActionPanel
        state={{
          resources: { catpower: { value: 100 } },
          effectCache: {},
          science: { techs: { archery: { researched: true } } },
        }}
      />,
    );
    expect(screen.queryByTestId("btn-hunt-half")).toBeNull();
    expect(screen.queryByTestId("btn-hunt-fifth")).toBeNull();
  });

  it("dispatches HUNT with half amount on ×½ click", async () => {
    const actionResult = { ok: true, state: { version: 1, tick: 1 } };
    mockFetch.mockResolvedValueOnce(makeResponse(actionResult, 200));
    renderWithClient(
      <ActionPanel
        state={{
          resources: { catpower: { value: 1000 } },
          effectCache: {},
          science: { techs: { archery: { researched: true } } },
        }}
      />,
    );
    fireEvent.click(screen.getByTestId("btn-hunt-half"));
    await vi.waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/game/action",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ type: "HUNT", amount: 5 }),
        }),
      );
    });
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
