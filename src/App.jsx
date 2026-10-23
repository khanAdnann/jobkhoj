import { Suspense } from 'react'
import AuthProvider from '@/context/AuthProvider'
import ThemeProvider from '@/context/ThemeProvider'
import ToastProvider from '@/context/ToastProvider'
import ToastViewport from '@/components/common/ToastViewport'
import ScrollToTop from '@/components/layout/ScrollToTop'
import FullPageLoader from '@/components/layout/FullPageLoader'
import AICareerAssistant from '@/components/ai/AICareerAssistant'
import AppRoutes from '@/routes/AppRoutes'

/**
 * Application root.
 *
 * Provider order matters: ThemeProvider is outermost because the colour scheme
 * is global chrome; ToastProvider sits above auth so the auth provider and
 * every page can raise toasts. <BrowserRouter> is mounted in main.jsx, above
 * this component.
 */
export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <ToastViewport />
        <AuthProvider>
          <ScrollToTop />
          <AICareerAssistant />
          <Suspense fallback={<FullPageLoader label="Loading page…" />}>
            <AppRoutes />
          </Suspense>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}