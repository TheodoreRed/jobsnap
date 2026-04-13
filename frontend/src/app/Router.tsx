import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { useIsAuthenticated } from '@azure/msal-react'
import NotFoundPage from '@/features/not-found/pages/NotFoundPage'
import MainLayout from '@/components/layouts/MainLayout/MainLayout'
import { LoginPage } from '@/features/auth/LoginPage'
import { LoadingScreen } from '@/components/LoadingScreen'

const HomePage = lazy(() => import('@/features/home/pages/HomePage'))
const SettingsPage = lazy(() => import('@/features/settings/pages/SettingsPage'))
const CreateJobPage = lazy(() => import('@/features/jobs/pages/CreateJobPage'))
const DashboardPage = lazy(() => import('@/features/dashboard/pages/DashboardPage'))
const JobDetailPage = lazy(() => import('@/features/jobs/pages/JobDetailPage'))
const ReportPage = lazy(() => import('@/features/reports/pages/ReportPage'))
const AnalyticsPage = lazy(() => import('@/features/analytics/pages/AnalyticsPage'))
const CustomersPage = lazy(() => import('@/features/customers/pages/CustomersPage'))
const AboutPage = lazy(() => import('@/features/about/pages/AboutPage'))

function ProtectedRoute({ children }: Readonly<{ children: React.ReactNode }>) {
  const isAuthenticated = useIsAuthenticated()
  if (!isAuthenticated) return <LoginPage />
  return <>{children}</>
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route path='/' element={<HomePage />} />
            <Route path='/dashboard' element={<DashboardPage />} />
            <Route path='/analytics' element={<AnalyticsPage />} />
            <Route path='/customers' element={<CustomersPage />} />
            <Route path='/jobs/new' element={<CreateJobPage />} />
            <Route path='/jobs/:jobId' element={<JobDetailPage />} />
            <Route path='/jobs/:jobId/report' element={<ReportPage />} />
            <Route path='/settings' element={<SettingsPage />} />
            <Route path='/about' element={<AboutPage />} />
            <Route path='*' element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default AppRouter
