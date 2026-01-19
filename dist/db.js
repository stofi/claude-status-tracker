"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = exports.dbPath = exports.dataDir = void 0;
const client_1 = require("./generated/prisma/client");
const adapter_better_sqlite3_1 = require("@prisma/adapter-better-sqlite3");
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const fs = __importStar(require("fs"));
// Database stored in user's home directory for persistence across projects
exports.dataDir = path.join(os.homedir(), ".claude-status-tracker");
exports.dbPath = path.join(exports.dataDir, "events.db");
// Ensure data directory exists
if (!fs.existsSync(exports.dataDir)) {
    fs.mkdirSync(exports.dataDir, { recursive: true });
}
// Auto-initialize database schema if needed
function initializeDatabase() {
    const db = new better_sqlite3_1.default(exports.dbPath);
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
const adapter = new adapter_better_sqlite3_1.PrismaBetterSqlite3({ url: `file:${exports.dbPath}` });
exports.prisma = new client_1.PrismaClient({ adapter });
//# sourceMappingURL=db.js.map