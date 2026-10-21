-- Include the profile creation date in the recruiter-facing candidate view.
begin;

create or replace view public.public_candidate_profiles
with (security_invoker = false)
as 
select id, name, avatar_url, location, headline, bio, skills,
       years_of_experience, education, projects, certifications, social,
       created_at
from public.profiles
where public_profile
  and role = 'JOB_SEEKER'
  and status = 'Active'
  and (select private.is_approved_jobkhoj_recruiter());

commit;
