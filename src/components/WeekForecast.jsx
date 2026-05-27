import { Box } from '@mui/material'
import 'chart.js/auto'
import { Chart } from 'react-chartjs-2'
import ChartDataLabels from 'chartjs-plugin-datalabels'

const WeekForecast = ({ periods }) => {
  if (!periods || periods.length === 0) return null

  // Aggregate forecast by date
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
        // keep max chance only for coloring
        byDate[key].chance = Math.max(byDate[key].chance, chance)

        // rainfall accumulates
        byDate[key].inches = Number(
          (Number(byDate[key].inches) + inches).toFixed(2)
        )
      }
    } catch (e) {
      // ignore invalid dates
    }
  })

  const entries = Object.values(byDate).sort((a, b) =>
    a.label > b.label ? 1 : -1
  )

  const labels = entries.map((e) => {
    const d = new Date(e.label)

    const today = new Date()

    if (d.toDateString() === today.toDateString()) {
      return 'Today'
    }

    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (d.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow'
    }

    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  })

  const chanceData = entries.map((e) => Number(e.chance))
  const inchesData = entries.map((e) => Number(e.inches))

  // Dark blue -> purple -> red scale
  const getChanceColor = (value) => {
    if (value >= 90) return '#7f0000'
    if (value >= 80) return '#b71c1c'
    if (value >= 70) return '#c62828'
    if (value >= 60) return '#d84315'
    if (value >= 50) return '#6a1b9a'
    if (value >= 40) return '#4527a0'
    if (value >= 30) return '#283593'
    if (value >= 20) return '#1e3a8a'
    if (value >= 10) return '#162d5c'

    return '#0b1e3a'
  }

  const maxRain = Math.max(...inchesData, 1)

  const data = {
    labels,

    datasets: [
      {
        label: 'Rainfall',

        data: inchesData,

        // color reflects rain likelihood
        backgroundColor: chanceData.map(getChanceColor),

        borderColor: 'rgba(255,255,255,0.12)',
        borderWidth: 1.5,

        borderRadius: 12,
        borderSkipped: false,

        categoryPercentage: 0.72,
        barPercentage: 0.9,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,

    // disables hover interactions
    events: [],

    plugins: {
      legend: {
        display: false,
      },

      tooltip: {
        enabled: false,
      },

      datalabels: {
        color: '#f8fafc',

        textStrokeColor: 'rgba(0,0,0,0.45)',
        textStrokeWidth: 3,

        clamp: true,

        font: {
          weight: '800',
          size: 13,
        },

        // rainfall label only
        formatter: (value) => `${value.toFixed(2)}"`,

        // centered inside bar
        anchor: 'center',
        align: 'center',

        textAlign: 'center',
      },
    },

    scales: {
      x: {
        ticks: {
          color: '#f3f4f6',
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

        suggestedMax: Math.max(maxRain * 1.25, 1),

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