import { useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Alert,
  Button,
  Card,
  CardContent,
  Grid,
  Stack,
  TextField,
  Typography,
} from '@mui/material'

import { apiRequest } from '@/lib/api'
import type { Customer } from '../types'

const EMPTY_FORM = {
  name: '',
  defaultAddress: '',
  phoneNumber: '',
  email: '',
}

export default function CustomersPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [formError, setFormError] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)

  const customerQuery = useQuery({
    queryKey: ['customers', search],
    queryFn: () => apiRequest<{ items: Customer[] }>(`/customers${search.trim() ? `?search=${encodeURIComponent(search.trim())}` : ''}`),
  })

  const customers = customerQuery.data?.items ?? []

  const createMutation = useMutation({
    mutationFn: () => apiRequest<Customer>('/customers', { method: 'POST', body: JSON.stringify(form) }),
    onSuccess: () => {
      setFormError('')
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      queryClient.invalidateQueries({ queryKey: ['customers-for-autocomplete'] })
      setForm(EMPTY_FORM)
    },
    onError: (error: Error) => setFormError(error.message),
  })

  const isSaving = createMutation.isPending

  return (
    <Stack spacing={2} sx={{ width: '100%', maxWidth: 1100, mx: 'auto' }}>
      <Typography variant='h5' fontWeight={700}>
        Customers
      </Typography>

      <Card sx={{ border: '1px solid', borderColor: 'divider' }}>
        <CardContent>
          <Stack spacing={1.25}>
            <Typography variant='h6' fontWeight={700}>
              Create customer
            </Typography>
            {formError && <Alert severity='error'>{formError}</Alert>}
            <Grid container spacing={1.25}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField label='Name' fullWidth value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} required />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label='Default address'
                  fullWidth
                  value={form.defaultAddress}
                  onChange={event => setForm({ ...form, defaultAddress: event.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label='Phone'
                  fullWidth
                  value={form.phoneNumber}
                  onChange={event => setForm({ ...form, phoneNumber: event.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField label='Email' fullWidth value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} />
              </Grid>
            </Grid>
            <Stack direction='row' gap={1}>
              <Button
                variant='contained'
                disabled={isSaving || !form.name.trim()}
                onClick={() => {
                  createMutation.mutate()
                }}
              >
                Create customer
              </Button>
              <Button variant='outlined' onClick={() => setForm(EMPTY_FORM)}>
                Clear
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Card sx={{ border: '1px solid', borderColor: 'divider' }}>
        <CardContent>
          <Stack spacing={1.5}>
            <Typography variant='h6' fontWeight={700}>
              Customer listing
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} gap={1}>
              <TextField
                fullWidth
                size='small'
                label='Search customers'
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder='Name, address, phone, or email'
              />
            </Stack>

            <Stack spacing={1}>
              {customers.map(customer => (
                <Card key={customer.id} component={RouterLink} to={`/customers/${customer.id}`} sx={{ textDecoration: 'none' }}>
                  <CardContent sx={{ py: 1.5 }}>
                    <Typography fontWeight={700}>{customer.name}</Typography>
                    <Typography color='text.secondary'>{customer.defaultAddress || 'No default address saved'}</Typography>
                    <Typography color='text.secondary'>{customer.email || customer.phoneNumber || 'No contact details saved'}</Typography>
                  </CardContent>
                </Card>
              ))}
              {customers.length === 0 && <Typography color='text.secondary'>No customers found.</Typography>}
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  )
}
