# mike-watchdog — the watcher that survives this laptop dying

Runs on **Railway** (project "Trazer Mike", service `mike-watchdog`). Polls Mike's health
and the warranty worker, and **emails Brandon** when either goes down or comes back.

This is the only monitor that keeps working when the house laptop is the thing that died —
which is exactly the gap that let the warranty worker stay dead for 53 hours on 2026-09-13
with nobody knowing.

## Why this copy exists

`~/Desktop/mike-watchdog` was **not a git repo**. It deployed with `railway up` straight
from that folder, so the only copy of it lived on one laptop. Backed up here 2026-09-15
before a macOS upgrade, because losing it would mean losing the alarm and not finding out
until the next outage went unreported.

## Deploying

    cd ~/Desktop/mike-watchdog
    railway link -p "Trazer Mike" -s mike-watchdog -e production
    railway up --detach

Editing the local file changes nothing until you deploy. There is no webhook.

## State

- **Voice calls are OFF and stay off.** `VAPI_KEY` was deleted 2026-09-14 — Brandon:
  "I didn't tell him to call me, you made it start calling me." Do not re-enable.
- **Email is the channel.** Resend, from the verified mike@trazermike.io, needs
  `RESEND_API_KEY` set on the service.
- Health: `https://mike-watchdog-production.up.railway.app/status`
  `alertReady:false` is CORRECT — it means the voice call cannot fire.
