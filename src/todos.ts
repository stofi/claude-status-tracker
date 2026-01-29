#!/usr/bin/env node
import { prisma } from "./db";
import * as path from "path";

interface Options {
  project?: string;
  status?: string;
  json: boolean;
  help: boolean;
}

function parseArgs(args: string[]): Options {
  const options: Options = {
    json: false,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "-h" || arg === "--help") {
      options.help = true;
    } else if (arg === "-j" || arg === "--json") {
      options.json = true;
    } else if (arg === "-p" || arg === "--project") {
      options.project = args[++i];
    } else if (arg === "-s" || arg === "--status") {
      options.status = args[++i];
    }
  }

  return options;
}

function printHelp() {
  console.log(`Usage: claude-status-tracker todos [options]

Query todos from the tracking database.

Options:
  -p, --project <name>   Filter by project name (default: current directory)
  -s, --status <status>  Filter by status (pending, in_progress, completed)
  -j, --json             Output as JSON
  -h, --help             Show this help message

Examples:
  claude-status-tracker todos              Show todos for current project
  claude-status-tracker todos -j           Show todos as JSON
  claude-status-tracker todos -p myproj    Show todos for "myproj"
  claude-status-tracker todos -s pending   Show only pending todos
`);
}

async function main() {
  const args = process.argv.slice(2);

  // Handle subcommand if called as "claude-status-tracker todos"
  const filteredArgs = args[0] === "todos" ? args.slice(1) : args;
  const options = parseArgs(filteredArgs);

  if (options.help) {
    printHelp();
    await prisma.$disconnect();
    return;
  }

  // Default to current directory name if no project specified
  const project = options.project || path.basename(process.cwd());

  const where: Record<string, unknown> = { project };

  if (options.status) {
    where.status = options.status;
  }

  try {
    const todos = await prisma.todo.findMany({
      where,
      orderBy: { position: "asc" },
    });

    if (options.json) {
      console.log(JSON.stringify({ project, todos }, null, 2));
    } else {
      if (todos.length === 0) {
        console.log(`No todos found for project: ${project}`);
      } else {
        console.log(`Todos for ${project}:`);
        console.log("");
        for (const todo of todos) {
          const icon =
            todo.status === "completed"
              ? "\u2713"
              : todo.status === "in_progress"
              ? "\u25B6"
              : "\u25CB";
          const statusLabel =
            todo.status === "in_progress" ? "in progress" : todo.status;
          console.log(`  ${icon} [${statusLabel}] ${todo.content}`);
        }
      }
    }
  } catch (error) {
    console.error("Failed to query todos:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
