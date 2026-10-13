import {
  BarChart3,
  Bell,
  BellRing,
  Bookmark,
  Briefcase,
  Building2,
  FileCheck2,
  FileText,
  LayoutDashboard,
  Send,
  Settings,
  User,
  UserCheck,
  Users,
} from 'lucide-react'

/**
 * Lucide icon registry.
 *
 * Navigation config lives in `src/routes/paths.js` as plain data (so it can be
 * imported anywhere without pulling in React), and the icon is referenced by
 * name as a string. This map resolves those names to components at render time.
 */
export const NAV_ICONS = {
  BarChart3,
  Bell,
  BellRing,
  Bookmark,
  Briefcase,
  Building2,
  FileCheck2,
  FileText,
  LayoutDashboard,
  Send,
  Settings,
  User,
  UserCheck,
  Users,
}

/** Resolves a nav item's `icon` string, falling back to a neutral dot. */
export function getNavIcon(name) {
  return NAV_ICONS[name] ?? null
}

export default NAV_ICONS
