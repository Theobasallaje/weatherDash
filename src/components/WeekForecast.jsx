import { Box } from '@mui/material'
import 'chart.js/auto'
import { Chart } from 'react-chartjs-2'
import ChartDataLabels from 'chartjs-plugin-datalabels'

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

      if (!byDate[key]) {
        byDate[key] = {
          label: key,
          chance,
          inches,
        }
      } else {
        // take max chance, sum inches
        byDate[key].chance = Math.max(byDate[key].chance, chance)
        byDate[key].inches = Number(
          (Number(byDate[key].inches) + inches).toFixed(2)
        )
      }
    } catch (e) {
      // ignore bad dates
    }
  })

  const entries = Object.values(byDate).sort((a, b) =>
    a.label > b.label ? 1 : -1
  )

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

  const chanceData = entries.map((e) => Number(e.chance))
  const inchesData = entries.map((e) => Number(e.inches))

  // Color scales
  const getChanceColor = (value) => {
    if (value >= 80) return '#0d47a1'
    if (value >= 60) return '#1976d2'
    if (value >= 40) return '#42a5f5'
    if (value >= 20) return '#81d4fa'
    return '#d0f0ff'
  }

  const getRainColor = (value) => {
    if (value >= 2) return '#1b5e20'
    if (value >= 1) return '#2e7d32'
    if (value >= 0.5) return '#43a047'
    if (value >= 0.1) return '#81c784'
    return '#dcedc8'
  }

  const data = {
    labels,
    datasets: [
      {
        label: 'Precipitation Chance',
        data: chanceData,
        backgroundColor: chanceData.map(getChanceColor),
        borderRadius: 8,
        borderSkipped: false,
        yAxisID: 'y',
        categoryPercentage: 0.7,
        barPercentage: 0.9,
      },
      {
        label: 'Rainfall (in)',
        data: inchesData,
        backgroundColor: inchesData.map(getRainColor),
        borderRadius: 8,
        borderSkipped: false,
        yAxisID: 'y1',
        categoryPercentage: 0.7,
        barPercentage: 0.9,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,

    interaction: {
      mode: 'index',
      intersect: false,
    },

    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#fff',
          font: {
            weight: 'bold',
          },
        },
      },

      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: (ctx) => {
            if (ctx.dataset.yAxisID === 'y') {
              return ` ${ctx.raw}% chance`
            }
            return ` ${ctx.raw}" rainfall`
          },
        },
      },

      datalabels: {
        color: '#fff',
        anchor: 'end',
        align: 'start',
        offset: -2,
        clamp: true,

        font: {
          weight: 'bold',
          size: 12,
        },

        formatter: (value, ctx) => {
          if (ctx.dataset.yAxisID === 'y') {
            return `${value}%`
          }

          return `${value.toFixed(2)}"`
        },
      },
    },

    scales: {
      x: {
        ticks: {
          color: '#ddd',
          font: {
            weight: '600',
          },
        },

        grid: {
          display: false,
        },
      },

      y: {
        type: 'linear',
        display: true,
        position: 'left',

        min: 0,
        max: 100,

        ticks: {
          color: '#90caf9',
          callback: (v) => `${v}%`,
        },

        title: {
          display: true,
          text: 'Chance of Rain',
          color: '#90caf9',
          font: {
            weight: 'bold',
          },
        },

        grid: {
          color: 'rgba(255,255,255,0.08)',
        },
      },

      y1: {
        type: 'linear',
        display: true,
        position: 'right',

        beginAtZero: true,

        ticks: {
          color: '#a5d6a7',
          callback: (v) => `${v}"`,
        },

        title: {
          display: true,
          text: 'Rainfall Amount',
          color: '#a5d6a7',
          font: {
            weight: 'bold',
          },
        },

        grid: {
          drawOnChartArea: false,
        },
      },
    },
  }

  return (
    <Box sx={{ height: 340 }}>
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