-- Persist saved job opportunities per authenticated account.
CREATE TABLE IF NOT EXISTS public.saved_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT saved_jobs_user_job_unique UNIQUE (user_id, job_id)
);

ALTER TABLE public.saved_jobs ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, DELETE ON public.saved_jobs TO authenticated;
REVOKE ALL ON public.saved_jobs FROM anon;

DROP POLICY IF EXISTS saved_jobs_select_own ON public.saved_jobs;
CREATE POLICY saved_jobs_select_own
  ON public.saved_jobs FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS saved_jobs_insert_own ON public.saved_jobs;
CREATE POLICY saved_jobs_insert_own
  ON public.saved_jobs FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.role::text IN ('job_seeker', 'professional')
    )
    AND public.user_has_platform_access((SELECT auth.uid()))
    AND EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = job_id AND j.status = 'approved'
    )
  );

DROP POLICY IF EXISTS saved_jobs_delete_own ON public.saved_jobs;
CREATE POLICY saved_jobs_delete_own
  ON public.saved_jobs FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);
