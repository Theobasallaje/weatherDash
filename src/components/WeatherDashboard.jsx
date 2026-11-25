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
  const [freezeDays, setFreezeDays] = useState({})

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

  // Parses a grid validTime like "2026-11-25T05:00:00+00:00/PT10H"
  // into { start, end } epoch milliseconds.
  const parseValidTimeRange = (validTime) => {
    try {
      const [start, dur] = String(validTime).split('/')

      const startDate = new Date(start)

      if (isNaN(startDate.getTime())) {
        return null
      }

      let durationMs = 0

      if (dur) {
        const days = dur.match(/P(\d+)D/)
        const hours = dur.match(/T(\d+)H/)

        if (days) durationMs += Number(days[1]) * 86400000
        if (hours) durationMs += Number(hours[1]) * 3600000
      }

      return {
        start: startDate.getTime(),
        end: startDate.getTime() + durationMs,
      }
    } catch {
      return null
    }
  }

  // Builds a map of local day key (YYYY-MM-DD) -> { level }
  // from the NWS grid hazards + min temperature data.
  //
  //   Freezing level codes:
  //     FZ  = Freeze
  //     FR  = Frost
  //     FZC = Hard freeze
  //
  //   Severity mapping (used for the snowflake color):
  //     warning  -> any FZ/FZC with significance "W"
  //     advisory -> FZ/FZC with significance "A"
  //     frost    -> FR only, or min temperature <= 0°C
  const buildFreezeDays = (hazardsData, minTempData) => {
    const freezeDays = {}

    const severityRank = { warning: 3, advisory: 2, frost: 1 }

    const bumpSeverity = (dayKey, level) => {
      const existing = freezeDays[dayKey]
      if (
        !existing ||
        severityRank[level] > severityRank[existing.level]
      ) {
        freezeDays[dayKey] = { level }
      }
    }

    const dayKeyFrom = (ts) => {
      const d = new Date(ts)
      return [
        d.getFullYear(),
        String(d.getMonth() + 1).padStart(2, '0'),
        String(d.getDate()).padStart(2, '0'),
      ].join('-')
    }

    const markDayRange = (validTime, level) => {
      const range = parseValidTimeRange(validTime)
      if (!range) return

      for (
        let t = range.start;
        t <= Math.min(range.end, range.start + 7 * 86400000);
        t += 86400000
      ) {
        bumpSeverity(dayKeyFrom(t), level)
      }
    }

    // Check hazards array for FZ (freeze) / FR (frost) events
    ;(hazardsData || []).forEach((hazard) => {
      const value = hazard.value
      if (!Array.isArray(value)) return

      value.forEach((event) => {
        const phenomenon = event.phenomenon
        const significance = (event.significance || '').toUpperCase()

        if (
          phenomenon === 'FZ' ||
          phenomenon === 'FZC' ||
          phenomenon === 'FR'
        ) {
          const level =
            significance === 'W'
              ? 'warning'
              : phenomenon === 'FR'
                ? 'frost'
                : 'advisory'

          markDayRange(hazard.validTime, level)
        }
      })
    })

    // Also check min temperature: if any min temp is <= 0°C (32°F), mark freeze
    const minTemps =
      minTempData && Array.isArray(minTempData.values)
        ? minTempData.values
        : minTempData || []

    ;(minTemps).forEach((v) => {
      if (v && v.value !== null && v.value <= 0) {
        // mark all days in this range as at least "frost"
        const range = parseValidTimeRange(v.validTime)
        if (!range) return
        for (
          let t = range.start;
          t <= Math.min(
            range.end,
            range.start + 7 * 86400000
          );
          t += 86400000
        ) {
          bumpSeverity(dayKeyFrom(t), 'frost')
        }
      }
    })

    return freezeDays
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

      // Freeze data from the same grid point:
      // explicit FZ/FR/FZC hazards plus min temperature.
      const hazardsData =
        gridForecast.properties.hazards?.values || []
      const minTemperatureData =
        gridForecast.properties.minTemperature || []

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
      setFreezeDays(
        buildFreezeDays(
          hazardsData,
          minTemperatureData
        )
      )

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
            freezeDays={freezeDays}
          />
        </Box>
      )}
    </Box>
  )
}

export default WeatherDashboard