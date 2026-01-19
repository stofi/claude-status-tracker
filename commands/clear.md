---
description: Clear old events from the tracking database
allowed-tools: ["Bash"]
---

Clear old events from the Claude Status Tracker database.

Run: `claude-status-tracker clear $ARGUMENTS`

Arguments:
- A number (e.g., "30"): Days to keep (default: 7)

Options:
- `--all`: Clear ALL events (use with caution)
- `--dry-run`: Show what would be deleted without deleting
