import { useMsal } from '@azure/msal-react'
import { Box, Button, Divider, Typography, Paper } from '@mui/material'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt'
import { apiScope } from './msal-config'

export function LoginPage() {
  const { instance } = useMsal()

  const handleLogin = () => {
    instance.loginRedirect({ scopes: [apiScope] })
  }

  const handleSignUp = () => {
    instance.loginRedirect({ scopes: [apiScope], prompt: 'create' })
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: theme =>
          theme.palette.mode === 'dark'
            ? 'radial-gradient(ellipse at 20% 50%, #1a1a2e 0%, #0a0a0f 70%)'
            : 'radial-gradient(ellipse at 80% 20%, #f0f4ff 0%, #e2e8f0 50%, #cbd5e1 100%)',
        p: 2
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: 420,
          borderRadius: 4,
          overflow: 'hidden',
          border: theme =>
            theme.palette.mode === 'dark' ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)',
          backdropFilter: 'blur(20px)',
          bgcolor: theme => (theme.palette.mode === 'dark' ? 'rgba(18, 18, 24, 0.85)' : 'rgba(255, 255, 255, 0.9)'),
          boxShadow: theme =>
            theme.palette.mode === 'dark'
              ? '0 24px 64px rgba(0,0,0,0.5), 0 1px 3px rgba(0,0,0,0.3)'
              : '0 24px 64px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04)'
        }}
      >
        {/* Top accent bar */}
        <Box
          sx={{
            height: 3,
            background: 'linear-gradient(90deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%)'
          }}
        />

        <Box sx={{ px: 5, pt: 5, pb: 4 }}>
          {/* Logo / Brand */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: 3,
                mx: 'auto',
                mb: 2.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: theme =>
                  theme.palette.mode === 'dark'
                    ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)'
                    : 'linear-gradient(135deg, #3b82f6, #6366f1)',
                boxShadow: '0 8px 24px rgba(59, 130, 246, 0.3)'
              }}
            >
              <Typography
                sx={{
                  fontSize: 24,
                  fontWeight: 800,
                  color: '#fff',
                  lineHeight: 1,
                  letterSpacing: '-0.02em'
                }}
              >
                A
              </Typography>
            </Box>

            <Typography
              variant='h5'
              sx={{
                fontWeight: 800,
                letterSpacing: '-0.03em',
                mb: 0.75
              }}
            >
              Welcome back
            </Typography>
            <Typography variant='body2' color='text.secondary' sx={{ fontSize: '0.9rem' }}>
              Sign in to your account to continue
            </Typography>
          </Box>

          {/* Actions */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Button
              fullWidth
              variant='contained'
              size='large'
              startIcon={<LockOutlinedIcon sx={{ fontSize: '18px !important' }} />}
              onClick={handleLogin}
              disableElevation
              sx={{
                py: 1.5,
                borderRadius: 2.5,
                textTransform: 'none',
                fontSize: '0.95rem',
                fontWeight: 600,
                letterSpacing: '-0.01em',
                background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                transition: 'all 0.2s ease',
                '&:hover': {
                  background: 'linear-gradient(135deg, #2563eb, #4f46e5)',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 6px 20px rgba(59, 130, 246, 0.35)'
                },
                '&:active': {
                  transform: 'translateY(0)'
                }
              }}
            >
              Sign In
            </Button>

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                my: 0.5
              }}
            >
              <Divider sx={{ flex: 1 }} />
              <Typography
                variant='caption'
                color='text.secondary'
                sx={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}
              >
                or
              </Typography>
              <Divider sx={{ flex: 1 }} />
            </Box>

            <Button
              fullWidth
              variant='outlined'
              size='large'
              startIcon={<PersonAddAltIcon sx={{ fontSize: '18px !important' }} />}
              onClick={handleSignUp}
              sx={{
                py: 1.5,
                borderRadius: 2.5,
                textTransform: 'none',
                fontSize: '0.95rem',
                fontWeight: 600,
                letterSpacing: '-0.01em',
                borderColor: theme => (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'),
                color: 'text.primary',
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: theme =>
                    theme.palette.mode === 'dark' ? 'rgba(59, 130, 246, 0.08)' : 'rgba(59, 130, 246, 0.04)',
                  transform: 'translateY(-1px)'
                },
                '&:active': {
                  transform: 'translateY(0)'
                }
              }}
            >
              Create Account
            </Button>
          </Box>
        </Box>

        {/* Footer */}
        <Box
          sx={{
            px: 5,
            py: 2,
            textAlign: 'center',
            borderTop: theme =>
              theme.palette.mode === 'dark' ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(0,0,0,0.04)',
            bgcolor: theme => (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)')
          }}
        >
          <Typography variant='caption' color='text.secondary' sx={{ fontSize: '0.75rem' }}>
            Secured by Microsoft Entra
          </Typography>
        </Box>
      </Paper>
    </Box>
  )
}
