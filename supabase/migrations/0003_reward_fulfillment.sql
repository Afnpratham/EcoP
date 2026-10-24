begin;
create table public.redemption_actions (
 id uuid primary key default gen_random_uuid(), redemption_id uuid not null unique references public.redemptions(id),
 actor_id uuid not null references public.profiles(id), action text not null check(action in ('fulfilled','cancelled')),
 note text not null check(length(note) between 5 and 500), created_at timestamptz not null default now()
);
alter table public.redemption_actions enable row level security;
grant select on public.redemption_actions to authenticated;
create policy actions_read on public.redemption_actions for select to authenticated using(public.is_admin() or exists(select 1 from public.redemptions r where r.id=redemption_id and r.user_id=auth.uid()));
drop policy redemptions_select_own on public.redemptions;
create policy redemptions_select_own on public.redemptions for select to authenticated using(user_id=auth.uid() or public.is_admin());
create function public.resolve_ecop_redemption(p_redemption_id uuid,p_action text,p_note text) returns jsonb
language plpgsql security definer set search_path=public as $$
declare d public.redemptions%rowtype; u uuid:=auth.uid();
begin
 if u is null then raise exception 'UNAUTHORIZED: Sign in first'; end if;
 if p_action is null or p_action not in ('fulfilled','cancelled') or coalesce(length(trim(p_note)),0) not between 5 and 500 then raise exception 'INVALID_INPUT: Action and explanation required'; end if;
 -- Match redemption's lock order (profile before reward). Read owner first; users cannot change it.
 select * into d from public.redemptions where id=p_redemption_id;
 if not found or (d.user_id<>u and not public.is_admin()) then raise exception 'NOT_FOUND: Redemption unavailable'; end if;
 if p_action='fulfilled' and not public.is_admin() then raise exception 'FORBIDDEN: Operator required for fulfillment'; end if;
 if p_action='fulfilled' and d.user_id=u then raise exception 'FORBIDDEN: A second operator must fulfill your reward'; end if;
 perform 1 from public.profiles where id=d.user_id for update;
 select * into d from public.redemptions where id=p_redemption_id for update;
 if d.status::text=p_action then return jsonb_build_object('success',true,'duplicate',true,'status',d.status); end if;
 if d.status<>'pending' then raise exception 'CONFLICT: Redemption already resolved'; end if;
 if p_action='cancelled' then
   update public.rewards set stock=stock+1 where id=d.reward_id;
   update public.profiles set eco_points=eco_points+d.points_spent where id=d.user_id;
   insert into public.transactions(user_id,type,amount,reference_id,description) values(d.user_id,'adjustment',d.points_spent,d.id,'Refund: cancelled reward');
 end if;
 update public.redemptions set status=p_action::redemption_status where id=d.id;
 insert into public.redemption_actions(redemption_id,actor_id,action,note) values(d.id,u,p_action,trim(p_note));
 return jsonb_build_object('success',true,'duplicate',false,'status',p_action);
end $$;
revoke execute on function public.resolve_ecop_redemption(uuid,text,text) from public,anon;
grant execute on function public.resolve_ecop_redemption(uuid,text,text) to authenticated;
-- Reject invalid/null metadata even through direct authenticated RPC calls.
create or replace function public.accept_ecop_batch(p_batch_id uuid,p_mass numeric,p_recycler text,p_receipt text) returns jsonb
language plpgsql security definer set search_path=public as $$
declare b public.recycling_batches%rowtype;
begin
 if not public.is_admin() then raise exception 'FORBIDDEN: Administrator required'; end if;
 select * into b from public.recycling_batches where id=p_batch_id for update;
 if not found then raise exception 'NOT_FOUND: Batch not found'; end if;
 if b.status<>'collected' then raise exception 'CONFLICT: Batch already accepted'; end if;
 if b.collector_id=auth.uid() then raise exception 'FORBIDDEN: A second operator must confirm acceptance'; end if;
 if p_mass is null or p_mass<0 or p_mass>b.collected_kg or coalesce(length(trim(p_recycler)),0) not between 2 and 200 or coalesce(length(trim(p_receipt)),0) not between 5 and 500 then raise exception 'INVALID_INPUT: Recycler, receipt and valid accepted mass required'; end if;
 update public.recycling_batches set status='accepted',accepted_kg=p_mass,recycler=trim(p_recycler),receipt=trim(p_receipt),receiver_id=auth.uid(),accepted_at=now() where id=b.id;
 return jsonb_build_object('batchId',b.id,'status','accepted');
end $$;
commit;
