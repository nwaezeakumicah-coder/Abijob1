-- Synchronise verification state and notify account owners when decisions are made.
CREATE OR REPLACE FUNCTION public.mark_professional_verification_pending()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $function$
BEGIN
  UPDATE public.professional_profiles
  SET verification_status='pending',verified_at=NULL,verified_by=NULL
  WHERE user_id=NEW.professional_id;
  RETURN NEW;
END;
$function$;
DROP TRIGGER IF EXISTS trg_professional_verification_pending ON public.professional_verification_requests;
CREATE TRIGGER trg_professional_verification_pending
AFTER INSERT ON public.professional_verification_requests
FOR EACH ROW EXECUTE FUNCTION public.mark_professional_verification_pending();

CREATE OR REPLACE FUNCTION public.mark_employer_verification_pending()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $function$
BEGIN
  UPDATE public.employer_profiles
  SET verification_status='pending',verified_at=NULL,verified_by=NULL
  WHERE user_id=NEW.employer_id;
  RETURN NEW;
END;
$function$;
DROP TRIGGER IF EXISTS trg_employer_verification_pending ON public.employer_verification_requests;
CREATE TRIGGER trg_employer_verification_pending
AFTER INSERT ON public.employer_verification_requests
FOR EACH ROW EXECUTE FUNCTION public.mark_employer_verification_pending();

CREATE OR REPLACE FUNCTION public.notify_verification_decision()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $function$
DECLARE v_owner_id uuid; v_href text; v_title text;
BEGIN
  IF NEW.status IS NOT DISTINCT FROM OLD.status OR NEW.status NOT IN ('approved','rejected') THEN RETURN NEW; END IF;
  IF TG_TABLE_NAME='professional_verification_requests' THEN
    v_owner_id:=NEW.professional_id;
    v_href:='/professional/verification';
    v_title:=CASE WHEN NEW.status='approved' THEN 'Professional profile verified' ELSE 'Professional verification needs attention' END;
  ELSE
    v_owner_id:=NEW.employer_id;
    v_href:='/employer/verification';
    v_title:=CASE WHEN NEW.status='approved' THEN 'Business profile verified' ELSE 'Business verification needs attention' END;
  END IF;
  INSERT INTO public.notifications(user_id,title,description,category,href)
  VALUES(v_owner_id,v_title,CASE WHEN NEW.status='approved' THEN 'Your submitted evidence has been reviewed and approved.' ELSE 'Your submitted evidence was not approved. Review the administrator note and submit updated evidence if appropriate.' END,'account',v_href);
  RETURN NEW;
END;
$function$;
DROP TRIGGER IF EXISTS trg_notify_professional_verification_decision ON public.professional_verification_requests;
CREATE TRIGGER trg_notify_professional_verification_decision
AFTER UPDATE OF status ON public.professional_verification_requests
FOR EACH ROW EXECUTE FUNCTION public.notify_verification_decision();
DROP TRIGGER IF EXISTS trg_notify_employer_verification_decision ON public.employer_verification_requests;
CREATE TRIGGER trg_notify_employer_verification_decision
AFTER UPDATE OF status ON public.employer_verification_requests
FOR EACH ROW EXECUTE FUNCTION public.notify_verification_decision();

CREATE OR REPLACE FUNCTION public.get_public_professionals_verified(p_professional_id uuid DEFAULT NULL)
RETURNS TABLE(
  user_id uuid,full_name text,location text,headline text,about text,profile_skills text[],
  category text,professional_skills text[],experience_years integer,professional_bio text,
  service_area text,portfolio_url text,is_verified boolean
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=''
AS $function$
  SELECT p.id,p.full_name,p.location,p.headline,p.about,p.skills,pp.category,pp.skills,
    pp.experience_years,pp.bio,pp.service_area,pp.portfolio_url,
    (pp.verification_status='verified') AS is_verified
  FROM public.professional_profiles pp
  JOIN public.profiles p ON p.id=pp.user_id
  WHERE p.role::text='professional'
    AND pp.is_public=true
    AND NULLIF(BTRIM(p.full_name),'') IS NOT NULL
    AND (p_professional_id IS NULL OR p.id=p_professional_id)
  ORDER BY p.full_name ASC;
$function$;
REVOKE ALL ON FUNCTION public.get_public_professionals_verified(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_professionals_verified(uuid) TO anon,authenticated,service_role;
