import { create } from 'zustand'
import type { Locale } from '@/lang'
import { detectLocale } from '@/lang'

type LocaleStore = {
  locale: Locale
  setLocale: (lng: Locale) => void
}

export const useLocaleStore = create<LocaleStore>(set => ({
  locale: (localStorage.getItem('locale') as Locale) || detectLocale(),
  setLocale: (lng: Locale) => {
    localStorage.setItem('locale', lng)
    set({ locale: lng })
  }
}))
