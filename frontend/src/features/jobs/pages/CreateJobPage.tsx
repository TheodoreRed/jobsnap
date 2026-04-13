import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Alert, Autocomplete, Button, Checkbox, FormControlLabel, MenuItem, Stack, TextField, Typography } from '@mui/material'

import { apiRequest } from '@/lib/api'
import type { Customer } from '@/features/customers/types'
import type { Job, JobStatus } from '../types'

function normalizeName(value: string) {
  return value.trim().toLowerCase()
}

export default function CreateJobPage() {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveCustomer, setSaveCustomer] = useState(true)
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

  const customers = customersQuery.data?.items ?? []
  const existingCustomerMatch = useMemo(
    () => customers.find(customer => normalizeName(customer.name) === normalizeName(form.customerName)),
    [customers, form.customerName]
  )

  const shouldShowSaveCustomer = Boolean(form.customerName.trim()) && !existingCustomerMatch

  const onSave = async () => {
    setSaving(true)
    setError('')
    try {
      const created = await apiRequest<Job>('/jobs', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          customerId: existingCustomerMatch?.id || undefined,
          saveCustomer: shouldShowSaveCustomer ? saveCustomer : false,
        }),
      })
      navigate(`/jobs/${created.id}`)
    } catch (err: any) {
      setError(err.message)
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
        freeSolo
        options={customers}
        value={existingCustomerMatch ?? null}
        inputValue={form.customerName}
        onInputChange={(_, value) => setForm({ ...form, customerName: value, customerId: '' })}
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
        renderInput={params => <TextField {...params} label='Customer name' required />}
      />
      <TextField variant='outlined' label='Service address' value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} required />
      {shouldShowSaveCustomer ? (
        <FormControlLabel
          control={<Checkbox checked={saveCustomer} onChange={event => setSaveCustomer(event.target.checked)} />}
          label='Save this customer'
        />
      ) : null}
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
        <Button variant='contained' onClick={onSave} disabled={saving}>
          Save
        </Button>
        <Button variant='outlined' onClick={() => navigate('/')}>
          Cancel
        </Button>
      </Stack>
    </Stack>
  )
}
