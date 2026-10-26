alter table public.subscriptions
  add column if not exists plan text not null default 'free' check (plan in ('free', 'pro')),
  add column if not exists billing_interval text check (billing_interval is null or billing_interval in ('monthly', 'yearly')),
  add column if not exists founder_access boolean not null default false,
  add column if not exists last_event_created bigint not null default 0;

alter table public.subscriptions alter column stripe_customer_id drop not null;

update public.subscriptions
set plan = case
  when status in ('active', 'trialing', 'past_due')
    or (status = 'canceled' and current_period_end > now())
  then 'pro'
  else 'free'
end
where plan = 'free';

update public.subscriptions
set founder_access = true, plan = 'pro'
where user_id in (select id from public.profiles where is_founder);

insert into public.subscriptions (user_id, plan, status, founder_access)
select profile.id, 'pro', 'active', true
from public.profiles as profile
where profile.is_founder
  and not exists (
    select 1 from public.subscriptions as subscription
    where subscription.user_id = profile.id
  );

create table if not exists public.stripe_webhook_events (
  event_id text primary key,
  event_type text not null,
  processed_at timestamptz not null default now()
);

create or replace function public.is_public_pro_profile(profile_username text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles as profile
    join public.subscriptions as subscription on subscription.user_id = profile.id
    where profile.username = profile_username
      and profile.is_public
      and subscription.plan = 'pro'
      and (
        subscription.founder_access
        or
        (subscription.status in ('active', 'trialing') and subscription.current_period_end > now())
        or (subscription.status = 'past_due' and subscription.current_period_end + interval '7 days' > now())
        or (subscription.status = 'canceled' and subscription.current_period_end > now())
      )
  );
$$;

alter table public.subscriptions enable row level security;
alter table public.stripe_webhook_events enable row level security;

drop policy if exists "Owners read their subscriptions" on public.subscriptions;
create policy "Owners read their subscriptions"
  on public.subscriptions for select
  using (user_id = (select auth.uid()));

revoke all on public.stripe_webhook_events from anon, authenticated;
revoke all on function public.is_public_pro_profile(text) from public;
grant execute on function public.is_public_pro_profile(text) to anon, authenticated;
revoke insert, update, delete on public.subscriptions from anon, authenticated;
grant select on public.subscriptions to authenticated;
grant all on public.subscriptions, public.stripe_webhook_events to service_role;
