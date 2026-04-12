import { useMemo, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'

import { apiRequest } from '@/lib/api'
import type { Job, JobStatus } from '../types'

const statuses: JobStatus[] = ['Draft', 'In Progress', 'Complete']

export default function JobsListPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'All' | JobStatus>('All')

  const query = useQuery({
    queryKey: ['jobs', search, status],
    queryFn: () => {
      const query = new URLSearchParams()
      if (search.trim()) query.set('search', search.trim())
      if (status !== 'All') query.set('status', status)
      return apiRequest<{ items: Job[] }>(`/jobs?${query.toString()}`)
    },
  })

  const jobs = useMemo(() => query.data?.items ?? [], [query.data])

  return (
    <Stack spacing={2} sx={{ width: '100%', maxWidth: 980 }}>
      <Stack direction='row' alignItems='center' justifyContent='space-between' flexWrap='wrap' gap={1}>
        <Typography variant='h5' fontWeight={700}>
          Field Service Photo Logger
        </Typography>
        <Button component={RouterLink} to='/jobs/new' variant='contained'>
          Create New Job
        </Button>
      </Stack>

      <Stack direction={{ xs: 'column', sm: 'row' }} gap={1}>
        <TextField
          fullWidth
          variant='outlined'
          placeholder='Search title, customer, address, work order'
          value={search}
          onChange={event => setSearch(event.target.value)}
        />
        <TextField select variant='outlined' sx={{ minWidth: { xs: 120, sm: 170 } }} value={status} onChange={event => setStatus(event.target.value as any)}>
          <MenuItem value='All'>All statuses</MenuItem>
          {statuses.map(item => (
            <MenuItem key={item} value={item}>
              {item}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      {jobs.map(job => (
        <Card key={job.id} component={RouterLink} to={`/jobs/${job.id}`} sx={{ textDecoration: 'none', border: '1px solid', borderColor: 'divider' }}>
          <CardContent>
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent='space-between' alignItems={{ xs: 'flex-start', sm: 'center' }} gap={1}>
              <Box>
                <Typography variant='h6'>{job.title}</Typography>
                <Typography color='text.secondary'>{job.customerName}</Typography>
                <Typography color='text.secondary'>{job.address}</Typography>
              </Box>
              <Stack alignItems='flex-end' spacing={1}>
                <Chip label={job.status} />
                <Typography variant='body2'>{job.photoCount} photos</Typography>
                <Typography variant='caption'>Updated {new Date(job.updatedAt).toLocaleString()}</Typography>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      ))}

      {!query.isLoading && jobs.length === 0 && <Typography>No jobs found.</Typography>}
    </Stack>
  )
}
