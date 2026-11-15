-- Privileged event management and community moderation; all actions are audited.
CREATE OR REPLACE FUNCTION public.admin_create_career_event(p_admin_id uuid,p_title text,p_description text,p_event_type text,p_starts_at timestamptz,p_ends_at timestamptz,p_timezone text,p_venue text,p_meeting_url text,p_capacity integer,p_registration_deadline timestamptz,p_publish boolean DEFAULT false)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $function$
DECLARE v_admin public.platform_admins%ROWTYPE; v_event_id uuid;
BEGIN
 IF p_admin_id IS NULL OR p_title IS NULL OR char_length(btrim(p_title)) NOT BETWEEN 5 AND 160 OR p_description IS NULL OR char_length(btrim(p_description)) NOT BETWEEN 20 AND 5000 OR p_event_type NOT IN ('online','in_person','hybrid') OR p_starts_at IS NULL OR p_ends_at IS NULL OR p_ends_at<=p_starts_at OR p_timezone IS NULL OR char_length(p_timezone)>80 OR (p_capacity IS NOT NULL AND p_capacity NOT BETWEEN 1 AND 100000) OR (p_registration_deadline IS NOT NULL AND p_registration_deadline>p_starts_at) OR (p_event_type IN ('online','hybrid') AND (p_meeting_url IS NULL OR p_meeting_url !~ '^https://')) OR (p_event_type IN ('in_person','hybrid') AND (p_venue IS NULL OR char_length(btrim(p_venue))<3)) THEN RAISE EXCEPTION 'Invalid event details' USING ERRCODE='22023'; END IF;
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
CREATE OR REPLACE FUNCTION public.admin_set_career_event_status(p_admin_id uuid,p_event_id uuid,p_status text) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $function$
DECLARE v_admin public.platform_admins%ROWTYPE; v_event public.career_events%ROWTYPE;
BEGIN
 IF p_admin_id IS NULL OR p_event_id IS NULL OR p_status NOT IN ('draft','published','cancelled','completed') THEN RAISE EXCEPTION 'Invalid event status update' USING ERRCODE='22023'; END IF;
 SELECT * INTO v_admin FROM public.platform_admins WHERE id=p_admin_id AND status='active' FOR SHARE;
 IF NOT FOUND OR NOT EXISTS(SELECT 1 FROM public.admin_permissions ap WHERE ap.role=v_admin.role AND ap.permission_key='events.manage') THEN RAISE EXCEPTION 'Active administrator event-management permission required' USING ERRCODE='42501'; END IF;
 SELECT * INTO v_event FROM public.career_events WHERE id=p_event_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Event not found' USING ERRCODE='P0002'; END IF;
 UPDATE public.career_events SET status=p_status,updated_by=p_admin_id,updated_at=now() WHERE id=p_event_id;
 INSERT INTO public.admin_audit_logs(actor_admin_id,action,entity_type,entity_id,details) VALUES(p_admin_id,'career_event.status_changed','career_event',p_event_id::text,jsonb_build_object('from',v_event.status,'to',p_status));
 RETURN TRUE;
