import { useMemo, useState } from 'react'
import Highcharts from 'highcharts'
import Container from '@cloudscape-design/components/container'
import Header from '@cloudscape-design/components/header'
import SegmentedControl from '@cloudscape-design/components/segmented-control'
import CartesianChart from '@cloudscape-design/chart-components/cartesian-chart'

interface Snapshot {
  date: string
  data: {
    totalXp?: number
    streak?: number
    [key: string]: any
  }
}

interface UserHistoryChartsProps {
  snapshots: Snapshot[]
}

type ChartView = 'daily-xp' | 'total-xp' | 'streak'

export default function UserHistoryCharts({ snapshots }: UserHistoryChartsProps) {
  const [selectedView, setSelectedView] = useState<ChartView>('daily-xp')

  const chartData = useMemo(() => {
    const chronological = [...snapshots].reverse()

    const dates: string[] = []
    const totalXpValues: number[] = []
    const xpGainedValues: number[] = []
    const streakValues: number[] = []

    chronological.forEach((s, i) => {
      const prev = chronological[i - 1]
      const xpGained = prev ? (s.data.totalXp || 0) - (prev.data.totalXp || 0) : 0

      dates.push(formatDateLabel(s.date))
      totalXpValues.push(s.data.totalXp || 0)
      xpGainedValues.push(xpGained)
      streakValues.push(s.data.streak || 0)
    })

    xpGainedValues[0] = 0

    const validXp = xpGainedValues.slice(1)
    const avgDailyXp = validXp.length > 0
      ? Math.round(validXp.reduce((sum, d) => sum + d, 0) / validXp.length)
      : 0

    return { dates, totalXpValues, xpGainedValues, streakValues, avgDailyXp }
  }, [snapshots])

  if (snapshots.length < 2) return null

  const chartConfigs: Record<ChartView, {
    ariaLabel: string
    series: Parameters<typeof CartesianChart>[0]['series']
    yAxis: Parameters<typeof CartesianChart>[0]['yAxis']
  }> = {
    'daily-xp': {
      ariaLabel: 'Daily XP gained over time',
      series: [
        { type: 'column', name: 'Daily XP', data: chartData.xpGainedValues, color: '#58CC02' },
        { type: 'y-threshold', name: `Avg: ${chartData.avgDailyXp}`, value: chartData.avgDailyXp, color: '#1CB0F6', dashStyle: 'Dash' },
      ],
      yAxis: { title: 'XP Gained', min: 0 },
    },
    'total-xp': {
      ariaLabel: 'Total XP progression over time',
      series: [
        { type: 'area', name: 'Total XP', data: chartData.totalXpValues, color: '#58CC02' },
      ],
      yAxis: {
        title: 'Total XP',
        valueFormatter: (v: number | null) => v === null ? '' : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v),
      },
    },
    'streak': {
      ariaLabel: 'Streak history over time',
      series: [
        { type: 'line', name: 'Streak', data: chartData.streakValues, color: '#FF9600' },
      ],
      yAxis: { title: 'Streak (days)', min: 0 },
    },
  }

  const config = chartConfigs[selectedView]

  return (
    <Container
      header={
        <Header
          variant="h2"
          actions={
            <SegmentedControl
              selectedId={selectedView}
              onChange={({ detail }) => setSelectedView(detail.selectedId as ChartView)}
              options={[
                { id: 'daily-xp', text: 'Daily XP' },
                { id: 'total-xp', text: 'Total XP' },
                { id: 'streak', text: 'Streak' },
              ]}
            />
          }
        >
          Activity
        </Header>
      }
    >
      <CartesianChart
        highcharts={Highcharts}
        ariaLabel={config.ariaLabel}
        chartHeight={320}
        series={config.series}
        xAxis={{
          type: 'category',
          title: 'Date',
          categories: chartData.dates,
        }}
        yAxis={config.yAxis}
        legend={{ enabled: config.series.length > 1 }}
      />
    </Container>
  )
}

function formatDateLabel(dateStr: string): string {
  const parts = dateStr.split('-')
  if (parts.length === 3) {
    return `${parts[1]}/${parts[2]}`
  }
  return dateStr
}
