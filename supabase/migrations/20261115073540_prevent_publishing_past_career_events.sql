CREATE OR REPLACE FUNCTION public.admin_set_career_event_status(p_admin_id uuid,p_event_id uuid,p_status text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $function$
DECLARE v_admin public.platform_admins%ROWTYPE; v_event public.career_events%ROWTYPE;
BEGIN
 IF p_admin_id IS NULL OR p_event_id IS NULL OR p_status NOT IN ('draft','published','cancelled','completed') THEN RAISE EXCEPTION 'Invalid event status update' USING ERRCODE='22023'; END IF;
 SELECT * INTO v_admin FROM public.platform_admins WHERE id=p_admin_id AND status='active' FOR SHARE;
 IF NOT FOUND OR NOT EXISTS(SELECT 1 FROM public.admin_permissions ap WHERE ap.role=v_admin.role AND ap.permission_key='events.manage') THEN RAISE EXCEPTION 'Active administrator event-management permission required' USING ERRCODE='42501'; END IF;
 SELECT * INTO v_event FROM public.career_events WHERE id=p_event_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Event not found' USING ERRCODE='P0002'; END IF;
 IF p_status='published' AND (v_event.starts_at<=now() OR (v_event.registration_deadline IS NOT NULL AND v_event.registration_deadline<=now())) THEN RAISE EXCEPTION 'A past event or an event with a closed registration deadline cannot be published' USING ERRCODE='22023'; END IF;
 UPDATE public.career_events SET status=p_status,updated_by=p_admin_id,updated_at=now() WHERE id=p_event_id;
 INSERT INTO public.admin_audit_logs(actor_admin_id,action,entity_type,entity_id,details) VALUES(p_admin_id,'career_event.status_changed','career_event',p_event_id::text,jsonb_build_object('from',v_event.status,'to',p_status));
 RETURN TRUE;
END;$function$;
REVOKE ALL ON FUNCTION public.admin_set_career_event_status(uuid,uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_career_event_status(uuid,uuid,text) TO service_role;