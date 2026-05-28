#!/bin/bash
# Hook A — Trazer safety harness
# Blocks edits to locked files (index.js, public/lucide.min.js) and to locked
# function bodies inside public/index.html.
#
# Dual-mode input: stdin JSON (Claude Code hook invocation) or argv (manual test).
# Exit 2 = block (stderr shown to Claude). Exit 0 = allow.
# FAILS OPEN on any error — never blocks legitimate work due to a script bug.
#
# Hardened in chore(hooks) push:
#   - Flattens MultiEdit `edits[*].{old_string,new_string}` into the scan blob
#     (previously MultiEdit was completely unguarded).
#   - Pattern matching is whitespace-tolerant regex, not byte-substring (so
#     `function  flipCamera (` etc. no longer bypass).
#   - Override use is appended to .claude/override.log for audit.

set +e

REPO_ROOT="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null)}"
OVERRIDE_LOG="${REPO_ROOT:-.}/.claude/override.log"

log_override() {
  # $1 = hook name, $2 = tool/file info
  local ts
  ts=$(date -u +%Y-%m-%dT%H:%M:%SZ 2>/dev/null)
  mkdir -p "$(dirname "$OVERRIDE_LOG")" 2>/dev/null
  printf '%s [hook=A] [pid=%s ppid=%s] %s\n' "$ts" "$$" "$PPID" "$2" >> "$OVERRIDE_LOG" 2>/dev/null
}

# Override escape hatch — set TRAZER_HOOK_OVERRIDE=1 in env to bypass.
if [ "${TRAZER_HOOK_OVERRIDE:-0}" = "1" ]; then
  echo "[check-locked-files] TRAZER_HOOK_OVERRIDE=1 — bypassing block check." >&2
  log_override "A" "override-bypass argv=${1:-stdin}"
  exit 0
fi

FILE_PATH=""
HIT=""

if [ -n "${1:-}" ]; then
  # Argv mode (manual test). Hook invocations don't pass argv.
  FILE_PATH="$1"
else
  # Hook mode: read stdin first, then pipe to python3 (-c keeps the script
  # source separate from stdin so json.load sees the real hook payload).
  JSON=$(cat 2>/dev/null)
  RESULT=$(printf '%s' "$JSON" | /usr/bin/python3 -c '
import sys, json, re
try:
    d = json.load(sys.stdin)
    ti = d.get("tool_input", {})
    fp = ti.get("file_path", "")
    parts = [
        ti.get("old_string", ""),
        ti.get("new_string", ""),
        ti.get("content", ""),
    ]
    # Flatten MultiEdit edits[*] into the same scan blob. Previously the
    # parser only saw the top-level fields, so MultiEdit was unguarded.
    edits = ti.get("edits", [])
    if isinstance(edits, list):
        for e in edits:
            if isinstance(e, dict):
                parts.append(e.get("old_string", ""))
                parts.append(e.get("new_string", ""))
    blob = " ".join(str(p) for p in parts)
    # Whitespace-tolerant regex patterns. Previously substring `in` checks
    # were bypassed by e.g. `function  flipCamera (` (extra whitespace).
    patterns = [
        r"function\s+parseJSON\s*\(",
        r"function\s+renderDiagCards\s*\(",
        r"JOB_SAVED",
        r"function\s+primeCameraAudio\s*\(",
        r"function\s+checkCameraAccess\s*\(",
        r"function\s+startLiveCamera\s*\(",
        r"function\s+startCameraStream\s*\(",
        r"function\s+stopLiveCamera\s*\(",
        r"function\s+flipCamera\s*\(",
        r"function\s+analyzeCameraFrame\s*\(",
        r"function\s+setCameraResponse\s*\(",
        r"function\s+updateCameraMicState\s*\(",
        r"function\s+mikeSayCamera\s*\(",
    ]
    hit = ""
    for p in patterns:
        if re.search(p, blob):
            hit = p
            break
    print("FP:" + fp)
    print("HIT:" + hit)
except Exception:
    pass
' 2>/dev/null)
  FILE_PATH=$(printf '%s' "$RESULT" | sed -n 's/^FP://p' | head -1)
  HIT=$(printf '%s' "$RESULT" | sed -n 's/^HIT://p' | head -1)
fi

# --- Whole-file path blocks ---
case "$FILE_PATH" in
  */index.js | index.js)
    echo "[check-locked-files] BLOCKED: index.js (backend) is fully locked per CLAUDE.md." >&2
    echo "[check-locked-files] Set TRAZER_HOOK_OVERRIDE=1 to bypass." >&2
    exit 2
    ;;
  */public/lucide.min.js | public/lucide.min.js)
    echo "[check-locked-files] BLOCKED: public/lucide.min.js is a bundled library, never hand-edit." >&2
    echo "[check-locked-files] Set TRAZER_HOOK_OVERRIDE=1 to bypass." >&2
    exit 2
    ;;
esac

# --- Sub-file content block (only meaningful with stdin JSON) ---
if [ -n "$HIT" ]; then
  case "$FILE_PATH" in
    */public/index.html | public/index.html)
      echo "[check-locked-files] BLOCKED: edit to public/index.html references locked content matching '$HIT'." >&2
      echo "[check-locked-files] See CLAUDE.md \"Locked files / regions\". Set TRAZER_HOOK_OVERRIDE=1 to bypass." >&2
      exit 2
      ;;
  esac
fi

exit 0
