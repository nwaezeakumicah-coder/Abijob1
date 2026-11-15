revoke all privileges on table public.account_preferences from anon, authenticated, public;
grant select, insert, update on table public.account_preferences to authenticated;