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
const command = process.argv[2];
async function main() {
    switch (command) {
        case "prompt":
        case "pre-tool":
        case "post-tool":
        case "stop":
        case "session-start":
        case "session-end":
        case "notification":
            // Hook events - delegate to hook-handler
            await Promise.resolve().then(() => __importStar(require("./hook-handler")));
            break;
        case "recent":
            await Promise.resolve().then(() => __importStar(require("./recent")));
            break;
        case "status":
            await Promise.resolve().then(() => __importStar(require("./status")));
            break;
        case "clear":
            await Promise.resolve().then(() => __importStar(require("./clear")));
            break;
        case "todos":
            await Promise.resolve().then(() => __importStar(require("./todos")));
            break;
        case "migrate-todos":
            await Promise.resolve().then(() => __importStar(require("./migrate-todos")));
            break;
        case "help":
        case "--help":
        case "-h":
            printHelp();
            break;
        default:
            if (command) {
                console.error(`Unknown command: ${command}`);
            }
            printHelp();
            process.exit(1);
    }
}
function printHelp() {
    console.log(`Claude Status Tracker - Activity monitoring for Claude Code

Usage: claude-status-tracker <command> [options]

Commands:
  recent [options]     Show recent events from the database
  status [options]     Show session status and statistics
  todos [options]      Show todos for a project
  clear [options]      Clear old events from the database
  migrate-todos        Migrate todos from historical events
  help                 Show this help message

Hook Commands (called by Claude Code):
  prompt               Record user prompt event
  pre-tool             Record tool execution event
  stop                 Record idle/stop event
  session-start        Record session start
  session-end          Record session end
  notification         Record notification event

Run 'claude-status-tracker <command> --help' for command-specific help.
`);
}
main().catch((error) => {
    console.error("Error:", error);
    process.exit(1);
});
//# sourceMappingURL=cli.js.map