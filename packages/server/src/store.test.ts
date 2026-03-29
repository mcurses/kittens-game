import { beforeEach, describe, expect, it } from "vitest";
import { createMemoryAdapter } from "./db.js";
import { GameStateStore } from "./store.js";

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
      .map((m) => JSON.parse(m) as { type: string; payload: { message: string } })
      .filter((m) => m.type === "LOG_MESSAGE");
    expect(logMessages.length).toBeGreaterThanOrEqual(1);
    expect(logMessages[0]?.payload.message).toMatch(/kitten/i);
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
      .map((m) => JSON.parse(m) as { type: string; payload: { message: string } })
      .filter((m) => m.type === "LOG_MESSAGE");
    expect(logMessages.length).toBeGreaterThanOrEqual(1);
    expect(logMessages[0]?.payload.message).toMatch(/hut/i);
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
      calendar: { day: 99.9, season: 0, year: 0 },
    };
    const messages: string[] = [];
    const client = { send: (data: string) => messages.push(data) };
    store.addClient(client);
    store.advanceTick();
    const logMessages = messages
      .map((m) => JSON.parse(m) as { type: string; payload: { message: string } })
      .filter((m) => m.type === "LOG_MESSAGE");
    expect(logMessages.length).toBeGreaterThanOrEqual(1);
    const seasonMsg = logMessages.find((m) => /season|spring|summer|autumn|winter/i.test(m.payload.message));
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
});
