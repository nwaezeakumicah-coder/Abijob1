DROP FUNCTION IF EXISTS public.get_employer_applicant_profiles(uuid[]);
CREATE FUNCTION public.get_employer_applicant_profiles(p_applicant_ids uuid[])
RETURNS TABLE(id uuid, full_name text, headline text, skills text[], experience text, location text, avatar_url text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
AS $function$
  SELECT p.id, p.full_name, p.headline, p.skills, p.experience, p.location,
    CASE WHEN p.avatar_url LIKE 'avatars/%' THEN p.avatar_url ELSE NULL END
  FROM public.profiles AS p
  WHERE p.id = ANY(COALESCE(p_applicant_ids, ARRAY[]::uuid[]))
    AND EXISTS (
      SELECT 1 FROM public.profiles AS employer_profile
      WHERE employer_profile.id = (SELECT auth.uid())
        AND employer_profile.role = 'employer'::public.account_role
    )
    AND public.user_has_platform_access((SELECT auth.uid()))
    AND EXISTS (
      SELECT 1 FROM public.job_applications AS ja
      INNER JOIN public.jobs AS j ON j.id = ja.job_id
      WHERE ja.applicant_id = p.id AND j.employer_id = (SELECT auth.uid())
    );
$function$;
REVOKE ALL ON FUNCTION public.get_employer_applicant_profiles(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_employer_applicant_profiles(uuid[]) TO authenticated;