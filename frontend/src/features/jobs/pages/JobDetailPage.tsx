import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Grid,
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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed')
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

    const { buildReportPdf, defaultReportOptions } = await import('@/features/reports/report-generator')
    const generatedReport = await buildReportPdf(detail, sortedPhotos, defaultReportOptions(navigator.language))

    await apiRequest(`/jobs/${jobId}/reports`, {
      method: 'POST',
      body: JSON.stringify({ fileReference: generatedReport.objectUrl }),
    })

    navigate(`/jobs/${jobId}/report`, {
      state: generatedReport,
    })
  }


  if (!detail) return <Typography>{jobQuery.isLoading ? 'Loading...' : 'Job not found.'}</Typography>

  return (
    <Stack spacing={2} sx={{ width: '100%', maxWidth: 1280, mx: 'auto' }}>
      {error && <Alert severity='error'>{error}</Alert>}

      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent='space-between'
        alignItems={{ xs: 'flex-start', md: 'center' }}
        gap={1}
      >
        <Box>
          <Typography variant='h5' fontWeight={700}>
            {detail.job.title}
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            {detail.job.customerName} • {detail.job.address}
          </Typography>
        </Box>
        <Button startIcon={<PictureAsPdfIcon />} variant='contained' onClick={() => void generatePdf()}>
          Generate Report
        </Button>
      </Stack>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 5 }}>
          <Card sx={{ border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Stack spacing={1.5}>
                <Typography variant='h6' fontWeight={700}>
                  Job Details
                </Typography>
                <Divider />
                <TextField
                  variant='outlined'
                  label='Job Title'
                  defaultValue={detail.job.title}
                  onBlur={e => void updateJob({ title: e.target.value })}
                />
                <TextField
                  variant='outlined'
                  label='Customer Name'
                  defaultValue={detail.job.customerName}
                  onBlur={e => void updateJob({ customerName: e.target.value })}
                />
                <TextField
                  variant='outlined'
                  label='Address'
                  defaultValue={detail.job.address}
                  onBlur={e => void updateJob({ address: e.target.value })}
                />
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
                  label='Description'
                  multiline
                  minRows={3}
                  defaultValue={detail.job.description}
                  onBlur={e => void updateJob({ description: e.target.value })}
                />
                <TextField
                  variant='outlined'
                  label='Job Notes'
                  multiline
                  minRows={4}
                  defaultValue={detail.job.notes}
                  onBlur={e => void updateJob({ notes: e.target.value })}
                />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 7 }}>
          <Stack spacing={1.5}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              justifyContent='space-between'
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              gap={1}
            >
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
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
                      <Box
                        component='img'
                        src={photo.fileReference}
                        alt='job'
                        sx={{
                          width: { xs: '100%', md: 220 },
                          maxHeight: { xs: 180, md: 160 },
                          borderRadius: 1,
                          objectFit: 'cover',
                          flexShrink: 0,
                        }}
                      />
                      <Stack spacing={1} sx={{ flex: 1 }}>
                        <Typography variant='caption' color='text.secondary'>
                          Uploaded {new Date(photo.uploadedAt).toLocaleString()}
                        </Typography>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
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
                            sx={{ minWidth: { xs: '100%', sm: 150 } }}
                          >
                            {tags.map(tag => (
                              <MenuItem key={tag} value={tag}>
                                {tag}
                              </MenuItem>
                            ))}
                          </TextField>
                        </Stack>
                        <Stack direction='row' spacing={0.5}>
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
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          </Stack>
        </Grid>
      </Grid>
      {sortedPhotos.length === 0 ? (
        <Card sx={{ border: '1px dashed', borderColor: 'divider' }}>
          <CardContent>
            <Typography color='text.secondary'>
              No photos yet. Upload before/during/after shots to build your report.
            </Typography>
          </CardContent>
        </Card>
      ) : null}
    </Stack>
  )
}
