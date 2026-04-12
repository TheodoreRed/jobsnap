import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { Button, Card, CardContent, Stack, Typography } from '@mui/material'

import { apiRequest } from '@/lib/api'

interface ReportItem {
  id: string
  generatedAt: string
  fileReference: string
  fileName?: string
}

export default function ReportPage() {
  const { jobId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
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

  useEffect(() => {
    if (report || !jobId) return
    void apiRequest<{ items: ReportItem[] }>(`/jobs/${jobId}/reports`).then(response => {
      if (response.items[0]) setReport(response.items[0])
    })
  }, [jobId, report])

  if (!report) return <Typography>No report available yet.</Typography>

  const fallbackFileName = `jobsnap-report-${new Date(report.generatedAt).toISOString().slice(0, 10)}.pdf`
  const fileName = report.fileName || fallbackFileName

  return (
    <Stack spacing={2} sx={{ width: '100%', maxWidth: 760, mx: 'auto' }}>
      <Typography variant='h5' fontWeight={700}>
        Generated Report
      </Typography>
      <Card variant='outlined'>
        <CardContent>
          <Stack spacing={1}>
            <Typography variant='body2'>Generated at: {new Date(report.generatedAt).toLocaleString()}</Typography>
            <Typography variant='body2'>File: {fileName}</Typography>
          </Stack>
        </CardContent>
      </Card>
      <iframe title='report-preview' src={report.fileReference} style={{ width: '100%', minHeight: 540, border: '1px solid #d0d7de', borderRadius: 8 }} />
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
