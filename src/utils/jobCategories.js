const text = (job) =>
  [
    job.title,
    job.department,
    job.company?.name ?? job.companyName,
    job.employmentType,
    job.experienceLabel,
    ...(job.skills ?? []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

export const JOB_CATEGORIES = [
  {
    slug: 'java-developer-jobs',
    heading: 'Java Developer Jobs',
    title: 'Java Developer Jobs in India | JobKhoj',
    description: 'Explore current Java developer openings in India. Compare role requirements, skills, experience and locations, then apply on JobKhoj.',
    intro: 'Browse active Java developer roles from the JobKhoj listings. Review each employer’s requirements, experience range and location before applying.',
    query: 'java',
    matches: (job) => /\bjava\b/.test(text(job)),
  },
  {
    slug: 'software-developer-jobs',
    heading: 'Software Developer Jobs',
    title: 'Software Developer Jobs in India | JobKhoj',
    description: 'Find active software developer and software engineering jobs in India, with role details, skills, work modes and application information.',
    intro: 'Explore software development opportunities across experience levels. Open a listing for the full job description and application details.',
    query: 'software OR developer OR engineer',
    matches: (job) =>
      /software development|software engineer|software developer/.test(text(job)) ||
      /\bdeveloper\b/.test(String(job.title ?? '').toLowerCase()),
  },
  {
    slug: 'fresher-jobs',
    heading: 'Fresher Jobs',
    title: 'Fresher Jobs in India | JobKhoj',
    description: 'Browse entry-level and fresher job openings in India. Check experience requirements, skills and location in each current listing.',
    intro: 'Find roles open to new graduates and candidates with limited experience. Eligibility varies by employer, so review each listing carefully.',
    experienceMax: 2,
    matches: (job) =>
      /fresher|entry.level|intern/.test(String(job.experienceLabel ?? '').toLowerCase()) ||
      (Number.isFinite(Number(job.experienceMin)) && Number(job.experienceMin) <= 2),
  },
  {
    slug: 'remote-jobs',
    heading: 'Remote Jobs',
    title: 'Remote Jobs in India | JobKhoj',
    description: 'Explore active remote job openings on JobKhoj. Review each employer’s role, skills, experience and remote-work details before applying.',
    intro: 'These listings are marked Remote in their work-mode data. Confirm location eligibility and any office expectations in the individual job details.',
    workMode: 'Remote',
    matches: (job) => String(job.workMode ?? '').toLowerCase() === 'remote',
  },
  {
    slug: 'spring-boot-jobs',
    heading: 'Spring Boot Jobs',
    title: 'Spring Boot Jobs in India | JobKhoj',
    description: 'Search current Spring Boot developer jobs in India. Compare Java and backend role requirements, experience and locations on JobKhoj.',
    intro: 'Browse active roles that mention Spring Boot in the job title or required skills. Check the full listing for the employer’s specific technology stack.',
    query: 'spring OR boot',
    matches: (job) => /spring[\s-]*boot/.test(text(job)),
  },
  {
    slug: 'backend-developer-jobs',
    heading: 'Backend Developer Jobs',
    title: 'Backend Developer Jobs in India | JobKhoj',
    description: 'Find current backend developer and server-side engineering openings in India, with skills, experience and application details.',
    intro: 'Explore roles focused on backend and server-side development. Use each job page to review its actual responsibilities and required technologies.',
    query: 'backend OR back-end OR server',
    matches: (job) => /\bback[\s-]?end\b|server.side/.test(text(job)),
  },
  {
    slug: 'internship-jobs',
    heading: 'Internship Jobs',
    title: 'Internship Jobs in India | JobKhoj',
    description: 'Browse current internship opportunities in India. Review the role, skills, location and application details for each active listing.',
    intro: 'Find listings identified as internships by their role or employment type. Check each employer’s eligibility and application instructions.',
    query: 'intern OR internship',
    matches: (job) =>
      /intern/.test(String(job.employmentType ?? '').toLowerCase()) ||
      /intern/.test(String(job.title ?? '').toLowerCase()),
  },
  {
    slug: 'banking-jobs',
    heading: 'Banking Jobs',
    title: 'Banking Jobs in India | JobKhoj',
    description: 'Explore active banking and financial-services job openings in India, including the real role requirements and application details.',
    intro: 'Browse job listings related to banking and finance. Verify the responsibilities and employer information on each individual listing.',
    query: 'bank OR banking OR finance',
    matches: (job) => /\bbank\b|\bbanking\b|\bfinance\b/.test(text(job)),
  },
]

export const JOB_CATEGORY_BY_SLUG = new Map(
  JOB_CATEGORIES.map((category) => [category.slug, category]),
)
