-- Database-backed professional communities and career events.
CREATE TABLE IF NOT EXISTS public.career_communities (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 slug text NOT NULL UNIQUE CHECK(slug ~ '^[a-z0-9-]{3,60}$'),
 name text NOT NULL CHECK(char_length(btrim(name)) BETWEEN 3 AND 100),
 description text NOT NULL CHECK(char_length(btrim(description)) BETWEEN 10 AND 500),
 category text NOT NULL CHECK(category IN ('technology','creative','business','trades','education')),
 guidelines text NOT NULL DEFAULT 'Be respectful. Share useful knowledge. Do not post spam, scams, harassment, personal data or misleading opportunities.',
 is_active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.career_communities(slug,name,description,category) VALUES
('technology-digital-skills','Technology & Digital Skills','For developers, designers, IT learners and people building digital careers. Share projects, learning resources and practical questions.','technology'),
('fashion-creative-design','Fashion & Creative Design','A space for fashion designers, tailors, printers, photographers and other creative professionals to exchange ideas and showcase work.','creative'),
('business-entrepreneurship','Business & Entrepreneurship','For business owners, founders and aspiring entrepreneurs to discuss customers, branding, pricing and sustainable growth.','business'),
('skilled-professionals-artisans','Skilled Professionals & Artisans','For artisans, technicians and service professionals to exchange practical knowledge and build trusted connections.','trades'),
('education-career-development','Education & Career Development','Discuss scholarships, training, career decisions, professional development and learning opportunities.','education')
ON CONFLICT(slug) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.community_memberships (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), community_id uuid NOT NULL REFERENCES public.career_communities(id) ON DELETE CASCADE,
 user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, joined_at timestamptz NOT NULL DEFAULT now(), UNIQUE(community_id,user_id)
);
CREATE INDEX IF NOT EXISTS idx_community_memberships_user ON public.community_memberships(user_id,joined_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_memberships_community ON public.community_memberships(community_id,joined_at DESC);
CREATE TABLE IF NOT EXISTS public.community_posts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), community_id uuid NOT NULL REFERENCES public.career_communities(id) ON DELETE CASCADE,
 author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 title text NOT NULL CHECK(char_length(btrim(title)) BETWEEN 5 AND 160),
 body text NOT NULL CHECK(char_length(btrim(body)) BETWEEN 10 AND 5000),
 status text NOT NULL DEFAULT 'published' CHECK(status IN ('published','hidden')),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_community_posts_feed ON public.community_posts(community_id,status,created_at DESC);
CREATE TABLE IF NOT EXISTS public.community_comments (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), post_id uuid NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
 author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 body text NOT NULL CHECK(char_length(btrim(body)) BETWEEN 2 AND 2000),
 status text NOT NULL DEFAULT 'published' CHECK(status IN ('published','hidden')), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_community_comments_post ON public.community_comments(post_id,status,created_at ASC);
CREATE TABLE IF NOT EXISTS public.community_content_reports (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), reporter_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 post_id uuid REFERENCES public.community_posts(id) ON DELETE CASCADE,
 comment_id uuid REFERENCES public.community_comments(id) ON DELETE CASCADE,
 reason text NOT NULL CHECK(reason IN ('spam','harassment','scam','misinformation','inappropriate','other')),
 details text CHECK(details IS NULL OR char_length(details)<=1500),
 status text NOT NULL DEFAULT 'open' CHECK(status IN ('open','reviewing','resolved','dismissed')),
 reviewed_by uuid REFERENCES public.platform_admins(id) ON DELETE SET NULL, reviewed_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT community_report_one_target CHECK(((post_id IS NOT NULL)::int+(comment_id IS NOT NULL)::int)=1)
);
CREATE INDEX IF NOT EXISTS idx_community_reports_status ON public.community_content_reports(status,created_at DESC);

