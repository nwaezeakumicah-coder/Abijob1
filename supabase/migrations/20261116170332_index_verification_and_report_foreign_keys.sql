CREATE INDEX IF NOT EXISTS idx_employer_verification_requests_reviewed_by
  ON public.employer_verification_requests (reviewed_by)
  WHERE reviewed_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_job_reports_reporter_id
  ON public.job_reports (reporter_id);

CREATE INDEX IF NOT EXISTS idx_job_reports_reviewed_by
  ON public.job_reports (reviewed_by)
  WHERE reviewed_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_professional_profiles_verified_by
  ON public.professional_profiles (verified_by)
  WHERE verified_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_professional_verification_requests_reviewed_by
  ON public.professional_verification_requests (reviewed_by)
  WHERE reviewed_by IS NOT NULL;
