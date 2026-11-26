-- Recruitment & Employment Management
-- Extends the existing interviews and applications workflow without replacing it.

create table if not exists public.interview_feedback (
  id uuid primary key default gen_random_uuid(),
  interview_id uuid not null unique references public.interviews(id) on delete cascade,
  employer_id uuid not null references public.profiles(id) on delete cascade,
  applicant_id uuid not null references public.profiles(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  recommendation text not null check (recommendation in ('hire','hold','reject')),
  strengths text not null default '' check (char_length(strengths) <= 5000),
  concerns text not null default '' check (char_length(concerns) <= 5000),
  private_notes text not null default '' check (char_length(private_notes) <= 10000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.employment_offers (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.job_applications(id) on delete restrict,
  employer_id uuid not null references public.profiles(id) on delete restrict,
  applicant_id uuid not null references public.profiles(id) on delete restrict,
  job_title text not null,
  salary_amount numeric(14,2) not null check (salary_amount >= 0),
  salary_currency text not null default 'NGN' check (salary_currency ~ '^[A-Z]{3}$'),
  employment_type text not null check (employment_type in ('full_time','part_time','contract','temporary','internship','apprenticeship')),
  work_location text not null check (char_length(work_location) between 1 and 500),
  start_date date not null,
  expires_at timestamptz not null,
  terms text not null default '' check (char_length(terms) <= 10000),
  status text not null default 'sent' check (status in ('sent','accepted','declined','withdrawn','expired','confirmed')),
  issued_at timestamptz not null default now(),
  responded_at timestamptz,
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (expires_at > issued_at)
);

create unique index if not exists employment_offers_one_open_per_application
  on public.employment_offers(application_id)
  where status in ('sent','accepted');

create index if not exists employment_offers_employer_created_idx
  on public.employment_offers(employer_id, created_at desc);
create index if not exists employment_offers_applicant_created_idx
  on public.employment_offers(applicant_id, created_at desc);

create table if not exists public.employment_records (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null unique references public.employment_offers(id) on delete restrict,
  application_id uuid not null references public.job_applications(id) on delete restrict,
  employer_id uuid not null references public.profiles(id) on delete restrict,
  employee_id uuid not null references public.profiles(id) on delete restrict,
  job_title text not null,
  employment_type text not null,
  salary_amount numeric(14,2) not null check (salary_amount >= 0),
  salary_currency text not null check (salary_currency ~ '^[A-Z]{3}$'),
  work_location text not null,
  start_date date not null,
  status text not null default 'upcoming' check (status in ('upcoming','active','completed','terminated')),
  confirmed_at timestamptz not null default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists employment_records_employer_idx
  on public.employment_records(employer_id, status, start_date desc);
create index if not exists employment_records_employee_idx
  on public.employment_records(employee_id, status, start_date desc);

alter table public.interview_feedback enable row level security;
alter table public.employment_offers enable row level security;
alter table public.employment_records enable row level security;

drop policy if exists "Employers can view their interview feedback" on public.interview_feedback;
create policy "Employers can view their interview feedback"
  on public.interview_feedback for select to authenticated
  using (employer_id = (select auth.uid()) and public.has_platform_access());

drop policy if exists "Employers can view their employment offers" on public.employment_offers;
create policy "Employers can view their employment offers"
  on public.employment_offers for select to authenticated
  using (employer_id = (select auth.uid()) and public.has_platform_access());

drop policy if exists "Applicants can view their employment offers" on public.employment_offers;
create policy "Applicants can view their employment offers"
  on public.employment_offers for select to authenticated
  using (applicant_id = (select auth.uid()) and public.has_platform_access());

drop policy if exists "Employers can view their employment records" on public.employment_records;
create policy "Employers can view their employment records"
  on public.employment_records for select to authenticated
  using (employer_id = (select auth.uid()) and public.has_platform_access());

drop policy if exists "Employees can view their employment records" on public.employment_records;
create policy "Employees can view their employment records"
  on public.employment_records for select to authenticated
  using (employee_id = (select auth.uid()) and public.has_platform_access());

grant select on public.interview_feedback, public.employment_offers, public.employment_records to authenticated;
revoke insert, update, delete on public.interview_feedback, public.employment_offers, public.employment_records from anon, authenticated;

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
as $$
declare
  v_employer uuid := auth.uid();
  v_app public.job_applications%rowtype;
  v_job public.jobs%rowtype;
  v_offer_id uuid;
begin
  if v_employer is null or not public.has_platform_access() then
    raise exception 'Sign in with an active account to issue an offer' using errcode = '42501';
  end if;
  if not exists (select 1 from public.profiles p where p.id=v_employer and p.role='employer') then
    raise exception 'Only employer accounts can issue employment offers' using errcode = '42501';
  end if;
  if p_application_id is null or p_salary_amount is null or p_salary_amount < 0
     or p_salary_currency !~ '^[A-Z]{3}$'
     or p_employment_type not in ('full_time','part_time','contract','temporary','internship','apprenticeship')
     or p_work_location is null or char_length(trim(p_work_location)) not between 1 and 500
     or p_start_date is null or p_expires_at is null
     or p_expires_at <= now() or p_expires_at > now() + interval '90 days'
     or char_length(coalesce(p_terms,'')) > 10000 then
    raise exception 'Offer details are invalid. Check salary, employment type, location, start date and expiry.' using errcode='22023';
  end if;

  select * into v_app from public.job_applications where id=p_application_id for update;
  if not found then raise exception 'Application not found' using errcode='P0002'; end if;
  select * into v_job from public.jobs where id=v_app.job_id and employer_id=v_employer;
  if not found then raise exception 'You cannot issue an offer for this application' using errcode='42501'; end if;
  if v_app.status <> 'shortlisted' then
    raise exception 'Only shortlisted applicants can receive an employment offer' using errcode='55000';
  end if;
  if exists (select 1 from public.employment_offers eo where eo.application_id=p_application_id and eo.status in ('sent','accepted')) then
    raise exception 'An active employment offer already exists for this application' using errcode='23505';
  end if;

  insert into public.employment_offers (
    application_id, employer_id, applicant_id, job_title, salary_amount,
    salary_currency, employment_type, work_location, start_date, expires_at, terms
  ) values (
    p_application_id, v_employer, v_app.applicant_id, v_job.title, p_salary_amount,
    p_salary_currency, p_employment_type, trim(p_work_location), p_start_date, p_expires_at, coalesce(p_terms,'')
  ) returning id into v_offer_id;

  insert into public.notifications(user_id,title,description,category,href)
  values (v_app.applicant_id,'You received an employment offer',
    'Review the employment offer for ' || v_job.title || ' and respond before it expires.',
    'application','/dashboard/employment');
  insert into public.notifications(user_id,title,description,category,href)
  values (v_employer,'Employment offer sent',
    'Your employment offer for ' || v_job.title || ' has been sent.',
    'application','/employer/employment');
  return v_offer_id;
end;
$$;

create or replace function public.respond_to_employment_offer(p_offer_id uuid, p_response text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_offer public.employment_offers%rowtype;
begin
  if v_user is null or not public.has_platform_access() then
    raise exception 'Sign in to respond to this offer' using errcode='42501';
  end if;
  if p_response not in ('accepted','declined') then
    raise exception 'Invalid offer response' using errcode='22023';
  end if;
  select * into v_offer from public.employment_offers
    where id=p_offer_id and applicant_id=v_user for update;
  if not found then raise exception 'Employment offer not found' using errcode='P0002'; end if;
  if v_offer.status <> 'sent' then raise exception 'This offer is no longer awaiting a response' using errcode='55000'; end if;
  if v_offer.expires_at <= now() then
    update public.employment_offers set status='expired',updated_at=now() where id=p_offer_id;
    return false;
  end if;
  update public.employment_offers set status=p_response,responded_at=now(),updated_at=now() where id=p_offer_id;
  insert into public.notifications(user_id,title,description,category,href)
  values (v_offer.employer_id,
    case when p_response='accepted' then 'Employment offer accepted' else 'Employment offer declined' end,
    'The candidate has ' || p_response || ' your offer for ' || v_offer.job_title || '.',
    'application','/employer/employment');
  return true;
end;
$$;

create or replace function public.confirm_employment_offer(p_offer_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_offer public.employment_offers%rowtype;
  v_record_id uuid;
begin
  if v_user is null or not public.has_platform_access()
     or not exists (select 1 from public.profiles p where p.id=v_user and p.role='employer') then
    raise exception 'Only an active employer can confirm hiring' using errcode='42501';
  end if;
  select * into v_offer from public.employment_offers
    where id=p_offer_id and employer_id=v_user for update;
  if not found then raise exception 'Employment offer not found' using errcode='P0002'; end if;
  if v_offer.status <> 'accepted' then
    raise exception 'The candidate must accept the offer before hiring can be confirmed' using errcode='55000';
  end if;
  insert into public.employment_records(
    offer_id,application_id,employer_id,employee_id,job_title,employment_type,
    salary_amount,salary_currency,work_location,start_date,status
  ) values (
    v_offer.id,v_offer.application_id,v_offer.employer_id,v_offer.applicant_id,
    v_offer.job_title,v_offer.employment_type,v_offer.salary_amount,
    v_offer.salary_currency,v_offer.work_location,v_offer.start_date,
    case when v_offer.start_date <= current_date then 'active' else 'upcoming' end
  ) returning id into v_record_id;
  update public.employment_offers set status='confirmed',confirmed_at=now(),updated_at=now() where id=v_offer.id;
  update public.job_applications set status='hired',updated_at=now() where id=v_offer.application_id;
  insert into public.notifications(user_id,title,description,category,href)
  values (v_offer.applicant_id,'Your employment has been confirmed',
    'The employer confirmed your hiring for ' || v_offer.job_title || '.',
    'application','/dashboard/employment');
  insert into public.notifications(user_id,title,description,category,href)
  values (v_user,'Hiring confirmed',
    'Employment has been confirmed for ' || v_offer.job_title || '.',
    'application','/employer/employment');
  return v_record_id;
end;
$$;

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
as $$
declare
  v_user uuid := auth.uid();
  v_interview public.interviews%rowtype;
  v_feedback_id uuid;
begin
  if v_user is null or not public.has_platform_access()
     or not exists (select 1 from public.profiles p where p.id=v_user and p.role='employer') then
    raise exception 'Only an active employer can submit interview feedback' using errcode='42501';
  end if;
  if p_rating not between 1 and 5 or p_recommendation not in ('hire','hold','reject')
     or char_length(coalesce(p_strengths,'')) > 5000
     or char_length(coalesce(p_concerns,'')) > 5000
     or char_length(coalesce(p_private_notes,'')) > 10000 then
    raise exception 'Interview feedback is invalid' using errcode='22023';
  end if;
  select * into v_interview from public.interviews
    where id=p_interview_id and employer_id=v_user for update;
  if not found then raise exception 'Interview not found' using errcode='P0002'; end if;
  if v_interview.status not in ('completed','scheduled','rescheduled') then
    raise exception 'Feedback cannot be recorded for this interview status' using errcode='55000';
  end if;
  insert into public.interview_feedback(
    interview_id,employer_id,applicant_id,rating,recommendation,strengths,concerns,private_notes
  ) values (
    v_interview.id,v_user,v_interview.applicant_id,p_rating,p_recommendation,
    coalesce(p_strengths,''),coalesce(p_concerns,''),coalesce(p_private_notes,'')
  )
  on conflict (interview_id) do update set
    rating=excluded.rating,recommendation=excluded.recommendation,
    strengths=excluded.strengths,concerns=excluded.concerns,
    private_notes=excluded.private_notes,updated_at=now()
  returning id into v_feedback_id;
  return v_feedback_id;
end;
$$;

revoke all on function public.issue_employment_offer(uuid,numeric,text,text,text,date,timestamptz,text) from public, anon;
revoke all on function public.respond_to_employment_offer(uuid,text) from public, anon;
revoke all on function public.confirm_employment_offer(uuid) from public, anon;
revoke all on function public.save_interview_feedback(uuid,smallint,text,text,text,text) from public, anon;
grant execute on function public.issue_employment_offer(uuid,numeric,text,text,text,date,timestamptz,text) to authenticated;
grant execute on function public.respond_to_employment_offer(uuid,text) to authenticated;
grant execute on function public.confirm_employment_offer(uuid) to authenticated;
grant execute on function public.save_interview_feedback(uuid,smallint,text,text,text,text) to authenticated;
