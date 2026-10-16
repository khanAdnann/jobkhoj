import { Outlet } from 'react-router-dom'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import SidebarAd from '@/components/layout/SidebarAd'
import SocialBarAds from '@/components/layout/SocialBarAds'

/**
 * Shell for every public page (home, jobs, companies, auth).
 * Flex column with `mt-auto` on the footer keeps it pinned to the bottom even
 * on short pages.
 */
export default function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-ink-50">
      <Navbar />
      <SocialBarAds />

      <main className="flex-1">
        <div className="mx-auto grid w-full max-w-[1600px] min-[1200px]:grid-cols-[minmax(0,1fr)_160px] min-[1200px]:gap-6">
          <Outlet />
          <SidebarAd />
        </div>
      </main>

      <Footer />
    </div>
  )
}
