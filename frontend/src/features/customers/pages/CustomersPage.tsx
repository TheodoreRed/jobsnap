import { useEffect, useMemo, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from '@mui/material'

import { apiRequest } from '@/lib/api'
import type { Customer, CustomerDetailResponse } from '../types'

const EMPTY_FORM = {
  name: '',
  defaultAddress: '',
  phoneNumber: '',
  email: '',
}

export default function CustomersPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)
  const [formError, setFormError] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)

  const customerQuery = useQuery({
    queryKey: ['customers', search],
    queryFn: () => apiRequest<{ items: Customer[] }>(`/customers${search.trim() ? `?search=${encodeURIComponent(search.trim())}` : ''}`),
  })

  const customers = customerQuery.data?.items ?? []

  const selectedCustomer = useMemo(
    () => customers.find(customer => customer.id === selectedCustomerId) ?? customers[0] ?? null,
    [customers, selectedCustomerId]
  )

  useEffect(() => {
    if (!selectedCustomer) {
      setForm(EMPTY_FORM)
      return
    }

    setForm({
      name: selectedCustomer.name,
      defaultAddress: selectedCustomer.defaultAddress ?? '',
      phoneNumber: selectedCustomer.phoneNumber ?? '',
      email: selectedCustomer.email ?? '',
    })
  }, [selectedCustomer])

  const detailQuery = useQuery({
    queryKey: ['customer', selectedCustomer?.id],
    queryFn: () => apiRequest<CustomerDetailResponse>(`/customers/${selectedCustomer?.id}`),
    enabled: Boolean(selectedCustomer?.id),
  })

  const createMutation = useMutation({
    mutationFn: () => apiRequest<Customer>('/customers', { method: 'POST', body: JSON.stringify(form) }),
    onSuccess: customer => {
      setFormError('')
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      queryClient.invalidateQueries({ queryKey: ['customers-for-autocomplete'] })
      setSelectedCustomerId(customer.id)
    },
    onError: (error: Error) => setFormError(error.message),
  })

  const updateMutation = useMutation({
    mutationFn: () => apiRequest<Customer>(`/customers/${selectedCustomer?.id}`, { method: 'PATCH', body: JSON.stringify(form) }),
    onSuccess: customer => {
      setFormError('')
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      queryClient.invalidateQueries({ queryKey: ['customer', customer.id] })
      queryClient.invalidateQueries({ queryKey: ['customers-for-autocomplete'] })
    },
    onError: (error: Error) => setFormError(error.message),
  })

  const isEditingExisting = Boolean(selectedCustomer)
  const isSaving = createMutation.isPending || updateMutation.isPending

  return (
    <Stack spacing={2} sx={{ width: '100%', maxWidth: 1200, mx: 'auto' }}>
      <Typography variant='h5' fontWeight={700}>
        Customers
      </Typography>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems='stretch'>
        <Card sx={{ flex: 1, border: '1px solid', borderColor: 'divider', minHeight: 380 }}>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ p: 1.5, display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                size='small'
                label='Search customers'
                value={search}
                onChange={event => {
                  setSearch(event.target.value)
                  setSelectedCustomerId(null)
                }}
                placeholder='Name, address, phone, or email'
              />
              <Button
                variant='outlined'
                onClick={() => {
                  setSelectedCustomerId(null)
                  setFormError('')
                  setForm(EMPTY_FORM)
                }}
              >
                New
              </Button>
            </Box>
            <Divider />
            <List disablePadding>
              {customers.map(customer => (
                <ListItemButton
                  key={customer.id}
                  selected={(selectedCustomerId ?? customers[0]?.id) === customer.id}
                  onClick={() => setSelectedCustomerId(customer.id)}
                >
                  <ListItemText
                    primary={customer.name}
                    secondary={customer.defaultAddress || customer.email || customer.phoneNumber || 'No details saved'}
                  />
                </ListItemButton>
              ))}
              {customers.length === 0 && (
                <Box sx={{ px: 2, py: 3 }}>
                  <Typography color='text.secondary'>No customers found.</Typography>
                </Box>
              )}
            </List>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1.5, border: '1px solid', borderColor: 'divider', minHeight: 380 }}>
          <CardContent>
            <Stack spacing={1.25}>
              <Typography variant='h6' fontWeight={700}>
                {isEditingExisting ? 'Edit customer' : 'Create customer'}
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

              <Stack direction='row' gap={1}>
                <Button
                  variant='contained'
                  disabled={isSaving || !form.name.trim()}
                  onClick={() => {
                    if (isEditingExisting) {
                      updateMutation.mutate()
                      return
                    }
                    createMutation.mutate()
                  }}
                >
                  {isEditingExisting ? 'Save changes' : 'Create customer'}
                </Button>
                {!isEditingExisting && (
                  <Button variant='outlined' onClick={() => setForm(EMPTY_FORM)}>
                    Clear
                  </Button>
                )}
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        <Card sx={{ flex: 2, border: '1px solid', borderColor: 'divider', minHeight: 380 }}>
          <CardContent>
            {!selectedCustomer ? (
              <Typography color='text.secondary'>Select a customer to view all linked jobs.</Typography>
            ) : (
              <Stack spacing={1.5}>
                <Box>
                  <Typography variant='h6' fontWeight={700}>
                    {selectedCustomer.name}
                  </Typography>
                  <Typography color='text.secondary'>{selectedCustomer.defaultAddress || 'No default address saved'}</Typography>
                  <Typography color='text.secondary'>{selectedCustomer.phoneNumber || 'No phone number saved'}</Typography>
                  <Typography color='text.secondary'>{selectedCustomer.email || 'No email saved'}</Typography>
                </Box>

                <Divider />

                <Typography variant='subtitle1' fontWeight={600}>
                  Jobs
                </Typography>
                <Stack spacing={1}>
                  {(detailQuery.data?.jobs ?? []).map(job => (
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
                  {(detailQuery.data?.jobs.length ?? 0) === 0 && (
                    <Typography color='text.secondary'>No jobs linked to this customer yet.</Typography>
                  )}
                </Stack>
              </Stack>
            )}
          </CardContent>
        </Card>
      </Stack>
    </Stack>
  )
}
