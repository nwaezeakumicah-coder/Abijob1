CREATE OR REPLACE FUNCTION public.admin_create_career_event(
 p_admin_id uuid,p_title text,p_description text,p_event_type text,p_starts_at timestamptz,p_ends_at timestamptz,
 p_timezone text,p_venue text,p_meeting_url text,p_capacity integer,p_registration_deadline timestamptz,p_publish boolean DEFAULT false
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $function$
DECLARE v_admin public.platform_admins%ROWTYPE; v_event_id uuid;
BEGIN
 IF p_admin_id IS NULL OR p_title IS NULL OR char_length(btrim(p_title)) NOT BETWEEN 5 AND 160
 OR p_description IS NULL OR char_length(btrim(p_description)) NOT BETWEEN 20 AND 5000
 OR p_event_type NOT IN ('online','in_person','hybrid') OR p_starts_at IS NULL OR p_ends_at IS NULL OR p_ends_at<=p_starts_at
 OR p_timezone IS NULL OR char_length(p_timezone)>80 OR (p_capacity IS NOT NULL AND p_capacity NOT BETWEEN 1 AND 100000)
 OR (p_registration_deadline IS NOT NULL AND p_registration_deadline>p_starts_at)
 OR (p_event_type IN ('online','hybrid') AND (p_meeting_url IS NULL OR p_meeting_url !~ '^https://'))
 OR (p_event_type IN ('in_person','hybrid') AND (p_venue IS NULL OR char_length(btrim(p_venue))<3))
 OR (p_publish AND (p_starts_at<=now() OR (p_registration_deadline IS NOT NULL AND p_registration_deadline<=now()))) THEN
  RAISE EXCEPTION 'Invalid event details or registration window' USING ERRCODE='22023';
 END IF;
 SELECT * INTO v_admin FROM public.platform_admins WHERE id=p_admin_id AND status='active' FOR SHARE;
 IF NOT FOUND OR NOT EXISTS(SELECT 1 FROM public.admin_permissions ap WHERE ap.role=v_admin.role AND ap.permission_key='events.manage') THEN RAISE EXCEPTION 'Active administrator event-management permission required' USING ERRCODE='42501'; END IF;
 INSERT INTO public.career_events(title,description,event_type,starts_at,ends_at,timezone,venue,meeting_url,capacity,registration_deadline,status,created_by,updated_by)
 VALUES(btrim(p_title),btrim(p_description),p_event_type,p_starts_at,p_ends_at,p_timezone,NULLIF(btrim(p_venue),''),NULLIF(btrim(p_meeting_url),''),p_capacity,p_registration_deadline,CASE WHEN p_publish THEN 'published' ELSE 'draft' END,p_admin_id,p_admin_id)
 RETURNING id INTO v_event_id;
 INSERT INTO public.admin_audit_logs(actor_admin_id,action,entity_type,entity_id,details) VALUES(p_admin_id,'career_event.created','career_event',v_event_id::text,jsonb_build_object('title',p_title,'status',CASE WHEN p_publish THEN 'published' ELSE 'draft' END));
 RETURN v_event_id;
END;$function$;
REVOKE ALL ON FUNCTION public.admin_create_career_event(uuid,text,text,text,timestamptz,timestamptz,text,text,text,integer,timestamptz,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.admin_create_career_event(uuid,text,text,text,timestamptz,timestamptz,text,text,text,integer,timestamptz,boolean) TO service_role;