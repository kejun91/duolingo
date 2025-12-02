import { Ranking } from '../App'
import DateRangeSelector from './DateRangeSelector'
import StatsGrid from './StatsGrid'
import RankingsTable from './RankingsTable'

interface RankingsTabProps {
  rankings: Ranking[]
  filters: {
    startDate: string
    endDate: string
    streakMin: number
  }
  onFiltersChange: (filters: { startDate: string; endDate: string; streakMin: number }) => void
  loading: boolean
}

export default function RankingsTab({ rankings, filters, onFiltersChange, loading }: RankingsTabProps) {
  const totalXpGained = rankings.reduce((sum, r) => sum + r.increase, 0)
  const avgXpGained = rankings.length > 0 ? Math.round(totalXpGained / rankings.length) : 0

  return (
    <div className="card">
      <h2 style={{ marginBottom: '20px', color: '#333' }}>🏆 Leaderboard</h2>

      <DateRangeSelector filters={filters} onFiltersChange={onFiltersChange} />

      <StatsGrid 
        activeUsers={rankings.length}
        totalXp={totalXpGained}
        avgXp={avgXpGained}
      />

      <RankingsTable rankings={rankings} loading={loading} />
    </div>
  )
}
