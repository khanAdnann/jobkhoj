/**
 * Platform analytics seed — 12 months of history for the recruiter and admin
 * dashboards. Values are static (not random) so charts look identical on every
 * fresh seed and can be reasoned about during development.
 */

export const MONTHS = [
  'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr',
  'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct',
]

export const jobsPostedPerMonth = [
  { month: 'Nov', jobs: 640, applications: 3120 },
  { month: 'Dec', jobs: 520, applications: 2480 },
  { month: 'Jan', jobs: 810, applications: 4260 },
  { month: 'Feb', jobs: 760, applications: 3940 },
  { month: 'Mar', jobs: 980, applications: 5120 },
  { month: 'Apr', jobs: 1050, applications: 5680 },
  { month: 'May', jobs: 1180, applications: 6420 },
  { month: 'Jun', jobs: 1240, applications: 6890 },
  { month: 'Jul', jobs: 1090, applications: 6010 },
  { month: 'Aug', jobs: 1360, applications: 7480 },
  { month: 'Sep', jobs: 1490, applications: 8320 },
  { month: 'Oct', jobs: 1620, applications: 9140 },
]

export const applicationsPerMonth = [
  { month: 'Nov', applications: 3120 },
  { month: 'Dec', applications: 2480 },
  { month: 'Jan', applications: 4260 },
  { month: 'Feb', applications: 3940 },
  { month: 'Mar', applications: 5120 },
  { month: 'Apr', applications: 5680 },
  { month: 'May', applications: 6420 },
  { month: 'Jun', applications: 6890 },
  { month: 'Jul', applications: 6010 },
  { month: 'Aug', applications: 7480 },
  { month: 'Sep', applications: 8320 },
  { month: 'Oct', applications: 9140 },
]

export const newUsersPerMonth = [
  { month: 'Nov', seekers: 1840, recruiters: 42 },
  { month: 'Dec', seekers: 1520, recruiters: 36 },
  { month: 'Jan', seekers: 2460, recruiters: 58 },
  { month: 'Feb', seekers: 2280, recruiters: 51 },
  { month: 'Mar', seekers: 3120, recruiters: 67 },
  { month: 'Apr', seekers: 3480, recruiters: 72 },
  { month: 'May', seekers: 3960, recruiters: 84 },
  { month: 'Jun', seekers: 4280, recruiters: 91 },
  { month: 'Jul', seekers: 3810, recruiters: 79 },
  { month: 'Aug', seekers: 4720, recruiters: 96 },
  { month: 'Sep', seekers: 5240, recruiters: 108 },
  { month: 'Oct', seekers: 5890, recruiters: 121 },
]

export const hiringTrends = [
  { month: 'Nov', hired: 62, rejected: 210 },
  { month: 'Dec', hired: 48, rejected: 178 },
  { month: 'Jan', hired: 78, rejected: 244 },
  { month: 'Feb', hired: 71, rejected: 226 },
  { month: 'Mar', hired: 96, rejected: 298 },
  { month: 'Apr', hired: 108, rejected: 322 },
  { month: 'May', hired: 124, rejected: 356 },
  { month: 'Jun', hired: 132, rejected: 381 },
  { month: 'Jul', hired: 118, rejected: 344 },
  { month: 'Aug', hired: 147, rejected: 412 },
  { month: 'Sep', hired: 163, rejected: 448 },
  { month: 'Oct', hired: 178, rejected: 486 },
]

/** Applications by work mode — used on the recruiter analytics page. */
export const applicationsByWorkMode = [
  { mode: 'Hybrid', value: 4180 },
  { mode: 'On-site', value: 2960 },
  { mode: 'Remote', value: 1740 },
]

/** Top skills demanded across all published jobs. */
export const topSkills = [
  { skill: 'Java', count: 482 },
  { skill: 'Spring Boot', count: 431 },
  { skill: 'React', count: 398 },
  { skill: 'Microservices', count: 344 },
  { skill: 'SQL', count: 337 },
  { skill: 'AWS', count: 286 },
  { skill: 'Docker', count: 254 },
  { skill: 'Kafka', count: 219 },
  { skill: 'Python', count: 207 },
  { skill: 'Kubernetes', count: 184 },
]

export const platformStats = {
  totalUsers: 12_480,
  jobSeekers: 11_960,
  recruiters: 412,
  companies: 508,
  activeJobs: 1_620,
  applications: 9_140,
  hiredCandidates: 178,
  // Percentage change vs previous month, rendered by <StatCard delta={...} />.
  deltas: {
    totalUsers: 12.4,
    jobSeekers: 12.3,
    recruiters: 12.1,
    companies: 4.8,
    activeJobs: 8.7,
    applications: 9.9,
    hiredCandidates: 9.2,
  },
}

export default {
  MONTHS,
  jobsPostedPerMonth,
  applicationsPerMonth,
  newUsersPerMonth,
  hiringTrends,
  applicationsByWorkMode,
  topSkills,
  platformStats,
}
