#!/usr/bin/env bash
# Bring up a real X display for Chrome, then start the service.
#
# Carrier's lookup refuses a headless browser, so the container needs a genuine display
# rather than a faked user agent. But the service must never fail to boot because of it:
# a warranty lookup that is degraded is bad, a container that will not start is worse —
# it took Mike's warranty offline entirely.
set -u
DISPLAY_NUM="${DISPLAY_NUM:-99}"
export DISPLAY=":${DISPLAY_NUM}"

if command -v Xvfb >/dev/null 2>&1; then
  Xvfb "$DISPLAY" -screen 0 1512x900x24 -nolisten tcp >/tmp/xvfb.log 2>&1 &
  for i in $(seq 1 40); do
    if xdpyinfo -display "$DISPLAY" >/dev/null 2>&1; then
      echo "[display] Xvfb up on $DISPLAY — Chrome will run headed"
      export CDP_HEADED=1
      break
    fi
    sleep 0.25
  done
  if ! xdpyinfo -display "$DISPLAY" >/dev/null 2>&1; then
    echo "[display] Xvfb did not come up — falling back to headless (Carrier will report inconclusive)"
    unset CDP_HEADED
  fi
else
  echo "[display] Xvfb not installed — headless"
  unset CDP_HEADED
fi

exec node index.js
