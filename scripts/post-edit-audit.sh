#!/bin/bash
# Hook C — Trazer safety harness
# Post-edit audit for public/index.html.
#
# Hardened in chore(hooks) push:
#   - Was informational-only (always exit 0). Now BLOCKS (exit 2) on any
#     drift in the audit gates (parseJSON / renderDiagCards / JOB_SAVED /
#     data-lucide= / brace delta / index.js SHA).
#   - Added a content verifier: extracts the body of every locked function
#     from public/index.html via scripts/locked-body-hash.py and compares
#     SHA-256 hashes against the HEAD baseline. This catches the
#     anchor-bypass that Hook A cannot see (Edit input that omits the
#     function declaration line — the body still changes on disk and the
#     hash drifts here regardless of what tool-input text the agent used).
#   - Override use is appended to .claude/override.log.
#
# Snapshot file: .claude/audit-snapshot.json (gitignored)
# Auto-refreshes when git HEAD advances (i.e. after a commit).

set +e

REPO_ROOT="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null)}"
OVERRIDE_LOG="${REPO_ROOT:-.}/.claude/override.log"

log_override() {
  local ts
  ts=$(date -u +%Y-%m-%dT%H:%M:%SZ 2>/dev/null)
  mkdir -p "$(dirname "$OVERRIDE_LOG")" 2>/dev/null
  printf '%s [hook=C] [pid=%s ppid=%s] %s\n' "$ts" "$$" "$PPID" "$1" >> "$OVERRIDE_LOG" 2>/dev/null
}

if [ "${TRAZER_HOOK_OVERRIDE:-0}" = "1" ]; then
  echo "[post-edit-audit] TRAZER_HOOK_OVERRIDE=1 — bypassing drift block." >&2
  log_override "override-bypass"
  exit 0
fi

# Argv mode (no stdin JSON) — noop.
if [ -n "${1:-}" ]; then
  exit 0
fi

JSON=$(cat 2>/dev/null)
# If stdin was empty (e.g. invoked manually with no args and no JSON), noop.
if [ -z "$JSON" ]; then
  exit 0
fi

FILE_PATH=$(printf '%s' "$JSON" | /usr/bin/python3 -c '
import sys, json
try:
    d = json.load(sys.stdin)
    print(d.get("tool_input", {}).get("file_path", ""))
except Exception:
    pass
' 2>/dev/null)

# Only audit public/index.html — skip everything else silently.
case "$FILE_PATH" in
  */public/index.html | public/index.html) ;;
  *) exit 0 ;;
esac

if [ -z "$REPO_ROOT" ] || [ ! -d "$REPO_ROOT" ]; then
  exit 0
fi
cd "$REPO_ROOT" 2>/dev/null || exit 0

SNAPSHOT="$REPO_ROOT/.claude/audit-snapshot.json"
HASHER="$REPO_ROOT/scripts/locked-body-hash.py"
HEAD_SHA=$(git rev-parse HEAD 2>/dev/null)
[ -z "$HEAD_SHA" ] && exit 0

# Current working-tree counts
CUR_PARSEJSON=$(grep -c 'parseJSON' public/index.html 2>/dev/null || echo 0)
CUR_RENDER=$(grep -c 'renderDiagCards' public/index.html 2>/dev/null || echo 0)
CUR_JOBSAVED=$(grep -c 'JOB_SAVED' public/index.html 2>/dev/null || echo 0)
CUR_LUCIDE=$(grep -c 'data-lucide=' public/index.html 2>/dev/null || echo 0)
CUR_OPEN=$(awk -F'{' '{c+=NF-1} END{print c}' public/index.html 2>/dev/null)
CUR_CLOSE=$(awk -F'}' '{c+=NF-1} END{print c}' public/index.html 2>/dev/null)
CUR_DELTA=$((${CUR_OPEN:-0} - ${CUR_CLOSE:-0}))
CUR_INDEXJS=$(shasum -a 256 index.js 2>/dev/null | awk '{print $1}')

# Current locked-function body hashes
CUR_BODIES=""
if [ -x "$HASHER" ] || [ -r "$HASHER" ]; then
  CUR_BODIES=$(/usr/bin/python3 "$HASHER" public/index.html 2>/dev/null)
fi

# Refresh snapshot if missing or HEAD changed.
need_refresh=0
if [ ! -f "$SNAPSHOT" ]; then
  need_refresh=1
