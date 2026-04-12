import { Box, Typography } from '@mui/material'
import LanguagePicker from '../components/LanguagePicker'
import { useT } from '@/i18n/useT'

const SettingsPage = () => {
  const t = useT('settings')

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto' }}>
      <Typography variant='h5' fontWeight={700} sx={{ mb: 3 }}>
        {t('title')}
      </Typography>

      <LanguagePicker />
    </Box>
  )
}

export default SettingsPage
