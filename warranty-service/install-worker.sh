#!/bin/bash
# One-time install. Makes the warranty worker a permanent background service on this Mac:
# starts at login, restarts within seconds if it ever dies, and comes back after a reboot.
#
# This is the machine that does the actual browsing for every manufacturer lookup.
# Manufacturer forms sit behind invisible reCAPTCHA, and Google scores the NETWORK a
# request comes from — a residential connection gets a token, a datacenter is refused.
# Verified both ways, same code, same day. That is why this runs here and not on Railway.
#
#   ./install-worker.sh
#
# Status:     launchctl print gui/$(id -u)/io.trazer.warranty-worker | head -20
# Log:        tail -f ~/Library/Logs/trazer-warranty-worker.log
# Uninstall:  launchctl bootout gui/$(id -u)/io.trazer.warranty-worker
#
# Before first run, put the two secrets in the login Keychain (never in a file):
#   security add-generic-password -a "$USER" -s TRAZER_ANTHROPIC_KEY  -w '<key>'  -U
#   security add-generic-password -a "$USER" -s TRAZER_WORKER_TOKEN   -w '<tok>'  -U
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"
PLIST="$HOME/Library/LaunchAgents/io.trazer.warranty-worker.plist"
mkdir -p "$HOME/Library/LaunchAgents" "$HOME/Library/Logs"

cat > "$PLIST" <<PLISTEOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>io.trazer.warranty-worker</string>
  <key>ProgramArguments</key>
  <array><string>/bin/bash</string><string>$DIR/worker-run.sh</string></array>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>ThrottleInterval</key><integer>10</integer>
  <key>StandardOutPath</key><string>$HOME/Library/Logs/trazer-warranty-worker.log</string>
  <key>StandardErrorPath</key><string>$HOME/Library/Logs/trazer-warranty-worker.log</string>
  <key>WorkingDirectory</key><string>$DIR</string>
</dict>
</plist>
PLISTEOF

launchctl bootout "gui/$(id -u)/io.trazer.warranty-worker" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$PLIST"
echo "installed — log: ~/Library/Logs/trazer-warranty-worker.log"
