import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  Alert,
  Button,
  Card,
  CardContent,
  Divider,
  FormControlLabel,
  Grid,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material'

import type { JobDetailResponse } from '@/features/jobs/types'
import { apiRequest } from '@/lib/api'
import { buildReportPdf, defaultReportOptions, defaultReportText, type ReportGeneratorOptions, type ReportStylePreset } from '../report-generator'

interface ReportItem {
  id: string
  generatedAt: string
  fileReference: string
  fileName?: string
}

const styleOptions: ReportStylePreset[] = ['Modern Blue', 'Minimal Gray', 'Bold Dark']

const presetStoragePrefix = 'jobsnap:report-preset:'

function customerToKey(customerName: string) {
  return `${presetStoragePrefix}${customerName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
}

function isBlobUrl(value: string) {
  return value.startsWith('blob:')
}

function hydrateOptions(savedValue: string | null, fallbackLocale: string): ReportGeneratorOptions {
  if (!savedValue) return defaultReportOptions(fallbackLocale)

  try {
    const parsed = JSON.parse(savedValue) as Partial<ReportGeneratorOptions>
    const locale = typeof parsed.locale === 'string' ? parsed.locale : fallbackLocale
    const defaults = defaultReportOptions(locale)

    return {
      ...defaults,
      ...parsed,
      text: {
        ...defaults.text,
        ...(parsed.text ?? {}),
      },
    }
  } catch {
    return defaultReportOptions(fallbackLocale)
  }
}

export default function ReportPage() {
  const { jobId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [error, setError] = useState('')
  const [isRendering, setIsRendering] = useState(false)
  const [jobDetail, setJobDetail] = useState<JobDetailResponse | null>(null)
  const [report, setReport] = useState<ReportItem | null>(
    location.state?.objectUrl
      ? {
          id: 'latest',
          generatedAt: location.state.generatedAt,
          fileReference: location.state.objectUrl,
          fileName: location.state.fileName,
        }
      : null
  )
  const [options, setOptions] = useState<ReportGeneratorOptions>(() => defaultReportOptions(navigator.language))

  const latestBlobUrlRef = useRef<string | null>(location.state?.objectUrl ?? null)
  const loadedPresetKeyRef = useRef<string | null>(null)

  useEffect(() => {
    if (!jobId) return
    void apiRequest<JobDetailResponse>(`/jobs/${jobId}`)
      .then(setJobDetail)
      .catch((err: Error) => setError(err.message))
  }, [jobId])

  useEffect(() => {
    if (report || !jobId) return
    void apiRequest<{ items: ReportItem[] }>(`/jobs/${jobId}/reports`)
      .then(response => {
        if (response.items[0]) setReport(response.items[0])
      })
      .catch((err: Error) => setError(err.message))
  }, [jobId, report])

  const sortedPhotos = useMemo(() => [...(jobDetail?.photos ?? [])].sort((a, b) => a.orderIndex - b.orderIndex), [jobDetail?.photos])

  const presetKey = useMemo(() => {
    const customerName = jobDetail?.job.customerName?.trim()
    if (!customerName) return null
    return customerToKey(customerName)
  }, [jobDetail?.job.customerName])

  useEffect(() => {
    if (!presetKey || loadedPresetKeyRef.current === presetKey) return
    loadedPresetKeyRef.current = presetKey
    const saved = localStorage.getItem(presetKey)
    setOptions(hydrateOptions(saved, navigator.language))
  }, [presetKey])

  useEffect(() => {
    if (!presetKey) return
    const saveTimer = window.setTimeout(() => {
      localStorage.setItem(presetKey, JSON.stringify(options))
    }, 300)

    return () => window.clearTimeout(saveTimer)
  }, [options, presetKey])

  useEffect(() => {
    if (!jobId || !jobDetail) return

    let cancelled = false
    const timer = window.setTimeout(() => {
      setIsRendering(true)
      void (async () => {
        try {
          const generated = await buildReportPdf(jobDetail, sortedPhotos, options)
          if (cancelled) {
            if (isBlobUrl(generated.objectUrl)) URL.revokeObjectURL(generated.objectUrl)
            return
          }

          const previous = latestBlobUrlRef.current
          if (previous && previous !== generated.objectUrl && isBlobUrl(previous)) {
            URL.revokeObjectURL(previous)
          }

          latestBlobUrlRef.current = generated.objectUrl
          setReport({
            id: `draft-${Date.now()}`,
            fileReference: generated.objectUrl,
            generatedAt: generated.generatedAt,
            fileName: generated.fileName,
          })
          setError('')
        } catch (err) {
          if (!cancelled) setError(err instanceof Error ? err.message : 'Could not regenerate report')
        } finally {
          if (!cancelled) setIsRendering(false)
        }
      })()
    }, 500)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [jobId, jobDetail, options, sortedPhotos])

  useEffect(() => {
    return () => {
      const current = latestBlobUrlRef.current
      if (current && isBlobUrl(current)) URL.revokeObjectURL(current)
    }
  }, [])

  const updateText = (key: keyof ReportGeneratorOptions['text'], value: string) => {
    setOptions(prev => ({ ...prev, text: { ...prev.text, [key]: value } }))
  }

  const resetLanguage = (locale: string) => {
    const text = defaultReportText(locale)
    setOptions(prev => ({ ...prev, locale, text }))
  }

  if (!report) {
    return <Typography>{error || (jobDetail ? 'Building live preview…' : 'No report available yet.')}</Typography>
  }

  const fallbackFileName = `jobsnap-report-${new Date(report.generatedAt).toISOString().slice(0, 10)}.pdf`
  const fileName = report.fileName || fallbackFileName

  return (
    <Stack spacing={2} sx={{ width: '100%', maxWidth: 1440, mx: 'auto' }}>
      <Typography variant='h5' fontWeight={700}>
        Generated Report Studio
      </Typography>
      {error ? <Alert severity='error'>{error}</Alert> : null}

      <Grid container spacing={2} alignItems='flex-start'>
        <Grid size={{ xs: 12, md: 5 }}>
          <Card variant='outlined'>
            <CardContent>
              <Stack spacing={2}>
                <Typography variant='h6'>Customize language, style, and output</Typography>
                <Typography variant='body2' color='text.secondary'>
                  Live preview updates automatically (debounced). Presets are saved per customer.
                </Typography>

                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
                  <TextField
                    select
                    label='Language preset'
                    value={options.locale}
                    onChange={e => resetLanguage(e.target.value)}
                    sx={{ minWidth: 180, flex: 1 }}
                  >
                    <MenuItem value='en-US'>English</MenuItem>
                    <MenuItem value='es-ES'>Español</MenuItem>
                    <MenuItem value='fr-FR'>Français</MenuItem>
                  </TextField>
                  <TextField
                    select
                    label='Report style'
                    value={options.stylePreset}
                    onChange={e => setOptions(prev => ({ ...prev, stylePreset: e.target.value as ReportStylePreset }))}
                    sx={{ minWidth: 180, flex: 1 }}
                  >
                    {styleOptions.map(style => (
                      <MenuItem key={style} value={style}>
                        {style}
                      </MenuItem>
                    ))}
                  </TextField>
                </Stack>

                <TextField
                  label='Cover image URL (optional)'
                  value={options.coverImageUrl ?? ''}
                  onChange={e => setOptions(prev => ({ ...prev, coverImageUrl: e.target.value }))}
                  fullWidth
                />

                <Divider />

                <Stack direction={{ xs: 'column', md: 'row' }} gap={0.5} flexWrap='wrap'>
                  <FormControlLabel
                    control={<Switch checked={options.includeCustomer} onChange={e => setOptions(prev => ({ ...prev, includeCustomer: e.target.checked }))} />}
                    label='Include customer'
                  />
                  <FormControlLabel
                    control={<Switch checked={options.includeAddress} onChange={e => setOptions(prev => ({ ...prev, includeAddress: e.target.checked }))} />}
                    label='Include address'
                  />
                  <FormControlLabel
                    control={<Switch checked={options.includeStatus} onChange={e => setOptions(prev => ({ ...prev, includeStatus: e.target.checked }))} />}
                    label='Include status'
                  />
                  <FormControlLabel
                    control={<Switch checked={options.includeWorkOrder} onChange={e => setOptions(prev => ({ ...prev, includeWorkOrder: e.target.checked }))} />}
                    label='Include work order'
                  />
                </Stack>

                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
                  <TextField label='Report title' value={options.text.title} onChange={e => updateText('title', e.target.value)} fullWidth />
                  <TextField label='Photo section title' value={options.text.photoSectionPrefix} onChange={e => updateText('photoSectionPrefix', e.target.value)} fullWidth />
                </Stack>

                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
                  <TextField label='Generated label' value={options.text.generatedLabel} onChange={e => updateText('generatedLabel', e.target.value)} fullWidth />
                  <TextField label='Page label' value={options.text.pageLabel} onChange={e => updateText('pageLabel', e.target.value)} fullWidth />
                </Stack>

                <TextField label='Notes label' value={options.text.notesLabel} onChange={e => updateText('notesLabel', e.target.value)} fullWidth />

                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
                  <TextField
                    label='Summary closing text'
                    value={options.text.summaryClosing}
                    onChange={e => updateText('summaryClosing', e.target.value)}
                    multiline
                    minRows={2}
                    fullWidth
                  />
                  <TextField
                    label='Image fallback text'
                    value={options.text.imageFailureText}
                    onChange={e => updateText('imageFailureText', e.target.value)}
                    multiline
                    minRows={2}
                    fullWidth
                  />
                </Stack>

                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
                  <Button variant='outlined' onClick={() => setOptions(defaultReportOptions(options.locale))}>
                    Reset defaults
                  </Button>
                  <Typography variant='body2' color='text.secondary' sx={{ alignSelf: 'center' }}>
                    {isRendering ? 'Updating preview…' : 'Preview up to date'}
                  </Typography>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 7 }}>
          <Stack spacing={2}>
            <Card variant='outlined'>
              <CardContent>
                <Stack spacing={1}>
                  <Typography variant='body2'>Generated at: {new Date(report.generatedAt).toLocaleString()}</Typography>
                  <Typography variant='body2'>File: {fileName}</Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Preset profile: {jobDetail?.job.customerName || 'Unknown customer'}
                  </Typography>
                </Stack>
              </CardContent>
            </Card>

            <Card variant='outlined'>
              <CardContent sx={{ p: 1.5 }}>
                <iframe title='report-preview' src={report.fileReference} style={{ width: '100%', minHeight: 760, border: '1px solid #d0d7de', borderRadius: 8 }} />
              </CardContent>
            </Card>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
              <Button
                variant='contained'
                onClick={() => {
                  const link = document.createElement('a')
                  link.href = report.fileReference
                  link.download = fileName
                  link.click()
                }}
              >
                Download PDF
              </Button>
              <Button variant='outlined' onClick={() => navigate(`/jobs/${jobId}`)}>
                Back to Job
              </Button>
            </Stack>
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  )
}
