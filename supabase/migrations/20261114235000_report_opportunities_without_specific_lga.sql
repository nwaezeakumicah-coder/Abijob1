CREATE OR REPLACE FUNCTION public.get_abia_opportunity_map_summary()
RETURNS TABLE(unassigned_approved_jobs bigint,unassigned_public_professionals bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=''
AS $function$
  WITH lgas(lga) AS (VALUES
    ('Aba North'),('Aba South'),('Arochukwu'),('Bende'),('Ikwuano'),
    ('Isiala Ngwa North'),('Isiala Ngwa South'),('Isuikwuato'),('Obingwa'),
    ('Ohafia'),('Osisioma Ngwa'),('Ugwunagbo'),('Ukwa East'),('Ukwa West'),
    ('Umuahia North'),('Umuahia South'),('Umunneochi'))
  SELECT
    (SELECT count(*)::bigint FROM public.jobs j
      WHERE j.status='approved'
        AND NOT EXISTS (SELECT 1 FROM lgas WHERE j.location ILIKE '%'||lgas.lga||'%')),
    (SELECT count(*)::bigint FROM public.professional_profiles pp
      JOIN public.profiles p ON p.id=pp.user_id
      WHERE pp.is_public=true
        AND NOT EXISTS (SELECT 1 FROM lgas WHERE
          COALESCE(pp.service_area,'') ILIKE '%'||lgas.lga||'%'
          OR COALESCE(p.location,'') ILIKE '%'||lgas.lga||'%'));
$function$;
REVOKE ALL ON FUNCTION public.get_abia_opportunity_map_summary() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_abia_opportunity_map_summary() TO anon,authenticated,service_role;
