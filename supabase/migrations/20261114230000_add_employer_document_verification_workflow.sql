-- Employer evidence-based verification workflow.
CREATE TABLE IF NOT EXISTS public.employer_verification_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  document_type text NOT NULL CHECK (document_type IN ('cac_certificate','tax_document','business_address','government_id','other')),
  document_name text NOT NULL CHECK (char_length(btrim(document_name)) BETWEEN 3 AND 160),
  document_path text NOT NULL CHECK (char_length(document_path) BETWEEN 5 AND 500),
  notes text CHECK (notes IS NULL OR char_length(notes)<=1000),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  admin_notes text CHECK (admin_notes IS NULL OR char_length(admin_notes)<=2000),
  reviewed_by uuid REFERENCES public.platform_admins(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_employer_verification_status_created
  ON public.employer_verification_requests(status,created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_employer_verification_one_pending
  ON public.employer_verification_requests(employer_id) WHERE status='pending';

ALTER TABLE public.employer_verification_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.employer_verification_requests FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT ON public.employer_verification_requests TO authenticated;
GRANT ALL ON public.employer_verification_requests TO service_role;
CREATE POLICY "Employers can view own verification requests"
  ON public.employer_verification_requests FOR SELECT TO authenticated
  USING (employer_id=(SELECT auth.uid()));
CREATE POLICY "Employers can submit own verification requests"
  ON public.employer_verification_requests FOR INSERT TO authenticated
  WITH CHECK (
    employer_id=(SELECT auth.uid())
    AND document_path LIKE (SELECT auth.uid())::text || '/%'
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id=(SELECT auth.uid()) AND p.role='employer')
    AND status='pending' AND reviewed_by IS NULL AND reviewed_at IS NULL AND admin_notes IS NULL
  );

DROP POLICY IF EXISTS "Employers upload own verification evidence" ON storage.objects;
CREATE POLICY "Employers upload own verification evidence"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id='abijob-verification-files'
    AND (storage.foldername(name))[1]=(SELECT auth.uid())::text
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id=(SELECT auth.uid()) AND p.role='employer')
  );
DROP POLICY IF EXISTS "Employers read own verification evidence" ON storage.objects;
CREATE POLICY "Employers read own verification evidence"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id='abijob-verification-files' AND (storage.foldername(name))[1]=(SELECT auth.uid())::text);

CREATE OR REPLACE FUNCTION public.admin_review_employer_verification(
  p_admin_id uuid,p_request_id uuid,p_status text,p_admin_notes text DEFAULT NULL
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $function$
DECLARE v_admin public.platform_admins%ROWTYPE; v_request public.employer_verification_requests%ROWTYPE;
BEGIN
  IF p_admin_id IS NULL OR p_request_id IS NULL OR p_status IS NULL OR p_status NOT IN ('approved','rejected')
     OR (p_admin_notes IS NOT NULL AND pg_catalog.char_length(p_admin_notes)>2000) THEN
    RAISE EXCEPTION 'Invalid employer verification review request' USING ERRCODE='22023';
  END IF;
  SELECT * INTO v_admin FROM public.platform_admins WHERE id=p_admin_id AND status='active' FOR SHARE;
  IF NOT FOUND OR NOT EXISTS (
    SELECT 1 FROM public.admin_permissions permission
    WHERE permission.role=v_admin.role AND permission.permission_key IN ('verifications.review','verifications.manage','employers.manage')
  ) THEN RAISE EXCEPTION 'Active administrator verification permission required' USING ERRCODE='42501'; END IF;
  SELECT * INTO v_request FROM public.employer_verification_requests WHERE id=p_request_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Verification request not found' USING ERRCODE='P0002'; END IF;
  UPDATE public.employer_verification_requests SET status=p_status,admin_notes=NULLIF(pg_catalog.btrim(p_admin_notes),''),reviewed_by=p_admin_id,reviewed_at=now() WHERE id=p_request_id;
  UPDATE public.employer_profiles SET verification_status=p_status,
    verified_at=CASE WHEN p_status='approved' THEN now() ELSE NULL END,
    verified_by=CASE WHEN p_status='approved' THEN p_admin_id ELSE NULL END
  WHERE user_id=v_request.employer_id;
  INSERT INTO public.admin_audit_logs(actor_admin_id,action,entity_type,entity_id,details)
  VALUES(p_admin_id,'employer_verification.'||p_status,'employer_verification_request',p_request_id::text,
    pg_catalog.jsonb_build_object('employer_id',v_request.employer_id,'previous_status',v_request.status,'new_status',p_status));
  RETURN TRUE;
END;
$function$;
REVOKE ALL ON FUNCTION public.admin_review_employer_verification(uuid,uuid,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.admin_review_employer_verification(uuid,uuid,text,text) TO service_role;
