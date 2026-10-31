alter table public.account_reminders
  add column if not exists recap_enabled boolean not null default false,
  add column if not exists goal text not null default '' check (char_length(goal) <= 120),
  add column if not exists last_recap_on date;
