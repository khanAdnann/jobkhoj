-- LOCAL / TEST ONLY.
-- Creates 15 fictional companies and sample public jobs using 15 dedicated,
-- confirmed, active RECRUITER test accounts. Never run this against production.
--
-- Replace each example.test email with the matching LOCAL Supabase test
-- recruiter account email before running. The admin-disable / approval-removal
-- migration must already be applied.
--
-- Jobs are Active and companies are marked Verified so the local UI can
-- exercise public listings, company pages, and featured-job placements.

do $seed$
declare
  seed_data constant jsonb := $data$
  [
    {"email":"test-recruiter-01@example.test","company_name":"Aarohan Digital Labs","industry":"Software Development","location":"Bengaluru, Karnataka","company_size":"51-200 employees","founded":2018,"about":"A product engineering studio building workflow platforms for growing businesses.","title":"Frontend Engineer","department":"Engineering","work_mode":"Hybrid","employment_type":"Full Time","experience_min":2,"experience_max":5,"salary_min":8,"salary_max":18,"skills":["React","JavaScript","CSS","Accessibility"],"description":"Build responsive, accessible product interfaces and reusable frontend systems in collaboration with product design and backend engineering."},
    {"email":"test-recruiter-02@example.test","company_name":"Nivara Health Systems","industry":"Healthcare Technology","location":"Pune, Maharashtra","company_size":"11-50 employees","founded":2020,"about":"A healthcare technology team developing practical digital tools for clinics and care providers.","title":"Backend Developer","department":"Engineering","work_mode":"Remote","employment_type":"Full Time","experience_min":3,"experience_max":6,"salary_min":12,"salary_max":24,"skills":["Node.js","PostgreSQL","REST APIs","SQL"],"description":"Design reliable APIs and data services for healthcare workflows, with careful attention to security, performance, and maintainability."},
    {"email":"test-recruiter-03@example.test","company_name":"BlueKite Commerce","industry":"E-commerce","location":"Mumbai, Maharashtra","company_size":"51-200 employees","founded":2017,"about":"A commerce platform team helping independent brands manage online sales and customer operations.","title":"Product Designer","department":"Design","work_mode":"Hybrid","employment_type":"Full Time","experience_min":2,"experience_max":4,"salary_min":7,"salary_max":15,"skills":["Figma","Prototyping","Design Systems","User Research"],"description":"Turn customer and business needs into clear product journeys, tested prototypes, and consistent interface patterns."},
    {"email":"test-recruiter-04@example.test","company_name":"Sutradhar Finance Tech","industry":"Financial Technology","location":"Hyderabad, Telangana","company_size":"51-200 employees","founded":2019,"about":"A fintech product team simplifying reconciliation and reporting for small and mid-sized businesses.","title":"QA Automation Engineer","department":"Quality Assurance","work_mode":"Hybrid","employment_type":"Full Time","experience_min":2,"experience_max":5,"salary_min":8,"salary_max":17,"skills":["Playwright","JavaScript","API Testing","Git"],"description":"Build maintainable automated checks for web and API workflows and work with engineers to prevent regressions before release."},
    {"email":"test-recruiter-05@example.test","company_name":"MangoTree Learning","industry":"Education Technology","location":"Chennai, Tamil Nadu","company_size":"11-50 employees","founded":2021,"about":"An education technology company creating collaborative learning tools for professional training teams.","title":"Full Stack Developer","department":"Engineering","work_mode":"Remote","employment_type":"Full Time","experience_min":2,"experience_max":5,"salary_min":9,"salary_max":19,"skills":["React","TypeScript","Node.js","PostgreSQL"],"description":"Deliver learner-facing features across the stack, from accessible React interfaces to documented backend endpoints."},
    {"email":"test-recruiter-06@example.test","company_name":"Northstar Supply Cloud","industry":"Logistics Technology","location":"Delhi, Delhi","company_size":"51-200 employees","founded":2016,"about":"A software team building planning and visibility tools for regional supply-chain operators.","title":"Data Analyst","department":"Data","work_mode":"On-site","employment_type":"Full Time","experience_min":1,"experience_max":4,"salary_min":6,"salary_max":13,"skills":["SQL","Python","Power BI","Data Modeling"],"description":"Analyze operational datasets, build reliable reporting, and translate findings into useful recommendations for product and operations teams."},
    {"email":"test-recruiter-07@example.test","company_name":"Kaveri Green Energy","industry":"Clean Energy","location":"Ahmedabad, Gujarat","company_size":"11-50 employees","founded":2020,"about":"A clean-energy technology group supporting monitoring and service operations for distributed projects.","title":"Cloud Operations Engineer","department":"Cloud Operations","work_mode":"Hybrid","employment_type":"Full Time","experience_min":3,"experience_max":6,"salary_min":12,"salary_max":23,"skills":["AWS","Linux","Docker","CI/CD"],"description":"Improve deployment reliability, observability, and incident response for cloud-hosted services used by energy operations teams."},
    {"email":"test-recruiter-08@example.test","company_name":"Tandem People Operations","industry":"Human Resources Technology","location":"Jaipur, Rajasthan","company_size":"11-50 employees","founded":2022,"about":"A people-operations software company focused on straightforward hiring and employee workflows.","title":"Product Marketing Manager","department":"Marketing","work_mode":"Remote","employment_type":"Full Time","experience_min":4,"experience_max":7,"salary_min":14,"salary_max":26,"skills":["Product Marketing","Positioning","Research","Content Strategy"],"description":"Develop product messaging and go-to-market programs grounded in customer research and close collaboration with product and sales."},
    {"email":"test-recruiter-09@example.test","company_name":"Copperleaf Mobility","industry":"Mobility Technology","location":"Kochi, Kerala","company_size":"51-200 employees","founded":2018,"about":"A mobility software team building tools that help local transport operators coordinate services.","title":"Android Application Developer","department":"Mobile Engineering","work_mode":"Hybrid","employment_type":"Full Time","experience_min":2,"experience_max":5,"salary_min":9,"salary_max":19,"skills":["Kotlin","Android","REST APIs","Jetpack"],"description":"Build and maintain Android features with attention to app stability, offline behavior, and clear user interactions."},
    {"email":"test-recruiter-10@example.test","company_name":"CedarStack Security","industry":"Cybersecurity","location":"Noida, Uttar Pradesh","company_size":"11-50 employees","founded":2019,"about":"A security engineering group developing practical identity and access tooling for software teams.","title":"Security Analyst","department":"Information Security","work_mode":"Hybrid","employment_type":"Full Time","experience_min":2,"experience_max":5,"salary_min":9,"salary_max":18,"skills":["SIEM","Incident Response","Linux","Security Analysis"],"description":"Review security signals, support incident investigations, and partner with engineering teams on actionable risk reduction."},
    {"email":"test-recruiter-11@example.test","company_name":"Paperplane Creative Software","industry":"Digital Products","location":"Indore, Madhya Pradesh","company_size":"11-50 employees","founded":2021,"about":"A small product studio combining design and engineering to deliver focused business applications.","title":"UX Researcher","department":"Design","work_mode":"Remote","employment_type":"Full Time","experience_min":2,"experience_max":5,"salary_min":7,"salary_max":15,"skills":["User Interviews","Usability Testing","Research Synthesis","Figma"],"description":"Plan and conduct research that helps product teams understand user needs and make evidence-informed design decisions."},
    {"email":"test-recruiter-12@example.test","company_name":"Fieldnote Agri Systems","industry":"Agricultural Technology","location":"Nagpur, Maharashtra","company_size":"11-50 employees","founded":2020,"about":"A technology team building field data and coordination tools for agricultural service networks.","title":"Python Developer","department":"Engineering","work_mode":"Hybrid","employment_type":"Full Time","experience_min":2,"experience_max":5,"salary_min":8,"salary_max":17,"skills":["Python","Django","PostgreSQL","REST APIs"],"description":"Develop maintainable backend features and integrations for field-service applications, with a focus on data quality and testing."},
    {"email":"test-recruiter-13@example.test","company_name":"OrbitDesk Productivity","industry":"Productivity Software","location":"Bengaluru, Karnataka","company_size":"51-200 employees","founded":2017,"about":"A SaaS product team making planning and collaboration workflows easier for distributed teams.","title":"Customer Success Specialist","department":"Customer Success","work_mode":"Hybrid","employment_type":"Full Time","experience_min":1,"experience_max":4,"salary_min":5,"salary_max":11,"skills":["Customer Success","SaaS","Communication","Problem Solving"],"description":"Help customers onboard successfully, resolve product questions, and share recurring feedback with internal product teams."},
    {"email":"test-recruiter-14@example.test","company_name":"Monsoon Payments Studio","industry":"Financial Technology","location":"Chennai, Tamil Nadu","company_size":"11-50 employees","founded":2019,"about":"A payments software team building dependable transaction and settlement tools for businesses.","title":"Site Reliability Engineer","department":"Platform Engineering","work_mode":"Remote","employment_type":"Full Time","experience_min":3,"experience_max":7,"salary_min":14,"salary_max":28,"skills":["Kubernetes","Linux","Monitoring","Terraform"],"description":"Strengthen service reliability through automation, observability, capacity planning, and blameless incident reviews."},
    {"email":"test-recruiter-15@example.test","company_name":"PebbleWorks Design Systems","industry":"Design Technology","location":"Pune, Maharashtra","company_size":"11-50 employees","founded":2022,"about":"A design engineering team developing reusable interface foundations for digital products.","title":"Technical Content Writer","department":"Content","work_mode":"Remote","employment_type":"Full Time","experience_min":2,"experience_max":5,"salary_min":6,"salary_max":13,"skills":["Technical Writing","Documentation","Developer Tools","Editing"],"description":"Create accurate, approachable product documentation and technical guides in partnership with engineers and product specialists."}
  ]
  $data$::jsonb;
  item record;
  recruiter_id uuid;
  company_id text;
  row_number integer := 0;
  expected_rows constant integer := 15;
