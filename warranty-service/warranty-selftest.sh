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

# IS IT US, OR IS IT THIS LAPTOP? Added 2026-09-14 after the 04:08 false alarm.
# launchd fires this job during macOS dark "maintenance wakes", and Wi-Fi is not up yet
# when it does. At 04:08:13 the Mac dark-woke; at 04:08:33 the sign-in to trazermike.io
# returned empty, the alert email to Resend returned empty, and the worker's git pull
# failed — three unrelated hosts, all dead in the same second. Nothing was wrong with
# warranty. The machine simply had no route, and the monitor paged Brandon about it.
#
# So before crying BLIND, ask a neutral always-up host. No route at all => this laptop is
# half-awake; stay quiet and retry next hour. Route fine but Mike unreachable => that is
# REAL and still pages, immediately, exactly as before. This narrows a false alarm; it
# does not mute an outage.
if [ -z "$TOKEN" ]; then
  if ! $CURL -s -m 10 -o /dev/null https://1.1.1.1/ && ! $CURL -s -m 10 -o /dev/null https://8.8.8.8/; then
    say "no network on this laptop (dark wake?) — not a warranty failure, retrying next run"
    exit 0
  fi
fi

if [ -z "$TOKEN" ]; then
  # A monitor that cannot see is worth saying out loud — silence would read as health —
  # but it must never be dressed up as a broken brand. Different subject, different fix.
  say "could not sign in as the self-test account (internet is up — this one is real)"
  BLIND=1
  FAILURES="the self-check could not sign in to production, so NO brand was actually tested"
