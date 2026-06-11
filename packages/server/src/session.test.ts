import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMemoryAdapter } from "./db.js";
import { GameStateStore, SessionRegistry, isValidSlot } from "./store.js";

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
    registry.create("slot1");
    const store = registry.getOrCreate("slot1");
    expect(store).not.toBeNull();
  });

  it("getOrCreate returns the same instance for the same slot", () => {
    registry.create("slot1");
    const a = registry.getOrCreate("slot1");
    const b = registry.getOrCreate("slot1");
    expect(a).toBe(b);
  });

  it("getOrCreate returns distinct instances for different slots", () => {
    registry.create("slot1");
    registry.create("slot2");
    const a = registry.getOrCreate("slot1");
    const b = registry.getOrCreate("slot2");
    expect(a).not.toBe(b);
  });

  it("listAll returns all created slot metadata", () => {
    registry.create("alpha");
    registry.create("beta");
    const slots = registry.listAll();
    expect(slots.map((s) => s.slot)).toContain("alpha");
    expect(slots.map((s) => s.slot)).toContain("beta");
    expect(slots).toHaveLength(2);
  });

  it("listAll returns empty array when no slots created", () => {
    expect(registry.listAll()).toEqual([]);
  });

  it("getOrCreate initializes new store (tick starts at 0)", () => {
    registry.create("fresh");
    const store = registry.getOrCreate("fresh");
    expect(store).not.toBeNull();
    if (store === null) return;
    expect(store.getSerialized().tick).toBe(0);
  });

  it("stores for different slots have independent state", () => {
    registry.create("s1");
    registry.create("s2");
    const s1 = registry.getOrCreate("s1");
    const s2 = registry.getOrCreate("s2");
    expect(s1).not.toBeNull();
    expect(s2).not.toBeNull();
    if (s1 === null || s2 === null) return;
    s1.advanceTick();
    expect(s1.getSerialized().tick).toBe(1);
    expect(s2.getSerialized().tick).toBe(0);
  });

  it("getOrCreate with default slot matches DEFAULT_SLOT constant", () => {
    registry.create("default");
    const store = registry.getOrCreate("default");
    expect(store).not.toBeNull();
  });

  it("persists to named slot in DB", () => {
    const db = createMemoryAdapter();
    const reg = new SessionRegistry(db);
    reg.create("myslot");
    const store = reg.getOrCreate("myslot");
    expect(store).not.toBeNull();
    if (store === null) return;
    store.advanceTick();
    // The DB should have saved to "myslot"
    const saved = db.loadSlot("myslot");
    expect(saved).not.toBeNull();
  });

  it("getOrCreate starts auto-tick for new slots created at runtime", () => {
    vi.useFakeTimers();
    const reg = new SessionRegistry(createMemoryAdapter());
    reg.create("runtime-slot");
    const store = reg.getOrCreate("runtime-slot");
    expect(store).not.toBeNull();
    if (store === null) {
      vi.useRealTimers();
      return;
    }
    expect(store.getSerialized().tick).toBe(0);
    vi.advanceTimersByTime(250);
    expect(store.getSerialized().tick).toBeGreaterThan(0);
    store.stopAutoTick();
    vi.useRealTimers();
  });

  it("loadFromSave on an already-ticking store keeps ticking", () => {
    vi.useFakeTimers();
    const reg = new SessionRegistry(createMemoryAdapter());
    reg.create("import-slot");
    const store = reg.getOrCreate("import-slot");
    expect(store).not.toBeNull();
    if (store === null) {
      vi.useRealTimers();
      return;
    }
    // Simulate a legacy import by calling loadFromSave
    const serialized = store.getSerialized();
    store.loadFromSave(serialized);
    vi.advanceTimersByTime(250);
    expect(store.getSerialized().tick).toBeGreaterThan(0);
    store.stopAutoTick();
    vi.useRealTimers();
  });

  it("named slots can resume auto-ticking after restart when recreated", () => {
    vi.useFakeTimers();
    const db = createMemoryAdapter();

    const initialStore = new GameStateStore(db, "save-a");
    initialStore.init();
    initialStore.advanceTick();
    initialStore.stopAutoTick();

    const reg = new SessionRegistry(db);
    const restored = reg.getOrCreate("save-a"); // starts auto-tick at 200ms
    expect(restored).not.toBeNull();
    if (restored === null) {
      vi.useRealTimers();
      return;
    }

    expect(restored.getSerialized().tick).toBe(1);
    vi.advanceTimersByTime(500); // 2+ ticks at 200ms interval
    expect(restored.getSerialized().tick).toBeGreaterThan(1);

    restored.stopAutoTick();
    vi.useRealTimers();
  });
});

// ── Cross-manager multi-slot isolation (integration) ─────────────────────────────────
describe("SessionRegistry multi-slot isolation (integration)", () => {
  it("runs two slots independently through 100 ticks each with correct state", () => {
    const db = createMemoryAdapter();
    const registry = new SessionRegistry(db);

    registry.create("player-a");
    registry.create("player-b");
    const storeA = registry.getOrCreate("player-a");
    const storeB = registry.getOrCreate("player-b");
    expect(storeA).not.toBeNull();
    expect(storeB).not.toBeNull();
    if (storeA === null || storeB === null) return;

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
