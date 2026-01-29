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
const db_1 = require("./db");
const path = __importStar(require("path"));
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
        await db_1.prisma.$disconnect();
        return;
    }
    // Default to current directory name if no project specified
    const project = options.project || path.basename(process.cwd());
    const where = { project };
    if (options.status) {
        where.status = options.status;
    }
    try {
        const todos = await db_1.prisma.todo.findMany({
            where,
            orderBy: { position: "asc" },
        });
        if (options.json) {
            console.log(JSON.stringify({ project, todos }, null, 2));
        }
        else {
            if (todos.length === 0) {
                console.log(`No todos found for project: ${project}`);
            }
            else {
                console.log(`Todos for ${project}:`);
                console.log("");
                for (const todo of todos) {
                    const icon = todo.status === "completed"
                        ? "\u2713"
                        : todo.status === "in_progress"
                            ? "\u25B6"
                            : "\u25CB";
                    const statusLabel = todo.status === "in_progress" ? "in progress" : todo.status;
                    console.log(`  ${icon} [${statusLabel}] ${todo.content}`);
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