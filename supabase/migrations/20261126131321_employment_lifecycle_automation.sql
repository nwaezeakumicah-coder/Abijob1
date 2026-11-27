create or replace function public.withdraw_employment_offer(p_offer_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
 v_user uuid:=auth.uid();
 v_offer public.employment_offers%rowtype;
begin
 if v_user is null or not public.has_platform_access()
    or not exists(select 1 from public.profiles p where p.id=v_user and p.role='employer') then
  raise exception 'Only an active employer can withdraw an offer' using errcode='42501';
 end if;
 select * into v_offer from public.employment_offers where id=p_offer_id and employer_id=v_user for update;
 if not found then raise exception 'Employment offer not found' using errcode='P0002'; end if;
 if v_offer.status<>'sent' then raise exception 'Only an offer awaiting response can be withdrawn' using errcode='55000'; end if;
 update public.employment_offers set status='withdrawn',updated_at=now() where id=p_offer_id;
 insert into public.notifications(user_id,title,description,category,href)
 values(v_offer.applicant_id,'Employment offer withdrawn','The employer withdrew the offer for '||v_offer.job_title||'.','application','/dashboard/employment');
 return true;
end;
$$;

create or replace function public.end_employment_record(p_record_id uuid,p_status text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
 v_user uuid:=auth.uid();
 v_record public.employment_records%rowtype;
begin
 if v_user is null or not public.has_platform_access()
    or not exists(select 1 from public.profiles p where p.id=v_user and p.role='employer') then
  raise exception 'Only an active employer can update employment status' using errcode='42501';
 end if;
 if p_status not in ('completed','terminated') then raise exception 'Invalid employment status' using errcode='22023'; end if;
 select * into v_record from public.employment_records where id=p_record_id and employer_id=v_user for update;
 if not found then raise exception 'Employment record not found' using errcode='P0002'; end if;
 if v_record.status not in ('active','upcoming') then raise exception 'This employment record is already closed' using errcode='55000'; end if;
 update public.employment_records set status=p_status,ended_at=now(),updated_at=now() where id=p_record_id;
 insert into public.notifications(user_id,title,description,category,href)
 values(v_record.employee_id,
  case when p_status='completed' then 'Employment marked completed' else 'Employment ended' end,
  'Your employment record for '||v_record.job_title||' was updated by the employer.',
  'application','/dashboard/employment');
 return true;
end;
$$;

create or replace function public.expire_pending_employment_offers()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare v_offer public.employment_offers%rowtype; v_count integer:=0;
begin
 for v_offer in select * from public.employment_offers
  where status='sent' and expires_at<=now() for update skip locked
 loop
  update public.employment_offers set status='expired',updated_at=now() where id=v_offer.id;
  insert into public.notifications(user_id,title,description,category,href)
   values(v_offer.applicant_id,'Employment offer expired','The offer for '||v_offer.job_title||' has expired.','application','/dashboard/employment');
  insert into public.notifications(user_id,title,description,category,href)
   values(v_offer.employer_id,'Employment offer expired','Your offer for '||v_offer.job_title||' expired without a response.','application','/employer/employment');
  v_count:=v_count+1;
 end loop;
 return v_count;
end;
$$;

create or replace function public.sync_employment_record_statuses()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare v_record public.employment_records%rowtype; v_count integer:=0;
begin
 for v_record in select * from public.employment_records
  where status='upcoming' and start_date<=current_date for update skip locked
 loop
  update public.employment_records set status='active',updated_at=now() where id=v_record.id;
  insert into public.notifications(user_id,title,description,category,href)
   values(v_record.employee_id,'Your employment starts today','Your employment record for '||v_record.job_title||' is now active.','application','/dashboard/employment');
  v_count:=v_count+1;
 end loop;
 return v_count;
end;
$$;

revoke all on function public.withdraw_employment_offer(uuid) from public,anon;
revoke all on function public.end_employment_record(uuid,text) from public,anon;
revoke all on function public.expire_pending_employment_offers() from public,anon,authenticated;
revoke all on function public.sync_employment_record_statuses() from public,anon,authenticated;
grant execute on function public.withdraw_employment_offer(uuid) to authenticated;
grant execute on function public.end_employment_record(uuid,text) to authenticated;
grant execute on function public.expire_pending_employment_offers() to service_role;
grant execute on function public.sync_employment_record_statuses() to service_role;

do $$
begin
 perform cron.unschedule(jobid) from cron.job where jobname in ('abijob-expire-employment-offers','abijob-sync-employment-records');
 perform cron.schedule('abijob-expire-employment-offers','*/15 * * * *','select public.expire_pending_employment_offers();');
 perform cron.schedule('abijob-sync-employment-records','15 * * * *','select public.sync_employment_record_statuses();');
end;
$$;
