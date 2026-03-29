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
import type { SqliteAdapter } from "./db.js";

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
      this.state = { ...newState, effectCache };
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

  /** Full deserialization: base deserialize + each manager's load() */
  private _fullDeserialize(data: SerializedGameState): GameState {
    let state = deserialize(data);
    for (const manager of this.managers) {
      state = manager.load(data as unknown as Parameters<typeof manager.load>[0], state);
    }
    // Rebuild effect cache after loading
    const effectCache = buildEffectCache(this.managers, state);
    return { ...state, effectCache };
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
    this._broadcast("LOG_MESSAGE", { message });
  }

  private _broadcastDelta(): void {
    this._broadcast("STATE_DELTA", this.getSerialized());
  }
}
