CREATE OR REPLACE FUNCTION public.get_public_employer_logos(p_employer_ids uuid[])
RETURNS TABLE(employer_id uuid, logo_path text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT
    ep.user_id,
    CASE
      WHEN ep.logo_url LIKE 'employer-logos/%' THEN ep.logo_url
      WHEN ep.logo_url LIKE 'http://%' OR ep.logo_url LIKE 'https://%' THEN ep.logo_url
      ELSE NULL
    END AS logo_path
  FROM public.employer_profiles ep
  WHERE ep.user_id = ANY(COALESCE(p_employer_ids, ARRAY[]::uuid[]))
    AND COALESCE(ep.is_public, true) = true
    AND COALESCE(ep.is_active, true) = true
    AND EXISTS (
      SELECT 1
      FROM public.jobs j
      WHERE j.employer_id = ep.user_id
        AND j.status = 'approved'
    );
$function$;

REVOKE ALL ON FUNCTION public.get_public_employer_logos(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_employer_logos(uuid[]) TO anon, authenticated;