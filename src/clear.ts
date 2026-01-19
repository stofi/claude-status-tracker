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
    let count: number;

    if (clearAll) {
      if (dryRun) {
        count = await prisma.event.count();
        console.log(`Would delete ALL ${count} events.`);
      } else {
        const result = await prisma.event.deleteMany({});
        count = result.count;
        console.log(`Deleted ALL ${count} events.`);
      }
    } else {
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
        console.log(
          `Would delete ${count} events older than ${daysToKeep} days (before ${cutoffDate.toLocaleDateString()}).`
        );
      } else {
        const result = await prisma.event.deleteMany({
          where: {
            timestamp: {
              lt: cutoffDate,
            },
          },
        });
        count = result.count;
        console.log(
          `Deleted ${count} events older than ${daysToKeep} days (before ${cutoffDate.toLocaleDateString()}).`
        );
      }
    }

    // Show remaining count
    const remaining = await prisma.event.count();
    console.log(`Events remaining: ${remaining}`);
  } catch (error) {
    console.error("Failed to clear events:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
