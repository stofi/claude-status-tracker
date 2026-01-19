#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("./db");
async function main() {
    const args = process.argv.slice(2);
    const json = args.includes("-j") || args.includes("--json");
    try {
        // Get today's date range
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        // Get most recent event
        const latestEvent = await db_1.prisma.event.findFirst({
            orderBy: { timestamp: "desc" },
        });
        // Get events today
        const eventsToday = await db_1.prisma.event.count({
            where: {
                timestamp: {
                    gte: today,
                    lt: tomorrow,
                },
            },
        });
        // Get events by type today
        const eventsByType = await db_1.prisma.event.groupBy({
            by: ["eventType"],
            where: {
                timestamp: {
                    gte: today,
                    lt: tomorrow,
                },
            },
            _count: {
                eventType: true,
            },
        });
        // Get most active projects today
        const projectStats = await db_1.prisma.event.groupBy({
            by: ["project"],
            where: {
                timestamp: {
                    gte: today,
                    lt: tomorrow,
                },
            },
            _count: {
                project: true,
            },
            orderBy: {
                _count: {
                    project: "desc",
                },
            },
            take: 5,
        });
        // Get total events
        const totalEvents = await db_1.prisma.event.count();
        if (json) {
            console.log(JSON.stringify({
                latestEvent,
                eventsToday,
                eventsByType: eventsByType.map((e) => ({
                    type: e.eventType,
                    count: e._count.eventType,
                })),
                topProjects: projectStats.map((p) => ({
                    project: p.project,
                    count: p._count.project,
                })),
                totalEvents,
            }, null, 2));
        }
        else {
            console.log("=== Claude Status Tracker ===\n");
            // Latest activity
            if (latestEvent) {
                const time = latestEvent.timestamp.toLocaleString();
                console.log(`Last activity: ${time}`);
                console.log(`  Project: ${latestEvent.project}`);
                console.log(`  Action: ${latestEvent.action}`);
                if (latestEvent.detail) {
                    console.log(`  Detail: ${latestEvent.detail.substring(0, 60)}`);
                }
            }
            else {
                console.log("No events recorded yet.");
            }
            console.log("");
            // Today's stats
            console.log(`Events today: ${eventsToday}`);
            console.log(`Total events: ${totalEvents}`);
            if (eventsByType.length > 0) {
                console.log("\nEvents by type (today):");
                for (const e of eventsByType) {
                    console.log(`  ${e.eventType}: ${e._count.eventType}`);
                }
            }
            if (projectStats.length > 0) {
                console.log("\nMost active projects (today):");
                for (const p of projectStats) {
                    console.log(`  ${p.project}: ${p._count.project} events`);
                }
            }
        }
    }
    catch (error) {
        console.error("Failed to get status:", error);
        process.exit(1);
    }
    finally {
        await db_1.prisma.$disconnect();
    }
}
main().catch(console.error);
//# sourceMappingURL=status.js.map