END;$function$;
REVOKE ALL ON FUNCTION public.admin_set_career_event_status(uuid,uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_career_event_status(uuid,uuid,text) TO service_role;
CREATE OR REPLACE FUNCTION public.admin_mark_career_event_attendance(p_admin_id uuid,p_registration_id uuid,p_status text) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $function$
DECLARE v_admin public.platform_admins%ROWTYPE; v_registration public.career_event_registrations%ROWTYPE;
BEGIN
 IF p_admin_id IS NULL OR p_registration_id IS NULL OR p_status NOT IN ('attended','no_show') THEN RAISE EXCEPTION 'Invalid attendance update' USING ERRCODE='22023'; END IF;
 SELECT * INTO v_admin FROM public.platform_admins WHERE id=p_admin_id AND status='active' FOR SHARE;
 IF NOT FOUND OR NOT EXISTS(SELECT 1 FROM public.admin_permissions ap WHERE ap.role=v_admin.role AND ap.permission_key='events.manage') THEN RAISE EXCEPTION 'Active administrator event-management permission required' USING ERRCODE='42501'; END IF;
 SELECT * INTO v_registration FROM public.career_event_registrations WHERE id=p_registration_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Registration not found' USING ERRCODE='P0002'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.career_events e WHERE e.id=v_registration.event_id AND e.ends_at<=now()) THEN RAISE EXCEPTION 'Attendance can only be recorded after the event ends' USING ERRCODE='22023'; END IF;
 UPDATE public.career_event_registrations SET status=p_status,updated_at=now() WHERE id=p_registration_id AND status IN ('registered','attended','no_show');
 INSERT INTO public.admin_audit_logs(actor_admin_id,action,entity_type,entity_id,details) VALUES(p_admin_id,'career_event.attendance_recorded','career_event_registration',p_registration_id::text,jsonb_build_object('from',v_registration.status,'to',p_status));
 RETURN TRUE;
END;$function$;
REVOKE ALL ON FUNCTION public.admin_mark_career_event_attendance(uuid,uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.admin_mark_career_event_attendance(uuid,uuid,text) TO service_role;
CREATE OR REPLACE FUNCTION public.admin_review_community_report(p_admin_id uuid,p_report_id uuid,p_status text,p_hide_content boolean DEFAULT false) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $function$
DECLARE v_admin public.platform_admins%ROWTYPE; v_report public.community_content_reports%ROWTYPE;
BEGIN
 IF p_admin_id IS NULL OR p_report_id IS NULL OR p_status NOT IN ('reviewing','resolved','dismissed') THEN RAISE EXCEPTION 'Invalid community report review' USING ERRCODE='22023'; END IF;
 SELECT * INTO v_admin FROM public.platform_admins WHERE id=p_admin_id AND status='active' FOR SHARE;
 IF NOT FOUND OR NOT EXISTS(SELECT 1 FROM public.admin_permissions ap WHERE ap.role=v_admin.role AND ap.permission_key IN ('communities.manage','content.review')) THEN RAISE EXCEPTION 'Active administrator community-moderation permission required' USING ERRCODE='42501'; END IF;
 SELECT * INTO v_report FROM public.community_content_reports WHERE id=p_report_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Community report not found' USING ERRCODE='P0002'; END IF;
 UPDATE public.community_content_reports SET status=p_status,reviewed_by=p_admin_id,reviewed_at=now() WHERE id=p_report_id;
 IF p_hide_content AND p_status='resolved' THEN
  IF v_report.post_id IS NOT NULL THEN UPDATE public.community_posts SET status='hidden',updated_at=now() WHERE id=v_report.post_id; END IF;
  IF v_report.comment_id IS NOT NULL THEN UPDATE public.community_comments SET status='hidden' WHERE id=v_report.comment_id; END IF;
 END IF;
 INSERT INTO public.admin_audit_logs(actor_admin_id,action,entity_type,entity_id,details) VALUES(p_admin_id,'community_report.'||p_status,'community_content_report',p_report_id::text,jsonb_build_object('hide_content',p_hide_content,'post_id',v_report.post_id,'comment_id',v_report.comment_id));
 RETURN TRUE;
END;$function$;
REVOKE ALL ON FUNCTION public.admin_review_community_report(uuid,uuid,text,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.admin_review_community_report(uuid,uuid,text,boolean) TO service_role;
INSERT INTO public.admin_permissions(role,permission_key,description) VALUES
('super_admin','events.manage','Create, publish, update and manage career events and registrations'),
('admin','events.manage','Create, publish, update and manage career events and registrations'),
('super_admin','communities.manage','Manage career communities and moderate community content'),
('admin','communities.manage','Manage career communities and moderate community content'),
('moderator','communities.manage','Moderate community content and manage reports')
ON CONFLICT(role,permission_key) DO NOTHING;
