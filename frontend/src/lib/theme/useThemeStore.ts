import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type ThemeStore = {
  mode: 'light' | 'dark'
  toggleMode: () => void
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    set => ({
      mode: 'dark',
      toggleMode: () => set(s => ({ mode: s.mode === 'dark' ? 'light' : 'dark' }))
    }),
    { name: 'theme-mode' }
  )
)
