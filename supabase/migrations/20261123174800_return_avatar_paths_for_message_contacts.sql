DROP FUNCTION IF EXISTS public.get_direct_message_contacts();
CREATE FUNCTION public.get_direct_message_contacts()
RETURNS TABLE(conversation_id uuid, contact_id uuid, contact_name text, contact_role text, created_at timestamptz, updated_at timestamptz, avatar_url text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
AS $function$
  SELECT dc.id, contact.id,
    COALESCE(NULLIF(pg_catalog.btrim(contact.full_name), ''),
      CASE WHEN dc.job_seeker_id = (SELECT auth.uid()) THEN 'Professional' ELSE 'Job Seeker' END),
    CASE WHEN dc.job_seeker_id = (SELECT auth.uid()) THEN 'professional' ELSE 'job_seeker' END,
    dc.created_at, dc.updated_at,
    CASE WHEN contact.avatar_url LIKE 'avatars/%' THEN contact.avatar_url ELSE NULL END
  FROM public.direct_conversations dc
  JOIN public.profiles contact ON contact.id = CASE
    WHEN dc.job_seeker_id = (SELECT auth.uid()) THEN dc.professional_id ELSE dc.job_seeker_id END
  WHERE (SELECT auth.uid()) IS NOT NULL
    AND public.user_has_platform_access((SELECT auth.uid()))
    AND (
      (dc.job_seeker_id = (SELECT auth.uid())
        AND EXISTS (SELECT 1 FROM public.profiles me WHERE me.id = (SELECT auth.uid()) AND me.role::text = 'job_seeker')
        AND contact.role::text = 'professional')
      OR
      (dc.professional_id = (SELECT auth.uid())
        AND EXISTS (SELECT 1 FROM public.profiles me WHERE me.id = (SELECT auth.uid()) AND me.role::text = 'professional')
        AND contact.role::text = 'job_seeker')
    )
  ORDER BY dc.updated_at DESC;
$function$;
REVOKE ALL ON FUNCTION public.get_direct_message_contacts() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_direct_message_contacts() TO authenticated;

CREATE OR REPLACE FUNCTION public.get_message_contacts()
RETURNS TABLE(application_id uuid, contact_id uuid, contact_name text, contact_role text, business_name text, avatar_url text, job_title text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
AS $function$
  SELECT ja.id,
    CASE WHEN ja.applicant_id = (SELECT auth.uid()) THEN j.employer_id ELSE ja.applicant_id END,
    CASE WHEN ja.applicant_id = (SELECT auth.uid())
      THEN COALESCE(ep.business_name, employer.full_name, 'Employer')
      ELSE COALESCE(applicant.full_name, 'Applicant') END,
    CASE WHEN ja.applicant_id = (SELECT auth.uid()) THEN 'employer' ELSE 'applicant' END,
    ep.business_name,
    CASE WHEN ja.applicant_id = (SELECT auth.uid()) THEN
      COALESCE(
        CASE WHEN ep.logo_url LIKE 'employer-logos/%' OR ep.logo_url LIKE 'http://%' OR ep.logo_url LIKE 'https://%' THEN ep.logo_url ELSE NULL END,
        CASE WHEN employer.avatar_url LIKE 'avatars/%' THEN employer.avatar_url ELSE NULL END)
      ELSE CASE WHEN applicant.avatar_url LIKE 'avatars/%' THEN applicant.avatar_url ELSE NULL END END,
    j.title
  FROM public.job_applications ja
  JOIN public.jobs j ON j.id = ja.job_id
  LEFT JOIN public.profiles employer ON employer.id = j.employer_id
  LEFT JOIN public.profiles applicant ON applicant.id = ja.applicant_id
  LEFT JOIN public.employer_profiles ep ON ep.user_id = j.employer_id
  WHERE (SELECT auth.uid()) IS NOT NULL
    AND public.user_has_platform_access((SELECT auth.uid()))
    AND (
      (ja.applicant_id = (SELECT auth.uid()) AND EXISTS (
        SELECT 1 FROM public.profiles me WHERE me.id = (SELECT auth.uid()) AND me.role::text IN ('job_seeker', 'professional')))
      OR
      (j.employer_id = (SELECT auth.uid()) AND EXISTS (
        SELECT 1 FROM public.profiles me WHERE me.id = (SELECT auth.uid()) AND me.role::text = 'employer'))
    )
    AND ja.status <> 'withdrawn';
$function$;
REVOKE ALL ON FUNCTION public.get_message_contacts() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_message_contacts() TO authenticated;