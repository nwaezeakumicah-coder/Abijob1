-- Expose only a boolean employer verification state for public badges.
-- Do not expose verification documents, reviewer notes, or private profile fields.
DROP FUNCTION IF EXISTS public.get_public_employers();

CREATE FUNCTION public.get_public_employers()
RETURNS TABLE (
  employer_id uuid,
  business_name text,
  business_type text,
  company_size text,
  address text,
  website text,
  description text,
  logo_url text,
  active_job_count bigint,
  is_verified boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT
    ep.user_id AS employer_id,
    ep.business_name,
    ep.business_type,
    ep.company_size,
    CASE WHEN ep.show_contact_details THEN ep.address ELSE NULL END,
    CASE WHEN ep.show_contact_details THEN ep.website ELSE NULL END,
    ep.description,
    ep.logo_url,
    COUNT(j.id)::bigint,
    (ep.verification_status = 'approved') AS is_verified
  FROM public.employer_profiles ep
  INNER JOIN public.jobs j ON j.employer_id = ep.user_id
  WHERE j.status = 'approved'
    AND ep.is_public = true
    AND ep.is_active = true
    AND ep.business_name IS NOT NULL
    AND TRIM(ep.business_name) <> ''
  GROUP BY ep.user_id, ep.business_name, ep.business_type, ep.company_size,
    ep.address, ep.website, ep.show_contact_details, ep.description,
    ep.logo_url, ep.verification_status
  ORDER BY ep.business_name ASC;
$function$;

REVOKE ALL ON FUNCTION public.get_public_employers() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_employers() TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_public_employer_verification_status(
  p_employer_ids uuid[]
)
RETURNS TABLE (employer_id uuid, is_verified boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT ep.user_id, (ep.verification_status = 'approved') AS is_verified
  FROM public.employer_profiles ep
  WHERE ep.user_id = ANY(COALESCE(p_employer_ids, ARRAY[]::uuid[]))
    AND ep.is_public = true
    AND ep.is_active = true;
$function$;

REVOKE ALL ON FUNCTION public.get_public_employer_verification_status(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_employer_verification_status(uuid[]) TO anon, authenticated;
