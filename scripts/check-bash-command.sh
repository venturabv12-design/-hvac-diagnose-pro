#!/bin/bash
# Hook B — Trazer safety harness
# Blocks dangerous bash commands:
#   - git push origin main (direct push to main — never allowed)
#   - git push --force / -f
#   - rm -rf / (catastrophic)
#   - writes to .env or .git/config
#   - writes to LOCKED FILES via shell tooling (sed -i, > redirect, tee,
#     cp/mv, git checkout/apply/restore, patch, dd, scripting languages
#     opening the file for writing). Without this gate, Hook A's protection
#     of public/index.html / index.js could be bypassed entirely by piping
#     content through bash instead of using the Edit tool.
#
# Dual-mode input: stdin JSON (Claude Code hook invocation) or argv (manual test).
# Exit 2 = block. Exit 0 = allow.
# FAILS OPEN on any error.

set +e

REPO_ROOT="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null)}"
OVERRIDE_LOG="${REPO_ROOT:-.}/.claude/override.log"

log_override() {
  local ts
  ts=$(date -u +%Y-%m-%dT%H:%M:%SZ 2>/dev/null)
  mkdir -p "$(dirname "$OVERRIDE_LOG")" 2>/dev/null
  printf '%s [hook=B] [pid=%s ppid=%s] %s\n' "$ts" "$$" "$PPID" "$1" >> "$OVERRIDE_LOG" 2>/dev/null
}

if [ "${TRAZER_HOOK_OVERRIDE:-0}" = "1" ]; then
  echo "[check-bash-command] TRAZER_HOOK_OVERRIDE=1 — bypassing block check." >&2
  log_override "override-bypass cmd-excerpt=$(printf '%.120s' "${1:-stdin}")"
  exit 0
fi

CMD=""

if [ -n "${1:-}" ]; then
  # Argv mode (manual test). Hook invocations don't pass argv.
  CMD="$1"
else
  # Hook mode: grab the command field from the JSON. The blocked patterns we
  # care about don't appear in description/file fields in practice, so we just
  # scan the whole JSON blob for them — no parsing needed.
  CMD=$(cat 2>/dev/null)
fi

# 1. Direct push to main — INTENTIONALLY UNBLOCKED (Brandon, 2026-07-25).
# Brandon's standing decision: his explicit "push it" IS the approval gate
# ("if I say push it that means we went through everything and I'm good").
# So the operator may push to main when he says so, with no terminal step.
# The gate is now his word + operator discipline (only push on explicit
# "push it"/"ship it"), not this mechanical block. Force-push (#2), rm -rf (#3),
# .env/.git/config writes, and locked-file shell writes all remain BLOCKED below.
# To restore the hard block, un-comment the guard:
#
# if printf '%s' "$CMD" | grep -qE '(^|[^A-Za-z0-9_-])git[[:space:]]+push[[:space:]].*\borigin[[:space:]]+main\b'; then
#   echo "[check-bash-command] BLOCKED: direct push to main is not allowed. Use a feature branch + PR." >&2
#   echo "[check-bash-command] Set TRAZER_HOOK_OVERRIDE=1 to bypass (e.g. for sanctioned merge from feature branch)." >&2
#   exit 2
# fi

# 2. Force push (any branch)
if printf '%s' "$CMD" | grep -qE '(^|[^A-Za-z0-9_-])git[[:space:]]+push[[:space:]].*(--force\b|--force-with-lease\b|[[:space:]]-f\b)'; then
  echo "[check-bash-command] BLOCKED: force push is not allowed." >&2
  echo "[check-bash-command] Set TRAZER_HOOK_OVERRIDE=1 to bypass." >&2
  exit 2
fi

# 3. rm -rf /  or  rm -rf /*  (root-relative wipe)
if printf '%s' "$CMD" | grep -qE 'rm[[:space:]]+(-[a-zA-Z]*[rRfF][a-zA-Z]*[[:space:]]+)+/(\*)?([[:space:]]|$)'; then
  echo "[check-bash-command] BLOCKED: rm against / is catastrophic." >&2
  echo "[check-bash-command] Set TRAZER_HOOK_OVERRIDE=1 to bypass." >&2
  exit 2
fi

# 4. Writes to .env
if printf '%s' "$CMD" | grep -qE '(>|>>)[[:space:]]*\.env(\b|$)'; then
  echo "[check-bash-command] BLOCKED: do not write to .env from a shell command." >&2
  echo "[check-bash-command] Set TRAZER_HOOK_OVERRIDE=1 to bypass." >&2
  exit 2
fi

# 5. Writes to .git/config
if printf '%s' "$CMD" | grep -qE '(>|>>)[[:space:]]*\.git/config\b'; then
  echo "[check-bash-command] BLOCKED: do not write to .git/config from a shell command." >&2
  echo "[check-bash-command] Set TRAZER_HOOK_OVERRIDE=1 to bypass." >&2
  exit 2
fi

# 6. Shell writes to locked files. Audit identified this as the second-biggest
# bypass: Hook A only catches the Edit/Write/MultiEdit tool path; any command
# that mutates public/index.html or index.js via shell tooling slipped through.
# Pattern is a two-stage heuristic: command must reference a locked path AND
# use a write-indicator. Override remains available for sanctioned cases.

