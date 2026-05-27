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
        // max precip chance for day
        byDate[key].chance = Math.max(byDate[key].chance, chance)

        // sum rainfall totals
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

  const data = {
    labels,

    datasets: [
      {
        label: 'Rain Chance',

        data: chanceData,

        backgroundColor: chanceData.map(getChanceColor),

        borderColor: 'rgba(255,255,255,0.12)',
        borderWidth: 1.5,

        borderRadius: 12,
        borderSkipped: false,

        categoryPercentage: 0.72,
        barPercentage: 0.9,
      },

      // subtle rainfall overlay
      {
        label: 'Rainfall',

        data: chanceData.map((v, i) => {
          const rain = inchesData[i]

          if (rain >= 2) return 18
          if (rain >= 1) return 14
          if (rain >= 0.5) return 10
          if (rain >= 0.1) return 6

          return 0
        }),

        backgroundColor: 'rgba(255,255,255,0.18)',

        borderRadius: {
          topLeft: 12,
          topRight: 12,
          bottomLeft: 0,
          bottomRight: 0,
        },

        borderSkipped: false,

        categoryPercentage: 0.72,
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
        display: false,
      },

      tooltip: {
        backgroundColor: '#111827',
        borderColor: 'rgba(255,255,255,0.15)',
        borderWidth: 1,

        titleColor: '#fff',
        bodyColor: '#e5e7eb',

        callbacks: {
          label: (ctx) => {
            const idx = ctx.dataIndex

            return [
              `Chance: ${chanceData[idx]}%`,
              `Rainfall: ${inchesData[idx].toFixed(2)}"`,
            ]
          },
        },
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

        formatter: (value, ctx) => {
          // only label the primary bars
          if (ctx.datasetIndex !== 0) return null

          const rain = inchesData[ctx.dataIndex]

          return [`${value}%`, `${rain.toFixed(2)}"`]
        },

        anchor: 'center',
        align: 'center',
        textAlign: 'center',
      },
    },

    scales: {
      x: {
        stacked: true,

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
      },

      y: {
        stacked: true,

        min: 0,
        max: 100,

        ticks: {
          color: '#9ca3af',

          stepSize: 20,

          callback: (v) => `${v}%`,

          font: {
            weight: '600',
          },
        },

        title: {
          display: true,
          text: 'Chance of Rain',

          color: '#cbd5e1',

          font: {
            size: 14,
            weight: '700',
          },
        },

        grid: {
          color: 'rgba(255,255,255,0.08)',
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