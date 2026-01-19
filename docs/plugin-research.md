# Claude Code Plugin System Research

## Sources

- [Create plugins - Claude Code Docs](https://code.claude.com/docs/en/plugins)
- [Hooks reference - Claude Code Docs](https://code.claude.com/docs/en/hooks)
- [GitHub - anthropics/claude-code plugins](https://github.com/anthropics/claude-code/blob/main/plugins/README.md)
- [Claude Code Plugin CLI: The Missing Manual](https://medium.com/@garyjarrel/claude-code-plugin-cli-the-missing-manual-0a4d3a7c99ce)
- [Claude Code Plugins & Agent Skills - Community Registry](https://claude-plugins.dev/)

## Plugin System Overview

Claude Code plugins are extensions that enhance Claude Code with:
- Custom slash commands
- Specialized agents
- Hooks (event handlers)
- MCP servers
- LSP servers

Plugins can be shared across projects and teams via marketplaces.

## Plugin Directory Structure

```
my-plugin/
├── .claude-plugin/
│   └── plugin.json          # Required manifest (ONLY file in .claude-plugin/)
├── commands/                # Optional - slash commands
│   └── hello.md
├── agents/                  # Optional - custom agents
├── skills/                  # Optional - Agent Skills
│   └── code-review/
│       └── SKILL.md
├── hooks/                   # Optional - event handlers
│   └── hooks.json
├── .mcp.json               # Optional - MCP servers
└── .lsp.json               # Optional - LSP servers
```

**Critical Rule**: Only `plugin.json` goes inside `.claude-plugin/`. All other directories must be at the plugin root level.

## Plugin Manifest Format

**File**: `.claude-plugin/plugin.json`

```json
{
  "name": "my-plugin",
  "description": "Plugin description",
  "version": "1.0.0",
  "author": {
    "name": "Your Name"
  },
  "homepage": "https://github.com/...",
  "repository": "https://github.com/...",
  "license": "MIT"
}
```

## Hook Events

| Event | Purpose | Matcher Support |
|-------|---------|-----------------|
| **PreToolUse** | Before tool execution | Yes |
| **PermissionRequest** | When permission dialog shown | Yes |
| **PostToolUse** | After tool completes | Yes |
| **Notification** | When notifications sent | Yes |
| **UserPromptSubmit** | Before processing user prompt | No |
| **Stop** | When agent finishes | No |
| **SubagentStop** | When subagent finishes | No |
| **PreCompact** | Before context compaction | Yes |
| **SessionStart** | Session initialization | Yes |
| **SessionEnd** | Session termination | No |

## Hook Input Structure (via stdin)

All hooks receive JSON input via stdin:

```json
{
  "session_id": "abc123",
  "transcript_path": "/path/to/transcript.jsonl",
  "cwd": "/current/working/directory",
  "permission_mode": "default",
  "hook_event_name": "PreToolUse",
  "tool_name": "Bash",
  "tool_input": { /* tool-specific */ },
  "tool_use_id": "toolu_01ABC123..."
}
```

### Event-Specific Inputs

**UserPromptSubmit:**
```json
{
  "hook_event_name": "UserPromptSubmit",
  "prompt": "User's input text"
}
```

**SessionStart:**
```json
{
  "hook_event_name": "SessionStart",
  "source": "startup"  // or "resume", "clear", "compact"
}
```

**SessionEnd:**
```json
{
  "hook_event_name": "SessionEnd",
  "reason": "user_exit"  // or other reasons
}
```

**Stop:**
```json
{
  "hook_event_name": "Stop",
  "stop_hook_active": true
}
```

**Notification:**
```json
{
  "hook_event_name": "Notification",
  "message": "Claude needs your permission to use Bash",
  "notification_type": "permission_prompt"  // or "idle_prompt", "elicitation_dialog"
}
```

## Notification Types

| Type | When Triggered |
|------|----------------|
| `permission_prompt` | Claude needs permission approval |
| `idle_prompt` | Claude waiting for input (may fire frequently) |
| `elicitation_dialog` | MCP tool needs input |

## Hooks Configuration Format

**File**: `hooks/hooks.json`

```json
{
  "hooks": {
    "EventName": [
      {
        "matcher": "ToolPattern",
        "hooks": [
          {
            "type": "command",
            "command": "script.sh",
            "timeout": 60
          }
        ]
      }
    ]
  }
}
```

## Environment Variables Available to Hooks

- `CLAUDE_PROJECT_DIR` - Absolute path to project root
- `CLAUDE_ENV_FILE` - File path for persisting environment variables (SessionStart only)
- `CLAUDE_CODE_REMOTE` - "true" if running in web environment

## Testing Plugins Locally

```bash
# Single plugin
claude --plugin-dir ./my-plugin

# Multiple plugins
claude --plugin-dir ./plugin-one --plugin-dir ./plugin-two
```

## Plugin CLI Commands

```bash
# Marketplace management
claude plugin marketplace add <url-or-repo>
claude plugin marketplace list
claude plugin marketplace update <n>
claude plugin marketplace remove <n>

# Plugin management (via /plugin command in Claude Code)
/plugin install <name>
/plugin list
/plugin enable <name>
/plugin disable <name>
```

## Existing Similar Plugins

Based on community registry search: **No existing plugins** specifically for status monitoring, event logging, or activity tracking were found. This represents a gap in the ecosystem.

## Official Plugin Examples

From the anthropic/claude-code repository:

| Plugin | Relevance to Our Use Case |
|--------|---------------------------|
| **hookify** | Custom hook creation - similar concept |
| **security-guidance** | Pattern monitoring - similar logging approach |
| **explanatory-output-style** | SessionStart hook usage |

## Key Implementation Considerations

1. **Hook scripts must be executable** and handle stdin JSON
2. **Exit codes matter**: 0 = success, 2 = blocking error, other = non-blocking
3. **Timeout default**: 60 seconds per hook
4. **All matching hooks run in parallel**
5. **Plugins are namespaced**: `/plugin-name:command`
