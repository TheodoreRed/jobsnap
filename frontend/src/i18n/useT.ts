import { useIntl } from 'react-intl'
import type { PrimitiveType } from 'react-intl'

export type TValues = Record<string, PrimitiveType>

export function useT(namespace?: string) {
  const intl = useIntl()

  return (key: string, values?: TValues) => intl.formatMessage({ id: namespace ? `${namespace}.${key}` : key }, values)
}