begin
  if jsonb_array_length(seed_data) <> expected_rows then
    raise exception 'Expected exactly % test recruiter/company/job records.', expected_rows;
  end if;

  if (
    select count(distinct lower(value->>'email'))
    from jsonb_array_elements(seed_data) as rows(value)
  ) <> expected_rows then
    raise exception 'Each test recruiter email must be unique.';
  end if;

  -- Validate every account before changing any profile.
  for item in
    select *
    from jsonb_to_recordset(seed_data) as x(email text)
  loop
    select u.id
    into recruiter_id
    from auth.users u
    where lower(u.email) = lower(item.email)
      and u.email_confirmed_at is not null;

    if recruiter_id is null then
      raise exception 'No confirmed local Auth user found for %. Replace the example.test email with its test account email.', item.email;
    end if;

    if not exists (
      select 1 from public.profiles p
      where p.id = recruiter_id
        and p.role = 'RECRUITER'
        and p.status = 'Active'
    ) then
      raise exception 'The account % must have an Active RECRUITER profile.', item.email;
    end if;
  end loop;

  for item in
    select *
    from jsonb_to_recordset(seed_data) as x(
      email text,
      company_name text,
      industry text,
      location text,
      company_size text,
      founded integer,
      about text,
      title text,
      department text,
      work_mode text,
      employment_type text,
      experience_min integer,
      experience_max integer,
      salary_min numeric,
      salary_max numeric,
      skills text[],
      description text
    )
  loop
    row_number := row_number + 1;

    select u.id
    into recruiter_id
    from auth.users u
    where lower(u.email) = lower(item.email)
      and u.email_confirmed_at is not null;

    if exists (
      select 1 from public.companies c
      where lower(c.name) = lower(item.company_name)
        and c.owner_id is not null
        and c.owner_id <> recruiter_id
    ) then
      raise exception 'Fictional test company "%" is already owned by another profile.', item.company_name;
    end if;

    update public.profiles
    set company_name = item.company_name,
        company_size = item.company_size
    where id = recruiter_id;

    select p.company_id
    into company_id
    from public.profiles p
    where p.id = recruiter_id;

    if company_id is null then
      raise exception 'Company setup did not complete for test recruiter %.', item.email;
    end if;

    update public.companies
    set industry = item.industry,
        location = item.location,
        founded = item.founded,
        about = item.about,
        verification = 'Verified',
        verified_at = now()
    where id = company_id
      and owner_id = recruiter_id;

    if not found then
      raise exception 'Could not update the test company profile for recruiter %.', item.email;
    end if;

    -- Set the authenticated user context expected by the jobs ownership trigger.
    perform set_config('request.jwt.claim.sub', recruiter_id::text, true);
    perform set_config(
      'request.jwt.claims',
      jsonb_build_object('sub', recruiter_id::text, 'role', 'authenticated')::text,
      true
    );

    insert into public.jobs (
      id, owner_id, title, department, location, work_mode, employment_type,
      experience_min, experience_max, experience_label, salary_min, salary_max,
      skills, preferred_skills, education, description, responsibilities,
      requirements, benefits, openings, featured, status, deadline
    )
    values (
      ('20000000-0000-4000-8000-' || lpad(row_number::text, 12, '0'))::uuid,
      recruiter_id,
      item.title,
      item.department,
      item.location,
      item.work_mode,
      item.employment_type,
      item.experience_min,
      item.experience_max,
      item.experience_min::text || '-' || item.experience_max::text || ' Years',
      item.salary_min,
      item.salary_max,
      item.skills,
      array[]::text[],
      'Relevant degree or equivalent practical experience',
      item.description,
      array[
        'Collaborate with the team to plan and deliver role-related work',
        'Maintain clear documentation and share progress with stakeholders',
        'Review outcomes and contribute to continuous improvement'
      ],
      array[
        item.experience_min::text || '+ years of relevant experience',
        'Working knowledge of ' || array_to_string(item.skills, ', '),
        'Clear communication and a collaborative approach'
      ],
      array['Health coverage', 'Flexible leave', 'Learning and development support'],
      1,
      row_number <= 4,
      'Active',
      current_date + 30
    )
    on conflict (id) do update set
      owner_id = excluded.owner_id,
      title = excluded.title,
      department = excluded.department,
      location = excluded.location,
      work_mode = excluded.work_mode,
      employment_type = excluded.employment_type,
      experience_min = excluded.experience_min,
      experience_max = excluded.experience_max,
      experience_label = excluded.experience_label,
      salary_min = excluded.salary_min,
      salary_max = excluded.salary_max,
      skills = excluded.skills,
      preferred_skills = excluded.preferred_skills,
      education = excluded.education,
      description = excluded.description,
      responsibilities = excluded.responsibilities,
      requirements = excluded.requirements,
      benefits = excluded.benefits,
      openings = excluded.openings,
      featured = excluded.featured,
      status = excluded.status,
      deadline = excluded.deadline;
  end loop;

  raise notice 'Seeded % fictional companies and % local test jobs.', expected_rows, expected_rows;
end;
$seed$;
