import { Box, Typography } from '@mui/material'
import { keyframes } from '@mui/system'

const dotPulse = keyframes`
  0%, 80%, 100% { opacity: 0.15; }
  40% { opacity: 0.8; }
`

export function LoadingScreen() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
        background: theme =>
          theme.palette.mode === 'dark'
            ? 'radial-gradient(ellipse at 20% 50%, #1a1a2e 0%, #0a0a0f 70%)'
            : 'radial-gradient(ellipse at 80% 20%, #f0f4ff 0%, #e2e8f0 50%, #cbd5e1 100%)'
      }}
    >
      <Box
        sx={{
          width: 56,
          height: 56,
          borderRadius: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
          boxShadow: '0 8px 24px rgba(59, 130, 246, 0.3)'
        }}
      >
        <Typography
          sx={{
            fontSize: 20,
            fontWeight: 800,
            color: '#fff',
            lineHeight: 1,
            letterSpacing: '-0.02em'
          }}
        >
          TR
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', gap: 0.75 }}>
        {[0, 1, 2].map(i => (
          <Box
            key={i}
            sx={{
              width: 5,
              height: 5,
              borderRadius: '50%',
              bgcolor: 'primary.main',
              animation: `${dotPulse} 1.4s ease-in-out infinite`,
              animationDelay: `${i * 0.2}s`
            }}
          />
        ))}
      </Box>
    </Box>
  )
}
