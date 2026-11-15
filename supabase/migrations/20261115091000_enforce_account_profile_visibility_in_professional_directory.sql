CREATE OR REPLACE FUNCTION public.get_public_professionals(p_professional_id uuid DEFAULT NULL::uuid)
RETURNS TABLE(
  user_id uuid,
  full_name text,
  location text,
  headline text,
  about text,
  profile_skills text[],
  category text,
  professional_skills text[],
  experience_years integer,
  professional_bio text,
  service_area text,
  portfolio_url text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT
    p.id AS user_id,
    p.full_name,
    p.location,
    p.headline,
    p.about,
    p.skills AS profile_skills,
    pp.category,
    pp.skills AS professional_skills,
    pp.experience_years,
    pp.bio AS professional_bio,
    pp.service_area,
    pp.portfolio_url
  FROM public.professional_profiles pp
  JOIN public.profiles p
    ON p.id = pp.user_id
  LEFT JOIN public.account_preferences ap
    ON ap.user_id = p.id
  WHERE p.role::text = 'professional'
    AND pp.is_public = true
    AND COALESCE(ap.profile_visibility, true) = true
    AND NULLIF(BTRIM(p.full_name), '') IS NOT NULL
    AND (
      p_professional_id IS NULL
      OR p.id = p_professional_id
    )
  ORDER BY p.full_name ASC;
$function$;

REVOKE ALL ON FUNCTION public.get_public_professionals(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_professionals(uuid) TO anon, authenticated;