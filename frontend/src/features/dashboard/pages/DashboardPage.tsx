import { useMemo } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Box, Button, Card, CardContent, Chip, Grid, Stack, Typography } from '@mui/material'

import { apiRequest } from '@/lib/api'
import type { Job } from '@/features/jobs/types'

export default function DashboardPage() {
  const query = useQuery({
    queryKey: ['dashboard-jobs'],
    queryFn: () => apiRequest<{ items: Job[] }>('/jobs'),
  })

  const jobs = query.data?.items ?? []
  const metrics = useMemo(() => {
    const draft = jobs.filter(job => job.status === 'Draft').length
    const inProgress = jobs.filter(job => job.status === 'In Progress').length
    const complete = jobs.filter(job => job.status === 'Complete').length
    const photos = jobs.reduce((accumulator, job) => accumulator + job.photoCount, 0)
    return { draft, inProgress, complete, photos }
  }, [jobs])

  const recent = useMemo(() => [...jobs].slice(0, 5), [jobs])

  return (
    <Stack spacing={2} sx={{ width: '100%', maxWidth: 980, mx: 'auto' }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent='space-between' gap={1}>
        <Typography variant='h5' fontWeight={700}>
          Dashboard
        </Typography>
        <Button component={RouterLink} to='/jobs/new' variant='contained'>
          Create New Job
        </Button>
      </Stack>

      <Grid container spacing={1.5}>
        <Grid size={{ xs: 6, md: 3 }}>
          <Card sx={{ border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Typography variant='caption'>Draft</Typography>
              <Typography variant='h5'>{metrics.draft}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Card sx={{ border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Typography variant='caption'>In Progress</Typography>
              <Typography variant='h5'>{metrics.inProgress}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Card sx={{ border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Typography variant='caption'>Complete</Typography>
              <Typography variant='h5'>{metrics.complete}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Card sx={{ border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Typography variant='caption'>Total Photos</Typography>
              <Typography variant='h5'>{metrics.photos}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ border: '1px solid', borderColor: 'divider' }}>
        <CardContent>
          <Typography variant='h6' sx={{ mb: 1.5 }}>
            Recent Jobs
          </Typography>
          <Stack spacing={1}>
            {recent.map(job => (
              <Box
                key={job.id}
                component={RouterLink}
                to={`/jobs/${job.id}`}
                sx={{
                  textDecoration: 'none',
                  p: 1.25,
                  borderRadius: 1.5,
                  border: '1px solid',
                  borderColor: 'divider',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Box>
                  <Typography fontWeight={600}>{job.title}</Typography>
                  <Typography variant='body2' color='text.secondary'>
                    {job.customerName}
                  </Typography>
                </Box>
                <Chip label={job.status} size='small' />
              </Box>
            ))}
            {recent.length === 0 && <Typography color='text.secondary'>No jobs yet.</Typography>}
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  )
}
