---
description: Show recent Claude Code events from the tracking database
allowed-tools: ["Bash"]
---

Show recent events from the Claude Status Tracker database.

Run: `claude-status-tracker recent $ARGUMENTS`

Available options:
- No args: Show last 10 events
- A number (e.g., "20"): Show last N events
- `-j` or `--json`: Output as JSON
- `-p <project>`: Filter by project name (partial match)
- `-t <type>`: Filter by event type (prompt, pre-tool, stop, notification, session-start, session-end)
- `-n <limit>`: Specify number of events