CREATE TABLE IF NOT EXISTS public.career_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title text NOT NULL CHECK(char_length(btrim(title)) BETWEEN 5 AND 160),
 description text NOT NULL CHECK(char_length(btrim(description)) BETWEEN 20 AND 5000),
 event_type text NOT NULL CHECK(event_type IN ('online','in_person','hybrid')),
 starts_at timestamptz NOT NULL, ends_at timestamptz NOT NULL, timezone text NOT NULL DEFAULT 'Africa/Lagos',
 venue text, meeting_url text, capacity integer CHECK(capacity IS NULL OR capacity BETWEEN 1 AND 100000),
 registration_deadline timestamptz, status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published','cancelled','completed')),
 created_by uuid NOT NULL REFERENCES public.platform_admins(id) ON DELETE RESTRICT,
 updated_by uuid REFERENCES public.platform_admins(id) ON DELETE SET NULL, created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(), CONSTRAINT career_event_valid_period CHECK(ends_at>starts_at),
 CONSTRAINT career_event_location_required CHECK(
 (event_type='online' AND meeting_url IS NOT NULL AND meeting_url ~ '^https://')
 OR (event_type='in_person' AND venue IS NOT NULL AND char_length(btrim(venue))>=3)
 OR (event_type='hybrid' AND venue IS NOT NULL AND char_length(btrim(venue))>=3 AND meeting_url IS NOT NULL AND meeting_url ~ '^https://')
 )
);
CREATE INDEX IF NOT EXISTS idx_career_events_public ON public.career_events(status,starts_at ASC);
CREATE TABLE IF NOT EXISTS public.career_event_registrations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), event_id uuid NOT NULL REFERENCES public.career_events(id) ON DELETE CASCADE,
 user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 status text NOT NULL DEFAULT 'registered' CHECK(status IN ('registered','cancelled','attended','no_show')),
 registered_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(event_id,user_id)
);
CREATE INDEX IF NOT EXISTS idx_event_registrations_event ON public.career_event_registrations(event_id,status);
CREATE INDEX IF NOT EXISTS idx_event_registrations_user ON public.career_event_registrations(user_id,status);

ALTER TABLE public.career_communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_content_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_event_registrations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.career_communities,public.community_memberships,public.community_posts,public.community_comments,public.community_content_reports,public.career_events,public.career_event_registrations FROM PUBLIC,anon;
GRANT SELECT ON public.career_communities TO authenticated;
GRANT SELECT,INSERT,DELETE ON public.community_memberships TO authenticated;
GRANT SELECT,INSERT,UPDATE ON public.community_posts TO authenticated;
GRANT SELECT,INSERT,UPDATE ON public.community_comments TO authenticated;
GRANT SELECT,INSERT ON public.community_content_reports TO authenticated;
GRANT SELECT ON public.career_events TO authenticated;
GRANT SELECT ON public.career_event_registrations TO authenticated;
GRANT ALL ON public.career_communities,public.community_memberships,public.community_posts,public.community_comments,public.community_content_reports,public.career_events,public.career_event_registrations TO service_role;
CREATE POLICY "Signed-in users view active communities" ON public.career_communities FOR SELECT TO authenticated USING(is_active=true);
CREATE POLICY "Members view membership directory" ON public.community_memberships FOR SELECT TO authenticated USING(true);
CREATE POLICY "Users join as themselves" ON public.community_memberships FOR INSERT TO authenticated WITH CHECK(user_id=(SELECT auth.uid()));
CREATE POLICY "Users leave their own communities" ON public.community_memberships FOR DELETE TO authenticated USING(user_id=(SELECT auth.uid()));
CREATE POLICY "Signed-in users view published community posts" ON public.community_posts FOR SELECT TO authenticated USING(status='published');
CREATE POLICY "Community members publish posts" ON public.community_posts FOR INSERT TO authenticated WITH CHECK(author_id=(SELECT auth.uid()) AND status='published' AND EXISTS(SELECT 1 FROM public.community_memberships m WHERE m.community_id=community_id AND m.user_id=(SELECT auth.uid())));
CREATE POLICY "Authors edit own published posts" ON public.community_posts FOR UPDATE TO authenticated USING(author_id=(SELECT auth.uid()) AND status='published') WITH CHECK(author_id=(SELECT auth.uid()) AND status='published');
CREATE POLICY "Signed-in users view published comments" ON public.community_comments FOR SELECT TO authenticated USING(status='published');
CREATE POLICY "Community members comment" ON public.community_comments FOR INSERT TO authenticated WITH CHECK(author_id=(SELECT auth.uid()) AND status='published' AND EXISTS(SELECT 1 FROM public.community_posts p JOIN public.community_memberships m ON m.community_id=p.community_id WHERE p.id=post_id AND p.status='published' AND m.user_id=(SELECT auth.uid())));
CREATE POLICY "Authors edit own published comments" ON public.community_comments FOR UPDATE TO authenticated USING(author_id=(SELECT auth.uid()) AND status='published') WITH CHECK(author_id=(SELECT auth.uid()) AND status='published');
CREATE POLICY "Users submit community reports" ON public.community_content_reports FOR INSERT TO authenticated WITH CHECK(reporter_id=(SELECT auth.uid()) AND status='open' AND reviewed_by IS NULL AND reviewed_at IS NULL AND ((post_id IS NOT NULL AND EXISTS(SELECT 1 FROM public.community_posts p WHERE p.id=post_id AND p.author_id<>(SELECT auth.uid()))) OR (comment_id IS NOT NULL AND EXISTS(SELECT 1 FROM public.community_comments c WHERE c.id=comment_id AND c.author_id<>(SELECT auth.uid())))));
CREATE POLICY "Users view own community reports" ON public.community_content_reports FOR SELECT TO authenticated USING(reporter_id=(SELECT auth.uid()));
CREATE POLICY "Signed-in users view published events" ON public.career_events FOR SELECT TO authenticated USING(status='published');
CREATE POLICY "Users view own event registrations" ON public.career_event_registrations FOR SELECT TO authenticated USING(user_id=(SELECT auth.uid()));

