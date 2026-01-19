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
function parseArgs(args) {
    const options = {
        limit: 10,
        json: false,
        help: false,
    };
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === "-h" || arg === "--help") {
            options.help = true;
        }
        else if (arg === "-j" || arg === "--json") {
            options.json = true;
        }
        else if (arg === "-n" || arg === "--limit") {
            const val = args[++i];
            if (val)
                options.limit = parseInt(val, 10);
        }
        else if (arg === "-p" || arg === "--project") {
            options.project = args[++i];
        }
        else if (arg === "-t" || arg === "--type") {
            options.eventType = args[++i];
        }
        else if (!arg.startsWith("-") && !isNaN(parseInt(arg, 10))) {
            // Positional number argument for limit (backwards compat)
            options.limit = parseInt(arg, 10);
        }
    }
    return options;
}
function printHelp() {
    console.log(`Usage: claude-status-tracker recent [options] [limit]

Query recent Claude Code events from the tracking database.

Options:
  -n, --limit <n>     Number of events to show (default: 10)
  -p, --project <p>   Filter by project name (partial match)
  -t, --type <type>   Filter by event type (prompt, pre-tool, stop, notification, session-start, session-end)
  -j, --json          Output as JSON
  -h, --help          Show this help message

Examples:
  claude-status-tracker recent           Show last 10 events
  claude-status-tracker recent 20        Show last 20 events
  claude-status-tracker recent -n 5 -j   Show last 5 events as JSON
  claude-status-tracker recent -p myproj Show events for projects matching "myproj"
  claude-status-tracker recent -t prompt Show only prompt events
`);
}
async function main() {
    const args = process.argv.slice(2);
    // Handle subcommand if called as "claude-status-tracker recent"
    const filteredArgs = args[0] === "recent" ? args.slice(1) : args;
    const options = parseArgs(filteredArgs);
    if (options.help) {
        printHelp();
        await prisma.$disconnect();
        return;
    }
    const where = {};
    if (options.project) {
        where.project = { contains: options.project };
    }
    if (options.eventType) {
        where.eventType = options.eventType;
    }
    try {
        const events = await prisma.event.findMany({
            where,
            orderBy: { timestamp: "desc" },
            take: options.limit,
        });
        // Reverse to show oldest first (chronological order)
        events.reverse();
        if (options.json) {
            console.log(JSON.stringify(events, null, 2));
        }
        else {
            if (events.length === 0) {
                console.log("No events found.");
            }
            else {
                for (const event of events) {
                    const time = event.timestamp.toLocaleTimeString("en-US", {
                        hour12: false,
                        hour: "2-digit",
                        minute: "2-digit",
                    });
                    let line = `${time} [${event.project}] ${event.action}`;
                    if (event.detail) {
                        line += `: ${event.detail.substring(0, 50)}`;
                    }
                    console.log(line);
                }
            }
        }
    }
    catch (error) {
        console.error("Failed to query events:", error);
        process.exit(1);
    }
    finally {
        await prisma.$disconnect();
    }
}
main().catch(console.error);
//# sourceMappingURL=recent.js.map