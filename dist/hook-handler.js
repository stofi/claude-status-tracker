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
async function main() {
    const eventType = process.argv[2];
    if (!eventType) {
        console.error("No event type provided");
        process.exit(1);
    }
    // Read JSON from stdin
    const chunks = [];
    for await (const chunk of process.stdin) {
        chunks.push(chunk);
    }
    const rawInput = Buffer.concat(chunks).toString("utf-8");
    let input = {};
    try {
        input = JSON.parse(rawInput);
    }
    catch {
        // Empty or invalid JSON is ok for some events
    }
    const project = input.cwd ? path.basename(input.cwd) : "unknown";
    let tool = null;
    let action;
    let detail = null;
    let source = null;
    let reason = null;
    switch (eventType) {
        case "prompt":
            action = "User prompt";
            detail = input.prompt?.substring(0, 500) || null;
            break;
        case "pre-tool":
            tool = input.tool_name || "Unknown";
            const toolInput = input.tool_input || {};
            switch (tool) {
                case "Bash":
                    action = "Run command";
                    detail = toolInput.command?.substring(0, 500) || null;
                    break;
                case "Write":
                    action = "Write file";
                    detail = toolInput.file_path ? path.basename(toolInput.file_path) : null;
                    break;
                case "Edit":
                    action = "Edit file";
                    detail = toolInput.file_path ? path.basename(toolInput.file_path) : null;
                    break;
                case "Read":
                    action = "Read file";
                    detail = toolInput.file_path ? path.basename(toolInput.file_path) : null;
                    break;
                case "Glob":
                case "Grep":
                    action = "Search";
                    detail = toolInput.pattern?.substring(0, 200) || null;
                    break;
                case "Task":
                    action = "Subagent task";
                    detail = toolInput.description?.substring(0, 200) || null;
                    break;
                case "WebSearch":
                    action = "Web search";
                    detail = toolInput.query?.substring(0, 200) || null;
                    break;
                case "WebFetch":
                    action = "Fetch URL";
                    detail = toolInput.url?.substring(0, 500) || null;
                    break;
                default:
                    action = `Tool: ${tool}`;
                    break;
            }
            break;
        case "post-tool":
            // Skip post-tool to reduce noise
            process.exit(0);
        case "stop":
            action = "Idle";
            break;
        case "session-start":
            action = "Session started";
            source = input.source || null;
            break;
        case "session-end":
            action = "Session ended";
            reason = input.reason || null;
            break;
        case "notification":
            // Handle different notification types
            const notificationType = input.notification_type || "unknown";
            switch (notificationType) {
                case "permission_prompt":
                    action = "Waiting for permission";
                    // Try to get the tool from the message if available
                    detail = input.message?.substring(0, 500) || null;
                    break;
                case "idle_prompt":
                    action = "Waiting for input";
                    detail = input.message?.substring(0, 500) || null;
                    break;
                case "elicitation_dialog":
                    action = "MCP dialog waiting";
                    detail = input.message?.substring(0, 500) || null;
                    break;
                default:
                    action = `Notification: ${notificationType}`;
                    detail = input.message?.substring(0, 500) || null;
            }
            break;
        default:
            action = `Unknown event: ${eventType}`;
    }
    try {
        await db_1.prisma.event.create({
            data: {
                eventType,
                project,
                tool,
                action,
                detail,
                source,
                reason,
                rawInput: rawInput.substring(0, 10000), // Limit stored raw input
            },
        });
    }
    catch (error) {
        console.error("Failed to save event:", error);
        process.exit(1);
    }
    finally {
        await db_1.prisma.$disconnect();
    }
}
main();
//# sourceMappingURL=hook-handler.js.map