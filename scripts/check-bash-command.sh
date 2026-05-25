#!/bin/bash
# Hook B — Trazer safety harness
# Blocks dangerous bash commands:
#   - git push origin main (direct push to main — never allowed)
#   - git push --force / -f
#   - rm -rf / (catastrophic)
#   - writes to .env or .git/config
#
# Dual-mode input: stdin JSON (Claude Code hook invocation) or argv (manual test).
# Exit 2 = block. Exit 0 = allow.
# FAILS OPEN on any error.

set +e

if [ "${TRAZER_HOOK_OVERRIDE:-0}" = "1" ]; then
  echo "[check-bash-command] TRAZER_HOOK_OVERRIDE=1 — bypassing block check." >&2
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

# 1. Direct push to main
if printf '%s' "$CMD" | grep -qE '(^|[^A-Za-z0-9_-])git[[:space:]]+push[[:space:]].*\borigin[[:space:]]+main\b'; then
  echo "[check-bash-command] BLOCKED: direct push to main is not allowed. Use a feature branch + PR." >&2
  echo "[check-bash-command] Set TRAZER_HOOK_OVERRIDE=1 to bypass (e.g. for sanctioned merge from feature branch)." >&2
  exit 2
fi

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

exit 0
