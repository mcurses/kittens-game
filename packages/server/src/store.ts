// GameStateStore — authoritative game state + persistence + WS broadcast
import {
  AchievementManager,
  BuildingManager,
  CalendarManager,
  ChallengeManager,
  DiplomacyManager,
  type GameAction,
  type GameState,
  type Manager,
  PrestigeManager,
  ReligionManager,
  ResourceManager,
  ScienceManager,
  type SerializedGameState,
  SpaceManager,
  syncResourceCaps,
  TimeManager,
  VillageManager,
  WorkshopManager,
  applyAction,
  buildEffectCache,
  createInitialState,
  deserialize,
  resetState,
  serialize,
  tick,
} from "@kittens/engine";
import type { SlotMeta, SqliteAdapter } from "./db.js";

export const DEFAULT_SLOT = "default";

/** Create the canonical ordered list of domain managers for the game engine. */
function createManagers(): readonly Manager[] {
  return [
    new ResourceManager(),
    new BuildingManager(),
    new VillageManager(),
    new CalendarManager(),
    new ScienceManager(),
    new WorkshopManager(),
    new ReligionManager(),
    new PrestigeManager(),
    new ChallengeManager(),
    new SpaceManager(),
    new DiplomacyManager(),
    new TimeManager(),
    new AchievementManager(),
  ];
}

/** Thin WS client abstraction so we don't import Hono types directly into the store. */
export interface WsClient {
  send(data: string): void;
}

