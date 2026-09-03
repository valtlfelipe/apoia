import { existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import Database from "better-sqlite3";
import { type BetterSQLite3Database, drizzle } from "drizzle-orm/better-sqlite3";
import { env } from "@/lib/config/env";
import * as schema from "@/lib/db/schema";

/**
 * Single point where the SQLite driver is chosen. Swapping to Node's
 * built-in `node:sqlite` (zero native dependencies, but still experimental
 * as of Node 24) means changing only this file — everything else talks to
 * Drizzle's query builder, never to the driver directly.
 */
function createSqliteClient() {
  // DATABASE_PATH is only known at runtime (it's an ENV var), so this can't
  // be a statically-analyzable path. Told to opt out via `turbopackIgnore` —
  // otherwise the build tracer bundles the entire project into the
  // standalone output just because it saw a dynamic fs path here.
  const dbPath = resolve(/* turbopackIgnore: true */ process.cwd(), env.DATABASE_PATH);
  const dir = dirname(dbPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  const sqlite = new Database(dbPath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  sqlite.pragma("busy_timeout = 5000");
  return sqlite;
}

type SqliteClient = ReturnType<typeof createSqliteClient>;

declare global {
  // eslint-disable-next-line no-var
  var __apoiaSqlite: SqliteClient | undefined;
}

let sqlite: SqliteClient | null = null;
let dbInstance: BetterSQLite3Database<typeof schema> | null = null;

/**
 * Opens the database connection on first use rather than at import time.
 * Next.js imports every route module during the build (to statically read
 * exports like `runtime`/`dynamic`) — if opening the DB were a side effect
 * of importing this module, that step would spawn several build workers all
 * racing to open the same fresh SQLite file at once (SQLITE_BUSY). Real
 * requests are what should open the connection, not module evaluation.
 */
function ensureInitialized(): BetterSQLite3Database<typeof schema> {
  if (dbInstance) return dbInstance;

  // Reuse the connection across Next.js dev-mode hot reloads / module reevaluation.
  sqlite = globalThis.__apoiaSqlite ?? createSqliteClient();
  if (env.NODE_ENV !== "production") {
    globalThis.__apoiaSqlite = sqlite;
  }

  dbInstance = drizzle({ client: sqlite, schema });
  return dbInstance;
}

export const db: BetterSQLite3Database<typeof schema> = new Proxy(
  {} as BetterSQLite3Database<typeof schema>,
  {
    get(_target, prop, receiver) {
      return Reflect.get(ensureInitialized(), prop, receiver);
    },
  },
);

/** Closes the underlying connection. Only meant for one-shot scripts (e.g. migrate.ts). */
export function closeDb(): void {
  sqlite?.close();
}