CREATE OR REPLACE FUNCTION public.register_for_career_event(p_event_id uuid) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $function$
DECLARE v_user_id uuid:=auth.uid(); v_event public.career_events%ROWTYPE; v_registration_id uuid; v_count bigint;
BEGIN
 IF v_user_id IS NULL OR p_event_id IS NULL THEN RAISE EXCEPTION 'Sign in and select a valid event' USING ERRCODE='42501'; END IF;
 SELECT * INTO v_event FROM public.career_events WHERE id=p_event_id FOR UPDATE;
 IF NOT FOUND OR v_event.status<>'published' THEN RAISE EXCEPTION 'This event is not open for registration' USING ERRCODE='P0002'; END IF;
 IF v_event.starts_at<=now() OR (v_event.registration_deadline IS NOT NULL AND v_event.registration_deadline<=now()) THEN RAISE EXCEPTION 'Registration for this event has closed' USING ERRCODE='22023'; END IF;
 SELECT count(*) INTO v_count FROM public.career_event_registrations WHERE event_id=p_event_id AND status IN ('registered','attended');
 IF v_event.capacity IS NOT NULL AND v_count>=v_event.capacity AND NOT EXISTS(SELECT 1 FROM public.career_event_registrations WHERE event_id=p_event_id AND user_id=v_user_id AND status='registered') THEN RAISE EXCEPTION 'This event has reached its registration capacity' USING ERRCODE='23514'; END IF;
 INSERT INTO public.career_event_registrations(event_id,user_id,status) VALUES(p_event_id,v_user_id,'registered')
 ON CONFLICT(event_id,user_id) DO UPDATE SET status='registered',registered_at=now(),updated_at=now() RETURNING id INTO v_registration_id;
 RETURN v_registration_id;
END;$function$;
REVOKE ALL ON FUNCTION public.register_for_career_event(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.register_for_career_event(uuid) TO authenticated;
CREATE OR REPLACE FUNCTION public.cancel_career_event_registration(p_event_id uuid) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $function$
DECLARE v_user_id uuid:=auth.uid(); v_updated integer;
BEGIN
 IF v_user_id IS NULL OR p_event_id IS NULL THEN RAISE EXCEPTION 'Sign in and select a valid event' USING ERRCODE='42501'; END IF;
 UPDATE public.career_event_registrations SET status='cancelled',updated_at=now() WHERE event_id=p_event_id AND user_id=v_user_id AND status='registered';
 GET DIAGNOSTICS v_updated=ROW_COUNT; RETURN v_updated=1;
END;$function$;
REVOKE ALL ON FUNCTION public.cancel_career_event_registration(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.cancel_career_event_registration(uuid) TO authenticated;
