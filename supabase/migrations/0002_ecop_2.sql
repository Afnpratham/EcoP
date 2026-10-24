-- EcoP 2.0: additive migration. Apply in staging before deployment.
-- All financial writes occur inside locked transactions; clients cannot write ledgers.
begin;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id, full_name, email, role, sap_id)
  values(new.id, left(coalesce(nullif(new.raw_user_meta_data->>'full_name',''), split_part(new.email,'@',1)),100),
    new.email, case when new.raw_user_meta_data->>'role' in ('student','faculty') then (new.raw_user_meta_data->>'role')::user_role else 'visitor'::user_role end,
    left(new.raw_user_meta_data->>'sap_id',50));
  return new;
end $$;

revoke all on all tables in schema public from anon, authenticated;
grant select on public.bins, public.rewards, public.achievements to anon, authenticated;
grant select on public.profiles, public.sessions, public.disposals, public.transactions, public.redemptions, public.user_achievements to authenticated;
grant update(full_name, avatar_url) on public.profiles to authenticated;
drop policy if exists sessions_insert_own on public.sessions;
drop policy if exists redemptions_insert_own on public.redemptions;
revoke execute on all functions in schema public from public, anon, authenticated;
revoke execute on function public.award_points_for_session(uuid) from service_role;
revoke execute on function public.redeem_reward(uuid) from service_role;

alter table public.profiles add column leaderboard_opt_in boolean not null default false;
grant update(leaderboard_opt_in) on public.profiles to authenticated;
create or replace view public.leaderboard as
select id, full_name, avatar_url, role, eco_points, rank() over(order by eco_points desc, created_at asc) as rank
from public.profiles where leaderboard_opt_in;
grant select on public.leaderboard to authenticated;

alter table public.bins add column kind text not null default 'disposal' check(kind in ('disposal','refill'));
alter table public.bins add column proof_mode text not null default 'review' check(proof_mode in ('review','vision','fusion'));
alter table public.sessions add column kind text not null default 'disposal' check(kind in ('disposal','refill'));
alter table public.redemptions add column request_id uuid;
create unique index redemptions_request_unique on public.redemptions(user_id,request_id);

create table public.devices (
 id text primary key, bin_id text not null references public.bins(id), active boolean not null default true,
 beam_required boolean not null default false, load_required boolean not null default false,
 created_at timestamptz not null default now()
);
create table public.verification_events (
 id uuid primary key, session_id uuid not null unique references public.sessions(id), user_id uuid not null references public.profiles(id),
 device_id text not null references public.devices(id), boot_id uuid not null, track_id text not null,
 kind text not null check(kind in ('disposal','refill')), observed_at timestamptz not null, received_at timestamptz not null default now(),
 outcome text not null check(outcome in ('verified','inconclusive','rejected')), reason text not null,
 evidence jsonb not null, request_hash text not null, points integer not null default 0,
 unique(device_id,boot_id,track_id)
);
create table public.appeals (
 id uuid primary key default gen_random_uuid(), event_id uuid not null unique references public.verification_events(id),
 user_id uuid not null references public.profiles(id), reason text not null check(length(reason) between 10 and 1000), created_at timestamptz not null default now()
);
create table public.reviews (
 id uuid primary key default gen_random_uuid(), event_id uuid not null unique references public.verification_events(id),
 reviewer_id uuid not null references public.profiles(id), approved boolean not null, reason text not null check(length(reason) between 10 and 1000),
 created_at timestamptz not null default now()
);
create table public.recycling_batches (
 id uuid primary key default gen_random_uuid(), bin_id text not null references public.bins(id),
 collected_kg numeric not null check(collected_kg > 0 and collected_kg <= 1000),
 accepted_kg numeric check(accepted_kg >= 0 and accepted_kg <= collected_kg),
 contamination text not null, collector_id uuid not null references public.profiles(id),
 receiver_id uuid references public.profiles(id), recycler text, receipt text,
 status text not null default 'collected' check(status in ('collected','accepted')),
 created_at timestamptz not null default now(), accepted_at timestamptz
);
create table public.batch_items (
 event_id uuid primary key references public.verification_events(id), batch_id uuid not null references public.recycling_batches(id)
);
create index verification_user_time on public.verification_events(user_id,received_at desc);
create index verification_review_queue on public.verification_events(outcome,received_at);

