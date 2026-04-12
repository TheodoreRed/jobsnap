import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Button,
  Divider,
  useMediaQuery,
  useTheme
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import CloseIcon from '@mui/icons-material/Close'
import HomeIcon from '@mui/icons-material/Home'
import DashboardIcon from '@mui/icons-material/Dashboard'
import SettingsIcon from '@mui/icons-material/Settings'
import LightModeIcon from '@mui/icons-material/LightMode'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import { useThemeStore } from '@/lib/theme/useThemeStore'
import { useT } from '@/i18n/useT'
import { AccountMenu } from '@/features/auth/AccountMenu'

const DRAWER_WIDTH = 280

interface NavItem {
  label: string
  path: string
  icon: React.ReactNode
}

const MainLayout = () => {
  const t = useT('mainLayout')

  const [drawerOpen, setDrawerOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const { mode, toggleMode } = useThemeStore()

  const NAV_ITEMS: NavItem[] = [
    { label: t('home'), path: '/', icon: <HomeIcon /> },
    { label: t('dashboard'), path: '/dashboard', icon: <DashboardIcon /> },
    { label: t('settings'), path: '/settings', icon: <SettingsIcon /> }
  ]

  const handleNavigate = (path: string) => {
    navigate(path)
    setDrawerOpen(false)
  }

  const isActive = (path: string) => location.pathname === path

  const drawerContent = (
    <Box sx={{ width: DRAWER_WIDTH, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Typography variant='h6' fontWeight={700}>
          {t('menu')}
        </Typography>
        <IconButton onClick={() => setDrawerOpen(false)}>
          <CloseIcon />
        </IconButton>
      </Toolbar>
      <Divider />
      <List sx={{ flex: 1, pt: 1 }}>
        {NAV_ITEMS.map(item => (
          <ListItemButton
            key={item.path}
            onClick={() => handleNavigate(item.path)}
            selected={isActive(item.path)}
            sx={{
              mx: 1,
              borderRadius: 1,
              mb: 0.5,
              '&.Mui-selected': {
                backgroundColor: 'action.selected'
              }
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position='sticky' color='default' elevation={1}>
        <Toolbar>
          {isMobile && (
            <IconButton edge='start' onClick={() => setDrawerOpen(true)} sx={{ mr: 1 }}>
              <MenuIcon />
            </IconButton>
          )}

          <Typography variant='h6' fontWeight={700} sx={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
            App Name
          </Typography>

          <Box sx={{ flex: 1 }} />

          {!isMobile && (
            <Box sx={{ display: 'flex', gap: 1, mr: 1 }}>
              {NAV_ITEMS.map(item => (
                <Button
                  key={item.path}
                  onClick={() => handleNavigate(item.path)}
                  color={isActive(item.path) ? 'primary' : 'inherit'}
                  sx={{
                    fontWeight: isActive(item.path) ? 700 : 400,
                    textTransform: 'none'
                  }}
                >
                  {item.label}
                </Button>
              ))}
            </Box>
          )}

          <IconButton onClick={toggleMode} color='inherit' sx={{ mr: 1 }}>
            {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>

          <AccountMenu />
        </Toolbar>
      </AppBar>

      <Drawer
        anchor='left'
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box'
          }
        }}
      >
        {drawerContent}
      </Drawer>

      <Box component='main' sx={{ flex: 1, p: 3 }}>
        <Outlet />
      </Box>
    </Box>
  )
}

export default MainLayout
