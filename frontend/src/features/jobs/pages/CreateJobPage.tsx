import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Alert, Button, MenuItem, Stack, TextField, Typography } from '@mui/material'

import { apiRequest } from '@/lib/api'
import type { Job, JobStatus } from '../types'

export default function CreateJobPage() {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '',
    customerName: '',
    address: '',
    workOrderReference: '',
    description: '',
    status: 'Draft' as JobStatus,
  })

  const onSave = async () => {
    setSaving(true)
    setError('')
    try {
      const created = await apiRequest<Job>('/jobs', {
        method: 'POST',
        body: JSON.stringify(form),
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
      <TextField
        variant='outlined'
        label='Customer name'
        value={form.customerName}
        onChange={e => setForm({ ...form, customerName: e.target.value })}
        required
      />
      <TextField variant='outlined' label='Service address' value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} required />
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
