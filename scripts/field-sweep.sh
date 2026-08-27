#!/bin/bash
# ── FIELD SWEEP ───────────────────────────────────────────────────────────────
# Did any technician fail to get an answer in the last 2 hours?
#
# Written as a file rather than living inside a cron prompt because the inline
# version crashed on 2026-08-27 — Supabase returned an error object instead of a
# row array, the python iterated a dict, and the whole check died with a
# TypeError. A monitor that dies quietly is worse than no monitor: it reports
# nothing and looks exactly like "all clear". Every step here fails LOUD.
#
# Prints one line per check. Anything that needs a human starts with ALERT.
# Exit 0 = clean, 1 = something needs attention, 2 = the sweep itself is broken.
set -uo pipefail
cd /Users/brandonventura/Desktop/trazer || { echo "ALERT sweep_broken cannot reach repo"; exit 2; }

# ONE call to the Railway CLI, not three. Calling it per-variable returned empty for
# the 2nd and 3rd lookups on 2026-08-27, which made the sweep alert about a missing
# API key rather than about Mike — a monitor reporting its own plumbing is noise.
# The CLI intermittently returns an empty body even when it is installed, linked and
# working (observed twice on 2026-08-27). Retry rather than declare an outage — a
# monitor that cries wolf about its own tooling gets muted, and then it is watching
# nothing. Absolute path so PATH differences between shells cannot matter either.
ENV_DUMP=""
for _try in 1 2 3; do
  ENV_DUMP=$(/usr/local/bin/railway variables --service nodejs --kv 2>/dev/null)
  [ -n "$ENV_DUMP" ] && break
  sleep $((_try * 2))
done
[ -z "$ENV_DUMP" ] && { echo "ALERT sweep_broken railway CLI returned nothing after 3 tries"; exit 2; }
kv() { echo "$ENV_DUMP" | grep "^$1=" | cut -d= -f2-; }
JS=$(kv JWT_SECRET); SU=$(kv SUPABASE_URL); SK=$(kv SUPABASE_SERVICE_KEY)
[ -z "$SU" ] || [ -z "$SK" ] && { echo "ALERT sweep_broken missing Supabase credentials"; exit 2; }
[ -z "$JS" ] && { echo "ALERT sweep_broken no JWT_SECRET (railway not linked?)"; exit 2; }

ADM=$(JS="$JS" node -e "console.log(require('jsonwebtoken').sign({id:'8c63d02a-e2cc-4401-b457-74d98c8752bd',email:'venturabv12@gmail.com'},process.env.JS,{expiresIn:'15m',algorithm:'HS256'}))") \
  || { echo "ALERT sweep_broken could not mint admin token"; exit 2; }

RC=0

# ── 1. health ────────────────────────────────────────────────────────────────
H=$(/usr/bin/curl -s -m 20 https://trazermike.io/api/health)
if [ -z "$H" ]; then
  echo "ALERT health_unreachable trazermike.io/api/health returned nothing"; RC=1
else
  echo "$H" | python3 -c "
import sys,json
try: d=json.load(sys.stdin)
except Exception as e: print('ALERT health_unparseable',e); sys.exit(1)
if d.get('degraded'): print('ALERT degraded Mike is answering on a backup model, failovers=%s'%d.get('failovers'))
print('health ok=%s degraded=%s failovers=%s uptime=%s'%(d.get('ok'),d.get('degraded'),d.get('failovers'),d.get('uptime')))
" || RC=1
  echo "$H" | grep -q '"degraded":true' && RC=1
fi

# ── 2. incidents ─────────────────────────────────────────────────────────────
I=$(/usr/bin/curl -s -m 25 "https://trazermike.io/api/admin/incidents?hours=2" -H "Authorization: Bearer $ADM")
echo "$I" | python3 -c "
import sys,json
raw=sys.stdin.read()
try: d=json.loads(raw)
except Exception: print('ALERT incidents_unreadable',raw[:120]); sys.exit(1)
if not isinstance(d,dict) or not d.get('ok'): print('ALERT incidents_error',str(d)[:150]); sys.exit(1)
inc=d.get('incidents') or []
print('incidents reports=%s techs=%s anon=%s'%(d.get('totalReports'),d.get('techsAffected'),d.get('anonymousReports')))
bad=False
for i in inc:
    line='%s | %s | techs=%s count=%s'%(i.get('kind'),str(i.get('detail'))[:70],i.get('techsAffected'),i.get('count'))
    if i.get('kind')=='no_answer' or (i.get('techsAffected') or 0)>=2:
        print('ALERT tech_impact',line); bad=True
    else:
        print('  note',line)
sys.exit(1 if bad else 0)
" || RC=1

# ── 3. asked but never answered ──────────────────────────────────────────────
SINCE=$(python3 -c "import datetime;print((datetime.datetime.now(datetime.timezone.utc)-datetime.timedelta(hours=2)).isoformat().replace('+00:00','Z'))")
E=$(/usr/bin/curl -s -m 30 "$SU/rest/v1/events?select=user_id,type&type=in.(mike_ask,mike_answer)&created_at=gte.$SINCE&limit=500" \
      -H "apikey: $SK" -H "Authorization: Bearer $SK")
echo "$E" | python3 -c "
import sys,json,collections
raw=sys.stdin.read()
try: r=json.loads(raw)
except Exception: print('ALERT db_unreadable',raw[:120]); sys.exit(1)
# THE BUG THIS FILE EXISTS FOR: an error object is a dict, iterating it yields
# strings, and x['user_id'] raised TypeError and killed the sweep silently.
if not isinstance(r,list): print('ALERT db_error',str(r)[:160]); sys.exit(1)
per=collections.defaultdict(lambda:[0,0])
for x in r:
    if not isinstance(x,dict): continue
    per[x.get('user_id')][0 if x.get('type')=='mike_ask' else 1]+=1
gaps=[(u,a,b) for u,(a,b) in per.items() if a>b]
print('askanswer techs=%d gaps=%d'%(len(per),len(gaps)))
for u,a,b in gaps: print('ALERT unanswered tech=%s asked=%d answered=%d'%(str(u)[:8],a,b))
sys.exit(1 if gaps else 0)
" || RC=1

[ $RC -eq 0 ] && echo "SWEEP_CLEAN"
exit $RC
