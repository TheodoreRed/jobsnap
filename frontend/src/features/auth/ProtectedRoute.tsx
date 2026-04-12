import { useMsal } from '@azure/msal-react'
import { LoginPage } from '@/features/auth/LoginPage'

function ProtectedRoute({ children }: Readonly<{ children: React.ReactNode }>) {
  const { accounts } = useMsal()
  if (accounts.length === 0) return <LoginPage />
  return <>{children}</>
}

export default ProtectedRoute