export class GameStateStore {
  private state: GameState;
  private readonly managers: readonly Manager[];
  private clients: Set<WsClient> = new Set();
  private autoTickInterval: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly db: SqliteAdapter,
    private readonly slot: string = DEFAULT_SLOT,
  ) {
    this.managers = createManagers();
    this.state = createInitialState();
  }

  /** The save slot name this store persists to. */
  getSlot(): string {
    return this.slot;
  }

  /** Load persisted state from the adapter. Call once after construction. */
  init(): void {
    const json = this.db.loadSlot(this.slot);
    if (json !== null) {
      try {
        const parsed = JSON.parse(json) as SerializedGameState;
        this.state = this._fullDeserialize(parsed);
      } catch {
        // Corrupt save — start fresh
        this.state = this._initialStateWithEffects();
      }
    } else {
      this.state = this._initialStateWithEffects();
    }
  }

  getState(): GameState {
    return this.state;
  }

  getSerialized(): SerializedGameState {
    return serialize(this.state);
  }

  /** Apply an engine action. Returns the result. */
  applyGameAction(action: GameAction): { ok: boolean; error?: string; state: SerializedGameState } {
    // Check if session is paused; block all write actions
    if (this.isPaused()) {
      return {
        ok: false,
        error: "session is paused",
        state: this.getSerialized(),
      };
    }

    try {
      const prevState = this.state;
      const newState = applyAction(this.state, action, this.managers);
      if (newState === undefined || newState === null) {
        return {
          ok: false,
          error: `Unknown action type: ${action.type}`,
          state: this.getSerialized(),
        };
      }
      // Rebuild effect cache after action
      const effectCache = buildEffectCache(this.managers, newState);
      this.state = {
        ...newState,
        effectCache,
        resources: syncResourceCaps(newState.resources, effectCache),
      };
      // Emit LOG_MESSAGE for building purchases
      if (action.type === "BUY_BUILDING") {
        const prevVal = prevState.buildings[action.name]?.val ?? 0;
        const newVal = this.state.buildings[action.name]?.val ?? 0;
        if (newVal > prevVal) {
          this._broadcastLog(`Purchased ${action.name}.`);
        }
      }
      this._persist();
      this._broadcastDelta();
      return { ok: true, state: this.getSerialized() };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return { ok: false, error: message, state: this.getSerialized() };
    }
  }

  /** Advance one tick. Returns the new serialized state. */
  advanceTick(): SerializedGameState {
    const prevKittens = this.state.village.kittens;
    const prevSeason = this.state.calendar.season;
    this.state = tick(this.state, this.managers);
    const newKittens = this.state.village.kittens;
    const newSeason = this.state.calendar.season;
    if (newKittens > prevKittens) {
      for (let i = 0; i < newKittens - prevKittens; i++) {
        this._broadcastLog("A new kitten has arrived!");
      }
    }
    if (newSeason !== prevSeason) {
      const SEASON_NAMES = ["Spring", "Summer", "Autumn", "Winter"];
      const name = SEASON_NAMES[newSeason] ?? `Season ${newSeason}`;
      this._broadcastLog(`It is now ${name}.`);
    }
    this._persist();
    this._broadcastDelta();
    return this.getSerialized();
  }

  /** Load a save from raw serialized data. */
  loadFromSave(data: SerializedGameState): SerializedGameState {
    this.state = this._fullDeserialize(data);
    this._persist();
    this._broadcastDelta();
    return this.getSerialized();
  }

  /** Reset the game state. hard=true wipes prestige; hard=false does soft reset. */
  reset(hard = false): SerializedGameState {
    if (hard) {
      this.state = this._initialStateWithEffects();
    } else {
      this.state = resetState(this.managers);
    }
    this._persist();
    this._broadcastDelta();
    return this.getSerialized();
  }

  // ── Auto-tick lifecycle ───────────────────────────────────────────────────

  /** Start the auto-tick loop at the given interval (ms). Idempotent. */
  startAutoTick(intervalMs = 200): void {
    if (this.autoTickInterval !== null) return;
    this.autoTickInterval = setInterval(() => {
      this.advanceTick();
    }, intervalMs);
  }

  /** Stop the auto-tick loop. Safe to call if not running. */
  stopAutoTick(): void {
    if (this.autoTickInterval !== null) {
      clearInterval(this.autoTickInterval);
      this.autoTickInterval = null;
    }
  }

  // ── WS client management ─────────────────────────────────────────────────

  addClient(client: WsClient): void {
    this.clients.add(client);
  }

  removeClient(client: WsClient): void {
    this.clients.delete(client);
  }

  getClientCount(): number {
    return this.clients.size;
  }

  // ── Internal helpers ─────────────────────────────────────────────────────

  /** Full deserialization: base deserialize + each manager's load() with its own slice */
  private _fullDeserialize(data: SerializedGameState): GameState {
    let state = deserialize(data);
    const dataMap = data as unknown as Record<string, unknown>;
    for (const manager of this.managers) {
      const slice = dataMap[manager.sectionKey];
      state = manager.load(slice as Parameters<typeof manager.load>[0], state);
    }
    // Rebuild effect cache after loading
    const effectCache = buildEffectCache(this.managers, state);
    return { ...state, effectCache, resources: syncResourceCaps(state.resources, effectCache) };
  }

  /** Create a fresh initial state with effect cache built. */
  private _initialStateWithEffects(): GameState {
    let state = createInitialState();
    for (const manager of this.managers) {
      state = manager.resetState(state);
    }
    const effectCache = buildEffectCache(this.managers, state);
    return { ...state, effectCache };
  }

  private _persist(): void {
    this.db.saveSlot(this.slot, JSON.stringify(this.getSerialized()));
  }

  private _broadcast(type: string, payload: unknown): void {
    const envelope = JSON.stringify({ type, payload, ts: Date.now() });
    for (const client of this.clients) {
      try {
        client.send(envelope);
      } catch {
        // Client disconnected mid-broadcast — remove it
        this.clients.delete(client);
      }
    }
  }

  private _broadcastLog(message: string): void {
    this._broadcast("LOG_MESSAGE", message);
  }

  private _broadcastDelta(): void {
    this._broadcast("STATE_DELTA", this.getSerialized());
  }

  /** Returns true if the session is paused. */
  isPaused(): boolean {
    const meta = this.db.getSlotMeta(this.slot);
    return meta?.status === "paused";
  }
}

/** Validates a slot name: alphanumeric, dash, underscore only, 1-64 chars. */
function isValidSlot(name: string): boolean {
  return /^[a-zA-Z0-9_-]{1,64}$/.test(name);
}

/** Registry for managing the lifecycle of all game save sessions. */
export class SessionRegistry {
  private stores = new Map<string, GameStateStore>();
  private autoTickIntervals = new Map<string, ReturnType<typeof setInterval>>();

  constructor(private db: SqliteAdapter) {}

