-- Do not allow an employer to mark a future interview as completed.
-- The row lock and ownership check remain in transition_employer_interview.
create or replace function public.transition_employer_interview(
  p_interview_id uuid,
  p_status text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user uuid := auth.uid();
  v_interview public.interviews%rowtype;
begin
  if v_user is null or not public.has_platform_access()
     or not exists (
       select 1 from public.profiles p
       where p.id = v_user and p.role = 'employer'
     ) then
    raise exception 'Only an active employer can update interview status'
      using errcode = '42501';
  end if;

  if p_interview_id is null
     or p_status is null
     or p_status not in ('completed', 'cancelled', 'scheduled') then
    raise exception 'Invalid interview status transition'
      using errcode = '22023';
  end if;

  select * into v_interview
  from public.interviews
  where id = p_interview_id and employer_id = v_user
  for update;
  if not found then
    raise exception 'Interview not found' using errcode = 'P0002';
  end if;

  if p_status in ('completed', 'cancelled')
     and v_interview.status not in ('scheduled', 'rescheduled') then
    raise exception 'Only active interviews can be completed or cancelled'
      using errcode = '55000';
  end if;

  if p_status = 'scheduled' and v_interview.status <> 'cancelled' then
    raise exception 'Only cancelled interviews can be restored'
      using errcode = '55000';
  end if;

  if p_status = 'completed' and v_interview.scheduled_at > now() then
    raise exception 'A future interview cannot be marked as completed'
      using errcode = '55000';
  end if;

  update public.interviews
  set status = p_status,
      applicant_response = case
        when p_status = 'scheduled' then null
        else applicant_response
      end,
      updated_at = now()
  where id = p_interview_id;

  if p_status = 'completed' then
    insert into public.notifications(user_id,title,description,category,href)
    values (
      v_interview.applicant_id,
      'Interview marked completed',
      'Your employer marked the interview as completed.',
      'application','/dashboard/interviews'
    );
  end if;

  return true;
end;
$function$;
