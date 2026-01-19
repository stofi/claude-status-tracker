#!/usr/bin/env node

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
      await import("./hook-handler");
      break;

    case "recent":
      await import("./recent");
      break;

    case "status":
      await import("./status");
      break;

    case "clear":
      await import("./clear");
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
  clear [options]      Clear old events from the database
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
