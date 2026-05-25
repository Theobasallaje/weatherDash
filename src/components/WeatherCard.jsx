import { Card, CardContent, Box, Typography, LinearProgress } from '@mui/material'
import ThunderstormIcon from '@mui/icons-material/Thunderstorm'
import WaterDropIcon from '@mui/icons-material/WaterDrop'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import { useState, useEffect } from 'react'

const WeatherCard = ({ period }) => {
  const [precipChance, setPrecipChance] = useState(0)

  useEffect(() => {
    setPrecipChance(period.precipitationChance || 0)
  }, [period])

  const parseTime = (timeString) => {
    try {
      const date = new Date(timeString)
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
    } catch {
      return timeString
    }
  }

  const getDay = (timeString) => {
    try {
      const date = new Date(timeString)
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      })
    } catch {
      return timeString
    }
  }

  const getRainColor = (chance) => {
    if (chance > 80) return '#d32f2f'
    if (chance > 60) return '#ff6b6b'
    if (chance > 40) return '#ff9800'
    return '#00bcd4'
  }

  return (
    <Card
      sx={{
        position: 'relative',
        overflow: 'hidden',
        mb: 3,
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: `linear-gradient(90deg, ${getRainColor(precipChance)}, transparent)`,
        },
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            gap: 3,
            alignItems: 'start',
          }}
        >
          {/* Left Section */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <ThunderstormIcon sx={{ fontSize: 28, color: '#00bcd4' }} />
              <Typography variant="h6" sx={{ color: '#b0bec5', fontWeight: 500 }}>
                {period.name}
              </Typography>
            </Box>

            <Typography
              variant="body1"
              sx={{
                color: '#ffffff',
                fontSize: '1.1rem',
                fontWeight: 600,
                mb: 2,
              }}
            >
              {getDay(period.startTime)}
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <AccessTimeIcon sx={{ color: '#00bcd4', fontSize: 20 }} />
              <Typography sx={{ color: '#b0bec5' }}>
                {parseTime(period.startTime)} - {parseTime(period.endTime)}
              </Typography>
            </Box>

            {period.shortForecast && (
              <Typography sx={{ color: '#b0bec5', fontSize: '0.95rem' }}>
                {period.shortForecast}
              </Typography>
            )}
          </Box>

          {/* Right Section - Precipitation */}
          <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 1,
                mb: 1,
              }}
            >
              <Typography
                variant="h3"
                sx={{
                  color: getRainColor(precipChance),
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                }}
              >
                {precipChance}%
              </Typography>
              <WaterDropIcon sx={{ color: getRainColor(precipChance), fontSize: 24 }} />
            </Box>

            <Typography sx={{ color: '#b0bec5', mb: 1.5, fontSize: '0.9rem' }}>
              Chance of rain
            </Typography>

            <LinearProgress
              variant="determinate"
              value={precipChance}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: 'rgba(0, 188, 212, 0.1)',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 4,
                  background: `linear-gradient(90deg, ${getRainColor(precipChance)}, ${getRainColor(precipChance * 0.8)})`,
                },
              }}
            />

            {/* Rain Inches */}
            <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(0, 188, 212, 0.1)' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Typography sx={{ color: '#00bcd4', fontSize: '0.9rem', fontWeight: 600 }}>
                  Rainfall Amount
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                <Typography sx={{ color: '#ffc107', fontSize: '1.5rem', fontWeight: 700 }}>
                  {period.rainInches}"
                </Typography>
                <Typography sx={{ color: '#b0bec5', fontSize: '0.85rem' }}>
                  inches
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}

export default WeatherCard
