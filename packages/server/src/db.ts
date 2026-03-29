// Database abstraction for SQLite persistence.
// Production: uses bun:sqlite via drizzle-orm/bun-sqlite
// Tests: injected via SqliteAdapter interface using createMemoryAdapter()

export interface SqliteAdapter {
  /** Execute a DDL statement (CREATE TABLE IF NOT EXISTS, etc.) */
  exec(sql: string): void;
  /** Return all persisted slot names. */
  listSlots(): string[];
  /** Load state_json for a slot, or null if absent. */
  loadSlot(slot: string): string | null;
  /** Upsert state_json for a slot. */
  saveSlot(slot: string, json: string): void;
}

/* v8 ignore start */
/**
 * Create a production SqliteAdapter backed by bun:sqlite + Drizzle.
 * Dynamic imports so Vitest tests can run without bun:sqlite in Node environment.
 */
export async function createBunAdapter(path: string): Promise<SqliteAdapter> {
  const { Database } = await import("bun:sqlite");
  const { drizzle } = await import("drizzle-orm/bun-sqlite");
  const { integer, sqliteTable, text } = await import("drizzle-orm/sqlite-core");
  const { eq } = await import("drizzle-orm");

  const sqlite = new Database(path);
  const db = drizzle({ client: sqlite });

  const savesTable = sqliteTable("saves", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    slot: text("slot").notNull().unique(),
    stateJson: text("state_json").notNull(),
    updatedAt: integer("updated_at").notNull(),
  });

  sqlite.run(`
    CREATE TABLE IF NOT EXISTS saves (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slot TEXT NOT NULL UNIQUE,
      state_json TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  return {
    exec(sql: string) {
      sqlite.run(sql);
    },

    listSlots(): string[] {
      const rows = db
        .select({ slot: savesTable.slot })
        .from(savesTable)
        .all();
      return rows.map((row) => row.slot);
    },

    loadSlot(slot: string): string | null {
      const rows = db
        .select({ stateJson: savesTable.stateJson })
        .from(savesTable)
        .where(eq(savesTable.slot, slot))
        .limit(1)
        .all();
      return rows[0]?.stateJson ?? null;
    },

    saveSlot(slot: string, json: string): void {
      const updatedAt = Date.now();
      db.insert(savesTable)
        .values({ slot, stateJson: json, updatedAt })
        .onConflictDoUpdate({
          target: savesTable.slot,
          set: { stateJson: json, updatedAt },
        })
        .run();
    },
  };
}
/* v8 ignore stop */

/**
 * Create an in-memory SqliteAdapter backed by a Map.
 * Used in tests (no bun:sqlite dependency).
 */
export function createMemoryAdapter(): SqliteAdapter {
  const slots = new Map<string, string>();
  return {
    exec(_sql: string) {
      // No-op for in-memory
    },
    listSlots(): string[] {
      return [...slots.keys()];
    },
    loadSlot(slot: string): string | null {
      return slots.get(slot) ?? null;
    },
    saveSlot(slot: string, json: string): void {
      slots.set(slot, json);
    },
  };
}
