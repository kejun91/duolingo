import { useMemo } from 'react'
import Container from '@cloudscape-design/components/container'
import Header from '@cloudscape-design/components/header'
import Box from '@cloudscape-design/components/box'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { Ranking } from '../App'

interface RankingsChartProps {
  rankings: Ranking[]
  loading: boolean
}

const COLORS = ['#58CC02', '#6EE018', '#78D929', '#89E04B', '#9AE66E', '#ABE88A', '#BCEEA6', '#CDF4C2', '#DDF8D8', '#EEF9EE']

export default function RankingsChart({ rankings, loading }: RankingsChartProps) {
  const chartData = useMemo(() => {
    return rankings
      .slice(0, 10)
      .map((r, i) => ({
        name: r.name || r.username || `User ${r.userId}`,
        xpGained: r.increase,
        rank: i + 1,
      }))
  }, [rankings])

  if (loading || rankings.length === 0) return null

  return (
    <Container header={<Header variant="h2">Top XP Gainers</Header>}>
      <Box padding={{ top: 's' }}>
        <ResponsiveContainer width="100%" height={Math.max(250, chartData.length * 40)}>
          <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} horizontal={false} />
            <XAxis
              type="number"
              tickFormatter={(val) => val.toLocaleString()}
              style={{ fontSize: 12 }}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={120}
              style={{ fontSize: 12 }}
              tickLine={false}
            />
            <Tooltip
              formatter={(value: any) => [Number(value).toLocaleString() + ' XP', 'XP Gained']}
              contentStyle={{
                borderRadius: '12px',
                border: '1px solid #E5E5E5',
                fontFamily: 'Nunito, sans-serif',
              }}
            />
            <Bar dataKey="xpGained" radius={[0, 8, 8, 0]} barSize={28}>
              {chartData.map((_entry, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Container>
  )
}
