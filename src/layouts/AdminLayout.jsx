import DashboardLayout from './DashboardLayout'
import { ADMIN_NAV } from '@/routes/paths'

/** Shell for the admin area (PRD section 21). */
export default function AdminLayout() {
  return <DashboardLayout nav={ADMIN_NAV} accent="Administration" />
}
