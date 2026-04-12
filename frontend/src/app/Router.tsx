import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { useIsAuthenticated } from '@azure/msal-react'
import NotFoundPage from '@/features/not-found/pages/NotFoundPage'
import MainLayout from '@/components/layouts/MainLayout/MainLayout'
import { LoginPage } from '@/features/auth/LoginPage'
import { LoadingScreen } from '@/components/LoadingScreen'

const HomePage = lazy(() => import('@/features/home/pages/HomePage'))
const SettingsPage = lazy(() => import('@/features/settings/pages/SettingsPage'))

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
            <Route path='/settings' element={<SettingsPage />} />
            <Route path='*' element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default AppRouter
