-- ============================================================================
-- EcoP — initial schema, RLS, and SECURITY DEFINER functions
-- ============================================================================
-- Run order: this file, then 0002_seed.sql (or supabase/seed.sql).
-- Design: `transactions` is the source of truth for points. `profiles.eco_points`
-- is a cached total kept in sync by a single SECURITY DEFINER function so
-- balances can never drift or be edited from the client.
-- ============================================================================

-- Needed for gen_random_uuid()
create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- ENUMS
-- ----------------------------------------------------------------------------
do $$ begin
  create type user_role as enum ('student', 'faculty', 'visitor', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type bin_status as enum ('active', 'inactive', 'maintenance');
exception when duplicate_object then null; end $$;

do $$ begin
  create type session_status as enum ('pending', 'verified', 'expired', 'failed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type transaction_type as enum ('earn', 'redeem', 'adjustment');
exception when duplicate_object then null; end $$;

do $$ begin
  create type redemption_status as enum ('pending', 'fulfilled', 'cancelled');
exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
-- TABLES
-- ----------------------------------------------------------------------------

-- profiles: 1:1 with auth.users
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null,
  email       text not null,
  role        user_role not null default 'visitor',
  sap_id      text,
  avatar_url  text,
  eco_points  integer not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_eco_points on public.profiles(eco_points desc);

-- bins: id is the QR code value (e.g. 'BIN-014')
create table if not exists public.bins (
  id          text primary key,
  location    text not null,
  status      bin_status not null default 'active',
  created_at  timestamptz not null default now()
);
create index if not exists idx_bins_status on public.bins(status);

-- sessions: a disposal session created when a user scans a bin QR
create table if not exists public.sessions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  bin_id       text not null references public.bins(id) on delete restrict,
  status       session_status not null default 'pending',
  started_at   timestamptz not null default now(),
  expires_at   timestamptz not null default (now() + interval '5 minutes'),
  verified_at  timestamptz,
  created_at   timestamptz not null default now()
);
create index if not exists idx_sessions_user on public.sessions(user_id);
create index if not exists idx_sessions_bin on public.sessions(bin_id);
create index if not exists idx_sessions_status on public.sessions(status);
-- A bin may have at most one *pending* session at a time (anti-fraud).
create unique index if not exists uniq_sessions_active_bin
  on public.sessions(bin_id) where status = 'pending';

-- disposals: one per session (idempotency key = session_id)
create table if not exists public.disposals (
  id                   uuid primary key default gen_random_uuid(),
  session_id           uuid not null unique references public.sessions(id) on delete cascade,
  user_id              uuid not null references public.profiles(id) on delete cascade,
  points_awarded       integer not null,
  verification_payload jsonb,
  created_at           timestamptz not null default now()
);

-- transactions: append-only ledger. This is the source of truth for points.
-- amount is positive for earns, negative for redemptions/adjustments.
create table if not exists public.transactions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  type          transaction_type not null,
  amount        integer not null,
  reference_id  uuid,
  description   text,
  created_at    timestamptz not null default now()
);
create index if not exists idx_transactions_user on public.transactions(user_id);
create index if not exists idx_transactions_user_type on public.transactions(user_id, type);
create index if not exists idx_transactions_created_at on public.transactions(created_at desc);

-- rewards: the redeemable catalogue
create table if not exists public.rewards (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  description  text,
  cost_points  integer not null check (cost_points > 0),
  stock        integer not null default 0 check (stock >= 0),
  image_url    text,
  active       boolean not null default true,
  created_at   timestamptz not null default now()
);

-- redemptions: a user spending points on a reward
create table if not exists public.redemptions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  reward_id     uuid not null references public.rewards(id) on delete restrict,
  points_spent  integer not null,
  status        redemption_status not null default 'pending',
  created_at    timestamptz not null default now()
);
create index if not exists idx_redemptions_user on public.redemptions(user_id);

-- achievements + user_achievements
create table if not exists public.achievements (
  id             uuid primary key default gen_random_uuid(),
  code           text not null unique,
  name           text not null,
  description    text not null,
  icon           text not null,
  condition_type text not null,
  threshold      integer
);