else
  FAILURES=""
  check(){                     # check <label> <json body>
    local label="$1" body="$2"
    local out
    # CAPTURE THE HTTP STATUS. /api/warranty sits behind aiLimiter (20/min) and the
    # self-check shares that bucket with real technicians. When it gets squeezed out,
    # express-rate-limit answers with a PLAIN-TEXT body, json.load raised, and this
    # printed "no readable answer" — which scored as a BROKEN BRAND and fired a --major
    # "Warranty lookup broke" alert. Seen live 2026-09-14 08:54:27: Trane "failed" in one
    # second, and a clean retry moments later answered in 5.8s. Being rate limited means
    # we could not test the brand; it says nothing about the brand. Different thing,
    # different handling — skip the run, never page him for it.
    # ONE request, body and status together. A separate probe call would double every
    # lookup — each one drives a manufacturer's real form for 15-30s, so probing first
    # would hit them twice per check and burn through the very rate limit it is testing.
    local raw
    raw=$($CURL -s -m 190 -w '\n%{http_code}' -X POST "$API/api/warranty" \
          -H 'content-type: application/json' -H "Authorization: Bearer $TOKEN" -d "$body")
    if [ "${raw##*$'\n'}" = "429" ]; then
      say "  $label SKIPPED — rate limited (429), not a brand failure"
      return
    fi
    out=$(printf '%s' "${raw%$'\n'*}" \
          | $PY -c 'import sys,json
try: d=json.load(sys.stdin)
except Exception: print("BAD|no readable answer"); raise SystemExit
if not d.get("ok"): print("BAD|service error: %s" % str(d.get("error"))[:80]); raise SystemExit
if d.get("inconclusive") is True or d.get("reason")=="lookup_did_not_run":
    print("BAD|their form did not run"); raise SystemExit
# LINK-ONLY IS A PASS. Mitsubishi was flipped to link-only on 2026-09-14 because its
# registry sits behind a Cloudflare challenge; Mike now hands the tech the URL instead of
# pretending to read it. That is the DESIGNED answer, so scoring it as a broken brand is
# how this check paged Brandon hourly for six days about something nobody intended to fix
# yet. If the brand ever stops returning link_only, that IS news and falls through below.
if d.get("reason")=="link_only" or d.get("linkOnly") is True:
    print("OK|link-only by design — handed the tech %s" % (d.get("where") or "the registry URL")); raise SystemExit
if d.get("supported") is False:
    print("BAD|brand reported unsupported: %s" % str(d.get("reason"))[:60]); raise SystemExit
if d.get("cached") is True:
    print("BAD|got a CACHED answer — this run did not reach the manufacturer"); raise SystemExit
# siteDown was not checked, so a manufacturer being down scored as a PASS. Verified on
# 2026-09-11 12:07: Goodman and Rheem both returned manufacturer_site_down and the run
# logged "all brands answered — staying quiet".
if d.get("siteDown") is True or d.get("reason")=="manufacturer_site_down":
    print("BAD|the manufacturer site is down"); raise SystemExit
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
  check "Carrier / Bryant / Payne"   '{"fresh":true,"brand":"carrier","serial":"3623E02930","originalPurchaser":true}'
  check "Heil / ICP (via Carrier)"   '{"fresh":true,"brand":"heil","serial":"3623E02930","originalPurchaser":true}'
  check "Trane / American Standard"  '{"fresh":true,"brand":"trane","serial":"23161ABC1D"}'
  check "Goodman / Amana / Daikin"   '{"fresh":true,"brand":"goodman","serial":"2103456789","model":"GSZ140241","lastName":"Weiler","zip":"20109"}'
  check "Rheem / Ruud"               '{"fresh":true,"brand":"rheem","serial":"W231812345","lastName":"Weiler","state":"VA"}'
  # Lennox and Mitsubishi are configured brands that this check never covered, so if
  # either one broke nobody would have known — which is exactly how Carrier stayed
  # dead for a morning on 2026-09-08. Both verified answering when added.
  check "Lennox"                     '{"fresh":true,"brand":"lennox","serial":"5819K12345","lastName":"Weiler","zip":"20109"}'
  check "Mitsubishi Electric"        '{"fresh":true,"brand":"mitsubishi","serial":"1234567890"}'
fi

# ── SPEAK ON CHANGE, THEN KEEP NAGGING UNTIL IT IS FIXED ─────────────────────
# HISTORY, so this is never "improved" back into silence:
#   v1 emailed on EVERY failing run. Hourly + one known-broken brand = 24 identical
#      emails a day. That teaches Brandon to swipe warranty mail away, so the one that
#      matters arrives looking like the twenty-three that did not.
#   v2 (2026-09-09) fixed the spam with "only speak when the failing SET changes."
#      That muted a REAL 53-hour outage after a single email — and that email was
#      rejected 429 by Resend and logged as delivered anyway. Four brand families were
#      dead for two days and Brandon found out by photographing a Trane nameplate.
#
# v3 separates the two things v2 confused. De-duplication lowers FREQUENCY; it must
# never reach zero. An alert that is still true gets re-sent on an interval, carrying
# how long it has been broken, until it is actually fixed. This is the standard
# renotify/repeat_interval pattern every real alerting system ships (Alertmanager
# defaults to 4h; so do we).
#
# AND: a send that did not return a message id DID NOT HAPPEN. The state clock only
# advances on confirmed delivery, so a quota'd or failed alert retries next run instead
# of buying silence. See [[feedback-alarms-must-renag-not-mute]].
RENOTIFY_S=${RENOTIFY_S:-14400}          # 4h — re-nag while still broken
# EMAIL IS THE PAGER, TEXT IS THE NAG. Brandon, 2026-09-13: "just notify me if it's
# major. I want weekly emails." A brand family going dead IS major, so the FIRST alert
# emails him. But re-nagging by email every 4h for two days is the inbox flood he asked
# me to stop, so the repeats are text-only — with one email a day so a long outage can
# still never be forgotten.
EMAIL_EVERY_S=${EMAIL_EVERY_S:-86400}    # 24h — how often a CONTINUING problem re-emails
EMAILED_F="$HOME/.claude/tools/trazer/.warranty-selftest-emailed"
BLIND_RENOTIFY_S=${BLIND_RENOTIFY_S:-21600}   # 6h — a blind monitor is its own emergency
NOTIFY="${TRAZER_NOTIFY_BIN:-$HOME/.claude/tools/trazer/notify.sh}"
STATE_F="$HOME/.claude/tools/trazer/.warranty-selftest-failing"
STAMP_F="$HOME/.claude/tools/trazer/.warranty-selftest-notified"   # epoch of last CONFIRMED send
SINCE_F="$HOME/.claude/tools/trazer/.warranty-selftest-since"      # epoch the current set began
BLIND_F="$HOME/.claude/tools/trazer/.warranty-selftest-blind"      # epoch of last CONFIRMED blind send

# DEAD-MAN'S SWITCH. Touched on every run, pass or fail. "No email" used to mean both
# "healthy" and "this check has not run in six days" — on 2026-09-02..09-08 launchd
# could not read ~/Desktop and the check was dead for 150 hours in total silence.
# field-sweep watches this file's age, so a stopped monitor now looks different from a
# healthy one.
touch "$HOME/.claude/tools/trazer/.warranty-selftest-heartbeat"

NOW_T=$(date +%s)
PREV=$(cat "$STATE_F" 2>/dev/null || echo "")
NOW=$(echo "$FAILURES" | sed 's/ —.*//' | grep -v '^$' | sort | tr '\n' '|')

# ── BLIND is its own emergency and is NEVER dedupe-suppressed ────────────────
# v2 fed the blind sentence through the same set-comparison as brand names, so a
# permanently blind monitor emailed once and then went quiet forever — a smoke alarm
# that announces its own death one time. Blind also must not overwrite the real failing
# set, or the genuinely-dead brands re-alert as "new" when sign-in recovers.
if [ "${BLIND:-0}" = "1" ]; then
  LAST_B=$(cat "$BLIND_F" 2>/dev/null || echo 0)
  AGE_B=$(( NOW_T - LAST_B ))
  if [ "$AGE_B" -ge "$BLIND_RENOTIFY_S" ]; then
    HRS=$(( AGE_B / 3600 ))
    if "$NOTIFY" --major "Warranty self-check is BLIND — nothing is being tested" \
       "The warranty self-check could not sign in to production, so no brand was verified. This says nothing about whether lookups work — only that the check cannot see them. Treat it as a broken smoke alarm, not a fire. Last blind alert: ${HRS}h ago."; then
      echo "$NOW_T" > "$BLIND_F"; say "BLIND — reported (confirmed delivery)"
    else
      say "BLIND — ALERT SEND FAILED, will retry next run"
    fi
  else
    say "BLIND — already reported $(( AGE_B / 60 ))m ago, next re-nag in $(( (BLIND_RENOTIFY_S - AGE_B) / 60 ))m"
  fi
  exit 1
fi

# ── RECOVERY — reported even when it is PARTIAL ──────────────────────────────
# v2 nested this inside "if no failures at all", so a brand coming back while another
# stayed broken was never mentioned. Worse, `for b in $(...)` split on whitespace, not
# newlines, so "Mitsubishi Electric" became two bogus entries and the match never fired
# (observed live: "RECOVERED: Mitsubishi, Electric").
RECOVERED=""
if [ -n "$PREV" ]; then
  while IFS= read -r b; do
    [ -z "$b" ] && continue
    printf '%s\n' "$NOW" | tr '|' '\n' | grep -qxF "$b" || RECOVERED="${RECOVERED}${RECOVERED:+, }$b"
  done <<< "$(printf '%s\n' "$PREV" | tr '|' '\n')"
fi

if [ -n "$RECOVERED" ]; then
  say "RECOVERED: $RECOVERED"
  "$NOTIFY" "Warranty is back — $RECOVERED" "$RECOVERED is answering again." >/dev/null 2>&1 \
    && say "  recovery reported" || say "  recovery notice failed to send"
fi

# ── ALL CLEAR ────────────────────────────────────────────────────────────────
if [ -z "$FAILURES" ]; then
  say "all brands answered — staying quiet"
  : > "$STATE_F"; : > "$STAMP_F"; : > "$SINCE_F"; : > "$EMAILED_F"
  exit 0
fi

# ── STILL BROKEN: decide whether this run speaks ─────────────────────────────
if [ "$NOW" = "$PREV" ]; then
  SINCE=$(cat "$SINCE_F" 2>/dev/null || echo "$NOW_T")
  LAST=$(cat "$STAMP_F" 2>/dev/null || echo 0)
  AGE=$(( NOW_T - LAST ))
  if [ "$AGE" -lt "$RENOTIFY_S" ]; then
    say "same brand(s) still failing — next re-nag in $(( (RENOTIFY_S - AGE) / 60 ))m: $(echo "$NOW" | tr '|' ' ')"
    exit 1
  fi
  say "same brand(s) still failing and the re-nag window elapsed — speaking again"
else
  SINCE=$NOW_T
  echo "$SINCE" > "$SINCE_F"
fi

DOWN_H=$(( (NOW_T - SINCE) / 3600 ))
N=$(printf '%s\n' "$FAILURES" | grep -c '[^[:space:]]')
if [ "$DOWN_H" -ge 1 ]; then DUR=" — down ${DOWN_H}h"; else DUR=""; fi

# NOTE: delivery goes through notify.sh, which sends email AND iMessage and returns
# non-zero unless Resend returned a message id. The old code called Resend inline, never
# read the response, and printed "reported by email" unconditionally — which is how two
# HTTP 429 "daily quota exceeded" rejections were recorded as delivered alerts.
# New problem, or a day since the last email about this one -> it earns the inbox.
LAST_EMAIL=$(cat "$EMAILED_F" 2>/dev/null || echo 0)
if [ "$NOW" != "$PREV" ] || [ $(( NOW_T - LAST_EMAIL )) -ge "$EMAIL_EVERY_S" ]; then
  SEV="--major"; echo "$NOW_T" > "$EMAILED_F"
else
  SEV=""       # still broken, already emailed today — text only
fi
if "$NOTIFY" $SEV "Warranty lookup broke — ${N} brand(s)${DUR}" \
   "$(printf 'A technician asking about these brands right now gets "I could not check" instead of an answer.\n\n%s\n\nEverything not listed answered normally. Mike still refuses to guess at coverage, so nobody is being told a unit is covered when it is not.' "$FAILURES")"; then
  echo "$NOW" > "$STATE_F"          # only advance the mute state on CONFIRMED delivery
  echo "$NOW_T" > "$STAMP_F"
  say "reported (confirmed delivery) — ${N} brand(s), down ${DOWN_H}h"
else
  say "ALERT SEND FAILED — state NOT advanced, will retry next run: $(echo "$NOW" | tr '|' ' ')"
fi
exit 1