  /** Create a new session with the given slot name. */
  create(slot: string): GameStateStore {
    if (!isValidSlot(slot)) {
      throw new Error(`Invalid slot name: ${slot}`);
    }
    if (this.db.getSlotMeta(slot) !== null) {
      throw new Error(`Slot already exists: ${slot}`);
    }

    const store = new GameStateStore(this.db, slot);
    store.init();

    // Explicitly save initial state to create the metadata entry
    this.db.saveSlot(slot, JSON.stringify(store.getSerialized()));

    this.stores.set(slot, store);

    // Start auto-tick loop for new active session
    this._startAutoTick(slot, store);

    return store;
  }

  /** Pause a session: stop auto-tick and set status to paused. */
  pause(slot: string): void {
    const meta = this.db.getSlotMeta(slot);
    if (meta === null) {
      throw new Error(`Slot not found: ${slot}`);
    }
    this.db.updateSlotStatus(slot, "paused");
    this._stopAutoTick(slot);
  }

  /** Resume a paused session: set status to active and restart auto-tick. */
  resume(slot: string): void {
    const meta = this.db.getSlotMeta(slot);
    if (meta === null) {
      throw new Error(`Slot not found: ${slot}`);
    }
    this.db.updateSlotStatus(slot, "active");

    // Load store into memory if not already there
    let store = this.stores.get(slot);
    if (!store) {
      store = new GameStateStore(this.db, slot);
      store.init();
      this.stores.set(slot, store);
    }

    this._startAutoTick(slot, store);
  }

  /** Archive a session: stop auto-tick, set status to archived, evict from memory. */
  archive(slot: string): void {
    const meta = this.db.getSlotMeta(slot);
    if (meta === null) {
      throw new Error(`Slot not found: ${slot}`);
    }
    this.db.updateSlotStatus(slot, "archived");
    this._stopAutoTick(slot);
    this.stores.delete(slot);
  }

  /** Delete a session entirely. */
  delete(slot: string): void {
    const meta = this.db.getSlotMeta(slot);
    if (meta === null) {
      throw new Error(`Slot not found: ${slot}`);
    }
    this._stopAutoTick(slot);
    this.db.deleteSlot(slot);
    this.stores.delete(slot);
  }

  /** List metadata for all slots, regardless of status. */
  listAll(): SlotMeta[] {
    return this.db.listSlotMeta();
  }

  /** Export a slot's state as JSON (read-only operation). */
  export(slot: string): string {
    const meta = this.db.getSlotMeta(slot);
    if (meta === null) {
      throw new Error(`Slot not found: ${slot}`);
    }
    if (meta.status === "archived") {
      throw new Error(`Archived slot cannot be exported: ${slot}`);
    }

    // Load store if not in memory
    let store = this.stores.get(slot);
    if (!store) {
      store = new GameStateStore(this.db, slot);
      store.init();
    }

    return JSON.stringify(store.getSerialized());
  }

  /** Get or create a store for a slot. Only loads active or paused slots. */
  getOrCreate(slot: string): GameStateStore | null {
    const meta = this.db.getSlotMeta(slot);
    if (meta === null || meta.status === "archived") {
      return null;
    }

    let store = this.stores.get(slot);
    if (!store) {
      store = new GameStateStore(this.db, slot);
      store.init();
      this.stores.set(slot, store);
      if (meta.status === "active") {
        this._startAutoTick(slot, store);
      }
    }

    return store;
  }

  /** Load only active slots on startup. */
  loadActiveSlots(): void {
    const all = this.db.listSlotMeta();
    for (const meta of all) {
      if (meta.status === "active") {
        const store = new GameStateStore(this.db, meta.slot);
        store.init();
        this.stores.set(meta.slot, store);
        this._startAutoTick(meta.slot, store);
      }
    }
  }

  private _startAutoTick(slot: string, store: GameStateStore): void {
    if (this.autoTickIntervals.has(slot)) {
      return; // Already running
    }
    const interval = setInterval(() => {
      try {
        store.advanceTick();
      } catch {
        // Ignore errors in auto-tick; do not crash the registry
      }
    }, 100); // 100ms = 10 ticks/sec
    this.autoTickIntervals.set(slot, interval);
  }

  private _stopAutoTick(slot: string): void {
    const interval = this.autoTickIntervals.get(slot);
    if (interval) {
      clearInterval(interval);
      this.autoTickIntervals.delete(slot);
    }
  }
}
