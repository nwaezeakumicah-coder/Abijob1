DROP POLICY IF EXISTS "Users join as themselves" ON public.community_memberships;
CREATE POLICY "Users join active communities as themselves" ON public.community_memberships
FOR INSERT TO authenticated WITH CHECK (
 user_id=(SELECT auth.uid())
 AND EXISTS(SELECT 1 FROM public.career_communities c WHERE c.id=community_memberships.community_id AND c.is_active=true)
);