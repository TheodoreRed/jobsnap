import { Outlet, useNavigate } from 'react-router-dom'
import { AppBar, Box, Button, Toolbar, Typography } from '@mui/material'

const MainLayout = () => {
  const navigate = useNavigate()

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position='sticky'>
        <Toolbar sx={{ gap: 2 }}>
          <Typography sx={{ flex: 1, fontWeight: 700 }}>Field Service Photo Logger</Typography>
          <Button color='inherit' onClick={() => navigate('/')}>
            Jobs
          </Button>
          <Button color='inherit' variant='outlined' onClick={() => navigate('/jobs/new')}>
            New Job
          </Button>
        </Toolbar>
      </AppBar>

      <Box component='main' sx={{ p: { xs: 2, md: 3 }, maxWidth: 980, mx: 'auto' }}>
        <Outlet />
      </Box>
    </Box>
  )
}

export default MainLayout
