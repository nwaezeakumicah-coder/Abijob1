create extension if not exists pg_cron with schema pg_catalog;

create table if not exists public.interview_reminders (
 id uuid primary key default gen_random_uuid(),
 interview_id uuid not null references public.interviews(id) on delete cascade,
 recipient_id uuid not null references public.profiles(id) on delete cascade,
 reminder_type text not null check (reminder_type in ('24_hours','1_hour')),
 remind_at timestamptz not null,
 delivered_at timestamptz,
 created_at timestamptz not null default now(),
 unique(interview_id,recipient_id,reminder_type)
);
create index if not exists interview_reminders_due_idx
 on public.interview_reminders(remind_at) where delivered_at is null;
alter table public.interview_reminders enable row level security;
revoke all on public.interview_reminders from anon,authenticated;

create or replace function public.sync_interview_reminders()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
 v_offset interval;
 v_kind text;
 v_recipient uuid;
begin
 if tg_op='UPDATE' then
  delete from public.interview_reminders
   where interview_id=new.id and delivered_at is null;
 end if;
 if new.status not in ('scheduled','rescheduled') then
  return new;
 end if;
 foreach v_recipient in array array[new.applicant_id,new.employer_id] loop
  foreach v_kind in array array['24_hours','1_hour'] loop
   v_offset:=case when v_kind='24_hours' then interval '24 hours' else interval '1 hour' end;
   if new.scheduled_at-v_offset>now() then
    insert into public.interview_reminders(interview_id,recipient_id,reminder_type,remind_at)
    values(new.id,v_recipient,v_kind,new.scheduled_at-v_offset)
    on conflict(interview_id,recipient_id,reminder_type) do update
      set remind_at=excluded.remind_at,delivered_at=null;
   end if;
  end loop;
 end loop;
 return new;
end;
$$;

drop trigger if exists trg_sync_interview_reminders on public.interviews;
create trigger trg_sync_interview_reminders
after insert or update of scheduled_at,status on public.interviews
for each row execute function public.sync_interview_reminders();

create or replace function public.dispatch_due_interview_reminders()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
 v_reminder record;
 v_count integer:=0;
begin
 for v_reminder in
  select r.id,r.recipient_id,r.reminder_type,i.scheduled_at,i.status
  from public.interview_reminders r
  join public.interviews i on i.id=r.interview_id
  where r.delivered_at is null and r.remind_at<=now()
  order by r.remind_at
  for update of r skip locked
 loop
  if v_reminder.status in ('scheduled','rescheduled') and v_reminder.scheduled_at>now() then
   insert into public.notifications(user_id,title,description,category,href)
   values(
    v_reminder.recipient_id,
    case when v_reminder.reminder_type='24_hours' then 'Interview reminder: tomorrow' else 'Interview reminder: in one hour' end,
    'You have an interview scheduled for ' || to_char(v_reminder.scheduled_at at time zone 'Africa/Lagos','Dy, DD Mon YYYY HH12:MI AM') || ' (WAT).',
    'application',
    case when exists(select 1 from public.interviews i where i.scheduled_at=v_reminder.scheduled_at and i.applicant_id=v_reminder.recipient_id) then '/dashboard/interviews' else '/employer/interviews' end
   );
  end if;
  update public.interview_reminders set delivered_at=now() where id=v_reminder.id and delivered_at is null;
  v_count:=v_count+1;
 end loop;
 return v_count;
end;
$$;

revoke all on function public.sync_interview_reminders() from public,anon,authenticated;
revoke all on function public.dispatch_due_interview_reminders() from public,anon,authenticated;
grant execute on function public.dispatch_due_interview_reminders() to service_role;

do $$
begin
 if exists(select 1 from pg_extension where extname='pg_cron') then
  perform cron.unschedule(jobid) from cron.job where jobname='abijob-interview-reminders';
  perform cron.schedule('abijob-interview-reminders','*/15 * * * *','select public.dispatch_due_interview_reminders();');
 end if;
end;
$$;
