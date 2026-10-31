-- Anonymous daily counters. No visitor id, IP address, or user agent is stored.
create table if not exists public.event_counts (
  day date not null,
  event text not null check (event in ('profile_viewed', 'card_shared')),
  subject_id uuid not null,
  total integer not null default 0 check (total >= 0),
  primary key (day, event, subject_id)
);

alter table public.event_counts enable row level security;
revoke all on public.event_counts from anon, authenticated;

create or replace function public.record_event(event_name text, subject uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.event_counts (day, event, subject_id, total)
  values (current_date, event_name, subject, 1)
  on conflict (day, event, subject_id) do update set total = public.event_counts.total + 1;
$$;

revoke all on function public.record_event(text, uuid) from public, anon, authenticated;
grant execute on function public.record_event(text, uuid) to service_role;

-- Aggregate product metrics, derived from existing profile and ship timestamps.
create or replace function public.admin_metrics()
returns jsonb
language sql
security definer
stable
set search_path = ''
as $$
  with cohort as (
    select
      p.id,
      p.created_at,
      exists (select 1 from public.ships s where s.user_id = p.id and s.created_at < p.created_at + interval '24 hours') as activated,
      (select count(distinct s.shipped_on) from public.ships s where s.user_id = p.id and s.created_at < p.created_at + interval '7 days') as days_week_one,
      exists (select 1 from public.ships s where s.user_id = p.id and s.created_at >= p.created_at + interval '3 days' and s.created_at < p.created_at + interval '4 days') as returned_day_3,
      exists (select 1 from public.ships s where s.user_id = p.id and s.created_at >= p.created_at + interval '7 days' and s.created_at < p.created_at + interval '8 days') as returned_day_7,
      exists (select 1 from public.ships s where s.user_id = p.id and s.created_at >= p.created_at + interval '7 days' and s.created_at < p.created_at + interval '14 days') as returned_week_two
    from public.profiles p
  )
  select jsonb_build_object(
    'signups_total', count(*),
    'signups_7d', count(*) filter (where created_at >= now() - interval '7 days'),
    'signups_30d', count(*) filter (where created_at >= now() - interval '30 days'),
    'activation_eligible', count(*) filter (where created_at <= now() - interval '24 hours'),
    'activation_done', count(*) filter (where created_at <= now() - interval '24 hours' and activated),
    'week_one_eligible', count(*) filter (where created_at <= now() - interval '7 days'),
    'week_one_three_plus_days', count(*) filter (where created_at <= now() - interval '7 days' and days_week_one >= 3),
    'day_3_eligible', count(*) filter (where created_at <= now() - interval '4 days'),
    'day_3_returned', count(*) filter (where created_at <= now() - interval '4 days' and returned_day_3),
    'day_7_eligible', count(*) filter (where created_at <= now() - interval '8 days'),
    'day_7_returned', count(*) filter (where created_at <= now() - interval '8 days' and returned_day_7),
    'week_two_eligible', count(*) filter (where created_at <= now() - interval '14 days'),
    'week_two_returned', count(*) filter (where created_at <= now() - interval '14 days' and returned_week_two),
    'ships_total', (select count(*) from public.ships),
    'ships_7d', (select count(*) from public.ships where created_at >= now() - interval '7 days'),
    'profile_views_7d', coalesce((select sum(total) from public.event_counts where event = 'profile_viewed' and day >= current_date - 6), 0),
    'card_shares_7d', coalesce((select sum(total) from public.event_counts where event = 'card_shared' and day >= current_date - 6), 0)
  )
  from cohort;
$$;

revoke all on function public.admin_metrics() from public, anon, authenticated;
grant execute on function public.admin_metrics() to service_role;
