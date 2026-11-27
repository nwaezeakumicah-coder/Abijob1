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
  select r.id,r.recipient_id,r.reminder_type,i.scheduled_at,i.status,
         case when r.recipient_id=i.applicant_id then '/dashboard/interviews' else '/employer/interviews' end as destination
  from public.interview_reminders r
  join public.interviews i on i.id=r.interview_id
  where r.delivered_at is null and r.remind_at<=now()
  order by r.remind_at
  for update of r skip locked
 loop
  if v_reminder.status in ('scheduled','rescheduled') and v_reminder.scheduled_at>now() then
   insert into public.notifications(user_id,title,description,category,href)
   values(v_reminder.recipient_id,
    case when v_reminder.reminder_type='24_hours' then 'Interview reminder: tomorrow' else 'Interview reminder: in one hour' end,
    'You have an interview scheduled for ' || to_char(v_reminder.scheduled_at at time zone 'Africa/Lagos','Dy, DD Mon YYYY HH12:MI AM') || ' (WAT).',
    'application',v_reminder.destination);
  end if;
  update public.interview_reminders set delivered_at=now() where id=v_reminder.id and delivered_at is null;
  v_count:=v_count+1;
 end loop;
 return v_count;
end;
$$;
revoke all on function public.dispatch_due_interview_reminders() from public,anon,authenticated;
grant execute on function public.dispatch_due_interview_reminders() to service_role;

insert into public.interview_reminders(interview_id,recipient_id,reminder_type,remind_at)
select i.id,recipient.user_id,offsets.reminder_type,i.scheduled_at-offsets.reminder_offset
from public.interviews i
cross join lateral (values (i.applicant_id),(i.employer_id)) as recipient(user_id)
cross join lateral (values ('24_hours'::text,interval '24 hours'),('1_hour'::text,interval '1 hour')) as offsets(reminder_type,reminder_offset)
where i.status in ('scheduled','rescheduled')
  and i.scheduled_at-offsets.reminder_offset>now()
on conflict(interview_id,recipient_id,reminder_type) do nothing;
