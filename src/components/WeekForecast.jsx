import { Box } from '@mui/material'
import 'chart.js/auto'

import { Chart } from 'react-chartjs-2'
import ChartDataLabels from 'chartjs-plugin-datalabels'

const WeekForecast = ({ periods }) => {
  if (!periods || periods.length === 0) return null

  const byDate = {}

  periods.forEach((p) => {
    try {
      const d = new Date(p.startTime)
      const key = d.toISOString().slice(0, 10)

      const chance = Number(p.precipitationChance || 0)
      const inches = Number(p.rainInches || 0)

      if (!byDate[key]) {
        byDate[key] = {
          label: key,
          chance,
          inches,
        }
      } else {
        byDate[key].chance = Math.max(byDate[key].chance, chance)

        byDate[key].inches = Number(
          (Number(byDate[key].inches) + inches).toFixed(2)
        )
      }
    } catch (e) {}
  })

  const entries = Object.values(byDate)
    .sort((a, b) => (a.label > b.label ? 1 : -1))
    .slice(0, 5)

  const labels = entries.map((e) => {
    const d = new Date(e.label)
    const today = new Date()

    if (d.toDateString() === today.toDateString()) return 'Today'

    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow'

    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  })

  // REAL values (for labels)
  const realInches = entries.map((e) => Number(e.inches))

  // DISPLAY values (for bar height)
  const inchesData = realInches.map((v) =>
    Math.sqrt(v) // 🔥 key change
  )

  const chanceData = entries.map((e) => Number(e.chance))

  const getChanceColor = (value) => {
    if (value >= 90) return '#ef4444'
    if (value >= 80) return '#ff6794'
    if (value >= 70) return '#fc7691'
    if (value >= 60) return '#ff92c7'
    if (value >= 50) return '#ff94e1'
    if (value >= 40) return '#f0a3ff'
    if (value >= 30) return '#bd94ff'
    if (value >= 20) return '#8aa2ff'
    if (value >= 0) return '#80befd'
    return '#f8fafc'
  }

  const maxRain = Math.max(...inchesData, 1)

  const data = {
    labels,
    datasets: [
      {
        label: 'Rainfall',
        data: inchesData,

        backgroundColor: chanceData.map(getChanceColor),

        borderColor: 'rgba(255,255,255,0.5)',
        borderWidth: 1.5,
        borderRadius: 14,
        borderSkipped: false,
        categoryPercentage: 0.72,
        barPercentage: 0.9,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    events: [],

    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },

      datalabels: {
        color: '#111827',
        textStrokeColor: 'rgba(255,255,255,0.7)',
        textStrokeWidth: 3,
        clamp: true,
        font: { weight: '800', size: 13 },

        // 🔥 show REAL rainfall, not scaled value
        formatter: (_, context) =>
          `${realInches[context.dataIndex].toFixed(2)}"`,

        anchor: 'center',
        align: 'center',
        textAlign: 'center',
      },
    },

    scales: {
      x: {
        ticks: {
          color: '#374151',
          padding: 10,
          font: { size: 13, weight: '700' },
        },
        grid: { display: false },
        border: { display: false },
      },

      y: {
        display: false,
        beginAtZero: true,
        suggestedMax: Math.max(maxRain * 1.2, 0.5),
        grid: { display: false },
        border: { display: false },
      },
    },
  }

  return (
    <Box sx={{ height: 320, width: '100%' }}>
      <Chart
        type="bar"
        data={data}
        options={options}
        plugins={[ChartDataLabels]}
      />
    </Box>
  )
}

export default WeekForecast