-- Restore owner-scoped profile editing without exposing privileged fields.
-- Account roles remain immutable to normal users.

GRANT UPDATE (
  full_name, phone, location, avatar_url, headline, about,
  skills, experience, education, cv_path
) ON TABLE public.profiles TO authenticated;

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

GRANT UPDATE (
  headline, bio, education, skills, experience_years, cv_url
) ON TABLE public.job_seeker_profiles TO authenticated;

GRANT UPDATE (
  category, skills, experience_years, bio, service_area,
  portfolio_url, profile_data, is_public
) ON TABLE public.professional_profiles TO authenticated;

-- Never grant employers permission to change verification_status,
-- verified_at, or verified_by.
GRANT INSERT (
  user_id, business_name, business_type, description, address, website,
  phone, company_size, founded_year, business_email, facebook_url,
  instagram_url, linkedin_url, logo_url, cover_image_url, is_public,
  show_contact_details
) ON TABLE public.employer_profiles TO authenticated;

GRANT UPDATE (
  business_name, business_type, description, address, website, phone,
  company_size, founded_year, business_email, facebook_url, instagram_url,
  linkedin_url, logo_url, cover_image_url, is_public, show_contact_details,
  is_active
) ON TABLE public.employer_profiles TO authenticated;
