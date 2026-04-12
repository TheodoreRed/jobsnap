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

    const sanitizePdfText = (value: string) =>
      value
        .normalize('NFKD')
        .replace(/[^\x20-\x7E]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()

    const escapePdfText = (value: string) => sanitizePdfText(value).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')

    const wrapByChars = (value: string, maxChars = 92) => {
      const words = value.split(/\s+/).filter(Boolean)
      if (words.length === 0) return ['-']
      const lines: string[] = []
      let current = words[0] ?? ''

      for (const word of words.slice(1)) {
        const candidate = `${current} ${word}`
        if (candidate.length <= maxChars) current = candidate
        else {
          lines.push(current)
          current = word
        }
      }

      lines.push(current)
      return lines
    }

    const loadImage = async (src: string): Promise<HTMLImageElement> =>
      await new Promise((resolve, reject) => {
        const image = new Image()
        image.crossOrigin = 'anonymous'
        image.onload = () => resolve(image)
        image.onerror = () => reject(new Error('Failed to load photo for PDF rendering.'))
        image.src = src
      })

    const bytesToHex = (bytes: Uint8Array) => Array.from(bytes).map(byte => byte.toString(16).padStart(2, '0')).join('')

    const dataUrlToBytes = (dataUrl: string): Uint8Array => {
      const base64 = dataUrl.split(',')[1] ?? ''
      const binary = atob(base64)
      const bytes = new Uint8Array(binary.length)

      for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i)
      }

      return bytes
    }

    const preparePhoto = async (photo: Photo) => {
      try {
        const image = await loadImage(photo.fileReference)
        const maxDimension = 1500
        const scale = Math.min(1, maxDimension / Math.max(image.width, image.height))
        const width = Math.max(1, Math.floor(image.width * scale))
        const height = Math.max(1, Math.floor(image.height * scale))

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        const context = canvas.getContext('2d')
        if (!context) throw new Error('Canvas context unavailable.')

        context.fillStyle = '#ffffff'
        context.fillRect(0, 0, width, height)
        context.drawImage(image, 0, 0, width, height)

        const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.86)

        return {
          width,
          height,
          hexData: `${bytesToHex(dataUrlToBytes(jpegDataUrl))}>`,
          uploadedAt: photo.uploadedAt,
          tag: photo.tag ?? 'Other',
          caption: photo.caption?.trim() || '',
          failed: false,
        }
      } catch {
        return {
          width: 0,
          height: 0,
          hexData: '',
          uploadedAt: photo.uploadedAt,
          tag: photo.tag ?? 'Other',
          caption: photo.caption?.trim() || '',
          failed: true,
        }
      }
    }

    const preparedPhotos = await Promise.all(sortedPhotos.map(async (photo, index) => ({ ...(await preparePhoto(photo)), order: index + 1 })))

    const photoGroups: typeof preparedPhotos[] = []
    for (let i = 0; i < preparedPhotos.length; i += 2) {
      photoGroups.push(preparedPhotos.slice(i, i + 2))
    }

    const pageWidth = 595
    const pageHeight = 842
    const margin = 40
    const contentTop = pageHeight - 78

    const objects: string[] = ['1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj']
    const pageObjectIds: number[] = []
    const contentObjectIds: number[] = []
    const imageObjectIds: Array<number | null> = []

    let nextObjectId = 3

    pageObjectIds.push(nextObjectId)
    contentObjectIds.push(nextObjectId + 1)
    nextObjectId += 2

    for (const group of photoGroups) {
      pageObjectIds.push(nextObjectId)
      contentObjectIds.push(nextObjectId + 1)
      nextObjectId += 2
      for (const photo of group) {
        if (photo.failed) {
          imageObjectIds.push(null)
        } else {
          imageObjectIds.push(nextObjectId)
          nextObjectId += 1
        }
      }
    }

    const fontRegularObjectId = nextObjectId
    const fontBoldObjectId = nextObjectId + 1

    objects.push(`2 0 obj<</Type/Pages/Count ${pageObjectIds.length}/Kids[${pageObjectIds.map(id => `${id} 0 R`).join(' ')}]>>endobj`)

    const buildHeaderCommands = (title: string, subtitle?: string) => {
      const commands: string[] = [
        'q',
        '0.06 0.21 0.42 rg',
        `0 ${pageHeight - 64} ${pageWidth} 64 re f`,
        'Q',
        'BT',
        '/F2 17 Tf',
        '1 1 1 rg',
        `${margin} ${pageHeight - 40} Td`,
        `(${escapePdfText(title)}) Tj`,
        'ET',
      ]

      if (subtitle) {
        commands.push('BT', '/F1 10 Tf', '0.84 0.92 1 rg', `${margin} ${pageHeight - 56} Td`, `(${escapePdfText(subtitle)}) Tj`, 'ET')
      }

      return commands
    }

    const summaryLines = [
      `Generated ${new Date().toLocaleString()}`,
      '',
      `Job Title: ${detail.job.title}`,
      `Customer: ${detail.job.customerName}`,
      `Address: ${detail.job.address}`,
      `Status: ${detail.job.status}`,
      `Total Photos: ${sortedPhotos.length}`,
      '',
      'Photos are shown on the following pages in the same order as the job photo list.',
    ]

    const summaryCommands = buildHeaderCommands('Field Service Photo Report', `Work Order ${detail.job.workOrderReference ?? '-'}`)

    let summaryY = contentTop - 28
    for (const line of summaryLines) {
      if (!line) {
        summaryY -= 10
        continue
      }

      for (const chunk of wrapByChars(line, 96)) {
        summaryCommands.push('BT', '/F1 12 Tf', '0.13 0.14 0.16 rg', `${margin} ${summaryY} Td`, `(${escapePdfText(chunk)}) Tj`, 'ET')
        summaryY -= 18
      }
    }

    summaryCommands.push('BT', '/F1 9 Tf', '0.45 0.48 0.52 rg', `${margin} 24 Td`, `(${escapePdfText('Page 1')}) Tj`, 'ET')

    objects.push(
      `${pageObjectIds[0]} 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 ${pageWidth} ${pageHeight}]/Resources<</Font<</F1 ${fontRegularObjectId} 0 R/F2 ${fontBoldObjectId} 0 R>>>>/Contents ${contentObjectIds[0]} 0 R>>endobj`
    )
    const summaryStream = summaryCommands.join('\n')
    objects.push(`${contentObjectIds[0]} 0 obj<</Length ${summaryStream.length}>>stream\n${summaryStream}\nendstream\nendobj`)

    let imageObjectCursor = 0
    photoGroups.forEach((group, pageIndex) => {
      const pageObjId = pageObjectIds[pageIndex + 1]
      const contentObjId = contentObjectIds[pageIndex + 1]
      const commands: string[] = []
      const first = group[0]?.order ?? 1
      const last = group[group.length - 1]?.order ?? first

      commands.push(...buildHeaderCommands(`Photo Evidence ${first}-${last} of ${preparedPhotos.length}`))

      const cardGap = 18
      const availableHeight = pageHeight - 140
      const cardHeight = (availableHeight - cardGap * (group.length - 1)) / Math.max(group.length, 1)
      let currentTopY = pageHeight - 84
      const pageImageRefs: Array<{ objId: number; photo: (typeof preparedPhotos)[number] }> = []

      for (const photo of group) {
        const cardBottom = currentTopY - cardHeight
        const cardInnerX = margin + 10
        const cardInnerWidth = pageWidth - margin * 2 - 20
        const mediaTop = currentTopY - 44
        const mediaBottom = cardBottom + 54
        const mediaHeight = Math.max(60, mediaTop - mediaBottom)

        commands.push('q', '0.94 0.95 0.97 rg', `${margin} ${cardBottom} ${pageWidth - margin * 2} ${cardHeight} re f`, 'Q')

        commands.push('BT', '/F2 11 Tf', '0.12 0.14 0.18 rg', `${cardInnerX} ${currentTopY - 24} Td`, `(${escapePdfText(`Photo ${photo.order} • ${photo.tag}`)}) Tj`, 'ET')
        commands.push('BT', '/F1 9 Tf', '0.38 0.40 0.43 rg', `${cardInnerX} ${currentTopY - 36} Td`, `(${escapePdfText(`Uploaded ${new Date(photo.uploadedAt).toLocaleString()}`)}) Tj`, 'ET')

        if (!photo.failed) {
          const scale = Math.min(cardInnerWidth / photo.width, mediaHeight / photo.height)
          const drawWidth = photo.width * scale
          const drawHeight = photo.height * scale
          const drawX = cardInnerX + (cardInnerWidth - drawWidth) / 2
          const drawY = mediaBottom + (mediaHeight - drawHeight) / 2
          const imageObjId = imageObjectIds[imageObjectCursor]
          if (imageObjId) {
            pageImageRefs.push({ objId: imageObjId, photo })
            const imName = `/Im${pageImageRefs.length}`
            commands.push('q', `${drawWidth} 0 0 ${drawHeight} ${drawX} ${drawY} cm`, `${imName} Do`, 'Q')
          }
        } else {
          commands.push('BT', '/F1 10 Tf', '0.62 0.19 0.14 rg', `${cardInnerX} ${cardBottom + cardHeight / 2} Td`, `(${escapePdfText('Unable to render this image in PDF.')}) Tj`, 'ET')
        }

        let noteY = cardBottom + 28
        for (const chunk of wrapByChars(`Notes: ${photo.caption || 'No caption provided.'}`, 88).slice(0, 2)) {
          commands.push('BT', '/F1 9 Tf', '0.14 0.16 0.20 rg', `${cardInnerX} ${noteY} Td`, `(${escapePdfText(chunk)}) Tj`, 'ET')
          noteY -= 12
        }

        currentTopY = cardBottom - cardGap
        imageObjectCursor += 1
      }

      commands.push('BT', '/F1 9 Tf', '0.45 0.48 0.52 rg', `${margin} 24 Td`, `(${escapePdfText(`Page ${pageIndex + 2}`)}) Tj`, 'ET')

      const xObjects =
        pageImageRefs.length > 0 ? `/XObject<</${pageImageRefs.map((ref, idx) => `Im${idx + 1} ${ref.objId} 0 R`).join('/') }>>` : ''

      objects.push(
        `${pageObjId} 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 ${pageWidth} ${pageHeight}]/Resources<</Font<</F1 ${fontRegularObjectId} 0 R/F2 ${fontBoldObjectId} 0 R>>${xObjects}>>/Contents ${contentObjId} 0 R>>endobj`
      )

      const stream = commands.join('\n')
      objects.push(`${contentObjId} 0 obj<</Length ${stream.length}>>stream\n${stream}\nendstream\nendobj`)

      for (const ref of pageImageRefs) {
        objects.push(
          `${ref.objId} 0 obj<</Type/XObject/Subtype/Image/Width ${ref.photo.width}/Height ${ref.photo.height}/ColorSpace/DeviceRGB/BitsPerComponent 8/Filter[/ASCIIHexDecode/DCTDecode]/Length ${ref.photo.hexData.length}>>stream\n${ref.photo.hexData}\nendstream\nendobj`
        )
      }
    })

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

    const toSlug = (value: string) =>
      value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')

    const generatedAt = new Date()
    const dateLabel = generatedAt.toISOString().slice(0, 10)
    const customerSlug = toSlug(detail.job.customerName || 'customer')
    const fileName = `jobsnap-report-${customerSlug || 'customer'}-${dateLabel}.pdf`

    const blob = new Blob([pdf], { type: 'application/pdf' })
    const objectUrl = URL.createObjectURL(blob)

    await apiRequest(`/jobs/${jobId}/reports`, {
      method: 'POST',
      body: JSON.stringify({ fileReference: objectUrl }),
    })

    navigate(`/jobs/${jobId}/report`, {
      state: {
        objectUrl,
        generatedAt: generatedAt.toISOString(),
        fileName,
      },
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
