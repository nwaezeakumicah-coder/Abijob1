-- Career tools: private cloud CV drafts and interview practice progress.
-- Each user can access only their own records. The app uses the anon/publishable
-- client key; RLS is the security boundary.

create table if not exists public.cv_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'My CV' check (char_length(title) between 1 and 160),
  data jsonb not null default '{}'::jsonb,
  template text not null default 'modern'
    check (template in ('modern', 'classic', 'minimal')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cv_documents_one_per_user unique (user_id)
);

alter table public.cv_documents enable row level security;
revoke all on public.cv_documents from anon;
grant select, insert, update, delete on public.cv_documents to authenticated;

drop policy if exists "Users manage own CV document" on public.cv_documents;
create policy "Users manage own CV document"
on public.cv_documents
for all
to authenticated
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.role in ('job_seeker', 'professional')
  )
);

create table if not exists public.interview_practice_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_role text not null check (account_role in ('job_seeker', 'professional')),
  selected_session integer not null check (selected_session between 0 and 20),
  job_title text not null default '' check (char_length(job_title) <= 160),
  experience_level text not null default 'Entry level'
    check (char_length(experience_level) <= 80),
  current_question integer not null default 0 check (current_question between 0 and 100),
  answers jsonb not null default '{}'::jsonb,
  started boolean not null default false,
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint interview_practice_one_record_per_session
    unique (user_id, selected_session)
);

alter table public.interview_practice_sessions enable row level security;
revoke all on public.interview_practice_sessions from anon;
grant select, insert, update, delete on public.interview_practice_sessions to authenticated;

drop policy if exists "Users manage own interview practice" on public.interview_practice_sessions;
create policy "Users manage own interview practice"
on public.interview_practice_sessions
for all
to authenticated
using (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.role in ('job_seeker', 'professional')
  )
)
with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.role in ('job_seeker', 'professional')
  )
);

create index if not exists cv_documents_updated_at_idx
  on public.cv_documents (updated_at desc);
create index if not exists interview_practice_sessions_user_updated_idx
  on public.interview_practice_sessions (user_id, updated_at desc);
