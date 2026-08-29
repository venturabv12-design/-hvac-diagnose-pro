#!/bin/bash
# Launcher for the always-on warranty worker. Kept separate from the LaunchAgent plist
# so the environment can change without reinstalling the service.
#
# The Anthropic key is read from the macOS Keychain at start — it is never written into
# this file, the plist, or any file in the repo.
cd "$(dirname "$0")" || exit 1

export SERVICE_URL="${SERVICE_URL:-https://trazermike.io}"
export WORKER_PATH="${WORKER_PATH:-/api/warranty-worker}"

KEY=$(security find-generic-password -a "$USER" -s TRAZER_ANTHROPIC_KEY -w 2>/dev/null)
[ -n "$KEY" ] && export ANTHROPIC_API_KEY="$KEY"
TOK=$(security find-generic-password -a "$USER" -s TRAZER_WORKER_TOKEN -w 2>/dev/null)
[ -n "$TOK" ] && export WORKER_TOKEN="$TOK"

exec "$(command -v node)" local-worker.js
