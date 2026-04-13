import { useMemo } from 'react'
import { Link as RouterLink, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Alert, Box, Card, CardContent, Chip, Stack, Typography } from '@mui/material'

import { apiRequest } from '@/lib/api'
import type { Job } from '@/features/jobs/types'

type Customer = {
  id: string
  name: string
  primaryAddress: string
}

export default function CustomerDetailPage() {
  const { customerName: encodedCustomerName } = useParams()
  const customerName = decodeURIComponent(encodedCustomerName ?? '')

  const query = useQuery({
    queryKey: ['customer-jobs', customerName],
    queryFn: () => apiRequest<{ items: Job[] }>('/jobs'),
    enabled: Boolean(customerName)
  })

  const customerQuery = useQuery({
    queryKey: ['customers'],
    queryFn: () => apiRequest<{ items: Customer[] }>('/customers')
  })

  const jobs = useMemo(
    () =>
      (query.data?.items ?? [])
        .filter(job => (job.customerName.trim() || 'Unassigned customer') === customerName)
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [customerName, query.data?.items]
  )

  const customerRecord = useMemo(
    () => customerQuery.data?.items.find(item => item.name === customerName),
    [customerName, customerQuery.data?.items]
  )
  const latestAddress = customerRecord?.primaryAddress || jobs[0]?.address

  return (
    <Box sx={{ width: '100%', maxWidth: 960, mx: 'auto' }}>
      <Typography variant='h5' fontWeight={700} sx={{ mb: 1 }}>
        {customerName || 'Customer'}
      </Typography>
      {latestAddress && (
        <Typography color='text.secondary' sx={{ mb: 2 }}>
          Primary service address: {latestAddress}
        </Typography>
      )}

      {query.isError && <Alert severity='error'>Unable to load customer jobs right now.</Alert>}

      <Stack spacing={1.5}>
        {jobs.map(job => (
          <Card
            key={job.id}
            component={RouterLink}
            to={`/jobs/${job.id}`}
            sx={{ textDecoration: 'none', border: '1px solid', borderColor: 'divider' }}
          >
            <CardContent>
              <Stack direction={{ xs: 'column', md: 'row' }} justifyContent='space-between' gap={1}>
                <Box>
                  <Typography variant='h6'>{job.title}</Typography>
                  <Typography color='text.secondary'>{job.address}</Typography>
                  {job.workOrderReference && <Typography color='text.secondary'>Work order: {job.workOrderReference}</Typography>}
                </Box>
                <Stack direction='row' spacing={1} alignItems='center'>
                  <Chip label={job.status} />
                  <Typography variant='caption'>Updated {new Date(job.updatedAt).toLocaleString()}</Typography>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        ))}

        {!query.isLoading && jobs.length === 0 && <Typography color='text.secondary'>No jobs found for this customer.</Typography>}
        {query.isLoading && <Typography color='text.secondary'>Loading customer details...</Typography>}
      </Stack>
    </Box>
  )
}
