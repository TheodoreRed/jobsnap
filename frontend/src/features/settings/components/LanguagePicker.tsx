import { Paper, Box, Typography, ToggleButtonGroup, ToggleButton, useMediaQuery, useTheme } from '@mui/material'
import TranslateIcon from '@mui/icons-material/Translate'
import type { Locale } from '@/lang'
import { useLocaleStore } from '@/i18n/useLocaleStore'

const LANGUAGES: { value: Locale; label: string; native: string }[] = [
  { value: 'en', label: 'English', native: 'English' },
  { value: 'es', label: 'Spanish', native: 'Español' },
  { value: 'fr', label: 'French', native: 'Français' }
]

const LanguagePicker = () => {
  const locale = useLocaleStore(s => s.locale)
  const setLocale = useLocaleStore(s => s.setLocale)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  return (
    <Paper variant='outlined' sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
        <TranslateIcon fontSize='small' color='primary' />
        <Typography variant='subtitle1' fontWeight={600}>
          Language
        </Typography>
      </Box>
      <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
        Choose your preferred display language.
      </Typography>

      <ToggleButtonGroup
        value={locale}
        exclusive
        orientation={isMobile ? 'vertical' : 'horizontal'}
        onChange={(_, value: Locale | null) => {
          if (value) setLocale(value)
        }}
        sx={{ display: 'flex', gap: 1 }}
      >
        {LANGUAGES.map(lang => (
          <ToggleButton
            key={lang.value}
            value={lang.value}
            sx={{
              flex: 1,
              py: 1.5,
              textTransform: 'none',
              flexDirection: 'column',
              gap: 0.25
            }}
          >
            <Typography variant='body2' fontWeight={600}>
              {lang.native}
            </Typography>
            <Typography variant='caption' sx={{ textTransform: 'none' }}>
              {lang.label}
            </Typography>
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Paper>
  )
}

export default LanguagePicker
