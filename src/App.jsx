import { Box, Container } from '@mui/material'
import WeatherDashboard from './components/WeatherDashboard'

function App() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a0e27 0%, #16213e 100%)',
        overflow: 'hidden',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'radial-gradient(circle at 20% 50%, rgba(0, 188, 212, 0.08) 0%, transparent 50%)',
          pointerEvents: 'none',
          zIndex: 0,
        },
      }}
    >
      <Container
        maxWidth="lg"
        sx={{
          position: 'relative',
          zIndex: 1,
          py: 4,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
        }}
      >
        <WeatherDashboard />
      </Container>
    </Box>
  )
}

export default App
