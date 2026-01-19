---
description: Clear old events from the tracking database
---

Clear old events from the Claude Status Tracker database.

Run the command: `claude-status-tracker clear $ARGUMENTS`

Arguments:
- A number (e.g., "30"): Days to keep (default: 7)

Options:
- `--all`: Clear ALL events (use with caution)
- `--dry-run`: Show what would be deleted without deleting
- `-h` or `--help`: Show help

Examples:
- `clear` - Clear events older than 7 days
- `clear 30` - Clear events older than 30 days
- `clear --dry-run` - Preview what would be deleted
- `clear --all` - Clear all events
