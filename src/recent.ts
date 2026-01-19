#!/usr/bin/env node
import { PrismaClient } from "./generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import * as path from "path";
import * as os from "os";

// Database stored in user's home directory for persistence across projects
const dataDir = path.join(os.homedir(), ".claude-status-tracker");
const dbPath = path.join(dataDir, "events.db");

const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

interface Options {
  limit: number;
  project?: string;
  eventType?: string;
  json: boolean;
  help: boolean;
}

function parseArgs(args: string[]): Options {
  const options: Options = {
    limit: 10,
    json: false,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "-h" || arg === "--help") {
      options.help = true;
    } else if (arg === "-j" || arg === "--json") {
      options.json = true;
    } else if (arg === "-n" || arg === "--limit") {
      const val = args[++i];
      if (val) options.limit = parseInt(val, 10);
    } else if (arg === "-p" || arg === "--project") {
      options.project = args[++i];
    } else if (arg === "-t" || arg === "--type") {
      options.eventType = args[++i];
    } else if (!arg.startsWith("-") && !isNaN(parseInt(arg, 10))) {
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

  const where: Record<string, unknown> = {};

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
    } else {
      if (events.length === 0) {
        console.log("No events found.");
      } else {
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
  } catch (error) {
    console.error("Failed to query events:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
