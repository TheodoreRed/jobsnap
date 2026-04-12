import { Box, Card, CardContent, Divider, Stack, Typography } from '@mui/material'

const AboutPage = () => {
  return (
    <Box sx={{ maxWidth: 960, mx: 'auto' }}>
      <Typography variant='h4' fontWeight={800} sx={{ mb: 1 }}>
        About JobSnap
      </Typography>
      <Typography color='text.secondary' sx={{ mb: 4, maxWidth: 760 }}>
        JobSnap helps field teams document work clearly, keep projects moving, and deliver confidence to customers with organized,
        photo-backed job records.
      </Typography>

      <Stack spacing={2.5}>
        <Card variant='outlined'>
          <CardContent>
            <Typography variant='h6' fontWeight={700} sx={{ mb: 1 }}>
              Who this app is for
            </Typography>
            <Typography color='text.secondary'>
              JobSnap is built for contractors, service technicians, operations managers, and support teams who need a fast way to
              track job progress from first visit to final handoff.
            </Typography>
          </CardContent>
        </Card>

        <Card variant='outlined'>
          <CardContent>
            <Typography variant='h6' fontWeight={700} sx={{ mb: 1 }}>
              What JobSnap does
            </Typography>
            <Typography color='text.secondary' sx={{ mb: 2 }}>
              The app centralizes each job in one place so your team can update details, upload before-and-after photos, and generate
              clear reports without juggling spreadsheets, text threads, or disconnected tools.
            </Typography>
            <Divider sx={{ my: 1.5 }} />
            <Stack spacing={1}>
              <Typography color='text.secondary'>• Create and manage jobs with status tracking</Typography>
              <Typography color='text.secondary'>• Capture photo evidence in the right order with context</Typography>
              <Typography color='text.secondary'>• Produce polished reports for customers and internal review</Typography>
            </Stack>
          </CardContent>
        </Card>

        <Card variant='outlined'>
          <CardContent>
            <Typography variant='h6' fontWeight={700} sx={{ mb: 1 }}>
              The problem it solves
            </Typography>
            <Typography color='text.secondary'>
              JobSnap solves the visibility gap between field work and customer expectations by making progress easy to see,
              verification easy to share, and project communication easy to trust.
            </Typography>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  )
}

export default AboutPage
