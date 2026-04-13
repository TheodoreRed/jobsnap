import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { Button, Card, CardContent, FormControlLabel, Stack, Switch, TextField, Typography } from '@mui/material'

import type { JobDetailResponse } from '@/features/jobs/types'
import { apiRequest } from '@/lib/api'

interface ReportItem {
  id: string
  generatedAt: string
  fileReference: string
  fileName?: string
}

const REPORT_SETTINGS_STORAGE_KEY = 'jobsnap-report-settings'
const DEFAULT_REPORT_SETTINGS = {
  title: 'Field Service Photo Report',
  subtitle: 'Work completed summary',
  includeJobDetails: true,
  includePhotoNotes: true
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
          fileName: location.state.fileName
        }
      : null
  )
  const [reportSettings, setReportSettings] = useState(DEFAULT_REPORT_SETTINGS)

  useEffect(() => {
    if (report || !jobId) return
    void apiRequest<{ items: ReportItem[] }>(`/jobs/${jobId}/reports`)
      .then(response => {
        if (response.items[0]) setReport(response.items[0])
      })
      .catch((err: Error) => setError(err.message))
  }, [jobId, report])

  useEffect(() => {
    const raw = globalThis.localStorage?.getItem(REPORT_SETTINGS_STORAGE_KEY)
    if (!raw) return
    try {
      setReportSettings(settings => ({ ...settings, ...(JSON.parse(raw) as Partial<typeof DEFAULT_REPORT_SETTINGS>) }))
    } catch {
      setReportSettings(DEFAULT_REPORT_SETTINGS)
    }
  }, [])

  if (!report) return <Typography>No report available yet.</Typography>

  const fallbackFileName = `jobsnap-report-${new Date(report.generatedAt).toISOString().slice(0, 10)}.pdf`
  const fileName = report.fileName || fallbackFileName

  return (
    <Stack spacing={2} sx={{ width: '100%', maxWidth: 1440, mx: 'auto' }}>
      <Typography variant='h5' fontWeight={700}>
        Generated Report Studio
      </Typography>
      <Card variant='outlined'>
        <CardContent>
          <Stack spacing={1}>
            <Typography variant='body2'>Generated at: {new Date(report.generatedAt).toLocaleString()}</Typography>
            <Typography variant='body2'>File: {fileName}</Typography>
          </Stack>
        </CardContent>
      </Card>
      <Card variant='outlined'>
        <CardContent>
          <Stack spacing={1.5}>
            <Typography variant='h6'>Report Customization</Typography>
            <TextField
              label='Report Title'
              value={reportSettings.title}
              onChange={event => setReportSettings(settings => ({ ...settings, title: event.target.value }))}
            />
            <TextField
              label='Report Subtitle'
              value={reportSettings.subtitle}
              onChange={event => setReportSettings(settings => ({ ...settings, subtitle: event.target.value }))}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={reportSettings.includeJobDetails}
                  onChange={event =>
                    setReportSettings(settings => ({ ...settings, includeJobDetails: event.target.checked }))
                  }
                />
              }
              label='Include job details'
            />
            <FormControlLabel
              control={
                <Switch
                  checked={reportSettings.includePhotoNotes}
                  onChange={event =>
                    setReportSettings(settings => ({ ...settings, includePhotoNotes: event.target.checked }))
                  }
                />
              }
              label='Include photo notes'
            />
            <Button
              variant='outlined'
              onClick={() => {
                globalThis.localStorage?.setItem(REPORT_SETTINGS_STORAGE_KEY, JSON.stringify(reportSettings))
              }}
            >
              Save Report Settings
            </Button>
          </Stack>
        </CardContent>
      </Card>
      <iframe
        title='report-preview'
        src={report.fileReference}
        style={{ width: '100%', minHeight: 540, border: '1px solid #d0d7de', borderRadius: 8 }}
      />
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
  )
}
