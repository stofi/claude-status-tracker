---
description: Show recent Claude Code events from the tracking database
---

Show recent events from the Claude Status Tracker database.

Run the command: `claude-status-tracker recent $ARGUMENTS`

Available options for $ARGUMENTS:
- No args: Show last 10 events
- A number (e.g., "20"): Show last N events
- `-j` or `--json`: Output as JSON
- `-p <project>`: Filter by project name (partial match)
- `-t <type>`: Filter by event type (prompt, pre-tool, stop, notification, session-start, session-end)
- `-n <limit>`: Specify number of events

Examples:
- `recent` - Show last 10 events
- `recent 20` - Show last 20 events
- `recent -j` - Output as JSON
- `recent -p myproject` - Filter by project
- `recent -t prompt` - Show only prompt events
