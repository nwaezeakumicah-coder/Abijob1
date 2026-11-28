-- The applicant-change trigger already owns applicant invitation and
-- reschedule/cancellation/restoration notifications. This trigger should only
-- notify the employer when the candidate accepts or declines, preventing
-- duplicate applicant notifications on interview creation.
create or replace function public.notify_interview_participants()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if tg_op = 'UPDATE'
     and new.status is distinct from old.status
     and new.status in ('accepted','declined') then
    insert into public.notifications(user_id,title,description,category,href)
    values (
      new.employer_id,
      case when new.status = 'accepted'
        then 'Interview invitation accepted'
        else 'Interview invitation declined'
      end,
      'The applicant has ' || new.status || ' your interview invitation.',
      'application',
      '/employer/interviews'
    );
  end if;

  return new;
end;
$function$;

revoke all on function public.notify_interview_participants()
  from public, anon, authenticated;
