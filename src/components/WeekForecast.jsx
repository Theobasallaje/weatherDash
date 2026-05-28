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

      const chance = Number(
        p.precipitationChance || 0
      )

      const inches = Number(p.rainInches || 0)

      if (!byDate[key]) {
        byDate[key] = {
          label: key,
          chance,
          inches,
        }
      } else {
        byDate[key].chance = Math.max(
          byDate[key].chance,
          chance
        )

        byDate[key].inches = Number(
          (
            Number(byDate[key].inches) + inches
          ).toFixed(2)
        )
      }
    } catch (e) {}
  })

  // SORT + LIMIT TO 5 DAYS
  const entries = Object.values(byDate)
    .sort((a, b) => (a.label > b.label ? 1 : -1))
    .slice(0, 5)

  const labels = entries.map((e) => {
    const d = new Date(e.label)

    const today = new Date()

    if (d.toDateString() === today.toDateString()) {
      return 'Today'
    }

    const tomorrow = new Date(today)

    tomorrow.setDate(tomorrow.getDate() + 1)

    if (
      d.toDateString() === tomorrow.toDateString()
    ) {
      return 'Tomorrow'
    }

    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  })

  const chanceData = entries.map((e) =>
    Number(e.chance)
  )

  const inchesData = entries.map((e) =>
    Number(e.inches)
  )

  const getChanceColor = (value) => {
    if (value >= 90) return '#ef4444'
    if (value >= 80) return '#f87171'
    if (value >= 70) return '#fb923c'
    if (value >= 60) return '#fbbf24'
    if (value >= 50) return '#fde68a'
    if (value >= 40) return '#cbd5e1'
    if (value >= 30) return '#dbeafe'
    if (value >= 20) return '#e0f2fe'
    if (value >= 10) return '#f1f5f9'

    return '#f8fafc'
  }

  const maxRain = Math.max(...inchesData, 1)

  const data = {
    labels,

    datasets: [
      {
        label: 'Rainfall',

        data: inchesData,

        backgroundColor:
          chanceData.map(getChanceColor),

        borderColor:
          'rgba(255,255,255,0.5)',

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
      legend: {
        display: false,
      },

      tooltip: {
        enabled: false,
      },

      datalabels: {
        color: '#111827',

        textStrokeColor:
          'rgba(255,255,255,0.7)',

        textStrokeWidth: 3,

        clamp: true,

        font: {
          weight: '800',
          size: 13,
        },

        formatter: (value) =>
          `${value.toFixed(2)}"`,

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

          font: {
            size: 13,
            weight: '700',
          },
        },

        grid: {
          display: false,
        },

        border: {
          display: false,
        },
      },

      y: {
        display: false,

        beginAtZero: true,

        suggestedMax: Math.max(
          maxRain * 1.25,
          1
        ),

        grid: {
          display: false,
        },

        border: {
          display: false,
        },
      },
    },
  }

  return (
    <Box
      sx={{
        height: 320,
        width: '100%',
      }}
    >
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