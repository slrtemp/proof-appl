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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists tagline text not null default '' check (char_length(tagline) <= 100),
  add column if not exists location text not null default '' check (char_length(location) <= 60),
  add column if not exists website text check (website is null or (char_length(website) <= 2048 and website ~ '^https?://')),
  add column if not exists is_founder boolean not null default false,
  add column if not exists is_verified boolean not null default false;

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

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  stripe_customer_id text not null unique,
  stripe_subscription_id text unique,
  status text not null default 'incomplete',
  price_id text,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  updated_at timestamptz not null default now()
);

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

revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to anon, authenticated;
grant update (username, full_name, tagline, bio, location, website, avatar_url, is_public) on public.profiles to authenticated;

revoke all on public.ships from anon, authenticated;
grant select on public.ships to anon, authenticated;
grant insert, update, delete on public.ships to authenticated;

revoke all on public.subscriptions from anon, authenticated;
grant select on public.subscriptions to authenticated;
grant all on public.profiles, public.ships, public.subscriptions to service_role;

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
