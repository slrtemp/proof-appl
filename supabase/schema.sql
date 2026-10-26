create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9][a-z0-9_-]{1,31}$'),
  full_name text not null default 'Builder' check (char_length(full_name) between 2 and 60),
  tagline text not null default '' check (char_length(tagline) <= 100),
  bio text not null default '' check (char_length(bio) <= 160),
  location text not null default '' check (char_length(location) <= 60),
  website text check (website is null or (char_length(website) <= 2048 and website ~ '^https?://')),
  avatar_url text,
  is_public boolean not null default true,
  is_pro boolean not null default false,
  is_founder boolean not null default false,
  is_verified boolean not null default false,
  custom_domain text unique,
  timezone text not null default 'UTC',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists tagline text not null default '' check (char_length(tagline) <= 100),
  add column if not exists location text not null default '' check (char_length(location) <= 60),
  add column if not exists website text check (website is null or (char_length(website) <= 2048 and website ~ '^https?://')),
  add column if not exists is_founder boolean not null default false,
  add column if not exists is_verified boolean not null default false,
  add column if not exists timezone text not null default 'UTC';

create table if not exists public.ships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 280),
  category text not null default 'Code' check (category in ('Code', 'Design', 'Marketing', 'Launch', 'Learning')),
  link text check (link is null or (char_length(link) <= 2048 and link ~ '^https?://')),
  shipped_on date not null default current_date,
  created_at timestamptz not null default now(),
  unique (user_id, shipped_on)
);

create index if not exists ships_user_shipped_on_idx
  on public.ships (user_id, shipped_on desc);

create table if not exists public.rest_days (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  rest_on date not null,
  created_at timestamptz not null default now(),
  unique (user_id, rest_on)
);

create index if not exists rest_days_user_rest_on_idx
  on public.rest_days (user_id, rest_on desc);

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
  if current_user_id is null then
    raise exception 'Sign in to mark a rest day.';
  end if;

  select profile.timezone
    into current_timezone
    from public.profiles as profile
    where profile.id = current_user_id
    for update;
  if not found then raise exception 'Profile not found.'; end if;

  local_today := (now() at time zone current_timezone)::date;
  if exists (
    select 1 from public.ships
    where user_id = current_user_id and shipped_on = local_today
  ) then
    raise exception 'A ship is already logged for today.';
  end if;

  if exists (
    select 1 from public.rest_days
    where user_id = current_user_id and rest_on = local_today
  ) then
    return local_today;
  end if;

  select count(*) into monthly_rest_days
  from public.rest_days
  where user_id = current_user_id
    and rest_on >= date_trunc('month', local_today::timestamp)::date
    and rest_on < (date_trunc('month', local_today::timestamp) + interval '1 month')::date;

  if monthly_rest_days >= 2 then
    raise exception 'You have used this month''s two rest days.';
  end if;

  insert into public.rest_days (user_id, rest_on) values (current_user_id, local_today);
  return local_today;
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
  select profile.timezone into current_timezone
  from public.profiles as profile where profile.id = current_user_id;
  if not found then raise exception 'Profile not found.'; end if;
  delete from public.rest_days
  where user_id = current_user_id
    and rest_on = (now() at time zone current_timezone)::date;
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

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  billing_interval text check (billing_interval is null or billing_interval in ('monthly', 'yearly')),
  founder_access boolean not null default false,
  status text not null default 'incomplete',
  price_id text,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  updated_at timestamptz not null default now(),
  last_event_created bigint not null default 0
);

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

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_username text;
  display_name text;
