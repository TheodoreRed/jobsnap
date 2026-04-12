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

    const escapePdfText = (value: string) => value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
    const wrapByChars = (value: string, maxChars = 92) => {
      const words = value.split(/\s+/).filter(Boolean)
      if (words.length === 0) return ['-']
      const result: string[] = []
      let current = words[0] ?? ''

      for (const word of words.slice(1)) {
        const candidate = `${current} ${word}`
        if (candidate.length <= maxChars) current = candidate
        else {
          result.push(current)
          current = word
        }
      }

      result.push(current)
      return result
    }

    const pageWidth = 595
    const pageHeight = 842
    const margin = 40
    const top = 760
    const bottom = 56
    const lineHeight = 15
    const linesPerPage = Math.floor((top - bottom - 70) / lineHeight)

    const reportLines: Array<{ text: string; size: 10 | 11 | 12; bold?: boolean; muted?: boolean; spacer?: boolean }> = [
      { text: `Generated ${new Date().toLocaleString()}`, size: 10, muted: true },
      { text: '', size: 10, spacer: true },
      { text: 'JOB DETAILS', size: 12, bold: true },
      { text: `Job Title: ${detail.job.title}`, size: 11 },
      { text: `Customer: ${detail.job.customerName}`, size: 11 },
      { text: `Address: ${detail.job.address}`, size: 11 },
      { text: `Work Order: ${detail.job.workOrderReference ?? '-'}`, size: 11 },
      { text: `Status: ${detail.job.status}`, size: 11 },
      { text: `Created: ${new Date(detail.job.createdAt).toLocaleString()}`, size: 11 },
      { text: `Notes: ${detail.job.notes ?? '-'}`, size: 11 },
      { text: '', size: 10, spacer: true },
      { text: `PHOTOS (${sortedPhotos.length})`, size: 12, bold: true },
    ]

    for (const [index, photo] of sortedPhotos.entries()) {
      reportLines.push({ text: '', size: 10, spacer: true })
      reportLines.push({ text: `#${index + 1} • ${photo.tag ?? 'Other'}`, size: 11, bold: true })
      reportLines.push({ text: `Uploaded: ${new Date(photo.uploadedAt).toLocaleString()}`, size: 10, muted: true })
      reportLines.push({ text: `Caption: ${photo.caption?.trim() ? photo.caption : '-'}`, size: 11 })
    }

    const expandedLines: typeof reportLines = []
    for (const line of reportLines) {
      if (line.spacer || line.text.length <= 92) {
        expandedLines.push(line)
      } else {
        for (const chunk of wrapByChars(line.text)) {
          expandedLines.push({ ...line, text: chunk })
        }
      }
    }

    const pages: typeof expandedLines[] = []
    for (let i = 0; i < expandedLines.length; i += linesPerPage) {
      pages.push(expandedLines.slice(i, i + linesPerPage))
    }

    const fontRegularObjectId = 3 + pages.length * 2
    const fontBoldObjectId = fontRegularObjectId + 1

    const objects: string[] = []
    objects.push('1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj')

    const kids = pages.map((_, index) => `${3 + index * 2} 0 R`).join(' ')
    objects.push(`2 0 obj<</Type/Pages/Count ${pages.length}/Kids[${kids}]>>endobj`)

    for (const [pageIndex, pageLines] of pages.entries()) {
      const pageObjectId = 3 + pageIndex * 2
      const contentObjectId = pageObjectId + 1

      const commands: string[] = []
      commands.push('q')
      commands.push('0.06 0.21 0.42 rg')
      commands.push(`${margin} ${top + 12} ${pageWidth - margin * 2} 50 re f`)
      commands.push('Q')

      commands.push('BT')
      commands.push(`/F2 20 Tf`)
      commands.push('1 1 1 rg')
      commands.push(`${margin + 16} ${top + 30} Td`)
      commands.push(`(${escapePdfText('Field Service Photo Report')}) Tj`)
      commands.push('ET')

      let y = top - 8
      for (const line of pageLines) {
        if (line.spacer) {
          y -= lineHeight * 0.7
          continue
        }

        commands.push('BT')
        commands.push(`${line.bold ? '/F2' : '/F1'} ${line.size} Tf`)
        commands.push(line.muted ? '0.38 0.40 0.43 rg' : '0.14 0.16 0.20 rg')
        commands.push(`${margin} ${y} Td`)
        commands.push(`(${escapePdfText(line.text)}) Tj`)
        commands.push('ET')
        y -= lineHeight
      }

      const stream = commands.join('\n')

      objects.push(
        `${pageObjectId} 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 ${pageWidth} ${pageHeight}]/Resources<</Font<</F1 ${fontRegularObjectId} 0 R/F2 ${fontBoldObjectId} 0 R>>>>/Contents ${contentObjectId} 0 R>>endobj`
      )
      objects.push(`${contentObjectId} 0 obj<</Length ${stream.length}>>stream\n${stream}\nendstream\nendobj`)
    }

    objects.push(`${fontRegularObjectId} 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj`)
    objects.push(`${fontBoldObjectId} 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica-Bold>>endobj`)

    let pdf = '%PDF-1.4\n'
    const offsets = [0]

    for (const object of objects) {
      offsets.push(pdf.length)
      pdf += `${object}\n`
    }

    const xrefStart = pdf.length
    pdf += `xref\n0 ${objects.length + 1}\n`
    pdf += '0000000000 65535 f \n'

    for (const offset of offsets.slice(1)) {
      pdf += `${String(offset).padStart(10, '0')} 00000 n \n`
    }

    pdf += `trailer<</Size ${objects.length + 1}/Root 1 0 R>>\nstartxref\n${xrefStart}\n%%EOF`

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
              label='Description'
              multiline
              minRows={2}
              defaultValue={detail.job.description}
              onBlur={e => void updateJob({ description: e.target.value })}
            />
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
                <Typography variant='caption' color='text.secondary'>
                  Uploaded {new Date(photo.uploadedAt).toLocaleString()}
                </Typography>
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
