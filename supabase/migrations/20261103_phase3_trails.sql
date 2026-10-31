-- Phase 3: project trails. A trail is a named, public timeline of ships.
create table if not exists public.trails (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  slug text not null check (slug ~ '^[a-z0-9][a-z0-9-]{0,39}$'),
  title text not null check (char_length(title) between 1 and 60),
  description text not null default '' check (char_length(description) <= 280),
  created_at timestamptz not null default now(),
  unique (user_id, slug)
);

-- A ship can belong to at most one trail.
create table if not exists public.trail_ships (
  ship_id uuid primary key references public.ships (id) on delete cascade,
  trail_id uuid not null references public.trails (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists trail_ships_trail_idx on public.trail_ships (trail_id);

alter table public.trails enable row level security;
alter table public.trail_ships enable row level security;

drop policy if exists "Trails of public profiles are readable" on public.trails;
create policy "Trails of public profiles are readable" on public.trails for select
  using (
    user_id = (select auth.uid())
    or exists (select 1 from public.profiles where profiles.id = trails.user_id and profiles.is_public)
  );

drop policy if exists "Trail ships of public profiles are readable" on public.trail_ships;
create policy "Trail ships of public profiles are readable" on public.trail_ships for select
  using (
    exists (
      select 1 from public.trails
      where trails.id = trail_ships.trail_id
        and (
          trails.user_id = (select auth.uid())
          or exists (select 1 from public.profiles where profiles.id = trails.user_id and profiles.is_public)
        )
    )
  );

-- Writes go through the server API (service role) after it verifies ownership.
revoke all on public.trails, public.trail_ships from anon, authenticated;
grant select on public.trails, public.trail_ships to anon, authenticated;
grant all on public.trails, public.trail_ships to service_role;
