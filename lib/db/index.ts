import path from "node:path";
import fs from "node:fs";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { ensureSchema } from "@/lib/db/init";

type DbBundle = {
  sqlite: Database.Database;
  db: ReturnType<typeof drizzle>;
};

declare global {
  // eslint-disable-next-line no-var
  var __bodyTrackerDbBundle: DbBundle | undefined;
}

function createBundle(): DbBundle {
  const isVercelRuntime = process.env.VERCEL === "1";
  const defaultPath = isVercelRuntime ? "/tmp/body-tracker.db" : "./data/app.db";
  const configuredPath = process.env.DB_FILE_PATH ?? defaultPath;
  const dbFilePath = path.isAbsolute(configuredPath)
    ? configuredPath
    : path.join(process.cwd(), configuredPath);
  const dbDir = path.dirname(dbFilePath);
  fs.mkdirSync(dbDir, { recursive: true });

  const sqlite = new Database(dbFilePath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  ensureSchema(sqlite);

  return {
    sqlite,
    db: drizzle(sqlite)
  };
}

const bundle = globalThis.__bodyTrackerDbBundle ?? createBundle();

if (process.env.NODE_ENV !== "production") {
  globalThis.__bodyTrackerDbBundle = bundle;
}

export const sqlite = bundle.sqlite;
export const db = bundle.db;
