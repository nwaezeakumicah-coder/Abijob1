-- Restrict application status changes to a one-way recruitment lifecycle.
-- Employers cannot reopen terminal applications; applicants can withdraw only
-- while an application is still active.
CREATE OR REPLACE FUNCTION public.protect_job_application_updates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_user_id uuid;
  v_role text;
  v_owns_job boolean;
BEGIN
  v_user_id := auth.uid();

  -- Trusted server-side operations without a user JWT remain supported.
  IF v_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT p.role::text
  INTO v_role
  FROM public.profiles AS p
  WHERE p.id = v_user_id;

  IF v_role = 'admin' THEN
    RETURN NEW;
  END IF;

  IF v_role = 'employer' THEN
    SELECT EXISTS (
      SELECT 1
      FROM public.jobs AS j
      WHERE j.id = OLD.job_id
        AND j.employer_id = v_user_id
    )
    INTO v_owns_job;

    IF v_owns_job THEN
      IF
        NEW.id IS DISTINCT FROM OLD.id OR
        NEW.job_id IS DISTINCT FROM OLD.job_id OR
        NEW.applicant_id IS DISTINCT FROM OLD.applicant_id OR
        NEW.cover_letter IS DISTINCT FROM OLD.cover_letter OR
        NEW.cv_path IS DISTINCT FROM OLD.cv_path OR
        NEW.applicant_name IS DISTINCT FROM OLD.applicant_name OR
        NEW.applicant_email IS DISTINCT FROM OLD.applicant_email OR
        NEW.applicant_phone IS DISTINCT FROM OLD.applicant_phone OR
        NEW.applicant_location IS DISTINCT FROM OLD.applicant_location OR
        NEW.applicant_title IS DISTINCT FROM OLD.applicant_title OR
        NEW.applicant_experience IS DISTINCT FROM OLD.applicant_experience OR
        NEW.applicant_skills IS DISTINCT FROM OLD.applicant_skills OR
        NEW.created_at IS DISTINCT FROM OLD.created_at
      THEN
        RAISE EXCEPTION 'Employers may only update application status.'
          USING ERRCODE = '42501';
      END IF;

      IF NEW.status IS DISTINCT FROM OLD.status THEN
        IF NOT (
          (OLD.status = 'submitted'
            AND NEW.status IN ('under_review', 'shortlisted', 'rejected', 'hired'))
          OR
          (OLD.status = 'under_review'
            AND NEW.status IN ('shortlisted', 'rejected', 'hired'))
          OR
          (OLD.status = 'shortlisted'
            AND NEW.status IN ('rejected', 'hired'))
        ) THEN
          RAISE EXCEPTION 'This application status is final or the requested transition is not allowed.'
            USING ERRCODE = '22023';
        END IF;
      END IF;

      RETURN NEW;
    END IF;
  END IF;

  -- Applicants may withdraw only while an application is still active.
  IF OLD.applicant_id = v_user_id
     AND v_role IN ('job_seeker', 'professional') THEN
    IF
      NEW.id IS DISTINCT FROM OLD.id OR
      NEW.job_id IS DISTINCT FROM OLD.job_id OR
      NEW.applicant_id IS DISTINCT FROM OLD.applicant_id OR
      NEW.cover_letter IS DISTINCT FROM OLD.cover_letter OR
      NEW.cv_path IS DISTINCT FROM OLD.cv_path OR
      NEW.applicant_name IS DISTINCT FROM OLD.applicant_name OR
      NEW.applicant_email IS DISTINCT FROM OLD.applicant_email OR
      NEW.applicant_phone IS DISTINCT FROM OLD.applicant_phone OR
      NEW.applicant_location IS DISTINCT FROM OLD.applicant_location OR
      NEW.applicant_title IS DISTINCT FROM OLD.applicant_title OR
      NEW.applicant_experience IS DISTINCT FROM OLD.applicant_experience OR
      NEW.applicant_skills IS DISTINCT FROM OLD.applicant_skills OR
      NEW.created_at IS DISTINCT FROM OLD.created_at OR
      OLD.status NOT IN ('submitted', 'under_review', 'shortlisted') OR
      NEW.status <> 'withdrawn'
    THEN
      RAISE EXCEPTION 'You may only withdraw an active application.'
        USING ERRCODE = '42501';
    END IF;

    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'You are not permitted to update this application.'
    USING ERRCODE = '42501';
END;
$function$;
