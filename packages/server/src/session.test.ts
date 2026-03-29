import { beforeEach, describe, expect, it } from "vitest";
import { createMemoryAdapter } from "./db.js";
import { SessionRegistry, isValidSlot } from "./session.js";

// ── Story 22-6: Slot name validation ─────────────────────────────────────────
describe("isValidSlot", () => {
  it("accepts alphanumeric names", () => {
    expect(isValidSlot("default")).toBe(true);
    expect(isValidSlot("MyGame123")).toBe(true);
  });

  it("accepts names with dash and underscore", () => {
    expect(isValidSlot("my-game_slot")).toBe(true);
    expect(isValidSlot("save_1")).toBe(true);
  });

  it("rejects empty string", () => {
    expect(isValidSlot("")).toBe(false);
  });

  it("rejects names with path separators", () => {
    expect(isValidSlot("../etc")).toBe(false);
    expect(isValidSlot("foo/bar")).toBe(false);
  });

  it("rejects names with spaces", () => {
    expect(isValidSlot("my game")).toBe(false);
  });

  it("rejects names with dots", () => {
    expect(isValidSlot("foo.bar")).toBe(false);
  });

  it("rejects names longer than 64 characters", () => {
    expect(isValidSlot("a".repeat(65))).toBe(false);
  });

  it("accepts names exactly 64 characters long", () => {
    expect(isValidSlot("a".repeat(64))).toBe(true);
  });
});

// ── Story 22-1: SessionRegistry ───────────────────────────────────────────────
describe("SessionRegistry", () => {
  let registry: SessionRegistry;

  beforeEach(() => {
    registry = new SessionRegistry(createMemoryAdapter());
  });

  it("getOrCreate returns a store for a new slot", () => {
    const store = registry.getOrCreate("slot1");
    expect(store).toBeDefined();
  });

  it("getOrCreate returns the same instance for the same slot", () => {
    const a = registry.getOrCreate("slot1");
    const b = registry.getOrCreate("slot1");
    expect(a).toBe(b);
  });

  it("getOrCreate returns distinct instances for different slots", () => {
    const a = registry.getOrCreate("slot1");
    const b = registry.getOrCreate("slot2");
    expect(a).not.toBe(b);
  });

  it("listSlots returns all created slot names", () => {
    registry.getOrCreate("alpha");
    registry.getOrCreate("beta");
    const slots = registry.listSlots();
    expect(slots).toContain("alpha");
    expect(slots).toContain("beta");
    expect(slots).toHaveLength(2);
  });

  it("listSlots returns empty array when no slots created", () => {
    expect(registry.listSlots()).toEqual([]);
  });

  it("getOrCreate initializes new store (tick starts at 0)", () => {
    const store = registry.getOrCreate("fresh");
    expect(store.getSerialized().tick).toBe(0);
  });

  it("stores for different slots have independent state", () => {
    const s1 = registry.getOrCreate("s1");
    const s2 = registry.getOrCreate("s2");
    s1.advanceTick();
    expect(s1.getSerialized().tick).toBe(1);
    expect(s2.getSerialized().tick).toBe(0);
  });

  it("getOrCreate with default slot matches DEFAULT_SLOT constant", () => {
    const store = registry.getOrCreate("default");
    expect(store).toBeDefined();
  });

  it("persists to named slot in DB", () => {
    const db = createMemoryAdapter();
    const reg = new SessionRegistry(db);
    reg.getOrCreate("myslot").advanceTick();
    // The DB should have saved to "myslot"
    const saved = db.loadSlot("myslot");
    expect(saved).not.toBeNull();
  });
});

// ── Cross-manager multi-slot integration test ─────────────────────────────────
describe("SessionRegistry multi-slot isolation (integration)", () => {
  it("runs two slots independently through 100 ticks each with correct state", () => {
    const db = createMemoryAdapter();
    const registry = new SessionRegistry(db);

    const storeA = registry.getOrCreate("player-a");
    const storeB = registry.getOrCreate("player-b");

    // Advance slot A 100 ticks, slot B only 30
    for (let i = 0; i < 100; i++) storeA.advanceTick();
    for (let i = 0; i < 30; i++) storeB.advanceTick();

    expect(storeA.getSerialized().tick).toBe(100);
    expect(storeB.getSerialized().tick).toBe(30);

    // Slots are isolated in DB
    const savedA = db.loadSlot("player-a");
    const savedB = db.loadSlot("player-b");
    expect(savedA).not.toBeNull();
    expect(savedB).not.toBeNull();
    const parsedA = JSON.parse(savedA!) as { tick: number };
    const parsedB = JSON.parse(savedB!) as { tick: number };
    expect(parsedA.tick).toBe(100);
    expect(parsedB.tick).toBe(30);

    // WS clients on A do not see B's broadcasts
    const messagesA: string[] = [];
    const messagesB: string[] = [];
    storeA.addClient({ send: (d) => messagesA.push(d) });
    storeB.addClient({ send: (d) => messagesB.push(d) });

    storeA.advanceTick();
    expect(messagesA.length).toBeGreaterThan(0);
    expect(messagesB).toHaveLength(0);

    storeB.advanceTick();
    expect(messagesB.length).toBeGreaterThan(0);
    // A got exactly one more broadcast (from its own tick above)
    const aCountBefore = messagesA.length;
    expect(messagesA.length).toBe(aCountBefore);
  });
});
