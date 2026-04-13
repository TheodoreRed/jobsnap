import { useEffect, useMemo, useState } from 'react'
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Alert, Autocomplete, Button, Link, MenuItem, Stack, TextField, Typography } from '@mui/material'

import { apiRequest } from '@/lib/api'
import type { Customer } from '@/features/customers/types'
import type { Job, JobStatus } from '../types'

export default function CreateJobPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const prefilledCustomerId = searchParams.get('customerId') ?? ''
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '',
    customerName: '',
    customerId: '',
    address: '',
    workOrderReference: '',
    description: '',
    status: 'Draft' as JobStatus,
  })

  const customersQuery = useQuery({
    queryKey: ['customers-for-autocomplete'],
    queryFn: () => apiRequest<{ items: Customer[] }>('/customers'),
  })

  const customers = useMemo(() => customersQuery.data?.items ?? [], [customersQuery.data?.items])
  const selectedCustomer = useMemo(() => customers.find(customer => customer.id === form.customerId) ?? null, [customers, form.customerId])
  const prefilledCustomer = useMemo(
    () => customers.find(customer => customer.id === prefilledCustomerId) ?? null,
    [customers, prefilledCustomerId]
  )

  useEffect(() => {
    if (!prefilledCustomer || form.customerId) return
    setForm(current => ({
      ...current,
      customerName: prefilledCustomer.name,
      customerId: prefilledCustomer.id,
      address: prefilledCustomer.defaultAddress ?? current.address,
    }))
  }, [prefilledCustomer, form.customerId])

  const onSave = async () => {
    if (!selectedCustomer) {
      setError('Please select an existing customer before saving the job.')
      return
    }

    setSaving(true)
    setError('')
    try {
      const created = await apiRequest<Job>('/jobs', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          customerName: selectedCustomer.name,
          customerId: selectedCustomer.id,
        }),
      })
      navigate(`/jobs/${created.id}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to save job')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Stack spacing={2} sx={{ width: '100%', maxWidth: 760, mx: 'auto' }}>
      <Typography variant='h5' fontWeight={700}>
        Create Job
      </Typography>
      {error && <Alert severity='error'>{error}</Alert>}
      <TextField variant='outlined' label='Job title' value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
      <Autocomplete
        options={customers}
        value={selectedCustomer}
        onChange={(_, selected) => {
          if (!selected || typeof selected === 'string') return
          setForm({
            ...form,
            customerName: selected.name,
            customerId: selected.id,
            address: selected.defaultAddress ?? '',
          })
        }}
        getOptionLabel={option => (typeof option === 'string' ? option : option.name)}
        renderInput={params => <TextField {...params} label='Customer' required helperText='Choose from existing customers only.' />}
      />
      <TextField variant='outlined' label='Service address' value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} required />
      <Typography variant='body2' color='text.secondary'>
        Need a new customer first? Create one on the{' '}
        <Link component={RouterLink} to='/customers' underline='hover'>
          customers page
        </Link>
        .
      </Typography>
      <TextField
        variant='outlined'
        label='Work order / invoice ref (optional)'
        value={form.workOrderReference}
        onChange={e => setForm({ ...form, workOrderReference: e.target.value })}
      />
      <TextField
        variant='outlined'
        multiline
        minRows={3}
        label='Description (optional)'
        value={form.description}
        onChange={e => setForm({ ...form, description: e.target.value })}
      />
      <TextField select variant='outlined' label='Status' value={form.status} onChange={e => setForm({ ...form, status: e.target.value as JobStatus })}>
        <MenuItem value='Draft'>Draft</MenuItem>
        <MenuItem value='In Progress'>In Progress</MenuItem>
        <MenuItem value='Complete'>Complete</MenuItem>
      </TextField>
      <Stack direction={{ xs: 'column', sm: 'row' }} gap={1} sx={{ pt: 0.5, alignItems: { sm: 'center' } }}>
        <Button variant='contained' onClick={onSave} disabled={saving || !selectedCustomer}>
          Save
        </Button>
        <Button variant='outlined' onClick={() => navigate('/')}>
          Cancel
        </Button>
      </Stack>
    </Stack>
  )
}
