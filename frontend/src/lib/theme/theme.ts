import { createTheme } from '@mui/material/styles'

export const createAppTheme = (mode: 'light' | 'dark') =>
  createTheme({
    palette: {
      mode,
      primary: {
        main: '#3b6bf5',
        light: '#5a85ff',
        dark: '#2952d9',
        contrastText: '#ffffff'
      },
      background: {
        default: mode === 'dark' ? '#12131c' : '#f0f2fa',
        paper: mode === 'dark' ? '#1a1b27' : '#ffffff'
      },
      divider: mode === 'dark' ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)',
      text: {
        primary: mode === 'dark' ? '#e8eaf0' : '#111827',
        secondary: mode === 'dark' ? '#7c7f9a' : '#6b7280'
      }
    },
    typography: {
      fontFamily: '"DM Sans", "Sora", sans-serif',
      h6: {
        fontWeight: 600,
        letterSpacing: '-0.02em'
      },
      body1: {
        fontSize: '0.9375rem',
        lineHeight: 1.6
      },
      body2: {
        fontSize: '0.8125rem'
      },
      caption: {
        fontSize: '0.75rem',
        letterSpacing: '0.06em',
        textTransform: 'uppercase' as const,
        fontWeight: 600
      }
    },
    shape: {
      borderRadius: 12
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            scrollbarWidth: 'thin',
            '&::-webkit-scrollbar': { width: '6px' },
            '&::-webkit-scrollbar-thumb': {
              borderRadius: '3px'
            }
          }
        }
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: '10px'
          },
          containedPrimary: {
            background: 'linear-gradient(135deg, #3b6bf5 0%, #5a85ff 100%)',
            boxShadow: '0 4px 16px rgba(59,107,245,0.35)',
            '&:hover': {
              background: 'linear-gradient(135deg, #2952d9 0%, #3b6bf5 100%)',
              boxShadow: '0 6px 20px rgba(59,107,245,0.45)'
            }
          }
        }
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none'
          }
        }
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: '10px',
            '&.Mui-selected': {
              backgroundColor: 'rgba(59,107,245,0.15)',
              '&:hover': {
                backgroundColor: 'rgba(59,107,245,0.2)'
              }
            }
          }
        }
      },
      MuiSwitch: {
        styleOverrides: {
          root: {
            '& .MuiSwitch-switchBase.Mui-checked': {
              color: '#3b6bf5'
            },
            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
              backgroundColor: '#3b6bf5'
            }
          }
        }
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: '14px',
            '& fieldset': { border: 'none' },
            '&:hover fieldset': { border: 'none' },
            '&.Mui-focused fieldset': { border: '1.5px solid #3b6bf5' }
          }
        }
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            borderRadius: '10px'
          }
        }
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            fontSize: '0.75rem',
            borderRadius: '8px'
          }
        }
      }
    }
  })
