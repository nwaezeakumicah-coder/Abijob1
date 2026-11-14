CREATE OR REPLACE FUNCTION public.notify_participants_on_new_job_application()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_employer_id uuid;
  v_job_title text;
  v_applicant_role text;
  v_applicant_href text;
BEGIN
  SELECT j.employer_id, COALESCE(NULLIF(j.title, ''), 'the position')
    INTO v_employer_id, v_job_title
  FROM public.jobs j
  WHERE j.id = NEW.job_id;

  IF v_employer_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT p.role::text INTO v_applicant_role
  FROM public.profiles p
  WHERE p.id = NEW.applicant_id;

  v_applicant_href := CASE
    WHEN v_applicant_role = 'professional' THEN '/professional/applications'
    ELSE '/applications'
  END;

  INSERT INTO public.notifications (user_id, title, description, category, href)
  VALUES (
    v_employer_id,
    'New job application received',
    format('%s applied for %s.', COALESCE(NULLIF(NEW.applicant_name, ''), 'A candidate'), v_job_title),
    'application',
    '/employer/applicants'
  );

  INSERT INTO public.notifications (user_id, title, description, category, href)
  VALUES (
    NEW.applicant_id,
    'Application submitted',
    format('Your application for %s has been submitted successfully.', v_job_title),
    'application',
    v_applicant_href
  );

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.notify_participants_on_new_job_application() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS notify_participants_on_new_job_application_trigger ON public.job_applications;
CREATE TRIGGER notify_participants_on_new_job_application_trigger
  AFTER INSERT ON public.job_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_participants_on_new_job_application();

CREATE OR REPLACE FUNCTION public.notify_applicant_on_interview_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_job_title text;
  v_applicant_role text;
  v_href text;
  v_title text;
  v_description text;
  v_scheduled_label text;
BEGIN
  SELECT COALESCE(NULLIF(j.title, ''), 'your application')
    INTO v_job_title
  FROM public.job_applications a
  JOIN public.jobs j ON j.id = a.job_id
  WHERE a.id = NEW.application_id;

  SELECT p.role::text INTO v_applicant_role
  FROM public.profiles p
  WHERE p.id = NEW.applicant_id;

  v_href := CASE
    WHEN v_applicant_role = 'professional' THEN '/professional/applications'
    ELSE '/applications'
  END;
  v_scheduled_label := to_char(NEW.scheduled_at AT TIME ZONE 'Africa/Lagos', 'DD Mon YYYY, HH12:MI AM');

  IF TG_OP = 'INSERT' THEN
    v_title := 'Interview scheduled';
    v_description := format('An interview for %s is scheduled for %s.', v_job_title, v_scheduled_label);
  ELSIF NEW.status = 'cancelled' AND OLD.status IS DISTINCT FROM 'cancelled' THEN
    v_title := 'Interview cancelled';
    v_description := format('Your interview for %s on %s has been cancelled.', v_job_title, v_scheduled_label);
  ELSIF NEW.scheduled_at IS DISTINCT FROM OLD.scheduled_at OR (NEW.status = 'rescheduled' AND OLD.status IS DISTINCT FROM 'rescheduled') THEN
    v_title := 'Interview rescheduled';
    v_description := format('Your interview for %s has been rescheduled to %s.', v_job_title, v_scheduled_label);
  ELSIF NEW.status = 'scheduled' AND OLD.status = 'cancelled' THEN
    v_title := 'Interview restored';
    v_description := format('Your interview for %s is scheduled again for %s.', v_job_title, v_scheduled_label);
  ELSE
    RETURN NEW;
  END IF;

  INSERT INTO public.notifications (user_id, title, description, category, href)
  VALUES (NEW.applicant_id, v_title, v_description, 'application', v_href);

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.notify_applicant_on_interview_change() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS notify_applicant_on_interview_change_trigger ON public.interviews;
CREATE TRIGGER notify_applicant_on_interview_change_trigger
  AFTER INSERT OR UPDATE ON public.interviews
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_applicant_on_interview_change();
