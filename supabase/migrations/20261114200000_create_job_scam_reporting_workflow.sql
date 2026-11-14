CREATE TABLE IF NOT EXISTS public.job_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text NOT NULL CHECK (reason IN ('fraud', 'payment_request', 'misleading', 'duplicate', 'expired', 'other')),
  details text NOT NULL CHECK (char_length(btrim(details)) BETWEEN 20 AND 2000),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_review', 'resolved', 'dismissed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES public.platform_admins(id) ON DELETE SET NULL,
  admin_notes text
);

CREATE INDEX IF NOT EXISTS idx_job_reports_status_created
  ON public.job_reports(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_reports_job_id
  ON public.job_reports(job_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_job_reports_one_open_per_reporter_job
  ON public.job_reports(job_id, reporter_id)
  WHERE status IN ('open', 'in_review');

ALTER TABLE public.job_reports ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.job_reports FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.job_reports TO service_role;

CREATE OR REPLACE FUNCTION public.submit_job_report(
  p_job_id uuid, p_reason text, p_details text
)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $function$
DECLARE
  v_reporter_id uuid := auth.uid();
  v_job public.jobs%ROWTYPE;
  v_report_id uuid;
BEGIN
  IF v_reporter_id IS NULL THEN
    RAISE EXCEPTION 'You must sign in to report a vacancy' USING ERRCODE = '42501';
  END IF;
  IF p_job_id IS NULL
     OR p_reason NOT IN ('fraud', 'payment_request', 'misleading', 'duplicate', 'expired', 'other')
     OR p_details IS NULL
     OR pg_catalog.char_length(pg_catalog.btrim(p_details)) < 20
     OR pg_catalog.char_length(p_details) > 2000 THEN
    RAISE EXCEPTION 'Please provide a valid report and at least 20 characters of details' USING ERRCODE = '22023';
  END IF;
  SELECT * INTO v_job FROM public.jobs WHERE id = p_job_id AND status = 'approved';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'This vacancy cannot be reported' USING ERRCODE = 'P0002';
  END IF;
  IF v_job.employer_id = v_reporter_id THEN
    RAISE EXCEPTION 'You cannot report your own vacancy' USING ERRCODE = '42501';
  END IF;
  INSERT INTO public.job_reports(job_id, reporter_id, reason, details)
  VALUES (p_job_id, v_reporter_id, p_reason, pg_catalog.btrim(p_details))
  RETURNING id INTO v_report_id;
  RETURN v_report_id;
EXCEPTION WHEN unique_violation THEN
  RAISE EXCEPTION 'You already have an open report for this vacancy' USING ERRCODE = '23505';
END;
$function$;

REVOKE ALL ON FUNCTION public.submit_job_report(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_job_report(uuid, text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_review_job_report(
  p_admin_id uuid, p_report_id uuid, p_status text, p_admin_notes text DEFAULT NULL
)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $function$
DECLARE
  v_admin public.platform_admins%ROWTYPE;
  v_report public.job_reports%ROWTYPE;
BEGIN
  IF p_admin_id IS NULL OR p_report_id IS NULL
     OR p_status NOT IN ('in_review', 'resolved', 'dismissed')
     OR (p_admin_notes IS NOT NULL AND pg_catalog.char_length(p_admin_notes) > 2000) THEN
    RAISE EXCEPTION 'Invalid report review request' USING ERRCODE = '22023';
  END IF;
  SELECT * INTO v_admin FROM public.platform_admins
  WHERE id = p_admin_id AND status = 'active' FOR SHARE;
  IF NOT FOUND OR NOT EXISTS (
    SELECT 1 FROM public.admin_permissions permission
    WHERE permission.role = v_admin.role
      AND permission.permission_key IN ('jobs.review', 'jobs.manage', 'support.manage')
  ) THEN
    RAISE EXCEPTION 'Active administrator review permission required' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO v_report FROM public.job_reports WHERE id = p_report_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Report not found' USING ERRCODE = 'P0002';
  END IF;
  UPDATE public.job_reports
  SET status = p_status,
      reviewed_at = CASE WHEN p_status IN ('resolved', 'dismissed') THEN now() ELSE reviewed_at END,
      reviewed_by = p_admin_id,
      admin_notes = NULLIF(pg_catalog.btrim(p_admin_notes), '')
  WHERE id = p_report_id;
  INSERT INTO public.admin_audit_logs(actor_admin_id, action, entity_type, entity_id, details)
  VALUES (
    p_admin_id, 'job_report.' || p_status, 'job_report', p_report_id::text,
    pg_catalog.jsonb_build_object(
      'job_id', v_report.job_id, 'previous_status', v_report.status,
      'new_status', p_status, 'reason', v_report.reason
    )
  );
  RETURN TRUE;
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_review_job_report(uuid, uuid, text, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_review_job_report(uuid, uuid, text, text)
  TO service_role;
