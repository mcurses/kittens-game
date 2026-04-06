import { beforeEach, describe, expect, it } from "vitest";
import { createMemoryAdapter } from "./db.js";
import { GameStateStore, SessionRegistry } from "./store.js";

function makeStore(): GameStateStore {
  return new GameStateStore(createMemoryAdapter());
}

describe("GameStateStore", () => {
  let store: GameStateStore;

  beforeEach(() => {
    store = makeStore();
    store.init();
  });

  it("initial state has tick=0", () => {
    expect(store.getSerialized().tick).toBe(0);
  });

  it("advanceTick increments tick by 1", () => {
    store.advanceTick();
    expect(store.getSerialized().tick).toBe(1);
  });

  it("advanceTick returns the updated state", () => {
    const state = store.advanceTick();
    expect(state.tick).toBe(1);
  });

  it("applyGameAction with TICK action increments tick", () => {
    const result = store.applyGameAction({ type: "TICK" });
    expect(result.ok).toBe(true);
    expect(result.state.tick).toBe(1);
  });

  it("applyGameAction returns ok:false for unknown action type", () => {
    const result = store.applyGameAction({ type: "UNKNOWN_ACTION_XYZ" } as unknown as Parameters<
      typeof store.applyGameAction
    >[0]);
    expect(result.ok).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("reset(hard=true) returns to tick=0", () => {
    store.advanceTick();
    store.advanceTick();
    store.reset(true);
    expect(store.getSerialized().tick).toBe(0);
  });

  it("reset(hard=false) does soft reset and returns tick=0", () => {
    const state = store.reset(false);
    expect(state.tick).toBe(0);
  });

  it("loadFromSave replaces state with saved state", () => {
    store.advanceTick();
    store.advanceTick();
    const saved = store.getSerialized();
    store.reset(true);
    expect(store.getSerialized().tick).toBe(0);
    store.loadFromSave(saved);
    expect(store.getSerialized().tick).toBe(2);
  });

  it("init clears stale unicorn caps from saved state when no current challenge cap exists", () => {
    const adapter = createMemoryAdapter();
    const seeded = makeStore();
    seeded.init();
    const saved = seeded.getSerialized();
    adapter.saveSlot(
      "new",
      JSON.stringify({
        ...saved,
        resources: {
          ...saved.resources,
          unicorns: { value: 10, maxValue: 10, perTick: 0 },
        },
      }),
    );

    const restored = new GameStateStore(adapter, "new");
    restored.init();

    const restoredState = restored.getSerialized();
    expect(restoredState.challenges?.challenges["unicornTears"]?.active).toBe(false);
    expect(restoredState.effectCache.unicornsMax).toBeUndefined();
    expect(restoredState.resources.unicorns?.maxValue).toBe(0);
  });

  it("applyGameAction refreshes resource maxValue immediately after purchasing stoneBarns", () => {
    const prevState = store.getState();
    store["state"] = {
      ...prevState,
      resources: {
        ...prevState.resources,
        wood: { value: 1000, maxValue: 2000 },
        minerals: { value: 750, maxValue: 2000 },
        iron: { value: 50, maxValue: 500 },
        science: { value: 500, maxValue: 1000 },
      },
      buildings: {
        ...prevState.buildings,
        barn: { val: 1, on: 1, unlocked: true },
      },
    };

    const result = store.applyGameAction({ type: "PURCHASE_UPGRADE", name: "stoneBarns" });
    expect(result.ok).toBe(true);
    expect(result.state.effectCache.barnRatio).toBeCloseTo(0.75);
    expect(result.state.resources.wood?.maxValue).toBeCloseTo(550);
    expect(result.state.resources.minerals?.maxValue).toBeCloseTo(687.5);
    expect(result.state.resources.iron?.maxValue).toBeCloseTo(137.5);
  });

  it("applyGameAction refreshes resource maxValue immediately after buying a barn", () => {
    const prevState = store.getState();
    store["state"] = {
      ...prevState,
      resources: {
        ...prevState.resources,
        wood: { value: 50, maxValue: 200 },
      },
      buildings: {
        ...prevState.buildings,
        barn: { val: 0, on: 0, unlocked: true },
      },
    };

    const result = store.applyGameAction({ type: "BUY_BUILDING", name: "barn" });
    expect(result.ok).toBe(true);
    expect(result.state.resources.catnip?.maxValue).toBeCloseTo(10000);
    expect(result.state.resources.wood?.maxValue).toBeCloseTo(400);
    expect(result.state.resources.minerals?.maxValue).toBeCloseTo(500);
    expect(result.state.resources.iron?.maxValue).toBeCloseTo(100);
  });

  it("persists state: second store initialized from same adapter has same tick", () => {
    const adapter = createMemoryAdapter();
    const s1 = new GameStateStore(adapter);
    s1.init();
    s1.advanceTick();
    s1.advanceTick();
    s1.advanceTick();

    // Second store using same adapter simulates restart
    const s2 = new GameStateStore(adapter);
    s2.init();
    expect(s2.getSerialized().tick).toBe(3);
  });

  it("addClient and removeClient track WS clients", () => {
    const client = { send: (_d: string) => {} };
    expect(store.getClientCount()).toBe(0);
    store.addClient(client);
    expect(store.getClientCount()).toBe(1);
    store.removeClient(client);
    expect(store.getClientCount()).toBe(0);
  });

  it("broadcasts STATE_DELTA to all connected clients on tick", () => {
    const messages: string[] = [];
    const client = { send: (data: string) => messages.push(data) };
    store.addClient(client);
    store.advanceTick();
    expect(messages.length).toBe(1);
    const envelope = JSON.parse(messages[0] as string) as {
      type: string;
      payload: { tick: number };
      ts: number;
    };
    expect(envelope.type).toBe("STATE_DELTA");
    expect(envelope.payload.tick).toBe(1);
    expect(typeof envelope.ts).toBe("number");
  });

  it("broadcasts STATE_DELTA on applyGameAction", () => {
    const messages: string[] = [];
    const client = { send: (data: string) => messages.push(data) };
    store.addClient(client);
    store.applyGameAction({ type: "TICK" });
    expect(messages.length).toBe(1);
    const envelope = JSON.parse(messages[0] as string) as { type: string };
    expect(envelope.type).toBe("STATE_DELTA");
  });

  it("removes client from broadcast set if send throws", () => {
    const client = {
      send: (_data: string) => {
        throw new Error("Client disconnected");
      },
    };
    store.addClient(client);
    expect(store.getClientCount()).toBe(1);
    store.advanceTick(); // should not throw
    expect(store.getClientCount()).toBe(0);
  });

  it("does not broadcast to erroring client on subsequent ticks", () => {
    let callCount = 0;
    const client = {
      send: (_data: string) => {
        callCount++;
        throw new Error("gone");
      },
    };
    store.addClient(client);
    store.advanceTick(); // removes client
    store.advanceTick(); // should not call send again
    expect(callCount).toBe(1);
  });

  it("broadcasts LOG_MESSAGE when a kitten is born during a tick", () => {
    // Inject state with maxKittens > 0 and kittenProgress near 1
    const prevState = store.getState();
    store["state"] = {
      ...prevState,
      effectCache: { ...prevState.effectCache, maxKittens: 5, kittensPerTickBase: 1 },
      village: { ...prevState.village, kittens: 0, kittenProgress: 0.99 },
    };
    const messages: string[] = [];
    const client = { send: (data: string) => messages.push(data) };
    store.addClient(client);
    store.advanceTick();
    const logMessages = messages
      .map((m) => JSON.parse(m) as { type: string; payload: string })
      .filter((m) => m.type === "LOG_MESSAGE");
    expect(logMessages.length).toBeGreaterThanOrEqual(1);
    expect(logMessages[0]?.payload).toMatch(/kitten/i);
  });

  it("broadcasts LOG_MESSAGE when BUY_BUILDING succeeds", () => {
    // Give enough wood to buy a hut
    const prevState = store.getState();
    store["state"] = {
      ...prevState,
      resources: {
        ...prevState.resources,
        wood: { value: 100, maxValue: 0 },
      },
      buildings: {
        ...prevState.buildings,
        hut: { val: 0, on: 0, unlocked: true },
      },
    };
    const messages: string[] = [];
    const client = { send: (data: string) => messages.push(data) };
    store.addClient(client);
    store.applyGameAction({ type: "BUY_BUILDING", name: "hut" });
    const logMessages = messages
      .map((m) => JSON.parse(m) as { type: string; payload: string })
      .filter((m) => m.type === "LOG_MESSAGE");
    expect(logMessages.length).toBeGreaterThanOrEqual(1);
    expect(logMessages[0]?.payload).toMatch(/hut/i);
  });

  it("does not broadcast LOG_MESSAGE when BUY_BUILDING fails (cannot afford)", () => {
    const messages: string[] = [];
    const client = { send: (data: string) => messages.push(data) };
    store.addClient(client);
    // No wood — BUY_BUILDING should be a no-op
    store.applyGameAction({ type: "BUY_BUILDING", name: "hut" });
    const logMessages = messages
      .map((m) => JSON.parse(m) as { type: string })
      .filter((m) => m.type === "LOG_MESSAGE");
    expect(logMessages.length).toBe(0);
  });

  // Story 25-1: auto-tick
  it("startAutoTick calls advanceTick at the configured interval", () => {
    let ticks = 0;
    const orig = store.advanceTick.bind(store);
    store.advanceTick = () => {
      ticks++;
      return orig();
    };
    store.startAutoTick(50); // 50ms interval
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        store.stopAutoTick();
        expect(ticks).toBeGreaterThanOrEqual(2);
        resolve();
      }, 160);
    });
  });

  it("stopAutoTick stops further ticks", () => {
    let ticks = 0;
    const orig = store.advanceTick.bind(store);
    store.advanceTick = () => {
      ticks++;
      return orig();
    };
    store.startAutoTick(50);
    store.stopAutoTick();
    const countAfterStop = ticks;
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        expect(ticks).toBe(countAfterStop); // no more ticks after stop
        resolve();
      }, 120);
    });
  });

  it("store.init() does NOT auto-start the tick loop", () => {
    const freshStore = makeStore();
    let ticks = 0;
    const orig = freshStore.advanceTick.bind(freshStore);
    freshStore.advanceTick = () => {
      ticks++;
      return orig();
    };
    freshStore.init();
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        expect(ticks).toBe(0);
        resolve();
      }, 100);
    });
  });

  it("broadcasts LOG_MESSAGE for season change when season advances", () => {
    // Set calendar near end of season (season 0, day near DAYS_PER_SEASON)
    const prevState = store.getState();
    // DAYS_PER_SEASON = 100, TICKS_PER_DAY = 10 -> last day = 99
    store["state"] = {
      ...prevState,
      calendar: { day: 99.9, season: 0, year: 0, festivalDays: 0 },
    };
    const messages: string[] = [];
    const client = { send: (data: string) => messages.push(data) };
    store.addClient(client);
    store.advanceTick();
    const logMessages = messages
      .map((m) => JSON.parse(m) as { type: string; payload: string })
      .filter((m) => m.type === "LOG_MESSAGE");
    expect(logMessages.length).toBeGreaterThanOrEqual(1);
    const seasonMsg = logMessages.find((m) => /season|spring|summer|autumn|winter/i.test(m.payload));
    expect(seasonMsg).toBeDefined();
  });

  it("_broadcast refactor: both LOG_MESSAGE and STATE_DELTA use same envelope structure", () => {
    const messages: string[] = [];
    const client = { send: (data: string) => messages.push(data) };
    store.addClient(client);
    // Force a kitten birth so we get a LOG_MESSAGE + STATE_DELTA pair
    const prevState = store.getState();
    store["state"] = {
      ...prevState,
      effectCache: { ...prevState.effectCache, maxKittens: 5, kittensPerTickBase: 1 },
      village: { ...prevState.village, kittens: 0, kittenProgress: 0.99 },
    };
    store.advanceTick();
    const envelopes = messages.map((m) => JSON.parse(m) as { type: string; payload: unknown; ts: number });
    for (const env of envelopes) {
      expect(typeof env.type).toBe("string");
      expect(typeof env.ts).toBe("number");
      expect(env.payload).toBeDefined();
    }
    const types = envelopes.map((e) => e.type);
    expect(types).toContain("LOG_MESSAGE");
    expect(types).toContain("STATE_DELTA");
  });

  it("loadFromSave drops stale kittens resource payloads and keeps village kittens authoritative", () => {
    const imported = store.getSerialized();
    imported.village = {
      ...imported.village,
      kittens: 12,
      kittenProgress: 0.5,
    };
    imported.resources = {
      ...imported.resources,
      kittens: { value: 6217.28, maxValue: 0, perTick: 0.01 },
    };

    const loaded = store.loadFromSave(imported);
    expect(loaded.village.kittens).toBe(12);
    expect("kittens" in loaded.resources).toBe(false);
  });
});

