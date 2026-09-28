-- Mike Memory — Phase 1: profile + rolling summary (the "biggest feel, least code" layer).
-- Server-side, account-keyed, so web chat AND native voice AND (later) offline share ONE memory.
-- No pgvector yet — that's Phase 2 (episodic + callback detection).

create table if not exists user_profile (
  user_id     uuid primary key references users(id) on delete cascade,
  facts       jsonb not null default '{}'::jsonb,   -- {name, region, brands:[], skill, truck_stock, tone, ...}
  updated_at  timestamptz not null default now()
);

create table if not exists user_summary (
  user_id     uuid primary key references users(id) on delete cascade,
  summary     text not null default '',             -- rolling ~500-1000 token natural-language summary
  updated_at  timestamptz not null default now()
);

-- Per-user isolation is the #1 memory safety invariant. RLS as defense-in-depth even though
-- the server uses the service key. (Service role bypasses RLS by design; this protects any
-- future anon/user-token path from cross-user leakage.)
alter table user_profile enable row level security;
alter table user_summary enable row level security;

-- Only the row owner can see/write their own memory.
drop policy if exists "own profile" on user_profile;
create policy "own profile" on user_profile
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "own summary" on user_summary;
create policy "own summary" on user_summary
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