create function public.is_admin() returns boolean language sql stable security definer set search_path = public as $$
 select exists(select 1 from public.profiles where id=auth.uid() and role='admin')
$$;
grant execute on function public.is_admin() to authenticated;

alter table public.devices enable row level security;
alter table public.verification_events enable row level security;
alter table public.appeals enable row level security;
alter table public.reviews enable row level security;
alter table public.recycling_batches enable row level security;
alter table public.batch_items enable row level security;
grant select on public.verification_events, public.appeals, public.reviews, public.recycling_batches, public.batch_items to authenticated;
create policy events_read on public.verification_events for select to authenticated using(user_id=auth.uid() or public.is_admin());
create policy appeals_read on public.appeals for select to authenticated using(user_id=auth.uid() or public.is_admin());
create policy reviews_read on public.reviews for select to authenticated using(public.is_admin() or exists(select 1 from public.verification_events e where e.id=event_id and e.user_id=auth.uid()));
create policy batches_read on public.recycling_batches for select to authenticated using(true);
create policy batch_items_read on public.batch_items for select to authenticated using(public.is_admin() or exists(select 1 from public.verification_events e where e.id=event_id and e.user_id=auth.uid()));

create function public.start_ecop_session(p_bin_id text) returns jsonb
language plpgsql security definer set search_path=public as $$
declare u uuid:=auth.uid(); b public.bins%rowtype; s public.sessions%rowtype;
begin
 if u is null then raise exception 'UNAUTHORIZED: Sign in to start a session'; end if;
 -- Serialize all starts for a user, including across bins; then serialize bin occupancy.
 perform 1 from public.profiles where id=u for update;
 select * into b from public.bins where id=p_bin_id for update;
 if not found then raise exception 'NOT_FOUND: Unknown station'; end if;
 if b.status <> 'active' then raise exception 'CONFLICT: Station is unavailable'; end if;
 update public.sessions set status='expired' where status='pending' and expires_at<=now() and (user_id=u or bin_id=p_bin_id);
 select * into s from public.sessions where user_id=u and bin_id=p_bin_id and status='pending';
 if found then return jsonb_build_object('sessionId',s.id,'binId',s.bin_id,'status',s.status,'expiresAt',s.expires_at,'kind',s.kind); end if;
 if exists(select 1 from public.sessions where status='pending' and (bin_id=p_bin_id or user_id=u)) then raise exception 'CONFLICT: A session is already active. Wait for it to finish'; end if;
 if exists(select 1 from public.sessions where user_id=u and bin_id=p_bin_id and started_at>now()-interval '1 minute') then raise exception 'RATE_LIMITED: Wait one minute before another attempt'; end if;
 if (select count(*) from public.sessions where user_id=u and started_at>now()-interval '1 hour')>=20 or
    (select count(*) from public.sessions where user_id=u and started_at>now()-interval '24 hours')>=100 then raise exception 'RATE_LIMITED: Session limit reached'; end if;
 insert into public.sessions(user_id,bin_id,kind,expires_at) values(u,p_bin_id,b.kind,now()+interval '5 minutes') returning * into s;
 return jsonb_build_object('sessionId',s.id,'binId',s.bin_id,'status',s.status,'expiresAt',s.expires_at,'kind',s.kind);
end $$;
grant execute on function public.start_ecop_session(text) to authenticated;

-- Private helper. No HTTP role can invoke it directly.
create function public.credit_ecop_event(p_event_id uuid) returns integer
language plpgsql security definer set search_path=public as $$
declare e public.verification_events%rowtype; total integer; value integer;
begin
 select * into e from public.verification_events where id=p_event_id for update;
 if not found then raise exception 'NOT_FOUND: Evidence missing'; end if;
 if e.points>0 then select eco_points into total from public.profiles where id=e.user_id; return total; end if;
 value := case when e.kind='refill' then 2 else 10 end;
 update public.profiles set eco_points=eco_points+value where id=e.user_id returning eco_points into total;
 if e.kind='disposal' then insert into public.disposals(session_id,user_id,points_awarded,verification_payload) values(e.session_id,e.user_id,value,jsonb_build_object('eventId',e.id,'evidence',e.evidence)); end if;
 insert into public.transactions(user_id,type,amount,reference_id,description) values(e.user_id,'earn',value,e.id,case when e.kind='refill' then 'Validated reusable bottle refill' else 'Verified bottle disposal' end);
 update public.verification_events set outcome='verified',points=value where id=e.id;
 update public.sessions set status='verified',verified_at=now() where id=e.session_id;
 -- Existing achievements remain functional, awarded from measured ledger/disposal counts.
 insert into public.user_achievements(user_id,achievement_id)
 select e.user_id,a.id from public.achievements a where
 (a.condition_type='disposals' and (select count(*) from public.disposals where user_id=e.user_id)>=a.threshold) or
 (a.condition_type='points' and (select coalesce(sum(amount),0) from public.transactions where user_id=e.user_id and type='earn')>=a.threshold)
 on conflict do nothing;
 return total;
