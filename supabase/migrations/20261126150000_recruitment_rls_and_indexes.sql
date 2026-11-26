drop policy if exists "Employers can view their employment offers" on public.employment_offers;
drop policy if exists "Applicants can view their employment offers" on public.employment_offers;
create policy "Participants can view their employment offers"
 on public.employment_offers for select to authenticated
 using ((employer_id=(select auth.uid()) or applicant_id=(select auth.uid())) and public.has_platform_access());

drop policy if exists "Employers can view their employment records" on public.employment_records;
drop policy if exists "Employees can view their employment records" on public.employment_records;
create policy "Employment parties can view their records"
 on public.employment_records for select to authenticated
 using ((employer_id=(select auth.uid()) or employee_id=(select auth.uid())) and public.has_platform_access());

create index if not exists employment_records_application_idx on public.employment_records(application_id);
create index if not exists interview_feedback_employer_idx on public.interview_feedback(employer_id);
create index if not exists interview_feedback_applicant_idx on public.interview_feedback(applicant_id);
create index if not exists interview_reminders_recipient_idx on public.interview_reminders(recipient_id);
