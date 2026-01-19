# Claude Status DB Plugin Implementation Plan

## Overview

Convert the current claude-status-db project into a Claude Code plugin that automatically tracks events without requiring manual hook configuration in `~/.claude/settings.json`.

## Plugin Name

**`claude-status-tracker`** - Activity monitoring and event logging for Claude Code

## Proposed Directory Structure

```
claude-status-tracker/
├── .claude-plugin/
│   └── plugin.json              # Plugin manifest
├── hooks/
│   └── hooks.json               # Hook definitions (auto-registered)
├── commands/
│   ├── status.md                # /claude-status-tracker:status
│   ├── recent.md                # /claude-status-tracker:recent
│   └── clear.md                 # /claude-status-tracker:clear
├── scripts/
│   ├── hook-handler.js          # Compiled hook handler
│   └── recent.js                # Compiled query tool
├── prisma/
│   └── schema.prisma            # Database schema
├── src/
│   ├── hook-handler.ts          # Source: event handler
│   └── recent.ts                # Source: query tool
├── package.json
├── tsconfig.json
└── README.md
```

## Plugin Manifest

**File**: `.claude-plugin/plugin.json`

```json
{
  "name": "claude-status-tracker",
  "description": "Track Claude Code activity and events to a local SQLite database for monitoring and automation",
  "version": "1.0.0",
  "author": {
    "name": "kurishutofu"
  },
  "repository": "https://github.com/kurishutofu/claude-status-tracker",
  "license": "MIT",
  "keywords": ["monitoring", "logging", "events", "status", "hooks"]
}
```

## Hooks Configuration

**File**: `hooks/hooks.json`

```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node ${PLUGIN_DIR}/scripts/hook-handler.js prompt",
            "timeout": 5
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "node ${PLUGIN_DIR}/scripts/hook-handler.js pre-tool",
            "timeout": 5
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node ${PLUGIN_DIR}/scripts/hook-handler.js stop",
            "timeout": 5
          }
        ]
      }
    ],
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node ${PLUGIN_DIR}/scripts/hook-handler.js session-start",
            "timeout": 5
          }
        ]
      }
    ],
    "SessionEnd": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node ${PLUGIN_DIR}/scripts/hook-handler.js session-end",
            "timeout": 5
          }
        ]
      }
    ],
    "Notification": [
      {
        "matcher": "permission_prompt",
        "hooks": [
          {
            "type": "command",
            "command": "node ${PLUGIN_DIR}/scripts/hook-handler.js notification",
            "timeout": 5
          }
        ]
      },
      {
        "matcher": "idle_prompt",
        "hooks": [
          {
            "type": "command",
            "command": "node ${PLUGIN_DIR}/scripts/hook-handler.js notification",
            "timeout": 5
          }
        ]
      },
      {
        "matcher": "elicitation_dialog",
        "hooks": [
          {
            "type": "command",
            "command": "node ${PLUGIN_DIR}/scripts/hook-handler.js notification",
            "timeout": 5
          }
        ]
      }
    ]
  }
}
```

## Slash Commands

### `/claude-status-tracker:recent`

**File**: `commands/recent.md`

```markdown
---
description: Show recent Claude Code events from the tracking database
---

Run the recent events query tool with the user's arguments: $ARGUMENTS

Available options:
- No args: Show last 10 events
- A number: Show last N events (e.g., "20")
- `-j` or `--json`: Output as JSON
- `-p <project>`: Filter by project name
- `-t <type>`: Filter by event type (prompt, pre-tool, stop, notification, session-start, session-end)

Execute: `node ${PLUGIN_DIR}/scripts/recent.js $ARGUMENTS`
```

### `/claude-status-tracker:status`

**File**: `commands/status.md`

```markdown
---
description: Show current Claude Code session status and statistics
---

Query the database for session statistics:
- Current active session (if any)
- Total events today
- Events by type breakdown
- Most active projects

Execute: `node ${PLUGIN_DIR}/scripts/status.js`
```

### `/claude-status-tracker:clear`

**File**: `commands/clear.md`

```markdown
---
description: Clear old events from the tracking database
---

Clear events older than the specified number of days. Default: 7 days.

Arguments: $ARGUMENTS (number of days to keep)

Execute: `node ${PLUGIN_DIR}/scripts/clear.js $ARGUMENTS`
```

## Implementation Steps

### Phase 1: Restructure Project

1. Create new directory structure following plugin conventions
2. Move `.claude-plugin/plugin.json` manifest
3. Create `hooks/hooks.json` with all hook definitions
4. Move compiled scripts to `scripts/` directory

### Phase 2: Update Hook Handler

1. **Database path resolution**: Use `CLAUDE_PROJECT_DIR` or a fixed location like `~/.claude-status-tracker/events.db`
2. **Remove hardcoded paths**: Make paths relative to plugin directory or user home
3. **Add initialization**: Auto-create database on first run

```typescript
// Database location options:
// Option A: User's home directory (shared across all projects)
const dbPath = path.join(os.homedir(), '.claude-status-tracker', 'events.db');

// Option B: Plugin directory (bundled with plugin)
const dbPath = path.join(__dirname, '..', 'data', 'events.db');
```

### Phase 3: Add New Scripts

1. **status.js**: Session statistics and overview
2. **clear.js**: Database maintenance/cleanup
3. Update `recent.js` for plugin context

### Phase 4: Create Slash Commands

1. Write markdown command files
2. Test command invocation via `/claude-status-tracker:recent`

### Phase 5: Packaging

1. Update `package.json` with plugin metadata
2. Add installation script to initialize database
3. Create README with installation instructions

## Database Location Strategy

**Recommended**: Store database in user's home directory for cross-project persistence.

```
~/.claude-status-tracker/
├── events.db          # SQLite database
└── config.json        # Optional user configuration
```

**Pros**:
- Events persist across all projects
- Single source of truth for monitoring
- Survives plugin updates

**Alternative**: Store in plugin directory (simpler but less persistent)

## Installation Flow

```bash
# Via marketplace (future)
claude plugin marketplace add https://github.com/kurishutofu/claude-status-tracker
claude plugin install claude-status-tracker

# Via local directory (development)
claude --plugin-dir /path/to/claude-status-tracker

# The plugin will:
# 1. Auto-register hooks (no manual settings.json editing)
# 2. Create database on first event
# 3. Provide slash commands for querying
```

## Migration Path

For users with existing `~/.claude/settings.json` hooks:

1. Install the plugin
2. Remove manual hook entries from `settings.json`
3. Migrate existing `dev.db` data to new location (optional script)

## Open Questions

1. **Plugin path variable**: Does Claude Code provide `${PLUGIN_DIR}` in hook commands, or do we need absolute paths?
   - May need to use a setup script that writes absolute paths

2. **Database bundling**: Should we bundle better-sqlite3 native bindings, or require user to have them?
   - Consider using a pure JS SQLite implementation for portability

3. **Configuration**: Should users be able to configure which events to track?
   - Could add a `config.json` in the plugin for customization

## Future Enhancements

1. **Web dashboard**: Local web UI for viewing events
2. **Webhooks**: Send events to external services
3. **Notifications**: Desktop notifications for specific events
4. **Analytics**: Usage patterns and insights
5. **Export**: Export events to CSV/JSON for analysis
