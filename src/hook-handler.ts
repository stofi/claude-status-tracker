#!/usr/bin/env node
import { prisma } from "./db";
import * as path from "path";

// Todo item from TodoWrite tool
interface TodoItem {
  content: string;
  status: "pending" | "in_progress" | "completed";
  activeForm: string;
}

// Hook input format from Claude Code plugin system
interface HookInput {
  session_id?: string;
  transcript_path?: string;
  cwd?: string;
  permission_mode?: string;
  hook_event_name?: string;
  tool_name?: string;
  tool_input?: {
    command?: string;
    file_path?: string;
    pattern?: string;
    description?: string;
    query?: string;
    url?: string;
    // TodoWrite
    todos?: TodoItem[];
  };
  tool_use_id?: string;
  // UserPromptSubmit
  prompt?: string;
  // SessionStart
  source?: string;
  // SessionEnd
  reason?: string;
  // Stop
  stop_hook_active?: boolean;
  // Notification
  message?: string;
  notification_type?: string;
}

/**
 * Save todos from a TodoWrite event to the database
 */
async function saveTodos(project: string, todos: TodoItem[]): Promise<void> {
  // Validate todos
  const validTodos = todos.filter(
    (t) =>
      typeof t.content === "string" &&
      typeof t.status === "string" &&
      ["pending", "in_progress", "completed"].includes(t.status) &&
      typeof t.activeForm === "string"
  );

  if (validTodos.length === 0) return;

  // Delete existing todos for this project and insert new ones
  await prisma.$transaction(async (tx) => {
    await tx.todo.deleteMany({ where: { project } });
    await tx.todo.createMany({
      data: validTodos.map((todo, index) => ({
        project,
        content: todo.content,
        status: todo.status,
        activeForm: todo.activeForm,
        position: index,
      })),
    });
  });
}

async function main() {
  const eventType = process.argv[2];
  if (!eventType) {
    console.error("No event type provided");
    process.exit(1);
  }

  // Read JSON from stdin
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  const rawInput = Buffer.concat(chunks).toString("utf-8");

  let input: HookInput = {};
  try {
    input = JSON.parse(rawInput);
  } catch {
    // Empty or invalid JSON is ok for some events
  }

  const project = input.cwd ? path.basename(input.cwd) : "unknown";

  let tool: string | null = null;
  let action: string;
  let detail: string | null = null;
  let source: string | null = null;
  let reason: string | null = null;

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
        case "TodoWrite":
          action = "Update todos";
          const todoCount = toolInput.todos?.length || 0;
          detail = `${todoCount} todo${todoCount !== 1 ? "s" : ""}`;
          // Save todos to the database
          if (toolInput.todos && toolInput.todos.length > 0) {
            await saveTodos(project, toolInput.todos);
          }
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
    await prisma.event.create({
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
  } catch (error) {
    console.error("Failed to save event:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
