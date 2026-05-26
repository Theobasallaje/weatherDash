import { Box } from '@mui/material'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js'
import { Chart } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend)

// periods: array of forecast periods (daily + hourly). We'll aggregate by date.
const WeekForecast = ({ periods }) => {
  if (!periods || periods.length === 0) return null

  // Aggregate by date (YYYY-MM-DD)
  const byDate = {}
  periods.forEach((p) => {
    try {
      const d = new Date(p.startTime)
      const key = d.toISOString().slice(0, 10)
      const chance = Number(p.precipitationChance || 0)
      const inches = Number(p.rainInches || 0)
      if (!byDate[key]) byDate[key] = { label: key, chance: chance, inches: inches }
      else {
        // take max chance, sum inches
        byDate[key].chance = Math.max(byDate[key].chance, chance)
        byDate[key].inches = Number((Number(byDate[key].inches) + inches).toFixed(2))
      }
    } catch (e) {
      // ignore
    }
  })

  const entries = Object.values(byDate).sort((a, b) => (a.label > b.label ? 1 : -1))
  const labels = entries.map((e) => {
    const d = new Date(e.label)
    const today = new Date()
    if (d.toDateString() === today.toDateString()) return 'Today'
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow'
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  })

  const chanceData = entries.map((e) => Number(e.chance))
  const inchesData = entries.map((e) => Number(e.inches))

  const data = {
    labels,
    datasets: [
      {
        type: 'bar',
        label: 'Precip %',
        data: chanceData,
        backgroundColor: '#00bcd4',
        yAxisID: 'y',
      },
      {
        type: 'line',
        label: 'Rain (in)',
        data: inchesData,
        borderColor: '#ffc107',
        backgroundColor: '#ffc107',
        yAxisID: 'y1',
        tension: 0.3,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      title: { display: false },
      tooltip: { mode: 'index', intersect: false },
    },
    scales: {
      x: { stacked: false },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        ticks: { callback: (v) => `${v}%` },
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        grid: { drawOnChartArea: false },
        ticks: { callback: (v) => `${v}\"` },
      },
    },
  }

  return (
    <Box sx={{ height: 320 }}>
      <Chart type="bar" data={data} options={options} />
    </Box>
  )
}

export default WeekForecast