end $$;

create function public.record_ecop_event(p_event jsonb) returns jsonb
language plpgsql security definer set search_path=public as $$
declare s public.sessions%rowtype; d public.devices%rowtype; b public.bins%rowtype; e public.verification_events%rowtype;
 v_event_id uuid:=(p_event->>'eventId')::uuid; observed timestamptz:=(p_event->>'timestamp')::timestamptz;
 total integer; outcome text:=p_event->>'outcome'; why text:=p_event->>'reason';
begin
 if coalesce(auth.jwt()->>'role','')<>'service_role' then raise exception 'FORBIDDEN: Device gateway only'; end if;
 perform pg_advisory_xact_lock(hashtextextended(v_event_id::text,0));
 select * into e from public.verification_events where verification_events.id=v_event_id;
 if found then
   if e.request_hash<>p_event->>'requestHash' then raise exception 'CONFLICT: Event ID reused with different content'; end if;
   return jsonb_build_object('eventId',e.id,'sessionId',e.session_id,'outcome',e.outcome,'pointsAwarded',e.points,'duplicate',true);
 end if;
 select * into s from public.sessions where sessions.id=(p_event->>'sessionId')::uuid for update;
 if not found then raise exception 'NOT_FOUND: Session not found'; end if;
 select * into d from public.devices where devices.id=p_event->>'deviceId' and active;
 if not found or d.bin_id<>s.bin_id or s.bin_id<>p_event->>'binId' then raise exception 'FORBIDDEN: Device, session and station must match'; end if;
 select * into b from public.bins where bins.id=s.bin_id;
 if b.status<>'active' or s.kind<>p_event->>'kind' then raise exception 'CONFLICT: Station or session kind unavailable'; end if;
 if s.status<>'pending' then raise exception 'CONFLICT: Session already resolved'; end if;
 if s.expires_at<=now() or observed<s.started_at or observed>s.expires_at or abs(extract(epoch from now()-observed))>120 then raise exception 'EXPIRED: Event is outside the session or delivery window'; end if;
 if outcome not in ('verified','inconclusive','rejected') or why is null then raise exception 'INVALID_INPUT: Missing decision'; end if;
 -- Configuration is authoritative, not supplied by devices.
 if outcome='verified' and b.proof_mode='review' then outcome:='inconclusive'; why:='Station requires human review until field validation is complete'; end if;
 if outcome='verified' and s.kind='disposal' and (
   (b.proof_mode='fusion' and (p_event->'evidence'->>'beam') is distinct from 'true') or
   (d.beam_required and (p_event->'evidence'->>'beam') is distinct from 'true') or
   (d.load_required and (p_event->'evidence'->>'load') is distinct from 'true')) then outcome:='inconclusive'; why:='Required station sensor evidence is missing'; end if;
 -- Serialize refill caps on the same profile lock used by credits/redemptions.
 perform 1 from public.profiles where profiles.id=s.user_id for update;
 if s.kind='refill' and (
   (select count(*) from public.verification_events where user_id=s.user_id and kind='refill' and received_at>now()-interval '24 hours')>=5 or
   exists(select 1 from public.verification_events where user_id=s.user_id and kind='refill' and received_at>now()-interval '30 minutes')) then raise exception 'RATE_LIMITED: Refills limited to five per day and one per thirty minutes'; end if;
 insert into public.verification_events(id,session_id,user_id,device_id,boot_id,track_id,kind,observed_at,outcome,reason,evidence,request_hash)
 values(v_event_id,s.id,s.user_id,d.id,(p_event->>'bootId')::uuid,p_event->>'trackId',s.kind,observed,outcome,why,p_event->'evidence',p_event->>'requestHash');
 if outcome='verified' then total:=public.credit_ecop_event(v_event_id);
 else update public.sessions set status='failed' where sessions.id=s.id;
   select eco_points into total from public.profiles where profiles.id=s.user_id;
 end if;
 return jsonb_build_object('eventId',v_event_id,'sessionId',s.id,'outcome',outcome,'reason',why,'pointsAwarded',case when outcome='verified' then case when s.kind='refill' then 2 else 10 end else 0 end,'newTotal',total,'duplicate',false);
