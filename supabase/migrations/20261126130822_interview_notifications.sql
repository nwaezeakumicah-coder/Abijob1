-- Secure in-app notifications for the existing interview workflow.
create or replace function public.notify_interview_participant(p_interview_id uuid,p_event text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
 v_user uuid:=auth.uid();
 v_interview public.interviews%rowtype;
 v_title text;
 v_description text;
begin
 if v_user is null or not public.has_platform_access()
    or not exists(select 1 from public.profiles p where p.id=v_user and p.role='employer') then
   raise exception 'Only an active employer can notify an interview participant' using errcode='42501';
 end if;
 if p_event not in ('invited','rescheduled','cancelled','completed') then
   raise exception 'Invalid interview event' using errcode='22023';
 end if;
 select * into v_interview from public.interviews
   where id=p_interview_id and employer_id=v_user;
 if not found then raise exception 'Interview not found' using errcode='P0002'; end if;
 v_title:=case p_event
   when 'invited' then 'New interview invitation'
   when 'rescheduled' then 'Interview rescheduled'
   when 'cancelled' then 'Interview cancelled'
   else 'Interview marked completed'
 end;
 v_description:=case p_event
   when 'invited' then 'An employer has scheduled an interview with you.'
   when 'rescheduled' then 'Your employer changed the interview date or details.'
   when 'cancelled' then 'Your employer cancelled the interview.'
   else 'Your employer marked the interview as completed.'
 end;
 insert into public.notifications(user_id,title,description,category,href)
 values(v_interview.applicant_id,v_title,v_description,'application','/dashboard/interviews');
 return true;
end;
$$;

create or replace function public.respond_to_interview(p_interview_id uuid,p_response text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
 v_user_id uuid:=auth.uid();
 v_interview public.interviews%rowtype;
begin
 if v_user_id is null then raise exception 'Sign in to respond to this interview' using errcode='42501'; end if;
 if p_interview_id is null or p_response is null or p_response not in ('accepted','declined') then
   raise exception 'Invalid interview response' using errcode='22023';
 end if;
 select * into v_interview from public.interviews
   where id=p_interview_id and applicant_id=v_user_id for update;
 if not found then raise exception 'Interview invitation not found' using errcode='P0002'; end if;
 if v_interview.status not in ('scheduled','rescheduled') then
   raise exception 'This interview invitation can no longer be answered' using errcode='55000';
 end if;
 update public.interviews set status=p_response,updated_at=now() where id=p_interview_id;
 insert into public.notifications(user_id,title,description,category,href)
 values(v_interview.employer_id,
   case when p_response='accepted' then 'Interview invitation accepted' else 'Interview invitation declined' end,
   case when p_response='accepted' then 'The candidate accepted your interview invitation.' else 'The candidate declined your interview invitation.' end,
   'application','/employer/interviews');
 return true;
end;
$$;
revoke all on function public.notify_interview_participant(uuid,text) from public,anon;
revoke all on function public.respond_to_interview(uuid,text) from public,anon;
grant execute on function public.notify_interview_participant(uuid,text) to authenticated;
grant execute on function public.respond_to_interview(uuid,text) to authenticated;
