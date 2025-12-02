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

  const exportToCSV = () => {
    if (rankings.length === 0) return

    // Create CSV header
    const headers = ['Rank', 'Username', 'Name', 'User ID', 'Start XP', 'End XP', 'XP Gained', 'Daily Average', 'Streak']
    
    // Create CSV rows
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

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => {
        // Escape quotes and wrap in quotes if contains comma
        const cellStr = String(cell)
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`
        }
        return cellStr
      }).join(','))
    ].join('\n')

    // Create download link
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
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, color: '#333' }}>🏆 Leaderboard</h2>
        <button 
          className="btn btn-secondary" 
          onClick={exportToCSV}
          disabled={loading || rankings.length === 0}
          style={{ padding: '10px 20px' }}
        >
          📥 Export to CSV
        </button>
      </div>

      <DateRangeSelector filters={filters} onFiltersChange={onFiltersChange} loading={loading} />

      <StatsGrid 
        activeUsers={rankings.length}
        totalXp={totalXpGained}
        avgXp={avgXpGained}
      />

      <RankingsTable rankings={rankings} loading={loading} />
    </div>
  )
}
