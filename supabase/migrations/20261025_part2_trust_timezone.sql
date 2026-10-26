alter table public.profiles
  add column if not exists timezone text not null default 'UTC';

create table if not exists public.rest_days (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  rest_on date not null,
  created_at timestamptz not null default now(),
  unique (user_id, rest_on)
);
create index if not exists rest_days_user_rest_on_idx on public.rest_days (user_id, rest_on desc);

create table if not exists public.profile_reports (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  reporter_id uuid references auth.users (id) on delete set null,
  reason text not null check (char_length(reason) between 10 and 1000),
  created_at timestamptz not null default now()
);

create table if not exists public.profile_report_limits (
  ip_hash text primary key check (ip_hash ~ '^[0-9a-f]{64}$'),
  window_started_at timestamptz not null,
  attempt_count integer not null check (attempt_count > 0)
);

create table if not exists public.account_reminders (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  enabled boolean not null default false,
  unsubscribe_token uuid not null default gen_random_uuid(),
  last_sent_on date,
  updated_at timestamptz not null default now()
);

create or replace function public.mark_today_rest_day()
returns date
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  current_timezone text;
  local_today date;
  monthly_rest_days integer;
begin
  if current_user_id is null then raise exception 'Sign in to mark a rest day.'; end if;
  select profile.timezone into current_timezone
    from public.profiles as profile where profile.id = current_user_id for update;
  if not found then raise exception 'Profile not found.'; end if;

  local_today := (now() at time zone current_timezone)::date;
  if exists (select 1 from public.ships where user_id = current_user_id and shipped_on = local_today) then
    raise exception 'A ship is already logged for today.';
  end if;
  if exists (select 1 from public.rest_days where user_id = current_user_id and rest_on = local_today) then
    return local_today;
  end if;

  select count(*) into monthly_rest_days from public.rest_days
  where user_id = current_user_id
    and rest_on >= date_trunc('month', local_today::timestamp)::date
    and rest_on < (date_trunc('month', local_today::timestamp) + interval '1 month')::date;
  if monthly_rest_days >= 2 then raise exception 'You have used this month''s two rest days.'; end if;

  insert into public.rest_days (user_id, rest_on) values (current_user_id, local_today);
  return local_today;
end;
$$;

create or replace function public.remove_today_rest_day()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  current_timezone text;
begin
  if current_user_id is null then raise exception 'Sign in to update a rest day.'; end if;
  select profile.timezone into current_timezone from public.profiles as profile where profile.id = current_user_id;
  if not found then raise exception 'Profile not found.'; end if;
  delete from public.rest_days where user_id = current_user_id and rest_on = (now() at time zone current_timezone)::date;
end;
$$;

create or replace function public.set_profile_timezone(new_timezone text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then raise exception 'Sign in to update your timezone.'; end if;
  if not exists (select 1 from pg_catalog.pg_timezone_names where name = new_timezone) then
    raise exception 'Choose a valid timezone.';
  end if;
  update public.profiles set timezone = new_timezone where id = current_user_id;
  if not found then raise exception 'Profile not found.'; end if;
  return new_timezone;
end;
$$;

create or replace function public.save_today_ship(ship_body text, ship_category text, ship_link text)
returns public.ships
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  current_timezone text;
  local_today date;
  saved_ship public.ships;
begin
  if current_user_id is null then raise exception 'Sign in to save a ship.'; end if;
  if ship_body is null or char_length(btrim(ship_body)) not between 1 and 280 then raise exception 'A ship must be between 1 and 280 characters.'; end if;
  if ship_category is null or ship_category not in ('Code', 'Design', 'Marketing', 'Launch', 'Learning') then raise exception 'Choose a valid ship category.'; end if;
  if ship_link is not null and (char_length(ship_link) > 2048 or ship_link !~ '^https?://') then raise exception 'Enter a valid http or https link.'; end if;

  select profile.timezone into current_timezone
    from public.profiles as profile where profile.id = current_user_id for update;
  if not found then raise exception 'Profile not found.'; end if;
  local_today := (now() at time zone current_timezone)::date;
  if exists (select 1 from public.rest_days where user_id = current_user_id and rest_on = local_today) then
    raise exception 'Today is marked as a rest day.';
  end if;

  insert into public.ships (user_id, body, category, link, shipped_on)
  values (current_user_id, btrim(ship_body), ship_category, ship_link, local_today)
  on conflict (user_id, shipped_on) do update
    set body = excluded.body, category = excluded.category, link = excluded.link
  returning * into saved_ship;
  return saved_ship;
end;
$$;

create or replace function public.consume_profile_report_limit(request_ip_hash text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  attempts integer;
  current_window timestamptz := date_trunc('hour', now());
begin
  if request_ip_hash !~ '^[0-9a-f]{64}$' then raise exception 'Invalid report rate-limit key.'; end if;
  insert into public.profile_report_limits (ip_hash, window_started_at, attempt_count)
  values (request_ip_hash, current_window, 1)
  on conflict (ip_hash) do update
    set window_started_at = case
          when public.profile_report_limits.window_started_at < current_window then current_window
          else public.profile_report_limits.window_started_at
        end,
        attempt_count = case
          when public.profile_report_limits.window_started_at < current_window then 1
          else public.profile_report_limits.attempt_count + 1
        end
  returning attempt_count into attempts;
  return attempts <= 3;
end;
$$;

alter table public.rest_days enable row level security;
alter table public.profile_report_limits enable row level security;
alter table public.profile_reports enable row level security;
alter table public.account_reminders enable row level security;

drop policy if exists "Public rest days for public profiles" on public.rest_days;
create policy "Public rest days for public profiles" on public.rest_days for select
  using (
    user_id = (select auth.uid())
    or exists (select 1 from public.profiles where profiles.id = rest_days.user_id and profiles.is_public)
  );
drop policy if exists "Owners read reminder preferences" on public.account_reminders;
create policy "Owners read reminder preferences" on public.account_reminders for select
  using (user_id = (select auth.uid()));

revoke all on public.profile_reports from anon, authenticated;
revoke all on public.profile_report_limits from anon, authenticated;
revoke insert, update, delete on public.rest_days from anon, authenticated;
revoke all on public.account_reminders from anon, authenticated;
grant select on public.rest_days to anon, authenticated;
grant select on public.account_reminders to authenticated;
grant all on public.rest_days, public.profile_reports, public.account_reminders to service_role;
revoke update (timezone) on public.profiles from authenticated;
revoke insert, update, delete on public.ships from anon, authenticated;
revoke all on function public.mark_today_rest_day() from public;
revoke all on function public.remove_today_rest_day() from public;
revoke all on function public.set_profile_timezone(text) from public;
revoke all on function public.save_today_ship(text, text, text) from public;
revoke all on function public.consume_profile_report_limit(text) from public;
grant execute on function public.mark_today_rest_day() to authenticated;
grant execute on function public.remove_today_rest_day() to authenticated;
grant execute on function public.set_profile_timezone(text) to authenticated;
grant execute on function public.save_today_ship(text, text, text) to authenticated;
grant execute on function public.consume_profile_report_limit(text) to service_role;
