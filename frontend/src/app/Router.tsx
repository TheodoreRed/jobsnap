import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import MainLayout from '@/components/layouts/MainLayout/MainLayout'
import NotFoundPage from '@/features/not-found/pages/NotFoundPage'
import JobsListPage from '@/features/jobs/pages/JobsListPage'
import CreateJobPage from '@/features/jobs/pages/CreateJobPage'
import JobDetailPage from '@/features/jobs/pages/JobDetailPage'
import ReportPage from '@/features/reports/pages/ReportPage'

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path='/' element={<JobsListPage />} />
          <Route path='/jobs/new' element={<CreateJobPage />} />
          <Route path='/jobs/:jobId' element={<JobDetailPage />} />
          <Route path='/jobs/:jobId/report' element={<ReportPage />} />
          <Route path='/settings' element={<Navigate to='/' replace />} />
          <Route path='*' element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default AppRouter
