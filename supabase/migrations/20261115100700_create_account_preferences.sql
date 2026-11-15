create table if not exists public.account_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  email_notifications boolean not null default true,
  application_updates boolean not null default true,
  job_alerts boolean not null default true,
  profile_visibility boolean not null default true,
  show_online_status boolean not null default true,
  weekly_digest boolean not null default false,
  language text not null default 'English' check (language = 'English'),
  location text not null default 'Abia State' check (char_length(location) <= 100),
  updated_at timestamptz not null default now()
);

alter table public.account_preferences enable row level security;

drop policy if exists "Users can view their own account preferences" on public.account_preferences;
create policy "Users can view their own account preferences"
  on public.account_preferences for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert their own account preferences" on public.account_preferences;
create policy "Users can insert their own account preferences"
  on public.account_preferences for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own account preferences" on public.account_preferences;
create policy "Users can update their own account preferences"
  on public.account_preferences for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

revoke all on public.account_preferences from anon, public;
grant select, insert, update on public.account_preferences to authenticated;
