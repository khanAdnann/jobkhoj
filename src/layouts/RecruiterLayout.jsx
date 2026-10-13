import DashboardLayout from './DashboardLayout'
import { RECRUITER_NAV } from '@/routes/paths'

/** Shell for the recruiter area (PRD section 15). */
export default function RecruiterLayout() {
  return <DashboardLayout nav={RECRUITER_NAV} accent="Recruiter" />
}
