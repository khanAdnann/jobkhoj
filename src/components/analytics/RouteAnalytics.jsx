import { useLocation } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'

export default function RouteAnalytics() {
  const { pathname } = useLocation()
  return <Analytics route={pathname} path={pathname} />
}
