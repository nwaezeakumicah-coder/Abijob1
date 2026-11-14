CREATE OR REPLACE FUNCTION public.admin_review_job_report(
  p_admin_id uuid,p_report_id uuid,p_status text,p_admin_notes text DEFAULT NULL
)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $function$
DECLARE v_admin public.platform_admins%ROWTYPE; v_report public.job_reports%ROWTYPE;
BEGIN
  IF p_admin_id IS NULL OR p_report_id IS NULL OR p_status IS NULL
     OR p_status NOT IN ('in_review','resolved','dismissed')
     OR (p_admin_notes IS NOT NULL AND pg_catalog.char_length(p_admin_notes)>2000) THEN
    RAISE EXCEPTION 'Invalid report review request' USING ERRCODE='22023';
  END IF;
  SELECT * INTO v_admin FROM public.platform_admins WHERE id=p_admin_id AND status='active' FOR SHARE;
  IF NOT FOUND OR NOT EXISTS (
    SELECT 1 FROM public.admin_permissions permission
    WHERE permission.role=v_admin.role AND permission.permission_key IN ('jobs.review','jobs.manage','support.manage')
  ) THEN RAISE EXCEPTION 'Active administrator review permission required' USING ERRCODE='42501'; END IF;
  SELECT * INTO v_report FROM public.job_reports WHERE id=p_report_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Report not found' USING ERRCODE='P0002'; END IF;
  UPDATE public.job_reports SET status=p_status,
    reviewed_at=CASE WHEN p_status IN ('resolved','dismissed') THEN now() ELSE reviewed_at END,
    reviewed_by=p_admin_id,admin_notes=NULLIF(pg_catalog.btrim(p_admin_notes),'')
  WHERE id=p_report_id;
  INSERT INTO public.admin_audit_logs(actor_admin_id,action,entity_type,entity_id,details)
  VALUES(p_admin_id,'job_report.'||p_status,'job_report',p_report_id::text,
    pg_catalog.jsonb_build_object('job_id',v_report.job_id,'previous_status',v_report.status,'new_status',p_status,'reason',v_report.reason));
  RETURN TRUE;
END;
$function$;