else
  SNAP_SHA=$(sed -n 's/.*"head_sha"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "$SNAPSHOT" | head -1)
  [ "$SNAP_SHA" != "$HEAD_SHA" ] && need_refresh=1
fi

if [ "$need_refresh" = "1" ]; then
  BL_HTML=$(git show "HEAD:public/index.html" 2>/dev/null)
  if [ -z "$BL_HTML" ]; then exit 0; fi
  BL_PARSEJSON=$(printf '%s' "$BL_HTML" | grep -c 'parseJSON')
  BL_RENDER=$(printf '%s' "$BL_HTML" | grep -c 'renderDiagCards')
  BL_JOBSAVED=$(printf '%s' "$BL_HTML" | grep -c 'JOB_SAVED')
  BL_LUCIDE=$(printf '%s' "$BL_HTML" | grep -c 'data-lucide=')
  BL_OPEN=$(printf '%s' "$BL_HTML" | awk -F'{' '{c+=NF-1} END{print c}')
  BL_CLOSE=$(printf '%s' "$BL_HTML" | awk -F'}' '{c+=NF-1} END{print c}')
  BL_DELTA=$((${BL_OPEN:-0} - ${BL_CLOSE:-0}))
  BL_INDEXJS=$(git show "HEAD:index.js" 2>/dev/null | shasum -a 256 | awk '{print $1}')

  # Baseline locked-function body hashes from HEAD
  BL_BODIES=""
  if [ -r "$HASHER" ]; then
    BL_BODIES=$(printf '%s' "$BL_HTML" | /usr/bin/python3 "$HASHER" - 2>/dev/null)
  fi

  mkdir -p "$REPO_ROOT/.claude"
  {
    printf '{\n'
    printf '  "head_sha": "%s",\n' "$HEAD_SHA"
    printf '  "parseJSON": %s,\n' "$BL_PARSEJSON"
    printf '  "renderDiagCards": %s,\n' "$BL_RENDER"
    printf '  "JOB_SAVED": %s,\n' "$BL_JOBSAVED"
    printf '  "data-lucide": %s,\n' "$BL_LUCIDE"
    printf '  "brace_delta": %s,\n' "$BL_DELTA"
    printf '  "indexjs_sha256": "%s",\n' "$BL_INDEXJS"
    printf '  "body_hashes": {\n'
    # Convert lines to JSON entries. Strip trailing comma on the last entry.
    BODY_JSON=$(printf '%s' "$BL_BODIES" | awk -F'\t' '
      {
        if (NR > 1) print ",";
        printf("    \"%s\": \"%s\"", $1, $2);
      }
      END { print "" }
    ')
    printf '%s\n' "$BODY_JSON"
    printf '  }\n'
    printf '}\n'
  } > "$SNAPSHOT"
fi

# Load snapshot fields
SNAP_PARSEJSON=$(sed -n 's/.*"parseJSON"[[:space:]]*:[[:space:]]*\([0-9]*\).*/\1/p' "$SNAPSHOT" | head -1)
SNAP_RENDER=$(sed -n 's/.*"renderDiagCards"[[:space:]]*:[[:space:]]*\([0-9]*\).*/\1/p' "$SNAPSHOT" | head -1)
SNAP_JOBSAVED=$(sed -n 's/.*"JOB_SAVED"[[:space:]]*:[[:space:]]*\([0-9]*\).*/\1/p' "$SNAPSHOT" | head -1)
SNAP_LUCIDE=$(sed -n 's/.*"data-lucide"[[:space:]]*:[[:space:]]*\([0-9]*\).*/\1/p' "$SNAPSHOT" | head -1)
SNAP_DELTA=$(sed -n 's/.*"brace_delta"[[:space:]]*:[[:space:]]*\(-\{0,1\}[0-9]*\).*/\1/p' "$SNAPSHOT" | head -1)
SNAP_INDEXJS=$(sed -n 's/.*"indexjs_sha256"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "$SNAPSHOT" | head -1)

DRIFT=0

# Count + sha drift checks
compare() {
  local label="$1" snap="$2" cur="$3"
  if [ "$snap" != "$cur" ]; then
    echo "[post-edit-audit] DRIFT: $label snapshot=$snap current=$cur" >&2
    DRIFT=1
  fi
}
compare "parseJSON"        "$SNAP_PARSEJSON" "$CUR_PARSEJSON"
compare "renderDiagCards"  "$SNAP_RENDER"    "$CUR_RENDER"
compare "JOB_SAVED"        "$SNAP_JOBSAVED"  "$CUR_JOBSAVED"
compare "data-lucide"      "$SNAP_LUCIDE"    "$CUR_LUCIDE"
compare "brace_delta"      "$SNAP_DELTA"     "$CUR_DELTA"
compare "indexjs_sha256"   "$SNAP_INDEXJS"   "$CUR_INDEXJS"

# Locked-function body hash drift check. The snapshot stores hashes inside
# a nested body_hashes block; we extract `"NAME": "HASH"` lines via sed.
if [ -n "$CUR_BODIES" ]; then
  while IFS=$'\t' read -r name cur_hash; do
    [ -z "$name" ] && continue
    snap_hash=$(sed -n "s/.*\"${name}\"[[:space:]]*:[[:space:]]*\"\([^\"]*\)\".*/\1/p" "$SNAPSHOT" | head -1)
    if [ -z "$snap_hash" ]; then
      # Snapshot doesn't have this function — first-run case; not drift.
      continue
    fi
    if [ "$snap_hash" != "$cur_hash" ]; then
      echo "[post-edit-audit] BODY DRIFT: $name snapshot=$snap_hash current=$cur_hash" >&2
      DRIFT=1
    fi
  done <<< "$CUR_BODIES"
fi

if [ "$DRIFT" = "1" ]; then
  echo "[post-edit-audit] BLOCKED: locked-region or audit-gate drift detected (see lines above)." >&2
  echo "[post-edit-audit] If this drift is intentional, set TRAZER_HOOK_OVERRIDE=1 to bypass and commit the change so the snapshot refreshes." >&2
  exit 2
fi

exit 0
