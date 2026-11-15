CREATE OR REPLACE FUNCTION public.get_community_posts(p_community_id uuid)
RETURNS TABLE(id uuid,community_id uuid,author_id uuid,author_name text,title text,body text,created_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=''
AS $function$
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in required' USING ERRCODE='42501'; END IF;
 IF p_community_id IS NULL THEN RAISE EXCEPTION 'Select a valid community' USING ERRCODE='22023'; END IF;
 RETURN QUERY SELECT post.id,post.community_id,post.author_id,COALESCE(NULLIF(btrim(profile.full_name),''),'Abijob member'),post.title,post.body,post.created_at
 FROM public.community_posts post JOIN public.career_communities community ON community.id=post.community_id
 JOIN public.profiles profile ON profile.id=post.author_id
 WHERE post.community_id=p_community_id AND post.status='published' AND community.is_active=true
 ORDER BY post.created_at DESC LIMIT 50;
END;$function$;
REVOKE ALL ON FUNCTION public.get_community_posts(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_community_posts(uuid) TO authenticated;
CREATE OR REPLACE FUNCTION public.get_community_comments(p_community_id uuid)
RETURNS TABLE(id uuid,post_id uuid,author_id uuid,author_name text,body text,created_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=''
AS $function$
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in required' USING ERRCODE='42501'; END IF;
 IF p_community_id IS NULL THEN RAISE EXCEPTION 'Select a valid community' USING ERRCODE='22023'; END IF;
 RETURN QUERY SELECT comment.id,comment.post_id,comment.author_id,COALESCE(NULLIF(btrim(profile.full_name),''),'Abijob member'),comment.body,comment.created_at
 FROM public.community_comments comment JOIN public.community_posts post ON post.id=comment.post_id
 JOIN public.career_communities community ON community.id=post.community_id JOIN public.profiles profile ON profile.id=comment.author_id
 WHERE post.community_id=p_community_id AND post.status='published' AND comment.status='published' AND community.is_active=true
 ORDER BY comment.created_at ASC;
END;$function$;
REVOKE ALL ON FUNCTION public.get_community_comments(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_community_comments(uuid) TO authenticated;