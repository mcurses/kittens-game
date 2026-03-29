// SessionRegistry — manages per-slot GameStateStore instances for multi-client support
import type { SqliteAdapter } from "./db.js";
import { GameStateStore } from "./store.js";

const SLOT_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/;

/** Returns true if slot name is safe to use as a DB key / URL param. */
export function isValidSlot(name: string): boolean {
  return SLOT_PATTERN.test(name);
}

/**
 * Manages a set of per-slot GameStateStores.
 * Each slot is an independent game session with its own state and auto-tick.
 */
export class SessionRegistry {
  private readonly stores = new Map<string, GameStateStore>();

  constructor(private readonly db: SqliteAdapter) {}

  /**
   * Returns the existing store for the given slot, or creates and initializes one.
   * The slot name must have been validated with isValidSlot before calling.
   */
  getOrCreate(slot: string): GameStateStore {
    let store = this.stores.get(slot);
    if (store === undefined) {
      store = new GameStateStore(this.db, slot);
      store.init();
      this.stores.set(slot, store);
    }
    return store;
  }

  /** Returns the names of all currently active (in-memory) slots. */
  listSlots(): string[] {
    return [...this.stores.keys()];
  }
}
