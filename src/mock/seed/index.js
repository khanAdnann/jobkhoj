import companiesSeed from './companies'
import jobsSeed from './jobs'
import usersSeed from './users'
import {
  seekerApplications,
  seekerSavedJobs,
  seekerJobAlerts,
  seekerNotifications,
  STAGE_FOR_STATUS,
} from './applications'
import analyticsSeed from './analytics'
import {
  APPLICATION_STATUS,
  JOB_STATUS,
  PIPELINE_STAGE,
  PIPELINE_STAGES,
} from '@/utils/constants'

/* ------------------------------- date utils ------------------------------- */

/** ISO string `days` in the past (negative = in the future). */
function isoOffset(days) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  date.setHours(10, 0, 0, 0)
  return date.toISOString()
}

/* ---------------------------- prose generation --------------------------- */

const RESPONSIBILITIES = {
  'Software Development': [
    'Design, build and ship production features end to end',
    'Write unit and integration tests that actually catch regressions',
    'Participate in code review and mentor junior engineers',
    'Diagnose and resolve production issues with observability tooling',
    'Collaborate with product, design and QA to shape requirements',
  ],
  'Data Science': [
    'Build and productionise machine learning models',
    'Design experiments and evaluate model performance rigorously',
    'Partner with engineering to deploy models behind APIs',
    'Turn analysis into decisions stakeholders can act on',
  ],
  'Product Management': [
    'Own the roadmap for your product area',
    'Translate customer problems into a prioritised backlog',
    'Run discovery interviews and define success metrics',
    'Work closely with engineering and design through delivery',
  ],
  Design: [
    'Own end-to-end design for your feature area',
    'Maintain and evolve the design system',
    'Run usability testing and iterate on findings',
    'Partner with engineers through implementation',
  ],
  Marketing: [
    'Plan and run integrated campaigns across channels',
    'Own content calendar and messaging',
    'Track performance against CAC and pipeline targets',
    'Report on channel performance and optimise spend',
  ],
  Finance: [
    'Own financial modelling and forecasting',
    'Prepare monthly reporting for leadership',
    'Partner with business teams on budgets and planning',
    'Ensure compliance with accounting standards',
  ],
  'Human Resources': [
    'Partner with business leaders on people strategy',
    'Own talent reviews and workforce planning',
    'Drive engagement and development programmes',
    'Ensure policy compliance across the function',
  ],
  Sales: [
    'Own a named account or territory',
    'Run the full cycle from prospecting to close',
    'Maintain accurate forecasting in CRM',
    'Build lasting relationships with key stakeholders',
  ],
  'Customer Support': [
    'Resolve customer queries across channels',
    'Maintain high CSAT while keeping handle times sane',
    'Escalate and track product issues to closure',
    'Contribute to the internal knowledge base',
  ],
}

const GENERIC_RESPONSIBILITIES = [
  'Own delivery of your area with end-to-end accountability',
  'Collaborate across teams to deliver outcomes',
  'Continuously improve quality, process and customer experience',
]

const BENEFITS_POOL = [
  'Comprehensive health insurance for self and family',
  'Flexible hybrid work model',
  'Annual performance bonus',
  'Paid leave and sick leave policy',
  'Learning and certification reimbursement',
  'Employee stock purchase plan',
  'Meal and transport allowance',
  'Mental health and wellness programme',
]

function pickBenefits(seed, count = 4) {
  // Deterministic slice so a job's benefit list is stable across seeds.
  const start = seed % BENEFITS_POOL.length
  return Array.from({ length: count }, (_, i) => BENEFITS_POOL[(start + i) % BENEFITS_POOL.length])
}

function buildDescription(job, company) {
  const mode = job.workMode === 'On-site' ? 'on-site' : job.workMode.toLowerCase()
  const skills = job.skills.slice(0, 3).join(', ')

  return (
    `${company.name} is looking for a ${job.title} to join our ${job.department} team in ${job.location}. ` +
    `This is a ${job.employmentType.toLowerCase()} role with a ${mode} working setup, reporting to the ` +
    `${job.department} lead.\n\n` +
    `You will work primarily with ${skills}${job.skills.length > 3 ? ` and ${job.skills.slice(3).join(', ')}` : ''}, ` +
    `and you will have real ownership from design through production. We care far more about how you think ` +
    `and how you communicate than about the length of your CV.\n\n` +
    `We hire for ${job.experience.label} of experience and expect you to be comfortable owning a feature ` +
    `area end to end, from clarifying requirements with stakeholders through to monitoring it in production.`
  )
}

function buildRequirements(job) {
  return [
    `${job.experience.label} of hands-on experience in a ${job.department.toLowerCase()} role`,
    `Strong practical knowledge of ${job.skills.slice(0, 3).join(', ')}`,
    job.education,
    'Clear written and verbal communication',
    'Able to work independently and as part of a team',
  ]
}

function buildPreferredSkills(job) {
  const extras = job.skills.slice(3)
  const fallback = ['Git', 'CI/CD', 'REST API'].filter((skill) => !job.skills.includes(skill))
  return [...extras, ...fallback].slice(0, 4)
}

