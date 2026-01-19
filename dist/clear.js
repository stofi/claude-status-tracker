#!/usr/bin/env node
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
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("./generated/prisma/client");
const adapter_better_sqlite3_1 = require("@prisma/adapter-better-sqlite3");
const path = __importStar(require("path"));
const os = __importStar(require("os"));
// Database stored in user's home directory for persistence across projects
const dataDir = path.join(os.homedir(), ".claude-status-tracker");
const dbPath = path.join(dataDir, "events.db");
const adapter = new adapter_better_sqlite3_1.PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new client_1.PrismaClient({ adapter });
function printHelp() {
    console.log(`Usage: claude-status-tracker clear [options] [days]

Clear old events from the tracking database.

Arguments:
  days                Number of days to keep (default: 7)

Options:
  --all               Clear ALL events (use with caution)
  --dry-run           Show what would be deleted without deleting
  -h, --help          Show this help message

Examples:
  claude-status-tracker clear           Clear events older than 7 days
  claude-status-tracker clear 30        Clear events older than 30 days
  claude-status-tracker clear --dry-run Show what would be deleted
  claude-status-tracker clear --all     Clear all events
`);
}
async function main() {
    const args = process.argv.slice(2);
    // Handle subcommand if called as "claude-status-tracker clear"
    const filteredArgs = args[0] === "clear" ? args.slice(1) : args;
    const help = filteredArgs.includes("-h") || filteredArgs.includes("--help");
    const clearAll = filteredArgs.includes("--all");
    const dryRun = filteredArgs.includes("--dry-run");
    if (help) {
        printHelp();
        await prisma.$disconnect();
        return;
    }
    // Parse days argument
    let daysToKeep = 7;
    for (const arg of filteredArgs) {
        if (!arg.startsWith("-") && !isNaN(parseInt(arg, 10))) {
            daysToKeep = parseInt(arg, 10);
            break;
        }
    }
    try {
        let count;
        if (clearAll) {
            if (dryRun) {
                count = await prisma.event.count();
                console.log(`Would delete ALL ${count} events.`);
            }
            else {
                const result = await prisma.event.deleteMany({});
                count = result.count;
                console.log(`Deleted ALL ${count} events.`);
            }
        }
        else {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
            if (dryRun) {
                count = await prisma.event.count({
                    where: {
                        timestamp: {
                            lt: cutoffDate,
                        },
                    },
                });
                console.log(`Would delete ${count} events older than ${daysToKeep} days (before ${cutoffDate.toLocaleDateString()}).`);
            }
            else {
                const result = await prisma.event.deleteMany({
                    where: {
                        timestamp: {
                            lt: cutoffDate,
                        },
                    },
                });
                count = result.count;
                console.log(`Deleted ${count} events older than ${daysToKeep} days (before ${cutoffDate.toLocaleDateString()}).`);
            }
        }
        // Show remaining count
        const remaining = await prisma.event.count();
        console.log(`Events remaining: ${remaining}`);
    }
    catch (error) {
        console.error("Failed to clear events:", error);
        process.exit(1);
    }
    finally {
        await prisma.$disconnect();
    }
}
main().catch(console.error);
//# sourceMappingURL=clear.js.map