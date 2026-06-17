import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SessionsPanel } from "./SessionsPanel.js";
import { SlotProvider } from "./SlotContext.js";

const mockFetch = vi.fn();

function makeResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("SessionsPanel", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { staleTime: 0, retry: 1 },
      },
    });
    vi.stubGlobal("fetch", mockFetch);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    mockFetch.mockReset();
  });

  it("renders sessions table with headers", async () => {
    mockFetch.mockResolvedValueOnce(
      makeResponse({
        sessions: [
          {
            slot: "game1",
            status: "active",
            createdAt: 1609459200000,
            updatedAt: 1609459200000,
          },
        ],
      }),
    );

    render(
      <QueryClientProvider client={queryClient}>
        <SlotProvider slot="default">
          <SessionsPanel />
        </SlotProvider>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("game1")).toBeDefined();
    });

    expect(screen.getByText("Sessions")).toBeDefined();
    expect(screen.getByText("Name")).toBeDefined();
    expect(screen.getByText("Status")).toBeDefined();
    expect(screen.getByText("Last Saved")).toBeDefined();
    expect(screen.getByText("Actions")).toBeDefined();
  });

  it("displays status symbols correctly", async () => {
    mockFetch.mockResolvedValueOnce(
      makeResponse({
        sessions: [
          {
            slot: "active-game",
            status: "active",
            createdAt: 1609459200000,
            updatedAt: 1609459200000,
          },
          {
            slot: "paused-game",
            status: "paused",
            createdAt: 1609459200000,
            updatedAt: 1609459200000,
          },
          {
            slot: "archived-game",
            status: "archived",
            createdAt: 1609459200000,
            updatedAt: 1609459200000,
          },
        ],
      }),
    );

    render(
      <QueryClientProvider client={queryClient}>
        <SlotProvider slot="default">
          <SessionsPanel />
        </SlotProvider>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("active-game")).toBeDefined();
    });

    // Check for status indicators (symbols)
    const rows = screen.getAllByRole("row");
    expect(rows.length).toBeGreaterThanOrEqual(3); // header + 3 sessions
    expect(screen.getByText("Active")).toBeDefined();
    expect(screen.getByText("Paused")).toBeDefined();
    fireEvent.click(screen.getByLabelText(/show archived/i));
    expect(screen.getByText("Archived")).toBeDefined();
  });

  it("sorts sessions by status priority then most recent last saved", async () => {
    mockFetch.mockResolvedValueOnce(
      makeResponse({
        sessions: [
          {
            slot: "archived-newer",
            status: "archived",
            createdAt: 1609459200000,
            updatedAt: 1609718400000,
          },
          {
            slot: "paused-newer",
            status: "paused",
            createdAt: 1609459200000,
            updatedAt: 1609804800000,
          },
          {
            slot: "active-older",
            status: "active",
            createdAt: 1609459200000,
            updatedAt: 1609545600000,
          },
          {
            slot: "active-newer",
            status: "active",
            createdAt: 1609459200000,
            updatedAt: 1609632000000,
          },
          {
            slot: "paused-older",
            status: "paused",
            createdAt: 1609459200000,
            updatedAt: 1609459200000,
          },
        ],
      }),
    );

    render(
      <QueryClientProvider client={queryClient}>
        <SlotProvider slot="default">
          <SessionsPanel />
        </SlotProvider>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("active-newer")).toBeDefined();
    });

    const rows = screen.getAllByRole("row").slice(1);
    const order = rows.map((row) => row.getAttribute("data-slot"));
    expect(order).toEqual(["active-newer", "active-older", "paused-newer", "paused-older"]);
  });

  it("hides archived sessions by default and reveals them when show archived is checked", async () => {
    mockFetch.mockResolvedValueOnce(
      makeResponse({
        sessions: [
          {
            slot: "active-game",
            status: "active",
            createdAt: 1609459200000,
            updatedAt: 1609459200000,
          },
          {
            slot: "archived-game",
            status: "archived",
            createdAt: 1609459200000,
            updatedAt: 1609545600000,
          },
        ],
      }),
    );

    render(
      <QueryClientProvider client={queryClient}>
        <SlotProvider slot="default">
          <SessionsPanel />
        </SlotProvider>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("active-game")).toBeDefined();
    });

    expect(screen.queryByText("archived-game")).toBeNull();

    const checkbox = screen.getByLabelText(/show archived/i);
    fireEvent.click(checkbox);

    expect(screen.getByText("archived-game")).toBeDefined();
  });

  it("creates a new session", async () => {
    // Two queries fire on mount: /api/sessions (table) and /api/demo-saves
    // (Load-demo dropdown). React-query order isn't deterministic, so use a
    // URL-dispatching mock instead of the strict mockResolvedValueOnce chain.
    let sessions: Array<{ slot: string; status: string; createdAt: number; updatedAt: number }> =
      [];
    mockFetch.mockImplementation(async (input: RequestInfo, init?: RequestInit) => {
      const url = typeof input === "string" ? input : (input as Request).url;
      if (url === "/api/sessions" && (!init || init.method !== "POST")) {
        return makeResponse({ sessions });
      }
      if (url === "/api/sessions" && init?.method === "POST") {
        const created = {
          slot: "newsave",
          status: "active" as const,
          createdAt: 1609459200000,
          updatedAt: 1609459200000,
        };
        sessions = [created];
        return makeResponse(created, 201);
      }
      if (url === "/api/demo-saves") return makeResponse({ ok: true, saves: [] });
      return makeResponse({}, 404);
    });

    render(
      <QueryClientProvider client={queryClient}>
        <SlotProvider slot="default">
          <SessionsPanel />
        </SlotProvider>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      const inputs = screen.getAllByPlaceholderText(/new session/i);
      expect(inputs.length).toBeGreaterThan(0);
    });

    const inputs = screen.getAllByPlaceholderText(/new session/i);
    const input = inputs[0] as HTMLInputElement;
    const createBtn = screen.getByText("Create");

    fireEvent.change(input, { target: { value: "newsave" } });
    fireEvent.click(createBtn);

    await waitFor(() => {
      expect(screen.getByText("newsave")).toBeDefined();
    });
  });

  it("rejects invalid slot names on create", async () => {
    mockFetch.mockResolvedValueOnce(
      makeResponse({
        sessions: [],
      }),
    );

    render(
      <QueryClientProvider client={queryClient}>
        <SlotProvider slot="default">
          <SessionsPanel />
        </SlotProvider>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      const inputs = screen.getAllByPlaceholderText(/new session/i);
      expect(inputs.length).toBeGreaterThan(0);
    });

    const inputs = screen.getAllByPlaceholderText(/new session/i);
    const input = inputs[0] as HTMLInputElement;
    const createBtn = screen.getByText("Create");

    fireEvent.change(input, { target: { value: "invalid name!" } });
    fireEvent.click(createBtn);

    await waitFor(() => {
      const errorText = screen.getByText(/alphanumeric/i);
      expect(errorText).toBeDefined();
    });
  });

  it("pauses a session", async () => {
    mockFetch
      .mockResolvedValueOnce(
        makeResponse({
          sessions: [
            {
              slot: "game1",
              status: "active",
              createdAt: 1609459200000,
              updatedAt: 1609459200000,
            },
          ],
        }),
      )
      .mockResolvedValueOnce(
        makeResponse({
          slot: "game1",
          status: "paused",
          createdAt: 1609459200000,
          updatedAt: 1609545600000,
        }),
      )
      .mockResolvedValueOnce(
        makeResponse({
          sessions: [
            {
              slot: "game1",
              status: "paused",
              createdAt: 1609459200000,
              updatedAt: 1609545600000,
            },
          ],
        }),
      );

    render(
      <QueryClientProvider client={queryClient}>
        <SlotProvider slot="default">
          <SessionsPanel />
        </SlotProvider>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      const cells = screen.getAllByText("game1");
      expect(cells.length).toBeGreaterThan(0);
    });

    const pauseBtn = screen.getByTitle(/pause/i);
    fireEvent.click(pauseBtn);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/sessions/game1/pause"),
        expect.any(Object),
      );
    });
  });

  it("resumes a paused session", async () => {
    mockFetch
      .mockResolvedValueOnce(
        makeResponse({
          sessions: [
            {
              slot: "game1",
              status: "paused",
              createdAt: 1609459200000,
              updatedAt: 1609545600000,
            },
          ],
        }),
      )
      .mockResolvedValueOnce(
        makeResponse({
          slot: "game1",
          status: "active",
          createdAt: 1609459200000,
          updatedAt: 1609545600000,
        }),
      )
      .mockResolvedValueOnce(
        makeResponse({
          sessions: [
            {
              slot: "game1",
              status: "active",
              createdAt: 1609459200000,
              updatedAt: 1609545600000,
            },
          ],
        }),
      );

    render(
      <QueryClientProvider client={queryClient}>
        <SlotProvider slot="default">
          <SessionsPanel />
        </SlotProvider>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      const cells = screen.getAllByText("game1");
      expect(cells.length).toBeGreaterThan(0);
    });

    const resumeBtn = screen.getByTitle(/resume/i);
    fireEvent.click(resumeBtn);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/sessions/game1/resume"),
        expect.any(Object),
      );
    });
  });

  it("archives a session with confirmation", async () => {
    mockFetch
      .mockResolvedValueOnce(
        makeResponse({
          sessions: [
            {
              slot: "game1",
              status: "active",
              createdAt: 1609459200000,
              updatedAt: 1609459200000,
            },
          ],
        }),
      )
      .mockResolvedValueOnce(
        makeResponse({
          slot: "game1",
          status: "archived",
          createdAt: 1609459200000,
          updatedAt: 1609459200000,
        }),
      )
      .mockResolvedValueOnce(
        makeResponse({
          sessions: [
            {
              slot: "game1",
              status: "archived",
              createdAt: 1609459200000,
              updatedAt: 1609459200000,
            },
          ],
        }),
      );

    render(
      <QueryClientProvider client={queryClient}>
        <SlotProvider slot="default">
          <SessionsPanel />
        </SlotProvider>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      const cells = screen.getAllByText("game1");
      expect(cells.length).toBeGreaterThan(0);
    });

    const archiveBtn = screen.getByTitle(/archive/i);
    fireEvent.click(archiveBtn);

    // Should show confirmation prompt
    await waitFor(() => {
      const confirmText = screen.getByText(/are you sure/i);
      expect(confirmText).toBeDefined();
    });
    expect(screen.getByText(/frozen and removed from the openable session list/i)).toBeDefined();
    expect(screen.getByText("You can still delete them later.")).toBeDefined();

    const confirmBtn = screen.getByText("Confirm");
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/sessions/game1/archive"),
        expect.any(Object),
      );
    });
  });

  it("deletes a session with confirmation", async () => {
    mockFetch
      .mockResolvedValueOnce(
        makeResponse({
          sessions: [
            {
              slot: "game1",
              status: "active",
              createdAt: 1609459200000,
              updatedAt: 1609459200000,
            },
          ],
        }),
      )
      .mockResolvedValueOnce(new Response("", { status: 204 }))
      .mockResolvedValueOnce(
        makeResponse({
          sessions: [],
        }),
      );

    render(
      <QueryClientProvider client={queryClient}>
        <SlotProvider slot="default">
          <SessionsPanel />
        </SlotProvider>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      const cells = screen.getAllByText("game1");
      expect(cells.length).toBeGreaterThan(0);
    });

    const deleteBtn = screen.getByTitle(/delete/i);
    fireEvent.click(deleteBtn);

    // Should show confirmation prompt
    await waitFor(() => {
      const confirmText = screen.getByText(/are you sure/i);
      expect(confirmText).toBeDefined();
    });

    const confirmBtn = screen.getByText("Confirm");
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/sessions/game1"),
        expect.objectContaining({ method: "DELETE" }),
      );
    });
  });

  it("exports a session", async () => {
    mockFetch
      .mockResolvedValueOnce(
        makeResponse({
          sessions: [
            {
              slot: "game1",
              status: "active",
              createdAt: 1609459200000,
              updatedAt: 1609459200000,
            },
          ],
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ version: 1, tick: 100 }), {
          headers: { "content-type": "text/plain" },
        }),
      );

    render(
      <QueryClientProvider client={queryClient}>
        <SlotProvider slot="default">
          <SessionsPanel />
        </SlotProvider>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      const cells = screen.getAllByText("game1");
      expect(cells.length).toBeGreaterThan(0);
    });

    const exportBtn = screen.getByTitle(/export/i);
    fireEvent.click(exportBtn);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("/api/sessions/game1/export"));
    });
  });

  it("applies a new speed multiplier via input + Apply", async () => {
    mockFetch
      .mockResolvedValueOnce(
        makeResponse({
          sessions: [
            {
              slot: "game1",
              status: "active",
              createdAt: 1609459200000,
              updatedAt: 1609459200000,
              multiplier: 1,
            },
          ],
        }),
      )
      .mockResolvedValueOnce(makeResponse({ slot: "game1", multiplier: 25 }))
      .mockResolvedValueOnce(
        makeResponse({
          sessions: [
            {
              slot: "game1",
              status: "active",
              createdAt: 1609459200000,
              updatedAt: 1609459200000,
              multiplier: 25,
            },
          ],
        }),
      );

    render(
      <QueryClientProvider client={queryClient}>
        <SlotProvider slot="default">
          <SessionsPanel />
        </SlotProvider>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("game1")).toBeDefined();
    });

    const input = screen.getByTestId("speed-input-game1") as HTMLInputElement;
    expect(input.value).toBe("1");
    fireEvent.change(input, { target: { value: "25" } });

    const applyBtn = screen.getByTestId("speed-apply-game1") as HTMLButtonElement;
    expect(applyBtn.disabled).toBe(false);
    fireEvent.click(applyBtn);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/sessions/game1/speed"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ multiplier: 25 }),
        }),
      );
    });
  });

  it("disables Apply when input is out of range or non-numeric", async () => {
    mockFetch.mockResolvedValueOnce(
      makeResponse({
        sessions: [
          {
            slot: "game1",
            status: "active",
            createdAt: 1609459200000,
            updatedAt: 1609459200000,
            multiplier: 1,
          },
        ],
      }),
    );

    render(
      <QueryClientProvider client={queryClient}>
        <SlotProvider slot="default">
          <SessionsPanel />
        </SlotProvider>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("game1")).toBeDefined();
    });

    const input = screen.getByTestId("speed-input-game1") as HTMLInputElement;
    const applyBtn = screen.getByTestId("speed-apply-game1") as HTMLButtonElement;

    // Out of range high
    fireEvent.change(input, { target: { value: "9999" } });
    expect(applyBtn.disabled).toBe(true);

    // Out of range low
    fireEvent.change(input, { target: { value: "0" } });
    expect(applyBtn.disabled).toBe(true);

    // Non-numeric
    fireEvent.change(input, { target: { value: "abc" } });
    expect(applyBtn.disabled).toBe(true);

    // Same as current (no change → still disabled)
    fireEvent.change(input, { target: { value: "1" } });
    expect(applyBtn.disabled).toBe(true);

    // Valid + dirty
    fireEvent.change(input, { target: { value: "10" } });
    expect(applyBtn.disabled).toBe(false);
  });

  it("hides the speed control for archived sessions", async () => {
    mockFetch.mockResolvedValueOnce(
      makeResponse({
        sessions: [
          {
            slot: "archived-game",
            status: "archived",
            createdAt: 1609459200000,
            updatedAt: 1609459200000,
            multiplier: 1,
          },
        ],
      }),
    );

    render(
      <QueryClientProvider client={queryClient}>
        <SlotProvider slot="default">
          <SessionsPanel />
        </SlotProvider>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/show archived/i)).toBeDefined();
    });

    fireEvent.click(screen.getByLabelText(/show archived/i));

    await waitFor(() => {
      expect(screen.getByText("archived-game")).toBeDefined();
    });

    expect(screen.queryByTestId("speed-input-archived-game")).toBeNull();
    expect(screen.queryByTestId("speed-apply-archived-game")).toBeNull();
  });

  it("opens a session by navigating to the game root with the slot query", async () => {
    window.history.replaceState({}, "", "/sessions");
    const assignSpy = vi.spyOn(window.location, "assign").mockImplementation(() => undefined);

    mockFetch.mockResolvedValueOnce(
      makeResponse({
        sessions: [
          {
            slot: "game1",
            status: "active",
            createdAt: 1609459200000,
            updatedAt: 1609459200000,
          },
        ],
      }),
    );

    render(
      <QueryClientProvider client={queryClient}>
        <SlotProvider slot="default">
          <SessionsPanel />
        </SlotProvider>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("game1")).toBeDefined();
    });

    fireEvent.click(screen.getByTitle(/open session/i));

    expect(assignSpy).toHaveBeenCalledWith("/?slot=game1");
  });
});
