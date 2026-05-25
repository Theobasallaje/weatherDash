import { Box, Grid, Card, CardContent, Typography, LinearProgress } from '@mui/material'
import WaterDropIcon from '@mui/icons-material/WaterDrop'
import AccessTimeIcon from '@mui/icons-material/AccessTime'

const HourlyBreakdown = ({ periods }) => {
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
      const today = new Date()
      const isToday = date.toDateString() === today.toDateString()

      if (isToday) return 'Today'

      return date.toLocaleDateString('en-US', {
        weekday: 'short',
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
    if (chance > 20) return '#ffc107'
    return '#00bcd4'
  }

  const getRainIcon = (chance) => {
    if (chance > 80) return '🌧️'
    if (chance > 60) return '🌧️'
    if (chance > 40) return '🌦️'
    if (chance > 20) return '🌤️'
    return '☀️'
  }

  return (
    <Grid container spacing={2}>
      {periods.map((period, index) => {
        const precipChance = period.precipitationChance || 0

        return (
          <Grid item xs={12} sm={6} md={3} lg={2.4} key={index}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: '100%',
                  height: '100%',
                  background: `radial-gradient(circle at top right, ${getRainColor(precipChance)}15, transparent)`,
                  pointerEvents: 'none',
                },
                '&:hover': {
                  transform: 'translateY(-4px)',
                },
              }}
            >
              <CardContent
                sx={{
                  flexGrow: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  zIndex: 1,
                  p: 1.5,
                }}
              >
                {/* Day and Time */}
                <Box sx={{ mb: 1 }}>
                  <Typography sx={{ color: '#b0bec5', fontSize: '0.75rem', mb: 0.25 }}>
                    {getDay(period.startTime)}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <AccessTimeIcon sx={{ fontSize: 14, color: '#00bcd4' }} />
                    <Typography sx={{ color: '#ffffff', fontWeight: 600, fontSize: '0.85rem' }}>
                      {parseTime(period.startTime)}
                    </Typography>
                  </Box>
                </Box>

                {/* Rain Percentage and Inches */}
                <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
                  <Typography sx={{ fontSize: '1.5rem' }}>
                    {getRainIcon(precipChance)}
                  </Typography>
                  <Box>
                    <Typography
                      sx={{
                        color: getRainColor(precipChance),
                        fontWeight: 700,
                        fontSize: '1.1rem',
                        lineHeight: 1,
                      }}
                    >
                      {precipChance}%
                    </Typography>
                    <Typography sx={{ color: '#b0bec5', fontSize: '0.65rem', mb: 0.5 }}>
                      rain
                    </Typography>
                    <Typography sx={{ color: '#ffc107', fontSize: '0.7rem', fontWeight: 600 }}>
                      {period.rainInches}"
                    </Typography>
                  </Box>
                </Box>

                {/* Progress Bar */}
                <Box
                  sx={{
                    height: 4,
                    backgroundColor: 'rgba(0, 188, 212, 0.1)',
                    borderRadius: 2,
                    overflow: 'hidden',
                    mt: 'auto',
                  }}
                >
                  <Box
                    sx={{
                      height: '100%',
                      width: `${precipChance}%`,
                      background: `linear-gradient(90deg, ${getRainColor(precipChance)}, ${getRainColor(precipChance * 0.7)})`,
                      borderRadius: 2,
                      transition: 'width 0.3s ease',
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )
      })}
    </Grid>
  )
}

export default HourlyBreakdown
