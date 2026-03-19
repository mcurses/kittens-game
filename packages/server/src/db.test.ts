import { describe, expect, it } from "vitest";
import { createMemoryAdapter } from "./db.js";

describe("createMemoryAdapter", () => {
  it("loadSlot returns null when no save exists", () => {
    const adapter = createMemoryAdapter();
    expect(adapter.loadSlot("default")).toBeNull();
  });

  it("saveSlot then loadSlot returns the saved value", () => {
    const adapter = createMemoryAdapter();
    adapter.saveSlot("default", '{"tick":0}');
    expect(adapter.loadSlot("default")).toBe('{"tick":0}');
  });

  it("saveSlot upserts on repeated calls", () => {
    const adapter = createMemoryAdapter();
    adapter.saveSlot("default", '{"tick":0}');
    adapter.saveSlot("default", '{"tick":5}');
    expect(adapter.loadSlot("default")).toBe('{"tick":5}');
  });

  it("handles multiple slots independently", () => {
    const adapter = createMemoryAdapter();
    adapter.saveSlot("slot1", '{"tick":1}');
    adapter.saveSlot("slot2", '{"tick":2}');
    expect(adapter.loadSlot("slot1")).toBe('{"tick":1}');
    expect(adapter.loadSlot("slot2")).toBe('{"tick":2}');
  });

  it("exec is a no-op that does not throw", () => {
    const adapter = createMemoryAdapter();
    expect(() => adapter.exec("CREATE TABLE IF NOT EXISTS saves (...)")).not.toThrow();
  });
});
