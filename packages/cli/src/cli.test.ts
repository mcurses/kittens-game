import { describe, it, expect, beforeEach, vi } from "vitest";
import { createCli } from "./cli.js";

// Mock HTTP client
const createMockClient = () => ({
  get: vi.fn(),
  post: vi.fn(),
  delete: vi.fn(),
});

describe("CLI — sessions list", () => {
  let mockClient: ReturnType<typeof createMockClient>;

  beforeEach(() => {
    mockClient = createMockClient();
  });

  it("lists sessions in table format", async () => {
    mockClient.get.mockResolvedValue({
      sessions: [
        {
          slot: "game1",
          status: "active",
          createdAt: 1609459200000,
          updatedAt: 1609459200000,
        },
        {
          slot: "game2",
          status: "paused",
          createdAt: 1609545600000,
          updatedAt: 1609545600000,
        },
      ],
    });

    const cli = createCli(mockClient);
    const output = await cli.sessionsList(false);

    expect(mockClient.get).toHaveBeenCalledWith("/api/sessions");
    expect(output).toContain("game1");
    expect(output).toContain("game2");
    expect(output).toContain("active");
    expect(output).toContain("paused");
  });

  it("outputs JSON with --json flag", async () => {
    mockClient.get.mockResolvedValue({
      sessions: [
        {
          slot: "test",
          status: "active",
          createdAt: 1609459200000,
          updatedAt: 1609459200000,
        },
      ],
    });

    const cli = createCli(mockClient);
    const output = await cli.sessionsList(true);

    expect(mockClient.get).toHaveBeenCalledWith("/api/sessions");
    const parsed = JSON.parse(output);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0].slot).toBe("test");
  });
});

describe("CLI — sessions create", () => {
  let mockClient: ReturnType<typeof createMockClient>;

  beforeEach(() => {
    mockClient = createMockClient();
  });

  it("creates a new session", async () => {
    mockClient.post.mockResolvedValue({
      slot: "newsave",
      status: "active",
      createdAt: 1609459200000,
      updatedAt: 1609459200000,
    });

    const cli = createCli(mockClient);
    const output = await cli.sessionsCreate("newsave");

    expect(mockClient.post).toHaveBeenCalledWith("/api/sessions", {
      slot: "newsave",
    });
    expect(output).toContain("newsave");
    expect(output).toContain("created");
  });

  it("throws on invalid slot name", async () => {
    const cli = createCli(mockClient);

    await expect(cli.sessionsCreate("invalid name")).rejects.toThrow(
      /invalid slot name/i
    );
  });
});

describe("CLI — sessions pause", () => {
  let mockClient: ReturnType<typeof createMockClient>;

  beforeEach(() => {
    mockClient = createMockClient();
  });

  it("pauses a session", async () => {
    mockClient.post.mockResolvedValue({
      slot: "game1",
      status: "paused",
      createdAt: 1609459200000,
      updatedAt: 1609545600000,
    });

    const cli = createCli(mockClient);
    const output = await cli.sessionsPause("game1");

    expect(mockClient.post).toHaveBeenCalledWith("/api/sessions/game1/pause");
    expect(output).toContain("game1");
    expect(output).toContain("paused");
  });
});

describe("CLI — sessions resume", () => {
  let mockClient: ReturnType<typeof createMockClient>;

  beforeEach(() => {
    mockClient = createMockClient();
  });

  it("resumes a session", async () => {
    mockClient.post.mockResolvedValue({
      slot: "game1",
      status: "active",
      createdAt: 1609459200000,
      updatedAt: 1609545600000,
    });

    const cli = createCli(mockClient);
    const output = await cli.sessionsResume("game1");

    expect(mockClient.post).toHaveBeenCalledWith("/api/sessions/game1/resume");
    expect(output).toContain("game1");
    expect(output).toContain("resumed");
  });
});

describe("CLI — sessions archive", () => {
  let mockClient: ReturnType<typeof createMockClient>;

  beforeEach(() => {
    mockClient = createMockClient();
  });

  it("archives a session", async () => {
    mockClient.post.mockResolvedValue({
      slot: "game1",
      status: "archived",
      createdAt: 1609459200000,
      updatedAt: 1609545600000,
    });

    const cli = createCli(mockClient);
    const output = await cli.sessionsArchive("game1");

    expect(mockClient.post).toHaveBeenCalledWith("/api/sessions/game1/archive");
    expect(output).toContain("game1");
    expect(output).toContain("archived");
  });
});

describe("CLI — sessions delete", () => {
  let mockClient: ReturnType<typeof createMockClient>;

  beforeEach(() => {
    mockClient = createMockClient();
  });

  it("deletes a session", async () => {
    mockClient.delete.mockResolvedValue({});

    const cli = createCli(mockClient);
    const output = await cli.sessionsDelete("game1");

    expect(mockClient.delete).toHaveBeenCalledWith("/api/sessions/game1");
    expect(output).toContain("game1");
    expect(output).toContain("deleted");
  });
});

describe("CLI — sessions export", () => {
  let mockClient: ReturnType<typeof createMockClient>;

  beforeEach(() => {
    mockClient = createMockClient();
  });

  it("exports a session", async () => {
    const stateJson = JSON.stringify({ version: 1, tick: 100 });
    mockClient.get.mockResolvedValue(stateJson);

    const cli = createCli(mockClient);
    const output = await cli.sessionsExport("game1", undefined);

    expect(mockClient.get).toHaveBeenCalledWith("/api/sessions/game1/export");
    expect(output).toContain("game1.json");
    expect(output).toContain("bytes");
  });

  it("exports to custom file with --output", async () => {
    const stateJson = JSON.stringify({ version: 1, tick: 100 });
    mockClient.get.mockResolvedValue(stateJson);

    const cli = createCli(mockClient);
    const output = await cli.sessionsExport("game1", "myfile.json");

    expect(mockClient.get).toHaveBeenCalledWith("/api/sessions/game1/export");
    expect(output).toContain("myfile.json");
    expect(output).toContain("bytes");
  });
});
