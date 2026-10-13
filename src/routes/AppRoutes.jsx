import { lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { PATHS } from './paths'
import ProtectedRoute from './ProtectedRoute'
import RoleRoute from './RoleRoute'

import PublicLayout from '@/layouts/PublicLayout'
import SeekerLayout from '@/layouts/SeekerLayout'
import RecruiterLayout from '@/layouts/RecruiterLayout'
import AdminLayout from '@/layouts/AdminLayout'

/* ---------------------------------------------------------------------------
 * Auth pages are eager: they are small, and the login page is the entry point
 * for a cold visit, so code-splitting it would only add a round trip.
 * ------------------------------------------------------------------------- */
import Login from '@/pages/auth/Login'
import Register from '@/pages/auth/Register'
import ForgotPassword from '@/pages/auth/ForgotPassword'
import ResetPassword from '@/pages/auth/ResetPassword'
import Forbidden from '@/pages/errors/Forbidden'
import NotFound from '@/pages/errors/NotFound'

/* ---------------------------------------------------------------------------
 * Everything else is lazy so the initial public bundle stays small (PRD
 * section 32). Each page is split into its own chunk.
 * ------------------------------------------------------------------------- */
const Home = lazy(() => import('@/pages/Home'))
const JobSearch = lazy(() => import('@/pages/jobs/JobSearch'))
const JobDetails = lazy(() => import('@/pages/jobs/JobDetails'))
const CompanyDirectory = lazy(() => import('@/pages/companies/CompanyDirectory'))
const CompanyDetails = lazy(() => import('@/pages/companies/CompanyDetails'))

const SeekerDashboard = lazy(() => import('@/pages/seeker/Dashboard'))
const SeekerProfile = lazy(() => import('@/pages/seeker/Profile'))
const SeekerResume = lazy(() => import('@/pages/seeker/Resume'))
const MyApplications = lazy(() => import('@/pages/seeker/MyApplications'))
const ApplicationDetails = lazy(() => import('@/pages/seeker/ApplicationDetails'))
const SavedJobs = lazy(() => import('@/pages/seeker/SavedJobs'))
const JobAlerts = lazy(() => import('@/pages/seeker/JobAlerts'))
const SeekerNotifications = lazy(() => import('@/pages/seeker/Notifications'))
const AccountSettings = lazy(() => import('@/pages/seeker/Settings'))

const RecruiterDashboard = lazy(() => import('@/pages/recruiter/Dashboard'))
const CompanyProfile = lazy(() => import('@/pages/recruiter/CompanyProfile'))
const ManageJobs = lazy(() => import('@/pages/recruiter/ManageJobs'))
const CreateJob = lazy(() => import('@/pages/recruiter/CreateJob'))
const EditJob = lazy(() => import('@/pages/recruiter/EditJob'))
const RecruiterJobDetails = lazy(() => import('@/pages/recruiter/JobDetails'))
const Applicants = lazy(() => import('@/pages/recruiter/Applicants'))
const ApplicantDetails = lazy(() => import('@/pages/recruiter/ApplicantDetails'))
const Candidates = lazy(() => import('@/pages/recruiter/Candidates'))
const RecruiterAnalytics = lazy(() => import('@/pages/recruiter/Analytics'))
const RecruiterSettings = lazy(() => import('@/pages/recruiter/Settings'))

const AdminDashboard = lazy(() => import('@/pages/admin/Dashboard'))
const AdminUsers = lazy(() => import('@/pages/admin/Users'))
const AdminRecruiters = lazy(() => import('@/pages/admin/Recruiters'))
const AdminCompanies = lazy(() => import('@/pages/admin/Companies'))
const AdminJobs = lazy(() => import('@/pages/admin/Jobs'))
const AdminApplications = lazy(() => import('@/pages/admin/Applications'))
const AdminReports = lazy(() => import('@/pages/admin/Reports'))

const ToolsLanding = lazy(() => import('@/pages/tools/index'))
const ToolsAtsChecker = lazy(() => import('@/pages/tools/AtsChecker'))
const ToolsResumeBuilder = lazy(() => import('@/pages/tools/ResumeBuilder'))
const ToolsResumeOptimizer = lazy(() => import('@/pages/tools/ResumeOptimizer'))
const ToolsKeywordExtractor = lazy(() => import('@/pages/tools/KeywordExtractor'))
const ToolsSkillGap = lazy(() => import('@/pages/tools/SkillGap'))
const ToolsJobMatch = lazy(() => import('@/pages/tools/JobMatch'))
const ToolsJdAnalyzer = lazy(() => import('@/pages/tools/JdAnalyzer'))
const ToolsSalaryEstimator = lazy(() => import('@/pages/tools/SalaryEstimator'))
const ToolsPdfToWord = lazy(() => import('@/pages/tools/PdfToWord'))
const ToolsWordToPdf = lazy(() => import('@/pages/tools/WordToPdf'))
const ToolsMergePdf = lazy(() => import('@/pages/tools/MergePdf'))
const ToolsSplitPdf = lazy(() => import('@/pages/tools/SplitPdf'))
const ToolsCompressPdf = lazy(() => import('@/pages/tools/CompressPdf'))
const ToolsPdfToImages = lazy(() => import('@/pages/tools/PdfToImages'))
const ToolsImagesToPdf = lazy(() => import('@/pages/tools/ImagesToPdf'))
const ToolsRotatePdf = lazy(() => import('@/pages/tools/RotatePdf'))
const ToolsExtractPdf = lazy(() => import('@/pages/tools/ExtractPdf'))
const ToolsResumeFormatConverter = lazy(() => import('@/pages/tools/ResumeFormatConverter'))
const ToolsCoverLetter = lazy(() => import('@/pages/tools/CoverLetter'))
const ToolsInterviewQuestions = lazy(() => import('@/pages/tools/InterviewQuestions'))
const ToolsExperienceCalculator = lazy(() => import('@/pages/tools/ExperienceCalculator'))
const ToolsNoticePeriod = lazy(() => import('@/pages/tools/NoticePeriodCalculator'))
const ToolsHistory = lazy(() => import('@/pages/tools/History'))

import { ROLES } from '@/utils/constants'

/**
 * Application route tree.
 *
 * Three shells:
 *   PublicLayout    — Navbar + Footer
 *   *Layout         — role dashboards (sidebar shell)
 *   none            — standalone pages (404, 403)
 *
 * Access rules (PRD section 34):
 *   <ProtectedRoute>            any signed-in user
 *   <RoleRoute roles={[...]}>   one specific role
 *   admin paths accept all three roles because the seeded admin needs to review
 *   recruiter and company records; the nav itself only shows admin links to admins.
 */
export default function AppRoutes() {
  return (
    <Routes>
      {/* ------------------------------ public ------------------------------ */}
      <Route element={<PublicLayout />}>
        <Route index element={<Home />} />
        <Route path="jobs" element={<JobSearch />} />
        <Route path="jobs/:id" element={<JobDetails />} />
        <Route path="companies" element={<CompanyDirectory />} />
        <Route path="companies/:slug" element={<CompanyDetails />} />

        {/* --------------------------- career tools ------------------------- */}
        <Route path="tools">
          <Route index element={<ToolsLanding />} />
          <Route path="ats-checker" element={<ToolsAtsChecker />} />
          <Route path="resume-builder" element={<ToolsResumeBuilder />} />
          <Route path="resume-optimizer" element={<ToolsResumeOptimizer />} />
          <Route path="keyword-extractor" element={<ToolsKeywordExtractor />} />
          <Route path="skill-gap" element={<ToolsSkillGap />} />
          <Route path="job-match" element={<ToolsJobMatch />} />
          <Route path="jd-analyzer" element={<ToolsJdAnalyzer />} />
          <Route path="salary-estimator" element={<ToolsSalaryEstimator />} />
          <Route path="pdf-to-word" element={<ToolsPdfToWord />} />
          <Route path="word-to-pdf" element={<ToolsWordToPdf />} />
          <Route path="merge-pdf" element={<ToolsMergePdf />} />
          <Route path="split-pdf" element={<ToolsSplitPdf />} />
          <Route path="compress-pdf" element={<ToolsCompressPdf />} />
          <Route path="pdf-to-images" element={<ToolsPdfToImages />} />
          <Route path="images-to-pdf" element={<ToolsImagesToPdf />} />
          <Route path="rotate-pdf" element={<ToolsRotatePdf />} />
          <Route path="extract-pdf" element={<ToolsExtractPdf />} />
          <Route path="resume-format-converter" element={<ToolsResumeFormatConverter />} />
          <Route path="cover-letter" element={<ToolsCoverLetter />} />
          <Route path="interview-questions" element={<ToolsInterviewQuestions />} />
          <Route path="experience-calculator" element={<ToolsExperienceCalculator />} />
          <Route path="notice-period-calculator" element={<ToolsNoticePeriod />} />
          <Route path="history" element={<ToolsHistory />} />
        </Route>
      </Route>

      {/* -------------------------------- auth ------------------------------ */}
      <Route path="login" element={<Login />} />
      <Route path="register" element={<Register />} />
      <Route path="forgot-password" element={<ForgotPassword />} />
      <Route path="reset-password" element={<ResetPassword />} />

      {/* --------------------------- job seeker ----------------------------- */}
      <Route
        path="dashboard"
        element={
          <ProtectedRoute>
            <SeekerLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<SeekerDashboard />} />
        <Route path="profile" element={<SeekerProfile />} />
        <Route path="resume" element={<SeekerResume />} />
        <Route path="applications" element={<MyApplications />} />
        <Route path="applications/:id" element={<ApplicationDetails />} />
        <Route path="saved-jobs" element={<SavedJobs />} />
        <Route path="job-alerts" element={<JobAlerts />} />
        <Route path="notifications" element={<SeekerNotifications />} />
        <Route path="settings" element={<AccountSettings />} />
      </Route>

      {/* ---------------------------- recruiter ----------------------------- */}
      <Route
        path="recruiter"
        element={
          <RoleRoute roles={[ROLES.RECRUITER, ROLES.ADMIN]}>
            <RecruiterLayout />
          </RoleRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<RecruiterDashboard />} />
        <Route path="company" element={<CompanyProfile />} />
        <Route path="jobs" element={<ManageJobs />} />
        <Route path="jobs/create" element={<CreateJob />} />
        <Route path="jobs/:id/edit" element={<EditJob />} />
        <Route path="jobs/:id" element={<RecruiterJobDetails />} />
        <Route path="jobs/:id/applicants" element={<Applicants />} />
        <Route path="applicants/:applicationId" element={<ApplicantDetails />} />
        <Route path="candidates" element={<Candidates />} />
        <Route path="analytics" element={<RecruiterAnalytics />} />
        <Route path="settings" element={<RecruiterSettings />} />
      </Route>

      {/* ------------------------------ admin -------------------------------- */}
      <Route
        path="admin"
        element={
          <RoleRoute roles={[ROLES.ADMIN]}>
            <AdminLayout />
          </RoleRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="recruiters" element={<AdminRecruiters />} />
        <Route path="companies" element={<AdminCompanies />} />
        <Route path="jobs" element={<AdminJobs />} />
        <Route path="applications" element={<AdminApplications />} />
        <Route path="reports" element={<AdminReports />} />
      </Route>

      {/* ------------------------------- errors ------------------------------ */}
      <Route path="403" element={<Forbidden />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}