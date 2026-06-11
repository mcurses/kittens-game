import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ImportSavePanel } from "./ImportSavePanel.js";
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

function renderPanel(slot = "default") {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const onClose = vi.fn();
  render(
    <QueryClientProvider client={queryClient}>
      <SlotProvider slot={slot}>
        <ImportSavePanel onClose={onClose} />
      </SlotProvider>
    </QueryClientProvider>,
  );
  return { queryClient, onClose };
}

describe("ImportSavePanel", () => {
  it("renders the textarea, file input, and submit button", () => {
    mockFetch.mockImplementation(() => new Promise(() => {}));
    renderPanel();
    expect(screen.getByTestId("import-save-input")).toBeTruthy();
    expect(screen.getByTestId("import-save-file")).toBeTruthy();
    expect(screen.getByTestId("import-save-btn")).toBeTruthy();
  });

  it("submit button is disabled when textarea is empty", () => {
    mockFetch.mockImplementation(() => new Promise(() => {}));
    renderPanel();
    const btn = screen.getByTestId("import-save-btn") as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it("submit button is enabled after typing in textarea", () => {
    mockFetch.mockImplementation(() => new Promise(() => {}));
    renderPanel();
    const textarea = screen.getByTestId("import-save-input");
    fireEvent.change(textarea, { target: { value: '{"saveVersion":15}' } });
    const btn = screen.getByTestId("import-save-btn") as HTMLButtonElement;
    expect(btn.disabled).toBe(false);
  });

  it("calls POST /api/game/import-legacy with the textarea value on submit", async () => {
    const fakeState = { version: 1, tick: 0, calendar: { year: 5 } };
    mockFetch.mockResolvedValueOnce(makeResponse(fakeState, 200));

    renderPanel();
    fireEvent.change(screen.getByTestId("import-save-input"), {
      target: { value: '{"saveVersion":15}' },
    });
    fireEvent.click(screen.getByTestId("import-save-btn"));

    await waitFor(() => expect(mockFetch).toHaveBeenCalledOnce());
    const [url, opts] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/game/import-legacy");
    expect(JSON.parse(opts.body as string)).toEqual({ data: '{"saveVersion":15}' });
  });

  it("shows success message after successful import", async () => {
    const fakeState = { version: 1, tick: 0 };
    mockFetch.mockResolvedValueOnce(makeResponse(fakeState, 200));

    renderPanel();
    fireEvent.change(screen.getByTestId("import-save-input"), {
      target: { value: '{"saveVersion":15}' },
    });
    fireEvent.click(screen.getByTestId("import-save-btn"));

    await waitFor(() => expect(screen.getByTestId("import-save-success")).toBeTruthy());
    expect(screen.queryByTestId("import-save-error")).toBeNull();
  });

  it("shows error message when import fails", async () => {
    mockFetch.mockResolvedValueOnce(makeResponse({ error: "Failed to decompress save data" }, 400));

    renderPanel();
    fireEvent.change(screen.getByTestId("import-save-input"), {
      target: { value: "garbagedatastring" },
    });
    fireEvent.click(screen.getByTestId("import-save-btn"));

    await waitFor(() => expect(screen.getByTestId("import-save-error")).toBeTruthy());
    expect(screen.getByTestId("import-save-error").textContent).toContain("decompress");
    expect(screen.queryByTestId("import-save-success")).toBeNull();
  });

  it("file upload populates the textarea", async () => {
    mockFetch.mockImplementation(() => new Promise(() => {}));
    renderPanel();

    const fileInput = screen.getByTestId("import-save-file") as HTMLInputElement;
    const file = new File(['{"saveVersion":15}'], "save.txt", { type: "text/plain" });
    Object.defineProperty(file, "text", {
      value: () => Promise.resolve('{"saveVersion":15}'),
    });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      const textarea = screen.getByTestId("import-save-input") as HTMLTextAreaElement;
      expect(textarea.value).toBe('{"saveVersion":15}');
    });
  });

  it("clears the textarea after a successful import", async () => {
    const fakeState = { version: 1, tick: 0 };
    mockFetch.mockResolvedValueOnce(makeResponse(fakeState, 200));

    renderPanel();
    fireEvent.change(screen.getByTestId("import-save-input"), {
      target: { value: '{"saveVersion":15}' },
    });
    fireEvent.click(screen.getByTestId("import-save-btn"));

    await waitFor(() => screen.getByTestId("import-save-success"));
    const textarea = screen.getByTestId("import-save-input") as HTMLTextAreaElement;
    expect(textarea.value).toBe("");
  });
});
