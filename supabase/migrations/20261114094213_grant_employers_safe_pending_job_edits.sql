-- Allow employers to edit only the content of their own pending vacancies.
-- The existing RLS policy still requires an active employer account and
-- subscription, and these grants exclude status/moderation fields.
GRANT UPDATE (
  title,
  category,
  employment_type,
  experience_level,
  location,
  salary_min,
  salary_max,
  salary_currency,
  description,
  requirements,
  responsibilities,
  benefits,
  skills_required,
  application_deadline
) ON TABLE public.jobs TO authenticated;
