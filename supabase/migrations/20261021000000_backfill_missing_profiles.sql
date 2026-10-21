-- Create JobKhoj profiles for Auth users that predate the profile trigger.
-- Safe to rerun: existing profiles are left unchanged.
begin;

insert into public.profiles (
  id,
  name,
  email,
  phone,
  role,
  company_name,
  company_size,
  created_at
)
select
  u.id,
  coalesce(u.raw_user_meta_data ->> 'name', ''),
  u.email,
  coalesce(u.raw_user_meta_data ->> 'phone', ''),
  case when u.raw_user_meta_data ->> 'role' = 'RECRUITER'
    then 'RECRUITER' else 'JOB_SEEKER' end,
  nullif(u.raw_user_meta_data ->> 'company_name', ''),
  nullif(u.raw_user_meta_data ->> 'company_size', ''),
  u.created_at
from auth.users u
where not exists (
  select 1
  from public.profiles p
  where p.id = u.id
)
on conflict (id) do nothing;

commit;
