-- Keep interview transition rules enforced even if a client attempts a
-- direct column update instead of using the employer RPCs.
create or replace function public.guard_interview_updates()
returns trigger
language plpgsql
set search_path = ''
as $function$
declare
  v_schedule_changed boolean;
begin
  v_schedule_changed :=
    new.scheduled_at is distinct from old.scheduled_at
    or new.duration_minutes is distinct from old.duration_minutes
    or new.interview_type is distinct from old.interview_type
    or new.meeting_link is distinct from old.meeting_link
    or new.location is distinct from old.location;

  if new.notes is null or char_length(new.notes) > 5000 then
    raise exception 'Interview notes are invalid' using errcode = '22023';
  end if;

  if v_schedule_changed then
    if old.status not in ('scheduled','rescheduled') then
      raise exception 'Only active interviews can be rescheduled' using errcode = '55000';
    end if;

    if new.scheduled_at is null or new.scheduled_at <= now()
       or new.duration_minutes is null
       or new.duration_minutes not between 15 and 480
       or new.interview_type is null
       or new.interview_type not in ('online','in_person','live_chat','phone') then
      raise exception 'Interview schedule details are invalid' using errcode = '22023';
    end if;

    if new.interview_type = 'online'
       and (new.meeting_link is null
         or new.meeting_link !~* '^https://meet\.google\.com/[a-z0-9-]+') then
      raise exception 'A valid Google Meet link is required for online interviews'
        using errcode = '22023';
    end if;

    if new.interview_type = 'in_person'
       and (new.location is null or char_length(trim(new.location)) not between 1 and 500) then
      raise exception 'A location is required for in-person interviews'
        using errcode = '22023';
    end if;

    if new.status is distinct from old.status
       and new.status not in ('scheduled','rescheduled') then
      raise exception 'Do not combine rescheduling with another interview status transition'
        using errcode = '55000';
    end if;

    new.status := 'rescheduled';
    new.applicant_response := null;
  elsif new.status is distinct from old.status then
    if new.status in ('completed','cancelled') then
      if old.status not in ('scheduled','rescheduled') then
        raise exception 'Only active interviews can be completed or cancelled'
          using errcode = '55000';
      end if;

      if new.status = 'completed' and old.scheduled_at > now() then
        raise exception 'A future interview cannot be marked as completed'
          using errcode = '55000';
      end if;
    elsif new.status = 'scheduled' then
      if old.status <> 'cancelled' then
        raise exception 'Only cancelled interviews can be restored'
          using errcode = '55000';
      end if;
      new.applicant_response := null;
    else
      raise exception 'Invalid interview status transition'
        using errcode = '22023';
    end if;
  end if;

  new.updated_at := now();
  return new;
end;
$function$;

drop trigger if exists trg_guard_interview_updates on public.interviews;
create trigger trg_guard_interview_updates
before update on public.interviews
for each row execute function public.guard_interview_updates();

revoke all on function public.guard_interview_updates()
  from public, anon, authenticated;
