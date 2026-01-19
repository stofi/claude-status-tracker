#!/bin/bash
# Shell wrapper for Claude Code hook
# Usage: hook.sh <event-type>
# Reads JSON from stdin

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Run the compiled JavaScript handler
exec node "$SCRIPT_DIR/dist/hook-handler.js" "$@"