LOCKED_RE='(public/index\.html|index\.js|public/lucide\.min\.js)'

# 6a. sed -i (in-place edit) targeting a locked file.
if printf '%s' "$CMD" | grep -qE "(^|[^A-Za-z0-9_-])sed[[:space:]].*-i.*$LOCKED_RE"; then
  echo "[check-bash-command] BLOCKED: sed -i targeting a locked file. Use the Edit tool (which the locked-files hook can audit)." >&2
  echo "[check-bash-command] Set TRAZER_HOOK_OVERRIDE=1 to bypass." >&2
  exit 2
fi

# 6b. Redirect (>, >>) into a locked file.
if printf '%s' "$CMD" | grep -qE "(>|>>)[[:space:]]*$LOCKED_RE"; then
  echo "[check-bash-command] BLOCKED: shell redirect (>, >>) into a locked file." >&2
  echo "[check-bash-command] Set TRAZER_HOOK_OVERRIDE=1 to bypass." >&2
  exit 2
fi

# 6c. tee writing to a locked file.
if printf '%s' "$CMD" | grep -qE "(^|[^A-Za-z0-9_-])tee[[:space:]]+([^[:space:]]+[[:space:]]+)*$LOCKED_RE"; then
  echo "[check-bash-command] BLOCKED: tee writing to a locked file." >&2
  echo "[check-bash-command] Set TRAZER_HOOK_OVERRIDE=1 to bypass." >&2
  exit 2
fi

# 6d. cp / mv / install whose destination is a locked file.
if printf '%s' "$CMD" | grep -qE "(^|[^A-Za-z0-9_-])(cp|mv|install)[[:space:]].*[[:space:]]$LOCKED_RE([[:space:]]|$|;|&)"; then
  echo "[check-bash-command] BLOCKED: cp/mv/install with a locked file as destination." >&2
  echo "[check-bash-command] Set TRAZER_HOOK_OVERRIDE=1 to bypass." >&2
  exit 2
fi

# 6e. git checkout / restore that targets a locked file path-restriction.
if printf '%s' "$CMD" | grep -qE "(^|[^A-Za-z0-9_-])git[[:space:]]+(checkout|restore)[[:space:]].*(--|--source=.*--).*$LOCKED_RE"; then
  echo "[check-bash-command] BLOCKED: git checkout/restore targeting a locked file (would silently revert or replace its contents)." >&2
  echo "[check-bash-command] Set TRAZER_HOOK_OVERRIDE=1 to bypass." >&2
  exit 2
fi
if printf '%s' "$CMD" | grep -qE "(^|[^A-Za-z0-9_-])git[[:space:]]+restore[[:space:]].*$LOCKED_RE"; then
  echo "[check-bash-command] BLOCKED: git restore targeting a locked file." >&2
  echo "[check-bash-command] Set TRAZER_HOOK_OVERRIDE=1 to bypass." >&2
  exit 2
fi

# 6f. git apply / patch — broad block. These can rewrite arbitrary files
# (including locked ones) and the patch contents aren't visible in the
# command string. Override available for sanctioned cherry-pick flows.
if printf '%s' "$CMD" | grep -qE "(^|[^A-Za-z0-9_-])git[[:space:]]+apply\b"; then
  echo "[check-bash-command] BLOCKED: git apply can rewrite locked files (patch contents aren't visible in the command)." >&2
  echo "[check-bash-command] Set TRAZER_HOOK_OVERRIDE=1 to bypass." >&2
  exit 2
fi
if printf '%s' "$CMD" | grep -qE "(^|[^A-Za-z0-9_-])patch[[:space:]]+"; then
  echo "[check-bash-command] BLOCKED: patch command can rewrite arbitrary files including locked ones." >&2
  echo "[check-bash-command] Set TRAZER_HOOK_OVERRIDE=1 to bypass." >&2
  exit 2
fi

# 6g. dd of=locked
if printf '%s' "$CMD" | grep -qE "(^|[^A-Za-z0-9_-])dd[[:space:]]+.*\bof=$LOCKED_RE"; then
  echo "[check-bash-command] BLOCKED: dd writing to a locked file." >&2
  echo "[check-bash-command] Set TRAZER_HOOK_OVERRIDE=1 to bypass." >&2
  exit 2
fi

# 6h. Scripting languages opening locked files for write. Heuristic: the
# command includes one of {python,python3,node,perl,ruby} AND a -c flag AND
# a locked path appears inside the quoted script. This catches the obvious
# `python3 -c "open('index.js','w').write(...)"` pattern; sophisticated
# heredoc or argv-driven script invocations may evade and are caught by
# the PostToolUse content verifier (separate commit).
if printf '%s' "$CMD" | grep -qE "(^|[^A-Za-z0-9_-])(python|python3|node|perl|ruby)[[:space:]].*-c\b.*$LOCKED_RE"; then
  echo "[check-bash-command] BLOCKED: scripting language with -c referencing a locked file (likely a programmatic write bypass)." >&2
  echo "[check-bash-command] Set TRAZER_HOOK_OVERRIDE=1 to bypass." >&2
  exit 2
fi

exit 0
