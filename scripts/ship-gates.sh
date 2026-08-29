#!/bin/bash
# The seven pre-ship gates, plus the two checks that catch what the seven miss.
# Exit 0 = safe to commit. Exit 1 = do not ship.
set -uo pipefail
cd /Users/brandonventura/Desktop/trazer || { echo "FATAL cannot reach repo"; exit 1; }
RC=0
ok(){ printf "  ✓ %-34s %s\n" "$1" "${2:-}"; }
no(){ printf "  ✗ %-34s %s\n" "$1" "${2:-}"; RC=1; }

# Baselines. These are the counts on a known-good tree; drift means something was
# deleted or duplicated by an edit that looked unrelated.
declare -a NAMES=(parseJSON renderDiagCards JOB_SAVED 'data-lucide=')
declare -a WANT=(4 2 6 29)
BRACE_WANT=-1

node --check index.js >/dev/null 2>&1 && ok "node --check index.js" || no "node --check index.js" "SYNTAX ERROR"

for i in "${!NAMES[@]}"; do
  got=$(grep -c "${NAMES[$i]}" public/index.html)
  [ "$got" = "${WANT[$i]}" ] && ok "${NAMES[$i]}" "$got" || no "${NAMES[$i]}" "got $got, expected ${WANT[$i]}"
done

o=$(awk -F'{' '{c+=NF-1} END{print c}' public/index.html)
c=$(awk -F'}' '{c+=NF-1} END{print c}' public/index.html)
d=$((o-c))
[ "$d" = "$BRACE_WANT" ] && ok "brace delta" "$d" || no "brace delta" "got $d, expected $BRACE_WANT — unbalanced edit"

# Gate 7: a commit touching the frontend must not carry backend changes.
if git diff --name-only --cached 2>/dev/null | grep -q '^public/index.html$' || git diff --name-only | grep -q '^public/index.html$'; then
  if git diff --name-only HEAD | grep -q '^index.js$'; then
    no "index.js untouched" "frontend + backend in one commit — split them"
  else ok "index.js untouched" "(frontend commit)"; fi
else ok "index.js check" "(not a frontend commit)"; fi

# Brace counts and node --check BOTH miss syntax errors inside inline <script> blocks.
node -e "
const fs=require('fs'),vm=require('vm');
const h=fs.readFileSync('public/index.html','utf8');
let n=0,bad=0;
h.replace(/<script(?![^>]*src=)(?![^>]*type=\"application\/json\")[^>]*>([\s\S]*?)<\/script>/g,(m,code)=>{
  n++; try{ new vm.Script(code); }catch(e){ bad++; console.log('       '+e.message.slice(0,90)); } return m;});
process.stdout.write(n+' blocks');
process.exit(bad?1:0);
" >/tmp/_inline 2>&1 && ok "inline JS parses" "$(cat /tmp/_inline)" || { no "inline JS parses" "$(cat /tmp/_inline)"; }

# The locked camera flow — ten functions that must survive any edit.
MISSING=""
for f in primeCameraAudio checkCameraAccess startLiveCamera startCameraStream stopLiveCamera \
         flipCamera analyzeCameraFrame setCameraResponse updateCameraMicState mikeSayCamera; do
  [ "$(grep -c "function $f" public/index.html)" -ge 1 ] || MISSING="$MISSING $f"
done
[ -z "$MISSING" ] && ok "locked camera functions" "all 10 present" || no "locked camera functions" "MISSING:$MISSING"

echo
if [ $RC -eq 0 ]; then echo "  ALL GATES PASS — safe to commit"; else echo "  GATES FAILED — do not ship"; fi
exit $RC