begin
  requested_username := lower(regexp_replace(
    coalesce(new.raw_user_meta_data ->> 'preferred_username', new.raw_user_meta_data ->> 'user_name', split_part(coalesce(new.email, 'builder'), '@', 1)),
    '[^a-zA-Z0-9_-]', '', 'g'
  ));
  requested_username := trim(both '-_' from left(requested_username, 20));
  if char_length(requested_username) < 2 then
    requested_username := 'builder';
  end if;

  display_name := coalesce(
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'name', ''),
    nullif(split_part(coalesce(new.email, 'Builder'), '@', 1), ''),
    'Builder'
  );

  insert into public.profiles (id, username, full_name)
  values (
    new.id,
    requested_username || '-' || left(replace(new.id::text, '-', ''), 8),
    left(display_name, 60)
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.ships enable row level security;
alter table public.subscriptions enable row level security;
alter table public.stripe_webhook_events enable row level security;
alter table public.rest_days enable row level security;
alter table public.profile_report_limits enable row level security;
alter table public.profile_reports enable row level security;
alter table public.account_reminders enable row level security;

drop policy if exists "Public profiles are readable" on public.profiles;
create policy "Public profiles are readable"
  on public.profiles for select
  using (is_public or id = (select auth.uid()));

drop policy if exists "Owners update their public profile" on public.profiles;
create policy "Owners update their public profile"
  on public.profiles for update
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

drop policy if exists "Public ships for public profiles" on public.ships;
create policy "Public ships for public profiles"
  on public.ships for select
  using (
    user_id = (select auth.uid())
    or exists (
      select 1 from public.profiles
      where profiles.id = ships.user_id and profiles.is_public
    )
  );

drop policy if exists "Public rest days for public profiles" on public.rest_days;
create policy "Public rest days for public profiles"
  on public.rest_days for select
  using (
    user_id = (select auth.uid())
    or exists (
      select 1 from public.profiles
      where profiles.id = rest_days.user_id and profiles.is_public
    )
  );

drop policy if exists "Owners read reminder preferences" on public.account_reminders;
create policy "Owners read reminder preferences"
  on public.account_reminders for select
  using (user_id = (select auth.uid()));

drop policy if exists "Owners add their ships" on public.ships;
create policy "Owners add their ships"
  on public.ships for insert
  with check (user_id = (select auth.uid()));

drop policy if exists "Owners update their ships" on public.ships;
create policy "Owners update their ships"
  on public.ships for update
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "Owners delete their ships" on public.ships;
create policy "Owners delete their ships"
  on public.ships for delete
  using (user_id = (select auth.uid()));

drop policy if exists "Owners read their subscriptions" on public.subscriptions;
create policy "Owners read their subscriptions"
  on public.subscriptions for select
  using (user_id = (select auth.uid()));

revoke all on public.stripe_webhook_events from anon, authenticated;
revoke all on public.profile_reports from anon, authenticated;
revoke all on public.profile_report_limits from anon, authenticated;
revoke insert, update, delete on public.rest_days from anon, authenticated;
revoke all on public.account_reminders from anon, authenticated;
revoke all on function public.is_public_pro_profile(text) from public;
grant execute on function public.is_public_pro_profile(text) to anon, authenticated;
revoke all on function public.mark_today_rest_day() from public;
revoke all on function public.remove_today_rest_day() from public;
revoke all on function public.set_profile_timezone(text) from public;
grant execute on function public.mark_today_rest_day() to authenticated;
grant execute on function public.remove_today_rest_day() to authenticated;
grant execute on function public.set_profile_timezone(text) to authenticated;
revoke all on function public.consume_profile_report_limit(text) from public;
grant execute on function public.consume_profile_report_limit(text) to service_role;
revoke all on function public.save_today_ship(text, text, text) from public;
grant execute on function public.save_today_ship(text, text, text) to authenticated;
revoke insert, update, delete on public.subscriptions from anon, authenticated;
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to anon, authenticated;
grant update (username, full_name, tagline, bio, location, website, avatar_url, is_public) on public.profiles to authenticated;

revoke all on public.ships from anon, authenticated;
grant select on public.ships to anon, authenticated;
revoke insert, update, delete on public.ships from anon, authenticated;

revoke all on public.subscriptions from anon, authenticated;
grant select on public.subscriptions to authenticated;
grant select on public.rest_days to anon, authenticated;
grant select on public.account_reminders to authenticated;
grant all on public.profiles, public.ships, public.subscriptions to service_role;
grant all on public.stripe_webhook_events to service_role;
grant all on public.rest_days, public.profile_reports, public.profile_report_limits, public.account_reminders to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public avatar images are readable" on storage.objects;
create policy "Public avatar images are readable"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "Users upload their own avatar" on storage.objects;
create policy "Users upload their own avatar"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "Users update their own avatar" on storage.objects;
create policy "Users update their own avatar"
  on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "Users delete their own avatar" on storage.objects;
create policy "Users delete their own avatar"
  on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
