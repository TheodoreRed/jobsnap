import { useMemo, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Box,
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

export default function CustomersPage() {
  const [search, setSearch] = useState('')
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)

  const customerQuery = useQuery({
    queryKey: ['customers', search],
    queryFn: () => apiRequest<{ items: Customer[] }>(`/customers${search.trim() ? `?search=${encodeURIComponent(search.trim())}` : ''}`),
  })

  const customers = customerQuery.data?.items ?? []

  const selectedCustomer = useMemo(
    () => customers.find(customer => customer.id === selectedCustomerId) ?? customers[0] ?? null,
    [customers, selectedCustomerId]
  )

  const detailQuery = useQuery({
    queryKey: ['customer', selectedCustomer?.id],
    queryFn: () => apiRequest<CustomerDetailResponse>(`/customers/${selectedCustomer?.id}`),
    enabled: Boolean(selectedCustomer?.id),
  })

  return (
    <Stack spacing={2} sx={{ width: '100%', maxWidth: 1100, mx: 'auto' }}>
      <Typography variant='h5' fontWeight={700}>
        Customers
      </Typography>

      <TextField
        label='Search customers'
        value={search}
        onChange={event => {
          setSearch(event.target.value)
          setSelectedCustomerId(null)
        }}
        placeholder='Name, address, phone, or email'
      />

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems='stretch'>
        <Card sx={{ flex: 1, border: '1px solid', borderColor: 'divider', minHeight: 380 }}>
          <CardContent sx={{ p: 0 }}>
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

        <Card sx={{ flex: 2, border: '1px solid', borderColor: 'divider', minHeight: 380 }}>
          <CardContent>
            {!selectedCustomer ? (
              <Typography color='text.secondary'>Select a customer to view details and jobs.</Typography>
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
