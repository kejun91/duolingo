import { Ranking } from '../App'
import './RankingsTable.css'

interface RankingsTableProps {
  rankings: Ranking[]
  loading: boolean
  onShowHistory: (userId: number) => void
}

export default function RankingsTable({ rankings, loading, onShowHistory }: RankingsTableProps) {
  const getRankEmoji = (index: number) => {
    if (index === 0) return '🥇'
    if (index === 1) return '🥈'
    if (index === 2) return '🥉'
    return `#${index + 1}`
  }

  const getXpBadgeClass = (increase: number) => {
    if (increase > 0) return 'xp-positive'
    if (increase < 0) return 'xp-negative'
    return 'xp-neutral'
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
        <span className="spinner" style={{ borderColor: '#1cb0f6', borderTopColor: 'rgba(28, 176, 246, 0.3)' }}></span>
        Loading rankings...
      </div>
    )
  }

  if (rankings.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
        No data available for the selected date range.
      </div>
    )
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="ranking-table">
        <thead>
          <tr>
            <th style={{ width: '60px' }}>Rank</th>
            <th>User</th>
            <th>Start XP</th>
            <th>End XP</th>
            <th>XP Gained</th>
            <th>Daily Average</th>
            <th>Streak</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rankings.map((ranking, index) => (
            <tr key={ranking.userId}>
              <td className={`rank ${index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : ''}`}>
                {getRankEmoji(index)}
              </td>
              <td>
                <div className="username">
                  {ranking.name || ranking.username || `User ${ranking.userId}`}
                  <a 
                    href={`https://www.duolingo.com/profile/${ranking.username || ranking.userId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="profile-link"
                    title="View Duolingo Profile"
                    style={{ marginLeft: '6px' }}
                  >
                    🔗
                  </a>
                  {ranking.usedEarlierDate && (
                    <span 
                      style={{ 
                        marginLeft: '6px', 
                        fontSize: '0.9em',
                        cursor: 'help'
                      }}
                      title={`No data on requested start date. Using earliest available date: ${ranking.actualStartDate}`}
                    >
                      ℹ️
                    </span>
                  )}
                </div>
                {ranking.name && ranking.username && (
                  <div style={{ fontSize: '0.85em', color: '#999' }}>@{ranking.username}</div>
                )}
              </td>
              <td>{ranking.startXp.toLocaleString()}</td>
              <td>{ranking.endXp.toLocaleString()}</td>
              <td>
                <span className={`xp-badge ${getXpBadgeClass(ranking.increase)}`}>
                  {ranking.increase > 0 ? '+' : ''}{ranking.increase.toLocaleString()}
                </span>
              </td>
              <td>{ranking.dailyAverage.toLocaleString()} XP/day</td>
              <td>🔥 {ranking.streak}</td>
              <td>
                <button className="btn btn-secondary" onClick={() => onShowHistory(ranking.userId)}>
                  📊 History
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
