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
});