end $$;
grant execute on function public.record_ecop_event(jsonb) to service_role;

create function public.appeal_ecop_event(p_event_id uuid,p_reason text) returns jsonb
language plpgsql security definer set search_path=public as $$
declare e public.verification_events%rowtype;
begin
 select * into e from public.verification_events where id=p_event_id for update;
 if not found or e.user_id is distinct from auth.uid() then raise exception 'NOT_FOUND: Evidence not found'; end if;
 if e.outcome='verified' or exists(select 1 from public.reviews where event_id=e.id) then raise exception 'CONFLICT: Event already resolved'; end if;
 if length(trim(p_reason)) not between 10 and 1000 then raise exception 'INVALID_INPUT: Explain your appeal in 10–1000 characters'; end if;
 insert into public.appeals(event_id,user_id,reason) values(e.id,auth.uid(),trim(p_reason));
 return jsonb_build_object('success',true);
end $$;
grant execute on function public.appeal_ecop_event(uuid,text) to authenticated;

create function public.review_ecop_event(p_event_id uuid,p_approve boolean,p_reason text) returns jsonb
language plpgsql security definer set search_path=public as $$
declare e public.verification_events%rowtype; total integer;
begin
 if not public.is_admin() then raise exception 'FORBIDDEN: Administrator required'; end if;
 select * into e from public.verification_events where id=p_event_id for update;
 if not found then raise exception 'NOT_FOUND: Evidence not found'; end if;
 if e.user_id=auth.uid() then raise exception 'FORBIDDEN: You cannot review your own event'; end if;
 if e.outcome='verified' or exists(select 1 from public.reviews where event_id=e.id) then raise exception 'CONFLICT: Event already reviewed'; end if;
 if length(trim(p_reason)) not between 10 and 1000 or p_approve is null then raise exception 'INVALID_INPUT: A decision and explanation are required'; end if;
 insert into public.reviews(event_id,reviewer_id,approved,reason) values(e.id,auth.uid(),p_approve,trim(p_reason));
 if p_approve then total:=public.credit_ecop_event(e.id);
 else update public.verification_events set outcome='rejected' where id=e.id; end if;
 return jsonb_build_object('success',true,'outcome',case when p_approve then 'verified' else 'rejected' end,'newTotal',total);
end $$;
grant execute on function public.review_ecop_event(uuid,boolean,text) to authenticated;

create function public.redeem_ecop_reward(p_reward_id uuid,p_request_id uuid) returns jsonb
language plpgsql security definer set search_path=public as $$
declare u uuid:=auth.uid(); p public.profiles%rowtype; r public.rewards%rowtype; d public.redemptions%rowtype;
begin
 if u is null then raise exception 'UNAUTHORIZED: Sign in to redeem'; end if;
 if p_request_id is null then raise exception 'INVALID_INPUT: Request ID required'; end if;
 select * into p from public.profiles where id=u for update;
 select * into d from public.redemptions where user_id=u and request_id=p_request_id;
 if found then
   if d.reward_id<>p_reward_id then raise exception 'CONFLICT: Request ID belongs to another reward'; end if;
   return jsonb_build_object('redemptionId',d.id,'rewardId',d.reward_id,'pointsSpent',d.points_spent,'newTotal',p.eco_points,'duplicate',true);
 end if;
 select * into r from public.rewards where id=p_reward_id for update;
 if not found or not r.active then raise exception 'NOT_FOUND: Reward unavailable'; end if;
 if r.stock<=0 then raise exception 'OUT_OF_STOCK: Reward is out of stock'; end if;
 if p.eco_points<r.cost_points then raise exception 'INSUFFICIENT_POINTS: Not enough Eco Points'; end if;
 update public.rewards set stock=stock-1 where id=r.id;
 update public.profiles set eco_points=eco_points-r.cost_points where id=u returning * into p;
 insert into public.redemptions(user_id,reward_id,points_spent,request_id) values(u,r.id,r.cost_points,p_request_id) returning * into d;
 insert into public.transactions(user_id,type,amount,reference_id,description) values(u,'redeem',-r.cost_points,d.id,'Redeemed: '||r.name);
 return jsonb_build_object('redemptionId',d.id,'rewardId',r.id,'pointsSpent',r.cost_points,'newTotal',p.eco_points,'duplicate',false);
