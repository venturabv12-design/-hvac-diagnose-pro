# Trazer Warranty Service

Given a **brand + serial number**, returns the manufacturer's **actual warranty
registration** — registered vs base, active or not, and the real term end date.

This is the distinction that matters: every other tech-facing app (Bluon, the
serial-decoder sites, Housecall Pro's Bluon integration) reports a *"likely warranty
status"* estimated from the build date decoded out of the serial. That's a guess from
age. This reads the registry.

```
"likely warranty status"   ← what everyone else gives a tech
"REGISTERED (Residential Extended), Active, through 2033-07-15"   ← this
```

## Why it is a separate Railway service

Playwright cannot run under Nixpacks. Railway's documented path is a Dockerfile on
the official Playwright image with **≥1GB memory**. Mike builds on Nixpacks.

Converting Mike's build to Docker and adding a gigabyte of memory pressure to a live,
paying product — for a side feature — is how you take production down. So the browser
lives here. **If this service OOMs, crashes, or is deleted, Mike is byte-for-byte
unaffected** and simply tells the tech he couldn't reach the registry.

## Why a browser at all

Trane's lookup is a React front end over a JSON endpoint. We call the endpoint (the
contract survives a UI redesign; the form does not) — but the request must originate
inside a real browser session. Verified: a plain server-side `fetch` is refused at the
edge (403, then the connection is dropped). A browser session returns 200.

## Privacy — the non-obvious one

The upstream response includes the **homeowner's full install address**, returned on a
serial number alone with no last name. That never leaves `brands/trane.js`: the
normaliser reads only equipment and policy fields. The address is **not returned, not
cached, and not logged**. Verified by test.

## API

```
GET  /health   → { ok, browser, queued, cached, uptime }
GET  /brands   → per-brand support status
POST /lookup   → { brand, serial }        header: x-warranty-token
```

Three honest answers, never a guess:

| `reason` | Meaning |
|---|---|
| *(supported, `found: true`)* | Read from the registry |
| `not_wired_yet` | A public lookup exists; this brand isn't built yet |
| `no_public_registry` | No public lookup at all (Lennox — dealer portal only) |
| `unknown_brand` | Not recognised |

## Cost

Idles as a ~111 MB Node process; a browser is launched only for the few seconds a
lookup takes, then shut down after `IDLE_SHUTDOWN_MS`. Railway bills per second on
actual use, so this sits at roughly **$1–2/month**.

## Environment

| Var | Default | Purpose |
|---|---|---|
| `WARRANTY_SERVICE_TOKEN` | — | Shared secret; Mike sends it as `x-warranty-token` |
| `LOOKUP_TIMEOUT_MS` | 45000 | Hard ceiling per lookup |
| `IDLE_SHUTDOWN_MS` | 120000 | Close the browser after this much idle |
| `CACHE_TTL_MS` | 86400000 | Per-serial cache (registration changes ~once in a unit's life) |
| `RATE_PER_MIN` | 30 | Protects the manufacturer's site and us |

## Adding a brand

One file in `brands/`, exporting `{ id, label, aliases, supported, lookup(page, serial) }`,
registered in `brands/index.js`. Each manufacturer has its own lobby and its own way of
answering — when one redecorates, only that file changes.
