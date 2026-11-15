-- Restrict membership visibility and event meeting-link access.
DROP POLICY IF EXISTS "Members view membership directory" ON public.community_memberships;
CREATE POLICY "Users view their own community memberships" ON public.community_memberships FOR SELECT TO authenticated USING(user_id=(SELECT auth.uid()));
DROP POLICY IF EXISTS "Community members publish posts" ON public.community_posts;
CREATE POLICY "Community members publish posts" ON public.community_posts FOR INSERT TO authenticated WITH CHECK(author_id=(SELECT auth.uid()) AND status='published' AND EXISTS(SELECT 1 FROM public.community_memberships m WHERE m.community_id=community_posts.community_id AND m.user_id=(SELECT auth.uid())));
REVOKE SELECT ON public.career_events FROM authenticated;
GRANT SELECT(id,title,description,event_type,starts_at,ends_at,timezone,venue,capacity,registration_deadline,status,created_at) ON public.career_events TO authenticated;
CREATE OR REPLACE FUNCTION public.get_career_community_directory()
RETURNS TABLE(id uuid,slug text,name text,description text,category text,member_count bigint,is_member boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=''
AS $function$
 SELECT c.id,c.slug,c.name,c.description,c.category,
 (SELECT count(*)::bigint FROM public.community_memberships m WHERE m.community_id=c.id),
 EXISTS(SELECT 1 FROM public.community_memberships mine WHERE mine.community_id=c.id AND mine.user_id=auth.uid())
 FROM public.career_communities c WHERE c.is_active=true ORDER BY c.name;
$function$;
REVOKE ALL ON FUNCTION public.get_career_community_directory() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_career_community_directory() TO authenticated;
CREATE OR REPLACE FUNCTION public.get_public_career_events()
RETURNS TABLE(id uuid,title text,description text,event_type text,starts_at timestamptz,ends_at timestamptz,timezone text,venue text,capacity integer,registration_deadline timestamptz,registered_count bigint,is_registered boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=''
AS $function$
 SELECT e.id,e.title,e.description,e.event_type,e.starts_at,e.ends_at,e.timezone,e.venue,e.capacity,e.registration_deadline,
 (SELECT count(*)::bigint FROM public.career_event_registrations r WHERE r.event_id=e.id AND r.status IN ('registered','attended')),
 EXISTS(SELECT 1 FROM public.career_event_registrations mine WHERE mine.event_id=e.id AND mine.user_id=auth.uid() AND mine.status='registered')
 FROM public.career_events e WHERE e.status='published' AND e.ends_at>now() ORDER BY e.starts_at ASC;
$function$;
REVOKE ALL ON FUNCTION public.get_public_career_events() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_public_career_events() TO authenticated;
CREATE OR REPLACE FUNCTION public.get_registered_career_event_meeting_link(p_event_id uuid) RETURNS text LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=''
AS $function$
DECLARE v_link text;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in required' USING ERRCODE='42501'; END IF;
 SELECT e.meeting_url INTO v_link FROM public.career_events e JOIN public.career_event_registrations r ON r.event_id=e.id
 WHERE e.id=p_event_id AND r.user_id=auth.uid() AND r.status='registered' AND e.status='published';
 RETURN v_link;
END;$function$;
REVOKE ALL ON FUNCTION public.get_registered_career_event_meeting_link(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_registered_career_event_meeting_link(uuid) TO authenticated;
