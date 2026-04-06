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

  it("listSlots returns all persisted slot names", () => {
    const adapter = createMemoryAdapter();
    adapter.saveSlot("slot1", '{"tick":1}');
    adapter.saveSlot("slot2", '{"tick":2}');
    expect(adapter.listSlots().sort()).toEqual(["slot1", "slot2"]);
  });

  it("exec is a no-op that does not throw", () => {
    const adapter = createMemoryAdapter();
    expect(() => adapter.exec("CREATE TABLE IF NOT EXISTS saves (...)")).not.toThrow();
  });
});

describe("SlotMeta and slot lifecycle methods", () => {
  it("listSlotMeta returns all slot metadata with status and timestamps", () => {
    const adapter = createMemoryAdapter();
    const before = Date.now();
    adapter.saveSlot("slot1", '{"tick":0}');
    const after = Date.now();

    const meta = adapter.listSlotMeta();
    expect(meta).toHaveLength(1);
    const firstMeta = meta[0];
    expect(firstMeta).toBeDefined();
    if (!firstMeta) return;
    expect(firstMeta).toEqual({
      slot: "slot1",
      status: "active",
      createdAt: expect.any(Number),
      updatedAt: expect.any(Number),
    });
    expect(firstMeta.createdAt).toBeGreaterThanOrEqual(before);
    expect(firstMeta.createdAt).toBeLessThanOrEqual(after);
    expect(firstMeta.updatedAt).toBeGreaterThanOrEqual(before);
    expect(firstMeta.updatedAt).toBeLessThanOrEqual(after);
  });

  it("listSlotMeta returns empty array when no slots exist", () => {
    const adapter = createMemoryAdapter();
    expect(adapter.listSlotMeta()).toEqual([]);
  });

  it("listSlotMeta returns all slots regardless of status", () => {
    const adapter = createMemoryAdapter();
    adapter.saveSlot("active1", '{"tick":0}');
    adapter.saveSlot("paused1", '{"tick":0}');
    adapter.saveSlot("archived1", '{"tick":0}');

    adapter.updateSlotStatus("paused1", "paused");
    adapter.updateSlotStatus("archived1", "archived");

    const meta = adapter.listSlotMeta();
    expect(meta).toHaveLength(3);
    const bySlot = new Map(meta.map(m => [m.slot, m]));
    expect(bySlot.get("active1")?.status).toBe("active");
    expect(bySlot.get("paused1")?.status).toBe("paused");
    expect(bySlot.get("archived1")?.status).toBe("archived");
  });

  it("getSlotMeta returns metadata for an existing slot", () => {
    const adapter = createMemoryAdapter();
    adapter.saveSlot("test", '{"tick":0}');

    const meta = adapter.getSlotMeta("test");
    expect(meta).not.toBeNull();
    expect(meta?.slot).toBe("test");
    expect(meta?.status).toBe("active");
    expect(typeof meta?.createdAt).toBe("number");
    expect(typeof meta?.updatedAt).toBe("number");
  });

  it("getSlotMeta returns null for a non-existent slot", () => {
    const adapter = createMemoryAdapter();
    expect(adapter.getSlotMeta("unknown")).toBeNull();
  });

  it("updateSlotStatus changes only the status, not the state_json", () => {
    const adapter = createMemoryAdapter();
    adapter.saveSlot("test", '{"tick":5}');
    const original = adapter.loadSlot("test");

    adapter.updateSlotStatus("test", "paused");

    const after = adapter.loadSlot("test");
    expect(after).toBe(original);
    expect(adapter.getSlotMeta("test")?.status).toBe("paused");
  });

  it("updateSlotStatus does not change createdAt when changing status", () => {
    const adapter = createMemoryAdapter();
    adapter.saveSlot("test", '{"tick":0}');
    const originalMeta = adapter.getSlotMeta("test")!;
    const originalCreatedAt = originalMeta.createdAt;

    adapter.updateSlotStatus("test", "paused");

    const newMeta = adapter.getSlotMeta("test")!;
    expect(newMeta.createdAt).toBe(originalCreatedAt);
  });

  it("updateSlotStatus updates updatedAt when changing status", async () => {
    const adapter = createMemoryAdapter();
    adapter.saveSlot("test", '{"tick":0}');
    const originalMeta = adapter.getSlotMeta("test")!;
    const originalUpdatedAt = originalMeta.updatedAt;

    // Small delay to ensure time has passed
    await new Promise(resolve => setTimeout(resolve, 10));
    adapter.updateSlotStatus("test", "paused");

    const newMeta = adapter.getSlotMeta("test")!;
    expect(newMeta.updatedAt).toBeGreaterThan(originalUpdatedAt);
  });

  it("deleteSlot removes a slot entirely", () => {
    const adapter = createMemoryAdapter();
    adapter.saveSlot("test", '{"tick":0}');
    expect(adapter.loadSlot("test")).not.toBeNull();

    adapter.deleteSlot("test");

    expect(adapter.loadSlot("test")).toBeNull();
    expect(adapter.getSlotMeta("test")).toBeNull();
  });

  it("deleteSlot does not error when slot does not exist", () => {
    const adapter = createMemoryAdapter();
    expect(() => adapter.deleteSlot("unknown")).not.toThrow();
  });

  it("saveSlot sets createdAt on first insert", () => {
    const adapter = createMemoryAdapter();
    const before = Date.now();

    adapter.saveSlot("test", '{"tick":0}');

    const after = Date.now();
    const meta = adapter.getSlotMeta("test")!;
    expect(meta.createdAt).toBeGreaterThanOrEqual(before);
    expect(meta.createdAt).toBeLessThanOrEqual(after);
  });

  it("saveSlot keeps createdAt unchanged on upsert", async () => {
    const adapter = createMemoryAdapter();
    adapter.saveSlot("test", '{"tick":0}');
    const originalMeta = adapter.getSlotMeta("test")!;
    const originalCreatedAt = originalMeta.createdAt;

    // Small delay and upsert
    await new Promise(resolve => setTimeout(resolve, 10));
    adapter.saveSlot("test", '{"tick":5}');

    const newMeta = adapter.getSlotMeta("test")!;
    expect(newMeta.createdAt).toBe(originalCreatedAt);
  });

  it("saveSlot updates updatedAt on upsert", async () => {
    const adapter = createMemoryAdapter();
    adapter.saveSlot("test", '{"tick":0}');
    const originalMeta = adapter.getSlotMeta("test")!;
    const originalUpdatedAt = originalMeta.updatedAt;

    // Small delay and upsert
    await new Promise(resolve => setTimeout(resolve, 10));
    adapter.saveSlot("test", '{"tick":5}');

    const newMeta = adapter.getSlotMeta("test")!;
    expect(newMeta.updatedAt).toBeGreaterThan(originalUpdatedAt);
  });
});
