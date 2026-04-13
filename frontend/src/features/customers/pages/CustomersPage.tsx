import { useMemo } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Box, Button, Card, CardContent, Chip, Stack, Typography } from '@mui/material'

import { apiRequest } from '@/lib/api'
import type { Job } from '@/features/jobs/types'

type CustomerSummary = {
  name: string
  jobCount: number
  primaryAddress: string
  lastUpdatedAt: string
}

export default function CustomersPage() {
  const query = useQuery({
    queryKey: ['customers'],
    queryFn: () => apiRequest<{ items: Job[] }>('/jobs')
  })

  const customers = useMemo<CustomerSummary[]>(() => {
    const map = new Map<string, CustomerSummary>()

    for (const job of query.data?.items ?? []) {
      const key = job.customerName.trim() || 'Unassigned customer'
      const existing = map.get(key)
      if (!existing) {
        map.set(key, {
          name: key,
          jobCount: 1,
          primaryAddress: job.address,
          lastUpdatedAt: job.updatedAt
        })
        continue
      }

      existing.jobCount += 1
      if (new Date(job.updatedAt).getTime() > new Date(existing.lastUpdatedAt).getTime()) {
        existing.lastUpdatedAt = job.updatedAt
        existing.primaryAddress = job.address
      }
    }

    return [...map.values()].sort((a, b) => b.jobCount - a.jobCount || a.name.localeCompare(b.name))
  }, [query.data?.items])

  return (
    <Box sx={{ width: '100%', maxWidth: 900, mx: 'auto' }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent='space-between' alignItems={{ xs: 'flex-start', sm: 'center' }} sx={{ mb: 1 }}>
        <Typography variant='h5' fontWeight={700}>
          Customers
        </Typography>
        <Button component={RouterLink} to='/jobs/new' variant='contained'>
          Add Customer
        </Button>
      </Stack>
      <Typography color='text.secondary' sx={{ mb: 2.5 }}>
        View every customer in one place and open a detailed page for job history.
      </Typography>

      <Stack spacing={1.5}>
        {customers.map(customer => (
          <Card
            key={customer.name}
            component={RouterLink}
            to={`/customers/${encodeURIComponent(customer.name)}`}
            sx={{ textDecoration: 'none', border: '1px solid', borderColor: 'divider' }}
          >
            <CardContent>
              <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent='space-between' gap={1}>
                <Box>
                  <Typography variant='h6'>{customer.name}</Typography>
                  <Typography color='text.secondary'>Primary service address: {customer.primaryAddress}</Typography>
                </Box>
                <Stack direction='row' spacing={1} alignItems='center'>
                  <Chip label={`${customer.jobCount} jobs`} />
                  <Typography variant='caption'>Updated {new Date(customer.lastUpdatedAt).toLocaleString()}</Typography>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        ))}

        {!query.isLoading && customers.length === 0 && <Typography color='text.secondary'>No customers found yet.</Typography>}
        {query.isLoading && <Typography color='text.secondary'>Loading customers...</Typography>}
      </Stack>
    </Box>
  )
}
