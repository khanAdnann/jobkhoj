-- Seed three sample public jobs for an existing, confirmed, approved recruiter.
-- Replace the email below. This script does not create users or change approval.
-- Run only in the Supabase SQL Editor after reviewing the sample content.

do $seed$
declare
  recruiter_email constant text := lower(trim('adnankhanpvtt@gmail.com'));
  recruiter_id uuid;
begin
  select u.id
  into recruiter_id
  from auth.users as u
  where lower(u.email) = recruiter_email
    and u.email_confirmed_at is not null;

  if recruiter_id is null then
    raise exception
      'No confirmed Supabase Auth user matched the configured email. Confirm the email in Supabase Auth, then update recruiter_email in this script.';
  end if;

  if not exists (
    select 1
    from public.profiles as p
    where p.id = recruiter_id
      and p.role = 'RECRUITER'
      and p.recruiter_approved
      and nullif(btrim(p.company_name), '') is not null
  ) then
    raise exception
      'The matching user must have an approved RECRUITER profile and a company name before seeding jobs.';
  end if;

  if exists (
    select 1
    from public.jobs
    where id in (
      '10000000-0000-4000-8000-000000000001'::uuid,
      '10000000-0000-4000-8000-000000000002'::uuid,
      '10000000-0000-4000-8000-000000000003'::uuid
    )
  ) then
    raise exception
      'One or more sample job IDs already exist. No rows were changed; inspect public.jobs before rerunning.';
  end if;

  -- Supply the JWT claims expected by auth.uid() for this transaction so the
  -- existing ownership trigger binds all inserted rows to this recruiter.
  perform set_config('request.jwt.claim.sub', recruiter_id::text, true);
  perform set_config(
    'request.jwt.claims',
    jsonb_build_object('sub', recruiter_id::text, 'role', 'authenticated')::text,
    true
  );

  insert into public.jobs (
    id,
    owner_id,
    title,
    department,
    location,
    work_mode,
    employment_type,
    experience_min,
    experience_max,
    experience_label,
    salary_min,
    salary_max,
    skills,
    preferred_skills,
    education,
    description,
    responsibilities,
    requirements,
    benefits,
    openings,
    status,
    deadline
  )
  values
    (
      '10000000-0000-4000-8000-000000000001',
      recruiter_id,
      'Frontend Developer',
      'Engineering',
      'Bengaluru',
      'Hybrid',
      'Full-time',
      2,
      5,
      '2-5 Years',
      8,
      16,
      array['React', 'JavaScript', 'CSS', 'Accessibility'],
      array['TypeScript', 'Vite'],
      'Bachelor''s degree or equivalent experience',
      'Build accessible, responsive product interfaces with the design and engineering teams.',
      array['Develop reusable React components', 'Collaborate on UI design', 'Improve frontend performance'],
      array['2+ years of React experience', 'Strong JavaScript and CSS skills', 'Experience with Git'],
      array['Health insurance', 'Flexible work hours', 'Learning budget'],
      2,
      'Active',
      current_date + 30
    ),
    (
      '10000000-0000-4000-8000-000000000002',
      recruiter_id,
      'Backend Engineer',
      'Engineering',
      'Hyderabad',
      'Remote',
      'Full-time',
      3,
      6,
      '3-6 Years',
      12,
      24,
      array['Node.js', 'PostgreSQL', 'REST APIs', 'SQL'],
      array['Supabase', 'Docker'],
      'Bachelor''s degree in Computer Science or equivalent experience',
      'Design and maintain secure backend services and reliable data integrations.',
      array['Build and maintain APIs', 'Optimize database queries', 'Write automated tests'],
      array['3+ years of backend development', 'Relational database experience', 'Knowledge of API security'],
      array['Health insurance', 'Remote work', 'Paid leave'],
      1,
      'Active',
      current_date + 30
    ),
    (
      '10000000-0000-4000-8000-000000000003',
      recruiter_id,
      'Product Designer',
      'Design',
      'Pune',
      'Hybrid',
      'Full-time',
      2,
      4,
      '2-4 Years',
      7,
      14,
      array['Figma', 'Prototyping', 'Design Systems', 'User Research'],
      array['Accessibility', 'Usability Testing'],
      'Degree or equivalent portfolio experience in product design',
      'Shape clear, useful product experiences by partnering with users and cross-functional teams.',
      array['Create flows and prototypes', 'Contribute to the design system', 'Present design decisions'],
      array['2+ years of product design experience', 'Strong interaction design portfolio', 'Research collaboration skills'],
      array['Health insurance', 'Flexible schedule', 'Professional development'],
      1,
      'Active',
      current_date + 30
    );
end;
$seed$;
