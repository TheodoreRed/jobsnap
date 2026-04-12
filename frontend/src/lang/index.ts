import en from './en'
import es from './es'
import fr from './fr'

export type Locale = 'en' | 'es' | 'fr'

export type NamespaceMessages = Record<string, string>
export type LocaleMessages = Record<string, NamespaceMessages>

export const messages: Record<Locale, LocaleMessages> = { en, es, fr }

export function flattenMessages(localeMessages: LocaleMessages): Record<string, string> {
  const flat: Record<string, string> = {}
  for (const [namespace, keys] of Object.entries(localeMessages)) {
    for (const [key, value] of Object.entries(keys)) {
      flat[`${namespace}.${key}`] = value
    }
  }
  return flat
}

export function detectLocale(): Locale {
  const browser = navigator.language.split('-')[0]
  return browser in messages ? (browser as Locale) : 'en'
}
