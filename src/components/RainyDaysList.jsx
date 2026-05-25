import { Box, Grid, Card, CardContent, Typography, Chip } from '@mui/material'
import WaterDropIcon from '@mui/icons-material/WaterDrop'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import { useMemo } from 'react'

const RainyDaysList = ({ periods }) => {
  const rainyPeriods = useMemo(() => {
    return periods.filter((period) => period.precipitationChance > 20)
  }, [periods])

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
    return '#ffc107'
  }

  const getRainIcon = (chance) => {
    if (chance > 80) return '🌧️'
    if (chance > 60) return '🌧️'
    if (chance > 40) return '🌦️'
    return '🌤️'
  }

  if (rainyPeriods.length === 0) {
    return (
      <Box
        sx={{
          p: 3,
          textAlign: 'center',
          background: 'rgba(76, 175, 80, 0.08)',
          border: '1px solid rgba(76, 175, 80, 0.2)',
          borderRadius: 2,
        }}
      >
        <Typography sx={{ color: '#4caf50' }}>
          ✓ No rain expected in upcoming forecast
        </Typography>
      </Box>
    )
  }

  return (
    <Grid container spacing={2}>
      {rainyPeriods.map((period, index) => (
        <Grid item xs={12} sm={6} md={4} key={index}>
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
                background: `radial-gradient(circle at top right, ${getRainColor(period.precipitationChance)}15, transparent)`,
                pointerEvents: 'none',
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
              }}
            >
              {/* Header Row */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  mb: 1.5,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Typography sx={{ fontSize: '1.5rem' }}>
                    {getRainIcon(period.precipitationChance)}
                  </Typography>
                  <Box>
                    <Typography sx={{ color: '#b0bec5', fontSize: '0.75rem' }}>
                      {period.name}
                    </Typography>
                    <Typography
                      sx={{
                        color: '#ffffff',
                        fontWeight: 600,
                        fontSize: '0.9rem',
                      }}
                    >
                      {getDay(period.startTime)}
                    </Typography>
                  </Box>
                </Box>

                <Chip
                  icon={<WaterDropIcon />}
                  label={`${period.precipitationChance}%`}
                  sx={{
                    background: `${getRainColor(period.precipitationChance)}20`,
                    color: getRainColor(period.precipitationChance),
                    fontWeight: 600,
                    border: `1px solid ${getRainColor(period.precipitationChance)}40`,
                    '& .MuiChip-icon': {
                      color: 'inherit',
                    },
                  }}
                />
              </Box>

              {/* Time Row */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.75,
                  mb: 2,
                }}
              >
                <AccessTimeIcon
                  sx={{ fontSize: 16, color: '#00bcd4' }}
                />
                <Typography sx={{ color: '#b0bec5', fontSize: '0.85rem' }}>
                  {parseTime(period.startTime)} - {parseTime(period.endTime)}
                </Typography>
              </Box>

              {/* Rain Inches */}
              <Box sx={{ mb: 1.5, p: 1, backgroundColor: 'rgba(255, 193, 7, 0.1)', borderRadius: 1 }}>
                <Typography sx={{ color: '#ffc107', fontSize: '0.8rem', fontWeight: 600 }}>
                  {period.rainInches}" rainfall
                </Typography>
              </Box>

              {/* Forecast Text */}
              {period.shortForecast && (
                <Typography
                  sx={{
                    color: '#b0bec5',
                    fontSize: '0.85rem',
                    lineHeight: 1.4,
                    mb: 1,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {period.shortForecast}
                </Typography>
              )}

              {/* Precipitation Bar */}
              <Box
                sx={{
                  mt: 'auto',
                  pt: 1.5,
                  borderTop: '1px solid rgba(0, 188, 212, 0.1)',
                }}
              >
                <Box
                  sx={{
                    height: 6,
                    backgroundColor: 'rgba(0, 188, 212, 0.1)',
                    borderRadius: 3,
                    overflow: 'hidden',
                  }}
                >
                  <Box
                    sx={{
                      height: '100%',
                      width: `${period.precipitationChance}%`,
                      background: `linear-gradient(90deg, ${getRainColor(period.precipitationChance)}, ${getRainColor(period.precipitationChance * 0.7)})`,
                      borderRadius: 3,
                    }}
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  )
}

export default RainyDaysList
