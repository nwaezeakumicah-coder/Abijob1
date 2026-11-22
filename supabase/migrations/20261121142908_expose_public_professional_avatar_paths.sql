-- Expose only paths in the dedicated public-image bucket.
-- Legacy private-bucket paths are intentionally omitted from public RPC results.
DROP FUNCTION IF EXISTS public.get_public_professionals(uuid);
CREATE FUNCTION public.get_public_professionals(p_professional_id uuid DEFAULT NULL::uuid)
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
  portfolio_url text,
  avatar_path text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
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
    pp.portfolio_url,
    CASE WHEN p.avatar_url LIKE 'avatars/%' THEN p.avatar_url ELSE NULL END
  FROM public.professional_profiles pp
  JOIN public.profiles p ON p.id = pp.user_id
  LEFT JOIN public.account_preferences ap ON ap.user_id = p.id
  WHERE p.role::text = 'professional'
    AND pp.is_public = true
    AND COALESCE(ap.profile_visibility, true) = true
    AND NULLIF(BTRIM(p.full_name), '') IS NOT NULL
    AND (p_professional_id IS NULL OR p.id = p_professional_id)
  ORDER BY p.full_name ASC;
$function$;
REVOKE ALL ON FUNCTION public.get_public_professionals(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_professionals(uuid) TO anon, authenticated;

DROP FUNCTION IF EXISTS public.get_public_professionals_verified(uuid);
CREATE FUNCTION public.get_public_professionals_verified(p_professional_id uuid DEFAULT NULL::uuid)
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
  portfolio_url text,
  is_verified boolean,
  avatar_path text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
AS $function$
  SELECT
    p.id,
    p.full_name,
    p.location,
    p.headline,
    p.about,
    p.skills,
    pp.category,
    pp.skills,
    pp.experience_years,
    pp.bio,
    pp.service_area,
    pp.portfolio_url,
    (pp.verification_status = 'verified') AS is_verified,
    CASE WHEN p.avatar_url LIKE 'avatars/%' THEN p.avatar_url ELSE NULL END
  FROM public.professional_profiles pp
  JOIN public.profiles p ON p.id = pp.user_id
  LEFT JOIN public.account_preferences ap ON ap.user_id = p.id
  WHERE p.role::text = 'professional'
    AND pp.is_public = true
    AND COALESCE(ap.profile_visibility, true) = true
    AND NULLIF(BTRIM(p.full_name), '') IS NOT NULL
    AND (p_professional_id IS NULL OR p.id = p_professional_id)
  ORDER BY p.full_name ASC;
$function$;
REVOKE ALL ON FUNCTION public.get_public_professionals_verified(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_professionals_verified(uuid) TO anon, authenticated;
