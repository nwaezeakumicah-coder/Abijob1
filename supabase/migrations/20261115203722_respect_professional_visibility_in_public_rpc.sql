-- Ensure every public professional listing and aggregate honours the
-- account-level profile visibility preference, not only professional_profiles.is_public.

CREATE OR REPLACE FUNCTION public.get_public_professionals_verified(p_professional_id uuid DEFAULT NULL)
RETURNS TABLE(user_id uuid, full_name text, location text, headline text, about text, profile_skills text[], category text, professional_skills text[], experience_years integer, professional_bio text, service_area text, portfolio_url text, is_verified boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
AS $function$
  SELECT p.id, p.full_name, p.location, p.headline, p.about, p.skills,
    pp.category, pp.skills, pp.experience_years, pp.bio, pp.service_area,
    pp.portfolio_url, (pp.verification_status = 'verified') AS is_verified
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

CREATE OR REPLACE FUNCTION public.get_abia_opportunity_map()
RETURNS TABLE(lga text, approved_jobs bigint, public_professionals bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
AS $function$
  WITH lgas(lga) AS (
    VALUES
      ('Aba North'),('Aba South'),('Arochukwu'),('Bende'),('Ikwuano'),
      ('Isiala Ngwa North'),('Isiala Ngwa South'),('Isuikwuato'),('Obingwa'),
      ('Ohafia'),('Osisioma Ngwa'),('Ugwunagbo'),('Ukwa East'),('Ukwa West'),
      ('Umuahia North'),('Umuahia South'),('Umunneochi')
  )
  SELECT lgas.lga,
    (SELECT count(*)::bigint FROM public.jobs j
      WHERE j.status = 'approved' AND j.location ILIKE '%' || lgas.lga || '%'),
    (SELECT count(*)::bigint
      FROM public.professional_profiles pp
      JOIN public.profiles p ON p.id = pp.user_id
      LEFT JOIN public.account_preferences ap ON ap.user_id = p.id
      WHERE pp.is_public = true
        AND COALESCE(ap.profile_visibility, true) = true
        AND (COALESCE(pp.service_area,'') ILIKE '%' || lgas.lga || '%'
          OR COALESCE(p.location,'') ILIKE '%' || lgas.lga || '%'))
  FROM lgas ORDER BY lgas.lga;
$function$;

CREATE OR REPLACE FUNCTION public.get_abia_opportunity_map_summary()
RETURNS TABLE(unassigned_approved_jobs bigint, unassigned_public_professionals bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
AS $function$
  WITH lgas(lga) AS (
    VALUES
      ('Aba North'),('Aba South'),('Arochukwu'),('Bende'),('Ikwuano'),
      ('Isiala Ngwa North'),('Isiala Ngwa South'),('Isuikwuato'),('Obingwa'),
      ('Ohafia'),('Osisioma Ngwa'),('Ugwunagbo'),('Ukwa East'),('Ukwa West'),
      ('Umuahia North'),('Umuahia South'),('Umunneochi')
  )
  SELECT
    (SELECT count(*)::bigint FROM public.jobs j
      WHERE j.status='approved'
        AND NOT EXISTS (SELECT 1 FROM lgas WHERE j.location ILIKE '%'||lgas.lga||'%')),
    (SELECT count(*)::bigint
      FROM public.professional_profiles pp
      JOIN public.profiles p ON p.id = pp.user_id
      LEFT JOIN public.account_preferences ap ON ap.user_id = p.id
      WHERE pp.is_public=true
        AND COALESCE(ap.profile_visibility, true) = true
        AND NOT EXISTS (SELECT 1 FROM lgas WHERE
          COALESCE(pp.service_area,'') ILIKE '%'||lgas.lga||'%'
          OR COALESCE(p.location,'') ILIKE '%'||lgas.lga||'%'));
$function$;
