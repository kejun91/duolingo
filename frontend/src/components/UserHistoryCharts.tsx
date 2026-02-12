import { useMemo } from 'react'
import Container from '@cloudscape-design/components/container'
import Header from '@cloudscape-design/components/header'
import Box from '@cloudscape-design/components/box'
import ColumnLayout from '@cloudscape-design/components/column-layout'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'

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

export default function UserHistoryCharts({ snapshots }: UserHistoryChartsProps) {
  const chartData = useMemo(() => {
    // Snapshots are newest-first, reverse for chronological charts
    const chronological = [...snapshots].reverse()

    return chronological.map((s, i) => {
      const prev = chronological[i - 1]
      const xpGained = prev ? (s.data.totalXp || 0) - (prev.data.totalXp || 0) : 0
      return {
        date: formatDateLabel(s.date),
        fullDate: s.date,
        totalXp: s.data.totalXp || 0,
        streak: s.data.streak || 0,
        xpGained,
      }
    })
  }, [snapshots])

  if (snapshots.length < 2) return null

  const avgDailyXp = Math.round(
    chartData.slice(1).reduce((sum, d) => sum + d.xpGained, 0) / (chartData.length - 1)
  )

  const tooltipStyle = {
    borderRadius: '12px',
    border: '1px solid #E5E5E5',
    fontFamily: 'Nunito, sans-serif',
    fontSize: '13px',
  }

  return (
    <ColumnLayout columns={1}>
      {/* XP Progression + Daily Gains side by side */}
      <Container header={<Header variant="h2">XP Progress</Header>}>
        <ColumnLayout columns={2}>
          {/* Total XP line chart */}
          <Box>
            <Box variant="h3" padding={{ bottom: 'xs' }}>Total XP Over Time</Box>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis
                  dataKey="date"
                  style={{ fontSize: 11 }}
                  interval="preserveStartEnd"
                  tick={{ fill: '#4B4B4B' }}
                />
                <YAxis
                  style={{ fontSize: 11 }}
                  tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
                  tick={{ fill: '#4B4B4B' }}
                />
                <Tooltip
                  formatter={(value: any) => [Number(value).toLocaleString() + ' XP', 'Total XP']}
                  labelFormatter={(label) => `Date: ${label}`}
                  contentStyle={tooltipStyle}
                />
                <Line
                  type="monotone"
                  dataKey="totalXp"
                  stroke="#58CC02"
                  strokeWidth={3}
                  dot={chartData.length <= 31}
                  activeDot={{ r: 6, fill: '#58CC02', stroke: '#fff', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>

          {/* Daily XP gained bar chart */}
          <Box>
            <Box variant="h3" padding={{ bottom: 'xs' }}>Daily XP Gained</Box>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData.slice(1)} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis
                  dataKey="date"
                  style={{ fontSize: 11 }}
                  interval="preserveStartEnd"
                  tick={{ fill: '#4B4B4B' }}
                />
                <YAxis
                  style={{ fontSize: 11 }}
                  tick={{ fill: '#4B4B4B' }}
                />
                <Tooltip
                  formatter={(value: any) => [Number(value).toLocaleString() + ' XP', 'XP Gained']}
                  labelFormatter={(label) => `Date: ${label}`}
                  contentStyle={tooltipStyle}
                />
                <ReferenceLine y={avgDailyXp} stroke="#1CB0F6" strokeDasharray="5 5" label={{ value: `Avg: ${avgDailyXp}`, fill: '#1CB0F6', fontSize: 11, position: 'right' }} />
                <Bar
                  dataKey="xpGained"
                  radius={[4, 4, 0, 0]}
                  fill="#58CC02"
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </ColumnLayout>
      </Container>

      {/* Streak chart */}
      <Container header={<Header variant="h2">Streak History</Header>}>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis
              dataKey="date"
              style={{ fontSize: 11 }}
              interval="preserveStartEnd"
              tick={{ fill: '#4B4B4B' }}
            />
            <YAxis
              style={{ fontSize: 11 }}
              tick={{ fill: '#4B4B4B' }}
            />
            <Tooltip
              formatter={(value: any) => [Number(value) + ' days', 'Streak']}
              labelFormatter={(label) => `Date: ${label}`}
              contentStyle={tooltipStyle}
            />
            <Line
              type="stepAfter"
              dataKey="streak"
              stroke="#FF9600"
              strokeWidth={3}
              dot={chartData.length <= 31}
              activeDot={{ r: 6, fill: '#FF9600', stroke: '#fff', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Container>
    </ColumnLayout>
  )
}

function formatDateLabel(dateStr: string): string {
  const parts = dateStr.split('-')
  if (parts.length === 3) {
    return `${parts[1]}/${parts[2]}`
  }
  return dateStr
}
