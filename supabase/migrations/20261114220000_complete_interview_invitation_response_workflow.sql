-- Complete the interview invitation and applicant response lifecycle.
ALTER TABLE public.interviews DROP CONSTRAINT IF EXISTS interviews_status_check;
ALTER TABLE public.interviews ADD CONSTRAINT interviews_status_check
  CHECK (status = ANY (ARRAY['scheduled','accepted','declined','completed','cancelled','rescheduled']));

CREATE OR REPLACE FUNCTION public.respond_to_interview(p_interview_id uuid,p_response text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=''
AS $function$
DECLARE v_user_id uuid:=auth.uid(); v_interview public.interviews%ROWTYPE;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Sign in to respond to this interview' USING ERRCODE='42501'; END IF;
  IF p_interview_id IS NULL OR p_response NOT IN ('accepted','declined') THEN
    RAISE EXCEPTION 'Invalid interview response' USING ERRCODE='22023';
  END IF;
  SELECT * INTO v_interview FROM public.interviews
  WHERE id=p_interview_id AND applicant_id=v_user_id
  FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Interview invitation not found' USING ERRCODE='P0002'; END IF;
  IF v_interview.status NOT IN ('scheduled','rescheduled') THEN
    RAISE EXCEPTION 'This interview invitation can no longer be answered' USING ERRCODE='55000';
  END IF;
  UPDATE public.interviews SET status=p_response,updated_at=now() WHERE id=p_interview_id;
  RETURN TRUE;
END;
$function$;
REVOKE ALL ON FUNCTION public.respond_to_interview(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.respond_to_interview(uuid,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.notify_interview_participants()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=''
AS $function$
BEGIN
  IF TG_OP='INSERT' THEN
    INSERT INTO public.notifications(user_id,title,description,category,href)
    VALUES (
      NEW.applicant_id,
      'You have an interview invitation',
      'An employer has invited you to an interview scheduled for '||to_char(NEW.scheduled_at AT TIME ZONE 'Africa/Lagos','DD Mon YYYY, HH12:MI AM')||'.',
      'application',
      '/dashboard/interviews'
    );
  ELSIF NEW.status IS DISTINCT FROM OLD.status AND NEW.status IN ('accepted','declined') THEN
    INSERT INTO public.notifications(user_id,title,description,category,href)
    VALUES (
      NEW.employer_id,
      CASE WHEN NEW.status='accepted' THEN 'Interview invitation accepted' ELSE 'Interview invitation declined' END,
      'The applicant has '||NEW.status||' your interview invitation.',
      'application',
      '/employer/interviews'
    );
  END IF;
  RETURN NEW;
END;
$function$;
DROP TRIGGER IF EXISTS trg_notify_interview_participants ON public.interviews;
CREATE TRIGGER trg_notify_interview_participants
AFTER INSERT OR UPDATE OF status ON public.interviews
FOR EACH ROW EXECUTE FUNCTION public.notify_interview_participants();
