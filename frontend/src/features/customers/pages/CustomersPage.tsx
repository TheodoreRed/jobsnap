import { useMemo, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Alert, Box, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography } from '@mui/material'

import { apiRequest } from '@/lib/api'

type CustomerSummary = {
  id: string
  name: string
  jobCount: number
  primaryAddress: string
  latestJobUpdatedAt?: string | null
}

export default function CustomersPage() {
  const queryClient = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', primaryAddress: '' })

  const query = useQuery({
    queryKey: ['customers'],
    queryFn: () => apiRequest<{ items: CustomerSummary[] }>('/customers')
  })

  const customers = useMemo<CustomerSummary[]>(() => {
    return [...(query.data?.items ?? [])].sort((a, b) => b.jobCount - a.jobCount || a.name.localeCompare(b.name))
  }, [query.data?.items])

  const createCustomer = async () => {
    if (!form.name.trim()) {
      setError('Customer name is required.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await apiRequest('/customers', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name.trim(),
          primaryAddress: form.primaryAddress.trim() || undefined
        })
      })
      setCreateOpen(false)
      setForm({ name: '', primaryAddress: '' })
      await queryClient.invalidateQueries({ queryKey: ['customers'] })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to create customer right now.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Box sx={{ width: '100%', maxWidth: 900, mx: 'auto' }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent='space-between' alignItems={{ xs: 'flex-start', sm: 'center' }} sx={{ mb: 1 }}>
        <Typography variant='h5' fontWeight={700}>
          Customers
        </Typography>
        <Button variant='contained' onClick={() => setCreateOpen(true)}>
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
                  {customer.latestJobUpdatedAt && <Typography variant='caption'>Updated {new Date(customer.latestJobUpdatedAt).toLocaleString()}</Typography>}
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        ))}

        {!query.isLoading && customers.length === 0 && <Typography color='text.secondary'>No customers found yet.</Typography>}
        {query.isLoading && <Typography color='text.secondary'>Loading customers...</Typography>}
      </Stack>

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} fullWidth maxWidth='sm'>
        <DialogTitle>Add Customer</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={1.5}>
            {error && <Alert severity='error'>{error}</Alert>}
            <TextField label='Customer name' value={form.name} onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))} autoFocus required />
            <TextField
              label='Primary service address (optional)'
              value={form.primaryAddress}
              onChange={e => setForm(prev => ({ ...prev, primaryAddress: e.target.value }))}
              placeholder='Enter main service location'
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button variant='contained' onClick={() => void createCustomer()} disabled={saving}>
            Save Customer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