/* -------------------------------- jobs ----------------------------------- */

/** Handful of jobs deliberately left non-ACTIVE so admin moderation has work to do. */
const NON_ACTIVE_STATUS = {
  'job-1012': JOB_STATUS.EXPIRED,
  'job-1015': JOB_STATUS.CLOSED,
  'job-1017': JOB_STATUS.CLOSED,
  'job-1018': JOB_STATUS.PENDING,
  'job-1020': JOB_STATUS.PENDING,
  'job-1024': JOB_STATUS.DRAFT,
}

function buildJobs() {
  return jobsSeed.map((job, index) => {
    const company = companiesSeed.find((c) => c.id === job.companyId)

    return {
      id: job.id,
      title: job.title,
      companyId: job.companyId,
      companyName: company?.name ?? 'Unknown',
      department: job.department,
      location: job.location,
      workMode: job.workMode,
      employmentType: job.employmentType,
      experienceMin: job.experience.min,
      experienceMax: job.experience.max,
      experienceLabel: job.experience.label,
      salaryMin: job.salary.min,
      salaryMax: job.salary.max,
      skills: job.skills,
      education: job.education,
      openings: job.openings,
      featured: Boolean(job.featured),
      status: NON_ACTIVE_STATUS[job.id] ?? JOB_STATUS.ACTIVE,
      description: buildDescription(job, company ?? { name: 'The company' }),
      responsibilities: RESPONSIBILITIES[job.department] ?? GENERIC_RESPONSIBILITIES,
      requirements: buildRequirements(job),
      preferredSkills: buildPreferredSkills(job),
      benefits: pickBenefits(index),
      postedAt: isoOffset(-job.postedDaysAgo),
      deadline: isoOffset(job.deadlineInDays),
      views: 120 + ((index * 137) % 1800),
      createdBy: job.createdBy,
    }
  })
}

/* ---------------------------- applications ------------------------------- */

let applicationCounter = 102_937 // first generated id becomes APP-102938

function nextApplicationId() {
  applicationCounter += 1
  return `APP-${applicationCounter}`
}

const COVER_LETTERS = [
  'I am writing to express my interest in this role. My background in backend engineering lines up closely with what the team needs, and I would welcome the chance to discuss it.',
  'Please find my application attached. I have spent the last few years building production services and would be excited to bring that experience to your team.',
  'This position caught my attention because of the work mode and the technology stack. I would love the opportunity to contribute.',
  'I am confident my experience and skills match the requirements outlined for this role and would be glad to discuss next steps.',
]

function buildTimeline(status, stage, appliedDaysAgo) {
  const timeline = [
    {
      label: 'Applied',
      at: isoOffset(-appliedDaysAgo),
      stage: PIPELINE_STAGE.APPLIED,
    },
  ]

  const order = PIPELINE_STAGES.map((column) => column.key)
  const reached = order.indexOf(stage)

  const labels = {
    [PIPELINE_STAGE.SCREENING]: 'Under Review',
    [PIPELINE_STAGE.SHORTLISTED]: 'Shortlisted',
    [PIPELINE_STAGE.INTERVIEW]: 'Interview Scheduled',
    [PIPELINE_STAGE.SELECTED]: 'Selected',
    [PIPELINE_STAGE.HIRED]: 'Hired',
  }

  if (reached >= 0) {
    order.slice(0, reached + 1).forEach((key, i) => {
      timeline.push({
        label: labels[key],
        at: isoOffset(-(appliedDaysAgo - (i + 1) * 2)),
        stage: key,
      })
    })
  }

  if (status === APPLICATION_STATUS.REJECTED) {
    timeline.push({
      label: 'Rejected',
      at: isoOffset(-Math.max(0, appliedDaysAgo - (reached + 2) * 2)),
      stage: PIPELINE_STAGE.REJECTED,
    })
  }

  return timeline
}

function buildApplication({ jobId, seekerId, status, stage, daysAgo, index }) {
  const seeker = usersSeed.find((u) => u.id === seekerId)
  const job = jobsSeed.find((j) => j.id === jobId)

  return {
    id: nextApplicationId(),
    jobId,
    jobTitle: job?.title ?? 'Unknown role',
    companyId: job?.companyId ?? null,
    companyName:
      companiesSeed.find((c) => c.id === job?.companyId)?.name ?? 'Unknown',
    seekerId,
    candidateName: seeker?.name ?? 'Unknown',
    candidateEmail: seeker?.email ?? '',
    candidatePhone: seeker?.phone ?? '',
    candidateLocation: seeker?.location ?? '',
    headline: seeker?.headline ?? '',
    yearsOfExperience: seeker?.yearsOfExperience ?? null,
    skills: seeker?.skills ?? [],
    resumeName: seeker?.resumeName ?? null,
    status,
    stage,
    appliedAt: isoOffset(-daysAgo),
    expectedSalary: `${6 + (index % 8)} - ${12 + (index % 10)} LPA`,
    noticePeriod: ['Immediate', '15 days', '30 days', '60 days', '90 days'][index % 5],
    currentLocation: seeker?.location ?? '',
    coverLetter: COVER_LETTERS[index % COVER_LETTERS.length],
    timeline: buildTimeline(status, stage, daysAgo),
    updatedAt: isoOffset(-Math.max(0, daysAgo - 3)),
  }
}

