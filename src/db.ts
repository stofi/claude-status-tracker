import { PrismaClient } from "./generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import Database from "better-sqlite3";
import * as path from "path";
import * as os from "os";
import * as fs from "fs";

// Database stored in user's home directory for persistence across projects
export const dataDir = path.join(os.homedir(), ".claude-status-tracker");
export const dbPath = path.join(dataDir, "events.db");

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Auto-initialize database schema if needed
function initializeDatabase() {
  const db = new Database(dbPath);
  db.exec(`
    CREATE TABLE IF NOT EXISTS Event (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      eventType TEXT NOT NULL,
      project TEXT NOT NULL,
      tool TEXT,
      action TEXT NOT NULL,
      detail TEXT,
      source TEXT,
      reason TEXT,
      rawInput TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_event_timestamp ON Event(timestamp);
    CREATE INDEX IF NOT EXISTS idx_event_project ON Event(project);
    CREATE INDEX IF NOT EXISTS idx_event_eventType ON Event(eventType);
  `);
  db.close();
}

initializeDatabase();

const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
export const prisma = new PrismaClient({ adapter });
