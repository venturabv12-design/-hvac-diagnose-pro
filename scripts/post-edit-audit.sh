#!/bin/bash
# Hook C — Trazer safety harness
# Post-edit audit for public/index.html. Snapshots counts at git HEAD and
# reports any drift after each edit. Informational only — ALWAYS exits 0.
#
# Snapshot file: .claude/audit-snapshot.json (gitignored via .claude/.gitignore)
# Auto-refreshes when git HEAD advances (i.e. after a commit).

set +e

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

REPO_ROOT="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null)}"
if [ -z "$REPO_ROOT" ] || [ ! -d "$REPO_ROOT" ]; then
  exit 0
fi
cd "$REPO_ROOT" 2>/dev/null || exit 0

SNAPSHOT="$REPO_ROOT/.claude/audit-snapshot.json"
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

# Refresh snapshot if missing or HEAD changed
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

  mkdir -p "$REPO_ROOT/.claude"
  cat > "$SNAPSHOT" <<EOF
{
  "head_sha": "$HEAD_SHA",
  "parseJSON": $BL_PARSEJSON,
  "renderDiagCards": $BL_RENDER,
  "JOB_SAVED": $BL_JOBSAVED,
  "data-lucide": $BL_LUCIDE,
  "brace_delta": $BL_DELTA,
  "indexjs_sha256": "$BL_INDEXJS"
}
EOF
fi

# Load snapshot fields
SNAP_PARSEJSON=$(sed -n 's/.*"parseJSON"[[:space:]]*:[[:space:]]*\([0-9]*\).*/\1/p' "$SNAPSHOT" | head -1)
SNAP_RENDER=$(sed -n 's/.*"renderDiagCards"[[:space:]]*:[[:space:]]*\([0-9]*\).*/\1/p' "$SNAPSHOT" | head -1)
SNAP_JOBSAVED=$(sed -n 's/.*"JOB_SAVED"[[:space:]]*:[[:space:]]*\([0-9]*\).*/\1/p' "$SNAPSHOT" | head -1)
SNAP_LUCIDE=$(sed -n 's/.*"data-lucide"[[:space:]]*:[[:space:]]*\([0-9]*\).*/\1/p' "$SNAPSHOT" | head -1)
SNAP_DELTA=$(sed -n 's/.*"brace_delta"[[:space:]]*:[[:space:]]*\(-\{0,1\}[0-9]*\).*/\1/p' "$SNAPSHOT" | head -1)
SNAP_INDEXJS=$(sed -n 's/.*"indexjs_sha256"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "$SNAPSHOT" | head -1)

report() {
  if [ "$1" != "$2" ]; then
    echo "[post-edit-audit] AUDIT DRIFT: $3 snapshot=$1 current=$2" >&2
  fi
}
report "$SNAP_PARSEJSON" "$CUR_PARSEJSON" "parseJSON"
report "$SNAP_RENDER"    "$CUR_RENDER"    "renderDiagCards"
report "$SNAP_JOBSAVED"  "$CUR_JOBSAVED"  "JOB_SAVED"
report "$SNAP_LUCIDE"    "$CUR_LUCIDE"    "data-lucide"
report "$SNAP_DELTA"     "$CUR_DELTA"     "brace_delta"
report "$SNAP_INDEXJS"   "$CUR_INDEXJS"   "indexjs_sha256"

exit 0
