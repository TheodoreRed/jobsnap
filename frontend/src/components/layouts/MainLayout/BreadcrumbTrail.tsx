import { Breadcrumbs, Link, Typography } from '@mui/material'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import { Link as RouterLink, matchPath, useLocation } from 'react-router-dom'
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useT } from '@/i18n/useT'
import { apiRequest } from '@/lib/api'
import type { JobDetailResponse } from '@/features/jobs/types'

type BreadcrumbDefinition = {
  pattern: string
  getLabel: (params: Record<string, string | undefined>) => string
}

type Crumb = {
  href: string
  label: string
}

const JOB_ID_LABEL_MAX_LENGTH = 16

function truncateMiddle(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value
  }

  const frontLength = Math.ceil((maxLength - 1) / 2)
  const backLength = Math.floor((maxLength - 1) / 2)
  return `${value.slice(0, frontLength)}…${value.slice(value.length - backLength)}`
}

export function BreadcrumbTrail() {
  const location = useLocation()
  const t = useT('mainLayout')

  const currentJobId = matchPath({ path: '/jobs/:jobId/*', end: false }, location.pathname)?.params.jobId

  const currentJobQuery = useQuery({
    queryKey: ['job', currentJobId],
    queryFn: () => apiRequest<JobDetailResponse>(`/jobs/${currentJobId}`),
    enabled: Boolean(currentJobId)
  })

  const breadcrumbDefinitions = useMemo<BreadcrumbDefinition[]>(
    () => [
      {
        pattern: '/',
        getLabel: () => t('home')
      },
      {
        pattern: '/dashboard',
        getLabel: () => t('dashboard')
      },
      {
        pattern: '/settings',
        getLabel: () => t('settings')
      },
      {
        pattern: '/about',
        getLabel: () => t('about')
      },
      {
        pattern: '/analytics',
        getLabel: () => t('analytics')
      },
      {
        pattern: '/customers',
        getLabel: () => t('customers')
      },
      {
        pattern: '/jobs/new',
        getLabel: () => t('newJob')
      },
      {
        pattern: '/jobs/:jobId',
        getLabel: params => {
          if (params.jobId && params.jobId === currentJobId && currentJobQuery.data?.job.title) {
            return currentJobQuery.data.job.title
          }

          return t('jobDetails', { id: truncateMiddle(params.jobId ?? '', JOB_ID_LABEL_MAX_LENGTH) })
        }
      },
      {
        pattern: '/jobs/:jobId/report',
        getLabel: () => t('report')
      }
    ],
    [currentJobId, currentJobQuery.data?.job.title, t]
  )

  const crumbs = useMemo<Crumb[]>(() => {
    const segments = location.pathname.split('/').filter(Boolean)
    const candidatePaths = ['/', ...segments.map((_, i) => `/${segments.slice(0, i + 1).join('/')}`)]

    return candidatePaths
      .map(path => {
        const definition = breadcrumbDefinitions.find(route => matchPath({ path: route.pattern, end: true }, path))
        if (!definition) {
          return null
        }

        const match = matchPath({ path: definition.pattern, end: true }, path)
        return {
          href: path,
          label: definition.getLabel(match?.params ?? {})
        }
      })
      .filter((crumb): crumb is Crumb => Boolean(crumb))
  }, [breadcrumbDefinitions, location.pathname])

  if (crumbs.length <= 1) {
    return null
  }

  return (
    <Breadcrumbs separator={<NavigateNextIcon fontSize='small' />} aria-label='breadcrumb' sx={{ mb: 2 }}>
      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1

        if (isLast) {
          return (
            <Typography key={crumb.href} color='text.primary' fontWeight={600}>
              {crumb.label}
            </Typography>
          )
        }

        return (
          <Link
            key={crumb.href}
            component={RouterLink}
            underline='hover'
            color='inherit'
            to={crumb.href}
            sx={{ fontWeight: 500 }}
          >
            {crumb.label}
          </Link>
        )
      })}
    </Breadcrumbs>
  )
}
