import { Outlet } from 'react-router-dom'
import { Info } from 'lucide-react'
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
        <aside
          role="note"
          className="border-b border-warning-200 bg-warning-50 px-4 py-2.5 text-center text-sm text-warning-700"
        >
          <span className="mx-auto inline-flex max-w-5xl items-start justify-center gap-2">
            <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              Check job details directly with the employer before acting. When Supabase is
              configured, job listings and recruiter job management use it; other demo areas
              may still show sample data.
            </span>
          </span>
        </aside>
        <Outlet />
      </main>

      <Footer />
    </div>
  )
}
