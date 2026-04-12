import { env } from '@/config/env'

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const base = env.API_BASE_URL
  const isAbsolute = /^https?:\/\//i.test(path)
  const url = isAbsolute ? path : `${base}${path.startsWith('/') ? '' : '/'}${path}`

  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    ...init,
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.error ?? `Request failed (${response.status})`)
  }

  return data as T
}
