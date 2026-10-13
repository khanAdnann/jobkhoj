import {
  APPLICATION_STATUS,
  NOTIFICATION_TYPE,
  PIPELINE_STAGE,
  PIPELINE_STAGES,
} from '@/utils/constants'

/**
 * Explicit application records for the primary demo job seeker
 * (usr-seeker-1 / seeker@jobkhoj.in) so their dashboard has meaningful
 * "Applied / Shortlisted / Interview" counts from first load.
 *
 * Applications for all *other* candidates are generated deterministically by
 * `src/mock/seed/index.js` (a fixed rotation over the seeker pool), which keeps
 * every job populated without hand-writing hundreds of rows.
 *
 * `daysAgo` = days since the application was submitted.
 * `stage` is the recruiter pipeline column; `status` is what the seeker sees.
 */
export const seekerApplications = [
  { jobId: 'job-1001', status: APPLICATION_STATUS.INTERVIEW, stage: PIPELINE_STAGE.INTERVIEW, daysAgo: 3 },
  { jobId: 'job-1003', status: APPLICATION_STATUS.SHORTLISTED, stage: PIPELINE_STAGE.SHORTLISTED, daysAgo: 5 },
  { jobId: 'job-1005', status: APPLICATION_STATUS.SHORTLISTED, stage: PIPELINE_STAGE.SHORTLISTED, daysAgo: 8 },
  { jobId: 'job-1006', status: APPLICATION_STATUS.UNDER_REVIEW, stage: PIPELINE_STAGE.SCREENING, daysAgo: 9 },
  { jobId: 'job-1009', status: APPLICATION_STATUS.APPLIED, stage: PIPELINE_STAGE.APPLIED, daysAgo: 11 },
  { jobId: 'job-1010', status: APPLICATION_STATUS.SHORTLISTED, stage: PIPELINE_STAGE.SHORTLISTED, daysAgo: 14 },
  { jobId: 'job-1014', status: APPLICATION_STATUS.INTERVIEW, stage: PIPELINE_STAGE.INTERVIEW, daysAgo: 17 },
  { jobId: 'job-1016', status: APPLICATION_STATUS.APPLIED, stage: PIPELINE_STAGE.APPLIED, daysAgo: 20 },
  { jobId: 'job-1022', status: APPLICATION_STATUS.SHORTLISTED, stage: PIPELINE_STAGE.SHORTLISTED, daysAgo: 23 },
  { jobId: 'job-1013', status: APPLICATION_STATUS.REJECTED, stage: PIPELINE_STAGE.SCREENING, daysAgo: 26 },
  { jobId: 'job-1019', status: APPLICATION_STATUS.SHORTLISTED, stage: PIPELINE_STAGE.SHORTLISTED, daysAgo: 29 },
  { jobId: 'job-1021', status: APPLICATION_STATUS.INTERVIEW, stage: PIPELINE_STAGE.INTERVIEW, daysAgo: 33 },
]

/** Saved jobs for the demo seeker. */
export const seekerSavedJobs = [
  'job-1001',
  'job-1004',
  'job-1006',
  'job-1010',
  'job-1013',
  'job-1019',
  'job-1021',
  'job-1022',
  'job-1024',
]

/** Job alerts for the demo seeker. */
export const seekerJobAlerts = [
  {
    id: 'alert-1',
    name: 'Java Backend Jobs',
    keywords: ['Java', 'Spring Boot'],
    location: 'Mumbai, Maharashtra',
    experience: '3-6 Years',
    department: 'Software Development',
    frequency: 'Daily',
    active: true,
    createdDaysAgo: 20,
    matches: 14,
  },
  {
    id: 'alert-2',
    name: 'Remote React Roles',
    keywords: ['React', 'TypeScript'],
    location: 'Remote',
    experience: 'Any',
    department: 'Software Development',
    frequency: 'Instantly',
    active: true,
    createdDaysAgo: 12,
    matches: 9,
  },
  {
    id: 'alert-3',
    name: 'Senior Architecture',
    keywords: ['Microservices', 'Kubernetes'],
    location: 'Bengaluru, Karnataka',
    experience: '8+ Years',
    department: 'Software Development',
    frequency: 'Weekly',
    active: false,
    createdDaysAgo: 45,
    matches: 6,
  },
]

/** Notifications for the demo seeker. */
export const seekerNotifications = [
  {
    id: 'ntf-1',
    type: NOTIFICATION_TYPE.SHORTLISTED,
    title: 'Your application was shortlisted',
    message: 'Spring Boot Developer at Infosys moved you to the shortlist stage.',
    daysAgo: 1,
    read: false,
    jobId: 'job-1003',
  },
  {
    id: 'ntf-2',
    type: NOTIFICATION_TYPE.MATCH,
    title: 'New Java Developer jobs match your alert',
    message: '4 new jobs matched your "Java Backend Jobs" alert.',
    daysAgo: 2,
    read: false,
    jobId: null,
  },
  {
    id: 'ntf-3',
    type: NOTIFICATION_TYPE.INTERVIEW,
    title: 'Your interview is scheduled for tomorrow',
    message: 'Java Backend Developer at TCS — 11:00 AM, video interview.',
    daysAgo: 3,
    read: false,
    jobId: 'job-1001',
  },
  {
    id: 'ntf-4',
    type: NOTIFICATION_TYPE.STATUS,
    title: 'Your application status has changed',
    message: 'Machine Learning Engineer at HCLTech — application closed.',
    daysAgo: 5,
    read: true,
    jobId: 'job-1013',
  },
  {
    id: 'ntf-5',
    type: NOTIFICATION_TYPE.MATCH,
    title: 'New Senior Java Developer jobs match your alert',
    message: '3 new jobs matched your "Senior Architecture" alert.',
    daysAgo: 7,
    read: true,
    jobId: null,
  },
  {
    id: 'ntf-6',
    type: NOTIFICATION_TYPE.SHORTLISTED,
    title: 'Your application was shortlisted',
    message: 'React Developer at Infosys moved you to the shortlist stage.',
    daysAgo: 9,
    read: true,
    jobId: 'job-1005',
  },
]

/**
 * Status -> default pipeline column. Used when an application is seeded with a
 * status but the recruiter hasn't touched it yet.
 */
export const STAGE_FOR_STATUS = {
  [APPLICATION_STATUS.APPLIED]: PIPELINE_STAGE.APPLIED,
  [APPLICATION_STATUS.UNDER_REVIEW]: PIPELINE_STAGE.SCREENING,
  [APPLICATION_STATUS.SHORTLISTED]: PIPELINE_STAGE.SHORTLISTED,
  [APPLICATION_STATUS.INTERVIEW]: PIPELINE_STAGE.INTERVIEW,
  [APPLICATION_STATUS.REJECTED]: PIPELINE_STAGE.SCREENING,
  [APPLICATION_STATUS.HIRED]: PIPELINE_STAGE.HIRED,
}

export const STAGE_LABELS = Object.fromEntries(
  PIPELINE_STAGES.map((stage) => [stage.key, stage.label]),
)

export default seekerApplications
