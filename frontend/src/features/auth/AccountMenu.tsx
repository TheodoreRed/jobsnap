import { useState } from 'react'
import { Avatar, Box, Chip, Divider, IconButton, ListItemIcon, Menu, MenuItem, Typography } from '@mui/material'
import SettingsIcon from '@mui/icons-material/Settings'
import LogoutIcon from '@mui/icons-material/Logout'
import { useMsal } from '@azure/msal-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from './auth-store'

function getInitials(name: string | null): string {
  if (!name) return '?'
  return name
    .split(' ')
    .filter(Boolean)
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function AccountMenu() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)
  const { instance } = useMsal()
  const navigate = useNavigate()
  const { displayName, email, roles } = useAuthStore()

  const handleLogout = () => {
    setAnchorEl(null)
    instance.logoutRedirect({ postLogoutRedirectUri: globalThis.location.origin })
  }

  return (
    <>
      <IconButton
        onClick={e => setAnchorEl(e.currentTarget)}
        size='small'
        aria-controls={open ? 'account-menu' : undefined}
        aria-haspopup='true'
        aria-expanded={open ? 'true' : undefined}
      >
        <Avatar
          sx={{
            width: 36,
            height: 36,
            fontSize: 14,
            fontWeight: 700,
            bgcolor: 'primary.main',
            color: 'primary.contrastText'
          }}
        >
          {getInitials(displayName)}
        </Avatar>
      </IconButton>

      <Menu
        id='account-menu'
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        onClick={() => setAnchorEl(null)}
        slotProps={{
          paper: {
            elevation: 4,
            sx: {
              minWidth: 260,
              borderRadius: 2,
              mt: 1,
              overflow: 'visible',
              '&::before': {
                content: '""',
                display: 'block',
                position: 'absolute',
                top: 0,
                right: 16,
                width: 10,
                height: 10,
                bgcolor: 'background.paper',
                transform: 'translateY(-50%) rotate(45deg)',
                zIndex: 0
              }
            }
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant='subtitle1' fontWeight={700}>
            {displayName ?? 'User'}
          </Typography>
          {email && (
            <Typography variant='body2' color='text.secondary'>
              {email}
            </Typography>
          )}
        </Box>

        {roles.length > 0 && (
          <>
            <Divider />
            <Box sx={{ px: 2, py: 1 }}>
              <Typography variant='caption' color='text.secondary' fontWeight={600}>
                Roles
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                {roles.map(role => (
                  <Chip key={role} label={role} size='small' variant='outlined' sx={{ fontSize: 12 }} />
                ))}
              </Box>
            </Box>
          </>
        )}

        <Divider />

        <MenuItem
          onClick={() => {
            setAnchorEl(null)
            navigate('/settings')
          }}
        >
          <ListItemIcon>
            <SettingsIcon fontSize='small' />
          </ListItemIcon>
          Settings
        </MenuItem>

        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize='small' />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>
    </>
  )
}
