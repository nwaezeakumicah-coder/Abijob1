create or replace function public.get_employer_applicant_match_profiles(p_applicant_ids uuid[])
returns table (
  id uuid,
  full_name text,
  headline text,
  skills text[],
  experience text,
  location text,
  avatar_url text,
  account_role text,
  professional_category text,
  experience_years integer,
  education text,
  availability boolean
)
language sql
stable
security definer
set search_path = ''
as $function$
  select
    p.id,
    p.full_name,
    p.headline,
    coalesce(pp.skills, jsp.skills, p.skills) as skills,
    p.experience,
    p.location,
    case when p.avatar_url like 'avatars/%' then p.avatar_url else null end,
    p.role::text,
    case when p.role = 'professional'::public.account_role then pp.category else null end,
    case
      when p.role = 'professional'::public.account_role then pp.experience_years
      when p.role = 'job_seeker'::public.account_role then jsp.experience_years
      else null
    end,
    case when p.role = 'job_seeker'::public.account_role then jsp.education else p.education end,
    case
      when p.role = 'professional'::public.account_role and pp.show_availability is true then true
      else null
    end
  from public.profiles p
  left join public.professional_profiles pp on pp.user_id = p.id
  left join public.job_seeker_profiles jsp on jsp.user_id = p.id
  where p.id = any(coalesce(p_applicant_ids, array[]::uuid[]))
    and p.role in ('professional'::public.account_role, 'job_seeker'::public.account_role)
    and exists (
      select 1
      from public.profiles employer_profile
      where employer_profile.id = (select auth.uid())
        and employer_profile.role = 'employer'::public.account_role
    )
    and public.user_has_platform_access((select auth.uid()))
    and exists (
      select 1
      from public.job_applications ja
      inner join public.jobs j on j.id = ja.job_id
      where ja.applicant_id = p.id
        and j.employer_id = (select auth.uid())
    );
$function$;

revoke all on function public.get_employer_applicant_match_profiles(uuid[]) from public, anon;
grant execute on function public.get_employer_applicant_match_profiles(uuid[]) to authenticated;
