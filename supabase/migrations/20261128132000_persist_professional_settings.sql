alter table public.account_preferences
  add column if not exists message_notifications boolean not null default true,
  add column if not exists job_alert_frequency text not null default 'daily'
    check (job_alert_frequency in ('immediately', 'daily', 'weekly', 'never'));

alter table public.professional_profiles
  add column if not exists show_availability boolean not null default true;

comment on column public.account_preferences.message_notifications is
  'Whether the account wants in-app message notifications displayed.';
comment on column public.account_preferences.job_alert_frequency is
  'The user selected cadence for matching opportunity alerts; delivery requires an enabled alert dispatcher.';
comment on column public.professional_profiles.show_availability is
  'Whether the professional chooses to display availability to authorised employers.';
