import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import DeleteIcon from '@mui/icons-material/Delete'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import { apiRequest } from '@/lib/api'
import type { JobDetailResponse, Photo, PhotoTag } from '../types'

const tags: PhotoTag[] = ['Before', 'During', 'After', 'Other']

async function fileToDataUrl(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function JobDetailPage() {
  const { jobId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [error, setError] = useState('')

  const jobQuery = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => apiRequest<JobDetailResponse>(`/jobs/${jobId}`),
    enabled: Boolean(jobId),
  })

  const detail = jobQuery.data
  const sortedPhotos = useMemo(
    () => [...(detail?.photos ?? [])].sort((a, b) => a.orderIndex - b.orderIndex),
    [detail?.photos]
  )

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['job', jobId] })
    await queryClient.invalidateQueries({ queryKey: ['jobs'] })
  }

  const updateJob = async (payload: Record<string, unknown>) => {
    await apiRequest(`/jobs/${jobId}`, { method: 'PATCH', body: JSON.stringify(payload) })
    await refresh()
  }

  const uploadPhotos = async (files: FileList | null) => {
    if (!files) return
    setError('')
    try {
      for (const file of Array.from(files)) {
        const dataUrl = await fileToDataUrl(file)
        await apiRequest(`/jobs/${jobId}/photos`, {
          method: 'POST',
          body: JSON.stringify({ dataUrl, fileName: file.name }),
        })
      }
      await refresh()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const patchPhoto = async (photoId: string, payload: Record<string, unknown>) => {
    await apiRequest(`/jobs/${jobId}/photos/${photoId}`, { method: 'PATCH', body: JSON.stringify(payload) })
    await refresh()
  }

  const movePhoto = async (photo: Photo, direction: 'up' | 'down') => {
    const current = [...sortedPhotos]
    const idx = current.findIndex(item => item.id === photo.id)
    const target = direction === 'up' ? idx - 1 : idx + 1
    if (idx < 0 || target < 0 || target >= current.length) return
    ;[current[idx], current[target]] = [current[target], current[idx]]

    await apiRequest(`/jobs/${jobId}/photos/reorder`, {
      method: 'POST',
      body: JSON.stringify({ orderedPhotoIds: current.map(item => item.id) }),
    })
    await refresh()
  }

  const deletePhoto = async (photoId: string) => {
    await apiRequest(`/jobs/${jobId}/photos/${photoId}`, { method: 'DELETE' })
    await refresh()
  }

  const generatePdf = async () => {
    if (!detail) return

    const lines = [
      'Field Service Photo Report',
      '',
      `Job Title: ${detail.job.title}`,
      `Customer: ${detail.job.customerName}`,
      `Address: ${detail.job.address}`,
      `Work Order: ${detail.job.workOrderReference ?? '-'}`,
      `Status: ${detail.job.status}`,
      `Created: ${new Date(detail.job.createdAt).toLocaleString()}`,
      `Generated: ${new Date().toLocaleString()}`,
      `Notes: ${detail.job.notes ?? '-'}`,
      '',
      'Photos',
      ...sortedPhotos.flatMap((photo, index) => [
        '',
        `#${index + 1} ${photo.tag ?? 'Other'}`,
        `Uploaded: ${new Date(photo.uploadedAt).toLocaleString()}`,
        `Caption: ${photo.caption ?? '-'}`,
      ]),
    ]

    const escaped = lines
      .map(line => line.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)'))
      .join('\n')

    const stream = `BT /F1 11 Tf 40 800 Td (${escaped}) Tj ET`
    const pdf = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]/Resources<</Font<</F1 4 0 R>>>>/Contents 5 0 R>>endobj
4 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj
5 0 obj<</Length ${stream.length}>>stream
${stream}
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000062 00000 n 
0000000118 00000 n 
0000000244 00000 n 
0000000314 00000 n 
trailer<</Size 6/Root 1 0 R>>
startxref
${380 + stream.length}
%%EOF`
    const blob = new Blob([pdf], { type: 'application/pdf' })
    const objectUrl = URL.createObjectURL(blob)

    await apiRequest(`/jobs/${jobId}/reports`, {
      method: 'POST',
      body: JSON.stringify({ fileReference: objectUrl }),
    })

    navigate(`/jobs/${jobId}/report`, {
      state: {
        objectUrl,
        generatedAt: new Date().toISOString(),
      },
    })
  }

  if (!detail) return <Typography>{jobQuery.isLoading ? 'Loading...' : 'Job not found.'}</Typography>

  return (
    <Stack spacing={2} sx={{ width: '100%', maxWidth: 980, mx: 'auto' }}>
      {error && <Alert severity='error'>{error}</Alert>}

      <Typography variant='h5' fontWeight={700}>
        {detail.job.title}
      </Typography>

      <Card sx={{ border: '1px solid', borderColor: 'divider' }}>
        <CardContent>
          <Stack spacing={1.5}>
            <TextField
              variant='outlined'
              label='Customer Name'
              defaultValue={detail.job.customerName}
              onBlur={e => void updateJob({ customerName: e.target.value })}
            />
            <TextField variant='outlined' label='Address' defaultValue={detail.job.address} onBlur={e => void updateJob({ address: e.target.value })} />
            <TextField
              variant='outlined'
              label='Work Order / Invoice Ref'
              defaultValue={detail.job.workOrderReference}
              onBlur={e => void updateJob({ workOrderReference: e.target.value })}
            />
            <TextField
              variant='outlined'
              select
              label='Status'
              value={detail.job.status}
              onChange={e => void updateJob({ status: e.target.value })}
            >
              <MenuItem value='Draft'>Draft</MenuItem>
              <MenuItem value='In Progress'>In Progress</MenuItem>
              <MenuItem value='Complete'>Complete</MenuItem>
            </TextField>
            <TextField
              variant='outlined'
              label='Job Notes'
              multiline
              minRows={3}
              defaultValue={detail.job.notes}
              onBlur={e => void updateJob({ notes: e.target.value })}
            />
          </Stack>
        </CardContent>
      </Card>

      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent='space-between' alignItems={{ xs: 'flex-start', sm: 'center' }} gap={1}>
        <Typography variant='h6'>Photos ({sortedPhotos.length})</Typography>
        <Button variant='outlined' component='label'>
          Upload Photos
          <input hidden type='file' multiple accept='image/*' onChange={e => void uploadPhotos(e.target.files)} />
        </Button>
      </Stack>

      <Stack spacing={1.5}>
        {sortedPhotos.map(photo => (
          <Card key={photo.id} sx={{ border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Stack spacing={1}>
                <Box component='img' src={photo.fileReference} alt='job' sx={{ width: '100%', maxHeight: 260, objectFit: 'cover' }} />
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
                  <TextField
                    variant='outlined'
                    fullWidth
                    size='small'
                    label='Caption'
                    defaultValue={photo.caption}
                    onBlur={e => void patchPhoto(photo.id, { caption: e.target.value })}
                  />
                  <TextField
                    variant='outlined'
                    select
                    size='small'
                    label='Tag'
                    value={photo.tag ?? 'Other'}
                    onChange={e => void patchPhoto(photo.id, { tag: e.target.value })}
                    sx={{ minWidth: 130 }}
                  >
                    {tags.map(tag => (
                      <MenuItem key={tag} value={tag}>
                        {tag}
                      </MenuItem>
                    ))}
                  </TextField>
                  <IconButton onClick={() => void movePhoto(photo, 'up')}>
                    <ArrowUpwardIcon />
                  </IconButton>
                  <IconButton onClick={() => void movePhoto(photo, 'down')}>
                    <ArrowDownwardIcon />
                  </IconButton>
                  <IconButton onClick={() => void deletePhoto(photo.id)}>
                    <DeleteIcon />
                  </IconButton>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>

      <Button startIcon={<PictureAsPdfIcon />} variant='contained' onClick={() => void generatePdf()}>
        Generate Report
      </Button>
    </Stack>
  )
}
