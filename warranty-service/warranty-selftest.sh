#!/bin/bash
# DAILY WARRANTY SELF-CHECK — runs one real lookup per verified brand family against
# PRODUCTION, exactly the way a technician's phone does.
#
# Why this exists: every warranty lookup drives a manufacturer's own page. Any of them
# can change a field name, add a step, or start refusing us, and until now the first
# person to find out would have been a technician standing in front of a customer. The
# field-watch only fires once a real tech has already been failed. This runs first.
#
# Silence when healthy. It emails Brandon ONLY when a brand that was working stops
# working — an all-clear every morning trains him to ignore the one that matters.
#
# Installed by install-selftest.sh as io.trazer.warranty-selftest.
# Log: ~/Library/Logs/trazer-warranty-selftest.log
set -uo pipefail
BLIND=0

API="https://trazermike.io"
LOG="$HOME/Library/Logs/trazer-warranty-selftest.log"
say(){ echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >> "$LOG"; }

CURL=/usr/bin/curl
PY=/usr/bin/python3

# A dedicated QA identity, created once and kept in the login Keychain. It uses the
# trazertest+ address pattern that every metric query already excludes, so the daily
# check can never inflate signups, questions, or conversion.
QA_EMAIL=$(security find-generic-password -a "$USER" -s TRAZER_SELFTEST_EMAIL -w 2>/dev/null)
QA_PASS=$(security find-generic-password -a "$USER" -s TRAZER_SELFTEST_PASS -w 2>/dev/null)
if [ -z "${QA_EMAIL:-}" ] || [ -z "${QA_PASS:-}" ]; then
  say "no self-test credentials in the Keychain — run install-selftest.sh"
  exit 2
fi

# The route is /signin. /login does not exist and returns Express's HTML 404, which
# parsed as "no token" and made the check email Brandon about ITSELF on first run.
TOKEN=$($CURL -s -m 30 -X POST "$API/api/auth/signin" -H 'content-type: application/json' \
  -d "{\"email\":\"$QA_EMAIL\",\"password\":\"$QA_PASS\"}" \
  | $PY -c 'import sys,json
try: print(json.load(sys.stdin).get("token") or "")
except Exception: print("")')

if [ -z "$TOKEN" ]; then
  # A monitor that cannot see is worth saying out loud — silence would read as health —
  # but it must never be dressed up as a broken brand. Different subject, different fix.
  say "could not sign in as the self-test account"
  BLIND=1
  FAILURES="the self-check could not sign in to production, so NO brand was actually tested"
else
  FAILURES=""
  check(){                     # check <label> <json body>
    local label="$1" body="$2"
    local out
    out=$($CURL -s -m 190 -X POST "$API/api/warranty" -H 'content-type: application/json' \
          -H "Authorization: Bearer $TOKEN" -d "$body" \
          | $PY -c 'import sys,json
try: d=json.load(sys.stdin)
except Exception: print("BAD|no readable answer"); raise SystemExit
if not d.get("ok"): print("BAD|service error: %s" % str(d.get("error"))[:80]); raise SystemExit
if d.get("inconclusive") is True or d.get("reason")=="lookup_did_not_run":
    print("BAD|their form did not run"); raise SystemExit
if d.get("supported") is False:
    print("BAD|brand reported unsupported: %s" % str(d.get("reason"))[:60]); raise SystemExit
print("OK|found=%s registered=%s %s" % (d.get("found"), d.get("registered"), d.get("model") or d.get("reason") or ""))')
    if [ "${out%%|*}" = "OK" ]; then
      say "  $label ${out#*|}"
    else
      say "  $label FAILED — ${out#*|}"
      FAILURES="${FAILURES}${FAILURES:+$'\n'}$label — ${out#*|}"
    fi
  }

  say "self-check starting"
  # A real serial per family. Trane's answers "not registered", which is a real answer
  # and a pass — the check is whether their form RAN, not whether a unit is covered.
  check "Carrier / Bryant / Payne"   '{"brand":"carrier","serial":"3623E02930","originalPurchaser":true}'
  check "Heil / ICP (via Carrier)"   '{"brand":"heil","serial":"3623E02930","originalPurchaser":true}'
  check "Trane / American Standard"  '{"brand":"trane","serial":"23161ABC1D"}'
  check "Goodman / Amana / Daikin"   '{"brand":"goodman","serial":"2103456789","model":"GSZ140241","lastName":"Weiler","zip":"20109"}'
  check "Rheem / Ruud"               '{"brand":"rheem","serial":"W231812345","lastName":"Weiler","state":"VA"}'
fi

if [ -z "$FAILURES" ]; then
  say "all brands answered — staying quiet"
  exit 0
fi

# Something a technician would hit. Tell him, once, with the specifics.
RESEND=$(security find-generic-password -a "$USER" -s TRAZER_RESEND_KEY -w 2>/dev/null)
if [ -z "${RESEND:-}" ]; then say "FAILURES but no Resend key to report them"; exit 1; fi

BODY=$($PY -c '
import json,sys
fails, blind = sys.argv[1], sys.argv[2] == "1"
n = len([l for l in fails.splitlines() if l.strip()])
if blind:
    subject = "Warranty self-check is blind — it could not test anything"
    body = ("The daily warranty self-check could not run, so nothing was verified this morning.\n\n"
            + fails +
            "\n\nThis says nothing about whether the lookups work — only that the check cannot see them. "
            "Treat it as a broken smoke alarm, not a fire.\n")
else:
    subject = "Warranty lookup broke — %d brand(s)" % n
    body = ("The daily warranty self-check just failed. A technician asking about these brands "
            "right now gets \"I could not check\" instead of an answer.\n\n" + fails +
            "\n\nEverything not listed answered normally. Mike still refuses to guess at coverage, "
            "so nobody is being told a unit is covered when it is not.\n")
print(json.dumps({
 "from":"Trazer Mike <mike@trazermike.io>",
 "to":["trazerintelligence@gmail.com"],
 "subject":subject,
 "text":body,
}))' "$FAILURES" "${BLIND:-0}")

$CURL -s -m 60 -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer $RESEND" -H "Content-Type: application/json" \
  --data "$BODY" >> "$LOG" 2>&1
say "reported by email"
exit 1
