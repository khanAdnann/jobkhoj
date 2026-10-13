import { PATHS } from '@/routes/paths'

/**
 * Profile-completion checklist (PRD section 11).
 *
 * Kept out of ProfileCompleteness.jsx so non-component code can compute the
 * score without importing React component state.
 */
export const PROFILE_CHECKLIST = [
  { key: 'name', label: 'Full name', href: PATHS.profile },
  { key: 'phone', label: 'Phone number', href: PATHS.profile },
  { key: 'location', label: 'Location', href: PATHS.profile },
  { key: 'headline', label: 'Professional headline', href: PATHS.profile },
  { key: 'skills', label: 'At least 3 skills', href: PATHS.profile },
  { key: 'experience', label: 'Work experience', href: PATHS.profile },
  { key: 'education', label: 'Education', href: PATHS.profile },
  { key: 'hasResume', label: 'Resume uploaded', href: PATHS.resume },
]

/** Which checklist entries are satisfied by this user record. */
export function profileChecks(user) {
  if (!user) return PROFILE_CHECKLIST.map((item) => ({ ...item, done: false }))

  const skills = Array.isArray(user.skills) ? user.skills.length : 0

  const done = {
    name: Boolean(user.name?.trim()),
    phone: Boolean(user.phone?.trim()),
    location: Boolean(user.location?.trim()),
    headline: Boolean(user.headline?.trim()),
    skills: skills >= 3,
    experience: Array.isArray(user.experience) && user.experience.length > 0,
    education: Array.isArray(user.education) && user.education.length > 0,
    hasResume: Boolean(user.hasResume),
  }

  return PROFILE_CHECKLIST.map((item) => ({ ...item, done: Boolean(done[item.key]) }))
}

/** 0–100 completion score for a user record. */
export function profileScore(user) {
  const items = profileChecks(user)
  return Math.round((items.filter((item) => item.done).length / PROFILE_CHECKLIST.length) * 100)
}