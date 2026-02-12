import { useMemo } from 'react'
import Highcharts from 'highcharts'
import Container from '@cloudscape-design/components/container'
import Header from '@cloudscape-design/components/header'
import CartesianChart from '@cloudscape-design/chart-components/cartesian-chart'
import { Ranking } from '../App'

interface RankingsChartProps {
  rankings: Ranking[]
  loading: boolean
}

export default function RankingsChart({ rankings, loading }: RankingsChartProps) {
  const chartData = useMemo(() => {
    const top10 = rankings.slice(0, 10)
    return {
      categories: top10.map(r => r.name || r.username || `User ${r.userId}`),
      data: top10.map(r => r.increase),
    }
  }, [rankings])

  if (loading || rankings.length === 0) return null

  return (
    <Container header={<Header variant="h2">Top XP Gainers</Header>}>
      <CartesianChart
        highcharts={Highcharts}
        ariaLabel="Top XP Gainers horizontal bar chart"
        chartHeight={Math.max(250, chartData.categories.length * 40)}
        inverted={true}
        series={[
          {
            type: 'column',
            name: 'XP Gained',
            data: chartData.data,
            color: '#58CC02',
          },
        ]}
        xAxis={{
          type: 'category',
          categories: chartData.categories,
        }}
        yAxis={{
          title: 'XP Gained',
          valueFormatter: (value) => value === null ? '' : Number(value).toLocaleString(),
        }}
        legend={{ enabled: false }}
      />
    </Container>
  )
}
