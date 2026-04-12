import { useEffect, useRef } from 'react'
import { useMsal, useIsAuthenticated } from '@azure/msal-react'
import { useAuthStore } from './auth-store'
import { apiScope } from './msal-config'

function decodeJwtPayload(token: string): Record<string, unknown> {
  const base64Url = token.split('.')[1]
  const base64 = base64Url.replaceAll('-', '+').replaceAll('_', '/')
  const json = decodeURIComponent(
    atob(base64)
      .split('')
      .map(c => {
        const code = c.codePointAt(0) ?? 0
        return '%' + ('00' + code.toString(16)).slice(-2)
      })
      .join('')
  )
  return JSON.parse(json)
}

export function AuthInitializer({ children }: Readonly<{ children: React.ReactNode }>) {
  const { instance, accounts } = useMsal()
  const isAuthenticated = useIsAuthenticated()
  const setAuth = useAuthStore(s => s.setAuth)
  const clearAuth = useAuthStore(s => s.clearAuth)
  const initialized = useRef(false)

  useEffect(() => {
    if (!isAuthenticated || accounts.length === 0) {
      clearAuth()
      initialized.current = false
      return
    }

    if (initialized.current) return
    initialized.current = true

    const account = accounts[0]

    instance
      .acquireTokenSilent({
        scopes: [apiScope],
        account
      })
      .then(response => {
        const decoded = decodeJwtPayload(response.accessToken)
        const roles = (decoded.roles as string[]) || []

        setAuth({
          isAuthenticated: true,
          displayName: account.name || null,
          email: account.username || (decoded.email as string) || (decoded.preferred_username as string) || null,
          roles,
          accessToken: response.accessToken
        })
      })
      .catch(err => {
        console.error('Failed to acquire API token:', err)
        // Still set as authenticated with id token info, just no roles
        setAuth({
          isAuthenticated: true,
          displayName: account.name || null,
          email: account.username || null,
          roles: [],
          accessToken: null
        })
      })
  }, [isAuthenticated, accounts, instance, setAuth, clearAuth])

  return <>{children}</>
}
