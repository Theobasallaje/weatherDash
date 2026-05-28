import { Box, Container } from '@mui/material'
import WeatherDashboard from './components/WeatherDashboard'

function App() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        backgroundColor: 'rgba(226, 226, 226, 0.08)',
        backgroundImage: 'none',
        bgcolor: 'rgba(226, 226, 226, 0.08)',
      }}
    >
      <Container
        maxWidth="lg"
        sx={{
          py: 4,
          minHeight: '100vh',
          backgroundColor: 'transparent',
        }}
      >
        <WeatherDashboard />
      </Container>
    </Box>
  )
}

export default App