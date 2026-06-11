// Database abstraction for SQLite persistence.
// Production: uses bun:sqlite via drizzle-orm/bun-sqlite
// Tests: injected via SqliteAdapter interface using createMemoryAdapter()

export interface SlotMeta {
  slot: string;
  status: "active" | "paused" | "archived";
  createdAt: number;
  updatedAt: number;
}

export interface SqliteAdapter {
  /** Execute a DDL statement (CREATE TABLE IF NOT EXISTS, etc.) */
  exec(sql: string): void;
  /** Return all persisted slot names. */
  listSlots(): string[];
  /** Load state_json for a slot, or null if absent. */
  loadSlot(slot: string): string | null;
  /** Upsert state_json for a slot. */
  saveSlot(slot: string, json: string): void;
  /** Return metadata for all slots. */
  listSlotMeta(): SlotMeta[];
  /** Return metadata for a single slot, or null if absent. */
  getSlotMeta(slot: string): SlotMeta | null;
  /** Update only the status for a slot without touching state_json. */
  updateSlotStatus(slot: string, status: "active" | "paused" | "archived"): void;
  /** Remove a slot and its state entirely. */
  deleteSlot(slot: string): void;
}

export interface MigrationPlan {
  addStatus: boolean;
  addCreatedAt: boolean;
  backfillCreatedAt: boolean;
}

export function planSavesTableMigration(columns: string[]): MigrationPlan {
  const columnSet = new Set(columns);
  const addStatus = !columnSet.has("status");
  const addCreatedAt = !columnSet.has("created_at");

  return {
    addStatus,
    addCreatedAt,
    backfillCreatedAt: addCreatedAt || columnSet.has("created_at"),
  };
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
  const drizzleCore = await import("drizzle-orm");
  const { eq } = drizzleCore;

  const sqlite = new Database(path);
  const db = drizzle({ client: sqlite });

  const savesTable = sqliteTable("saves", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    slot: text("slot").notNull().unique(),
    stateJson: text("state_json").notNull(),
    status: text("status", { enum: ["active", "paused", "archived"] })
      .notNull()
      .default("active"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  });

  sqlite.run(`
    CREATE TABLE IF NOT EXISTS saves (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slot TEXT NOT NULL UNIQUE,
      state_json TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      created_at INTEGER NOT NULL DEFAULT 0,
      updated_at INTEGER NOT NULL
    )
  `);

  const tableInfo = sqlite.query("PRAGMA table_info(saves)").all() as Array<{ name?: unknown }>;
  const migration = planSavesTableMigration(
    tableInfo.map((row) => row.name).filter((name): name is string => typeof name === "string"),
  );

  if (migration.addStatus) {
    sqlite.run("ALTER TABLE saves ADD COLUMN status TEXT NOT NULL DEFAULT 'active'");
  }
  if (migration.addCreatedAt) {
    sqlite.run("ALTER TABLE saves ADD COLUMN created_at INTEGER NOT NULL DEFAULT 0");
  }
  if (migration.backfillCreatedAt) {
    sqlite.run("UPDATE saves SET created_at = updated_at WHERE created_at = 0");
  }

  return {
    exec(sql: string) {
      sqlite.run(sql);
    },

    listSlots(): string[] {
      const rows = db.select({ slot: savesTable.slot }).from(savesTable).all();
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
      const now = Date.now();
      // Check if slot exists to set createdAt appropriately
      const existing = db
        .select({ createdAt: savesTable.createdAt })
        .from(savesTable)
        .where(eq(savesTable.slot, slot))
        .limit(1)
        .all();

      if (existing.length === 0) {
        // New slot: set both createdAt and updatedAt
        db.insert(savesTable)
          .values({
            slot,
            stateJson: json,
            status: "active",
            createdAt: now,
            updatedAt: now,
          })
          .execute();
      } else {
        // Existing slot: keep createdAt, update updatedAt
        db.update(savesTable)
          .set({ stateJson: json, updatedAt: now })
          .where(eq(savesTable.slot, slot))
          .execute();
      }
    },

    listSlotMeta(): SlotMeta[] {
      const rows = db
        .select({
          slot: savesTable.slot,
          status: savesTable.status,
          createdAt: savesTable.createdAt,
          updatedAt: savesTable.updatedAt,
        })
        .from(savesTable)
        .all();
      return rows.map((row) => ({
        slot: row.slot,
        status: row.status as "active" | "paused" | "archived",
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }));
    },

    getSlotMeta(slot: string): SlotMeta | null {
      const rows = db
        .select({
          slot: savesTable.slot,
          status: savesTable.status,
          createdAt: savesTable.createdAt,
          updatedAt: savesTable.updatedAt,
        })
        .from(savesTable)
        .where(eq(savesTable.slot, slot))
        .limit(1)
        .all();
      if (rows.length === 0) return null;
      const row = rows[0]!;
      return {
        slot: row.slot,
        status: row.status as "active" | "paused" | "archived",
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      };
    },

    updateSlotStatus(slot: string, status: "active" | "paused" | "archived"): void {
      db.update(savesTable)
        .set({ status, updatedAt: Date.now() })
        .where(eq(savesTable.slot, slot))
        .execute();
    },

    deleteSlot(slot: string): void {
      db.delete(savesTable).where(eq(savesTable.slot, slot)).execute();
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
  const metadata = new Map<string, SlotMeta>();

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
      const now = Date.now();
      if (!slots.has(slot)) {
        // First save: set createdAt
        metadata.set(slot, {
          slot,
          status: "active",
          createdAt: now,
          updatedAt: now,
        });
      } else {
        // Update: keep createdAt, update updatedAt
        const meta = metadata.get(slot)!;
        meta.updatedAt = now;
      }
      slots.set(slot, json);
    },
    listSlotMeta(): SlotMeta[] {
      return [...metadata.values()];
    },
    getSlotMeta(slot: string): SlotMeta | null {
      return metadata.get(slot) ?? null;
    },
    updateSlotStatus(slot: string, status: "active" | "paused" | "archived"): void {
      const meta = metadata.get(slot);
      if (meta) {
        meta.status = status;
        meta.updatedAt = Date.now();
      }
    },
    deleteSlot(slot: string): void {
      slots.delete(slot);
      metadata.delete(slot);
    },
  };
}
