#!/usr/bin/env bash
# SessionStart hook — makes Claude open by asking Brandon whether to continue
# last session's work or start something new. Pulls the current work-queue /
# latest launch-state pointer from auto-memory so "continue" is concrete.
set -euo pipefail

MEM_DIR="/Users/brandonventura/.claude/projects/-Users-brandonventura-Desktop-trazer/memory"
INDEX="$MEM_DIR/MEMORY.md"
NOW="$MEM_DIR/NOW.md"

# LIVE STATE — the single always-current work cursor. Its full contents are injected so a
# new session picks up exactly where the last one left off (no re-explaining, no screenshots).
NOW_BLOCK=""
if [ -f "$NOW" ]; then
  NOW_BLOCK="

===== LIVE WORK CURSOR (memory/NOW.md — this is where we ACTUALLY left off) =====
$(cat "$NOW")
===== end live cursor =====
Treat the above as the concrete 'continue' option. It is the freshest state; trust it over older pointers."
fi

# Fallback pointer (only used to phrase the greeting if NOW.md is somehow empty).
POINTER=""
if [ -f "$INDEX" ]; then
  POINTER="$(grep -i 'work-queue\|START HERE' "$INDEX" | head -1 || true)"
  if [ -z "$POINTER" ]; then
    POINTER="$(grep -i 'launch state' "$INDEX" | tail -1 || true)"
  fi
fi
[ -z "$POINTER" ] && POINTER="(no work-queue pointer found in memory — read MEMORY.md and summarize the most recent state)"

# Pull any orders Brandon left via a Cello phone call since last session, and
# mark them read so they don't resurface. Best-effort — never blocks startup.
ORDERS_EP="https://trazer-cello-line.netlify.app/.netlify/functions/orders"
CELLO_READ_TOKEN="d2b402e96e2c08676eb2b86b6ae2c19acb5d2ec60f1818c7"
ORDERS_BLOCK=""
ORDERS_JSON="$(curl -s -m 8 "${ORDERS_EP}?token=${CELLO_READ_TOKEN}&markRead=1" 2>/dev/null || true)"
if [ -n "$ORDERS_JSON" ]; then
  ORDERS_BLOCK="$(printf '%s' "$ORDERS_JSON" | python3 -c '
import json,sys
try: d=json.load(sys.stdin)
except Exception: sys.exit()
os=d.get("orders") or []
if not os: sys.exit()
lines=["", "VOICE ORDERS Brandon left via Cello since last session (route these to the crew / add to the work-queue):"]
for o in os:
    lines.append("- ["+str(o.get("priority","soon"))+"] "+str(o.get("request","")).strip())
lines.append("Acknowledge these first, fold them into the work, and log them in memory so nothing is lost.")
print("\n".join(lines))
' 2>/dev/null || true)"
fi

CONTEXT="SESSION-START GREETING (from the trazer SessionStart hook):
Before anything else this session, your FIRST line must be exactly: \"Welcome back, Brandon.\" — always greet him by name, every session, no exceptions. Then, in the same short message, ask whether he wants to CONTINUE what we were working on last session, or start something NEW.
Make the 'continue' option concrete from the LIVE WORK CURSOR below — state the exact thread, its current state, and the next action, so Brandon never has to re-explain or send a screenshot. Fallback pointer if the cursor is empty:
${POINTER}
${NOW_BLOCK}
Phrase the choice in one short, plain-English message (he's usually on his phone). Do not start executing until he picks. If he clearly already stated a task in his first message, skip the greeting and just do it.
IMPORTANT ongoing rule: keep memory/NOW.md updated after every meaningful step this session (not just at the end), so if this session dies mid-work the next one still picks up exactly here.
${ORDERS_BLOCK}"

# Emit as additionalContext so it steers the model at session start.
printf '%s' "$CONTEXT" | python3 -c 'import json,sys; print(json.dumps({"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":sys.stdin.read()}}))'
