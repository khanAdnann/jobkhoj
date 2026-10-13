import DashboardLayout from './DashboardLayout'
import { SEEKER_NAV } from '@/routes/paths'

/** Shell for the job-seeker area (PRD section 9). */
export default function SeekerLayout() {
  return <DashboardLayout nav={SEEKER_NAV} accent="My Account" />
}
