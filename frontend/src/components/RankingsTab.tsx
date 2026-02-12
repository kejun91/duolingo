import { Ranking } from '../App'
import DateRangeSelector from './DateRangeSelector'
import StatsGrid from './StatsGrid'
import RankingsChart from './RankingsChart'
import RankingsTable from './RankingsTable'
import SpaceBetween from '@cloudscape-design/components/space-between'
import Button from '@cloudscape-design/components/button'

interface RankingsTabProps {
  rankings: Ranking[]
  filters: {
    startDate: string
    endDate: string
    streakMin: number
  }
  onFiltersChange: (filters: { startDate: string; endDate: string; streakMin: number }) => void
  loading: boolean
  onShowHistory: (userId: number) => void
}

export default function RankingsTab({ rankings, filters, onFiltersChange, loading, onShowHistory }: RankingsTabProps) {
  const totalXpGained = rankings.reduce((sum, r) => sum + r.increase, 0)
  const avgXpGained = rankings.length > 0 ? Math.round(totalXpGained / rankings.length) : 0

  const exportToCSV = () => {
    if (rankings.length === 0) return

    const headers = ['Rank', 'Username', 'Name', 'User ID', 'Start XP', 'End XP', 'XP Gained', 'Daily Average', 'Streak']
    
    const rows = rankings.map((ranking, index) => [
      index + 1,
      ranking.username,
      ranking.name || '',
      ranking.userId,
      ranking.startXp,
      ranking.endXp,
      ranking.increase,
      ranking.dailyAverage,
      ranking.streak
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => {
        const cellStr = String(cell)
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`
        }
        return cellStr
      }).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', `duolingo-rankings-${filters.startDate}-to-${filters.endDate}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <SpaceBetween size="l">
      <DateRangeSelector filters={filters} onFiltersChange={onFiltersChange} loading={loading} />

      <StatsGrid 
        activeUsers={rankings.length}
        totalXp={totalXpGained}
        avgXp={avgXpGained}
      />

      <RankingsChart rankings={rankings} loading={loading} />

      <RankingsTable
        rankings={rankings}
        loading={loading}
        onShowHistory={onShowHistory}
        headerActions={
          <Button
            iconName="download"
            onClick={exportToCSV}
            disabled={loading || rankings.length === 0}
          >
            Export CSV
          </Button>
        }
      />
    </SpaceBetween>
  )
}
