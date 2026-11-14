CREATE OR REPLACE FUNCTION public.admin_review_employer(
  p_admin_id uuid,
  p_employer_id uuid,
  p_decision text,
  p_reason text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_admin public.platform_admins%ROWTYPE;
  v_employer public.employer_profiles%ROWTYPE;
  v_now timestamptz := pg_catalog.now();
  v_action text;
  v_details jsonb;
BEGIN
  IF p_admin_id IS NULL OR p_employer_id IS NULL THEN
    RAISE EXCEPTION 'Administrator and employer identifiers are required'
      USING ERRCODE = '22023';
  END IF;

  IF p_decision NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'Invalid employer review decision'
      USING ERRCODE = '22023';
  END IF;

  IF p_decision = 'rejected'
     AND (p_reason IS NULL OR pg_catalog.length(pg_catalog.btrim(p_reason)) < 10
          OR pg_catalog.length(p_reason) > 1000) THEN
    RAISE EXCEPTION 'A rejection reason between 10 and 1000 characters is required'
      USING ERRCODE = '22023';
  END IF;

  SELECT *
  INTO v_admin
  FROM public.platform_admins
  WHERE id = p_admin_id
    AND status = 'active'
  FOR SHARE;

  IF NOT FOUND OR NOT EXISTS (
    SELECT 1
    FROM public.admin_permissions permission
    WHERE permission.role = v_admin.role
      AND permission.permission_key = 'employers.manage'
  ) THEN
    RAISE EXCEPTION 'Active administrator permission required'
      USING ERRCODE = '42501';
  END IF;

  SELECT *
  INTO v_employer
  FROM public.employer_profiles
  WHERE user_id = p_employer_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Employer account not found'
      USING ERRCODE = 'P0002';
  END IF;

  IF v_employer.verification_status <> 'pending' THEN
    RAISE EXCEPTION 'Only pending employers can be reviewed'
      USING ERRCODE = '40001';
  END IF;

  UPDATE public.employer_profiles
  SET verification_status = p_decision,
      verified_at = CASE WHEN p_decision = 'approved' THEN v_now ELSE NULL END,
      verified_by = p_admin_id,
      updated_at = v_now
  WHERE user_id = p_employer_id
    AND verification_status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Employer status changed during review'
      USING ERRCODE = '40001';
  END IF;

  v_action := CASE
    WHEN p_decision = 'approved' THEN 'employer.approve'
    ELSE 'employer.reject'
  END;

  v_details := pg_catalog.jsonb_build_object(
    'business_name', COALESCE(v_employer.business_name, 'Unnamed business'),
    'previous_status', 'pending',
    'new_status', p_decision,
    'reviewed_at', v_now,
    'verification_type', 'employer'
  );

  IF p_decision = 'rejected' THEN
    v_details := v_details || pg_catalog.jsonb_build_object(
      'rejection_reason', pg_catalog.btrim(p_reason)
    );
  END IF;

  INSERT INTO public.admin_audit_logs (
    actor_admin_id,
    action,
    entity_type,
    entity_id,
    details
  )
  VALUES (
    p_admin_id,
    v_action,
    'employer',
    p_employer_id::text,
    v_details
  );

  RETURN TRUE;
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_review_employer(uuid, uuid, text, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_review_employer(uuid, uuid, text, text)
  TO service_role;
