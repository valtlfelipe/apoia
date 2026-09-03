import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { closeDb, db } from "@/lib/db/client";

// Runs the SQL files in ./drizzle against the configured database. Called
// from the Docker entrypoint on every boot, and via `pnpm db:migrate` in dev.
migrate(db, { migrationsFolder: "./drizzle" });
process.stdout.write("Migrations applied.\n");
closeDb();
