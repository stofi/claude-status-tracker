#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("./db");
function parseTodosFromRawInput(rawInput) {
    try {
        const parsed = JSON.parse(rawInput);
        const todos = parsed?.tool_input?.todos;
        if (!Array.isArray(todos))
            return [];
        return todos.filter((t) => typeof t === "object" &&
            t !== null &&
            typeof t.content === "string" &&
            typeof t.status === "string" &&
            ["pending", "in_progress", "completed"].includes(t.status) &&
            typeof t.activeForm === "string");
    }
    catch {
        return [];
    }
}
async function main() {
    const args = process.argv.slice(2);
    const dryRun = args.includes("--dry-run") || args.includes("-n");
    const help = args.includes("--help") || args.includes("-h");
    if (help) {
        console.log(`Usage: claude-status-tracker migrate-todos [options]

Migrate todos from historical TodoWrite events to the Todo table.

Options:
  -n, --dry-run  Show what would be migrated without making changes
  -h, --help     Show this help message
`);
        await db_1.prisma.$disconnect();
        return;
    }
    console.log("Scanning for TodoWrite events...");
    try {
        // Find all TodoWrite events with rawInput
        const todoEvents = await db_1.prisma.event.findMany({
            where: {
                tool: "TodoWrite",
                rawInput: { not: null },
            },
            orderBy: { timestamp: "desc" },
            select: {
                id: true,
                project: true,
                timestamp: true,
                rawInput: true,
            },
        });
        if (todoEvents.length === 0) {
            console.log("No TodoWrite events found.");
            await db_1.prisma.$disconnect();
            return;
        }
        console.log(`Found ${todoEvents.length} TodoWrite events.`);
        // Group by project and get the most recent for each
        const projectMap = new Map();
        for (const event of todoEvents) {
            if (!event.rawInput)
                continue;
            const existing = projectMap.get(event.project);
            if (!existing || event.timestamp > existing.timestamp) {
                projectMap.set(event.project, {
                    timestamp: event.timestamp,
                    rawInput: event.rawInput,
                });
            }
        }
        console.log(`Found ${projectMap.size} unique projects with todos.`);
        console.log("");
        let totalMigrated = 0;
        for (const [project, data] of projectMap) {
            const todos = parseTodosFromRawInput(data.rawInput);
            if (todos.length === 0) {
                console.log(`  ${project}: No valid todos found`);
                continue;
            }
            console.log(`  ${project}: ${todos.length} todo${todos.length !== 1 ? "s" : ""}`);
            for (const todo of todos) {
                const icon = todo.status === "completed"
                    ? "\u2713"
                    : todo.status === "in_progress"
                        ? "\u25B6"
                        : "\u25CB";
                console.log(`    ${icon} ${todo.content.substring(0, 60)}`);
            }
            if (!dryRun) {
                // Check if project already has todos
                const existingCount = await db_1.prisma.todo.count({ where: { project } });
                if (existingCount > 0) {
                    console.log(`    -> Skipped (${existingCount} todos already exist)`);
                    continue;
                }
                // Insert todos
                await db_1.prisma.todo.createMany({
                    data: todos.map((todo, index) => ({
                        project,
                        content: todo.content,
                        status: todo.status,
                        activeForm: todo.activeForm,
                        position: index,
                    })),
                });
                totalMigrated += todos.length;
                console.log(`    -> Migrated`);
            }
        }
        console.log("");
        if (dryRun) {
            console.log("Dry run complete. No changes made.");
        }
        else {
            console.log(`Migration complete. ${totalMigrated} todos migrated.`);
        }
    }
    catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
    finally {
        await db_1.prisma.$disconnect();
    }
}
main().catch(console.error);
//# sourceMappingURL=migrate-todos.js.map