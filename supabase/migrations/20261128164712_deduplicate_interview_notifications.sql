-- Applicant-facing invitation and schedule notifications are handled by
-- notify_applicant_on_interview_change(). This trigger handles only candidate
-- responses, which are stored in applicant_response (not interviews.status).
create or replace function public.notify_interview_participants()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if tg_op = 'UPDATE'
     and new.applicant_response is distinct from old.applicant_response
     and new.applicant_response in ('accepted','declined') then
    insert into public.notifications(user_id,title,description,category,href)
    values (
      new.employer_id,
      case when new.applicant_response = 'accepted'
        then 'Interview invitation accepted'
        else 'Interview invitation declined'
      end,
      'The applicant has ' || new.applicant_response || ' your interview invitation.',
      'application',
      '/employer/interviews'
    );
  end if;

  return new;
end;
$function$;

drop trigger if exists trg_notify_interview_participants on public.interviews;
create trigger trg_notify_interview_participants
after insert or update of status, applicant_response on public.interviews
for each row execute function public.notify_interview_participants();

revoke all on function public.notify_interview_participants()
  from public, anon, authenticated;