create table if not exists public.user_achievements (
  user_id        uuid not null references public.profiles(id) on delete cascade,
  achievement_id uuid not null references public.achievements(id) on delete cascade,
  earned_at      timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

-- ----------------------------------------------------------------------------
-- LEADERBOARD VIEW (read-only, public)
-- ----------------------------------------------------------------------------
create or replace view public.leaderboard as
  select
    id,
    full_name,
    avatar_url,
    role,
    eco_points,
    rank() over (order by eco_points desc, created_at asc) as rank
  from public.profiles;

-- ----------------------------------------------------------------------------
-- AUTO-CREATE PROFILE ON SIGNUP
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_role user_role;
begin
  -- Read the role from registration metadata; fall back to 'visitor'.
  begin
    v_role := (new.raw_user_meta_data ->> 'role')::user_role;
  exception when others then
    v_role := 'visitor';
  end;

  insert into public.profiles (id, full_name, email, role, sap_id, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.email,
    v_role,
    new.raw_user_meta_data ->> 'sap_id',
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- AWARD POINTS — SECURITY DEFINER, service-role only
-- ----------------------------------------------------------------------------
-- Idempotent: a second call for an already-verified session returns the
-- existing result. Awards +ECO_POINTS only when the session is pending and
-- not expired. Runs disposal insert + transaction insert + profile update +
-- session verification in one transaction.
create or replace function public.award_points_for_session(p_session_id uuid)
returns table (
  success         boolean,
  session_id      uuid,
  points_awarded  integer,
  new_total       integer,
  status          text,
  reason          text
)
language plpgsql
security definer set search_path = public
as $$
declare
  v_session    public.sessions%rowtype;
  v_existing   public.disposals%rowtype;
  v_points     integer := 10;
  v_new_total  integer;
begin
  -- Restrict to the service role. A plain user JWT has role='authenticated'.
  if coalesce(auth.jwt() ->> 'role', '') <> 'service_role' then
    return query select false, p_session_id, 0, 0, 'forbidden',
      'Only the service role may award points';
    return;
  end if;

  select * into v_session from public.sessions where id = p_session_id;
  if not found then
    return query select false, p_session_id, 0, 0, 'not_found',
      'Session not found';
    return;
  end if;

  -- Idempotency: already verified -> return existing result, no double award.
  if v_session.status = 'verified' then
    select * into v_existing from public.disposals where session_id = p_session_id;
    select eco_points into v_new_total from public.profiles where id = v_session.user_id;
    return query select true, p_session_id,
      coalesce(v_existing.points_awarded, 0), coalesce(v_new_total, 0),
      'already_verified', 'Session already verified';
    return;
  end if;

  -- Session must be pending.
  if v_session.status <> 'pending' then
    return query select false, p_session_id, 0, 0, v_session.status::text,
      'Session is not pending';
    return;
  end if;

  -- Session must not have expired (checked on read).
  if v_session.expires_at < now() then
    update public.sessions set status = 'expired' where id = p_session_id;
    return query select false, p_session_id, 0, 0, 'expired',
      'Session expired before verification';
    return;
  end if;

  -- ── Award (single transaction) ──────────────────────────────────────
  update public.profiles
     set eco_points = eco_points + v_points
   where id = v_session.user_id
   returning eco_points into v_new_total;

  insert into public.disposals (session_id, user_id, points_awarded, verification_payload)
  values (p_session_id, v_session.user_id, v_points, jsonb_build_object('engine', 'awareness-engine'));

  insert into public.transactions (user_id, type, amount, reference_id, description)
  values (v_session.user_id, 'earn', v_points, p_session_id, 'Verified disposal');

  update public.sessions
     set status = 'verified', verified_at = now()
   where id = p_session_id;
  -- ─────────────────────────────────────────────────────────────────────

  return query select true, p_session_id, v_points, v_new_total, 'verified', 'Points awarded';
  return;
end;
$$;

-- ----------------------------------------------------------------------------
-- REDEEM REWARD — row-level locking prevents double-submit race
-- ----------------------------------------------------------------------------
-- SECURITY DEFINER so the client can INSERT a redemption without needing
-- write access to profiles/transactions. The function locks the profile row
-- (SELECT ... FOR UPDATE), re-checks the balance, then atomically deducts.
create or replace function public.redeem_reward(p_reward_id uuid)
returns table (
  success        boolean,
  redemption_id  uuid,
  reward_id      uuid,
  points_spent   integer,
  new_total      integer,
  status         text,
  reason         text
)
language plpgsql
security definer set search_path = public
as $$
declare
  v_user_id    uuid := auth.uid();
  v_reward     public.rewards%rowtype;
  v_profile    public.profiles%rowtype;
  v_redemption uuid;
begin
  if v_user_id is null then
    return query select false, null::uuid, p_reward_id, 0, 0, 'unauthorized', 'Not signed in';
    return;
  end if;

  select * into v_reward from public.rewards where id = p_reward_id;
  if not found then
    return query select false, null::uuid, p_reward_id, 0, 0, 'not_found', 'Reward not found';
    return;
  end if;

  if v_reward.active is false then
    return query select false, null::uuid, p_reward_id, 0, 0, 'inactive', 'Reward is not active';
    return;
  end if;

  -- Lock the user's profile row to serialize concurrent redemptions.
  select * into v_profile from public.profiles where id = v_user_id for update;

  if v_profile.eco_points < v_reward.cost_points then
    return query select false, null::uuid, p_reward_id, 0, v_profile.eco_points,
      'insufficient_points', 'Not enough Eco Points';
    return;
  end if;

  if v_reward.stock <= 0 then
    return query select false, null::uuid, p_reward_id, 0, v_profile.eco_points,
      'out_of_stock', 'Reward is out of stock';
    return;
  end if;

  -- Reserve stock first (row lock on rewards prevents oversell).
  update public.rewards set stock = stock - 1 where id = p_reward_id and stock > 0;
  if not found then
    return query select false, null::uuid, p_reward_id, 0, v_profile.eco_points,
      'out_of_stock', 'Reward is out of stock';
    return;
  end if;

  -- Deduct points + ledger entry in the same transaction.
  update public.profiles set eco_points = eco_points - v_reward.cost_points
   where id = v_user_id
   returning eco_points into v_profile.eco_points;

  insert into public.redemptions (user_id, reward_id, points_spent, status)
  values (v_user_id, p_reward_id, v_reward.cost_points, 'pending')
  returning id into v_redemption;

  insert into public.transactions (user_id, type, amount, reference_id, description)
  values (v_user_id, 'redeem', -v_reward.cost_points, v_redemption,
    'Redeemed: ' || v_reward.name);

  return query select true, v_redemption, p_reward_id, v_reward.cost_points,
    v_profile.eco_points, 'pending', 'Redemption created';
  return;
end;
$$;

-- ----------------------------------------------------------------------------
-- EXPIRE STALE SESSIONS — safe to call from API or a scheduled job
-- ----------------------------------------------------------------------------
create or replace function public.expire_stale_sessions()
returns integer
language plpgsql
security definer set search_path = public
as $$
declare
  v_count integer;
begin
  update public.sessions
     set status = 'expired'
   where status = 'pending' and expires_at < now();
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- ----------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ----------------------------------------------------------------------------
alter table public.profiles          enable row level security;
alter table public.bins              enable row level security;
alter table public.sessions          enable row level security;
alter table public.disposals         enable row level security;
alter table public.transactions      enable row level security;
alter table public.rewards           enable row level security;
alter table public.redemptions       enable row level security;
alter table public.achievements      enable row level security;
alter table public.user_achievements enable row level security;

-- profiles: users see/update only their own row.
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
drop policy if exists "profiles_update_own" on public.profiles;
-- Restrict client profile writes to safe columns using GRANT below.
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);
revoke update on public.profiles from authenticated;
grant update (full_name, avatar_url) on public.profiles to authenticated;

-- bins: anyone can read (public catalogue); writes are service-role only
-- (no policy => service role bypasses RLS, clients cannot write).
drop policy if exists "bins_public_read" on public.bins;
create policy "bins_public_read" on public.bins
  for select using (true);

-- sessions: users may SELECT + INSERT their own; UPDATE is service-role only.
drop policy if exists "sessions_select_own" on public.sessions;
create policy "sessions_select_own" on public.sessions
  for select using (auth.uid() = user_id);
drop policy if exists "sessions_insert_own" on public.sessions;
-- Sessions must be started by the validated server route, not direct inserts.
-- Remove user insert privileges in a production migration.
create policy "sessions_insert_own" on public.sessions
  for insert with check (auth.uid() = user_id);

-- disposals + transactions: SELECT own rows only. NO client INSERT policy —
-- inserts happen exclusively through SECURITY DEFINER functions (service role).
drop policy if exists "disposals_select_own" on public.disposals;
create policy "disposals_select_own" on public.disposals
  for select using (auth.uid() = user_id);

drop policy if exists "transactions_select_own" on public.transactions;
create policy "transactions_select_own" on public.transactions
  for select using (auth.uid() = user_id);

-- rewards: public SELECT of all rewards (we filter active in-app).
drop policy if exists "rewards_public_read" on public.rewards;
create policy "rewards_public_read" on public.rewards
  for select using (true);

-- redemptions: authenticated users SELECT/INSERT their own. The points
-- deduction itself happens inside redeem_reward() (SECURITY DEFINER).
drop policy if exists "redemptions_select_own" on public.redemptions;
create policy "redemptions_select_own" on public.redemptions
  for select using (auth.uid() = user_id);
drop policy if exists "redemptions_insert_own" on public.redemptions;
create policy "redemptions_insert_own" on public.redemptions
  for insert with check (auth.uid() = user_id);

-- achievements: public read; user_achievements: read own.
drop policy if exists "achievements_public_read" on public.achievements;
create policy "achievements_public_read" on public.achievements
  for select using (true);
drop policy if exists "user_achievements_select_own" on public.user_achievements;
create policy "user_achievements_select_own" on public.user_achievements
  for select using (auth.uid() = user_id);

-- The leaderboard view is public read.
-- Views do not support RLS policies. Access controlled via underlying tables.
-- Restrict access to the view separately as appropriate for deployment.
