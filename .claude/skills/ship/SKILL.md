---
name: ship
description: Run the full pre-ship gauntlet and deploy Mike to production — seven audit gates, inline-JS syntax check, locked-region verification, commit, push, and live verification. Use when shipping any change to trazermike.io.
disable-model-invocation: true
---

# Ship it

`disable-model-invocation` is set deliberately. Nothing deploys to the product
that pays Brandon's bills because Claude decided the code looked ready.

## The rule about approval

`push it` gates NEW WORK. It does NOT gate restoring correct behaviour — a
paying tech hitting a live defect right now IS the harm, and waiting on a
phrase extends it. Fix, gate, test, push, verify, then report what was done.

Still needs his word: new features, anything touching pricing or billing,
anything that spends money, anything reaching outside people, and product
trade-offs disguised as fixes (raising a timeout that slows every tech is a
decision, not a repair).

## Current state

!`cd /Users/brandonventura/Desktop/trazer && git branch --show-current && git status --porcelain | grep '^ M' || echo "(no tracked modifications)"`

## Gates — all must pass

!`cd /Users/brandonventura/Desktop/trazer && bash scripts/ship-gates.sh 2>&1`

## Then

1. **One commit per logical change.** Never bundle. A frontend commit must
   NOT carry backend changes — gate 7 checks `index.js` is untouched.
2. **Write why, not what.** The diff shows what. The message explains the
   failure, the cause, and the reasoning — that is what makes it reviewable
   in six months.
3. **Feature branch, then fast-forward to main.** `git fetch` first and check
   what rides along — other sessions share this checkout and their commits
   will deploy with yours.
4. **Push.** Railway auto-deploys from `main`, 90–180 seconds.
5. **Verify live, two signals, both required:**
   - `GET https://trazermike.io/api/health` — uptime resets to under ~120s
   - A content fingerprint from the new commit is present in what prod serves
     (`curl -s https://trazermike.io/ | grep -c '<a string only this commit has>'`)
   Uptime alone is not proof — pushing several commits in a row means an
   uptime reset can belong to the previous deploy.
6. **Then test the actual behaviour**, not just that it deployed. If a tech
   would touch it, drive it in a browser.

## Rollback

`git revert HEAD --no-edit && git push origin main`. Never `git reset --hard`
on main. Multi-commit rollbacks revert in reverse order, one commit each.

## Things that have bitten us

- A stale local server on port 3999 held the port with an old `JWT_SECRET`;
  `uncaughtException` keeps it alive on `EADDRINUSE` so the new one never
  bound and every test failed for the wrong reason.
- Testing locally against prod env inherits `APP_URL=https://trazermike.io`,
  so CORS rejects a browser on localhost. Set `APP_URL=http://localhost:3999`.
- Mic and camera cannot be agent-tested. Ship strict improvements and get one
  natural-use confirmation from Brandon.
