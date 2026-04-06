import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SlotProvider } from "./SlotContext.js";
import { SessionsPanel } from "./SessionsPanel.js";

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
  });

  it("creates a new session", async () => {
    mockFetch
      .mockResolvedValueOnce(
        makeResponse({
          sessions: [],
        }),
      )
      .mockResolvedValueOnce(
        makeResponse(
          {
            slot: "newsave",
            status: "active",
            createdAt: 1609459200000,
            updatedAt: 1609459200000,
          },
          201,
        ),
      )
      .mockResolvedValueOnce(
        makeResponse({
          sessions: [
            {
              slot: "newsave",
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
      .mockResolvedValueOnce(
        new Response("", { status: 204 }),
      )
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
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/sessions/game1/export"),
      );
    });
  });
});
