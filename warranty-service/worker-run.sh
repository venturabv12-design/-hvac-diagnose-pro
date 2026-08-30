#!/bin/bash
# Launcher for the always-on warranty worker. Kept separate from the LaunchAgent plist
# so the environment can change without reinstalling the service.
#
# The Anthropic key and worker token are read from the macOS login Keychain at start.
# They are never written into this file, the plist, or anything in the repo.
cd "$(dirname "$0")" || exit 1
REPO_ROOT="$(cd .. && pwd)"

# launchd gives a job a minimal PATH that does not include /usr/local/bin, so `node`
# must be found by absolute path. Bare `command -v node` silently resolved to nothing
# and the service crash-looped on `exec: : not found`.
NODE=""
for c in /usr/local/bin/node /opt/homebrew/bin/node /usr/bin/node "$HOME/.volta/bin/node"; do
  [ -x "$c" ] && { NODE="$c"; break; }
done
[ -z "$NODE" ] && NODE="$(PATH=/usr/local/bin:/opt/homebrew/bin:$PATH command -v node)"
if [ -z "$NODE" ]; then echo "[worker] no node binary found — cannot start"; exit 1; fi

GIT=""
for c in /usr/bin/git /usr/local/bin/git /opt/homebrew/bin/git; do
  [ -x "$c" ] && { GIT="$c"; break; }
done

# SELF-UPDATE. This clone is the code that actually does every manufacturer lookup, and
# it does not share a checkout with anything else — so without this it runs whatever
# commit it was last hand-copied at, forever, while fixes land on main and appear to be
# live. Fast-forward only: a dirty or diverged clone is left exactly as it is rather
# than being force-reset, because losing a local fix silently is worse than running an
# old one loudly.
if [ -n "$GIT" ] && [ -d "$REPO_ROOT/.git" ]; then
  if [ -z "$($GIT -C "$REPO_ROOT" status --porcelain)" ]; then
    if $GIT -C "$REPO_ROOT" fetch --quiet origin main 2>/dev/null &&
       $GIT -C "$REPO_ROOT" merge --ff-only --quiet origin/main 2>/dev/null; then
      echo "[worker] updated to $($GIT -C "$REPO_ROOT" rev-parse --short HEAD)"
    else
      echo "[worker] could not fast-forward — staying on $($GIT -C "$REPO_ROOT" rev-parse --short HEAD)"
    fi
  else
    echo "[worker] local changes present — not auto-updating"
  fi
  # Dependencies only when they are actually missing; npm on every boot is wasted time.
  [ -d node_modules ] || (cd "$(dirname "$0")" && npm install --omit=dev --no-audit --no-fund >/dev/null 2>&1)
fi

# KILL ANY CHROME STILL HOLDING OUR PROFILE. browser.close() over CDP only disconnects —
# the Chrome process keeps running and keeps its debugging port open, so a restarted
# worker reattaches to a stale instance instead of a clean one. Left unchecked these
# accumulate: on 2026-08-30 twelve orphaned Chromes were competing for the machine and
# Carrier lookups failed through the worker while succeeding from a fresh browser in the
# same minute. Only ever targets our own profile — never a Chrome Brandon is using.
pkill -f "user-data-dir=$HOME/.trazer-worker-chrome" 2>/dev/null && echo "[worker] cleared a stale Chrome"
sleep 1

export SERVICE_URL="${SERVICE_URL:-https://trazermike.io}"
export WORKER_PATH="${WORKER_PATH:-/api/warranty-worker}"

KEY=$(security find-generic-password -a "$USER" -s TRAZER_ANTHROPIC_KEY -w 2>/dev/null)
[ -n "$KEY" ] && export ANTHROPIC_API_KEY="$KEY"
TOK=$(security find-generic-password -a "$USER" -s TRAZER_WORKER_TOKEN -w 2>/dev/null)
[ -n "$TOK" ] && export WORKER_TOKEN="$TOK"

echo "[worker] starting with $NODE at $(date)"
exec "$NODE" local-worker.js
