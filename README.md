# Claude Status Tracker

Track Claude Code activity and events to a local SQLite database for monitoring and automation.

## Overview

Claude Status Tracker is a Claude Code plugin that logs all Claude Code events (prompts, tool usage, sessions, notifications) to a persistent SQLite database. This enables:

- Monitoring Claude Code activity across multiple projects
- Building automations that react to Claude Code state
- Analyzing usage patterns and statistics
- Integrating with external tools (status bars, notifications, dashboards)

## Installation

```bash
npm install
npm run build
```

## Configuration

Add the tracker as hooks in your Claude Code settings (`~/.claude/settings.json`):

```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "type": "command",
        "command": "claude-status-tracker prompt"
      }
    ],
    "PreToolUse": [
      {
        "type": "command",
        "command": "claude-status-tracker pre-tool"
      }
    ],
    "Stop": [
      {
        "type": "command",
        "command": "claude-status-tracker stop"
      }
    ],
    "SessionStart": [
      {
        "type": "command",
        "command": "claude-status-tracker session-start"
      }
    ],
    "SessionEnd": [
      {
        "type": "command",
        "command": "claude-status-tracker session-end"
      }
    ],
    "Notification": [
      {
        "type": "command",
        "command": "claude-status-tracker notification"
      }
    ]
  }
}
```

## Usage

### View Recent Events

```bash
claude-status-tracker recent              # Show last 10 events
claude-status-tracker recent 20           # Show last 20 events
claude-status-tracker recent -n 5 -j      # Show last 5 events as JSON
claude-status-tracker recent -p myproj    # Filter by project name
claude-status-tracker recent -t prompt    # Filter by event type
```

### View Status Summary

```bash
claude-status-tracker status              # Show activity summary
claude-status-tracker status -j           # Output as JSON
```

### Clear Old Events

```bash
claude-status-tracker clear               # Clear events older than 7 days
claude-status-tracker clear 30            # Clear events older than 30 days
claude-status-tracker clear --dry-run     # Preview what would be deleted
claude-status-tracker clear --all         # Clear all events
```

## Event Types

| Event Type | Description |
|------------|-------------|
| `prompt` | User submitted a prompt |
| `pre-tool` | Claude is about to use a tool (Bash, Read, Write, Edit, etc.) |
| `stop` | Claude became idle |
| `session-start` | New Claude Code session started |
| `session-end` | Claude Code session ended |
| `notification` | Claude is waiting (for permission, input, or MCP dialog) |

## Database Location

Events are stored in `~/.claude-status-tracker/events.db` (SQLite).

## Development

```bash
# Run commands directly with ts-node
npm run recent
npm run status
npm run clear

# Database management
npm run db:studio    # Open Prisma Studio
npm run db:migrate   # Run migrations
```

## License

MIT
