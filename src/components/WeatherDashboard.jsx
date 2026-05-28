import { useState, useEffect, useMemo } from 'react'
import MapSelector from './MapSelector'
import {
  Box,
  CircularProgress,
  Alert,
  Typography,
  IconButton,
  Tooltip,
} from '@mui/material'

import RefreshIcon from '@mui/icons-material/Refresh'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'

import WeatherCard from './WeatherCard'
import HourlyBreakdown from './HourlyBreakdown'
import WeekForecast from './WeekForecast'

const DEFAULT_LATITUDE = import.meta.env.VITE_LATITUDE
const DEFAULT_LONGITUDE = import.meta.env.VITE_LONGITUDE

const WeatherDashboard = () => {
  const [weatherData, setWeatherData] = useState(null)
  const [hourlyData, setHourlyData] = useState(null)
  const [nextRainyDay, setNextRainyDay] = useState(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [lastRefresh, setLastRefresh] = useState(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const [precipitationThreshold] = useState(0)

  const [selectedCoords, setSelectedCoords] = useState([
    Number(DEFAULT_LATITUDE),
    Number(DEFAULT_LONGITUDE),
  ])

  const [hourlyExpanded, setHourlyExpanded] = useState(false)

  useEffect(() => {
    fetchWeatherData(selectedCoords)

    const interval = setInterval(() => {
      setIsRefreshing(true)
      fetchWeatherData(selectedCoords)
    }, 30 * 60 * 1000)

    return () => clearInterval(interval)
  }, [selectedCoords])

  const extractPrecipitationChance = (
    precipitationData,
    periodIndex
  ) => {
    if (
      !Array.isArray(precipitationData) ||
      precipitationData.length === 0
    ) {
      return 0
    }

    const value = precipitationData[periodIndex]

    if (value && value.value !== null) {
      return value.value
    }

    return 0
  }

  const extractRainInches = (
    rainAccumulationData,
    periodIndex
  ) => {
    if (
      !Array.isArray(rainAccumulationData) ||
      rainAccumulationData.length === 0
    ) {
      return 0
    }

    const value = rainAccumulationData[periodIndex]

    if (value && value.value !== null) {
      return (value.value / 25.4).toFixed(2)
    }

    return 0
  }

  const fetchWeatherData = async (coords) => {
    try {
      setError(null)

      const defaultCoords = [32.7767, -96.797]

      const validCoords =
        Array.isArray(coords) &&
        coords.length === 2 &&
        coords[0] != null &&
        coords[1] != null &&
        !isNaN(coords[0]) &&
        !isNaN(coords[1])
          ? coords
          : defaultCoords

      const [latitude, longitude] = validCoords

      const gridResponse = await fetch(
        `https://api.weather.gov/points/${latitude},${longitude}`
      )

      if (!gridResponse.ok) {
        throw new Error('Failed to fetch grid data')
      }

      const gridData = await gridResponse.json()

      const forecastUrl = gridData.properties.forecast
      const forecastHourlyUrl =
        gridData.properties.forecastHourly
      const forecastGridDataUrl =
        gridData.properties.forecastGridData

      const forecastResponse = await fetch(forecastUrl)

      if (!forecastResponse.ok) {
        throw new Error('Failed to fetch forecast')
      }

      const forecast = await forecastResponse.json()

      const forecastHourlyResponse = await fetch(
        forecastHourlyUrl
      )

      if (!forecastHourlyResponse.ok) {
        throw new Error('Failed to fetch hourly forecast')
      }

      const forecastHourly =
        await forecastHourlyResponse.json()

      const gridDataResponse = await fetch(
        forecastGridDataUrl
      )

      if (!gridDataResponse.ok) {
        throw new Error('Failed to fetch grid data')
      }

      const gridForecast = await gridDataResponse.json()

      const periods = forecast.properties.periods
      const hourlyPeriods =
        forecastHourly.properties.periods

      const precipitationData =
        gridForecast.properties
          .probabilityOfPrecipitation?.values || []

      const rainAccumulationData =
        gridForecast.properties
          .quantitativePrecipitation?.values || []

      const enrichedPeriods = periods.map(
        (period, index) => ({
          ...period,

          precipitationChance:
            extractPrecipitationChance(
              precipitationData,
              index
            ),

          rainInches: extractRainInches(
            rainAccumulationData,
            index
          ),
        })
      )

      const enrichedHourlyPeriods = hourlyPeriods.map(
        (period, index) => ({
          ...period,

          precipitationChance:
            extractPrecipitationChance(
              precipitationData,
              index
            ),

          rainInches: extractRainInches(
            rainAccumulationData,
            index
          ),
        })
      )

      setWeatherData(enrichedPeriods)
      setHourlyData(enrichedHourlyPeriods)

      const rainyPeriods = enrichedPeriods.filter(
        (period) => period.precipitationChance > 20
      )

      if (rainyPeriods.length > 0) {
        setNextRainyDay(rainyPeriods[0])
      }

      setLastRefresh(new Date())
    } catch (err) {
      console.error('Weather fetch error:', err)

      setError(err.message || 'Failed to fetch weather data')
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  const handleManualRefresh = async () => {
    setIsRefreshing(true)
    await fetchWeatherData(selectedCoords)
  }

  const filteredWeatherData = useMemo(() => {
    if (!weatherData) return null

    return weatherData.filter(
      (period) =>
        period.precipitationChance >=
        precipitationThreshold
    )
  }, [weatherData, precipitationThreshold])

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          gap: 2,
        }}
      >
        <CircularProgress
          size={60}
          sx={{ color: '#6b7280' }}
        />

        <Typography
          variant="h6"
          sx={{ color: '#6b7280' }}
        >
          Loading weather data...
        </Typography>
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>

        <Alert severity="info">
          Displaying weather data
        </Alert>
      </Box>
    )
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          width: '100%',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: 0.5,
          }}
        >
          {lastRefresh && (
            <Typography
              sx={{
                color: '#6b7280',
                fontSize: '0.9rem',
              }}
            >
              Updated:{' '}
              {lastRefresh.toLocaleTimeString()}
            </Typography>
          )}

          <Tooltip title="Refresh now">
            <IconButton
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              size="small"
              sx={{
                color: '#6b7280',

                '&:hover': {
                  backgroundColor:
                    'rgba(255,255,255,0.5)',
                },

                '&.Mui-disabled': {
                  color:
                    'rgba(107,114,128,0.5)',
                },
              }}
            >
              <RefreshIcon sx={{height: 32, width: 32}}/>
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {filteredWeatherData && (
        <Box>
          <WeekForecast
            periods={filteredWeatherData}
          />
        </Box>
      )}
    </Box>
  )
}

export default WeatherDashboard