create table if not exists public.pro_waitlist (
  email text primary key check (char_length(email) between 3 and 254 and email = lower(email)),
  created_at timestamptz not null default now()
);

alter table public.pro_waitlist enable row level security;
revoke all on public.pro_waitlist from anon, authenticated;
