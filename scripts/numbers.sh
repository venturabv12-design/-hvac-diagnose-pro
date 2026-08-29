#!/bin/bash
# Verified Trazer/Mike metrics. Every count comes from Prefer: count=exact — never
# from counting returned rows, because PostgREST truncates and that is how a real
# number silently became a smaller wrong one.
set -uo pipefail
cd /Users/brandonventura/Desktop/trazer || { echo "FATAL cannot reach repo"; exit 2; }

ENV_DUMP=""
for t in 1 2 3; do
  ENV_DUMP=$(/usr/local/bin/railway variables --service nodejs --kv 2>/dev/null)
  [ -n "$ENV_DUMP" ] && break; sleep $((t*2))
done
[ -z "$ENV_DUMP" ] && { echo "FATAL railway CLI returned nothing"; exit 2; }
kv(){ echo "$ENV_DUMP" | grep "^$1=" | cut -d= -f2-; }
SU=$(kv SUPABASE_URL); SK=$(kv SUPABASE_SERVICE_KEY); JS=$(kv JWT_SECRET)
[ -z "$SU" ] || [ -z "$SK" ] && { echo "FATAL missing Supabase credentials"; exit 2; }

QA=7725dfff-9e37-4eb9-a2cd-5d8c547fbeb3      # Claude's QA CREW account
AD=8c63d02a-e2cc-4401-b457-74d98c8752bd      # Brandon's admin account
NOT="user_id=not.in.($QA,$AD)"

cnt(){ /usr/bin/curl -s -I "$SU/rest/v1/$1" -H "apikey: $SK" -H "Authorization: Bearer $SK" \
        -H "Prefer: count=exact" | grep -i content-range | grep -oE '/[0-9]+' | tr -d '/'; }

echo "TRAZER NUMBERS — $(date -u +%Y-%m-%d) (QA + admin excluded)"
echo
echo "ACCOUNTS"
echo "  signed up            $(cnt "users?select=id&id=not.in.($QA,$AD)")"
ASK=$(cnt "events?select=id&type=eq.mike_ask&$NOT")
echo
echo "USAGE"
echo "  questions asked      $ASK   (requests; client retries up to 3x, so this overstates distinct questions)"
/usr/bin/curl -s "$SU/rest/v1/events?select=user_id,created_at&type=eq.mike_ask&$NOT&limit=100000" \
  -H "apikey: $SK" -H "Authorization: Bearer $SK" -H "Range: 0-99999" | python3 -c "
import sys,json
try: d=json.load(sys.stdin)
except Exception as e: print('  active techs         ERROR',e); raise SystemExit
if not isinstance(d,list): print('  active techs         ERROR',str(d)[:90]); raise SystemExit
days=sorted(set(x['created_at'][:10] for x in d))
print('  active techs         %d  (ever asked anything)'%len(set(x['user_id'] for x in d)))
if days: print('  window               %s to %s  (%d days)'%(days[0],days[-1],len(days)))"
echo
echo "JOBS   (from events — the jobs TABLE is empty, saves fail on a schema mismatch)"
JS_=$(cnt "events?select=id&type=eq.job_start&$NOT"); JC=$(cnt "events?select=id&type=eq.job_closed&$NOT")
echo "  opened               $JS_"
echo "  closed               $JC$([ -n "$JS_" ] && [ "$JS_" -gt 0 ] 2>/dev/null && echo "   ($(( JC*100/JS_ ))%)")"
echo
echo "QUALITY"
echo "  wrong-answer flags   $(cnt "events?select=id&type=eq.answer_flag&$NOT")   (0 = nobody has been asked to grade it — NOT an accuracy claim)"
echo "  feedback left        $(cnt "events?select=id&type=eq.feedback&$NOT")"
echo
echo "FIELD FAILURES"
echo "  client errors (24h)  $(cnt "events?select=id&type=eq.client_error&created_at=gte.$(python3 -c 'import datetime;print((datetime.datetime.now(datetime.timezone.utc)-datetime.timedelta(days=1)).isoformat().replace("+00:00","Z"))')")"
echo
echo "TRAFFIC / CONVERSION / REVENUE  (live from the product's own stats)"
if [ -n "$JS" ]; then
  ADM=$(JS="$JS" node -e "console.log(require('jsonwebtoken').sign({id:'$AD',email:'venturabv12@gmail.com'},process.env.JS,{expiresIn:'5m',algorithm:'HS256'}))" 2>/dev/null)
  /usr/bin/curl -s -m 40 https://trazermike.io/api/admin/stats -H "Authorization: Bearer $ADM" | python3 -c "
import sys,json
try: d=json.load(sys.stdin)
except Exception: print('  (stats unavailable)'); raise SystemExit
t=d.get('traffic',{}); a=d.get('accounts',{}); l7=t.get('last7',{}) or {}
print('  visitors 7d          %s'%(l7.get('dedupedVisitors') or l7.get('uniques')))
print('  views 7d             %s'%l7.get('views'))
print('  signups 30d          %s'%a.get('signups30'))
print('  visitor -> signup    %s%%'%a.get('conversion30'))
print('  activation           %s%% (%s of %s)'%(a.get('activationRate'),a.get('activated'),a.get('total')))
print('  PAYING               %s'%a.get('paying'))"
else
  echo "  (no JWT_SECRET — skipped)"
fi
echo
echo "Remember: exclude house accounts · date every figure · never annualise YTD."
