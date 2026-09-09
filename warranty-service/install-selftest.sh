#!/bin/bash
# One-time install for the daily warranty self-check.
#
# Creates a dedicated QA account on production (trazertest+ pattern, so every metric
# query already excludes it), stores its credentials and the Resend key in the login
# Keychain, and schedules the check every morning at 6:41.
#
#   ./install-selftest.sh
#
# Status:    launchctl print gui/$(id -u)/io.trazer.warranty-selftest | head -20
# Log:       tail -f ~/Library/Logs/trazer-warranty-selftest.log
# Run now:   ./warranty-selftest.sh ; echo "exit=$?"
# Uninstall: launchctl bootout gui/$(id -u)/io.trazer.warranty-selftest
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
PLIST="$HOME/Library/LaunchAgents/io.trazer.warranty-selftest.plist"
mkdir -p "$HOME/Library/LaunchAgents" "$HOME/Library/Logs"

# Credentials — created here, never committed, never printed.
if ! security find-generic-password -a "$USER" -s TRAZER_SELFTEST_EMAIL -w >/dev/null 2>&1; then
  EMAIL="trazertest+selfcheck@gmail.com"
  # `tr </dev/urandom | head -c` makes head close the pipe, tr takes SIGPIPE, and
  # `set -o pipefail` turns that into a failed install (exit 141). Generate it in one
  # process instead of a pipeline.
  PASS="$(/usr/bin/python3 -c 'import secrets;print(secrets.token_urlsafe(18))')"
  curl -s -m 30 -X POST https://trazermike.io/api/auth/signup \
    -H 'content-type: application/json' \
    -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\",\"name\":\"Warranty Self-Check\"}" >/dev/null || true
  security add-generic-password -a "$USER" -s TRAZER_SELFTEST_EMAIL -w "$EMAIL" -U
  security add-generic-password -a "$USER" -s TRAZER_SELFTEST_PASS  -w "$PASS"  -U
  echo "created and stored the self-check account"
fi

if ! security find-generic-password -a "$USER" -s TRAZER_RESEND_KEY -w >/dev/null 2>&1; then
  echo "NOTE: no Resend key stored — failures will be logged but not emailed."
  echo "  security add-generic-password -a \"\$USER\" -s TRAZER_RESEND_KEY -w '<key>' -U"
fi

cat > "$PLIST" <<PLISTEOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>io.trazer.warranty-selftest</string>
  <key>ProgramArguments</key>
  <array><string>/bin/bash</string><string>$DIR/warranty-selftest.sh</string></array>
  <key>StartCalendarInterval</key>
  <dict><key>Hour</key><integer>6</integer><key>Minute</key><integer>41</integer></dict>
  <key>StandardOutPath</key><string>$HOME/Library/Logs/trazer-warranty-selftest.log</string>
  <key>StandardErrorPath</key><string>$HOME/Library/Logs/trazer-warranty-selftest.log</string>
  <key>WorkingDirectory</key><string>$DIR</string>
</dict>
</plist>
PLISTEOF

launchctl bootout "gui/$(id -u)/io.trazer.warranty-selftest" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$PLIST"
echo "installed — runs daily at 6:41, silent unless a brand stops answering"