function buildApplications() {
  const applications = []
  const seekers = usersSeed.filter((u) => u.role === 'JOB_SEEKER')
  const demoSeekerId = DEMO_SEEKER_ID

  // 1. Demo seeker first so their newest application carries the APP-102938 id
  //    referenced in the PRD.
  seekerApplications.forEach((entry, index) => {
    applications.push(
      buildApplication({
        jobId: entry.jobId,
        seekerId: demoSeekerId,
        status: entry.status,
        stage: entry.stage ?? STAGE_FOR_STATUS[entry.status],
        daysAgo: entry.daysAgo,
        index,
      }),
    )
  })

  const demoAppliedJobIds = new Set(seekerApplications.map((a) => a.jobId))

  // 2. Deterministic rotation for every other candidate. Using a fixed stride
  //    (rather than Math.random) keeps the seeded data identical on every fresh
  //    install, which makes UI work reproducible.
  jobsSeed.forEach((job, jobIndex) => {
    const applicantCount = 3 + (jobIndex % 4) // 3-6 applicants per job
    const stride = 5 // prime, avoids always pairing the same two seekers

    // Guarantee at least one candidate at the top of the funnel per job, so the
    // recruiter's Kanban board never opens with an empty early column. Shifted
    // only when an application is actually created, so skipped candidates don't
    // consume a slot.
    const forcedStatuses = [APPLICATION_STATUS.APPLIED, APPLICATION_STATUS.UNDER_REVIEW]

    for (let k = 0; k < applicantCount; k += 1) {
      const seeker = seekers[(jobIndex * stride + k) % seekers.length]
      if (!seeker || seeker.id === demoSeekerId) continue
      if (seeker.id === 'usr-seeker-7') continue // blocked account, skip
      if (demoAppliedJobIds.has(job.id) && seeker.id === 'usr-seeker-2') continue

      // Weight later applicants across the rest of the funnel.
      const roll = (jobIndex * 7 + k * 3) % 10
      const fallback =
        roll < 3
          ? APPLICATION_STATUS.APPLIED
          : roll < 5
            ? APPLICATION_STATUS.UNDER_REVIEW
            : roll < 7
              ? APPLICATION_STATUS.SHORTLISTED
              : roll < 8
                ? APPLICATION_STATUS.INTERVIEW
                : roll < 9
                  ? APPLICATION_STATUS.REJECTED
                  : APPLICATION_STATUS.HIRED

      const status = forcedStatuses.shift() ?? fallback

      applications.push(
        buildApplication({
          jobId: job.id,
          seekerId: seeker.id,
          status,
          stage: STAGE_FOR_STATUS[status],
          daysAgo: 1 + ((jobIndex * 5 + k * 3) % 45),
          index: applications.length,
        }),
      )
    }
  })

  return applications
}

/* ------------------------------- assemble -------------------------------- */

/** The seeded demo candidate. Applications for them are declared explicitly. */
const DEMO_SEEKER_ID = 'usr-seeker-1'

let cache = null

/** Builds (and memoises) the whole seeded database. */
export function buildSeed() {
  if (cache) return cache

  const jobs = buildJobs()
  const applications = buildApplications()

  // Derive view/apply counters from the generated applications.
  const counts = applications.reduce((acc, application) => {
    acc[application.jobId] = (acc[application.jobId] ?? 0) + 1
    return acc
  }, {})

  jobs.forEach((job) => {
    job.applicantCount = counts[job.id] ?? 0
  })

  cache = {
    users: usersSeed.map((user) => ({
      ...user,
      createdAt: isoOffset(-user.createdDaysAgo),
      ...(user.resumeUploadedDaysAgo
        ? { resumeUploadedAt: isoOffset(-user.resumeUploadedDaysAgo) }
        : {}),
    })),
    companies: companiesSeed,
    jobs,
    applications,
    // Flat rows with a userId column rather than a { userId: [...] } map, so
    // every collection can share the same table/filter/sort helpers.
    savedJobs: seekerSavedJobs.map((jobId, i) => ({
      id: `sv-${i + 1}`,
      userId: DEMO_SEEKER_ID,
      jobId,
      savedAt: isoOffset(-(i * 2 + 1)),
    })),
    jobAlerts: seekerJobAlerts.map((alert) => ({
      ...alert,
      userId: DEMO_SEEKER_ID,
      createdAt: isoOffset(-alert.createdDaysAgo),
    })),
    notifications: seekerNotifications.map((notification) => ({
      ...notification,
      userId: DEMO_SEEKER_ID,
      createdAt: isoOffset(-notification.daysAgo),
    })),
    analytics: analyticsSeed,
  }

  return cache
}

/** Forces a rebuild — used by "reset mock data" in the admin panel. */
export function resetSeedCache() {
  cache = null
}

export default buildSeed
