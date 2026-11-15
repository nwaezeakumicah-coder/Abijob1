REVOKE UPDATE ON public.community_posts,public.community_comments FROM authenticated;
DROP POLICY IF EXISTS "Authors edit own published posts" ON public.community_posts;
DROP POLICY IF EXISTS "Authors edit own published comments" ON public.community_comments;
DROP POLICY IF EXISTS "Signed-in users view published community posts" ON public.community_posts;
CREATE POLICY "Signed-in users view active published community posts" ON public.community_posts
 FOR SELECT TO authenticated USING(status='published' AND EXISTS(SELECT 1 FROM public.career_communities c WHERE c.id=community_posts.community_id AND c.is_active=true));
DROP POLICY IF EXISTS "Community members publish posts" ON public.community_posts;
CREATE POLICY "Community members publish posts" ON public.community_posts FOR INSERT TO authenticated WITH CHECK(
 author_id=(SELECT auth.uid()) AND status='published' AND EXISTS(
  SELECT 1 FROM public.community_memberships m JOIN public.career_communities c ON c.id=m.community_id
  WHERE m.community_id=community_posts.community_id AND m.user_id=(SELECT auth.uid()) AND c.is_active=true));
DROP POLICY IF EXISTS "Signed-in users view published comments" ON public.community_comments;
CREATE POLICY "Signed-in users view comments on active published posts" ON public.community_comments
 FOR SELECT TO authenticated USING(status='published' AND EXISTS(
  SELECT 1 FROM public.community_posts p JOIN public.career_communities c ON c.id=p.community_id
  WHERE p.id=community_comments.post_id AND p.status='published' AND c.is_active=true));
DROP POLICY IF EXISTS "Community members comment" ON public.community_comments;
CREATE POLICY "Community members comment" ON public.community_comments FOR INSERT TO authenticated WITH CHECK(
 author_id=(SELECT auth.uid()) AND status='published' AND EXISTS(
  SELECT 1 FROM public.community_posts p JOIN public.community_memberships m ON m.community_id=p.community_id
  JOIN public.career_communities c ON c.id=p.community_id
  WHERE p.id=community_comments.post_id AND p.status='published' AND m.user_id=(SELECT auth.uid()) AND c.is_active=true));