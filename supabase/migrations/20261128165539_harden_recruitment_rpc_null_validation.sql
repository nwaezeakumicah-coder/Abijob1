-- Harden privileged recruitment RPCs against NULL and malformed arguments.
-- These functions keep ownership checks, row locks, and atomic notifications.

create or replace function public.issue_employment_offer(
  p_application_id uuid,
  p_salary_amount numeric,
  p_salary_currency text,
  p_employment_type text,
  p_work_location text,
  p_start_date date,
  p_expires_at timestamptz,
  p_terms text default ''
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_employer uuid := auth.uid();
  v_app public.job_applications%rowtype;
  v_job public.jobs%rowtype;
  v_offer_id uuid;
begin
  if v_employer is null or not public.has_platform_access() then
    raise exception 'Sign in with an active account to issue an offer' using errcode = '42501';
  end if;
  if not exists (
    select 1 from public.profiles p
    where p.id = v_employer and p.role = 'employer'
  ) then
    raise exception 'Only employer accounts can issue employment offers' using errcode = '42501';
  end if;

  if p_application_id is null
     or p_salary_amount is null
     or p_salary_amount < 0
     or p_salary_amount > 1000000000000
     or p_salary_currency is null
     or p_salary_currency !~ '^[A-Z]{3}$'
     or p_salary_currency not in ('NGN','USD','GBP','EUR')
     or p_employment_type is null
     or p_employment_type not in ('full_time','part_time','contract','temporary','internship','apprenticeship')
     or p_work_location is null
     or char_length(trim(p_work_location)) not between 1 and 500
     or p_start_date is null
     or p_expires_at is null
     or p_expires_at <= now()
     or p_expires_at > now() + interval '90 days'
     or char_length(coalesce(p_terms,'')) > 10000 then
    raise exception 'Offer details are invalid. Check salary, currency, employment type, location, start date and expiry.'
      using errcode = '22023';
  end if;

  select * into v_app
  from public.job_applications
  where id = p_application_id
  for update;
  if not found then
    raise exception 'Application not found' using errcode = 'P0002';
  end if;

  select * into v_job
  from public.jobs
  where id = v_app.job_id and employer_id = v_employer;
  if not found then
    raise exception 'You cannot issue an offer for this application' using errcode = '42501';
  end if;

  if v_app.status <> 'shortlisted' then
    raise exception 'Only shortlisted applicants can receive an employment offer' using errcode = '55000';
  end if;

  if exists (
    select 1 from public.employment_offers eo
    where eo.application_id = p_application_id and eo.status in ('sent','accepted')
  ) then
    raise exception 'An active employment offer already exists for this application' using errcode = '23505';
  end if;

  insert into public.employment_offers (
    application_id, employer_id, applicant_id, job_title, salary_amount,
    salary_currency, employment_type, work_location, start_date, expires_at, terms
  ) values (
    p_application_id, v_employer, v_app.applicant_id, v_job.title, p_salary_amount,
    p_salary_currency, p_employment_type, trim(p_work_location), p_start_date,
    p_expires_at, coalesce(p_terms,'')
  )
  returning id into v_offer_id;

  insert into public.notifications(user_id,title,description,category,href)
  values
    (v_app.applicant_id,'You received an employment offer',
     'Review the employment offer for ' || v_job.title || ' and respond before it expires.',
     'application','/dashboard/employment'),
    (v_employer,'Employment offer sent',
     'Your employment offer for ' || v_job.title || ' has been sent.',
     'application','/employer/employment');

  return v_offer_id;
end;
$function$;

create or replace function public.respond_to_employment_offer(
  p_offer_id uuid,
  p_response text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user uuid := auth.uid();
  v_offer public.employment_offers%rowtype;
begin
  if v_user is null or not public.has_platform_access() then
    raise exception 'Sign in to respond to this offer' using errcode = '42501';
  end if;

  if p_offer_id is null
     or p_response is null
     or p_response not in ('accepted','declined') then
    raise exception 'Invalid offer response' using errcode = '22023';
  end if;

  if not exists (
    select 1 from public.profiles p
    where p.id = v_user and p.role in ('job_seeker','professional')
  ) then
    raise exception 'Only job seekers and skilled professionals can respond to employment offers'
      using errcode = '42501';
  end if;

  select * into v_offer
  from public.employment_offers
  where id = p_offer_id and applicant_id = v_user
  for update;
  if not found then
    raise exception 'Employment offer not found' using errcode = 'P0002';
  end if;

  if v_offer.status <> 'sent' then
    raise exception 'This offer is no longer awaiting a response' using errcode = '55000';
  end if;

  if v_offer.expires_at <= now() then
    update public.employment_offers
    set status = 'expired', updated_at = now()
    where id = p_offer_id;

    insert into public.notifications(user_id,title,description,category,href)
    values
      (v_offer.applicant_id,'Employment offer expired',
       'The offer for ' || v_offer.job_title || ' has expired.',
       'application','/dashboard/employment'),
      (v_offer.employer_id,'Employment offer expired',
       'Your offer for ' || v_offer.job_title || ' expired before the candidate responded.',
       'application','/employer/employment');
    return false;
  end if;

  update public.employment_offers
  set status = p_response, responded_at = now(), updated_at = now()
  where id = p_offer_id;

  insert into public.notifications(user_id,title,description,category,href)
  values (
    v_offer.employer_id,
    case when p_response = 'accepted' then 'Employment offer accepted' else 'Employment offer declined' end,
    'The candidate has ' || p_response || ' your offer for ' || v_offer.job_title || '.',
    'application','/employer/employment'
  );

  return true;
end;
$function$;

create or replace function public.save_interview_feedback(
  p_interview_id uuid,
  p_rating smallint,
  p_recommendation text,
  p_strengths text default '',
  p_concerns text default '',
  p_private_notes text default ''
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user uuid := auth.uid();
  v_interview public.interviews%rowtype;
  v_feedback_id uuid;
begin
  if v_user is null or not public.has_platform_access()
     or not exists (
       select 1 from public.profiles p
       where p.id = v_user and p.role = 'employer'
     ) then
    raise exception 'Only an active employer can submit interview feedback'
      using errcode = '42501';
  end if;

  if p_interview_id is null
     or p_rating is null
     or p_rating not between 1 and 5
     or p_recommendation is null
     or p_recommendation not in ('hire','hold','reject')
     or char_length(coalesce(p_strengths,'')) > 5000
     or char_length(coalesce(p_concerns,'')) > 5000
     or char_length(coalesce(p_private_notes,'')) > 10000 then
    raise exception 'Interview feedback is invalid' using errcode = '22023';
  end if;

  select * into v_interview
  from public.interviews
  where id = p_interview_id and employer_id = v_user
  for update;
  if not found then
    raise exception 'Interview not found' using errcode = 'P0002';
  end if;

  if v_interview.status <> 'completed' then
    raise exception 'Interview feedback can only be submitted after the interview is completed'
      using errcode = '55000';
  end if;

  insert into public.interview_feedback(
    interview_id,employer_id,applicant_id,rating,recommendation,strengths,concerns,private_notes
  )
  values (
    v_interview.id,v_user,v_interview.applicant_id,p_rating,p_recommendation,
    coalesce(p_strengths,''),coalesce(p_concerns,''),coalesce(p_private_notes,'')
  )
  on conflict(interview_id) do update
  set rating = excluded.rating,
      recommendation = excluded.recommendation,
      strengths = excluded.strengths,
      concerns = excluded.concerns,
      private_notes = excluded.private_notes,
      updated_at = now()
  returning id into v_feedback_id;

  return v_feedback_id;
end;
$function$;

create or replace function public.end_employment_record(
  p_record_id uuid,
  p_status text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user uuid := auth.uid();
  v_record public.employment_records%rowtype;
begin
  if v_user is null or not public.has_platform_access()
     or not exists (
       select 1 from public.profiles p
       where p.id = v_user and p.role = 'employer'
     ) then
    raise exception 'Only an active employer can update employment status'
      using errcode = '42501';
  end if;

  if p_record_id is null
     or p_status is null
     or p_status not in ('completed','terminated') then
    raise exception 'Invalid employment status update' using errcode = '22023';
  end if;

  select * into v_record
  from public.employment_records
  where id = p_record_id and employer_id = v_user
  for update;
  if not found then
    raise exception 'Employment record not found' using errcode = 'P0002';
  end if;

  if v_record.status not in ('active','upcoming') then
    raise exception 'This employment record is already closed' using errcode = '55000';
  end if;

  update public.employment_records
  set status = p_status, ended_at = now(), updated_at = now()
  where id = p_record_id;

  insert into public.notifications(user_id,title,description,category,href)
  values (
    v_record.employee_id,
    case when p_status = 'completed' then 'Employment marked completed' else 'Employment ended' end,
    'Your employment record for ' || v_record.job_title || ' was updated by the employer.',
    'application','/dashboard/employment'
  );

  return true;
end;
$function$;


-- The application-status trigger already notifies the candidate when the
-- application becomes hired. Keep only the employer-side confirmation here
-- to avoid sending the candidate two near-identical notifications.
create or replace function public.confirm_employment_offer(
  p_offer_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user uuid := auth.uid();
  v_offer public.employment_offers%rowtype;
  v_record_id uuid;
begin
  if v_user is null or not public.has_platform_access()
     or not exists (
       select 1 from public.profiles p
       where p.id = v_user and p.role = 'employer'
     ) then
    raise exception 'Only an active employer can confirm hiring' using errcode = '42501';
  end if;

  if p_offer_id is null then
    raise exception 'Employment offer ID is required' using errcode = '22023';
  end if;

  select * into v_offer
  from public.employment_offers
  where id = p_offer_id and employer_id = v_user
  for update;
  if not found then
    raise exception 'Employment offer not found' using errcode = 'P0002';
  end if;

  if v_offer.status <> 'accepted' then
    raise exception 'The candidate must accept the offer before hiring can be confirmed'
      using errcode = '55000';
  end if;

  insert into public.employment_records(
    offer_id,application_id,employer_id,employee_id,job_title,employment_type,
    salary_amount,salary_currency,work_location,start_date,status
  ) values (
    v_offer.id,v_offer.application_id,v_offer.employer_id,v_offer.applicant_id,
    v_offer.job_title,v_offer.employment_type,v_offer.salary_amount,
    v_offer.salary_currency,v_offer.work_location,v_offer.start_date,
    case when v_offer.start_date <= current_date then 'active' else 'upcoming' end
  )
  returning id into v_record_id;

  update public.employment_offers
  set status = 'confirmed', confirmed_at = now(), updated_at = now()
  where id = v_offer.id;

  update public.job_applications
  set status = 'hired', updated_at = now()
  where id = v_offer.application_id;

  insert into public.notifications(user_id,title,description,category,href)
  values (
    v_user,'Hiring confirmed',
    'Employment has been confirmed for ' || v_offer.job_title || '.',
    'application','/employer/employment'
  );

  return v_record_id;
end;
$function$;
