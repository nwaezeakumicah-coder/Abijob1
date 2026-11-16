-- Consolidate equivalent permissive policies without changing access semantics.
-- Admin-wide management remains available, including DELETE, through explicit policies.

DROP POLICY IF EXISTS "Applicants can view their interviews" ON public.interviews;
DROP POLICY IF EXISTS "Employers can view their interviews" ON public.interviews;
CREATE POLICY "Participants can view their interviews"
ON public.interviews FOR SELECT TO authenticated
USING (
  (applicant_id = (SELECT auth.uid()) AND has_platform_access())
  OR (employer_id = (SELECT auth.uid()) AND has_platform_access())
);

DROP POLICY IF EXISTS "Admins can manage applications" ON public.job_applications;
DROP POLICY IF EXISTS "Eligible users can apply" ON public.job_applications;
DROP POLICY IF EXISTS "Applicants can view their applications" ON public.job_applications;
DROP POLICY IF EXISTS "Employers can view applications to their jobs" ON public.job_applications;
DROP POLICY IF EXISTS "Applicants can withdraw applications" ON public.job_applications;
DROP POLICY IF EXISTS "Employers can update application status" ON public.job_applications;

CREATE POLICY "Application read access"
ON public.job_applications FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin'::public.account_role
  )
  OR applicant_id = (SELECT auth.uid())
  OR (
    EXISTS (
      SELECT 1 FROM public.jobs j
      JOIN public.profiles p ON p.id = j.employer_id
      WHERE j.id = job_applications.job_id
        AND j.employer_id = (SELECT auth.uid())
        AND p.role = 'employer'::public.account_role
    )
    AND has_platform_access()
  )
);

CREATE POLICY "Application insert access"
ON public.job_applications FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin'::public.account_role
  )
  OR (
    applicant_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.role = ANY (ARRAY['job_seeker'::public.account_role, 'professional'::public.account_role])
    )
    AND EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = job_applications.job_id
        AND j.status = 'approved'
        AND private.employer_account_is_active(j.employer_id)
    )
    AND EXISTS (
      SELECT 1 FROM public.subscriptions s
      JOIN public.profiles p ON p.id = s.user_id
      WHERE s.user_id = (SELECT auth.uid())
        AND s.account_role = (p.role)::text
        AND (
          (s.status = ANY (ARRAY['trialing'::text, 'active'::text])
            AND s.trial_started_at IS NOT NULL
            AND s.trial_started_at <= now()
            AND s.trial_ends_at > now())
          OR
          (s.status = 'active'::text
            AND s.current_period_start IS NOT NULL
            AND s.current_period_start <= now()
            AND s.current_period_end > now())
        )
    )
  )
);

CREATE POLICY "Application update access"
ON public.job_applications FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin'::public.account_role
  )
  OR (applicant_id = (SELECT auth.uid()) AND status <> 'withdrawn')
  OR (
    status <> 'withdrawn'
    AND EXISTS (
      SELECT 1 FROM public.jobs j
      JOIN public.profiles p ON p.id = j.employer_id
      WHERE j.id = job_applications.job_id
        AND j.employer_id = (SELECT auth.uid())
        AND p.role = 'employer'::public.account_role
    )
    AND has_platform_access()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin'::public.account_role
  )
  OR (applicant_id = (SELECT auth.uid()) AND status = 'withdrawn')
  OR (
    status = ANY (ARRAY['submitted'::text, 'under_review'::text, 'shortlisted'::text, 'rejected'::text, 'hired'::text])
    AND EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = job_applications.job_id AND j.employer_id = (SELECT auth.uid())
    )
    AND has_platform_access()
  )
);

CREATE POLICY "Application delete access"
ON public.job_applications FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin'::public.account_role
  )
);

DROP POLICY IF EXISTS "Admins can manage jobs" ON public.jobs;
DROP POLICY IF EXISTS "Employers can create jobs" ON public.jobs;
DROP POLICY IF EXISTS "Employers can view their jobs" ON public.jobs;
DROP POLICY IF EXISTS "Public can view approved jobs" ON public.jobs;
DROP POLICY IF EXISTS "Employers can edit pending jobs" ON public.jobs;

CREATE POLICY "Job read access"
ON public.jobs FOR SELECT TO anon, authenticated
USING (
  (status = 'approved' AND private.employer_account_is_active(employer_id))
  OR (
    employer_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid()) AND p.role = 'employer'::public.account_role
    )
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin'::public.account_role
  )
);

CREATE POLICY "Job insert access"
ON public.jobs FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin'::public.account_role
  )
  OR (
    employer_id = (SELECT auth.uid())
    AND status = 'pending'
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid()) AND p.role = 'employer'::public.account_role
    )
    AND private.employer_account_is_active((SELECT auth.uid()))
    AND has_platform_access()
  )
);

CREATE POLICY "Job update access"
ON public.jobs FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin'::public.account_role
  )
  OR (
    employer_id = (SELECT auth.uid())
    AND status = 'pending'
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid()) AND p.role = 'employer'::public.account_role
    )
    AND private.employer_account_is_active((SELECT auth.uid()))
    AND has_platform_access()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin'::public.account_role
  )
  OR (
    employer_id = (SELECT auth.uid())
    AND status = 'pending'
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid()) AND p.role = 'employer'::public.account_role
    )
    AND private.employer_account_is_active((SELECT auth.uid()))
    AND has_platform_access()
  )
);

CREATE POLICY "Job delete access"
ON public.jobs FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin'::public.account_role
  )
);