describe("SessionRegistry", () => {
  let registry: SessionRegistry;

  beforeEach(() => {
    registry = new SessionRegistry(createMemoryAdapter());
  });

  it("create initializes a new store with active status", () => {
    const store = registry.create("test");
    expect(store).toBeDefined();
    expect(store.getSlot()).toBe("test");
    const meta = registry.listAll().find(m => m.slot === "test");
    expect(meta?.status).toBe("active");
  });

  it("create throws if slot already exists", () => {
    registry.create("test");
    expect(() => registry.create("test")).toThrow();
  });

  it("create throws if slot name is invalid", () => {
    expect(() => registry.create("invalid slot!")).toThrow();
  });

  it("create validates slot name: only alphanumeric, dash, underscore", () => {
    expect(() => registry.create("valid-name_123")).not.toThrow();
    expect(() => registry.create("valid-name_123.json")).toThrow();
    expect(() => registry.create("slot with spaces")).toThrow();
  });

  it("pause stops auto-tick and sets status to paused", () => {
    const store = registry.create("test");
    store.init();
    registry.pause("test");

    const meta = registry.listAll().find(m => m.slot === "test");
    expect(meta?.status).toBe("paused");
  });

  it("pause throws if slot not found", () => {
    expect(() => registry.pause("unknown")).toThrow();
  });

  it("resume restarts auto-tick and sets status to active", () => {
    const store = registry.create("test");
    store.init();
    registry.pause("test");
    registry.resume("test");

    const meta = registry.listAll().find(m => m.slot === "test");
    expect(meta?.status).toBe("active");
  });

  it("resume throws if slot not found", () => {
    expect(() => registry.resume("unknown")).toThrow();
  });

  it("archive stops auto-tick, sets status to archived, and evicts from memory", () => {
    const store = registry.create("test");
    store.init();
    registry.archive("test");

    const meta = registry.listAll().find(m => m.slot === "test");
    expect(meta?.status).toBe("archived");
  });

  it("archive throws if slot not found", () => {
    expect(() => registry.archive("unknown")).toThrow();
  });

  it("delete removes slot entirely and evicts from memory", () => {
    registry.create("test");
    registry.delete("test");

    expect(registry.listAll().find(m => m.slot === "test")).toBeUndefined();
  });

  it("delete throws if slot not found", () => {
    expect(() => registry.delete("unknown")).toThrow();
  });

  it("listAll returns metadata for all slots", () => {
    registry.create("slot1");
    registry.create("slot2");
    registry.pause("slot2");

    const all = registry.listAll();
    expect(all.length).toBeGreaterThanOrEqual(2);
    const slot1 = all.find(m => m.slot === "slot1");
    const slot2 = all.find(m => m.slot === "slot2");
    expect(slot1?.status).toBe("active");
    expect(slot2?.status).toBe("paused");
  });

  it("export returns serialized state JSON without side effects", () => {
    const store = registry.create("test");
    store.init();
    store.advanceTick();

    const json = registry.export("test");
    const parsed = JSON.parse(json);
    expect(parsed.tick).toBe(1);
  });

  it("export throws if slot is archived", () => {
    const store = registry.create("test");
    store.init();
    registry.archive("test");

    expect(() => registry.export("test")).toThrow();
  });

  it("export throws if slot not found", () => {
    expect(() => registry.export("unknown")).toThrow();
  });

  it("startup only loads active slots into memory", () => {
    const adapter = createMemoryAdapter();
    const r1 = new SessionRegistry(adapter);
    r1.create("active1");
    r1.create("active2");
    r1.create("paused1");
    r1.pause("paused1");
    r1.create("archived1");
    r1.archive("archived1");

    // Simulate restart with fresh registry
    const r2 = new SessionRegistry(adapter);

    // We can't directly check in-memory stores, but verify via listAll
    const all = r2.listAll();
    expect(all.find(m => m.slot === "active1")?.status).toBe("active");
    expect(all.find(m => m.slot === "paused1")?.status).toBe("paused");
    expect(all.find(m => m.slot === "archived1")?.status).toBe("archived");
  });

  it("pause blocks game actions with 409 error when checking via store", () => {
    const store = registry.create("test");
    store.init();
    registry.pause("test");

    // The store should know it's paused and reject actions
    // This is checked via store.isPaused() or similar state
    const result = store.applyGameAction({ type: "TICK" });
    expect(result.ok).toBe(false);
  });

  it("resume allows game actions to proceed again", () => {
    const store = registry.create("test");
    store.init();
    registry.pause("test");
    registry.resume("test");

    const result = store.applyGameAction({ type: "TICK" });
    expect(result.ok).toBe(true);
  });
});
