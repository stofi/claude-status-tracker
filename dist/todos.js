#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("./db");
function parseArgs(args) {
    const options = {
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
        else if (arg === "-p" || arg === "--project") {
            options.project = args[++i];
        }
        else if (arg === "-s" || arg === "--status") {
            options.status = args[++i];
        }
    }
    return options;
}
function printHelp() {
    console.log(`Usage: claude-status-tracker todos [options]

Query todos from the tracking database.

Options:
  -p, --project <name>   Filter by project name (partial match)
  -s, --status <status>  Filter by status (pending, in_progress, completed)
  -j, --json             Output as JSON
  -h, --help             Show this help message

Examples:
  claude-status-tracker todos              Show all todos
  claude-status-tracker todos -j           Show all todos as JSON
  claude-status-tracker todos -p myproj    Show todos for projects matching "myproj"
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
        await db_1.prisma.$disconnect();
        return;
    }
    const where = {};
    if (options.project) {
        where.project = { contains: options.project };
    }
    if (options.status) {
        where.status = options.status;
    }
    try {
        const todos = await db_1.prisma.todo.findMany({
            where,
            orderBy: [{ project: "asc" }, { position: "asc" }],
        });
        if (options.json) {
            console.log(JSON.stringify(todos, null, 2));
        }
        else {
            if (todos.length === 0) {
                console.log("No todos found.");
            }
            else {
                // Group by project
                const byProject = new Map();
                for (const todo of todos) {
                    const list = byProject.get(todo.project) || [];
                    list.push(todo);
                    byProject.set(todo.project, list);
                }
                for (const [project, projectTodos] of byProject) {
                    console.log(`[${project}]`);
                    for (const todo of projectTodos) {
                        const icon = todo.status === "completed"
                            ? "\u2713"
                            : todo.status === "in_progress"
                                ? "\u25B6"
                                : "\u25CB";
                        const statusLabel = todo.status === "in_progress" ? "in progress" : todo.status;
                        console.log(`  ${icon} [${statusLabel}] ${todo.content}`);
                    }
                    console.log("");
                }
            }
        }
    }
    catch (error) {
        console.error("Failed to query todos:", error);
        process.exit(1);
    }
    finally {
        await db_1.prisma.$disconnect();
    }
}
main().catch(console.error);
//# sourceMappingURL=todos.js.map