#!/usr/bin/env node
import * as path from "path";
import * as os from "os";
import * as fs from "fs";
import Database from "better-sqlite3";

// Database stored in user's home directory for persistence across projects
const dataDir = path.join(os.homedir(), ".claude-status-tracker");
const dbPath = path.join(dataDir, "events.db");

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log(`Created data directory: ${dataDir}`);
}

// Create or open database
const db = new Database(dbPath);

// Create table if it doesn't exist
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

console.log(`Database initialized at: ${dbPath}`);
db.close();
