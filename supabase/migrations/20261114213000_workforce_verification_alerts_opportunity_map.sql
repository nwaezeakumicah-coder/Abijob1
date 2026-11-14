-- Abijob workforce trust, alerts, and Abia opportunity intelligence.

ALTER TABLE public.professional_profiles
  ADD COLUMN IF NOT EXISTS verification_status text NOT NULL DEFAULT 'unverified'
    CHECK (verification_status IN ('unverified','pending','verified','rejected')),
  ADD COLUMN IF NOT EXISTS verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS verified_by uuid REFERENCES public.platform_admins(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS public.professional_verification_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  credential_type text NOT NULL CHECK (credential_type IN ('government_id','trade_certificate','professional_license','business_registration','other')),
  credential_name text NOT NULL CHECK (char_length(btrim(credential_name)) BETWEEN 3 AND 160),
  document_path text NOT NULL CHECK (char_length(document_path) BETWEEN 5 AND 500),
  notes text CHECK (notes IS NULL OR char_length(notes) <= 1000),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  admin_notes text CHECK (admin_notes IS NULL OR char_length(admin_notes) <= 2000),
  reviewed_by uuid REFERENCES public.platform_admins(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_professional_verification_status_created
  ON public.professional_verification_requests(status, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_professional_verification_one_pending
  ON public.professional_verification_requests(professional_id)
  WHERE status = 'pending';

ALTER TABLE public.professional_verification_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.professional_verification_requests FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON public.professional_verification_requests TO authenticated;
GRANT ALL ON public.professional_verification_requests TO service_role;
CREATE POLICY "Professionals can view own verification requests"
  ON public.professional_verification_requests FOR SELECT TO authenticated
  USING (professional_id = (SELECT auth.uid()));
CREATE POLICY "Professionals can submit own verification requests"
  ON public.professional_verification_requests FOR INSERT TO authenticated
  WITH CHECK (
    professional_id = (SELECT auth.uid())
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.role = 'professional')
    AND status = 'pending' AND reviewed_by IS NULL AND reviewed_at IS NULL AND admin_notes IS NULL
  );

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('abijob-verification-files','abijob-verification-files',false,5242880,
  ARRAY['application/pdf','image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO UPDATE SET public=false,file_size_limit=5242880,allowed_mime_types=EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Professionals upload own verification evidence" ON storage.objects;
CREATE POLICY "Professionals upload own verification evidence"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id='abijob-verification-files'
    AND (storage.foldername(name))[1]=(SELECT auth.uid())::text
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id=(SELECT auth.uid()) AND p.role='professional')
  );
DROP POLICY IF EXISTS "Professionals read own verification evidence" ON storage.objects;
CREATE POLICY "Professionals read own verification evidence"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id='abijob-verification-files' AND (storage.foldername(name))[1]=(SELECT auth.uid())::text);

CREATE OR REPLACE FUNCTION public.admin_review_professional_verification(
  p_admin_id uuid,p_request_id uuid,p_status text,p_admin_notes text DEFAULT NULL
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $function$
DECLARE v_admin public.platform_admins%ROWTYPE; v_request public.professional_verification_requests%ROWTYPE;
BEGIN
  IF p_admin_id IS NULL OR p_request_id IS NULL OR p_status NOT IN ('approved','rejected')
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
  UPDATE public.professional_verification_requests
  SET status=p_status,admin_notes=NULLIF(pg_catalog.btrim(p_admin_notes),''),reviewed_by=p_admin_id,reviewed_at=now()
  WHERE id=p_request_id;
  UPDATE public.professional_profiles
  SET verification_status=CASE WHEN p_status='approved' THEN 'verified' ELSE 'rejected' END,
      verified_at=CASE WHEN p_status='approved' THEN now() ELSE NULL END,
      verified_by=CASE WHEN p_status='approved' THEN p_admin_id ELSE NULL END
  WHERE user_id=v_request.professional_id;
  INSERT INTO public.admin_audit_logs(actor_admin_id,action,entity_type,entity_id,details)
  VALUES (p_admin_id,'professional_verification.'||p_status,'professional_verification_request',p_request_id::text,
    pg_catalog.jsonb_build_object('professional_id',v_request.professional_id,'previous_status',v_request.status,'new_status',p_status));
  RETURN TRUE;
END;
$function$;
REVOKE ALL ON FUNCTION public.admin_review_professional_verification(uuid,uuid,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.admin_review_professional_verification(uuid,uuid,text,text) TO service_role;

CREATE TABLE IF NOT EXISTS public.job_alert_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  categories text[] NOT NULL DEFAULT ARRAY[]::text[],
  locations text[] NOT NULL DEFAULT ARRAY[]::text[],
  is_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT job_alert_categories_limit CHECK (cardinality(categories)<=30),
  CONSTRAINT job_alert_locations_limit CHECK (cardinality(locations)<=17)
);
ALTER TABLE public.job_alert_preferences ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.job_alert_preferences FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.job_alert_preferences TO authenticated;
GRANT ALL ON public.job_alert_preferences TO service_role;
CREATE POLICY "Users manage own job alert preferences" ON public.job_alert_preferences FOR ALL TO authenticated
  USING (user_id=(SELECT auth.uid())) WITH CHECK (user_id=(SELECT auth.uid()));

CREATE OR REPLACE FUNCTION public.notify_matching_job_alerts()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $function$
BEGIN
  IF NEW.status<>'approved' OR (TG_OP='UPDATE' AND OLD.status='approved') THEN RETURN NEW; END IF;
  INSERT INTO public.notifications(user_id,title,description,category,href)
  SELECT preference.user_id,'A new job matches your alert',
    NEW.title||' · '||COALESCE(NEW.location,'Abia State'),'job','/jobs/'||NEW.id::text
  FROM public.job_alert_preferences preference
  WHERE preference.is_enabled=true
    AND (cardinality(preference.categories)=0 OR NEW.category=ANY(preference.categories))
    AND (cardinality(preference.locations)=0 OR EXISTS (
      SELECT 1 FROM unnest(preference.locations) wanted(location_name)
      WHERE NEW.location ILIKE '%'||wanted.location_name||'%'
    ));
  RETURN NEW;
END;
$function$;
DROP TRIGGER IF EXISTS trg_notify_matching_job_alerts ON public.jobs;
CREATE TRIGGER trg_notify_matching_job_alerts AFTER INSERT OR UPDATE OF status ON public.jobs
FOR EACH ROW EXECUTE FUNCTION public.notify_matching_job_alerts();

CREATE OR REPLACE FUNCTION public.get_abia_opportunity_map()
RETURNS TABLE(lga text,approved_jobs bigint,public_professionals bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=''
AS $function$
  WITH lgas(lga) AS (VALUES
    ('Aba North'),('Aba South'),('Arochukwu'),('Bende'),('Ikwuano'),
    ('Isiala Ngwa North'),('Isiala Ngwa South'),('Isuikwuato'),('Obingwa'),
    ('Ohafia'),('Osisioma Ngwa'),('Ugwunagbo'),('Ukwa East'),('Ukwa West'),
    ('Umuahia North'),('Umuahia South'),('Umunneochi'))
  SELECT lgas.lga,
    (SELECT count(*)::bigint FROM public.jobs j WHERE j.status='approved' AND j.location ILIKE '%'||lgas.lga||'%'),
    (SELECT count(*)::bigint FROM public.professional_profiles pp JOIN public.profiles p ON p.id=pp.user_id
      WHERE pp.is_public=true AND (COALESCE(pp.service_area,'') ILIKE '%'||lgas.lga||'%' OR COALESCE(p.location,'') ILIKE '%'||lgas.lga||'%'))
  FROM lgas ORDER BY lgas.lga;
$function$;
REVOKE ALL ON FUNCTION public.get_abia_opportunity_map() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.get_abia_opportunity_map() TO anon,authenticated,service_role;

CREATE OR REPLACE FUNCTION public.submit_job_report(p_job_id uuid,p_reason text,p_details text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $function$
DECLARE v_reporter_id uuid:=auth.uid(); v_job public.jobs%ROWTYPE; v_report_id uuid;
BEGIN
  IF v_reporter_id IS NULL THEN RAISE EXCEPTION 'You must sign in to report a vacancy' USING ERRCODE='42501'; END IF;
  IF p_job_id IS NULL OR p_reason IS NULL
    OR p_reason NOT IN ('fraud','payment_request','misleading','duplicate','expired','other')
    OR p_details IS NULL OR pg_catalog.char_length(pg_catalog.btrim(p_details))<20
    OR pg_catalog.char_length(p_details)>2000 THEN
    RAISE EXCEPTION 'Please provide a valid report and at least 20 characters of details' USING ERRCODE='22023';
  END IF;
  SELECT * INTO v_job FROM public.jobs WHERE id=p_job_id AND status='approved';
  IF NOT FOUND THEN RAISE EXCEPTION 'This vacancy cannot be reported' USING ERRCODE='P0002'; END IF;
  IF v_job.employer_id=v_reporter_id THEN RAISE EXCEPTION 'You cannot report your own vacancy' USING ERRCODE='42501'; END IF;
  INSERT INTO public.job_reports(job_id,reporter_id,reason,details)
  VALUES(p_job_id,v_reporter_id,p_reason,pg_catalog.btrim(p_details)) RETURNING id INTO v_report_id;
  RETURN v_report_id;
EXCEPTION WHEN unique_violation THEN
  RAISE EXCEPTION 'You already have an open report for this vacancy' USING ERRCODE='23505';
END;
$function$;