end $$;
grant execute on function public.redeem_ecop_reward(uuid,uuid) to authenticated;

create function public.collect_ecop_batch(p_bin_id text,p_mass numeric,p_contamination text,p_event_ids uuid[]) returns jsonb
language plpgsql security definer set search_path=public as $$
declare batch uuid; cnt integer;
begin
 if not public.is_admin() then raise exception 'FORBIDDEN: Administrator required'; end if;
 if p_mass is null or p_mass<=0 or p_mass>1000 or length(p_contamination)>1000 or coalesce(cardinality(p_event_ids),0) not between 1 and 500 then raise exception 'INVALID_INPUT: Mass and 1–500 disposal receipts required'; end if;
 select count(*) into cnt from public.verification_events e join public.sessions s on e.session_id=s.id where e.id=any(p_event_ids) and e.outcome='verified' and e.kind='disposal' and s.bin_id=p_bin_id;
 if cnt<>cardinality(p_event_ids) then raise exception 'INVALID_INPUT: Receipts must be unique verified disposals from this bin'; end if;
 insert into public.recycling_batches(bin_id,collected_kg,contamination,collector_id) values(p_bin_id,p_mass,p_contamination,auth.uid()) returning id into batch;
 insert into public.batch_items(event_id,batch_id) select unnest(p_event_ids),batch;
 return jsonb_build_object('batchId',batch);
end $$;
grant execute on function public.collect_ecop_batch(text,numeric,text,uuid[]) to authenticated;

create function public.accept_ecop_batch(p_batch_id uuid,p_mass numeric,p_recycler text,p_receipt text) returns jsonb
language plpgsql security definer set search_path=public as $$
declare b public.recycling_batches%rowtype;
begin
 if not public.is_admin() then raise exception 'FORBIDDEN: Administrator required'; end if;
 select * into b from public.recycling_batches where id=p_batch_id for update;
 if not found then raise exception 'NOT_FOUND: Batch not found'; end if;
 if b.status<>'collected' then raise exception 'CONFLICT: Batch already accepted'; end if;
 if b.collector_id=auth.uid() then raise exception 'FORBIDDEN: A second operator must confirm acceptance'; end if;
 if p_mass is null or p_mass<0 or p_mass>b.collected_kg or length(trim(p_recycler)) not between 2 and 200 or length(trim(p_receipt)) not between 5 and 500 then raise exception 'INVALID_INPUT: Recycler, receipt and valid accepted mass required'; end if;
 update public.recycling_batches set status='accepted',accepted_kg=p_mass,recycler=p_recycler,receipt=p_receipt,receiver_id=auth.uid(),accepted_at=now() where id=b.id;
 return jsonb_build_object('batchId',b.id,'status','accepted');
end $$;
grant execute on function public.accept_ecop_batch(uuid,numeric,text,text) to authenticated;

-- New functions default to PUBLIC EXECUTE; revoke before commit, then regrant explicit surface.
revoke all on function public.credit_ecop_event(uuid) from public,anon,authenticated,service_role;
revoke execute on function public.record_ecop_event(jsonb) from public,anon,authenticated;
revoke execute on function public.start_ecop_session(text), public.appeal_ecop_event(uuid,text), public.review_ecop_event(uuid,boolean,text), public.redeem_ecop_reward(uuid,uuid), public.collect_ecop_batch(text,numeric,text,uuid[]), public.accept_ecop_batch(uuid,numeric,text,text), public.is_admin() from public,anon;
commit;
