#!/bin/bash
# Hook A — Trazer safety harness
# Blocks edits to locked files (index.js, public/lucide.min.js) and to locked
# function bodies inside public/index.html.
#
# Dual-mode input: stdin JSON (Claude Code hook invocation) or argv (manual test).
# Exit 2 = block (stderr shown to Claude). Exit 0 = allow.
# FAILS OPEN on any error — never blocks legitimate work due to a script bug.

set +e

# Override escape hatch — set TRAZER_HOOK_OVERRIDE=1 in env to bypass.
if [ "${TRAZER_HOOK_OVERRIDE:-0}" = "1" ]; then
  echo "[check-locked-files] TRAZER_HOOK_OVERRIDE=1 — bypassing block check." >&2
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
import sys, json
try:
    d = json.load(sys.stdin)
    ti = d.get("tool_input", {})
    fp = ti.get("file_path", "")
    blob = " ".join(str(v) for v in [
        ti.get("old_string", ""),
        ti.get("new_string", ""),
        ti.get("content", ""),
    ])
    patterns = [
        "function parseJSON(",
        "function renderDiagCards(",
        "JOB_SAVED",
        "function primeCameraAudio(",
        "function checkCameraAccess(",
        "function startLiveCamera(",
        "function startCameraStream(",
        "function stopLiveCamera(",
        "function flipCamera(",
        "function analyzeCameraFrame(",
        "function setCameraResponse(",
        "function updateCameraMicState(",
        "function mikeSayCamera(",
    ]
    hit = ""
    for p in patterns:
        if p in blob:
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
