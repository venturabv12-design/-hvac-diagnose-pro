#!/usr/bin/env node
/**
 * Grandfather the founding techs before the card-upfront wall goes live.
 *
 * Sets plan='founder' (free forever, never card-walled) on every EXISTING account —
 * anyone created before CARD_WALL_CUTOFF who isn't already on a paying/founder plan.
 * This is belt-and-suspenders with the created_at cutoff in checkPaywall: the flag is
 * the durable, explicit protection; the cutoff is the fallback.
 *
 * SAFE BY DEFAULT: dry-run unless you pass --apply. Prints every account it would touch.
 *
 *   railway run node scripts/grandfather-founders.js           # dry run (report only)
 *   railway run node scripts/grandfather-founders.js --apply    # actually write plan='founder'
 *
 * Idempotent — re-running only touches rows not already 'founder'.
 */
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const CUTOFF = process.env.CARD_WALL_CUTOFF || '2026-07-25T23:59:59Z';
const CUTOFF_MS = new Date(CUTOFF).getTime();
const APPLY = process.argv.includes('--apply');

// Plans we must NOT overwrite (real paying customers / admins). Case-insensitive so a
// capitalized 'Admin' plan is still protected (Brandon's own account carries plan='Admin').
const KEEP = ['admin', 'pro', 'team', 'starter', 'founder'];
const isKept = (plan) => KEEP.includes(String(plan || '').toLowerCase());
// QA/test accounts must NOT be grandfathered — they should hit the wall (and get deleted).
const isTestAccount = (email) => /@trazertest\.com$/i.test(String(email || ''));

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('FATAL: SUPABASE_URL / SUPABASE_SERVICE_KEY not set (run via `railway run`).');
  process.exit(1);
}

async function sb(method, path, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status} ${text}`);
  return text ? JSON.parse(text) : null;
}

(async () => {
  console.log(`\nGrandfather backfill  —  cutoff ${CUTOFF}  —  mode: ${APPLY ? 'APPLY (writing)' : 'DRY RUN (no writes)'}\n`);
  const users = await sb('GET', 'users?select=id,email,plan,created_at&order=created_at.asc');
  const targets = users.filter(u => {
    if (isKept(u.plan)) return false;                     // never overwrite paying/admin/already-founder
    if (isTestAccount(u.email)) return false;             // QA/test accounts should be walled, not grandfathered
    const created = u.created_at ? new Date(u.created_at).getTime() : 0;
    return created < CUTOFF_MS;                            // created before the wall = founding tech
  });

  console.log(`Total accounts: ${users.length}`);
  console.log(`Kept as-is (paying/admin/founder): ${users.filter(u => isKept(u.plan)).length}`);
  console.log(`Skipped (QA/test accounts): ${users.filter(u => isTestAccount(u.email) && !isKept(u.plan)).length}`);
  console.log(`To grandfather → founder: ${targets.length}\n`);
  targets.forEach(u => console.log(`  ${u.email}  (plan=${u.plan || 'null'}, created=${u.created_at})`));

  if (!APPLY) { console.log('\nDRY RUN — nothing written. Re-run with --apply to commit.\n'); return; }

  let ok = 0;
  for (const u of targets) {
    await sb('PATCH', `users?id=eq.${u.id}`, { plan: 'founder' });
    ok++;
  }
  console.log(`\n✅ Grandfathered ${ok}/${targets.length} accounts to plan='founder'.\n`);
})().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
