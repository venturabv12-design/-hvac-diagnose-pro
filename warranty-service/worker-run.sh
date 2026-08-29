#!/bin/bash
# Launcher for the always-on warranty worker. Kept separate from the LaunchAgent plist
# so the environment can change without reinstalling the service.
#
# The Anthropic key and worker token are read from the macOS login Keychain at start.
# They are never written into this file, the plist, or anything in the repo.
cd "$(dirname "$0")" || exit 1

# launchd gives a job a minimal PATH that does not include /usr/local/bin, so `node`
# must be found by absolute path. Bare `command -v node` silently resolved to nothing
# and the service crash-looped on `exec: : not found`.
NODE=""
for c in /usr/local/bin/node /opt/homebrew/bin/node /usr/bin/node "$HOME/.volta/bin/node"; do
  [ -x "$c" ] && { NODE="$c"; break; }
done
[ -z "$NODE" ] && NODE="$(PATH=/usr/local/bin:/opt/homebrew/bin:$PATH command -v node)"
if [ -z "$NODE" ]; then echo "[worker] no node binary found — cannot start"; exit 1; fi

export SERVICE_URL="${SERVICE_URL:-https://trazermike.io}"
export WORKER_PATH="${WORKER_PATH:-/api/warranty-worker}"

KEY=$(security find-generic-password -a "$USER" -s TRAZER_ANTHROPIC_KEY -w 2>/dev/null)
[ -n "$KEY" ] && export ANTHROPIC_API_KEY="$KEY"
TOK=$(security find-generic-password -a "$USER" -s TRAZER_WORKER_TOKEN -w 2>/dev/null)
[ -n "$TOK" ] && export WORKER_TOKEN="$TOK"

echo "[worker] starting with $NODE at $(date)"
exec "$NODE" local-worker.js
