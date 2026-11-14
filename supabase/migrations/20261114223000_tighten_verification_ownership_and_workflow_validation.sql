-- Tighten ownership validation on verification evidence and reject null workflow states.
DROP POLICY IF EXISTS "Professionals can submit own verification requests" ON public.professional_verification_requests;
CREATE POLICY "Professionals can submit own verification requests"
  ON public.professional_verification_requests FOR INSERT TO authenticated
  WITH CHECK (
    professional_id=(SELECT auth.uid())
    AND document_path LIKE (SELECT auth.uid())::text || '/%'
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id=(SELECT auth.uid()) AND p.role='professional')
    AND status='pending' AND reviewed_by IS NULL AND reviewed_at IS NULL AND admin_notes IS NULL
  );

CREATE OR REPLACE FUNCTION public.respond_to_interview(p_interview_id uuid,p_response text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $function$
DECLARE v_user_id uuid:=auth.uid(); v_interview public.interviews%ROWTYPE;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Sign in to respond to this interview' USING ERRCODE='42501'; END IF;
  IF p_interview_id IS NULL OR p_response IS NULL OR p_response NOT IN ('accepted','declined') THEN
    RAISE EXCEPTION 'Invalid interview response' USING ERRCODE='22023';
  END IF;
  SELECT * INTO v_interview FROM public.interviews WHERE id=p_interview_id AND applicant_id=v_user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Interview invitation not found' USING ERRCODE='P0002'; END IF;
  IF v_interview.status NOT IN ('scheduled','rescheduled') THEN
    RAISE EXCEPTION 'This interview invitation can no longer be answered' USING ERRCODE='55000';
  END IF;
  UPDATE public.interviews SET status=p_response,updated_at=now() WHERE id=p_interview_id;
  RETURN TRUE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_review_professional_verification(
  p_admin_id uuid,p_request_id uuid,p_status text,p_admin_notes text DEFAULT NULL
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $function$
DECLARE v_admin public.platform_admins%ROWTYPE; v_request public.professional_verification_requests%ROWTYPE;
BEGIN
  IF p_admin_id IS NULL OR p_request_id IS NULL OR p_status IS NULL OR p_status NOT IN ('approved','rejected')
     OR (p_admin_notes IS NOT NULL AND pg_catalog.char_length(p_admin_notes)>2000) THEN
    RAISE EXCEPTION 'Invalid professional verification review request' USING ERRCODE='22023';
  END IF;
  SELECT * INTO v_admin FROM public.platform_admins WHERE id=p_admin_id AND status='active' FOR SHARE;
  IF NOT FOUND OR NOT EXISTS (
    SELECT 1 FROM public.admin_permissions permission
    WHERE permission.role=v_admin.role AND permission.permission_key IN ('verifications.review','verifications.manage')
  ) THEN RAISE EXCEPTION 'Active administrator verification permission required' USING ERRCODE='42501'; END IF;
  SELECT * INTO v_request FROM public.professional_verification_requests WHERE id=p_request_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Verification request not found' USING ERRCODE='P0002'; END IF;
  UPDATE public.professional_verification_requests SET status=p_status,admin_notes=NULLIF(pg_catalog.btrim(p_admin_notes),''),reviewed_by=p_admin_id,reviewed_at=now() WHERE id=p_request_id;
  UPDATE public.professional_profiles SET verification_status=CASE WHEN p_status='approved' THEN 'verified' ELSE 'rejected' END,
    verified_at=CASE WHEN p_status='approved' THEN now() ELSE NULL END,
    verified_by=CASE WHEN p_status='approved' THEN p_admin_id ELSE NULL END
  WHERE user_id=v_request.professional_id;
  INSERT INTO public.admin_audit_logs(actor_admin_id,action,entity_type,entity_id,details)
  VALUES(p_admin_id,'professional_verification.'||p_status,'professional_verification_request',p_request_id::text,
    pg_catalog.jsonb_build_object('professional_id',v_request.professional_id,'previous_status',v_request.status,'new_status',p_status));
  RETURN TRUE;
END;
$function$;
