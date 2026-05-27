import { useState, useEffect, useMemo } from 'react'
import MapSelector from './MapSelector'
import { Box, CircularProgress, Alert, Typography, IconButton, Tooltip, Slider } from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import WeatherCard from './WeatherCard'
import HourlyBreakdown from './HourlyBreakdown'
import WeekForecast from './WeekForecast'

const ZIP_CODE = 75189


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
    const [precipitationThreshold, setPrecipitationThreshold] = useState(50)
    const [selectedCoords, setSelectedCoords] = useState([
        Number(DEFAULT_LATITUDE),
        Number(DEFAULT_LONGITUDE),
    ])
    const [hourlyExpanded, setHourlyExpanded] = useState(false)

    useEffect(() => {
        fetchWeatherData(selectedCoords)

        // Set up automatic refresh every 30 minutes
        const interval = setInterval(() => {
            setIsRefreshing(true)
            fetchWeatherData(selectedCoords)
        }, 30 * 60 * 1000) // 30 minutes

        // Cleanup interval on unmount
        return () => clearInterval(interval)
    }, [selectedCoords])

    const extractPrecipitationChance = (precipitationData, periodIndex) => {
        if (!Array.isArray(precipitationData) || precipitationData.length === 0) {
            return 0
        }

        // Get the value for the corresponding time period
        const value = precipitationData[periodIndex]
        if (value && value.value !== null) {
            return value.value
        }

        return 0
    }

    const extractRainInches = (rainAccumulationData, periodIndex) => {
        if (!Array.isArray(rainAccumulationData) || rainAccumulationData.length === 0) {
            return 0
        }

        // Get the value for the corresponding time period
        const value = rainAccumulationData[periodIndex]
        if (value && value.value !== null) {
            // Convert from millimeters to inches (1 inch = 25.4mm)
            return (value.value / 25.4).toFixed(2)
        }

        return 0
    }

    const fetchWeatherData = async (coords) => {
        try {
            setError(null)

            // Default to Dallas, TX if coords are missing/invalid
            const defaultCoords = [32.7767, -96.7970]

            const validCoords =
                Array.isArray(coords) &&
                    coords.length === 2 &&
                    coords[0] != null &&
                    coords[1] != null &&
                    !isNaN(coords[0]) &&
                    !isNaN(coords[1])
                    ? coords
                    : defaultCoords

            // Get the grid data using coordinates
            const [latitude, longitude] = validCoords

            const gridResponse = await fetch(
                `https://api.weather.gov/points/${latitude},${longitude}`
            )

            if (!gridResponse.ok) {
                throw new Error('Failed to fetch grid data')
            }

            const gridData = await gridResponse.json()
            const forecastUrl = gridData.properties.forecast
            const forecastHourlyUrl = gridData.properties.forecastHourly
            const forecastGridDataUrl = gridData.properties.forecastGridData

            // Fetch forecast data
            const forecastResponse = await fetch(forecastUrl)

            if (!forecastResponse.ok) {
                throw new Error('Failed to fetch forecast')
            }

            const forecast = await forecastResponse.json()

            // Fetch hourly forecast data
            const forecastHourlyResponse = await fetch(forecastHourlyUrl)

            if (!forecastHourlyResponse.ok) {
                throw new Error('Failed to fetch hourly forecast')
            }

            const forecastHourly = await forecastHourlyResponse.json()

            // Fetch grid data for precipitation probability
            const gridDataResponse = await fetch(forecastGridDataUrl)

            if (!gridDataResponse.ok) {
                throw new Error('Failed to fetch grid data')
            }

            const gridForecast = await gridDataResponse.json()

            // Parse the forecast periods
            const periods = forecast.properties.periods
            const hourlyPeriods = forecastHourly.properties.periods

            const precipitationData =
                gridForecast.properties.probabilityOfPrecipitation?.values || []

            const rainAccumulationData =
                gridForecast.properties.quantitativePrecipitation?.values || []

            // Combine data for daily view
            const enrichedPeriods = periods.map((period, index) => ({
                ...period,
                precipitationChance: extractPrecipitationChance(
                    precipitationData,
                    index
                ),
                rainInches: extractRainInches(rainAccumulationData, index),
            }))

            // Combine data for hourly view
            const enrichedHourlyPeriods = hourlyPeriods.map((period, index) => ({
                ...period,
                precipitationChance: extractPrecipitationChance(
                    precipitationData,
                    index
                ),
                rainInches: extractRainInches(rainAccumulationData, index),
            }))

            setWeatherData(enrichedPeriods)
            setHourlyData(enrichedHourlyPeriods)

            // Find the next rainy day
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

    // Filter data based on precipitation threshold
    const filteredWeatherData = useMemo(() => {
        if (!weatherData) return null
        return weatherData.filter((period) => period.precipitationChance >= precipitationThreshold)
    }, [weatherData, precipitationThreshold])

    const filteredHourlyData = useMemo(() => {
        if (!hourlyData) return null
        return hourlyData.filter((period) => period.precipitationChance >= precipitationThreshold)
    }, [hourlyData, precipitationThreshold])

    const filteredNextRainyDay = useMemo(() => {
        if (!weatherData) return null
        const rainyPeriods = weatherData.filter(
            (period) => period.precipitationChance >= precipitationThreshold
        )
        return rainyPeriods.length > 0 ? rainyPeriods[0] : null
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
                <CircularProgress size={60} sx={{ color: '#00bcd4' }} />
                <Typography variant="h6" sx={{ color: '#b0bec5' }}>
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
                    Displaying weather for zip code {ZIP_CODE} (Royse City, TX area)
                </Alert>
            </Box>
        )
    }

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Header with Threshold and Refresh */}
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'center', sm: 'center' },
                    justifyContent: 'space-between',
                    gap: 2,
                    width: '100%',
                }}
            >
                {/* Threshold Slider */}
                <Box sx={{ flex: { xs: 1, sm: 1 }, minWidth: 0, width: { xs: '100%', sm: 'auto' } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: { xs: 'center', sm: 'flex-start' }, gap: 1, mb: 1 }}>
                        <Typography sx={{ color: '#b0bec5', fontSize: { xs: '0.85rem', sm: '0.9rem' } }}>
                            Threshold:
                        </Typography>
                        <Typography sx={{ color: '#00bcd4', fontWeight: 600, fontSize: { xs: '0.85rem', sm: '0.9rem' } }}>
                            {precipitationThreshold}%
                        </Typography>
                    </Box>
                    <Slider
                        value={precipitationThreshold}
                        onChange={(e, newValue) => setPrecipitationThreshold(newValue)}
                        min={0}
                        max={100}
                        step={5}
                        sx={{
                            color: '#00bcd4',
                            '& .MuiSlider-thumb': {
                                backgroundColor: '#00bcd4',
                                borderRadius: '50%',
                                boxShadow: '0 2px 8px rgba(0, 188, 212, 0.4)',
                                '&:hover': {
                                    boxShadow: '0 4px 12px rgba(0, 188, 212, 0.6)',
                                },
                            },
                            '& .MuiSlider-track': {
                                background: 'linear-gradient(90deg, #00bcd4, #4dd0e1)',
                                border: 'none',
                            },
                            '& .MuiSlider-rail': {
                                backgroundColor: 'rgba(0, 188, 212, 0.1)',
                            },
                        }}
                    />
                </Box>

                {/* Last Updated and Refresh Button */}
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: { xs: 'center', sm: 'flex-end' }, gap: 0.5 }}>
                    {lastRefresh && (
                        <Typography sx={{ color: '#b0bec5', fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                            Updated: {lastRefresh.toLocaleTimeString()}
                        </Typography>
                    )}
                    <Tooltip title="Refresh now (auto-refresh every 30 min)">
                        <IconButton
                            onClick={handleManualRefresh}
                            disabled={isRefreshing}
                            size="small"
                            sx={{
                                color: '#00bcd4',
                                '&:hover': {
                                    backgroundColor: 'rgba(0, 188, 212, 0.1)',
                                },
                                '&.Mui-disabled': {
                                    color: 'rgba(0, 188, 212, 0.5)',
                                },
                            }}
                        >
                            <RefreshIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            {/* {filteredNextRainyDay && (
                <Box>
                    <Typography
                        variant="h5"
                        sx={{
                            mb: 2,
                            color: '#00bcd4',
                            fontWeight: 600,
                            letterSpacing: '0.5px',
                        }}
                    >
                        📍 Next Rainy Day
                    </Typography>
                    <WeatherCard period={filteredNextRainyDay} />
                </Box>
            )} */}

            {filteredWeatherData && (
                <Box>
                    {/* <Typography
                        variant="h5"
                        sx={{
                            mb: 2,
                            color: '#00bcd4',
                            fontWeight: 600,
                            letterSpacing: '0.5px',
                        }}
                    >
                        📅 Week Forecast
                    </Typography> */}
                    <WeekForecast periods={filteredWeatherData} />
                </Box>
            )}

            {/* {filteredWeatherData && (
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Typography
                            variant="h5"
                            sx={{
                                flex: 1,
                                color: '#00bcd4',
                                fontWeight: 600,
                                letterSpacing: '0.5px',
                            }}
                        >
                            ⏰ Hourly Breakdown
                        </Typography>
                        <IconButton
                            onClick={() => setHourlyExpanded(!hourlyExpanded)}
                            sx={{
                                color: '#00bcd4',
                                transform: hourlyExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                                transition: 'transform 0.3s ease',
                            }}
                        >
                            <ExpandMoreIcon />
                        </IconButton>
                    </Box>
                    {hourlyExpanded && filteredHourlyData && <HourlyBreakdown periods={filteredHourlyData} />}
                </Box>
            )}

            {filteredWeatherData && (
                <Box sx={{ mt: 4 }}>
                    <Typography variant="subtitle1" sx={{ color: '#b0bec5', mb: 1 }}>
                        Search or place a pin to select a new location:
                    </Typography>
                    <MapSelector
                        position={selectedCoords}
                        setPosition={(coords) => {
                            setSelectedCoords(coords)
                            setLoading(true)
                            setTimeout(() => {
                                // fetch new weather for new coords
                                const fetchWeatherData = async () => {
                                    try {
                                        setError(null)
                                        // fetch using new coords
                                        const [latitude, longitude] = coords
                                        const gridResponse = await fetch(
                                            `https://api.weather.gov/points/${latitude},${longitude}`
                                        )
                                        if (!gridResponse.ok) throw new Error('Failed to fetch grid data')
                                        const gridData = await gridResponse.json()
                                        const forecastUrl = gridData.properties.forecast
                                        const forecastHourlyUrl = gridData.properties.forecastHourly
                                        const forecastGridDataUrl = gridData.properties.forecastGridData
                                        const [forecastRes, hourlyRes, gridRes] = await Promise.all([
                                            fetch(forecastUrl),
                                            fetch(forecastHourlyUrl),
                                            fetch(forecastGridDataUrl),
                                        ])
                                        if (!forecastRes.ok || !hourlyRes.ok || !gridRes.ok) throw new Error('Failed to fetch weather data')
                                        const [forecast, forecastHourly, gridForecast] = await Promise.all([
                                            forecastRes.json(),
                                            hourlyRes.json(),
                                            gridRes.json(),
                                        ])
                                        const periods = forecast.properties.periods
                                        const hourlyPeriods = forecastHourly.properties.periods
                                        const precipitationData = gridForecast.properties.probabilityOfPrecipitation?.values || []
                                        const rainAccumulationData = gridForecast.properties.quantitativePrecipitation?.values || []
                                        const enrichedPeriods = periods.map((period, index) => ({
                                            ...period,
                                            precipitationChance: extractPrecipitationChance(precipitationData, index),
                                            rainInches: extractRainInches(rainAccumulationData, index),
                                        }))
                                        const enrichedHourlyPeriods = hourlyPeriods.map((period, index) => ({
                                            ...period,
                                            precipitationChance: extractPrecipitationChance(precipitationData, index),
                                            rainInches: extractRainInches(rainAccumulationData, index),
                                        }))
                                        setWeatherData(enrichedPeriods)
                                        setHourlyData(enrichedHourlyPeriods)
                                        const rainyPeriods = enrichedPeriods.filter((period) => period.precipitationChance > 20)
                                        if (rainyPeriods.length > 0) setNextRainyDay(rainyPeriods[0])
                                        setLastRefresh(new Date())
                                    } catch (err) {
                                        setError(err.message || 'Failed to fetch weather data')
                                    } finally {
                                        setLoading(false)
                                        setIsRefreshing(false)
                                    }
                                }
                                fetchWeatherData()
                            }, 100)
                        }}
                    />
                    <Typography sx={{ color: '#b0bec5', fontSize: '0.8rem', mt: 1 }}>
                        Current: {selectedCoords[0].toFixed(5)}, {selectedCoords[1].toFixed(5)}
                    </Typography>
                </Box>
            )}

            {!filteredNextRainyDay && weatherData && (
                <Alert severity="info">
                    {precipitationThreshold > 0
                        ? `No periods with ${precipitationThreshold}%+ precipitation. Try lowering the threshold.`
                        : `No rain expected in the forecast for zip code ${ZIP_CODE}`}
                </Alert>
            )} */}
        </Box>
    )
}

export default WeatherDashboard
