-- Allow professionals to create only their own public-facing profile row.
-- This supports the existing upsert flow while keeping ownership and role checks
-- in RLS and excluding any future moderation-only columns.
GRANT INSERT (
  user_id,
  category,
  skills,
  experience_years,
  bio,
  service_area,
  portfolio_url,
  profile_data,
  is_public
) ON TABLE public.professional_profiles TO authenticated;

DROP POLICY IF EXISTS "Professionals can insert own profile"
  ON public.professional_profiles;

CREATE POLICY "Professionals can insert own profile"
  ON public.professional_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.role = 'professional'::public.account_role
    )
  );
