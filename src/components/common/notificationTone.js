import { Bell, Briefcase, CalendarClock, MessageSquare, Sparkles } from 'lucide-react'
import { NOTIFICATION_TYPE } from '@/utils/constants'

/**
 * Presentation for each notification type.
 *
 * Shared by the seeker inbox and the navbar bell. These two used to keep
 * separate tone maps that were only kept in sync by a comment, so adding a
 * NOTIFICATION_TYPE could colour the bell and silently fall back on the
 * notifications page. Keying off the constants means a missing entry is now
 * visible in both places at once.
 */
export const NOTIFICATION_TONE = {
  [NOTIFICATION_TYPE.SHORTLISTED]: {
    icon: Briefcase,
    className: 'bg-brand-50 text-brand-600',
  },
  [NOTIFICATION_TYPE.MATCH]: {
    icon: Sparkles,
    className: 'bg-success-50 text-success-600',
  },
  [NOTIFICATION_TYPE.INTERVIEW]: {
    icon: CalendarClock,
    className: 'bg-warning-50 text-warning-600',
  },
  [NOTIFICATION_TYPE.STATUS]: {
    icon: MessageSquare,
    className: 'bg-info-50 text-info-600',
  },
}

/** Shown for a type with no mapping, so a new type still renders readably. */
export const NOTIFICATION_TONE_FALLBACK = {
  icon: Bell,
  className: 'bg-ink-100 text-ink-500',
}