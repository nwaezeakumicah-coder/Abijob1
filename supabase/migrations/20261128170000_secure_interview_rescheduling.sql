-- Rescheduling must reset the candidate response atomically without granting
-- employers direct UPDATE access to the protected applicant_response column.
create or replace function public.reschedule_interview(
  p_interview_id uuid,
  p_scheduled_at timestamptz,
  p_duration_minutes integer,
  p_interview_type text,
  p_meeting_link text default null,
  p_location text default null,
  p_notes text default null
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_interview public.interviews%rowtype;
begin
  if v_user is null or not public.has_platform_access()
     or not exists (
       select 1 from public.profiles p
       where p.id = v_user and p.role = 'employer'
     ) then
    raise exception 'Only an active employer can reschedule interviews'
      using errcode = '42501';
  end if;

  if p_interview_id is null
     or p_scheduled_at is null
     or p_scheduled_at <= now()
     or p_duration_minutes is null
     or p_duration_minutes not between 15 and 480
     or p_interview_type not in ('online', 'live_chat', 'in_person', 'phone')
     or char_length(coalesce(p_meeting_link, '')) > 2000
     or char_length(coalesce(p_location, '')) > 500
     or char_length(coalesce(p_notes, '')) > 3000 then
    raise exception 'Interview details are invalid'
      using errcode = '22023';
  end if;

  if p_interview_type = 'online'
     and (
       p_meeting_link is null
       or p_meeting_link !~* '^https://meet[.]google[.]com/[^[:space:]]+$'
     ) then
    raise exception 'A valid Google Meet link is required for online interviews'
      using errcode = '22023';
  end if;

  if p_interview_type = 'in_person'
     and nullif(btrim(coalesce(p_location, '')), '') is null then
    raise exception 'A location is required for in-person interviews'
      using errcode = '22023';
  end if;

  select * into v_interview
  from public.interviews
  where id = p_interview_id and employer_id = v_user
  for update;

  if not found then
    raise exception 'Interview not found'
      using errcode = 'P0002';
  end if;

  if v_interview.status not in ('scheduled', 'rescheduled') then
    raise exception 'Only active interviews can be rescheduled'
      using errcode = '55000';
  end if;

  update public.interviews
  set scheduled_at = p_scheduled_at,
      duration_minutes = p_duration_minutes,
      interview_type = p_interview_type,
      meeting_link = case when p_interview_type = 'online' then btrim(p_meeting_link) else null end,
      location = case when p_interview_type = 'in_person' then btrim(p_location) else null end,
      notes = nullif(btrim(coalesce(p_notes, '')), ''),
      status = 'rescheduled',
      applicant_response = null,
      updated_at = now()
  where id = p_interview_id;

  return true;
end;
$$;

revoke all on function public.reschedule_interview(uuid,timestamptz,integer,text,text,text,text)
  from public, anon;
grant execute on function public.reschedule_interview(uuid,timestamptz,integer,text,text,text,text)
  to authenticated;
