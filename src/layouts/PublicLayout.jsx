import { Outlet } from 'react-router-dom'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

/**
 * Shell for every public page (home, jobs, companies, auth).
 * Flex column with `mt-auto` on the footer keeps it pinned to the bottom even
 * on short pages.
 */
export default function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-ink-50">
      <Navbar />

      <main className="flex-1">
        <Outlet />
      </main>

      <Footer />
    </div>
  )
}
