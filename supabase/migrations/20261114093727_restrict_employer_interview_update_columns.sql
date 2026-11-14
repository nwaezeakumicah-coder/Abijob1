-- Employers may reschedule or update the state/details of their own
-- valid interviews, but cannot reassign the interview to another applicant
-- or change its employer/application identity.
REVOKE UPDATE ON TABLE public.interviews FROM authenticated;
GRANT UPDATE (
  scheduled_at,
  duration_minutes,
  interview_type,
  meeting_link,
  location,
  notes,
  status
) ON TABLE public.interviews TO authenticated;
