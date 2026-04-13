import { Link as RouterLink, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Alert, Box, Button, Card, CardContent, Chip, Divider, Stack, TextField, Typography } from '@mui/material'

import { apiRequest } from '@/lib/api'
import type { Customer, CustomerDetailResponse } from '../types'

export default function CustomerDetailPage() {
  const { customerId } = useParams()
  const queryClient = useQueryClient()
  const [formError, setFormError] = useState('')
  const [form, setForm] = useState({
    name: '',
    defaultAddress: '',
    phoneNumber: '',
    email: '',
  })

  const detailQuery = useQuery({
    queryKey: ['customer', customerId],
    queryFn: () => apiRequest<CustomerDetailResponse>(`/customers/${customerId}`),
    enabled: Boolean(customerId),
  })

  useEffect(() => {
    const customer = detailQuery.data?.customer
    if (!customer) return
    setForm({
      name: customer.name,
      defaultAddress: customer.defaultAddress ?? '',
      phoneNumber: customer.phoneNumber ?? '',
      email: customer.email ?? '',
    })
  }, [detailQuery.data?.customer])

  const updateMutation = useMutation({
    mutationFn: () => apiRequest<Customer>(`/customers/${customerId}`, { method: 'PATCH', body: JSON.stringify(form) }),
    onSuccess: customer => {
      setFormError('')
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      queryClient.invalidateQueries({ queryKey: ['customer', customer.id] })
      queryClient.invalidateQueries({ queryKey: ['customers-for-autocomplete'] })
    },
    onError: (error: Error) => setFormError(error.message),
  })

  if (!detailQuery.data?.customer) {
    return <Typography>{detailQuery.isLoading ? 'Loading customer...' : 'Customer not found.'}</Typography>
  }

  const customer = detailQuery.data.customer

  return (
    <Stack spacing={2} sx={{ width: '100%', maxWidth: 1000, mx: 'auto' }}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent='space-between' gap={1}>
        <Box>
          <Typography variant='h5' fontWeight={700}>
            {customer.name}
          </Typography>
          <Typography color='text.secondary'>{customer.defaultAddress || 'No default address saved'}</Typography>
        </Box>
        <Button component={RouterLink} to={`/jobs/new?customerId=${customer.id}`} variant='contained'>
          Create job for this customer
        </Button>
      </Stack>

      <Card sx={{ border: '1px solid', borderColor: 'divider' }}>
        <CardContent>
          <Stack spacing={1.25}>
            <Typography variant='h6' fontWeight={700}>
              Customer details
            </Typography>
            {formError && <Alert severity='error'>{formError}</Alert>}
            <TextField label='Name' value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} required />
            <TextField
              label='Default address'
              value={form.defaultAddress}
              onChange={event => setForm({ ...form, defaultAddress: event.target.value })}
            />
            <TextField label='Phone' value={form.phoneNumber} onChange={event => setForm({ ...form, phoneNumber: event.target.value })} />
            <TextField label='Email' value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} />
            <Button variant='contained' onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending || !form.name.trim()}>
              Save changes
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Card sx={{ border: '1px solid', borderColor: 'divider' }}>
        <CardContent>
          <Stack spacing={1.5}>
            <Typography variant='h6' fontWeight={700}>
              Jobs for this customer
            </Typography>
            <Divider />
            <Stack spacing={1}>
              {detailQuery.data.jobs.map(job => (
                <Box
                  key={job.id}
                  component={RouterLink}
                  to={`/jobs/${job.id}`}
                  sx={{
                    textDecoration: 'none',
                    p: 1.25,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1.25,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Box>
                    <Typography fontWeight={600}>{job.title}</Typography>
                    <Typography variant='body2' color='text.secondary'>
                      {job.address}
                    </Typography>
                  </Box>
                  <Chip label={job.status} size='small' />
                </Box>
              ))}
              {detailQuery.data.jobs.length === 0 && <Typography color='text.secondary'>No jobs linked to this customer yet.</Typography>}
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  )
}
