create table if not exists public.app_backups (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.app_backups enable row level security;

drop policy if exists "Users can read their own backup" on public.app_backups;
create policy "Users can read their own backup"
on public.app_backups
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own backup" on public.app_backups;
create policy "Users can insert their own backup"
on public.app_backups
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own backup" on public.app_backups;
create policy "Users can update their own backup"
on public.app_backups
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
