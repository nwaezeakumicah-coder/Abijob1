alter table public.interviews
  add column if not exists applicant_response text
  check (applicant_response is null or applicant_response in ('accepted','declined'));

update public.interviews
set applicant_response=status,
    status='scheduled',
    updated_at=now()
where status in ('accepted','declined')
  and applicant_response is null;

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
 if v_interview.status not in ('scheduled','rescheduled') or v_interview.applicant_response is not null then
   raise exception 'This interview invitation can no longer be answered' using errcode='55000';
 end if;
 update public.interviews set applicant_response=p_response,updated_at=now() where id=p_interview_id;
 insert into public.notifications(user_id,title,description,category,href)
 values(v_interview.employer_id,
   case when p_response='accepted' then 'Interview invitation accepted' else 'Interview invitation declined' end,
   case when p_response='accepted' then 'The candidate accepted your interview invitation.' else 'The candidate declined your interview invitation.' end,
   'application','/employer/interviews');
 return true;
end;
$$;

create or replace function public.save_interview_feedback(
 p_interview_id uuid,p_rating smallint,p_recommendation text,
 p_strengths text default '',p_concerns text default '',p_private_notes text default ''
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
 v_user uuid:=auth.uid();
 v_interview public.interviews%rowtype;
 v_feedback_id uuid;
begin
 if v_user is null or not public.has_platform_access()
    or not exists(select 1 from public.profiles p where p.id=v_user and p.role='employer') then
   raise exception 'Only an active employer can submit interview feedback' using errcode='42501';
 end if;
 if p_rating not between 1 and 5 or p_recommendation not in ('hire','hold','reject')
    or char_length(coalesce(p_strengths,''))>5000
    or char_length(coalesce(p_concerns,''))>5000
    or char_length(coalesce(p_private_notes,''))>10000 then
   raise exception 'Interview feedback is invalid' using errcode='22023';
 end if;
 select * into v_interview from public.interviews where id=p_interview_id and employer_id=v_user for update;
 if not found then raise exception 'Interview not found' using errcode='P0002'; end if;
 if v_interview.status<>'completed' then
   raise exception 'Interview feedback can only be submitted after the interview is completed' using errcode='55000';
 end if;
 insert into public.interview_feedback(interview_id,employer_id,applicant_id,rating,recommendation,strengths,concerns,private_notes)
 values(v_interview.id,v_user,v_interview.applicant_id,p_rating,p_recommendation,coalesce(p_strengths,''),coalesce(p_concerns,''),coalesce(p_private_notes,''))
 on conflict(interview_id) do update set rating=excluded.rating,recommendation=excluded.recommendation,
 strengths=excluded.strengths,concerns=excluded.concerns,private_notes=excluded.private_notes,updated_at=now()
 returning id into v_feedback_id;
 return v_feedback_id;
end;
$$;
