import { create } from 'zustand'

interface AuthState {
  isAuthenticated: boolean
  displayName: string | null
  email: string | null
  roles: string[]
  accessToken: string | null
  setAuth: (auth: {
    isAuthenticated: boolean
    displayName: string | null
    email: string | null
    roles: string[]
    accessToken: string | null
  }) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>(set => ({
  isAuthenticated: false,
  displayName: null,
  email: null,
  roles: [],
  accessToken: null,
  setAuth: auth => set(auth),
  clearAuth: () =>
    set({
      isAuthenticated: false,
      displayName: null,
      email: null,
      roles: [],
      accessToken: null
    })
}))
