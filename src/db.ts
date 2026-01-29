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

interface TodoItem {
  content: string;
  status: string;
  activeForm: string;
}

interface TodoWriteInput {
  tool_input?: {
    todos?: TodoItem[];
  };
}

function parseTodosFromRawInput(rawInput: string): TodoItem[] {
  try {
    const parsed: TodoWriteInput = JSON.parse(rawInput);
    const todos = parsed?.tool_input?.todos;
    if (!Array.isArray(todos)) return [];
    return todos.filter(
      (t): t is TodoItem =>
        typeof t === "object" &&
        t !== null &&
        typeof t.content === "string" &&
        typeof t.status === "string" &&
        ["pending", "in_progress", "completed"].includes(t.status) &&
        typeof t.activeForm === "string"
    );
  } catch {
    return [];
  }
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

    CREATE TABLE IF NOT EXISTS Todo (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      project TEXT NOT NULL,
      content TEXT NOT NULL,
      status TEXT NOT NULL,
      activeForm TEXT NOT NULL,
      position INTEGER DEFAULT 0,
      UNIQUE(project, content)
    );
    CREATE INDEX IF NOT EXISTS idx_todo_project ON Todo(project);
    CREATE INDEX IF NOT EXISTS idx_todo_status ON Todo(status);
  `);

  // Auto-migrate todos from historical events if Todo table is empty
  const todoCount = db.prepare("SELECT COUNT(*) as count FROM Todo").get() as { count: number };
  if (todoCount.count === 0) {
    const todoEvents = db
      .prepare(
        `SELECT project, rawInput, timestamp FROM Event
         WHERE tool = 'TodoWrite' AND rawInput IS NOT NULL
         ORDER BY timestamp DESC`
      )
      .all() as { project: string; rawInput: string; timestamp: string }[];

    if (todoEvents.length > 0) {
      // Group by project and get most recent
      const projectMap = new Map<string, string>();
      for (const event of todoEvents) {
        if (!projectMap.has(event.project)) {
          projectMap.set(event.project, event.rawInput);
        }
      }

      const insertStmt = db.prepare(
        `INSERT OR IGNORE INTO Todo (project, content, status, activeForm, position)
         VALUES (?, ?, ?, ?, ?)`
      );

      for (const [project, rawInput] of projectMap) {
        const todos = parseTodosFromRawInput(rawInput);
        todos.forEach((todo, index) => {
          insertStmt.run(project, todo.content, todo.status, todo.activeForm, index);
        });
      }
    }
  }

  db.close();
}

initializeDatabase();

const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
export const prisma = new PrismaClient({ adapter });
