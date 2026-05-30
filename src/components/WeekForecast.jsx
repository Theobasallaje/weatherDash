import { Box } from '@mui/material'
import 'chart.js/auto'

import { Chart } from 'react-chartjs-2'
import ChartDataLabels from 'chartjs-plugin-datalabels'
import { useRef } from 'react'

const WeekForecast = ({ periods }) => {
  if (!periods || periods.length === 0) return null

  const byDate = {}

  periods.forEach((p) => {
    try {
      const d = new Date(p.startTime)

      // Use LOCAL date instead of UTC date
      const key = [
        d.getFullYear(),
        String(d.getMonth() + 1).padStart(2, '0'),
        String(d.getDate()).padStart(2, '0'),
      ].join('-')

      const chance = Number(p.precipitationChance || 0)
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

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const entries = Object.values(byDate)
    .filter((entry) => {
      const entryDate = new Date(entry.label)
      return entryDate >= yesterday
    })
    .sort((a, b) => (a.label > b.label ? 1 : -1))
    .slice(0, 5)

  const getRelativeLabel = (dateStr) => {
    const d = new Date(dateStr)

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    d.setHours(0, 0, 0, 0)

    if (d.getTime() === today.getTime()) return 'Today'
    if (d.getTime() === yesterday.getTime()) return 'Yesterday'
    if (d.getTime() === tomorrow.getTime()) return 'Tomorrow'

    return d.toLocaleDateString('en-US', {
      weekday: 'long',
    })
  }

  const labels = entries.map((e) =>
    getRelativeLabel(e.label)
  )

  const todayIndex = labels.findIndex(
    (label) => label === 'Today'
  )

  const realInches = entries.map((e) =>
    Number(e.inches)
  )

  // sqrt scaling makes tiny rainfall visible
  const inchesData = realInches.map((v) =>
    Math.sqrt(v)
  )

  const chanceData = entries.map((e) =>
    Number(e.chance)
  )

  const getChanceColor = (value) => {
    if (value >= 90) return '#3f2fd0'
    if (value >= 80) return '#6e53e3'
    if (value >= 70) return '#8376fc'
    if (value >= 60) return '#9692ff'
    if (value >= 50) return '#94c6ff'
    if (value >= 40) return '#96e6cd'
    if (value >= 30) return '#a5e491'
    if (value >= 20) return '#b4d282'
    if (value >= 0) return '#fde680'

    return '#f8fafc'
  }

  const maxRain = Math.max(...inchesData, 1)

  // Persist animation state between renders
  const underlineState = useRef({
    progress: 0,
  })

  const todayUnderlinePlugin = {
    id: 'todayUnderline',

    afterDraw(chart) {
      if (todayIndex < 0) return

      const {
        ctx,
        scales: { x },
        chartArea,
      } = chart

      const xPos = x.getPixelForTick(todayIndex)
      const yPos = chartArea.bottom + 48

      const start = xPos - 32
      const end = xPos + 32

      // Animate underline once
      if (underlineState.current.progress < 1) {
        underlineState.current.progress += 0.06

        underlineState.current.progress = Math.min(
          underlineState.current.progress,
          1
        )

        requestAnimationFrame(() =>
          chart.draw()
        )
      }

      const currentEnd =
        start +
        (end - start) *
          underlineState.current.progress

      ctx.save()

      // Light gray underline with subtle shadow
      ctx.strokeStyle = '#dcdcdc'
      ctx.lineWidth = 3
      ctx.lineCap = 'round'

      ctx.shadowColor = 'rgba(0, 0, 0, 0.15)'
      ctx.shadowBlur = 12
      ctx.shadowOffsetY = 2

      ctx.beginPath()
      ctx.moveTo(start, yPos)
      ctx.lineTo(currentEnd, yPos)
      ctx.stroke()

      ctx.restore()
    },
  }

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

    layout: {
      padding: {
        bottom: 20,
      },
    },

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
          size: 18,
        },

        formatter: (_, context) =>
          `${realInches[
            context.dataIndex
          ].toFixed(2)}"`,

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
            size: 16,
            weight: '500',
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
          maxRain * 1.2,
          0.5
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
        plugins={[
          ChartDataLabels,
          todayUnderlinePlugin,
        ]}
      />
    </Box>
  )
}

export default WeekForecast